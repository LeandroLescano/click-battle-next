import type {GameMode} from "@leandrolescano/click-battle-core";
import React from "react";
import {useTranslation} from "react-i18next";

import {HOME_MODE_SELECTION} from "lib/game/gameModes";

type GameModeSelectionProps = {
  onSelect: (gameMode: Extract<GameMode, "classic-speed" | "reaction">) => void;
  selectedGameMode: GameMode;
};

export const GameModeSelection = ({
  onSelect,
  selectedGameMode
}: GameModeSelectionProps) => {
  const {t} = useTranslation();

  return (
    <section aria-labelledby="mode-selection-heading" className="w-full">
      <div className="mb-2 flex flex-col gap-0.5 md:mb-3">
        <h3
          id="mode-selection-heading"
          className="text-sm font-bold uppercase tracking-[0.1em] text-primary-500 dark:text-primary-200 md:text-base"
        >
          {t("Choose your battle")}
        </h3>
        <span className="text-xs font-semibold text-primary-500 dark:text-primary-300 md:text-sm">
          {t("Pick a mode, then set up your room.")}
        </span>
      </div>
      <div
        aria-label={t("Game mode")}
        className="grid grid-cols-2 gap-2 md:gap-3"
        role="radiogroup"
      >
        {HOME_MODE_SELECTION.map((mode) => {
          const selected = selectedGameMode === mode.gameMode;

          return (
            <button
              aria-checked={selected}
              className={`min-h-[92px] rounded-xl border p-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 md:min-h-36 md:rounded-2xl md:p-4 ${
                selected
                  ? "border-primary-600 bg-primary-100 text-primary-700 dark:border-primary-100 dark:bg-primary-500 dark:text-primary-50"
                  : "border-primary-300 bg-primary-50/60 text-primary-600 hover:border-primary-500 hover:bg-primary-100 dark:border-primary-300 dark:bg-primary-600 dark:text-primary-100 dark:hover:border-primary-100 dark:hover:bg-primary-500"
              }`}
              data-testid={`home-mode-${mode.gameMode}`}
              key={mode.gameMode}
              onClick={() => onSelect(mode.gameMode)}
              role="radio"
              type="button"
            >
              <p className="text-base font-extrabold leading-none md:text-3xl">
                {t(mode.titleKey)}
              </p>
              <p className="mt-1.5 text-[11px] font-semibold leading-snug md:mt-3 md:text-base">
                {t(mode.descriptionKey)}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
};
