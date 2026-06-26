import {
  DataSnapshot,
  getDatabase,
  onDisconnect,
  onValue,
  ref,
  remove,
  serverTimestamp,
  set,
  Unsubscribe
} from "@firebase/database";
import {Timestamp} from "firebase/firestore";
import {useParams, useRouter, useSearchParams} from "next/navigation";
import {useCallback, useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import Swal from "sweetalert2";

import {requestPassword} from "components";
import {useAuth} from "contexts/AuthContext";
import {useGame} from "contexts/GameContext";
import {useIsMobileDevice, useNewPlayerAlert} from "hooks";
import {Game} from "interfaces";
import {UseRoomGameReturn} from "interfaces/RoomGame";
import {RoomStats} from "interfaces/RoomStats";
import {DEFAULT_GAME_MODE} from "lib/game/gameModes";
import {
  bootstrapLegacyHostLease,
  clearHostDisconnectSignal,
  createHostSessionId,
  getHostDisconnectSignalPath,
  HOST_LEASE_HEARTBEAT_MS,
  replaceHostLeaseSession,
  renewHostLease
} from "lib/game/hostLease";
import {assessRoomLifecycle} from "lib/game/hostPresence";
import {deleteRoomIfStillStale} from "lib/game/roomCleanup";
import {
  estimateServerNow,
  useServerTimeOffset
} from "lib/game/serverTimeOffset";
import {breadcrumb, metricCounter, withSpan} from "observability/sentry";
import {addRoomStats} from "services/rooms";
import {handleInvite as handleInviteUtil} from "utils/invite";

import {applyState} from "../lib/game/applyState";
import {determineJoinAction} from "../lib/game/joinFlow";
import {reportApplyStateTime} from "../lib/game/metrics";
import {processSnapshot} from "../lib/game/processSnapshot";

const getStoredHostSessionKey = (roomId: string) =>
  `host-room-session:${roomId}`;

type RawRoomSnapshot = Record<string, unknown> | null;
type DisconnectSignalMap = Record<string, {disconnectedAt?: number}> | null;

const getCurrentLeaseSessionId = (rawRoom: RawRoomSnapshot) => {
  if (!rawRoom?.hostLease || typeof rawRoom.hostLease !== "object") {
    return null;
  }

  const candidate = rawRoom.hostLease as {sessionId?: unknown};

  return typeof candidate.sessionId === "string" ? candidate.sessionId : null;
};

export const useRoomGame = (): UseRoomGameReturn => {
  const router = useRouter();
  const query = useSearchParams();
  const {gameID} = useParams<{gameID: string}>();
  const db = getDatabase();
  const {gameUser, user: gUser, isAuthenticated} = useAuth();
  const {
    game: currentGame,
    localUser,
    isHost,
    setGame,
    setLocalUser,
    setIsHost,
    resetContext,
    setHasEnteredPassword,
    hasEnteredPassword
  } = useGame();

  const latestGameRef = useRef(currentGame);
  const roomStats = useRef<RoomStats>({
    name: "",
    gamesPlayed: [],
    maxUsersConnected: 1,
    owner: "",
    created: new Date(),
    removed: new Date(),
    withPassword: false
  });
  const flagEnter = useRef(false);
  const hostHeartbeatIntervalRef = useRef<number | null>(null);
  const hostSessionIdRef = useRef<string>("");
  const staleHostRemovalTimeoutRef = useRef<number | null>(null);
  const serverTimeOffsetRef = useRef(0);
  const [error, setError] = useState<Error | null>(null);

  const {setNewUser} = useNewPlayerAlert(currentGame.listUsers, localUser);
  const isMobileDevice = useIsMobileDevice();
  const serverTimeOffset = useServerTimeOffset();
  const {t} = useTranslation();

  useEffect(() => {
    serverTimeOffsetRef.current = serverTimeOffset;
  }, [serverTimeOffset]);

  useEffect(() => {
    latestGameRef.current = currentGame;
  }, [currentGame]);

  const stopHostHeartbeat = useCallback(() => {
    if (hostHeartbeatIntervalRef.current !== null) {
      window.clearInterval(hostHeartbeatIntervalRef.current);
      hostHeartbeatIntervalRef.current = null;
    }
  }, []);

  const getOrCreateHostSessionId = useCallback(
    (roomId: string, ownerId: string) => {
      if (hostSessionIdRef.current) {
        return hostSessionIdRef.current;
      }

      const storageKey = getStoredHostSessionKey(roomId);
      const storedSessionId =
        typeof window !== "undefined"
          ? sessionStorage.getItem(storageKey)
          : null;
      const sessionId = storedSessionId || createHostSessionId(ownerId);

      hostSessionIdRef.current = sessionId;
      if (typeof window !== "undefined") {
        sessionStorage.setItem(storageKey, sessionId);
      }

      return sessionId;
    },
    []
  );

  useEffect(() => {
    if (!isAuthenticated || !gUser?.uid || !currentGame.key) {
      return;
    }

    const userPath = `games/${currentGame.key}/listUsers/${gUser.uid}`;

    if (gameUser?.username === currentGame.ownerUser.username) {
      const sessionId = getOrCreateHostSessionId(currentGame.key, gUser.uid);
      const signalRef = ref(
        db,
        getHostDisconnectSignalPath(currentGame.key, sessionId)
      );
      const disconnect = onDisconnect(signalRef);

      clearHostDisconnectSignal(db, currentGame.key, sessionId).catch(
        console.error
      );

      disconnect
        .cancel()
        .then(() =>
          disconnect.set({
            disconnectedAt: serverTimestamp()
          })
        )
        .catch(console.error);

      return () => {
        disconnect.cancel().catch(console.error);
      };
    }

    onDisconnect(ref(db, userPath)).remove().catch(console.error);

    return () => {
      remove(ref(db, userPath)).catch(console.error);
    };
  }, [
    currentGame.key,
    currentGame.ownerUser.username,
    db,
    gameUser?.username,
    gUser?.uid,
    getOrCreateHostSessionId,
    isAuthenticated
  ]);

  useEffect(() => {
    if (!isAuthenticated || !gameID) return;

    let latestRoomRaw: RawRoomSnapshot = null;
    let latestSignalRaw: DisconnectSignalMap = null;
    let unsubscribeRoom: Unsubscribe | undefined;
    let unsubscribeSignals: Unsubscribe | undefined;

    const getServerNow = () => estimateServerNow(serverTimeOffsetRef.current);

    const clearStaleHostRemoval = () => {
      if (staleHostRemovalTimeoutRef.current !== null) {
        window.clearTimeout(staleHostRemovalTimeoutRef.current);
        staleHostRemovalTimeoutRef.current = null;
      }
    };

    const scheduleLifecycleReevaluation = (cleanupAt: number | null) => {
      clearStaleHostRemoval();

      if (cleanupAt === null) {
        return;
      }

      staleHostRemovalTimeoutRef.current = window.setTimeout(
        () => {
          applyRoomSnapshot(latestRoomRaw, latestSignalRaw);
        },
        Math.max(0, cleanupAt - getServerNow())
      );
    };

    const syncHostLeaseOwnership = async (
      rawRoom: RawRoomSnapshot,
      parsedIsHost: boolean
    ) => {
      if (!parsedIsHost || !gUser?.uid || !rawRoom) {
        stopHostHeartbeat();
        return;
      }

      const sessionId = getOrCreateHostSessionId(gameID, gUser.uid);
      const rawLease =
        rawRoom.hostLease && typeof rawRoom.hostLease === "object"
          ? (rawRoom.hostLease as {
              ownerId?: unknown;
              sessionId?: unknown;
            })
          : null;

      if (!rawLease) {
        await bootstrapLegacyHostLease(db, gameID, gUser.uid, sessionId).catch(
          console.error
        );
        stopHostHeartbeat();
        return;
      }

      if (rawLease.ownerId !== gUser.uid) {
        stopHostHeartbeat();
        return;
      }

      if (rawLease.sessionId !== sessionId) {
        const previousSessionId =
          typeof rawLease.sessionId === "string" ? rawLease.sessionId : null;
        const replacement = await replaceHostLeaseSession(
          db,
          gameID,
          gUser.uid,
          sessionId
        ).catch((error) => {
          console.error(error);
          return null;
        });

        if (!replacement?.committed) {
          stopHostHeartbeat();
          return;
        }

        if (previousSessionId) {
          await clearHostDisconnectSignal(db, gameID, previousSessionId).catch(
            console.error
          );
        }

        await clearHostDisconnectSignal(db, gameID, sessionId).catch(
          console.error
        );
        stopHostHeartbeat();
        return;
      }

      await clearHostDisconnectSignal(db, gameID, sessionId).catch(
        console.error
      );

      if (hostHeartbeatIntervalRef.current !== null) {
        return;
      }

      hostHeartbeatIntervalRef.current = window.setInterval(() => {
        renewHostLease(db, gameID, gUser.uid, sessionId)
          .then((result) => {
            if (!result.committed) {
              stopHostHeartbeat();
              return;
            }

            clearHostDisconnectSignal(db, gameID, sessionId).catch(
              console.error
            );
          })
          .catch((renewError) => {
            console.error(renewError);
            stopHostHeartbeat();
          });
      }, HOST_LEASE_HEARTBEAT_MS);
    };

    const applyRoomSnapshot = (
      raw: RawRoomSnapshot,
      signalMap: DisconnectSignalMap
    ) => {
      latestRoomRaw = raw;
      latestSignalRaw = signalMap;

      withSpan("onValue_snapshot", () => {
        if (!raw) {
          stopHostHeartbeat();
          router.replace("/");
          return;
        }

        const {parsed} = processSnapshot(raw, gameID, gUser?.uid, gameID);

        if (!parsed) {
          stopHostHeartbeat();
          router.replace("/");
          return;
        }

        const {
          game,
          listUsers,
          localUser: dbLocalUser,
          isHost: parsedIsHost
        } = parsed;
        const currentLeaseSessionId = getCurrentLeaseSessionId(raw);
        const lifecycle = assessRoomLifecycle(
          {
            ...raw,
            hostDisconnectSignal: currentLeaseSessionId
              ? signalMap?.[currentLeaseSessionId] ?? null
              : null
          },
          getServerNow()
        );

        scheduleLifecycleReevaluation(lifecycle.cleanupAt);
        syncHostLeaseOwnership(raw, parsedIsHost).catch(console.error);

        if (!parsedIsHost && lifecycle.mayDelete) {
          stopHostHeartbeat();
          deleteRoomIfStillStale(db, gameID, getServerNow, {
            expectedSessionId: lifecycle.expectedSessionId,
            observedDisconnectedAt: lifecycle.observedDisconnectedAt
          }).catch(console.error);
          router.replace("/");
          return;
        }

        const startApply = performance.now();
        try {
          const {shouldRedirect, newUserJoined} = applyState(
            parsed,
            latestGameRef.current.listUsers.length,
            roomStats.current,
            gameID
          );

          if (shouldRedirect) {
            router.push(shouldRedirect);
            return;
          }

          const nextGame = game as Game;

          setGame({
            ...nextGame,
            listUsers,
            reactionSession: nextGame.reactionSession ?? null
          });
          if (dbLocalUser) setLocalUser(dbLocalUser);
          setIsHost(parsedIsHost);
          if (newUserJoined) setNewUser(true);

          const action = determineJoinAction(
            parsed,
            hasEnteredPassword || false,
            flagEnter.current,
            query.get("pwd"),
            gameID
          );

          if (action.redirect) {
            router.push(action.redirect);
            return;
          }

          if (action.showPasswordPrompt) {
            requestPassword(game.settings.password!, t).then((val) => {
              if (val.isConfirmed) {
                flagEnter.current = true;
                setHasEnteredPassword(true);
                router.replace(`/game/${gameID}`);
                metricCounter("room_join_attempts", undefined, {
                  room_id: gameID,
                  is_host: "0"
                });
                addNewUserToDB(game);
              } else {
                router.push("/");
              }
            });
          } else if (action.addUser) {
            flagEnter.current = true;

            if (action.metricEvent) {
              metricCounter(
                action.metricEvent.name,
                undefined,
                action.metricEvent.tags
              );
            }

            if (query.get("pwd")) {
              router.replace(`/game/${gameID}`);
            }
            addNewUserToDB(game);
          }
        } catch (err) {
          breadcrumb("error", "snapshot_processing_error", {
            gameID,
            error: err
          });

          throw err;
        } finally {
          reportApplyStateTime(
            performance.now() - startApply,
            gameID,
            parsedIsHost,
            game.gameMode ?? DEFAULT_GAME_MODE
          );
        }
      });
    };

    try {
      unsubscribeRoom = onValue(ref(db, `games/${gameID}/`), (snapshot) => {
        applyRoomSnapshot(snapshot.val() as RawRoomSnapshot, latestSignalRaw);
      });

      unsubscribeSignals = onValue(
        ref(db, `roomHostDisconnects/${gameID}`),
        (snapshot: DataSnapshot) => {
          applyRoomSnapshot(
            latestRoomRaw,
            snapshot.val() as DisconnectSignalMap
          );
        }
      );
    } catch (err) {
      console.error(err);
      setError(err as Error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Sorry, something went wrong. Please try again.",
        heightAuto: false
      }).then(() => {
        router.push("/");
      });
    }

    return () => {
      clearStaleHostRemoval();
      stopHostHeartbeat();
      breadcrumb("lifecycle", "unsubscribe_onValue");
      unsubscribeRoom?.();
      unsubscribeSignals?.();
      resetContext();
    };
  }, [
    db,
    gameID,
    gUser?.uid,
    hasEnteredPassword,
    isAuthenticated,
    query,
    resetContext,
    router,
    setGame,
    setHasEnteredPassword,
    setIsHost,
    setLocalUser,
    setNewUser,
    stopHostHeartbeat,
    t,
    getOrCreateHostSessionId
  ]);

  const addNewUserToDB = (game: Game) => {
    if (gUser?.uid) {
      const refUser = ref(db, `games/${game.key}/listUsers/${gUser.uid}`);
      set(refUser, {
        clicks: 0,
        rol: "visitor",
        username: gameUser?.username,
        enterDate: Timestamp.now()
      });
    } else if (query.get("invite")) {
      if (Date.now() > Number(query.get("invite"))) {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  };

  const handleUserPasswordSubmit = async (password: string) => {
    if (currentGame?.settings.password === password) {
      setHasEnteredPassword(true);
    }
  };

  const handleBackNavigation = useCallback(() => {
    const gameKey = latestGameRef.current.key || currentGame.key;

    if (!gameKey) {
      router.push("/");
      return;
    }

    const localIsHost =
      isHost || gameUser?.username === latestGameRef.current.ownerUser.username;
    const roomPath = localIsHost
      ? `games/${gameKey}`
      : gUser?.uid
      ? `games/${gameKey}/listUsers/${gUser.uid}`
      : null;

    if (!roomPath) {
      router.push("/");
      return;
    }

    const shouldSaveRoomStats =
      localIsHost &&
      roomStats.current &&
      (Date.now() - roomStats.current.created.getTime() > 30 * 1000 ||
        roomStats.current.gamesPlayed.length > 0);

    if (shouldSaveRoomStats) {
      addRoomStats({
        ...roomStats.current,
        closedReason: "host-left",
        id: gameKey,
        removed: new Date()
      });
    }

    const roomRef = ref(db, roomPath);
    const removeRoom = localIsHost
      ? (() => {
          const ownerId = gUser?.uid;
          const sessionId =
            ownerId && gameKey
              ? getOrCreateHostSessionId(gameKey, ownerId)
              : null;

          stopHostHeartbeat();

          return onDisconnect(roomRef)
            .cancel()
            .then(async () => {
              if (sessionId) {
                await clearHostDisconnectSignal(db, gameKey, sessionId).catch(
                  console.error
                );
              }

              await remove(roomRef);
              await remove(ref(db, `roomHostDisconnects/${gameKey}`));
            });
        })()
      : remove(roomRef);

    removeRoom.catch(console.error).finally(() => {
      router.push("/");
    });
  }, [
    currentGame.key,
    db,
    gameUser?.username,
    gUser?.uid,
    getOrCreateHostSessionId,
    isHost,
    router,
    stopHostHeartbeat
  ]);

  const handleInvite = () => {
    handleInviteUtil(isMobileDevice, t, currentGame?.settings.password);
  };

  return {
    currentGame,
    localUser,
    isHost,
    roomStats,
    isRoomFull: currentGame.listUsers.length >= currentGame.settings.maxUsers,
    kickedOut: false,
    needsPassword: !!currentGame.settings.password && !hasEnteredPassword,
    newUserJoined: false,
    hasEnteredPassword: hasEnteredPassword || false,
    handleUserPasswordSubmit,
    handleBackNavigation,
    handleInvite,
    error
  };
};
