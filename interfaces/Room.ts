import {
  GameMode,
  GameModeSettingsInput
} from "@leandrolescano/click-battle-core";

export interface Room {
  name: string;
  password?: string;
  maxUsers: number;
  timer: number;
  gameMode: GameMode;
  modeSettings?: GameModeSettingsInput;
}
