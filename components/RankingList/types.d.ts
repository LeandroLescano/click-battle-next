type WithRequired<T, K extends keyof T> = T & {[P in K]-?: T[P]};

export interface RankingListProps {
  users: (WithRequired<GameUser, "maxScores"> & {
    cps: number;
    time: number;
  })[];
}
