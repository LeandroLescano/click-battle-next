import {GameUser} from "./IGameUser";

export interface Game {
  key?: string | null;
  listUsers: Pick<GameUser, "clicks" | "rol" | "username" | "key">[];
  currentGame: boolean;
  gameStart: boolean;
  maxUsers: number;
  ownerUser: Pick<GameUser, "username">;
  roomName: string;
  timeStart: number;
  timer: number;
  password?: string;
  visitorUser: string;
  created?: Date | object;
}
