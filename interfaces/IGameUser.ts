export interface GameUser {
  username: string;
  clicks?: number;
  rol?: "visitor" | "owner";
  maxScores?: MaxScore[];
  key?: string;
  kickOut?: boolean;
  email?: string;
}

export interface MaxScore {
  clicks: number;
  time: number;
}
