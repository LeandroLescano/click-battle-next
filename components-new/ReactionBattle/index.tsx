"use client";

import {GameUser} from "@leandrolescano/click-battle-core";
import {getDatabase, ref, serverTimestamp, update} from "firebase/database";
import {useEffect, useMemo, useRef, useState} from "react";
import {useTranslation} from "react-i18next";

import {Button} from "components-new/Button";
import {Card} from "components-new/Card";
import {RoomLeaderboard} from "components-new/RoomLeaderboard";
import {useAuth} from "contexts/AuthContext";
import {useGame} from "contexts/GameContext";
import {Trophy} from "icons/Trophy";
import {ReactionResult, ReactionSession} from "interfaces";
import {
  DEFAULT_REACTION_SYNC_BUFFER_MS,
  MAX_REACTION_DELAY_MS,
  MIN_REACTION_DELAY_MS,
  buildReactionResultList,
  createReactionSession,
  getReactionWinner,
  getReactionWindowMs,
  haveAllPlayersReacted
} from "lib/game/reactionBattle";
import {
  estimateServerNow,
  useServerTimeOffset
} from "lib/game/serverTimeOffset";
import {getSuffixPosition} from "utils/string";

type ReactionBattleProps = {
  idGame: string;
  localUser: GameUser;
};

type StagePlayer = {
  playerKey: string;
  username: string;
  status: ReactionResult["status"];
  reactionMs?: number;
};

