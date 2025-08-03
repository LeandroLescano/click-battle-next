import {Timestamp} from "firebase/firestore";

import {GameUser} from "./GameUser";

export interface Game {
  key?: string | null;
  listUsers: RoomUser[];
  ownerUser: Pick<GameUser, "username" | "key">;
  roomName: string;
  startTime?: Date | null;
  status: "lobby" | "countdown" | "playing" | "ended";
  created?: Date | object;
  settings: GameSettings;
}

export interface GameSettings {
  timer: number;
  maxUsers: number;
  password?: string | null;
}

export type RoomUser = Pick<
  GameUser,
  "clicks" | "rol" | "username" | "key" | "kickOut"
> & {
  enterDate?: Timestamp;
};
