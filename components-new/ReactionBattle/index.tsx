"use client";

import {GameUser} from "@leandrolescano/click-battle-core";
import {AdblockDetector} from "adblock-detector";
import {getAnalytics, logEvent} from "firebase/analytics";
import {getDatabase, ref, serverTimestamp, update} from "firebase/database";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent
} from "react";
import {useTranslation} from "react-i18next";

import {Button} from "components-new/Button";
import {Card} from "components-new/Card";
import GoogleAdUnit from "components-new/CardGameAd/GoogleAdUnit";
import {RoomLeaderboard} from "components-new/RoomLeaderboard";
import {useAuth} from "contexts/AuthContext";
import {useGame} from "contexts/GameContext";
import {useWindowSize} from "hooks";
import {
  ReactionInputType,
  ReactionResult,
  ReactionSession,
  RoomStats
} from "interfaces";
import {
  AD_LABEL,
  AD_PLACEMENTS,
  ADS_ENABLED,
  ADSENSE_PUBLISHER_ID
} from "lib/ads/placements";
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
import {metricCounter} from "observability/sentry";
import {getSuffixPosition} from "utils/string";

import "./styles.scss";

type ReactionBattleProps = {
  idGame: string;
  localUser: GameUser;
  roomStats?: {current: RoomStats};
};

type StagePlayer = {
  playerKey: string;
  username: string;
  status: ReactionResult["status"];
  reactionMs?: number;
  inputType?: ReactionInputType;
};

type ReactionActionState = {
  className: string;
  disabled?: boolean;
  label: string;
  loading?: boolean;
  onClick?: () => void;
  onPointerDown?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  secondaryAction?: {
    className: string;
    label: string;
    onClick: () => void;
  };
};

