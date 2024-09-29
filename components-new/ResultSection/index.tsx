import React from "react";
import {get, getDatabase, ref, update} from "firebase/database";
import {useTranslation} from "react-i18next";

import {useGame} from "contexts/GameContext";
import {Button} from "components-new/Button";
import {Trophy} from "icons/Trophy";
import {Card} from "components-new/Card";
import {getSuffixPosition} from "utils/string";

import "./styles.scss";

const ResultSection = () => {
  const db = getDatabase();
  const {t} = useTranslation();
  const {game, localPosition, isHost} = useGame();

  // function for reset all data
  const handleReset = () => {
    const refGame = ref(db, `games/${game.key}`);
    update(refGame, {
      timer: game.settings.timer || 10,
      gameStart: false,
      timeStart: 3,
      currentGame: false
    });
    const refGameUsers = ref(db, `games/${game.key}/listUsers`);
    get(refGameUsers).then((snapshot) => {
      snapshot.forEach((child) => {
        update(child.ref, {clicks: 0});
      });
    });
  };

  game.listUsers.sort((a, b) => ((a.clicks || 0) < (b.clicks || 0) ? 1 : -1));

  return (
    <div
      id="result-container"
      className="text-center flex flex-col h-full justify-evenly min-h-0"
    >
      <div className="flex flex-col gap-3 h-full overflow-hidden">
        <p className="text-4xl">{game?.roomName || ""}</p>
        <h1 id="result" className="no-select uppercase text-9xl font-extrabold">
          {t("Result position", {position: localPosition})}
        </h1>
        <h3 className="text-6xl flex gap-3 justify-center">
          <Trophy />
          <b className="text-primary-300">{game.listUsers[0].username} </b>
          {t("with n clicks!", {clicks: game.listUsers[0].clicks})}
        </h3>
        <div className="result-list flex flex-col gap-6 items-center pt-1 min-h-0 overflow-y-auto">
          {game.listUsers.map((user, i) => {
            if (i === 0) return null;

            return (
              <Card
                key={i}
                className={`w-full sm:w-3/4 text-3xl flex px-5 py-6 justify-between text-primary-500`}
              >
                <div>
                  <b className="mr-5">
                    {t("Result position", {
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
          className="mt-5 w-80 p-5 text-3xl self-center"
          onClick={handleReset}
        >
          {t("Reset")}
        </Button>
      )}
    </div>
  );
};

export default ResultSection;
