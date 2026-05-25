import {GameUser} from "@leandrolescano/click-battle-core";
import {getDatabase, ref, update} from "firebase/database";
import {useParams} from "next/navigation";
import React, {useEffect, useMemo, useState} from "react";
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

  const sortedUsers = useMemo(
    () => [...game.listUsers].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)),
    [game.listUsers]
  );
  const latestUsersByKey = useMemo(
    () =>
      new Map(
        game.listUsers.map((user, index) => [getUserKey(user, index), user])
      ),
    [game.listUsers]
  );

  useEffect(() => {
    if (!checkOrderArray(countPositions.list, sortedUsers)) {
      setCountPositions((prev) => ({
        list: sortedUsers,
        count: prev.count + 1
      }));
    }
  }, [countPositions.list, sortedUsers]);

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

  const orderedUsers = countPositions.list.length
    ? countPositions.list
    : sortedUsers;

  const leaderboardRows = orderedUsers.map((orderedUser, index) => {
    const rowKey = getUserKey(orderedUser, index);
    const user = latestUsersByKey.get(rowKey) ?? orderedUser;

    return {
      key: rowKey,
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
    };
  });

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
        flipKey={countPositions.count}
      />
    </div>
  );
}

const getUserKey = (user: GameUser, index: number) =>
  user.key || user.username || `user-${index}`;

const checkOrderArray = (arr1: GameUser[], arr2: GameUser[]) => {
  if (arr1.length !== arr2.length) return false;
  for (let index = 0; index < arr1.length; index++) {
    if (getUserKey(arr1[index], index) !== getUserKey(arr2[index], index)) {
      return false;
    }
  }
  return true;
};

export default OpponentSection;
