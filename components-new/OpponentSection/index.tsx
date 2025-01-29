import React, {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";

import {GameUser} from "interfaces";
import {useGame} from "contexts/GameContext";

import OpponentList from "./components/OpponentList";
import "./styles.scss";

interface OpponentSectionProps {
  localUsername: string;
  maxUsers: number;
}

function OpponentSection({localUsername, maxUsers}: OpponentSectionProps) {
  const [countPositions, setCountPositions] = useState<{
    list: GameUser[];
    count: number;
  }>({
    list: [],
    count: 0
  });
  const {t} = useTranslation();
  const {game, isHost} = useGame();

  useEffect(() => {
    if (
      !checkOrderArray(
        countPositions.list,
        game.listUsers.sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      )
    ) {
      setCountPositions((prev) => ({
        list: game.listUsers.sort((a, b) => (b.clicks || 0) - (a.clicks || 0)),
        count: prev.count + 1
      }));
    }
  }, [game.listUsers]);

  const checkOrderArray = (arr1: GameUser[], arr2: GameUser[]) => {
    if (arr1.length !== arr2.length) return false;
    for (let x = 0; x < arr1.length; x++) {
      if (arr1[x].key !== arr2[x].key) {
        return false;
      }
    }
    return true;
  };

  const OpponentsText = () => (
    <span>
      {t("Opponents")} ({game.listUsers.length - 1}/{maxUsers - 1})
    </span>
  );

  return (
    <div className="w-full md:w-1/2 max-h-full text-sm md:text-3xl px-4 md:px-0 font-medium h-full flex flex-col min-h-0">
      <h4 className="text-xl md:text-5xl text-center md:text-start font-bold mb-4 md:mb-12 text-primary-600 dark:text-primary-200">
        {game.listUsers.length === 1 && isHost ? (
          t("Waiting for opponents...")
        ) : (
          <OpponentsText />
        )}
      </h4>
      <div className="flex flex-row mb-2 md:mb-5 text-primary-600 dark:text-primary-200">
        <div className="w-5/6">
          <p className="mb-2">{t("Name")}</p>
        </div>
        <div className="w-1/6 text-center">Clicks</div>
      </div>
      <div className="opponents-container flex flex-row min-w-0 overflow-y-auto max-h-full min-h-0 pl-1 pt-1">
        <div className="w-5/6">
          <OpponentList
            countPositions={countPositions}
            localUsername={localUsername}
            isHost={isHost}
          />
        </div>
        <div className="w-1/6 text-center ">
          {game.listUsers
            .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
            .map((user, i) => {
              return (
                <div key={i} className="h-12 md:h-20 mb-3 content-center">
                  {user.clicks}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

export default OpponentSection;
