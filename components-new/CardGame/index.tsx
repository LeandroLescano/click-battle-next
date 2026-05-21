import React from "react";
import {IconProp} from "@fortawesome/fontawesome-svg-core";
import {faLock} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useTranslation} from "react-i18next";

import {Button} from "components-new/Button";
import {Game} from "interfaces";
import {User} from "icons/User";
import {getGameModeLabel} from "lib/game/gameModes";

type CardGameProps = {
  game: Game;
  handleEnterGame: VoidFunction;
  roomNumber: number;
};

export const CardGame = ({
  game,
  handleEnterGame,
  roomNumber
}: CardGameProps) => {
  const {t} = useTranslation();

  return (
    game.ownerUser && (
      <Button
        onClick={handleEnterGame}
        variant="card"
        className="w-full md:w-64 min-h-[124px]"
      >
        <div className="flex h-full min-w-0 items-start justify-between gap-3 text-left">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs md:text-2xl">
              {game.roomName !== ""
                ? game.roomName
                : t("Room N°", {roomName: roomNumber})}
              {game.settings.password && (
                <FontAwesomeIcon
                  icon={faLock as IconProp}
                  className="mx-2"
                  size="sm"
                />
              )}
            </p>
            <span className="mt-1 block truncate text-[10px] md:text-lg">
              {t("Owner")}: {game.ownerUser?.username}
            </span>
            <span className="mt-2 inline-flex max-w-full rounded-full border border-primary-300/80 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-primary-400 md:text-xs">
              <span className="truncate">
                {getGameModeLabel(t, game.gameMode)}
              </span>
            </span>
          </div>

          <div className="shrink-0 flex items-center gap-2 text-[8px] md:text-base">
            <User />
            {`${game.listUsers.length || 1}/${game.settings.maxUsers}`}
          </div>
        </div>
      </Button>
    )
  );
};
