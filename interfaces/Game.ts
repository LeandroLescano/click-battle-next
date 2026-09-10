import {
  Game as ExternalGame,
  GameUser
} from "@leandrolescano/click-battle-core";
import {Timestamp} from "firebase/firestore";

import {ReactionRound} from "./ReactionBattle";

export type Game = ExternalGame & {
  cleanupTombstone?: RoomCleanupTombstone;
  hostLease?: HostLease | null;
  hostConnectionId?: string;
  hostDisconnectedAt?: number | null;
  reactionCurrentRoundId?: string | null;
  reactionRounds?: Record<string, ReactionRound>;
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

export type RoomCleanupTombstone = {
  closedAt: number;
  version: 1;
};

export type RoomLifecycleSnapshot = {
  cleanupTombstone?: unknown;
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
  cleanupTombstone?: unknown;
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
