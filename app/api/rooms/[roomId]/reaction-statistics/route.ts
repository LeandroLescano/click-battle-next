import {getAuth} from "firebase-admin/auth";
import {getDatabase} from "firebase-admin/database";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {NextRequest, NextResponse} from "next/server";

import {customInitApp} from "lib/firebase-admin-config";

const MIN_ELIGIBLE_REACTION_MS = 100;
const DEFAULT_REACTION_WINDOW_MS = 1500;
const INVALID_KEY = /[.#$[\]/]/;

type RawRecord = Record<string, unknown>;

type DerivedReactionRound = {
  roundId: string;
  reactionWindowMs: number;
  winner: {
    playerKey: string;
    reactionMs: number;
    username: string;
  };
  validReactions: number;
  falseStarts: number;
  noReactions: number;
  clickInputs: number;
  keyInputs: number;
  tapInputs: number;
  startedAt?: Date;
};

const asRecord = (value: unknown): RawRecord | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RawRecord)
    : null;

const finiteNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const getReactionWindowMs = (room: RawRecord, round: RawRecord) => {
  const modeSettings = asRecord(room.modeSettings);
  const config = asRecord(modeSettings?.config);
  const windowMs =
    finiteNumber(round.windowMs) ??
    finiteNumber(config?.windowMs) ??
    DEFAULT_REACTION_WINDOW_MS;

  return Number.isInteger(windowMs) && windowMs >= MIN_ELIGIBLE_REACTION_MS
    ? windowMs
    : null;
};

const getRound = (room: RawRecord, roundId: string): RawRecord | null => {
  const rounds = asRecord(room.reactionRounds);
  const secureRound = asRecord(rounds?.[roundId]);

  if (secureRound) {
    return room.reactionCurrentRoundId === roundId ? secureRound : null;
  }

  return null;
};

const deriveEligibleReactionRound = (
  room: RawRecord,
  roundId: string
): DerivedReactionRound | null => {
  const round = getRound(room, roundId);

  if (!round || round.roundId !== roundId || round.status !== "ended") {
    return null;
  }

  const reactionWindowMs = getReactionWindowMs(room, round);
  const results = asRecord(round.results);
  const players = asRecord(room.listUsers);

  if (!reactionWindowMs || !results || !players) {
    return null;
  }

  const valid = Object.entries(results)
    .flatMap(([playerKey, value]) => {
      const result = asRecord(value);
      const player = asRecord(players[playerKey]);
      const reactionMs = finiteNumber(result?.reactionMs);

      if (
        !result ||
        !player ||
        result.status !== "valid" ||
        result.playerKey !== playerKey ||
        typeof result.username !== "string" ||
        result.username.length === 0 ||
        result.username !== player.username ||
        reactionMs === null ||
        !Number.isInteger(reactionMs) ||
        reactionMs < MIN_ELIGIBLE_REACTION_MS ||
        reactionMs > reactionWindowMs
      ) {
        return [];
      }

      return [
        {
          playerKey,
          reactionMs,
          username: result.username,
          inputType: result.inputType
        }
      ];
    })
    .sort((left, right) => {
      if (left.reactionMs !== right.reactionMs) {
        return left.reactionMs - right.reactionMs;
      }

      return left.playerKey.localeCompare(right.playerKey);
    });

  const winner = valid[0];

  if (!winner) {
    return null;
  }

  const entries = Object.values(results).map(asRecord).filter(Boolean);
  const countInput = (inputType: string) =>
    entries.filter((result) => result?.inputType === inputType).length;
  const signalAt = finiteNumber(round.signalAt);
  const signalDelayMs = finiteNumber(round.signalDelayMs) ?? 0;
  const syncBufferMs = finiteNumber(round.syncBufferMs) ?? 0;
  const startedAtMs =
    signalAt === null ? null : signalAt - signalDelayMs - syncBufferMs;

  return {
    roundId,
    reactionWindowMs,
    winner,
    validReactions: valid.length,
    falseStarts: entries.filter((result) => result?.status === "false-start")
      .length,
    noReactions: Math.max(0, Object.keys(players).length - entries.length),
    clickInputs: countInput("click"),
    keyInputs: countInput("key"),
    tapInputs: countInput("tap"),
    ...(startedAtMs !== null && startedAtMs > 0
      ? {startedAt: new Date(startedAtMs)}
      : {})
  };
};

