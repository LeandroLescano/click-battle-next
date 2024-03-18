export interface GameUser {
  username: string;
  clicks?: number;
  rol?: "visitor" | "owner";
  maxScores?: MaxScore[];
  key?: string;
  kickOut?: boolean;
  email?: string;
  rating?: number;
}

export interface MaxScore {
  clicks: number;
  time: number;
}
