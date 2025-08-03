"use client";
import React, {useCallback, useEffect, useRef, useState} from "react";
import dynamic from "next/dynamic";
import {useParams, useRouter, useSearchParams} from "next/navigation";
import {
  getDatabase,
  onDisconnect,
  onValue,
  ref,
  remove,
  set,
  Unsubscribe
} from "@firebase/database";
import lottie from "lottie-web";
import Swal from "sweetalert2";
import {useTranslation} from "react-i18next";
import {Timestamp} from "firebase/firestore";

import celebrationAnim from "lotties/celebrationAnim.json";
import {requestPassword} from "components";
import {useAuth} from "contexts/AuthContext";
import {useIsMobileDevice, useNewPlayerAlert} from "hooks";
import {addRoomStats} from "services/rooms";
import {Game, GameUser, RoomStats, RoomUser} from "interfaces";
import {useGame} from "contexts/GameContext";
import {handleInvite} from "utils/invite";
import {LoginModalProps} from "components-new/LoginModal/types";
import {Button, Loading, SettingsSidebar} from "components-new";
import {GameHeader} from "components-new/GameHeader";
import useGameTimer from "hooks/gameTimer";

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
  const localUserRef = useRef<GameUser>();
  const isMobileDevice = useIsMobileDevice();
  const {t} = useTranslation();
  const {setHasEnteredPassword, hasEnteredPassword} = useGame();
  const {remainingTime, countdown} = useGameTimer({
    roomStats,
    onLoadCelebration: () => loadCelebrationAnimation()
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
          const game: Game | null = snapshot.val();
          try {
            if (game && game.settings) {
              game.key = snapshot.key;
              if (game.listUsers) {
                game.listUsers = Object.entries(game.listUsers).map((u) => ({
                  key: u[0],
                  ...u[1]
                }));
              }

              setGame({...game, startTime: game.startTime ?? undefined});

              if (!roomStats.current.name) {
                roomStats.current.name = game.roomName;
                roomStats.current.owner = game.ownerUser.username;
                roomStats.current.withPassword = !!game.settings.password;
                roomStats.current.created = new Date(
                  game.created as unknown as number
                );
              }

              const listUsersToPush: RoomUser[] = [];
              const listUsersDB: RoomUser[] = game.listUsers ?? [];

              listUsersDB.forEach((val) => {
                if (!val.kickOut) {
                  const objUser: GameUser = {...val};

                  if (val.key === gUser?.uid) {
                    if (objUser.clicks !== localUserRef.current?.clicks) {
                      localUserRef.current = objUser;
                      setLocalUser(objUser);
                    }
                  }

                  listUsersToPush.push(objUser);
                } else if (val.key === gUser?.uid) {
                  router.push("/?kickedOut=true");
                  return;
                }
              });

              if (listUsersToPush.length > currentGame.listUsers.length) {
                setNewUser(true);
              }

              setGame({listUsers: listUsersToPush});

              if (game.ownerUser?.key === gUser?.uid) {
                setIsHost(true);
              } else if (gUser?.uid) {
                if (listUsersToPush.length > game.settings.maxUsers) {
                  const latestEnterUser = listUsersToPush.sort(
                    (a, b) =>
                      (b.enterDate?.seconds || 0) - (a.enterDate?.seconds || 0)
                  )[0];

                  if (
                    !listUsersToPush.find((u) => u.key === gUser.uid) ||
                    latestEnterUser.key === gUser.uid
                  ) {
                    router.push("/?fullRoom=true");
                    return;
                  }
                }

                if (
                  game.settings.password &&
                  !hasEnteredPassword &&
                  !flagEnter.current
                ) {
                  flagEnter.current = true;
                  if (
                    !query.get("pwd") ||
                    query.get("pwd") !== game.settings.password
                  ) {
                    requestPassword(game.settings.password, t).then((val) => {
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
                  flagEnter.current = true;
                  addNewUserToDB(game);
                }
              }
            } else {
              router.replace("/");
            }
          } catch (error) {
            console.log(
              JSON.stringify({
                game,
                roomStats,
                username: gameUser?.username,
                listUsers: currentGame.listUsers,
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
  }, [isAuthenticated, gUser?.uid]);

  // useEffect for update the maxUsersConnected
  useEffect(() => {
    if (roomStats.current.maxUsersConnected < currentGame.listUsers.length) {
      roomStats.current.maxUsersConnected = currentGame.listUsers.length;
    }
  }, [currentGame.listUsers]);

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
