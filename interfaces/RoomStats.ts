import {GameMode} from "@leandrolescano/click-battle-core";

export interface RoomStats {
  id?: string;
  name: string;
  created: Date;
  removed: Date;
  closedReason?: "host-left" | "unknown";
  durationSeconds?: number;
  firstGameStartedAt?: Date;
  hadAnyGame?: boolean;
  lastGameFinishedAt?: Date;
  maxUsersConnected: number;
  maxUsersConfigured?: number;
  owner: string;
  roundsPlayed?: number;
  gamesPlayed: GamePlayed[];
  withPassword: boolean;
  gameMode?: GameMode;
}

export interface GamePlayed {
  numberOfUsers: number;
  maxClicks: number;
  timer: number;
  durationSeconds?: number;
  startedAt?: Date;
  gameMode?: GameMode;
  fastestReactionMs?: number | null;
  falseStarts?: number;
  finishedAt?: Date;
  clickInputs?: number;
  keyInputs?: number;
  noReactions?: number;
  reactionWindowMs?: number;
  tapInputs?: number;
  validReactions?: number;
  winnerMetric?: "clicks" | "reactionMs";
  winnerScore?: number | null;
  winnerUsername?: string;
}
