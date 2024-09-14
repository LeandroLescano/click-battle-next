"use client";
import React, {useEffect, useRef, useState} from "react";
import dynamic from "next/dynamic";
import {useRouter, useSearchParams} from "next/navigation";
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
import {faArrowLeft} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {IconProp} from "@fortawesome/fontawesome-svg-core";
import {useTranslation} from "react-i18next";

import celebrationAnim from "lotties/celebrationAnim.json";
import {getSuffixPosition} from "utils/string";
import {
  ModalCreateUsername,
  Loading,
  requestPassword,
  SettingsSideBar
} from "components";
import {ModalLoginProps} from "components/ModalLogin/types";
import {useAuth} from "contexts/AuthContext";
import {useIsMobileDevice, useNewPlayerAlert} from "hooks";
import {updateUser} from "services/user";
import {addRoomStats} from "services/rooms";
import {Game, GameUser, MaxScore, RoomStats} from "interfaces";

const OpponentSection = dynamic(
  () => import("../../../components/roomGame/OpponentSection")
);
const LocalSection = dynamic(
  () => import("../../../components/roomGame/LocalSection")
);
const CelebrationResult = dynamic(
  () => import("../../../components/roomGame/CelebrationResult")
);
const ResultSection = dynamic(
  () => import("../../../components/roomGame/ResultSection")
);
const ModalLogin = dynamic<ModalLoginProps>(
  () =>
    import("../../../components/ModalLogin").then(
      (component) => component.ModalLogin
    ),
  {
    ssr: false
  }
);

