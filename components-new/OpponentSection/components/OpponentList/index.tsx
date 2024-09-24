import React from "react";
import {getDatabase, ref, update} from "firebase/database";
import {useParams} from "next/navigation";
import {Flipped, Flipper} from "react-flip-toolkit";
import Swal from "sweetalert2";
import {useTranslation} from "react-i18next";

import {GameUser} from "interfaces";
import {Button} from "components-new/Button";

interface OpponentListProps {
  countPositions: {
    count: number;
    list: GameUser[];
  };
  localUsername: string;
  isHost: boolean;
}

interface FlipItemProps {
  username: string;
  userKey: string;
  isHost: boolean;
}

const OpponentList = ({
  countPositions,
  localUsername,
  isHost
}: OpponentListProps) => {
  const {gameID} = useParams();
  const db = getDatabase();
  const {t} = useTranslation();

  const kickUser = (userKey: string | null) => {
    if (userKey) {
      const userRef = ref(db, `games/${gameID}/listUsers/${userKey}`);
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

  const FlipItem = ({username, userKey, isHost}: FlipItemProps) => {
    return (
      <Flipped key={userKey} flipId={userKey}>
        <div
          className={`opponent-row flex justify-between ${
            localUsername === username ? "local" : ""
          }`}
        >
          <div className="col text-start">{username}</div>
          {isHost && localUsername !== username && (
            <Button
              variant="outlined"
              className="px-2 text-2xl"
              onClick={() => {
                kickUser(userKey || null);
              }}
            >
              <span className="text-primary-500">{t("Kick")}</span>
            </Button>
          )}
        </div>
      </Flipped>
    );
  };

  return (
    <Flipper flipKey={countPositions.count}>
      {countPositions.list.map((user, i) => {
        return (
          <FlipItem
            username={user.username}
            key={i}
            userKey={user.key || ""}
            isHost={isHost}
          />
        );
      })}
    </Flipper>
  );
};

export default React.memo(OpponentList);
