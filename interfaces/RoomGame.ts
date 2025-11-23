import {Game, GameUser} from "@leandrolescano/click-battle-core";

import {RoomStats} from "./RoomStats";

export interface RoomGameMetrics {
  snapshotSizeBytes: number;
  parseTimeMs: number;
  usersCount: number;
  isHost: boolean;
  roomId: string;
}

export interface JoinAction {
  redirect: string | null;
  showPasswordPrompt: boolean;
  addUser: boolean;
  metricEvent?: {
    name: string;
    tags?: Record<string, string | number | boolean>;
  };
  breadcrumb?: {
    category: string;
    message: string;
    data?: Record<string, unknown>;
  };
}

export interface UseRoomGameReturn {
  currentGame: Game;
  localUser: GameUser;
  isHost: boolean;
  roomStats: React.MutableRefObject<RoomStats>;
  isRoomFull: boolean;
  kickedOut: boolean;
  needsPassword: boolean;
  newUserJoined: boolean;
  hasEnteredPassword: boolean;

  handleUserPasswordSubmit: (password: string) => Promise<void>;
  handleBackNavigation: () => void;
  handleInvite: () => void;

  error: Error | null;
}
