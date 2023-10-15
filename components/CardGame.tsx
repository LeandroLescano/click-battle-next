import {IconProp} from "@fortawesome/fontawesome-svg-core";
import {faLock, faUser} from "@fortawesome/free-solid-svg-icons";

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {Game} from "interfaces";
import React from "react";

type AppProps = {
  game: [string, Game];
  handleEnterGame: VoidFunction;
  roomNumber: number;
};

export const CardGame = ({game, handleEnterGame, roomNumber}: AppProps) => {
  return (
    <div className="col col-card mb-3">
      {/* <Link
        href={
          game[1].listUsers &&
          Object.keys(game[1].listUsers).length === game[1].maxUsers
            ? "/"
            : `/game/${game[0]}`
        }
      > */}
      <div
        className="card card-room shadow-sm"
        onClick={() => handleEnterGame()}
      >
        <div className={`card-body ${game[1].visitorUser ? "card-full" : ""}`}>
          <p>
            <b>
              {game[1].roomName !== ""
                ? game[1].roomName
                : `Sala N°${roomNumber}`}
              {game[1].password ? (
                <FontAwesomeIcon icon={faLock as IconProp} className="mx-1" />
              ) : null}
            </b>
          </p>
          <span>
            Owner: <br />
            {game[1].ownerUser.username}
          </span>
        </div>
        <div className="txt-cant-users">
          <FontAwesomeIcon icon={faUser as IconProp} className="mx-1" />
          {game[1].listUsers
            ? `${Object.keys(game[1].listUsers).length}/${game[1].maxUsers}`
            : `1/${game[1].maxUsers}`}
        </div>
      </div>
      {/* </Link> */}
    </div>
  );
};
