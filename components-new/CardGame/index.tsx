import {IconProp} from "@fortawesome/fontawesome-svg-core";
import {faLock} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import React from "react";
import {useTranslation} from "react-i18next";

import {Button} from "components-new/Button";
import {User} from "icons/User";
import {Game} from "interfaces";
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
        className="min-h-[96px] w-full md:min-h-[124px] md:w-64"
      >
        <div className="flex h-full min-w-0 flex-col justify-between gap-2 text-left md:gap-3">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold leading-tight md:text-2xl">
                {game.roomName !== ""
                  ? game.roomName
                  : t("Room N°", {roomName: roomNumber})}
                {game.settings.password && (
                  <FontAwesomeIcon
                    icon={faLock as IconProp}
                    className="mx-1.5 md:mx-2"
                    size="sm"
                  />
                )}
              </p>
              <span className="mt-0.5 block truncate text-[11px] leading-tight md:mt-1 md:text-lg">
                {t("Owner")}: {game.ownerUser?.username}
              </span>
            </div>

            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary-300/60 bg-primary-50/50 px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary-500 md:gap-2 md:bg-transparent md:px-0 md:py-0 md:text-base">
              <span className="md:hidden">
                <User width={16} height={16} />
              </span>
              <span className="hidden md:inline-flex">
                <User />
              </span>
              {`${game.listUsers.length || 1}/${game.settings.maxUsers}`}
            </span>
          </div>

          <div className="min-w-0">
            <span className="inline-flex max-w-full rounded-full border border-primary-300/80 bg-primary-50/35 px-2 py-0.5 text-[9px] font-bold uppercase leading-none tracking-[0.08em] text-primary-400 md:py-1 md:text-xs md:tracking-[0.12em]">
              <span className="truncate">
                {getGameModeLabel(t, game.gameMode)}
              </span>
            </span>
          </div>
        </div>
      </Button>
    )
  );
};
