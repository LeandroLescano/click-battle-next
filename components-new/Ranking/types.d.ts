export type WithRequired<T, K extends keyof T> = T & {[P in K]-?: T[P]};

export type UserWithScore = WithRequired<GameUser, "maxScores"> & {
  cps: number;
  time: number;
};

export interface RankingProps {
  usersWithScore: UserWithScore[];
  lastUpdate: Date;
}
