import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import React from "react";
import {Game, GameUser} from "interfaces";
import {faTrophy} from "@fortawesome/free-solid-svg-icons";
import {IconProp} from "@fortawesome/fontawesome-svg-core";
import {get, getDatabase, ref, update} from "firebase/database";

interface ResultSectionProps {
  localPosition: string | undefined;
  listUsers: Array<GameUser>;
  localUser: GameUser;
  isLocal: boolean;
  currentGame: Game;
}

function ResultSection({
  listUsers,
  localPosition,
  localUser,
  isLocal,
  currentGame
}: ResultSectionProps) {
  const db = getDatabase();

  // function for reset all data
  const handleReset = () => {
    const refGame = ref(db, `games/${currentGame.key}`);
    update(refGame, {
      timer: currentGame.timer,
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
          Result - {localPosition} place
        </h1>
        {listUsers
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
                <b>{user.username}</b> with {user.clicks} clicks!
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
      {isLocal && (
        <button className="btn-click mt-5" onClick={handleReset}>
          Reset
        </button>
      )}
    </div>
  );
}

export default ResultSection;
