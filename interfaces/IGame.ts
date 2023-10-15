import {User} from "./IUser";

export interface Game {
  listUsers: Pick<User, "clicks" | "rol" | "username">[];
  currentGame: boolean;
  gameStart: boolean;
  maxUsers: number;
  ownerUser: Pick<User, "username">;
  roomName: string;
  timeStart: number;
  timer: number;
  password?: string;
  visitorUser: string;
  created?: Date | object;
}
