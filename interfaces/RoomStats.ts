import {GameMode} from "@leandrolescano/click-battle-core";

export interface RoomStats {
  id?: string;
  name: string;
  created: Date;
  removed: Date;
  maxUsersConnected: number;
  owner: string;
  gamesPlayed: GamePlayed[];
  withPassword: boolean;
  gameMode?: GameMode;
}

export interface GamePlayed {
  numberOfUsers: number;
  maxClicks: number;
  timer: number;
  gameMode?: GameMode;
  fastestReactionMs?: number | null;
  falseStarts?: number;
  reactionWindowMs?: number;
  validReactions?: number;
}
