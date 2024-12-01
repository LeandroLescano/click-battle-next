import {Timestamp} from "firebase/firestore";
import {GameUser} from "./GameUser";

export interface Game {
  key?: string | null;
  listUsers: RoomUser[];
  currentGame: boolean;
  gameStart: boolean;
  ownerUser: Pick<GameUser, "username" | "key">;
  roomName: string;
  timeStart: number;
  timer: number;
  created?: Date | object;
  settings: GameSettings;
}

export interface GameSettings {
  timer: number;
  maxUsers: number;
  password?: string;
}

export type RoomUser = Pick<
  GameUser,
  "clicks" | "rol" | "username" | "key" | "kickOut"
> & {
  enterDate?: Timestamp;
};
