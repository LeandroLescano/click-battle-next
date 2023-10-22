import {IconProp} from "@fortawesome/fontawesome-svg-core";
import {faLock, faUser} from "@fortawesome/free-solid-svg-icons";

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {Game} from "interfaces";
import React from "react";

type AppProps = {
  game: Game;
  handleEnterGame: VoidFunction;
  roomNumber: number;
};

export const CardGame = ({game, handleEnterGame, roomNumber}: AppProps) => {
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
                {game.password ? (
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
              ? `${Object.keys(game.listUsers).length}/${game.maxUsers}`
              : `1/${game.maxUsers}`}
          </div>
        </div>
      </div>
    )
  );
};
