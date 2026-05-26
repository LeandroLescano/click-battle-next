export type ReactionSessionStatus =
  | "waiting"
  | "scheduled"
  | "signal"
  | "ended";

export type ReactionResultStatus =
  | "waiting"
  | "false-start"
  | "valid"
  | "unavailable";

export type ReactionInputType = "click" | "tap" | "key";

export interface ReactionResult {
  playerKey: string;
  username: string;
  status: ReactionResultStatus;
  clickedAt?: number;
  signalShownAt?: number;
  reactionMs?: number;
  inputType?: ReactionInputType;
}

export interface ReactionSession {
  status: ReactionSessionStatus;
  createdAt?: object | number | null;
  signalAt?: number | null;
  signalDelayMs?: number | null;
  syncBufferMs?: number | null;
  results?: Record<string, ReactionResult>;
  winnerKey?: string | null;
}
