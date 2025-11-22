import {
  getDatabase,
  onDisconnect,
  onValue,
  ref,
  remove,
  set,
  Unsubscribe
} from "@firebase/database";
import {captureException} from "@sentry/nextjs";
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
  const [error, setError] = useState<Error | null>(null);

  const {setNewUser} = useNewPlayerAlert(
    currentGame.listUsers,
    localUser,
    currentGame
  );
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
        onDisconnect(ref(db, gamePath)).remove().catch(console.error);
        return () => {
          if (
            roomStats.current &&
            Date.now() - roomStats.current.created.getTime() > 30 * 1000
          ) {
            addRoomStats({...roomStats.current, removed: new Date()});
          }
          remove(ref(db, gamePath));
        };
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

            setGame({...game, listUsers});
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
      captureException(err);
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
    router.push("/");
  }, [router]);

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
