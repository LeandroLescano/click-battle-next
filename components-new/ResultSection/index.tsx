import {get, getDatabase, ref, update} from "firebase/database";
import React from "react";
import {useTranslation} from "react-i18next";

import {Button} from "components-new/Button";
import {Card} from "components-new/Card";
import {useGame} from "contexts/GameContext";
import {Trophy} from "icons/Trophy";
import {Game} from "interfaces";
import {getSuffixPosition} from "utils/string";

import "./styles.scss";

const ResultSection = () => {
  const db = getDatabase();
  const {t} = useTranslation();
  const {game, isHost, finalResults} = useGame();

  // function for reset all data
  const handleReset = () => {
    const refGame = ref(db, `games/${game.key}`);
    const resetGame: Partial<Game> = {
      status: "lobby",
      startTime: null
    };

    update(refGame, resetGame);
    const refGameUsers = ref(db, `games/${game.key}/listUsers`);
    get(refGameUsers).then((snapshot) => {
      snapshot.forEach((child) => {
        update(child.ref, {clicks: 0});
      });
    });
  };

  finalResults?.results.sort((a, b) =>
    (a.clicks || 0) < (b.clicks || 0) ? 1 : -1
  );

  return (
    <>
      <div
        id="result-container"
        className="text-center flex flex-col h-full justify-evenly min-h-0 px-4 md:px-0"
      >
        <div className="flex flex-col gap-3 h-full overflow-hidden">
          <p className="text-2xl md:text-4xl">{game?.roomName || ""}</p>
          <h1
            id="result"
            className="no-select uppercase text-6xl md:text-9xl font-extrabold"
          >
            {t("resultPosition", {position: finalResults?.localPositionSuffix})}
          </h1>
          <h3 className="text-2xl md:text-6xl flex gap-1.5 md:gap-3 justify-center items-center">
            <Trophy />
            <b className="text-primary-300">
              {finalResults?.results[0].username}{" "}
            </b>
            {t("with n clicks!", {
              clicks: finalResults?.results[0].clicks
            })}
          </h3>
          <div className="result-list flex flex-col gap-6 items-center pt-1 min-h-0 overflow-y-auto pl-1 md:pl-0">
            {finalResults?.results.map((user, i) => {
              if (i === 0) return null;

              return (
                <Card
                  key={i}
                  className="w-full sm:w-3/4 text-sm md:text-3xl flex pl-2 pr-4 py-3 md:px-5 md:py-6 justify-between text-primary-500 max-w-2xl"
                >
                  <div>
                    <b className="mr-5">
                      {t("resultPosition", {
                        position: getSuffixPosition(i + 1, t)
                      })}
                    </b>{" "}
                    {user.username}
                  </div>
                  <b>{user.clicks}</b>
                </Card>
              );
            })}
          </div>
        </div>
        {isHost && (
          <Button
            className="mt-5 w-full md:w-80 px-3.5 py-2.5 md:p-5 text-2xl md:text-3xl self-center z-50"
            onClick={handleReset}
          >
            {t("Reset")}
          </Button>
        )}
      </div>
    </>
  );
};

export default ResultSection;
