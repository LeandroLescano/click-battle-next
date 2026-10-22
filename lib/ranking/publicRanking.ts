import type {GameMode} from "@leandrolescano/click-battle-core";

export interface PublicClassicRankingEntry {
  key: string;
  username: string;
  cps: number;
  time: number;
  mode: "classic-speed";
}

export interface PublicReactionRankingEntry {
  key: string;
  mode: "reaction";
  reactionMs: number;
  roundsWon: number;
  username: string;
}

export type PublicRankingEntry =
  | PublicClassicRankingEntry
  | PublicReactionRankingEntry;

export interface ReactionRankingRoom {
  gamesPlayed?: Array<{
    gameMode?: GameMode;
    eligible?: boolean;
    reactionWindowMs?: number;
    winnerMetric?: "clicks" | "reactionMs";
    winnerScore?: number | null;
    winnerUsername?: string;
  }>;
}

type ClassicRankingRowData = Pick<
  PublicClassicRankingEntry,
  "key" | "username" | "cps" | "time"
>;

export const toPublicClassicRankingEntry = (
  entry: ClassicRankingRowData
): PublicClassicRankingEntry => ({
  key: entry.key,
  username: entry.username,
  cps: entry.cps,
  time: entry.time,
  mode: "classic-speed"
});

export const buildPublicReactionRanking = (
  rooms: readonly ReactionRankingRoom[]
): PublicReactionRankingEntry[] => {
  const reactionMap = new Map<string, PublicReactionRankingEntry>();

  rooms.forEach((room) => {
    room.gamesPlayed?.forEach((game) => {
      if (
        game.gameMode !== "reaction" ||
        game.eligible !== true ||
        game.winnerMetric !== "reactionMs" ||
        typeof game.winnerScore !== "number" ||
        !game.winnerUsername
      ) {
        return;
      }

      const reactionMs = Math.round(game.winnerScore);
      const reactionWindowMs = game.reactionWindowMs;

      if (
        reactionMs < 100 ||
        (typeof reactionWindowMs === "number" && reactionMs > reactionWindowMs)
      ) {
        return;
      }
      const entry = reactionMap.get(game.winnerUsername);

      if (!entry) {
        reactionMap.set(game.winnerUsername, {
          key: `${game.winnerUsername}-reaction`,
          mode: "reaction",
          reactionMs,
          roundsWon: 1,
          username: game.winnerUsername
        });
        return;
      }

      entry.roundsWon += 1;
      entry.reactionMs = Math.min(entry.reactionMs, reactionMs);
    });
  });

  return [...reactionMap.values()].sort((left, right) => {
    if (left.reactionMs !== right.reactionMs) {
      return left.reactionMs - right.reactionMs;
    }

    if (left.roundsWon !== right.roundsWon) {
      return right.roundsWon - left.roundsWon;
    }

    return left.username.localeCompare(right.username);
  });
};
