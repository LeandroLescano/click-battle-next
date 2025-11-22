import {
  Game as ExternalGame,
  GameUser
} from "@leandrolescano/click-battle-core";
import {Timestamp} from "firebase/firestore";

export type Game = ExternalGame;

export type RoomUser = Pick<
  GameUser,
  "clicks" | "rol" | "username" | "key" | "kickOut"
> & {
  enterDate?: Timestamp;
};

export type FinalResults = {
  localPosition: string;
  results: GameUser[];
};
