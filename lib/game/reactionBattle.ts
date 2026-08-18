import {GameModeSettings, GameUser} from "@leandrolescano/click-battle-core";

import {
  ReactionInputType,
  ReactionResult,
  ReactionRound,
  ReactionSession,
  ReactionSessionStatus,
  ReactionTransitionTarget
} from "interfaces";

export const DEFAULT_REACTION_WINDOW_MS = 1500;
export const DEFAULT_REACTION_SYNC_BUFFER_MS = 1200;
export const MIN_REACTION_DELAY_MS = 1200;
export const MAX_REACTION_DELAY_MS = 2600;
export const MIN_PLAUSIBLE_REACTION_MS = 100;

export const getReactionWindowMs = (modeSettings?: GameModeSettings | null) => {
  if (modeSettings?.gameMode === "reaction") {
    return modeSettings.config.windowMs;
  }

  return DEFAULT_REACTION_WINDOW_MS;
};

export const createReactionSession = ({
  signalAt,
  signalDelayMs,
  syncBufferMs
}: {
  signalAt: number;
  signalDelayMs: number;
  syncBufferMs: number;
}): ReactionSession => ({
  status: "scheduled",
  signalAt,
  signalDelayMs,
  syncBufferMs,
  results: {},
  winnerKey: null
});

export const createReactionRound = ({
  roundId,
  signalAt,
  signalDelayMs,
  syncBufferMs,
  windowMs
}: {
  roundId: string;
  signalAt: number;
  signalDelayMs: number;
  syncBufferMs: number;
  windowMs: number;
}): ReactionRound => ({
  ...createReactionSession({signalAt, signalDelayMs, syncBufferMs}),
  roundId,
  windowMs
});

export const isPlausibleReactionMs = (
  reactionMs: unknown,
  windowMs: number
): reactionMs is number =>
  typeof reactionMs === "number" &&
  Number.isInteger(reactionMs) &&
  Number.isFinite(reactionMs) &&
  reactionMs >= MIN_PLAUSIBLE_REACTION_MS &&
  reactionMs <= windowMs;

const validInputTypes: readonly ReactionInputType[] = ["click", "tap", "key"];

/** Validates the immutable payload a participant writes at results/{uid}. */
export const isValidReactionResult = (
  result: unknown,
  playerKey: string,
  windowMs: number,
  status: ReactionSessionStatus
): result is ReactionResult => {
  if (!result || typeof result !== "object") return false;

  const candidate = result as ReactionResult;
  if (
    candidate.playerKey !== playerKey ||
    typeof candidate.username !== "string" ||
    !candidate.username ||
    !validInputTypes.includes(candidate.inputType as ReactionInputType) ||
    !Number.isFinite(candidate.clickedAt)
  ) {
    return false;
  }

  if (candidate.status === "false-start") {
    return (
      (status === "scheduled" || status === "waiting") &&
      candidate.reactionMs === undefined &&
      candidate.signalShownAt === undefined
    );
  }

  return (
    candidate.status === "valid" &&
    status === "signal" &&
    Number.isFinite(candidate.signalShownAt) &&
    isPlausibleReactionMs(candidate.reactionMs, windowMs)
  );
};

export const getReactionRound = (
  room: Record<string, unknown>
): ReactionSession | null => {
  const currentRoundId = room.reactionCurrentRoundId;
  const rounds = room.reactionRounds;
  if (
    typeof currentRoundId === "string" &&
    rounds &&
    typeof rounds === "object"
  ) {
    const round = (rounds as Record<string, unknown>)[currentRoundId];
    if (round && typeof round === "object") {
      return {roundId: currentRoundId, ...(round as ReactionSession)};
    }
  }

  return null;
};

export const nextReactionRoundId = () =>
  `reaction-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export type ConditionalTransition<T> = {
  current: T;
  expected: (current: T) => boolean;
  next: T;
  isTarget: (current: T) => boolean;
};

/**
 * Applies a transition only when the remote value is still in the expected
 * state. Repeating an already-confirmed target is intentionally successful.
 */
export const resolveConditionalTransition = <T>({
  current,
  expected,
  next,
  isTarget
}: ConditionalTransition<T>): T | null => {
  if (isTarget(current)) return current;
  return expected(current) ? next : null;
};

export const isReactionTransitionTarget = (
  status: ReactionSessionStatus | null | undefined,
  target: ReactionTransitionTarget
) => (target === "lobby" ? !status : status === target);

export const buildReactionResultList = (
  users: GameUser[],
  results: Record<string, ReactionResult> = {}
) =>
  users.map((user) => {
    const playerKey = user.key || user.username;

    return (
      results[playerKey] || {
        playerKey,
        username: user.username,
        status: "waiting" as const
      }
    );
  });

const compareReactionResults = (
  left: ReactionResult,
  right: ReactionResult
) => {
  const leftScore = left.reactionMs ?? Number.POSITIVE_INFINITY;
  const rightScore = right.reactionMs ?? Number.POSITIVE_INFINITY;

  if (leftScore !== rightScore) {
    return leftScore - rightScore;
  }

  const leftClickedAt = left.clickedAt ?? Number.POSITIVE_INFINITY;
  const rightClickedAt = right.clickedAt ?? Number.POSITIVE_INFINITY;

  if (leftClickedAt !== rightClickedAt) {
    return leftClickedAt - rightClickedAt;
  }

  return left.playerKey.localeCompare(right.playerKey);
};

export const getReactionWinner = (
  users: GameUser[],
  results: Record<string, ReactionResult> = {}
) => {
  const validResults = buildReactionResultList(users, results).filter(
    (result) =>
      result.status === "valid" && typeof result.reactionMs === "number"
  );

  return validResults.sort(compareReactionResults)[0] ?? null;
};

export const haveAllPlayersReacted = (
  users: GameUser[],
  results: Record<string, ReactionResult> = {}
) =>
  users.every((user) => {
    const playerKey = user.key || user.username;
    const result = results[playerKey];

    return Boolean(result && result.status !== "waiting");
  });
