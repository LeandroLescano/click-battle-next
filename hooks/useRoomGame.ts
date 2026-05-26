import {
  getDatabase,
  onDisconnect,
  onValue,
  ref,
  remove,
  serverTimestamp,
  set,
  Unsubscribe,
  update
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
import {breadcrumb, metricCounter, withSpan} from "observability/sentry";
import {addRoomStats} from "services/rooms";
import {handleInvite as handleInviteUtil} from "utils/invite";

import {applyState} from "../lib/game/applyState";
import {getHostDisconnectRemovalDelay} from "../lib/game/hostPresence";
import {determineJoinAction} from "../lib/game/joinFlow";
import {reportApplyStateTime} from "../lib/game/metrics";
import {processSnapshot} from "../lib/game/processSnapshot";

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
  const hostPresenceIdRef = useRef<string>("");
  const staleHostRemovalTimeoutRef = useRef<number | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const {setNewUser} = useNewPlayerAlert(currentGame.listUsers, localUser);
  const isMobileDevice = useIsMobileDevice();
  const {t} = useTranslation();

  // Keep latest game ref updated
  useEffect(() => {
    latestGameRef.current = currentGame;
  }, [currentGame]);

  // Handle Disconnect
  useEffect(() => {
    if (isAuthenticated && gUser?.uid && currentGame.key) {
      const gamePath = `games/${currentGame.key}`;
      const userPath = `games/${currentGame.key}/listUsers/${gUser.uid}`;

      if (gameUser?.username === currentGame.ownerUser.username) {
        if (!hostPresenceIdRef.current) {
          hostPresenceIdRef.current = `${gUser.uid}-${Date.now()}`;
        }

        const gameRef = ref(db, gamePath);
        const disconnect = onDisconnect(gameRef);

        update(gameRef, {
          hostConnectionId: hostPresenceIdRef.current,
          hostDisconnectedAt: null
        }).catch(console.error);

        disconnect
          .cancel()
          .then(() =>
            disconnect.update({
              hostConnectionId: hostPresenceIdRef.current,
              hostDisconnectedAt: serverTimestamp()
            })
          )
          .catch(console.error);

        return;
      } else {
        onDisconnect(ref(db, userPath)).remove().catch(console.error);
        return () => {
          remove(ref(db, userPath));
        };
      }
    }
  }, [
    isAuthenticated,
    gUser?.uid,
    currentGame.key,
    currentGame.ownerUser.username,
    db,
    gameUser?.username
  ]);

  // Main Game Logic
  useEffect(() => {
    if (!isAuthenticated || !gameID) return;

    let unsubscribe: Unsubscribe;

    const clearStaleHostRemoval = () => {
      if (staleHostRemovalTimeoutRef.current) {
        window.clearTimeout(staleHostRemovalTimeoutRef.current);
        staleHostRemovalTimeoutRef.current = null;
      }
    };

    try {
      const gameRef = ref(db, `games/${gameID}/`);

      unsubscribe = onValue(gameRef, (snapshot) => {
        withSpan("onValue_snapshot", () => {
          const raw = snapshot.val();
          const key = snapshot.key;

          const {parsed} = processSnapshot(raw, key, gUser?.uid, gameID);

          if (!parsed) {
            router.replace("/");
            return;
          }

          const {
            game,
            listUsers,
            localUser: dbLocalUser,
            isHost: parsedIsHost
          } = parsed;

          const startApply = performance.now();
          try {
            clearStaleHostRemoval();

            const staleHostRemovalDelay = getHostDisconnectRemovalDelay(
              raw?.hostDisconnectedAt
            );

            if (!parsedIsHost && staleHostRemovalDelay !== null) {
              staleHostRemovalTimeoutRef.current = window.setTimeout(() => {
                remove(gameRef).catch(console.error);
              }, staleHostRemovalDelay);
            }

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
                  router.replace(`/game/${gameID}`); // Clear path
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
              parsedIsHost
            );
          }
        });
      });
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
      breadcrumb("lifecycle", "unsubscribe_onValue");
      if (unsubscribe) unsubscribe();
      resetContext();
    };
  }, [isAuthenticated, gUser?.uid, gameID]);

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

    if (
      roomStats.current &&
      Date.now() - roomStats.current.created.getTime() > 30 * 1000
    ) {
      addRoomStats({...roomStats.current, removed: new Date()});
    }

    const roomRef = ref(db, roomPath);
    const removeRoom = localIsHost
      ? onDisconnect(roomRef)
          .cancel()
          .then(() => remove(roomRef))
      : remove(roomRef);

    removeRoom.catch(console.error).finally(() => {
      router.push("/");
    });
  }, [currentGame.key, db, gameUser?.username, gUser?.uid, isHost, router]);

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
