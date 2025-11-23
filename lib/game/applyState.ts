import {ParsedGameSnapshot} from "@leandrolescano/click-battle-core";

import {RoomStats} from "interfaces/RoomStats";
import {breadcrumb, metricCounter} from "observability/sentry";

import {reportHostMetrics} from "./metrics";

interface ApplyStateResult {
  shouldRedirect: string | null;
  newUserJoined: boolean;
}

export const applyState = (
  parsed: ParsedGameSnapshot,
  currentListUsersLength: number,
  roomStats: RoomStats,
  gameID: string
): ApplyStateResult => {
  const {game, listUsers, kickedOut, isHost} = parsed;

  const roomTags = {
    room_id: gameID,
    is_host: isHost ? "1" : "0"
  };

  reportHostMetrics(listUsers.length, gameID, isHost);

  if (!roomStats.name) {
    roomStats.name = game.roomName;
    roomStats.owner = game.ownerUser.username;
    roomStats.withPassword = !!game.settings.password;
    roomStats.created = new Date(game.created as unknown as number);
  }

  if (roomStats.maxUsersConnected < listUsers.length) {
    roomStats.maxUsersConnected = listUsers.length;
  }

  if (kickedOut) {
    metricCounter("room_kicked_out", undefined, roomTags);
    breadcrumb("navigation", "kicked_out_redirect");
    return {shouldRedirect: "/?kickedOut=true", newUserJoined: false};
  }

  let newUserJoined = false;
  if (listUsers.length > currentListUsersLength) {
    breadcrumb("users", "new_user_joined", {
      totalUsers: listUsers.length
    });
    newUserJoined = true;
  }

  return {shouldRedirect: null, newUserJoined};
};
