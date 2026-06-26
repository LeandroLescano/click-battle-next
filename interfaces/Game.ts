import {
  Game as ExternalGame,
  GameUser
} from "@leandrolescano/click-battle-core";
import {Timestamp} from "firebase/firestore";

import {ReactionSession} from "./ReactionBattle";

export type Game = ExternalGame & {
  hostLease?: HostLease | null;
  hostConnectionId?: string;
  hostDisconnectedAt?: number | null;
  reactionSession?: ReactionSession | null;
};

export type HostLease = {
  ownerId: string;
  sessionId: string;
  claimedAt: number;
  lastRenewedAt: number;
};

export type HostDisconnectSignal = {
  disconnectedAt: number;
};

export type RoomLifecycleSnapshot = {
  created?: unknown;
  hostLease?: unknown;
  hostDisconnectSignal?: unknown;
  hostConnectionId?: unknown;
  hostDisconnectedAt?: unknown;
  ownerUser?: {
    key?: unknown;
  };
};

export type RawRoomLifecycleSnapshot = {
  created?: unknown;
  hostLease?: unknown;
  hostConnectionId?: unknown;
  hostDisconnectedAt?: unknown;
  ownerUser?: {
    key?: unknown;
  };
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
