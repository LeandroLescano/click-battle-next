import {GameMode} from "@leandrolescano/click-battle-core";
import {TFunction} from "i18next";

export const DEFAULT_GAME_MODE: GameMode = "classic-speed";
export const SUPPORTED_WEB_GAME_MODES: GameMode[] = [
  "classic-speed",
  "reaction"
];

export const getGameModeLabelKey = (mode?: GameMode | null) => {
  switch (mode) {
    case "reaction":
      return "Reaction Battle";
    case "classic-speed":
    default:
      return "Classic Speed";
  }
};

export const getGameModeLabel = (t: TFunction, mode?: GameMode | null) =>
  t(getGameModeLabelKey(mode));

export const isReactionMode = (mode?: GameMode | null) => mode === "reaction";
