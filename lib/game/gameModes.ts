import {GameMode, GameModeSettings} from "@leandrolescano/click-battle-core";
import {TFunction} from "i18next";

export type HomeModeSelection = {
  gameMode: Extract<GameMode, "classic-speed" | "reaction">;
  titleKey: string;
  descriptionKey: string;
};

export const DEFAULT_GAME_MODE: GameMode = "classic-speed";
export const SUPPORTED_WEB_GAME_MODES: GameMode[] = [
  "classic-speed",
  "reaction"
];

export const HOME_MODE_SELECTION: readonly HomeModeSelection[] = [
  {
    gameMode: "classic-speed",
    titleKey: "Speed Battle",
    descriptionKey: "Make more clicks than your opponents before time runs out."
  },
  {
    gameMode: "reaction",
    titleKey: "Reaction Battle",
    descriptionKey:
      "Wait for the signal, then react faster than your opponents."
  }
];

export const getHomeModeSelection = (mode: GameMode) =>
  HOME_MODE_SELECTION.find((selection) => selection.gameMode === mode);

export const getWebModeSettings = (
  gameMode: Extract<GameMode, "classic-speed" | "reaction">
): GameModeSettings =>
  gameMode === "reaction"
    ? {gameMode, config: {windowMs: 1500}}
    : {gameMode, config: {}};

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
