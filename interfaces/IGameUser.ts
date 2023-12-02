export interface GameUser {
  username: string;
  clicks?: number;
  rol?: "visitor" | "owner";
  maxScore?: number;
  key?: string;
  kickOut?: boolean;
  email?: string;
}
