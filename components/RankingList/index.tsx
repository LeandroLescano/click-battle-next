"use client";

import React, {useEffect, useState} from "react";
import {Toast, ToastContainer} from "react-bootstrap";
import {getAnalytics, logEvent} from "firebase/analytics";
import {useTranslation} from "react-i18next";

import {useAuth} from "contexts/AuthContext";
import {ModalLogin} from "components/ModalLogin";

import {RankingListProps} from "./types";

const RankComponent: Record<string, keyof JSX.IntrinsicElements> = {
  1: "h2",
  2: "h3",
  3: "h4",
  default: "span"
};

export const RankingList = ({users}: RankingListProps) => {
  const [usersList, setUsersList] = useState(users);
  const [possiblePos, setPossiblePos] = useState<number>();
  const [hideToast, setHideToast] = useState(false);
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

  const handleHideToast = () => setHideToast(true);

  const toggleModal = () => {
    setShowModal((prev) => !prev);
    logEvent(getAnalytics(), "toggle_modal_from_motivation", {
      action: "toggle_modal_from_motivation",
      possiblePos
    });
  };

  return (
    <>
      {usersList
        .sort((a, b) => b.cps - a.cps)
        .map((user, i) => {
          const Component = RankComponent[i + 1] || RankComponent.default;

          return (
            <Component
              key={user.key}
              className={`d-flex justify-content-between border-bottom p-2 rounded-3 mb-0 ${
                gameUser?.username === user.username && "bg-primary text-white"
              }`}
            >
              <span>
                {i + 1}. {user.username || "???????"}
              </span>
              <span className="text-lowercase">
                {user.cps} cps ({user.time}s)
              </span>
            </Component>
          );
        })}
      <ToastContainer position="bottom-center" className="mb-2">
        <Toast
          show={
            !hideToast && !showModal && !loading && (!user || user.isAnonymous)
          }
          animation
        >
          <Toast.Body className="d-flex gap-2 align-items-center py-3">
            {!possiblePos ? (
              <>
                {t("You want to be here?")}{" "}
                <button className="btn-click small" onClick={toggleModal}>
                  {t("Sign up")}
                </button>{" "}
                {t("and play!")}
                <button className="btn btn-close" onClick={handleHideToast} />
              </>
            ) : (
              <>
                {t(
                  "Wow! You're at position N on the leaderboard! Want to claim your spot and keep playing?"
                )}
                <button className="btn-click small" onClick={toggleModal}>
                  {t("Sign up")}
                </button>
                <button className="btn btn-close" onClick={handleHideToast} />
              </>
            )}
          </Toast.Body>
        </Toast>
      </ToastContainer>
      <ModalLogin
        allowAnonymous={false}
        show={showModal}
        onClose={toggleModal}
      />
    </>
  );
};
