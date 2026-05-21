import {GameUser} from "@leandrolescano/click-battle-core";
import {getDatabase, ref, update} from "firebase/database";
import {useParams} from "next/navigation";
import React, {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import Swal from "sweetalert2";

import {RoomLeaderboard} from "components-new/RoomLeaderboard";
import {useGame} from "contexts/GameContext";

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
  const db = getDatabase();
  const {gameID} = useParams();

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

  const leaderboardRows = countPositions.list.map((user, index) => ({
    key: user.key || `${user.username}-${index}`,
    primary: user.username,
    value: String(user.clicks || 0),
    highlighted: localUsername === user.username,
    action:
      isHost && localUsername !== user.username
        ? {
            label: t("Kick"),
            onClick: () => {
              kickUser(user.key || null);
            }
          }
        : undefined
  }));

  return (
    <div className="w-full md:w-1/2 max-h-full text-sm md:text-3xl px-4 md:px-0 font-medium h-full flex flex-col min-h-0">
      <RoomLeaderboard
        title={
          game.listUsers.length === 1 && isHost
            ? t("Waiting for opponents...")
            : t("Opponents") + ` (${game.listUsers.length - 1}/${maxUsers - 1})`
        }
        leftLabel={t("Name")}
        rightLabel={t("Clicks")}
        rows={leaderboardRows}
      />
    </div>
  );
}

export default OpponentSection;
