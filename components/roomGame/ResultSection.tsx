import React from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faTrophy} from "@fortawesome/free-solid-svg-icons";
import {IconProp} from "@fortawesome/fontawesome-svg-core";
import {get, getDatabase, ref, update} from "firebase/database";
import {useTranslation} from "react-i18next";

import {Game, GameUser} from "interfaces";
import {useGame} from "contexts/GameContext";

interface ResultSectionProps {
  localUser: GameUser;
  currentGame: Game;
}

function ResultSection({localUser, currentGame}: ResultSectionProps) {
  const db = getDatabase();
  const {t} = useTranslation();
  const {game, localPosition, isHost} = useGame();

  // function for reset all data
  const handleReset = () => {
    const refGame = ref(db, `games/${currentGame.key}`);
    update(refGame, {
      timer: currentGame.settings.timer || 10,
      gameStart: false,
      timeStart: 3,
      currentGame: false
    });
    const refGameUsers = ref(db, `games/${currentGame.key}/listUsers`);
    get(refGameUsers).then((snapshot) => {
      snapshot.forEach((child) => {
        update(child.ref, {clicks: 0});
      });
    });
  };

  return (
    <div
      id="result-container"
      className="result-container text-center mb-2 d-flex flex-column h-100 justify-content-evenly flex-fill"
    >
      <div>
        <h1 id="result" className="no-select">
          {t("Result position", {position: localPosition})}
        </h1>
        {game.listUsers
          .sort((a, b) => ((a.clicks || 0) < (b.clicks || 0) ? 1 : -1))
          .map((user, i) => {
            return (
              <p
                key={i}
                className={`row-user ${
                  user.username === localUser.username ? "local-row" : ""
                }`}
              >
                {i === 0 && (
                  <FontAwesomeIcon
                    icon={faTrophy as IconProp}
                    className="mx-1"
                  />
                )}
                <b>{user.username}</b>{" "}
                {t("with n clicks!", {clicks: user.clicks})}
                {i === 0 && (
                  <FontAwesomeIcon
                    icon={faTrophy as IconProp}
                    className="mx-1"
                  />
                )}
              </p>
            );
          })}
      </div>
      {isHost && (
        <button className="btn-click mt-5" onClick={handleReset}>
          {t("Reset")}
        </button>
      )}
    </div>
  );
}

export default ResultSection;
