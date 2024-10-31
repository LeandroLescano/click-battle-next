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
  update,
  Unsubscribe
} from "@firebase/database";
import {getAnalytics, logEvent} from "firebase/analytics";
import lottie from "lottie-web";
import Swal from "sweetalert2";
import {useTranslation} from "react-i18next";
import {Timestamp} from "firebase/firestore";

import celebrationAnim from "lotties/celebrationAnim.json";
import {requestPassword} from "components";
import {useAuth} from "contexts/AuthContext";
import {useIsMobileDevice, useNewPlayerAlert} from "hooks";
import {updateUser} from "services/user";
import {addRoomStats} from "services/rooms";
import {Game, GameUser, MaxScore, RoomStats} from "interfaces";
import {useGame} from "contexts/GameContext";
import {handleInvite} from "utils/invite";
import {LoginModalProps} from "components-new/LoginModal/types";
import {Button, Loading, SettingsSidebar} from "components-new";
import {GameHeader} from "components-new/GameHeader";

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
  const [startCountdown, setStartCountdown] = useState(false);
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
  const {
    gameUser,
    user: gUser,
    updateGameUser,
    loading,
    isAuthenticated
  } = useAuth();
  const {
    game: currentGame,
    localUser,
    isHost,
    setGame,
    setLocalUser,
    setIsHost,
    calculatePosition,
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

              setGame(game);
              setStartCountdown(game.gameStart);

              if (!roomStats.current.name) {
                roomStats.current.name = game.roomName;
                roomStats.current.owner = game.ownerUser.username;
                roomStats.current.withPassword = !!game.settings.password;
                roomStats.current.created = new Date(
                  game.created as unknown as number
                );
              }

              const listUsersToPush: GameUser[] = [];
              let listUsersDB: GameUser[] = game.listUsers;
              if (!listUsersDB) {
                listUsersDB = [];
              }
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
                }
              });

              if (listUsersToPush.length > currentGame.listUsers.length) {
                setNewUser(true);
              }

              setGame({listUsers: listUsersToPush});

              if (game.ownerUser?.key === gUser?.uid) {
                setIsHost(true);
              } else if (gUser?.uid) {
                if (
                  listUsersToPush.filter(
                    (u) => u.username !== gameUser?.username
                  ).length === game.settings.maxUsers
                ) {
                  router.push("/?fullRoom=true");
                  return;
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

  // useEffect for update timer in state and show result
  useEffect(() => {
    if (currentGame?.currentGame) {
      const userKey = sessionStorage.getItem("userKey");

      if (localUser.rol === "owner") {
        // localUser is owner
        if (!currentGame.timer) {
          if (currentGame.timer === 0) {
            calculatePosition();
            logEvent(getAnalytics(), "game_finish", {
              date: new Date(),
              users: currentGame.listUsers,
              maxClicks: Math.max(
                ...currentGame.listUsers.map((users) => users.clicks || 0)
              )
            });

            roomStats.current.gamesPlayed.push({
              maxClicks: Math.max(
                ...currentGame.listUsers.map((lu) => lu.clicks || 0)
              ),
              numberOfUsers: currentGame.listUsers.length,
              timer: currentGame.settings.timer
            });

            const refGame = ref(db, `games/${gameID}`);
            update(refGame, {timer: null, currentGame: false});
            updateLocalMaxScore(userKey);
          }

          loadCelebrationAnimation();
          return;
        }

        lottie.destroy();
        const intervalId = setInterval(() => {
          if (localUser.rol === "owner") {
            const refGame = ref(db, `games/${gameID}`);
            update(refGame, {timer: currentGame?.timer - 1});
          }
        }, 1000);

        return () => clearInterval(intervalId);
      } else if (currentGame.timer === 0) {
        // localUser is visitor
        loadCelebrationAnimation();
        calculatePosition();
        updateLocalMaxScore(userKey);
      }
    } else if (startCountdown && localUser.rol === "owner") {
      if (!currentGame?.timeStart) {
        const refGame = ref(db, `games/${gameID}`);

        update(refGame, {
          gameStart: false,
          timeStart: null,
          currentGame: true
        });
        return;
      }

      const intervalIdStart = setInterval(() => {
        if (currentGame) {
          const refGame = ref(db, `games/${gameID}`);
          update(refGame, {timeStart: currentGame.timeStart - 1});
        }
      }, 1000);
      return () => clearInterval(intervalIdStart);
    }
  }, [
    currentGame?.currentGame,
    currentGame?.timeStart,
    currentGame?.timer,
    startCountdown
  ]);

  const loadCelebrationAnimation = () => {
    if (celebrationContainer?.current?.innerHTML === "") {
      lottie.loadAnimation({
        container: celebrationContainer.current!,
        animationData: celebrationAnim
      });
    }
  };

  const updateLocalMaxScore = (userKey?: string | null) => {
    if (localUser.clicks && gameUser && currentGame) {
      const currentMaxScore = gameUser.maxScores?.find(
        (score) => score.time === currentGame.settings.timer
      );

      let updatedScores: MaxScore[] | undefined = gameUser.maxScores;
      if (!currentMaxScore || localUser.clicks > currentMaxScore.clicks) {
        if (!gameUser.maxScores) {
          updatedScores = [
            {
              clicks: localUser.clicks,
              time: currentGame.settings.timer,
              date: Timestamp.now()
            }
          ];
        } else {
          if (currentMaxScore) {
            updatedScores = gameUser.maxScores.map((score) =>
              score.time === currentGame.settings.timer
                ? {...score, clicks: localUser.clicks!, date: Timestamp.now()}
                : score
            );
          } else {
            updatedScores = [
              ...gameUser.maxScores,
              {
                time: currentGame.settings.timer,
                clicks: localUser.clicks,
                date: Timestamp.now()
              }
            ];
          }
        }
      }

      const position =
        currentGame.listUsers.findIndex(
          (user) => user.username === localUser.username
        ) + 1;
      const pointsEarned = currentGame.listUsers.length - position;

      if (updatedScores || pointsEarned > 0) {
        if (userKey && gUser && !gUser.isAnonymous) {
          updateUser(userKey, {
            maxScores: updatedScores,
            points: (gameUser.points ?? 0) + pointsEarned
          });
        }
        updateGameUser({
          maxScores: updatedScores,
          points: (gameUser.points ?? 0) + pointsEarned
        });
      }
    }
  };

  const clearPath = (id: string) => {
    router.replace(`/new/game/${id}`);
  };

  // function for add user to database and update state
  const addNewUserToDB = (game: Game) => {
    if (gUser?.uid) {
      const refUser = ref(db, `games/${game.key}/listUsers/${gUser.uid}`);
      set(refUser, {clicks: 0, rol: "visitor", username: gameUser?.username});
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
            {startCountdown &&
              currentGame?.timeStart &&
              currentGame.timeStart >= 0 && (
                <div className="start-countdown text-8xl md:text-9xl">
                  {currentGame.timeStart === 0 ? "Go" : currentGame.timeStart}
                </div>
              )}
            <CelebrationResult
              celebrationContainer={celebrationContainer}
              timer={currentGame?.timer}
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
                  timer: currentGame?.timer || 10
                }}
              />
            )}
            <div onClick={closeSideBar} className="flex flex-col gap-4 h-full">
              <GameHeader
                onOpenSettings={() => setShowSideBar(true)}
                onBack={handleOnBack}
              />
              {currentGame?.timer && currentGame?.timer > 0 ? (
                <h1 className="text-2xl md:text-6xl text-center md:text-start font-bold mb-2 text-primary-400 dark:text-primary-100">
                  {currentGame?.roomName || ""}
                </h1>
              ) : null}
              {currentGame?.timer && currentGame?.timer > 0 ? (
                <div className="flex min-w-0 flex-1 flex-col-reverse md:flex-row gap-4 md:gap-0 justify-end md:justify-start">
                  <LocalSection
                    idGame={gameID || ""}
                    localUser={localUser}
                    start={currentGame.currentGame}
                    startCountdown={startCountdown}
                  />
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
