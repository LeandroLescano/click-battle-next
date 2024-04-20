import {Settings} from "components";
import {DEFAULT_VALUES} from "resources/constants";

interface ValidateRoomSettingsProps {
  settings: Settings;
  maxUsers: number;
}

export const adjustRoomSettings = ({
  settings,
  maxUsers
}: ValidateRoomSettingsProps): Settings => {
  if (settings.timer) {
    if (settings.timer < DEFAULT_VALUES.MIN_TIMER)
      settings.timer = DEFAULT_VALUES.MIN_TIMER;
    if (settings.timer > DEFAULT_VALUES.MAX_TIMER)
      settings.timer = DEFAULT_VALUES.MAX_TIMER;
  }

  if (settings.maxUsers) {
    if (settings.maxUsers > maxUsers) settings.maxUsers = maxUsers;
    if (settings.maxUsers < DEFAULT_VALUES.MIN_USERS)
      settings.maxUsers = DEFAULT_VALUES.MIN_USERS;
  }

  return settings;
};
