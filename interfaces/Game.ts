import {
  Game as ExternalGame,
  GameUser
} from "@leandrolescano/click-battle-core";
import {Timestamp} from "firebase/firestore";

import {ReactionSession} from "./ReactionBattle";

export type Game = ExternalGame & {
  reactionSession?: ReactionSession | null;
};

export type RoomUser = Pick<
  GameUser,
  "clicks" | "rol" | "username" | "key" | "kickOut"
> & {
  enterDate?: Timestamp;
};

export type FinalResults = {
  localPosition: number;
  localPositionSuffix: string;
  results: GameUser[];
};
