"use client";

import classNames from "clsx";
import {getAnalytics, logEvent} from "firebase/analytics";
import React, {useEffect, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";

import {LoginModal} from "components-new";
import {Card} from "components-new/Card";
import {
  RankingEntry,
  ReactionRankingEntry,
  RankingMode
} from "components-new/Ranking/types";
import {useAuth} from "contexts/AuthContext";

import {RankingListProps} from "./types";
import "./styles.scss";

const sortEntries = (entries: RankingEntry[], mode: RankingMode) => {
  const items = [...entries];

  if (mode === "reaction") {
    return items.sort((left, right) => {
      const leftReaction = (left as ReactionRankingEntry).reactionMs;
      const rightReaction = (right as ReactionRankingEntry).reactionMs;

      if (leftReaction !== rightReaction) {
        return leftReaction - rightReaction;
      }

      return (
        (right as ReactionRankingEntry).roundsWon -
        (left as ReactionRankingEntry).roundsWon
      );
    });
  }

  return items.sort(
    (left, right) =>
      (right as Extract<RankingEntry, {mode: "classic-speed"}>).cps -
      (left as Extract<RankingEntry, {mode: "classic-speed"}>).cps
  );
};

export const RankingList = ({mode, users}: RankingListProps) => {
  const [usersList, setUsersList] = useState(users);
  const [possiblePos, setPossiblePos] = useState<number>();
  const [showModal, setShowModal] = useState(false);
  const {gameUser, loading, user} = useAuth();
  const {t} = useTranslation();

  useEffect(() => {
    setUsersList(users);
  }, [users]);

  useEffect(() => {
    if (mode !== "classic-speed") {
      setPossiblePos(undefined);
      return;
    }

    const hasMaxScores = gameUser?.maxScores && gameUser.maxScores.length > 0;
    const hasCurrentUserInEntries = usersList.some(
      (entry) => entry.username === gameUser?.username
    );

    if (user && !user.isAnonymous && hasMaxScores && !hasCurrentUserInEntries) {
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
          mode: "classic-speed",
          time,
          key: user.uid
        }
      ]);
    }

    if (user?.isAnonymous && hasMaxScores) {
      const cps = Math.max(
        ...gameUser.maxScores!.map((score) => score.clicks / score.time)
      );

      let position = sortEntries(usersList, mode).findIndex((entry) => {
        if (entry.mode !== "classic-speed") return false;
        return entry.cps <= cps;
      });

      position = position !== -1 ? position + 1 : usersList.length + 1;

      setPossiblePos(position);
    }
  }, [gameUser, mode, user, usersList]);

  const sortedEntries = useMemo(
    () => sortEntries(usersList, mode),
    [mode, usersList]
  );

  const toggleModal = () => {
    setShowModal((prev) => !prev);
    logEvent(getAnalytics(), "toggle_modal_from_motivation", {
      action: "toggle_modal_from_motivation",
      mode,
      possiblePos
    });
  };

  const emptyCopy =
    mode === "reaction"
      ? t("No reaction winners yet")
      : t("No classic scores yet");

  const promoCopy =
    mode === "reaction"
      ? t("Win a reaction round and your best finish can land here.")
      : t("You want to be here?");

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="click-master-list flex min-h-0 flex-1 flex-col gap-6 overflow-auto pt-1 xl:max-w-[57rem]">
        {sortedEntries.length === 0 ? (
          <Card className="mx-auto flex w-full max-w-4xl items-center justify-center p-8 text-center text-base font-bold text-primary-500 md:p-12 md:text-3xl">
            {emptyCopy}
          </Card>
        ) : (
          sortedEntries.map((entry, i) => {
            const ownClasses = "text-primary-50 bg-primary-300";
            const isCurrentUser = gameUser?.username === entry.username;
            const scoreLabel =
              entry.mode === "reaction"
                ? `${entry.reactionMs} ms`
                : `${entry.cps} cps (${entry.time}s)`;
            const metaLabel =
              entry.mode === "reaction"
                ? `${entry.roundsWon} ${t("wins")}`
                : null;

            return (
              <div
                key={entry.key}
                className="flex w-full max-w-4xl self-center items-center gap-3 md:gap-6"
              >
                <span className="w-1/12 text-center text-lg font-extrabold text-primary-600 dark:text-primary-200 md:text-5xl">
                  {i + 1}.
                </span>
                <Card
                  className={classNames(
                    "mb-0 flex w-11/12 items-center justify-between gap-4 p-2.5 text-sm font-bold text-primary-500 md:px-5 md:py-6 md:text-3xl",
                    isCurrentUser && ownClasses
                  )}
                >
                  <span className="min-w-0 truncate">
                    {entry.username || "???????"}
                  </span>
                  <span className="flex shrink-0 flex-col items-end text-right leading-none">
                    <span className="text-lowercase">{scoreLabel}</span>
                    {metaLabel && (
                      <span className="mt-1 text-sm uppercase text-primary-400 md:text-xl">
                        {metaLabel}
                      </span>
                    )}
                  </span>
                </Card>
              </div>
            );
          })
        )}
      </div>
      {!showModal && !loading && (!user || user.isAnonymous) && (
        <Card className="mx-auto w-fit max-w-full px-5 py-4 text-sm text-primary-400 md:py-6 md:text-3xl">
          {mode === "classic-speed" && possiblePos ? (
            <div className="flex flex-col items-center gap-2 px-4 text-center md:flex-row md:gap-8 md:text-left">
              <span>
                {t(
                  "Wow! You're at position N on the leaderboard! Want to claim your spot and keep playing?",
                  {position: possiblePos}
                )}
              </span>
              <span
                className="cursor-pointer font-bold underline"
                onClick={toggleModal}
              >
                {t("Sign up")}
              </span>
            </div>
          ) : (
            <>
              {promoCopy}{" "}
              <span
                className="cursor-pointer font-bold underline"
                onClick={toggleModal}
              >
                {t("Sign up")}
              </span>{" "}
              {t("and play!")}
            </>
          )}
        </Card>
      )}
      <LoginModal
        allowAnonymous={false}
        show={showModal}
        onClose={toggleModal}
      />
    </div>
  );
};