function RoomGame() {
  const [isLocal, setIsLocal] = useState(false);
  const [currentGame, setCurrentGame] = useState<Game>();
  const [idGame, setIdGame] = useState<string>();
  const [startCountdown, setStartCountdown] = useState(false);
  const [localPosition, setLocalPosition] = useState<string>();
  const [showSideBar, setShowSideBar] = useState(false);
  const [localUser, setLocalUser] = useState<GameUser>({
    username: "",
    clicks: 0
  });
  const [listUsers, setListUsers] = useState<GameUser[]>([
    {username: "", clicks: 0, rol: "visitor"}
  ]);
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
  const db = getDatabase();
  const {setNewUser} = useNewPlayerAlert(listUsers, localUser, currentGame);
  const {
    gameUser,
    user: gUser,
    updateGameUser,
    loading,
    isAuthenticated
  } = useAuth();
  const localUserRef = useRef<GameUser>();
  const mobileDevice = useIsMobileDevice();
  const {t} = useTranslation();

  let unsubscribe: Unsubscribe;

  useEffect(() => {
    if (isAuthenticated && gUser?.uid) {
      const pathIdGame = window.location.pathname.slice(1).substring(5);
      const user = localStorage.getItem("user");
      const userOwner = sessionStorage.getItem("actualOwner");

      const gamePath = `games/${pathIdGame}`;

      if (user === userOwner) {
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
        onDisconnect(ref(db, `games/${pathIdGame}/listUsers/${gUser.uid}`))
          .remove()
          .catch((e) => console.error(e));
        return () => {
          const refGame = ref(db, `games/${pathIdGame}/listUsers/${gUser.uid}`);
          remove(refGame);
        };
      }
    }
  }, [isAuthenticated, gUser?.uid]);

  // useEffect for update all data in local state
  useEffect(() => {
    if (isAuthenticated) {
      try {
        const idGame = sessionStorage.getItem("actualIDGame");
        const pathIdGame = window.location.pathname.slice(1).substring(5);
        const user = localStorage.getItem("user");
        const actualUser = localStorage.getItem("user");
        const refGame = ref(db, `games/${pathIdGame}/`);

        setIdGame(pathIdGame);
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

              setCurrentGame(game);

              if (!roomStats.current.name) {
                roomStats.current.name = game.roomName;
                roomStats.current.owner = game.ownerUser.username;
                roomStats.current.withPassword = !!game.settings.password;
                roomStats.current.created = new Date(
                  game.created as unknown as number
                );
              }

              setStartCountdown(game.gameStart);

              const listUsersToPush: GameUser[] = [];
              let listUsersDB: GameUser[] = game.listUsers;
              if (!listUsersDB) {
                listUsersDB = [];
              }
              listUsersDB.forEach((val) => {
                if (!val.kickOut) {
                  const objUser: GameUser = {
                    username: val.username,
                    clicks: val.clicks,
                    rol: val.rol,
                    maxScores: val.maxScores,
                    key: val.key
                  };

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
              if (listUsersToPush.length > listUsers.length) {
                setNewUser(true);
              }
              setListUsers(listUsersToPush);
              if (game.ownerUser?.username === actualUser) {
                setIsLocal(true);
              } else if (gUser?.uid) {
                if (
                  listUsersToPush.filter((u) => u.username !== user).length ===
                  game.settings.maxUsers
                ) {
                  router.push("/?fullRoom=true");
                  return;
                }

                if (
                  game.settings.password &&
                  idGame !== pathIdGame &&
                  !flagEnter.current
                ) {
                  flagEnter.current = true;
                  if (
                    !query.get("pwd") ||
                    query.get("pwd") !== game.settings.password
                  ) {
                    requestPassword(game.settings.password, t).then((val) => {
                      if (val.isConfirmed) {
                        clearPath(pathIdGame);
                        sessionStorage.setItem("actualIDGame", pathIdGame);
                        addNewUserToDB(game);
                      } else {
                        router.push("/");
                        return;
                      }
                    });
                  } else {
                    clearPath(pathIdGame);
                    sessionStorage.setItem("actualIDGame", pathIdGame);
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
              JSON.stringify({game, roomStats, actualUser, listUsers, isLocal})
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
    };
  }, [isAuthenticated, gUser?.uid]);

  // useEffect for put the position of the localUser
  useEffect(() => {
    if (currentGame?.timer === undefined) {
      for (const i in listUsers) {
        if (listUsers[i].username === localUser.username) {
          const position = Number(i) + 1;
          setLocalPosition(getSuffixPosition(position, t));
        }
      }
    }
    if (roomStats.current.maxUsersConnected < listUsers.length) {
      roomStats.current.maxUsersConnected = listUsers.length;
    }
  }, [listUsers]);

  // useEffect for update timer in state and show result
  useEffect(() => {
    if (currentGame?.currentGame) {
      const userKey = sessionStorage.getItem("userKey");

      if (localUser.rol === "owner") {
        // localUser is owner
        if (!currentGame.timer) {
          if (currentGame.timer === 0) {
            logEvent(getAnalytics(), "game_finish", {
              date: new Date(),
              users: listUsers,
              maxClicks: Math.max(
                ...listUsers.map((users) => users.clicks || 0)
              )
            });
            roomStats.current.gamesPlayed.push({
              maxClicks: Math.max(...listUsers.map((lu) => lu.clicks || 0)),
              numberOfUsers: listUsers.length,
              timer: currentGame.settings.timer
            });
            const refGame = ref(db, `games/${idGame}`);
            update(refGame, {timer: null});
            updateLocalMaxScore(userKey);
          }

          loadCelebrationAnimation();
          return;
        }

        lottie.destroy();
        const intervalId = setInterval(() => {
          if (localUser.rol === "owner") {
            const refGame = ref(db, `games/${idGame}`);
            update(refGame, {timer: currentGame?.timer - 1});
          }
        }, 1000);

        return () => clearInterval(intervalId);
      } else if (currentGame.timer === 0) {
        // localUser is visitor
        loadCelebrationAnimation();
        updateLocalMaxScore(userKey);
      }
    } else if (startCountdown && localUser.rol === "owner") {
      if (!currentGame?.timeStart) {
        const refGame = ref(db, `games/${idGame}`);

        update(refGame, {
          gameStart: false,
          timeStart: null,
          currentGame: true
        });
        return;
      }

      const intervalIdStart = setInterval(() => {
        if (currentGame) {
          const refGame = ref(db, `games/${idGame}`);
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
            {clicks: localUser.clicks, time: currentGame.settings.timer}
          ];
        } else {
          if (currentMaxScore) {
            updatedScores = gameUser.maxScores.map((score) =>
              score.time === currentGame.settings.timer
                ? {...score, clicks: localUser.clicks!}
                : score
            );
          } else {
            updatedScores = [
              ...gameUser.maxScores,
              {time: currentGame.settings.timer, clicks: localUser.clicks}
            ];
          }
        }
      }

      const position =
        listUsers.findIndex((user) => user.username === localUser.username) + 1;
      const pointsEarned = listUsers.length - position;

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
    router.replace(`/game/${id}`);
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

  const toggleSideBar = () => {
    if (showSideBar) {
      setShowSideBar(false);
    }
  };

  const handleInvite = () => {
    let link = window.location.href + `?invite=${Date.now() + 5 * 60 * 1000}`;
    if (currentGame?.settings.password) {
      link += `&pwd=${currentGame.settings.password}`;
    }
    const data: ShareData = {
      title: "Click Battle",
      text: t("inviteText", {link})
    };
    if (mobileDevice && navigator.share && navigator.canShare(data)) {
      navigator.share(data).catch((e: unknown) => {
        console.error(e);
      });
    } else {
      navigator.clipboard.writeText(link);
      Swal.fire({
        toast: true,
        title: "Link copied to clipoard!",
        position: "bottom-left",
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true
      });
    }
  };

  return (
    <div className="vw-100 overflow-x-hidden">
      {loading || !currentGame ? (
        <Loading />
      ) : (
        <>
          {startCountdown &&
            currentGame?.timeStart &&
            currentGame.timeStart >= 0 && (
              <div className="start-countdown">
                {currentGame.timeStart === 0 ? "Go" : currentGame.timeStart}
              </div>
            )}
          <CelebrationResult
            celebrationContainer={celebrationContainer}
            timer={currentGame?.timer}
            listUsers={listUsers}
            localUser={localUser}
          />
          <div className="container-fluid vh-100">
            {isLocal && (
              <SettingsSideBar
                showSideBar={showSideBar}
                handleSideBar={(val: boolean) => setShowSideBar(val)}
                idGame={idGame}
                options={{
                  maxUsers: currentGame?.settings.maxUsers || 2,
                  roomName: currentGame?.roomName,
                  password: currentGame?.settings.password,
                  timer: currentGame?.timer || 10
                }}
              />
            )}
            <main className="main" onClick={() => toggleSideBar()}>
              <div className="room-name position-absolute d-none d-md-block">
                {currentGame?.roomName || ""}
              </div>
              <div className="header pt-2 pb-5 flex-lg-row">
                <button
                  className="btn-click p-2 btn-back me-auto mb-4"
                  onClick={() => router.push("/")}
                >
                  <FontAwesomeIcon
                    icon={faArrowLeft as IconProp}
                    size="xs"
                    className="me-2"
                  />
                  {t("Go back")}
                </button>
                <span className="d-block d-md-none m-auto">
                  {currentGame?.roomName || ""}
                </span>
              </div>
              {currentGame?.timer && currentGame?.timer > 0 ? (
                <>
                  <div className="row mb-3 w-100 g-4">
                    <div className="col-md-6 text-center opponents-container">
                      <OpponentSection
                        isLocal={isLocal}
                        opponents={listUsers}
                        localUsername={gameUser?.username || ""}
                        maxUsers={currentGame.settings.maxUsers}
                      />
                    </div>
                    <div className="col-md-6 text-center">
                      <LocalSection
                        idGame={idGame || ""}
                        isLocal={isLocal}
                        listUsers={listUsers}
                        localUser={localUser}
                        start={currentGame.currentGame}
                        startCountdown={startCountdown}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <ResultSection
                  listUsers={listUsers}
                  localUser={localUser}
                  isLocal={isLocal}
                  localPosition={localPosition}
                  currentGame={currentGame}
                />
              )}
              <div className="room-info">
                {currentGame?.timer !== undefined &&
                  currentGame.currentGame && (
                    <h2 className="text-center">
                      {t("N seconds remaining!", {seconds: currentGame?.timer})}
                    </h2>
                  )}
              </div>
              <button
                className="btn-click small position-absolute bottom-0 end-0 me-4 mb-4"
                onClick={handleInvite}
              >
                {t("Invite friends")}
              </button>
            </main>
          </div>
        </>
      )}
      {!isAuthenticated && (
        <>
          <ModalLogin />
          <ModalCreateUsername />
        </>
      )}
    </div>
  );
}

export default RoomGame;
