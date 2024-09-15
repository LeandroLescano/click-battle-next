import React from "react";
import {getDatabase, ref, update} from "firebase/database";
import {useParams} from "next/navigation";
import {Flipped, Flipper} from "react-flip-toolkit";
import Swal from "sweetalert2";
import {useTranslation} from "react-i18next";

import {GameUser} from "interfaces";
import {useGame} from "contexts/GameContext";

interface Props {
  countPositions: {
    count: number;
    list: GameUser[];
  };
  localUsername: string;
}

const OpponentList = ({countPositions, localUsername}: Props) => {
  const pathIdGame = useParams()?.roomGame;
  const db = getDatabase();
  const {t} = useTranslation();
  const {isHost} = useGame();

  const kickUser = (userKey: string | null) => {
    if (userKey) {
      const userRef = ref(db, `games/${pathIdGame}/listUsers/${userKey}`);
      update(userRef, {kickOut: true}).then(() => {
        Swal.fire({
          title: "The user has been kicked.",
          icon: "success",
          toast: true,
          showConfirmButton: false,
          position: "bottom-end",
          timer: 2500
        });
      });
    }
  };

  const FlipItem = ({
    username,
    userKey
  }: {
    username: string;
    userKey: string;
  }) => {
    return (
      <Flipped key={userKey} flipId={userKey}>
        <div className="visitor-container">
          <div
            className={`row row-user ${
              localUsername === username && "local-row"
            }`}
          >
            <div className="col text-start">{username}</div>
            {isHost && localUsername !== username && (
              <div
                className="col-auto btn-kick"
                onClick={() => {
                  kickUser(userKey || null);
                }}
              >
                {t("Kick")}
              </div>
            )}
          </div>
        </div>
      </Flipped>
    );
  };

  return (
    <Flipper flipKey={countPositions.count}>
      {countPositions.list.map((user, i) => {
        return (
          <FlipItem username={user.username} key={i} userKey={user.key || ""} />
        );
      })}
    </Flipper>
  );
};

export default React.memo(OpponentList);
