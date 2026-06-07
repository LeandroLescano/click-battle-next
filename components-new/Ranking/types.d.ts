import {GameUser, GameMode} from "@leandrolescano/click-battle-core";

export type WithRequired<T, K extends keyof T> = T & {[P in K]-?: T[P]};

export type RankingMode = Extract<GameMode, "classic-speed" | "reaction">;

export type ClassicRankingEntry = WithRequired<GameUser, "maxScores"> & {
  cps: number;
  mode: "classic-speed";
  time: number;
};

export type ReactionRankingEntry = {
  key: string;
  mode: "reaction";
  reactionMs: number;
  roundsWon: number;
  username: string;
};

export type RankingEntry = ClassicRankingEntry | ReactionRankingEntry;

export interface RankingProps {
  lastUpdate: Date;
  rankings: Record<RankingMode, RankingEntry[]>;
}
