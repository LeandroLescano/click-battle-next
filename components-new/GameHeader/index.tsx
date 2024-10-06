import React from "react";
import {useTranslation} from "react-i18next";

import {Button, LanguageDropdown} from "components-new";
import {LeftArrow} from "icons/LeftArrow";
import {Gear} from "icons/Gear";
import {useGame} from "contexts/GameContext";

import {GameHeaderProps} from "./types";

export const GameHeader = ({onOpenSettings, onBack}: GameHeaderProps) => {
  const {t} = useTranslation();
  const {isHost} = useGame();

  return (
    <header className="flex justify-between items-center z-10">
      <Button
        variant="outlined"
        className="px-2.5 py-0.5 md:px-5 md:py-1 text-sm md:text-2xl flex gap-1 md:gap-2 items-center"
        onClick={onBack}
      >
        <LeftArrow />
        {t("Go Back!")}
      </Button>
      <div className="flex items-center gap-4 md:gap-9">
        <LanguageDropdown />
        {isHost && (
          <Button
            variant="outlined"
            className="px-2.5 py-0.5 md:px-5 md:py-1 text-sm md:text-2xl flex gap-1 md:gap-2 items-center"
            onClick={onOpenSettings}
          >
            <Gear />
            {t("Settings")}
          </Button>
        )}
      </div>
    </header>
  );
};
