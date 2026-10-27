import type {getWebModeSettings} from "../../lib/game/gameModes.ts";

import type {Settings} from "./types";

type BuildSettingsUpdatePayloadInput = {
  settings: Settings;
  currentGameMode: Settings["gameMode"];
  canChangeGameMode: boolean;
  getModeSettings: typeof getWebModeSettings;
};

export const buildSettingsUpdatePayload = ({
  settings,
  currentGameMode,
  canChangeGameMode,
  getModeSettings
}: BuildSettingsUpdatePayloadInput) => ({
  roomName: settings.roomName,
  "settings/maxUsers": settings.maxUsers,
  "settings/password": settings.password || null,
  "settings/timer": settings.timer,
  ...(canChangeGameMode && settings.gameMode !== currentGameMode
    ? {
        gameMode: settings.gameMode,
        modeSettings: getModeSettings(settings.gameMode)
      }
    : {})
});
