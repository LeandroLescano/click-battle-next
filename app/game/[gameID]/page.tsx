"use client";
import {
  getDatabase,
  onDisconnect,
  onValue,
  ref,
  remove,
  set,
  Unsubscribe
} from "@firebase/database";
import {parseGameSnapshot} from "@leandrolescano/click-battle-core";
import {Timestamp} from "firebase/firestore";
import lottie from "lottie-web";
import dynamic from "next/dynamic";
import {useParams, useRouter, useSearchParams} from "next/navigation";
import {useCallback, useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import Swal from "sweetalert2";

import {requestPassword} from "components";
import {Button, Loading, SettingsSidebar} from "components-new";
import {GameHeader} from "components-new/GameHeader";
import {LoginModalProps} from "components-new/LoginModal/types";
import {useAuth} from "contexts/AuthContext";
import {useGame} from "contexts/GameContext";
import {useIsMobileDevice, useNewPlayerAlert} from "hooks";
import useGameTimer from "hooks/gameTimer";
import {Game, RoomStats} from "interfaces";
import celebrationAnim from "lotties/celebrationAnim.json";
import {addRoomStats} from "services/rooms";
import {handleInvite} from "utils/invite";

const OpponentSection = dynamic(
  () => import("../../../components-new/OpponentSection")
);
const LocalSection = dynamic(
  () => import("../../../components-new/LocalSection")
);
const CelebrationResult = dynamic(
  () => import("../../../components-new/CelebrationResult")
);
const ResultSection = dynamic(
  () => import("../../../components-new/ResultSection")
);
const LoginModal = dynamic<LoginModalProps>(
  () =>
    import("../../../components-new/LoginModal").then(
      (component) => component.LoginModal
    ),
  {
    ssr: false
  }
);

const RoomGame = () => {
  const [showSideBar, setShowSideBar] = useState(false);
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
  const celebrationContainer = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const query = useSearchParams();
  const {gameID} = useParams<{gameID: string}>();
  const db = getDatabase();
  const {gameUser, user: gUser, loading, isAuthenticated} = useAuth();
  const {
    game: currentGame,
    localUser,
    isHost,
    setGame,
    setLocalUser,
    setIsHost,
    resetContext
  } = useGame();
  const {setNewUser} = useNewPlayerAlert(
    currentGame.listUsers,
    localUser,
    currentGame
  );
  const isMobileDevice = useIsMobileDevice();
  const {t} = useTranslation();
  const {setHasEnteredPassword, hasEnteredPassword} = useGame();
  const {remainingTime, countdown} = useGameTimer({
    roomStats,
    onFinish: () => loadCelebrationAnimation()
  });

  let unsubscribe: Unsubscribe;

  // useEffect for remove user or remove room if host disconnects
  useEffect(() => {
    if (isAuthenticated && gUser?.uid) {
      const gamePath = `games/${currentGame.key}`;

      if (gameUser?.username === currentGame.ownerUser.username) {
        onDisconnect(ref(db, gamePath))
          .remove()
          .catch((e) => console.error(e));
        return () => {
          if (
            roomStats.current &&
            Date.now() - roomStats.current.created.getTime() > 30 * 1000
          ) {
            addRoomStats({
              ...roomStats.current,
              removed: new Date()
            });
          }
          const refGame = ref(db, gamePath);
          remove(refGame);
        };
      } else {
        onDisconnect(ref(db, `games/${currentGame.key}/listUsers/${gUser.uid}`))
          .remove()
          .catch((e) => console.error(e));
        return () => {
          const refGame = ref(
            db,
            `games/${currentGame.key}/listUsers/${gUser.uid}`
          );
          remove(refGame);
        };
      }
    }
  }, [isAuthenticated, gUser?.uid]);

  // useEffect for update all data in local state
  useEffect(() => {
    if (isAuthenticated) {
      try {
        const refGame = ref(db, `games/${gameID}/`);

        unsubscribe = onValue(refGame, (snapshot) => {
          const parsedGame = parseGameSnapshot(
            snapshot.val(),
            snapshot.key,
            gUser?.uid
          );

          if (!parsedGame) return router.replace("/");

          const {
            game,
            listUsers,
            localUser: dbLocalUser,
            kickedOut,
            isHost,
            isRoomFull,
            requiresPassword
          } = parsedGame;

          try {
            setGame({...game, listUsers});
            if (dbLocalUser) {
              setLocalUser(dbLocalUser);
            }
            setIsHost(isHost);

            if (!roomStats.current.name) {
              roomStats.current.name = game.roomName;
              roomStats.current.owner = game.ownerUser.username;
              roomStats.current.withPassword = !!game.settings.password;
              roomStats.current.created = new Date(
                game.created as unknown as number
              );
            }

            if (kickedOut) return router.push("/?kickedOut=true");

            if (listUsers.length > currentGame.listUsers.length) {
              setNewUser(true);
            }

            if (!isHost) {
              if (isRoomFull) return router.push("/?fullRoom=true");

              if (
                requiresPassword &&
                !hasEnteredPassword &&
                !flagEnter.current
              ) {
                flagEnter.current = true;
                if (
                  !query.get("pwd") ||
                  query.get("pwd") !== game.settings.password
                ) {
                  requestPassword(game.settings.password!, t).then((val) => {
                    if (val.isConfirmed) {
                      setHasEnteredPassword(true);
                      clearPath(gameID);
                      addNewUserToDB(game);
                    } else {
                      router.push("/");
                      return;
                    }
                  });
                } else {
                  clearPath(gameID);
                  addNewUserToDB(game);
                }
              }

              //Add user to DB
              if (!flagEnter.current) {
                if (listUsers.length + 1 > game.settings.maxUsers) {
                  return router.push("/?fullRoom=true");
                }

                flagEnter.current = true;
                addNewUserToDB(game);
              }
            }
          } catch (error) {
            console.log(
              JSON.stringify({
                game,
                roomStats,
                username: gameUser?.username,
                listUsers: listUsers,
                isLocal: isHost
              })
            );
            throw error;
          }
        });
      } catch {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Sorry, something went wrong. Please try again..",
          heightAuto: false
        }).then(() => {
          router.push("/");
        });
      }
    }

    return () => {
      unsubscribe?.();
      resetContext();
    };
  }, [isAuthenticated, gUser?.uid, currentGame.listUsers.length]);

  // useEffect for update the maxUsersConnected
  useEffect(() => {
    if (roomStats.current.maxUsersConnected < currentGame.listUsers.length) {
      roomStats.current.maxUsersConnected = currentGame.listUsers.length;
    }
  }, [currentGame.listUsers.length]);

  const clearPath = (id: string) => {
    router.replace(`/game/${id}`);
  };

  const loadCelebrationAnimation = () => {
    if (celebrationContainer?.current?.innerHTML === "") {
      lottie.loadAnimation({
        container: celebrationContainer.current!,
        animationData: celebrationAnim
      });
    }
  };

  // function for add user to database and update state
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

  const closeSideBar = () => {
    if (showSideBar) {
      setShowSideBar(false);
    }
  };

  const handleOnInvite = () => {
    handleInvite(isMobileDevice, t, currentGame?.settings.password);
  };

  const handleOnBack = useCallback(() => {
    router.push("/");
  }, []);

  return (
    <main>
      <div className="dark:text-primary-200 h-dvh flex flex-col overflow-hidden relative">
        {loading || !currentGame ? (
          <Loading />
        ) : (
          <>
            {currentGame.status === "countdown" && (
              <div className="start-countdown text-8xl md:text-9xl">
                {countdown}
              </div>
            )}
            <CelebrationResult
              celebrationContainer={celebrationContainer}
              timer={remainingTime}
              localUser={localUser}
            />
            {isHost && (
              <SettingsSidebar
                showSideBar={showSideBar}
                handleSideBar={(val: boolean) => setShowSideBar(val)}
                idGame={gameID}
                options={{
                  maxUsers: currentGame?.settings.maxUsers || 2,
                  roomName: currentGame?.roomName,
                  password: currentGame?.settings.password,
                  timer: currentGame?.settings.timer || 10
                }}
              />
            )}
            <div onClick={closeSideBar} className="flex flex-col gap-4 h-full">
              <GameHeader
                onOpenSettings={() => setShowSideBar(true)}
                onBack={handleOnBack}
              />
              {currentGame.status !== "ended" ? (
                <h1 className="text-2xl md:text-6xl text-center md:text-start font-bold mb-2 text-primary-400 dark:text-primary-100">
                  {currentGame?.roomName || ""}
                </h1>
              ) : null}
              {currentGame.status !== "ended" ? (
                <div className="flex min-w-0 flex-1 flex-col-reverse md:flex-row gap-4 md:gap-0 justify-end md:justify-start h-full min-h-0">
                  <LocalSection idGame={gameID || ""} localUser={localUser} />
                  <OpponentSection
                    localUsername={gameUser?.username || ""}
                    maxUsers={currentGame.settings.maxUsers}
                  />
                </div>
              ) : (
                <ResultSection />
              )}
              <Button
                variant="outlined"
                className="text-xl md:text-2xl py-0.5 px-3 md:py-1 md:px-6 self-center md:self-end z-10"
                onClick={handleOnInvite}
              >
                {t("Invite friends")}
              </Button>
            </div>
            {!isAuthenticated && <LoginModal />}
          </>
        )}
      </div>
    </main>
  );
};

export default RoomGame;