const ReactionBattle = ({
  idGame,
  localUser,
  roomStats
}: ReactionBattleProps) => {
  const db = getDatabase();
  const serverTimeOffset = useServerTimeOffset();
  const {t} = useTranslation();
  const {user, gameUser} = useAuth();
  const {game: currentGame, isHost, setGame} = useGame();
  const {height, width} = useWindowSize();
  const session = currentGame.reactionSession;
  const localPlayerKey = user?.uid || localUser?.key || "";
  const signalShownAtRef = useRef<number | null>(null);
  const signalShownAtPerformanceRef = useRef<number | null>(null);
  const promotedSignalAtRef = useRef<number | null>(null);
  const finalizedSignalAtRef = useRef<number | null>(null);
  const recordedRoundStatsSignalAtRef = useRef<number | null>(null);
  const submittingRef = useRef(false);
  const [localSignalVisible, setLocalSignalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isRoundFinished = session?.status === "ended";

  const reactionWindowMs = getReactionWindowMs(currentGame.modeSettings);
  const estimatedNow = estimateServerNow(serverTimeOffset);
  const signalAt = session?.signalAt ?? null;
  const signalReached = Boolean(signalAt && estimatedNow >= signalAt);
  const isWaitingForOpponent = currentGame.listUsers.length < 2;
  const userHasAdblock = useMemo(() => {
    const adbDetector = new AdblockDetector();
    return adbDetector.detect() ?? true;
  }, []);
  const reactionAdPlacement = AD_PLACEMENTS.reactionActionDesktop;
  const showReactionAd =
    ADS_ENABLED && !userHasAdblock && width >= 1024 && height >= 820;
  const telemetryTags = useMemo(
    () => ({
      room_id: idGame,
      game_mode: "reaction",
      is_host: isHost ? "1" : "0"
    }),
    [idGame, isHost]
  );

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
  const isLocalWinner = winner?.playerKey === localPlayerKey;
  const validResults = participantResults.filter(
    (player) =>
      player.status === "valid" && typeof player.reactionMs === "number"
  );
  const nextValidResult = isLocalWinner ? validResults[1] : null;
  const localWinnerGapMs =
    isLocalWinner &&
    typeof winnerReactionMs === "number" &&
    typeof nextValidResult?.reactionMs === "number"
      ? Math.max(0, nextValidResult.reactionMs - winnerReactionMs)
      : null;
  const localPlacement = participantResults.findIndex(
    (player) => player.playerKey === localPlayerKey
  );
  const localPlacementLabel =
    localPlacement >= 0 ? getSuffixPosition(localPlacement + 1, t) : null;
  const localGapMs =
    !isLocalWinner &&
    localResult?.status === "valid" &&
    typeof localResult.reactionMs === "number" &&
    typeof winnerReactionMs === "number"
      ? Math.max(0, localResult.reactionMs - winnerReactionMs)
      : null;

  const recordRoundFinished = useCallback(() => {
    if (!signalAt || recordedRoundStatsSignalAtRef.current === signalAt) {
      return;
    }

    recordedRoundStatsSignalAtRef.current = signalAt;

    const finalResults = buildReactionResultList(
      currentGame.listUsers,
      session?.results
    );
    const validResults = finalResults.filter(
      (result) =>
        result.status === "valid" && typeof result.reactionMs === "number"
    );
    const falseStarts = finalResults.filter(
      (result) => result.status === "false-start"
    );
    const noReactions = finalResults.filter(
      (result) => result.status === "waiting" || result.status === "unavailable"
    );
    const fastestReactionMs = winner?.reactionMs ?? null;

    logEvent(getAnalytics(), "game_finish", {
      date: new Date(),
      falseStarts: falseStarts.length,
      fastestReactionMs,
      gameMode: "reaction",
      reactionWindowMs,
      users: currentGame.listUsers.length,
      validReactions: validResults.length
    });
    metricCounter("game_finished", undefined, {
      ...telemetryTags,
      has_winner: Boolean(winner)
    });

    if (!isHost) {
      return;
    }

    const startedAtMs =
      signalAt - (session?.syncBufferMs ?? 0) - (session?.signalDelayMs ?? 0);
    const startedAt =
      startedAtMs > 0 && Number.isFinite(startedAtMs)
        ? new Date(startedAtMs)
        : undefined;
    const gamePlayed = {
      clickInputs: finalResults.filter((result) => result.inputType === "click")
        .length,
      durationSeconds: reactionWindowMs / 1000,
      falseStarts: falseStarts.length,
      finishedAt: new Date(),
      fastestReactionMs,
      gameMode: "reaction" as const,
      keyInputs: finalResults.filter((result) => result.inputType === "key")
        .length,
      maxClicks: 0,
      noReactions: noReactions.length,
      numberOfUsers: currentGame.listUsers.length,
      reactionWindowMs,
      ...(startedAt ? {startedAt} : {}),
      tapInputs: finalResults.filter((result) => result.inputType === "tap")
        .length,
      timer: reactionWindowMs / 1000,
      validReactions: validResults.length,
      winnerMetric: "reactionMs" as const,
      winnerScore: fastestReactionMs,
      ...(winner?.username ? {winnerUsername: winner.username} : {})
    };

    roomStats?.current.gamesPlayed.push(gamePlayed);
  }, [
    currentGame.listUsers,
    isHost,
    reactionWindowMs,
    roomStats,
    session?.results,
    signalAt,
    telemetryTags,
    winner
  ]);

  const logReactionInput = useCallback(
    (result: ReactionResult) => {
      logEvent(getAnalytics(), "reaction_input", {
        gameMode: "reaction",
        inputType: result.inputType,
        reactionMs: result.reactionMs ?? null,
        resultStatus: result.status
      });
      metricCounter("reaction_input", undefined, {
        ...telemetryTags,
        input_type: result.inputType ?? "unknown",
        result_status: result.status
      });
    },
    [telemetryTags]
  );

  useEffect(() => {
    if (
      !signalAt ||
      session?.status === "ended" ||
      session?.status === "waiting"
    ) {
      signalShownAtRef.current = null;
      signalShownAtPerformanceRef.current = null;
      setLocalSignalVisible(false);
      return;
    }

    if (signalReached) {
      setLocalSignalVisible(true);
      return;
    }

    setLocalSignalVisible(false);
    signalShownAtRef.current = null;
    signalShownAtPerformanceRef.current = null;
    const timeoutId = window.setTimeout(
      () => {
        setLocalSignalVisible(true);
      },
      Math.max(0, signalAt - estimatedNow)
    );

    return () => window.clearTimeout(timeoutId);
  }, [estimatedNow, signalAt, signalReached, session?.status]);

  useLayoutEffect(() => {
    if (!localSignalVisible || localResult || session?.status === "ended") {
      return;
    }

    if (
      signalShownAtRef.current !== null &&
      signalShownAtPerformanceRef.current !== null
    ) {
      return;
    }

    signalShownAtRef.current = Date.now();
    signalShownAtPerformanceRef.current = performance.now();
  }, [localSignalVisible, localResult, session?.status, signalAt]);

  useEffect(() => {
    if (localResult || !session || session.status === "ended") {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [localResult, session]);

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
      "reactionSession/status": "signal"
    });
  }, [db, idGame, isHost, session?.status, signalAt, signalReached]);

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
    recordRoundFinished();
    update(ref(db, `games/${idGame}`), {
      status: "ended",
      "reactionSession/status": "ended",
      "reactionSession/winnerKey": winner?.playerKey ?? null
    });
  }, [
    currentGame.listUsers,
    db,
    estimatedNow,
    idGame,
    isHost,
    reactionWindowMs,
    recordRoundFinished,
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
        recordRoundFinished();
        update(ref(db, `games/${idGame}`), {
          status: "ended",
          "reactionSession/status": "ended",
          "reactionSession/winnerKey": winner?.playerKey ?? null
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
    recordRoundFinished,
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
    signalShownAtPerformanceRef.current = null;
    setLocalSignalVisible(false);
    recordedRoundStatsSignalAtRef.current = null;

    logEvent(getAnalytics(), "start_game", {
      action: "start_game",
      date: new Date(),
      gameMode: "reaction",
      reactionWindowMs,
      users: currentGame.listUsers.length
    });
    metricCounter("game_started", undefined, telemetryTags);

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

  const handleReturnToLobby = async () => {
    promotedSignalAtRef.current = null;
    finalizedSignalAtRef.current = null;
    signalShownAtRef.current = null;
    signalShownAtPerformanceRef.current = null;
    setLocalSignalVisible(false);

    await update(ref(db, `games/${idGame}`), {
      reactionSession: null,
      status: "lobby"
    });
    setGame({
      reactionSession: null,
      status: "lobby"
    });
  };

  const handleKickUser = async (playerKey: string) => {
    await update(ref(db, `games/${idGame}/listUsers/${playerKey}`), {
      kickOut: true
    });
  };

  const persistResult = useCallback(
    async (result: ReactionResult) => {
      if (!session || !localPlayerKey) return;

      await update(ref(db, `games/${idGame}`), {
        [`reactionSession/results/${localPlayerKey}`]: result
      });
    },
    [db, idGame, localPlayerKey, session]
  );

  const handleReactionInput = useCallback(
    async (inputType: ReactionInputType) => {
      if (
        !localPlayerKey ||
        !gameUser?.username ||
        localResult ||
        submittingRef.current
      ) {
        return;
      }

      let resultPersisted = false;

      submittingRef.current = true;
      setSubmitting(true);
      try {
        const clickedAt = Date.now();
        const clickedAtPerformance = performance.now();
        let result: ReactionResult;

        if (!localSignalVisible) {
          result = {
            playerKey: localPlayerKey,
            username: gameUser.username,
            status: "false-start",
            clickedAt,
            inputType
          };
          await persistResult(result);
          logReactionInput(result);
          resultPersisted = true;
          return;
        }

        if (
          signalShownAtRef.current === null ||
          signalShownAtPerformanceRef.current === null
        ) {
          signalShownAtRef.current = clickedAt;
          signalShownAtPerformanceRef.current = clickedAtPerformance;
        }

        result = {
          playerKey: localPlayerKey,
          username: gameUser.username,
          status: "valid",
          clickedAt,
          signalShownAt: signalShownAtRef.current,
          reactionMs: Math.round(
            Math.max(
              0,
              clickedAtPerformance - signalShownAtPerformanceRef.current
            )
          ),
          inputType
        };
        await persistResult(result);
        logReactionInput(result);
        resultPersisted = true;
      } finally {
        if (!resultPersisted) {
          submittingRef.current = false;
          setSubmitting(false);
        }
      }
    },
    [
      gameUser?.username,
      localPlayerKey,
      localResult,
      localSignalVisible,
      logReactionInput,
      persistResult
    ]
  );

  const handleReactionPointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>
  ) => {
    if (event.button !== 0) {
      return;
    }

    void handleReactionInput(event.pointerType === "mouse" ? "click" : "tap");
  };

  useEffect(() => {
    if (!session || localResult || isRoundFinished) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        !isReactionKey(event) ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      event.preventDefault();
      void handleReactionInput("key");
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleReactionInput, isRoundFinished, localResult, session]);

  const resultSummary = (() => {
    if (session?.status === "ended") {
      if (localResult?.status === "false-start") {
        return t("You clicked too early");
      }

      if (localResult?.status === "valid") {
        return getReactionSummary(localResult, t);
      }

      if (!localResult) {
        return t("No reaction this round");
      }

      if (typeof winnerReactionMs === "number") {
        return t("Winning reaction was n ms", {ms: winnerReactionMs});
      }

      return t("No valid reaction");
    }
  })();

  const subtitle = (() => {
    if (session?.status === "ended") {
      if (typeof localWinnerGapMs === "number") {
        return t("You won by n ms", {ms: localWinnerGapMs});
      }

      if (isLocalWinner && typeof winnerReactionMs === "number") {
        return t("Only valid reaction");
      }

      if (typeof localGapMs === "number") {
        return t("You were n ms slower", {ms: localGapMs});
      }

      if (typeof winnerReactionMs === "number") {
        return t("Winning reaction was n ms", {ms: winnerReactionMs});
      }

      return t("Fastest click after the signal wins");
    }

    if (localResult?.status === "valid") {
      return getReactionSummary(localResult, t);
    }

    if (localResult?.status === "false-start") {
      return t("You clicked too early");
    }

    if (isWaitingForOpponent) {
      return t("Fastest click after the signal wins");
    }

    if (session?.status === "scheduled" || session?.status === "signal") {
      return t("Click early and this round is lost");
    }

    return t("Fastest click after the signal wins");
  })();

  const canStart = isHost && currentGame.listUsers.length >= 2;
  const primaryActionClasses =
    "h-full w-full px-6 py-5 text-2xl md:px-8 md:py-6 md:text-4xl";
  const signalActionTone =
    "!bg-primary-300 !border-primary-200 !text-primary-100 dark:!bg-primary-300 dark:!border-primary-100 dark:!text-primary-100";
  const idleActionTone =
    "!bg-primary-100 !border-primary-300 !text-primary-500 dark:!bg-primary-700 dark:!border-primary-300 dark:!text-primary-100";
  const falseStartActionTone =
    "!bg-primary-100 !border-rose-300 !text-rose-700 dark:!bg-primary-700 dark:!border-rose-400 dark:!text-rose-100";
  const actionState: ReactionActionState = (() => {
    if (isRoundFinished && isHost) {
      return {
        className:
          "h-full w-full px-4 py-3 text-xl md:px-6 md:py-4 md:text-3xl",
        disabled: false,
        label: t("Start next round"),
        onClick: handleStartRound,
        secondaryAction: {
          className:
            "reaction-battle-secondary-action h-full w-full px-4 py-3 text-lg md:px-5 md:py-4 md:text-2xl",
          label: t("Back to lobby"),
          onClick: handleReturnToLobby
        }
      };
    }

    if (isRoundFinished) {
      return {
        className: primaryActionClasses,
        disabled: true,
        label: t("Host starts the next round")
      };
    }

    if (!session) {
      return {
        className: primaryActionClasses,
        disabled: !canStart,
        label: isHost ? t("Start reaction round") : t("Waiting for host"),
        onClick: isHost && canStart ? handleStartRound : undefined
      };
    }

    if (localResult?.status === "false-start") {
      return {
        className: `${primaryActionClasses} ${falseStartActionTone}`,
        disabled: true,
        label: t("False start")
      };
    }

    if (localResult?.status === "valid") {
      return {
        className: primaryActionClasses,
        disabled: true,
        label: t("Locked in")
      };
    }

    return {
      className: `${primaryActionClasses} ${
        localSignalVisible ? signalActionTone : idleActionTone
      } ${
        localSignalVisible
          ? "reaction-battle-action--signal"
          : "reaction-battle-action--armed"
      }`,
      disabled:
        submitting || !localPlayerKey || !session || session.status === "ended",
      label: localSignalVisible ? t("Click!") : t("Stay ready..."),
      loading: submitting,
      onPointerDown: handleReactionPointerDown
    };
  })();

  const stageFrameTone = (() => {
    return "border-primary-300 bg-primary-100 text-primary-500 dark:bg-primary-700 dark:text-primary-100";
  })();

  const stageMotionClass = (() => {
    if (isRoundFinished) {
      return "reaction-battle-stage--result";
    }

    if (localResult?.status === "false-start") {
      return "reaction-battle-stage--false";
    }

    if (localSignalVisible) {
      return "reaction-battle-stage--signal";
    }

    if (localResult?.status === "valid") {
      return "reaction-battle-stage--locked";
    }

    return "reaction-battle-stage--idle";
  })();

  const arenaPhase = (() => {
    if (isRoundFinished) return "result";
    if (!session) return "lobby";
    if (localSignalVisible && !localResult) return "signal";
    if (localResult) return "submitted";
    return "ready";
  })();
  const phaseSteps = [
    {key: "lobby", label: t("Lobby")},
    {key: "ready", label: t("Get ready")},
    {key: "signal", label: t("Signal")},
    {key: "result", label: t("Result")}
  ];
  const reactionWindowSecondsLabel = `${Number(
    (reactionWindowMs / 1000).toFixed(1)
  )} s`;
  const activeStepIndex =
    arenaPhase === "lobby"
      ? 0
      : arenaPhase === "ready"
      ? 1
      : arenaPhase === "signal"
      ? 2
      : 3;
  const arenaEyebrow = (() => {
    if (session?.status === "ended") return t("Result");
    if (!session) return isHost ? t("Round setup") : t("Game lobby");
    if (localResult?.status === "false-start") return t("False start");
    if (localResult?.status === "valid") return t("You're locked in");
    if (localSignalVisible) return t("Click now");
    return t("Get ready");
  })();
  const arenaMessage = (() => {
    if (session?.status === "ended") {
      if (winner) return winner.username;
      return t("No valid reaction");
    }

    if (!session) {
      if (isWaitingForOpponent) return t("Waiting for opponents...");
      return isHost ? t("Reaction Battle ready") : t("Stay ready");
    }

    if (localResult?.status === "false-start") {
      return t("False start");
    }

    if (localResult?.status === "valid") {
      return t("Locked in");
    }

    return localSignalVisible ? t("Click!") : t("Do not click yet");
  })();
  const arenaDetail = (() => {
    if (session?.status === "ended") {
      return (
        resultSummary ?? subtitle ?? t("Fastest click after the signal wins")
      );
    }

    if (!session) {
      if (isWaitingForOpponent) return t("Fastest click after the signal wins");
      return isHost
        ? t("Trigger the countdown when everyone is ready")
        : t("Host starts the round");
    }

    if (localResult?.status === "false-start") {
      return t("You clicked too early");
    }

    if (localResult?.status === "valid") {
      return getReactionSummary(localResult, t);
    }

    if (localSignalVisible) return t("React with click, tap, or Space");
    return t("Click, tap, or press Space after the signal");
  })();

  const overlayTag = (() => {
    if (!session || session.status !== "ended") return null;
    if (localResult?.status === "false-start") return t("False start");
    if (isLocalWinner && winner) {
      return t("Reaction winner", {name: winner.username});
    }
    if (localPlacementLabel) {
      return t("resultPosition", {position: localPlacementLabel});
    }
    if (winner) {
      return t("Reaction winner", {name: winner.username});
    }
    return t("No valid reaction");
  })();
  const localReactionSummary =
    isRoundFinished &&
    localResult?.status === "valid" &&
    typeof localResult.reactionMs === "number"
      ? getReactionSummary(localResult, t)
      : null;

  const leaderboardRows = participantResults.map((player, index) => {
    const isLocal = player.playerKey === localPlayerKey;

    return {
      key: player.playerKey,
      primary: `${index + 1}. ${player.username}`,
      secondary: getResultStatus(player, t, isRoundFinished),
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
  const opponentCount = Math.max(0, currentGame.listUsers.length - 1);
  const opponentCapacity = Math.max(0, currentGame.settings.maxUsers - 1);
  const leaderboardTitle = isRoundFinished
    ? t("Reaction results count", {count: currentGame.listUsers.length})
    : `${t("Opponents")} (${opponentCount}/${opponentCapacity})`;

  return (
    <div className="reaction-battle-root flex min-w-0 flex-1 flex-col gap-4 h-full min-h-0 px-4 md:px-0">
      <div className="flex min-w-0 flex-1 flex-col md:flex-row gap-4 md:gap-0 h-full min-h-0">
        <div className="reaction-battle-main w-full md:w-1/2 flex flex-col px-0 md:pr-6 gap-5 md:gap-7">
          <div className="reaction-battle-status-copy flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full border border-primary-300 px-3 py-1 text-[11px] md:text-xs font-bold uppercase text-primary-500 dark:border-primary-300 dark:bg-primary-500/10 dark:text-primary-100">
                {t("Reaction Battle")}
              </span>
              <span className="reaction-battle-limit-chip">
                {t("Reaction limit n s", {
                  seconds: reactionWindowSecondsLabel
                })}
              </span>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-4">
            <div
              className={`reaction-battle-stage reaction-battle-arena w-full max-w-2xl rounded-md border-2 px-4 py-4 md:px-6 md:py-6 ${stageFrameTone} ${stageMotionClass}`}
            >
              <div className="reaction-battle-phase-track grid grid-cols-4 gap-1 md:gap-2">
                {phaseSteps.map((step, index) => (
                  <div
                    className={`reaction-battle-phase-step ${
                      index <= activeStepIndex
                        ? "reaction-battle-phase-step--active"
                        : ""
                    }`}
                    key={step.key}
                  >
                    {step.label}
                  </div>
                ))}
              </div>

              <div className="reaction-battle-cue">
                <p className="text-[11px] md:text-xs font-bold uppercase text-primary-400 dark:text-primary-200">
                  {arenaEyebrow}
                </p>
                <h2 className="text-2xl md:text-4xl font-bold leading-tight">
                  {arenaMessage}
                </h2>
                <p className="text-sm md:text-base text-primary-400 dark:text-primary-200">
                  {arenaDetail}
                </p>
                {overlayTag && (
                  <p className="inline-flex w-fit rounded-full border border-primary-300 px-3 py-1 text-xs font-bold uppercase text-primary-500 dark:border-primary-200 dark:text-primary-100">
                    {overlayTag}
                  </p>
                )}
                {isRoundFinished && subtitle && subtitle !== resultSummary && (
                  <p className="text-xs md:text-sm text-primary-400 dark:text-primary-200">
                    {subtitle}
                  </p>
                )}
                {localReactionSummary &&
                  localReactionSummary !== resultSummary &&
                  localReactionSummary !== subtitle && (
                    <p className="text-xs md:text-sm text-primary-400 dark:text-primary-200">
                      {localReactionSummary}
                    </p>
                  )}
              </div>

              <div className="reaction-battle-hit-zone">
                {actionState.secondaryAction ? (
                  <div className="reaction-battle-result-actions">
                    <Button
                      className={actionState.className}
                      disabled={actionState.disabled}
                      loading={actionState.loading}
                      onClick={actionState.onClick}
                      onPointerDown={actionState.onPointerDown}
                    >
                      <span className="reaction-battle-action-label">
                        {actionState.label}
                      </span>
                    </Button>
                    <Button
                      className={actionState.secondaryAction.className}
                      onClick={actionState.secondaryAction.onClick}
                      variant="outlined"
                    >
                      <span className="reaction-battle-action-label">
                        {actionState.secondaryAction.label}
                      </span>
                    </Button>
                  </div>
                ) : (
                  <Button
                    className={actionState.className}
                    disabled={actionState.disabled}
                    loading={actionState.loading}
                    onClick={actionState.onClick}
                    onPointerDown={actionState.onPointerDown}
                  >
                    <span className="reaction-battle-action-label">
                      {actionState.label}
                    </span>
                  </Button>
                )}
              </div>
            </div>

            {showReactionAd && (
              <Card className="reaction-battle-ad relative mx-auto mt-auto hidden w-[384px] max-w-full overflow-hidden border-primary-300/70 bg-primary-100 p-0 pt-5 lg:flex">
                <span className="absolute left-2 top-1 text-[10px] font-bold uppercase leading-none text-primary-600">
                  {AD_LABEL}
                </span>
                <GoogleAdUnit placement={reactionAdPlacement}>
                  <ins
                    className="adsbygoogle"
                    style={{
                      display: "inline-block",
                      width: reactionAdPlacement.width,
                      height: reactionAdPlacement.height
                    }}
                    data-ad-client={ADSENSE_PUBLISHER_ID}
                    data-ad-slot={reactionAdPlacement.slot}
                  ></ins>
                </GoogleAdUnit>
              </Card>
            )}
          </div>
        </div>

        <div className="reaction-battle-leaderboard w-full md:w-1/2 flex flex-col px-0 md:pl-6 min-h-0 gap-4">
          <RoomLeaderboard
            title={leaderboardTitle}
            leftLabel={t("Name")}
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
  t: (key: string, options?: Record<string, unknown>) => string,
  isRoundFinished = false
) {
  const inputLabel = getReactionInputLabel(player.inputType);

  if (player.status === "false-start") {
    return inputLabel
      ? `${t("False start")} - ${inputLabel}`
      : t("False start");
  }

  if (player.status === "valid") {
    return inputLabel ? `${t("Locked in")} - ${inputLabel}` : t("Locked in");
  }

  if (isRoundFinished) {
    return t("No reaction");
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

function getReactionInputLabel(inputType?: ReactionInputType) {
  if (inputType === "key") return "key";
  if (inputType === "tap") return "tap";
  if (inputType === "click") return "click";
}

function getReactionSummary(
  result: ReactionResult,
  t: (key: string, options?: Record<string, unknown>) => string
) {
  if (!result.inputType) {
    return t("Your reaction was n ms", {ms: result.reactionMs ?? 0});
  }

  return t("Your reaction was n ms via input", {
    ms: result.reactionMs ?? 0,
    input: getReactionInputLabel(result.inputType)
  });
}

function isReactionKey(event: KeyboardEvent) {
  return event.code === "Space" || event.key === " " || event.key === "Enter";
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true']")
  );
}

export default ReactionBattle;