const unauthorized = () =>
  NextResponse.json({error: "Authentication is required."}, {status: 401});

export async function POST(
  request: NextRequest,
  {params}: {params: Promise<{roomId: string}>}
) {
  const {roomId} = await params;

  if (!roomId || INVALID_KEY.test(roomId)) {
    return NextResponse.json({error: "Invalid room id."}, {status: 400});
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    return unauthorized();
  }

  let roundId: unknown;
  try {
    ({roundId} = await request.json());
  } catch {
    return NextResponse.json({error: "Invalid JSON body."}, {status: 400});
  }

  if (typeof roundId !== "string" || !roundId || INVALID_KEY.test(roundId)) {
    return NextResponse.json({error: "Invalid round id."}, {status: 400});
  }

  customInitApp();

  let callerId: string;
  try {
    callerId = (await getAuth().verifyIdToken(token)).uid;
  } catch {
    return unauthorized();
  }

  const roomSnapshot = await getDatabase().ref(`games/${roomId}`).get();
  const room = asRecord(roomSnapshot.val());

  if (!room) {
    return NextResponse.json({error: "Room not found."}, {status: 404});
  }

  const owner = asRecord(room.ownerUser);
  if (owner?.key !== callerId) {
    return NextResponse.json(
      {error: "Host authority is required."},
      {status: 403}
    );
  }

  const derived = deriveEligibleReactionRound(room, roundId);
  if (!derived) {
    return NextResponse.json(
      {error: "This completed round has no eligible reaction result."},
      {status: 422}
    );
  }

  const db = getFirestore();
  const roomRef = db.collection("rooms").doc(roomId);
  const roundRef = roomRef.collection("reactionRounds").doc(roundId);
  const persisted = await db.runTransaction(async (transaction) => {
    if ((await transaction.get(roundRef)).exists) {
      return false;
    }

    const finishedAt = FieldValue.serverTimestamp();
    const gamePlayed = {
      clickInputs: derived.clickInputs,
      durationSeconds: derived.reactionWindowMs / 1000,
      eligible: true,
      falseStarts: derived.falseStarts,
      fastestReactionMs: derived.winner.reactionMs,
      finishedAt,
      gameMode: "reaction",
      keyInputs: derived.keyInputs,
      maxClicks: 0,
      noReactions: derived.noReactions,
      numberOfUsers: Object.keys(asRecord(room.listUsers) ?? {}).length,
      reactionRoundId: roundId,
      reactionWindowMs: derived.reactionWindowMs,
      ...(derived.startedAt ? {startedAt: derived.startedAt} : {}),
      tapInputs: derived.tapInputs,
      timer: derived.reactionWindowMs / 1000,
      validReactions: derived.validReactions,
      winnerMetric: "reactionMs",
      winnerScore: derived.winner.reactionMs,
      winnerUsername: derived.winner.username
    };

    transaction.set(roundRef, {
      ...gamePlayed,
      persistedBy: callerId,
      roundId,
      winnerKey: derived.winner.playerKey
    });
    transaction.set(
      roomRef,
      {
        gamesPlayed: FieldValue.arrayUnion(gamePlayed),
        hadAnyGame: true,
        lastGameFinishedAt: finishedAt,
        roundsPlayed: FieldValue.increment(1)
      },
      {merge: true}
    );

    return true;
  });

  return NextResponse.json(
    {persisted, roundId},
    {status: persisted ? 201 : 200}
  );
}
