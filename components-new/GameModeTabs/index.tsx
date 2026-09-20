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
      className="flex gap-1 overflow-x-auto overflow-y-hidden border-b-2 border-primary-300 px-1 [scrollbar-width:thin] dark:border-primary-300 md:gap-2 md:px-2"
      role="tablist"
    >
      {HOME_MODE_SELECTION.map((mode) => {
        const selected = selectedGameMode === mode.gameMode;

        return (
          <button
            aria-selected={selected}
            className={`-mb-[2px] min-w-max flex-1 rounded-t-xl border border-b-0 px-4 py-2.5 text-sm font-extrabold uppercase transition-[background-color,border-color,color,box-shadow] duration-150 ease-out motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 md:px-6 md:py-3 md:text-lg ${
              selected
                ? "border-primary-600 border-b-primary-100 bg-primary-100 text-primary-700 shadow-[3px_0_0_var(--color-primary-250)] dark:border-primary-100 dark:border-b-primary-500 dark:bg-primary-500 dark:text-primary-50"
                : "border-transparent bg-transparent text-primary-600 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:text-primary-200 dark:hover:border-primary-200 dark:hover:bg-primary-600 dark:hover:text-primary-50"
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
