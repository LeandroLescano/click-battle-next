import React from "react";
import {IconProp} from "@fortawesome/fontawesome-svg-core";
import {faLock} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useTranslation} from "react-i18next";

import {Game} from "interfaces";
import {Button} from "components-new/Button";

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
        className="w-full md:w-64"
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
          <svg
            className="size-4 md:size-7"
            viewBox="0 0 19 19"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_120_464)">
              <path
                d="M13.2941 16.491V14.9374C13.2941 14.1134 12.9667 13.3231 12.384 12.7404C11.8013 12.1577 11.011 11.8303 10.187 11.8303H3.97281C3.14876 11.8303 2.35846 12.1577 1.77577 12.7404C1.19308 13.3231 0.865723 14.1134 0.865723 14.9374V16.491"
                stroke="var(--color-primary-400)"
                strokeWidth="1.55354"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.07974 8.72321C8.79574 8.72321 10.1868 7.33212 10.1868 5.61612C10.1868 3.90012 8.79574 2.50903 7.07974 2.50903C5.36375 2.50903 3.97266 3.90012 3.97266 5.61612C3.97266 7.33212 5.36375 8.72321 7.07974 8.72321Z"
                stroke="var(--color-primary-400)"
                strokeWidth="1.55354"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17.9546 16.4908V14.9373C17.9541 14.2488 17.7249 13.5801 17.3032 13.036C16.8814 12.4919 16.2908 12.1033 15.6243 11.9312"
                stroke="var(--color-primary-400)"
                strokeWidth="1.55354"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12.5173 2.60986C13.1857 2.78099 13.7781 3.16968 14.2011 3.71467C14.6241 4.25966 14.8537 4.92995 14.8537 5.61985C14.8537 6.30976 14.6241 6.98004 14.2011 7.52503C13.7781 8.07002 13.1857 8.45872 12.5173 8.62984"
                stroke="var(--color-primary-400)"
                strokeWidth="1.55354"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <defs>
              <clipPath id="clip0_120_464">
                <rect
                  width="18.6425"
                  height="18.6425"
                  fill="white"
                  transform="translate(0.0888672 0.178711)"
                />
              </clipPath>
            </defs>
          </svg>
          {game.listUsers
            ? `${Object.keys(game.listUsers).length}/${game.settings.maxUsers}`
            : `1/${game.settings.maxUsers}`}
        </div>
      </Button>
    )
  );
};
