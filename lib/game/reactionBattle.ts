import {GameModeSettings, GameUser} from "@leandrolescano/click-battle-core";

import {ReactionResult, ReactionSession} from "interfaces";

export const DEFAULT_REACTION_WINDOW_MS = 1500;
export const DEFAULT_REACTION_SYNC_BUFFER_MS = 1200;
export const MIN_REACTION_DELAY_MS = 1200;
export const MAX_REACTION_DELAY_MS = 2600;

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
