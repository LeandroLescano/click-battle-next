import {IconProp} from "@fortawesome/fontawesome-svg-core";
import {faLock, faUser} from "@fortawesome/free-solid-svg-icons";

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {Game} from "interfaces";
import React from "react";

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
  return (
    game.ownerUser && (
      <div className="col col-card mb-3">
        <div
          className="card card-room shadow-sm"
          onClick={() => handleEnterGame()}
        >
          <div className={`card-body ${game?.visitorUser ? "card-full" : ""}`}>
            <p>
              <b>
                {game.roomName !== "" ? game.roomName : `Room N°${roomNumber}`}
                {game.settings.password ? (
                  <FontAwesomeIcon icon={faLock as IconProp} className="mx-1" />
                ) : null}
              </b>
            </p>
            <span>
              Owner: <br />
              {game.ownerUser?.username}
            </span>
          </div>
          <div className="txt-cant-users">
            <FontAwesomeIcon icon={faUser as IconProp} className="mx-1" />
            {game.listUsers
              ? `${Object.keys(game.listUsers).length}/${
                  game.settings.maxUsers
                }`
              : `1/${game.settings.maxUsers}`}
          </div>
        </div>
      </div>
    )
  );
};
