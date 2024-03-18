import {GameUser} from "./IGameUser";

export interface Game {
  key?: string | null;
  listUsers: Pick<GameUser, "clicks" | "rol" | "username" | "key">[];
  currentGame: boolean;
  gameStart: boolean;
  ownerUser: Pick<GameUser, "username">;
  roomName: string;
  timeStart: number;
  timer: number;
  visitorUser: string;
  created?: Date | object;
  settings: GameSettings;
}

export interface GameSettings {
  timer: number;
  maxUsers: number;
  password?: string;
}