const ReactionBattle = ({idGame, localUser}: ReactionBattleProps) => {
  const db = getDatabase();
  const serverTimeOffset = useServerTimeOffset();
  const {t} = useTranslation();
  const {user, gameUser} = useAuth();
  const {game: currentGame, isHost} = useGame();
  const session = currentGame.reactionSession;
  const localPlayerKey = user?.uid || localUser?.key || "";
  const signalShownAtRef = useRef<number | null>(null);
  const promotedSignalAtRef = useRef<number | null>(null);
  const finalizedSignalAtRef = useRef<number | null>(null);
  const [localSignalVisible, setLocalSignalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isRoundFinished = session?.status === "ended";

  const reactionWindowMs = getReactionWindowMs(currentGame.modeSettings);
  const estimatedNow = estimateServerNow(serverTimeOffset);
  const signalAt = session?.signalAt ?? null;
  const signalReached = Boolean(signalAt && estimatedNow >= signalAt);
  const isWaitingForOpponent = currentGame.listUsers.length < 2;

  const participantResults = useMemo(
    () =>
      buildReactionResultList(currentGame.listUsers, session?.results).sort(
        (left, right) => {
          const leftScore =
            left.status === "valid"
              ? left.reactionMs ?? Number.MAX_SAFE_INTEGER
              : Number.MAX_SAFE_INTEGER;
          const rightScore =
            right.status === "valid"
              ? right.reactionMs ?? Number.MAX_SAFE_INTEGER
              : Number.MAX_SAFE_INTEGER;

          if (leftScore !== rightScore) {
            return leftScore - rightScore;
          }

          const leftPriority = getStatusPriority(left.status);
          const rightPriority = getStatusPriority(right.status);

          if (leftPriority !== rightPriority) {
            return leftPriority - rightPriority;
          }

          return left.username.localeCompare(right.username);
        }
      ),
    [currentGame.listUsers, session?.results]
  );

  const localResult = localPlayerKey
    ? session?.results?.[localPlayerKey]
    : undefined;
  const winner = useMemo(
    () => getReactionWinner(currentGame.listUsers, session?.results),
    [currentGame.listUsers, session?.results]
  );
  const winnerReactionMs = winner?.reactionMs ?? null;
  const localPlacement = participantResults.findIndex(
    (player) => player.playerKey === localPlayerKey
  );
  const localPlacementLabel =
    localPlacement >= 0 ? getSuffixPosition(localPlacement + 1, t) : null;
  const isLocalWinner = winner?.playerKey === localPlayerKey;
  const localGapMs =
    !isLocalWinner &&
    localResult?.status === "valid" &&
    typeof localResult.reactionMs === "number" &&
    typeof winnerReactionMs === "number"
      ? Math.max(0, localResult.reactionMs - winnerReactionMs)
      : null;
  const endedRows = participantResults.filter(
    (player) => player.status !== "waiting"
  );

  useEffect(() => {
    if (
      !signalAt ||
      session?.status === "ended" ||
      session?.status === "waiting"
    ) {
      signalShownAtRef.current = null;
      setLocalSignalVisible(false);
      return;
    }

    if (signalReached) {
      if (!signalShownAtRef.current) {
        signalShownAtRef.current = Date.now();
      }
      setLocalSignalVisible(true);
      return;
    }

    setLocalSignalVisible(false);
    signalShownAtRef.current = null;
    const timeoutId = window.setTimeout(
      () => {
        if (!signalShownAtRef.current) {
          signalShownAtRef.current = Date.now();
        }
        setLocalSignalVisible(true);
      },
      Math.max(0, signalAt - estimatedNow)
    );

    return () => window.clearTimeout(timeoutId);
  }, [estimatedNow, signalAt, signalReached, session?.status]);

  useEffect(() => {
    if (
      !isHost ||
      !signalAt ||
      !signalReached ||
      session?.status !== "scheduled"
    ) {
      return;
    }

    if (promotedSignalAtRef.current === signalAt) {
      return;
    }

    promotedSignalAtRef.current = signalAt;
    update(ref(db, `games/${idGame}`), {
      reactionSession: {
        ...session,
        status: "signal"
      }
    });
  }, [db, idGame, isHost, session, signalAt, signalReached]);

  useEffect(() => {
    if (!isHost || !session || !signalAt || session.status === "ended") {
      return;
    }

    const shouldFinalize =
      haveAllPlayersReacted(currentGame.listUsers, session.results) ||
      estimatedNow >= signalAt + reactionWindowMs;

    if (!shouldFinalize || finalizedSignalAtRef.current === signalAt) {
      return;
    }

    finalizedSignalAtRef.current = signalAt;
    update(ref(db, `games/${idGame}`), {
      status: "ended",
      reactionSession: {
        ...session,
        status: "ended",
        winnerKey: winner?.playerKey ?? null
      }
    });
  }, [
    currentGame.listUsers,
    db,
    estimatedNow,
    idGame,
    isHost,
    reactionWindowMs,
    session,
    signalAt,
    winner?.playerKey
  ]);

  useEffect(() => {
    if (!isHost || !session || !signalAt || session.status === "ended") {
      return;
    }

    if (haveAllPlayersReacted(currentGame.listUsers, session.results)) {
      return;
    }

    const timeoutId = window.setTimeout(
      () => {
        if (finalizedSignalAtRef.current === signalAt) {
          return;
        }

        finalizedSignalAtRef.current = signalAt;
        update(ref(db, `games/${idGame}`), {
          status: "ended",
          reactionSession: {
            ...session,
            status: "ended",
            winnerKey: winner?.playerKey ?? null
          }
        });
      },
      Math.max(
        0,
        signalAt + reactionWindowMs - estimateServerNow(serverTimeOffset)
      )
    );

    return () => window.clearTimeout(timeoutId);
  }, [
    currentGame.listUsers,
    db,
    idGame,
    isHost,
    reactionWindowMs,
    serverTimeOffset,
    session,
    signalAt,
    winner?.playerKey
  ]);

  const updateReactionSession = async (
    nextSession: ReactionSession,
    nextStatus?: "lobby" | "countdown" | "playing" | "ended"
  ) => {
    await update(ref(db, `games/${idGame}`), {
      reactionSession: nextSession,
      ...(nextStatus ? {status: nextStatus} : {})
    });
  };

  const handleStartRound = async () => {
    const signalDelayMs =
      MIN_REACTION_DELAY_MS +
      Math.floor(
        Math.random() * (MAX_REACTION_DELAY_MS - MIN_REACTION_DELAY_MS)
      );
    const signalAtMs =
      estimateServerNow(serverTimeOffset) +
      DEFAULT_REACTION_SYNC_BUFFER_MS +
      signalDelayMs;

    promotedSignalAtRef.current = null;
    finalizedSignalAtRef.current = null;
    signalShownAtRef.current = null;
    setLocalSignalVisible(false);

    await updateReactionSession(
      {
        ...createReactionSession({
          signalAt: signalAtMs,
          signalDelayMs,
          syncBufferMs: DEFAULT_REACTION_SYNC_BUFFER_MS
        }),
        createdAt: serverTimestamp()
      },
      "playing"
    );
  };

  const handleKickUser = async (playerKey: string) => {
    await update(ref(db, `games/${idGame}/listUsers/${playerKey}`), {
      kickOut: true
    });
  };

  const persistResult = async (result: ReactionResult) => {
    if (!session || !localPlayerKey) return;

    const nextResults = {
      ...(session.results || {}),
      [localPlayerKey]: result
    };
    const everyoneResponded = haveAllPlayersReacted(
      currentGame.listUsers,
      nextResults
    );
    const nextWinner = getReactionWinner(currentGame.listUsers, nextResults);

    await updateReactionSession(
      {
        ...session,
        results: nextResults,
        status: everyoneResponded ? "ended" : session.status,
        winnerKey: everyoneResponded
          ? nextWinner?.playerKey ?? null
          : session.winnerKey ?? null
      },
      everyoneResponded ? "ended" : currentGame.status
    );
  };

  const handleReactionClick = async () => {
    if (!localPlayerKey || !gameUser?.username || localResult || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      const clickedAt = Date.now();
      if (!localSignalVisible || !signalShownAtRef.current) {
        await persistResult({
          playerKey: localPlayerKey,
          username: gameUser.username,
          status: "false-start",
          clickedAt
        });
        return;
      }

      await persistResult({
        playerKey: localPlayerKey,
        username: gameUser.username,
        status: "valid",
        clickedAt,
        signalShownAt: signalShownAtRef.current,
        reactionMs: Math.max(0, clickedAt - signalShownAtRef.current)
      });
    } finally {
      setSubmitting(false);
    }
  };

  const title = (() => {
    if (!session) {
      return isWaitingForOpponent
        ? t("Waiting for opponents...")
        : t("Press start to play");
    }

    if (session.status === "ended") {
      return winner
        ? t("Reaction winner", {name: winner.username})
        : t("No winner this round");
    }

    if (localResult?.status === "false-start") {
      return t("False start");
    }

    if (localResult?.status === "valid") {
      return t("Reaction registered");
    }

    return t("Wait for the signal");
  })();

  const resultSummary = (() => {
    if (session?.status === "ended") {
      if (localResult?.status === "false-start") {
        return t("You clicked too early");
      }

      if (localResult?.status === "valid") {
        return t("Your reaction was n ms", {
          ms: localResult.reactionMs ?? 0
        });
      }

      if (typeof winnerReactionMs === "number") {
        return t("Winning reaction was n ms", {ms: winnerReactionMs});
      }

      return t("No winner this round");
    }
  })();

  const subtitle = (() => {
    if (session?.status === "ended") {
      if (typeof localGapMs === "number") {
        return t("You were n ms slower", {ms: localGapMs});
      }

      if (typeof winnerReactionMs === "number") {
        return t("Winning reaction was n ms", {ms: winnerReactionMs});
      }

      return t("The fastest valid reaction wins");
    }

    if (localResult?.status === "valid") {
      return t("Your reaction was n ms", {
        ms: localResult.reactionMs ?? 0
      });
    }

    if (localResult?.status === "false-start") {
      return t("You clicked too early");
    }

    if (isWaitingForOpponent) {
      return t("The fastest valid reaction wins");
    }

    if (session?.status === "scheduled" || session?.status === "signal") {
      return t("Tap before the signal and you lose the round");
    }

    return t("The fastest valid reaction wins");
  })();

  const canStart = isHost && currentGame.listUsers.length >= 2;
  const showStartButton =
    canStart &&
    (!session || session.status === "waiting" || session.status === "ended");
  const actionDisabled =
    submitting ||
    Boolean(localResult) ||
    !localPlayerKey ||
    !session ||
    session.status === "ended";

  const actionLabel = (() => {
    if (!session) {
      return isHost ? t("Start reaction round") : t("Waiting for host");
    }

    if (session.status === "ended") {
      return isHost ? t("Start reaction round") : t("Waiting for host");
    }

    if (localResult?.status === "false-start") {
      return t("False start");
    }

    if (localResult?.status === "valid") {
      return t("Locked in");
    }

    return localSignalVisible ? t("Click!") : t("Wait...");
  })();
  const actionTone =
    localResult?.status === "false-start"
      ? "!bg-rose-200 !border-rose-300 !text-rose-700"
      : localSignalVisible
      ? "!bg-primary-300 !border-primary-300 !text-primary-100"
      : "!bg-primary-100 !border-primary-300 !text-primary-500";
  const overlayTag = (() => {
    if (!session || session.status !== "ended") return null;
    if (localResult?.status === "false-start") return t("False start");
    if (isLocalWinner) return t("Winner");
    if (localPlacementLabel) {
      return t("resultPosition", {position: localPlacementLabel});
    }
    if (winner) {
      return t("Reaction winner", {name: winner.username});
    }
    return t("No winner this round");
  })();

  const leaderboardRows = participantResults.map((player, index) => {
    const isLocal = player.playerKey === localPlayerKey;

    return {
      key: player.playerKey,
      primary: `${index + 1}. ${player.username}`,
      secondary: getResultStatus(player, t),
      value: getResultMsLabel(player, t),
      highlighted: isLocal,
      muted: player.status === "waiting",
      action:
        isHost && !isLocal
          ? {
              label: t("Kick"),
              onClick: () => {
                void handleKickUser(player.playerKey);
              }
            }
          : undefined
    };
  });

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 h-full min-h-0 px-4 md:px-0">
      <div className="flex min-w-0 flex-1 flex-col md:flex-row gap-4 md:gap-0 h-full min-h-0">
        <div className="w-full md:w-1/2 flex flex-col px-0 md:pr-6 gap-6">
          <div>
            <span className="inline-flex rounded-full border border-primary-300 px-3 py-1 text-[11px] md:text-xs font-bold uppercase tracking-[0.18em] text-primary-500 dark:border-primary-300 dark:bg-primary-500/10 dark:text-primary-100">
              {t("Reaction Battle")}
            </span>
            <h2 className="mt-3 text-2xl md:text-4xl font-bold text-primary-500 dark:text-primary-100">
              {title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm md:text-lg text-primary-400 dark:text-primary-200">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {isRoundFinished ? (
              <Card className="relative w-full max-w-2xl overflow-hidden px-5 py-5 md:px-7 md:py-7 text-primary-500">
                {isLocalWinner && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-16 opacity-90"
                  >
                    <span className="absolute left-[8%] top-3 h-2.5 w-2.5 rounded-full bg-primary-300" />
                    <span className="absolute left-[18%] top-8 h-2 w-6 rotate-12 bg-primary-500" />
                    <span className="absolute left-[34%] top-2 h-3 w-3 rounded-full bg-primary-200" />
                    <span className="absolute left-[52%] top-6 h-2 w-5 -rotate-12 bg-primary-400" />
                    <span className="absolute left-[70%] top-3 h-3 w-3 rounded-full bg-primary-300" />
                    <span className="absolute left-[86%] top-7 h-2 w-6 rotate-[20deg] bg-primary-500" />
                  </div>
                )}

                <div className="relative flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {overlayTag && (
                      <span className="inline-flex rounded-full border border-primary-300 bg-primary-200 px-3 py-1 text-[11px] md:text-xs font-bold uppercase tracking-[0.12em] text-primary-600">
                        {overlayTag}
                      </span>
                    )}
                    {typeof localGapMs === "number" && (
                      <span className="inline-flex rounded-full border border-primary-300 px-3 py-1 text-[11px] md:text-xs font-bold uppercase tracking-[0.12em] text-primary-500">
                        {t("n ms slower", {ms: localGapMs})}
                      </span>
                    )}
                    {localResult?.status === "valid" &&
                      typeof localResult.reactionMs === "number" && (
                        <span className="inline-flex rounded-full border border-primary-300 px-3 py-1 text-[11px] md:text-xs font-bold uppercase tracking-[0.12em] text-primary-500">
                          {t("Reaction time n ms", {
                            ms: localResult.reactionMs
                          })}
                        </span>
                      )}
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 shrink-0 text-primary-300">
                      <Trophy />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-3xl md:text-5xl font-bold leading-none">
                        {winner ? winner.username : t("No winner this round")}
                      </h3>
                      <p className="mt-2 text-sm md:text-lg text-primary-400">
                        {resultSummary}
                      </p>
                    </div>
                  </div>

                  {endedRows.length > 1 && (
                    <div className="flex flex-col gap-2">
                      {endedRows.slice(0, 3).map((player, index) => (
                        <div
                          key={`${player.playerKey}-summary`}
                          className="flex items-center justify-between gap-3 rounded-md border border-primary-300/70 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm md:text-lg font-bold">
                              {getSuffixPosition(index + 1, t)}{" "}
                              {player.username}
                            </p>
                            {player.status === "false-start" && (
                              <p className="text-xs md:text-sm text-primary-400">
                                {t("False start")}
                              </p>
                            )}
                          </div>
                          <p className="shrink-0 text-sm md:text-xl font-bold">
                            {getResultMsLabel(player, t)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-1">
                    {isHost ? (
                      <Button
                        className="w-full md:w-80 px-4 py-4 md:px-6 md:py-5 text-xl md:text-3xl"
                        onClick={handleStartRound}
                      >
                        {t("Start next round")}
                      </Button>
                    ) : (
                      <p className="text-sm md:text-lg text-primary-400">
                        {t("Waiting for host")}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ) : showStartButton ? (
              <Button
                className="w-full max-w-2xl px-6 py-5 md:px-8 md:py-6 text-2xl md:text-4xl min-h-[72px]"
                onClick={handleStartRound}
              >
                {t("Start reaction round")}
              </Button>
            ) : (
              <Button
                className={`w-full max-w-2xl px-6 py-5 md:px-8 md:py-6 text-2xl md:text-4xl min-h-[72px] ${actionTone}`}
                disabled={actionDisabled}
                loading={submitting}
                onClick={handleReactionClick}
              >
                {actionLabel}
              </Button>
            )}
          </div>
        </div>

        <div className="w-full md:w-1/2 flex flex-col px-0 md:pl-6 min-h-0 gap-4">
          <RoomLeaderboard
            title={isRoundFinished ? t("Reaction results") : "Room leaderboard"}
            leftLabel="Name"
            rightLabel="Ms"
            rows={leaderboardRows}
          />
        </div>
      </div>
    </div>
  );
};

function getStatusPriority(status: ReactionResult["status"]) {
  if (status === "valid") return 0;
  if (status === "waiting") return 1;
  return 2;
}

function getResultStatus(
  player: StagePlayer,
  t: (key: string, options?: Record<string, unknown>) => string
) {
  if (player.status === "false-start") {
    return t("False start");
  }

  if (player.status === "valid") {
    return t("Locked in");
  }
}

function getResultMsLabel(
  player: StagePlayer,
  t: (key: string, options?: Record<string, unknown>) => string
) {
  if (player.status === "valid") {
    return String(player.reactionMs ?? 0);
  }

  if (player.status === "false-start") {
    return t("DQ");
  }

  return "--";
}

export default ReactionBattle;
