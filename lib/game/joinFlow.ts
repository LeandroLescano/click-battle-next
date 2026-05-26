import {ParsedGameSnapshot} from "@leandrolescano/click-battle-core";

import {JoinAction} from "interfaces/RoomGame";
import {breadcrumb, metricCounter} from "observability/sentry";

export const determineJoinAction = (
  parsed: ParsedGameSnapshot,
  hasEnteredPassword: boolean,
  flagEnter: boolean,
  urlPassword: string | null,
  gameID: string
): JoinAction => {
  const {game, listUsers, isHost, isRoomFull, requiresPassword} = parsed;

  const roomTags = {room_id: gameID, is_host: isHost ? "1" : "0"};

  if (isHost) {
    return {redirect: null, showPasswordPrompt: false, addUser: false};
  }

  if (isRoomFull) {
    metricCounter("room_full_redirects", undefined, roomTags);
    breadcrumb("navigation", "full_room_redirect");
    return {
      redirect: "/?fullRoom=true",
      showPasswordPrompt: false,
      addUser: false
    };
  }

  if (requiresPassword && !hasEnteredPassword && !flagEnter) {
    breadcrumb("password", "room_requires_password");

    const isUrlPasswordValid = urlPassword === game.settings.password;

    if (!isUrlPasswordValid) {
      return {
        redirect: null,
        showPasswordPrompt: true,
        addUser: false
      };
    }

    // Password from URL is valid
    return {
      redirect: null,
      showPasswordPrompt: false,
      addUser: true,
      metricEvent: {name: "room_join_attempts", tags: roomTags}
    };
  }

  // Add user to room if not already entered
  if (!flagEnter) {
    if (listUsers.length + 1 > game.settings.maxUsers) {
      metricCounter("room_full_redirects", undefined, roomTags);
      breadcrumb("navigation", "max_users_redirect");
      return {
        redirect: "/?fullRoom=true",
        showPasswordPrompt: false,
        addUser: false
      };
    }

    breadcrumb("users", "adding_new_user");
    return {
      redirect: null,
      showPasswordPrompt: false,
      addUser: true,
      metricEvent: {name: "room_join_attempts", tags: roomTags}
    };
  }

  return {redirect: null, showPasswordPrompt: false, addUser: false};
};
