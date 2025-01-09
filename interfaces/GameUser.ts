import {Timestamp} from "firebase/firestore";

export interface GameUser {
  username: string;
  clicks?: number;
  rol?: "visitor" | "owner";
  maxScores?: MaxScore[];
  key?: string;
  kickOut?: boolean;
  points?: number;
  email?: string;
  rating?: number;
  created?: Timestamp;
  updated?: Timestamp;
  lastLogin?: Timestamp;
  lastSession?: Timestamp;
  providers?: string[];
}

export interface MaxScore {
  clicks: number;
  time: number;
  date: Timestamp;
}
