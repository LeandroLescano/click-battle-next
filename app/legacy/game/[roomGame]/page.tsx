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
import {IconProp} from "@fortawesome/fontawesome-svg-core";
import {faArrowLeft} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {GameUser} from "@leandrolescano/click-battle-core";
import lottie from "lottie-web";
import dynamic from "next/dynamic";
import {useParams, useRouter, useSearchParams} from "next/navigation";
import React, {useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import Swal from "sweetalert2";

import {
  ModalCreateUsername,
  Loading,
  requestPassword,
  SettingsSideBar
} from "components";
import {ModalLoginProps} from "components/ModalLogin/types";
import {useAuth} from "contexts/AuthContext";
import {useGame} from "contexts/GameContext";
import {useIsMobileDevice, useNewPlayerAlert} from "hooks";
import useGameTimer from "hooks/gameTimer";
import {Game, RoomStats} from "interfaces";
import celebrationAnim from "lotties/celebrationAnim.json";
import {addRoomStats} from "services/rooms";
import {handleInvite} from "utils/invite";

const OpponentSection = dynamic(
  () => import("../../../../components/roomGame/OpponentSection")
);
const LocalSection = dynamic(
  () => import("../../../../components/roomGame/LocalSection")
);
const CelebrationResult = dynamic(
  () => import("../../../../components/roomGame/CelebrationResult")
);
const ResultSection = dynamic(
  () => import("../../../../components/roomGame/ResultSection")
);
const ModalLogin = dynamic<ModalLoginProps>(
  () =>
    import("../../../../components/ModalLogin").then(
      (component) => component.ModalLogin
    ),
  {
    ssr: false
  }
);

function RoomGame() {
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
  const {roomGame: roomID} = useParams<{roomGame: string}>();
  const db = getDatabase();
  const {gameUser, user: gUser, loading, isAuthenticated} = useAuth();
  const {
    game: currentGame,
    localUser,
    isHost,
    setGame: setCurrentGame,
    setGame,
    setLocalUser,
    setIsHost
  } = useGame();
  const {setNewUser} = useNewPlayerAlert(
    currentGame.listUsers,
    localUser,
    currentGame
  );
  const localUserRef = useRef<GameUser>();
  const isMobileDevice = useIsMobileDevice();
  const {t} = useTranslation();
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
        const refGame = ref(db, `games/${roomID}/`);

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

              setCurrentGame({...game, startTime: game.startTime ?? undefined});

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
                  router.push("/legacy?kickedOut=true");
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
                  router.push("/legacy?fullRoom=true");
                  return;
                }

                if (game.settings.password && !flagEnter.current) {
                  flagEnter.current = true;
                  if (
                    !query.get("pwd") ||
                    query.get("pwd") !== game.settings.password
                  ) {
                    requestPassword(game.settings.password, t).then((val) => {
                      if (val.isConfirmed) {
                        clearPath(roomID);
                        addNewUserToDB(game);
                      } else {
                        router.push("/legacy");
                        return;
                      }
                    });
                  } else {
                    clearPath(roomID);
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
              router.replace("/legacy");
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
          router.push("/legacy");
        });
      }
    }

    return () => {
      unsubscribe?.();
    };
  }, [isAuthenticated, gUser?.uid]);

  // useEffect for update the maxUsersConnected
  useEffect(() => {
    if (roomStats.current.maxUsersConnected < currentGame.listUsers.length) {
      roomStats.current.maxUsersConnected = currentGame.listUsers.length;
    }
  }, [currentGame.listUsers]);

  const loadCelebrationAnimation = () => {
    if (celebrationContainer?.current?.innerHTML === "") {
      lottie.loadAnimation({
        container: celebrationContainer.current!,
        animationData: celebrationAnim
      });
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
        router.push("/legacy");
      }
    } else {
      router.push("/legacy");
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

  return (
    <div className="vw-100 overflow-x-hidden">
      {loading || !currentGame ? (
        <Loading />
      ) : (
        <>
          {currentGame.status === "countdown" && (
            <div className="start-countdown">{countdown}</div>
          )}
          <CelebrationResult
            celebrationContainer={celebrationContainer}
            timer={remainingTime}
            localUser={localUser}
          />
          <div className="container-fluid vh-100">
            {isHost && (
              <SettingsSideBar
                showSideBar={showSideBar}
                handleSideBar={(val: boolean) => setShowSideBar(val)}
                idGame={roomID}
                options={{
                  maxUsers: currentGame?.settings.maxUsers || 2,
                  roomName: currentGame?.roomName,
                  password: currentGame?.settings.password,
                  timer: currentGame?.settings.timer || 10
                }}
              />
            )}
            <main className="main" onClick={closeSideBar}>
              <div className="room-name position-absolute d-none d-md-block">
                {currentGame?.roomName || ""}
              </div>
              <div className="header pt-2 pb-5 flex-lg-row">
                <button
                  className="btn-click p-2 btn-back me-auto mb-4"
                  onClick={() => router.push("/legacy")}
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
              {currentGame?.status !== "ended" ? (
                <>
                  <div className="row mb-3 w-100 g-4">
                    <div className="col-md-6 text-center opponents-container">
                      <OpponentSection
                        localUsername={gameUser?.username || ""}
                        maxUsers={currentGame.settings.maxUsers}
                      />
                    </div>
                    <div className="col-md-6 text-center">
                      <LocalSection
                        idGame={roomID || ""}
                        localUser={localUser}
                        start={currentGame.status === "playing"}
                        startCountdown={currentGame.status == "countdown"}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <ResultSection
                  localUser={localUser}
                  currentGame={currentGame}
                />
              )}
              <div className="room-info">
                {currentGame?.status === "playing" && (
                  <h2 className="text-center">
                    {t("N seconds remaining!", {seconds: remainingTime})}
                  </h2>
                )}
              </div>
              <button
                className="btn-click small position-absolute bottom-0 end-0 me-4 mb-4"
                onClick={handleOnInvite}
              >
                {t("Invite friends")}
              </button>
            </main>
          </div>
          {!isAuthenticated && (
            <>
              <ModalLogin />
              <ModalCreateUsername />
            </>
          )}
        </>
      )}
    </div>
  );
}

export default RoomGame;
