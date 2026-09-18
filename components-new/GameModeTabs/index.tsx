import type {GameMode} from "@leandrolescano/click-battle-core";
import React from "react";
import {useTranslation} from "react-i18next";

import {HOME_MODE_SELECTION} from "lib/game/gameModes";

type GameModeTabsProps = {
  onSelect: (gameMode: Extract<GameMode, "classic-speed" | "reaction">) => void;
  selectedGameMode: GameMode;
};

export const GameModeTabs = ({
  onSelect,
  selectedGameMode
}: GameModeTabsProps) => {
  const {t} = useTranslation();

  return (
    <div
      aria-label={t("Game mode")}
      className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin] md:gap-3"
      role="tablist"
    >
      {HOME_MODE_SELECTION.map((mode) => {
        const selected = selectedGameMode === mode.gameMode;

        return (
          <button
            aria-selected={selected}
            className={`min-w-max flex-1 rounded-xl border px-4 py-2.5 text-sm font-extrabold uppercase transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 md:px-6 md:py-3 md:text-lg ${
              selected
                ? "border-primary-600 bg-primary-100 text-primary-700 shadow-[3px_4px_0_var(--color-primary-250)] dark:border-primary-100 dark:bg-primary-500 dark:text-primary-50"
                : "border-primary-300 bg-primary-50/60 text-primary-600 hover:border-primary-500 hover:bg-primary-100 dark:border-primary-300 dark:bg-primary-600 dark:text-primary-100 dark:hover:border-primary-100 dark:hover:bg-primary-500"
            }`}
            key={mode.gameMode}
            onClick={() => onSelect(mode.gameMode)}
            role="tab"
            type="button"
          >
            {t(mode.titleKey)}
          </button>
        );
      })}
    </div>
  );
};
