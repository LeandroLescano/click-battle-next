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
  /** A host-generated identifier. Results from a previous round are never reused. */
  roundId?: string;
  status: ReactionSessionStatus;
  createdAt?: object | number | null;
  signalAt?: number | null;
  signalDelayMs?: number | null;
  syncBufferMs?: number | null;
  results?: Record<string, ReactionResult>;
  winnerKey?: string | null;
}

export interface ReactionRound extends ReactionSession {
  roundId: string;
  /** The fixed response window captured when this round was created. */
  windowMs: number;
}

export type ReactionTransitionTarget =
  | "scheduled"
  | "signal"
  | "ended"
  | "lobby";

export type ReactionTransitionState = "idle" | "pending" | "failed";
