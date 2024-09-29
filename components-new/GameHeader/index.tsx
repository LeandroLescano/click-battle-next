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
    <header className="flex justify-between items-center">
      <Button
        variant="outlined"
        className="px-5 py-1 text-2xl flex gap-2"
        onClick={onBack}
      >
        <LeftArrow />
        {t("Go Back!")}
      </Button>
      <div className="flex items-center gap-9">
        <LanguageDropdown />
        {isHost && (
          <Button
            variant="outlined"
            className="px-5 py-1 text-2xl flex gap-2"
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
