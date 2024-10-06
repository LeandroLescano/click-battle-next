"use client";

import React, {useEffect, useState} from "react";
import {getAnalytics, logEvent} from "firebase/analytics";
import {useTranslation} from "react-i18next";
import clsx from "clsx";

import {useAuth} from "contexts/AuthContext";
import {LoginModal} from "components-new";
import {Card} from "components-new/Card";

import {RankingListProps} from "./types";
import "./styles.scss";

export const RankingList = ({users}: RankingListProps) => {
  const [usersList, setUsersList] = useState(users);
  const [possiblePos, setPossiblePos] = useState<number>();
  const [showModal, setShowModal] = useState(false);
  const {gameUser, loading, user} = useAuth();
  const {t} = useTranslation();

  useEffect(() => {
    const hasMaxScores = gameUser?.maxScores && gameUser.maxScores.length > 0;

    if (
      user &&
      !user.isAnonymous &&
      hasMaxScores &&
      !usersList.find((user) => user.username === gameUser?.username)
    ) {
      const cps = Math.max(
        ...gameUser.maxScores!.map((score) => score.clicks / score.time)
      );
      const time =
        gameUser.maxScores!.find((ms) => ms.clicks / ms.time === cps)?.time ||
        10;

      setUsersList((prev) => [
        ...prev,
        {
          ...gameUser,
          maxScores: gameUser.maxScores!,
          cps,
          time,
          key: user.uid
        }
      ]);
    }

    if (user?.isAnonymous && hasMaxScores) {
      const cps = Math.max(
        ...gameUser.maxScores!.map((score) => score.clicks / score.time)
      );

      let position = usersList
        .sort((a, b) => b.cps - a.cps)
        .findIndex((u) => u.cps <= cps);

      position = position !== -1 ? position + 1 : usersList.length + 1;

      setPossiblePos(position);
    }
  }, [user, gameUser]);

  const toggleModal = () => {
    setShowModal((prev) => !prev);
    logEvent(getAnalytics(), "toggle_modal_from_motivation", {
      action: "toggle_modal_from_motivation",
      possiblePos
    });
  };

  return (
    <>
      <div className="click-master-list flex flex-col gap-6 min-h-0 overflow-auto pt-1">
        {usersList
          .sort((a, b) => b.cps - a.cps)
          .map((user, i) => {
            const ownClasses = "text-primary-50 bg-primary-300";
            return (
              <div
                key={user.key}
                className="flex w-full items-center gap-3 md:gap-6 max-w-4xl self-center"
              >
                <span className="text-lg md:text-5xl font-extrabold text-primary-600 dark:text-primary-200 w-1/12 text-center">
                  {i + 1}.
                </span>
                <Card
                  className={clsx(
                    "flex w-11/12 justify-between p-2.5 md:px-5 md:py-6 mb-0 text-sm md:text-3xl font-bold text-primary-500",
                    gameUser?.username === user.username && ownClasses
                  )}
                >
                  <span>{user.username || "???????"}</span>
                  <span className="text-lowercase">
                    {user.cps} cps ({user.time}s)
                  </span>
                </Card>
              </div>
            );
          })}
      </div>
      {!showModal && !loading && (!user || user.isAnonymous) && (
        <Card className="px-5 py-4 md:py-6 text-sm md:text-3xl text-primary-400 w-fit self-center mx-2 md:mx-0">
          {!possiblePos ? (
            <>
              {t("You want to be here?")}{" "}
              <span
                className="cursor-pointer underline font-bold"
                onClick={toggleModal}
              >
                {t("Sign up")}
              </span>{" "}
              {t("and play!")}
            </>
          ) : (
            <div className="flex px-4 flex-col items-center gap-2 md:gap-8 md:flex-row text-center md:text-left">
              <span>
                {t(
                  "Wow! You're at position N on the leaderboard! Want to claim your spot and keep playing?",
                  {position: 2}
                )}
              </span>
              <span
                className="cursor-pointer underline font-bold"
                onClick={toggleModal}
              >
                {t("Sign up")}
              </span>
            </div>
          )}
        </Card>
      )}
      <LoginModal
        allowAnonymous={false}
        show={showModal}
        onClose={toggleModal}
      />
    </>
  );
};
