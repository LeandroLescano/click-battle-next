import React from "react";
import {IconProp} from "@fortawesome/fontawesome-svg-core";
import {faLock} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useTranslation} from "react-i18next";

import {Game} from "interfaces";
import {Button} from "components-new/Button";
import {User} from "icons/User";

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
        className="w-full md:w-64 md:h-[124px]"
      >
        <div>
          <p className="text-xs md:text-2xl">
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
          <span className="text-[10px] md:text-lg">
            {t("Owner")}: {game.ownerUser?.username}
          </span>
        </div>
        <div className="text-[8px] md:text-base flex gap-2 items-center">
          <User />
          {game.listUsers
            ? `${Object.keys(game.listUsers).length}/${game.settings.maxUsers}`
            : `1/${game.settings.maxUsers}`}
        </div>
      </Button>
    )
  );
};
