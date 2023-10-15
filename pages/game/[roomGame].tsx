// React
import React, {useEffect, useRef, useState} from "react";
import dynamic from "next/dynamic";

// Interfaces
import {Game, User} from "interfaces";

//Router
import {useRouter} from "next/dist/client/router";

// Firebase
import {getAuth} from "@firebase/auth";
import {
  child,
  get,
  getDatabase,
  onDisconnect,
  onValue,
  ref,
  remove,
  set,
  update
} from "@firebase/database";

// Icons
import {faArrowLeft} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {IconProp} from "@fortawesome/fontawesome-svg-core";

// Utils
import lottie from "lottie-web";
import Swal from "sweetalert2";
import celebrationAnim from "../../lotties/celebrationAnim.json";

// Components
import {requestPassword} from "../../components/Alerts";
import SettingsSideBar from "../../components/SettingsSideBar";
import {getSuffixPosition} from "utils/string";

const OpponentSection = dynamic(
  () => import("../../components/roomGame/OpponentSection")
);
const LocalSection = dynamic(
  () => import("../../components/roomGame/LocalSection")
);
const CelebrationResult = dynamic(
  () => import("../../components/roomGame/CelebrationResult")
);
const ResultSection = dynamic(
  () => import("../../components/roomGame/ResultSection")
);

function RoomGame() {
  const [isLocal, setIsLocal] = useState(false);
  const [idGame, setIdGame] = useState<string>();
  const [roomName, setRoomName] = useState<string>();
  const [maxUsers, setMaxUsers] = useState(2);
  const [start, setStart] = useState(false);
  const [startCountdown, setStartCountdown] = useState(false);
  const [roomPassword, setRoomPassword] = useState<string>();
  const [localPosition, setLocalPosition] = useState<string>();
  const [showSideBar, setShowSideBar] = useState(false);
  const [localUser, setLocalUser] = useState<User>({
    username: "",
    clicks: 0
  });
  const [listUsers, setListUsers] = useState<User[]>([
    {username: "", clicks: 0, rol: "visitor"}
  ]);
  const [timer, setTimer] = useState(10);
  const [timeToStart, setTimeToStart] = useState(3);
  const flagEnter = useRef(false);
  const celebrationContainer = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const db = getDatabase();
  const auth = getAuth();
  const localUserRef = useRef<User>();

  useEffect(() => {
    const pathIdGame = window.location.pathname.slice(1).substring(5);
    const user = localStorage.getItem("user");
    const userOwner = sessionStorage.getItem("actualOwner");

    const gamePath = `games/${pathIdGame}`;

    if (user === userOwner) {
      onDisconnect(ref(db, gamePath))
        .remove()
        .catch((e) => console.error(e));
      return () => {
        const refGame = ref(db, gamePath);
        remove(refGame);
      };
    } else {
      onDisconnect(
        ref(db, `games/${pathIdGame}/listUsers/${auth.currentUser?.uid}`)
      )
        .remove()
        .catch((e) => console.error(e));
      return () => {
        const refGame = ref(
          db,
          `games/${pathIdGame}/listUsers/${auth.currentUser?.uid}`
        );
        remove(refGame);
      };
    }
  }, [auth]);

  //* useEffect for update all data in state
  useEffect(() => {
    try {
      const idGame = sessionStorage.getItem("actualIDGame");
      const pathIdGame = window.location.pathname.slice(1).substring(5);
      const user = localStorage.getItem("user");
      // if (idGame !== pathIdGame) {
      //   router.push("/");
      //   return;
      // }
      const actualUser = localStorage.getItem("user");
      setIdGame(pathIdGame);
      // sessionStorage.setItem("actualIDGame", id);
      const refGame = ref(db, `games/${pathIdGame}/`);
      onValue(refGame, (snapshot) => {
        const game: Game = snapshot.val();
        if (game !== null) {
          setRoomName(game.roomName);
          setTimer(game.timer);
          setTimeToStart(game.timeStart);
          setStart(game.currentGame);
          setMaxUsers(game.maxUsers);
          setRoomPassword(game.password);
          if (game.gameStart) {
            setStartCountdown(true);
          } else {
            setStartCountdown(false);
          }
          const listUsersToPush: User[] = [];
          let listUsersDB: User[] = game.listUsers;
          if (!listUsersDB) {
            listUsersDB = [];
          }
          Object.entries(listUsersDB).forEach((val) => {
            if (!val[1].kickOut) {
              const objUser: User = {
                username: val[1].username,
                clicks: val[1].clicks,
                rol: val[1].rol,
                maxScore: val[1].maxScore,
                key: val[0]
              };
              if (val[0] === auth.currentUser?.uid) {
                if (objUser.clicks !== localUserRef.current?.clicks) {
                  localUserRef.current = objUser;
                  setLocalUser(objUser);
                }
              }
              listUsersToPush.push(objUser);
            } else if (val[0] === auth.currentUser?.uid) {
              router.push({pathname: "/", query: {kickedOut: true}});
            }
          });
          setListUsers(listUsersToPush);
          if (game.ownerUser.username === actualUser) {
            setIsLocal(true);
          } else {
            if (
              listUsersToPush.filter((u) => u.username !== user).length ===
              game.maxUsers
            ) {
              router.push({pathname: "/", query: {fullRoom: true}});
              return;
            }
            if (game.password && idGame !== pathIdGame && !flagEnter.current) {
              flagEnter.current = true;
              requestPassword(game.password).then((val) => {
                if (val.isConfirmed === false) {
                  router.push("/");
                  return;
                } else {
                  sessionStorage.setItem("actualIDGame", pathIdGame);
                  addNewUserToDB(pathIdGame, user);
                }
              });
            }
            //Add user to DB
            if (!flagEnter.current) {
              flagEnter.current = true;
              addNewUserToDB(pathIdGame, user);
            }
          }
        } else {
          router.replace("/");
        }
      });
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Sorry, something went wrong. Please try again.."
      }).then(() => {
        router.push("/");
      });
    }
  }, []);

  //* function for add user to database and update state
  const addNewUserToDB = (pathIdGame: string, user: string | null) => {
    const refUser = ref(
      db,
      `games/${idGame}/listUsers/${auth.currentUser?.uid}`
    ).ref;
    get(refUser).then((data) => {
      if (data.val() === null) {
        const objUser = {
          username: user!,
          clicks: 0,
          key: auth.currentUser?.uid
        };
        setLocalUser(objUser);
        const userRef = ref(db, `games/${pathIdGame}/listUsers`);
        const localUserRef = child(userRef, `${auth.currentUser?.uid}`);
        set(localUserRef, objUser);
      }
    });
  };

  //* useEffect for update timer in state and show result
  useEffect(() => {
    if (start) {
      if (!timer) {
        const refGame = ref(db, `games/${idGame}`);
        update(refGame, {timer: null});
        const userKey = sessionStorage.getItem("userKey");
        console.log({userKey}, {localUser});
        if (userKey && localUser.maxScore && localUser.clicks) {
          if (localUser.clicks > localUser.maxScore) {
            const refUser = ref(db, `users/${userKey}`);
            update(refUser, {maxScore: localUser.clicks});
          }
        }
        if (celebrationContainer?.current?.innerHTML === "") {
          lottie.loadAnimation({
            container: celebrationContainer.current!,
            animationData: celebrationAnim
          });
        }
        return;
      }

      lottie.destroy();
      const intervalId = setInterval(() => {
        const refGame = ref(db, `games/${idGame}`);
        update(refGame, {timer: timer - 1});
      }, 1000);
      return () => clearInterval(intervalId);
    } else if (startCountdown) {
      if (!timeToStart) {
        const refGame = ref(db, `games/${idGame}`);
        update(refGame, {
          gameStart: false,
          timeStart: null,
          currentGame: true
        });
        return;
      }

      const intervalIdStart = setInterval(() => {
        const refGame = ref(db, `games/${idGame}`);
        update(refGame, {timeStart: timeToStart - 1});
      }, 1000);
      return () => clearInterval(intervalIdStart);
    }
  }, [timer, start, timeToStart, startCountdown]);

  // useEffect for put the position of the localUser
  useEffect(() => {
    if (timer === undefined) {
      for (const i in listUsers) {
        if (listUsers[i].username === localUser.username) {
          setLocalPosition(getSuffixPosition(Number(i) + 1));
        }
      }
    }
  }, [listUsers]);

  // function for update clicks
  const handleClick = () => {
    if (localUser.clicks) {
      const refGame = ref(
        db,
        `games/${idGame}/listUsers/${auth.currentUser?.uid}`
      );
      update(refGame, {clicks: localUser.clicks + 1});
    }
  };

  // function for start game
  const handleStart = () => {
    const refGame = ref(db, `games/${idGame}`);
    update(refGame, {gameStart: true});
  };

  // function for reset all data
  const handleReset = () => {
    const refGame = ref(db, `games/${idGame}`);
    update(refGame, {
      timer: 10,
      gameStart: false,
      timeStart: 3,
      currentGame: false
    });
    const refGameUsers = ref(db, `games/${idGame}/listUsers`);
    get(refGameUsers).then((snapshot) => {
      snapshot.forEach((child) => {
        update(child.ref, {clicks: 0});
      });
    });
  };

  const toggleSideBar = () => {
    if (showSideBar) {
      setShowSideBar(false);
    }
  };

  return (
    <>
      {startCountdown && timeToStart >= 0 && (
        <div className="start-countdown">
          {timeToStart === 0 ? "Go" : timeToStart}
        </div>
      )}
      <CelebrationResult
        celebrationContainer={celebrationContainer}
        timer={timer}
        listUsers={listUsers}
        localUser={localUser}
      />
      <div className="container-fluid">
        {isLocal && (
          <SettingsSideBar
            showSideBar={showSideBar}
            handleSideBar={(val: boolean) => setShowSideBar(val)}
            idGame={idGame}
            options={{maxUsers, roomName, password: roomPassword}}
          />
        )}
        <main className="main" onClick={() => toggleSideBar()}>
          <div className="room-name position-absolute d-none d-md-block">
            {roomName}
          </div>
          <div className="header pt-2 pb-5 flex-lg-row">
            <button
              className="btn-click p-2 btn-back me-auto mb-4"
              onClick={() => router.push("/")}
            >
              <FontAwesomeIcon
                icon={faArrowLeft as IconProp}
                size={"xs"}
                className="me-2"
              />
              Go back
            </button>
            <span className="d-block d-md-none m-auto">{roomName}</span>
          </div>
          {timer > 0 ? (
            <>
              <div className="row mb-3 w-100 g-4">
                <div className="col-md-6 text-center opponents-container">
                  <OpponentSection
                    isLocal={isLocal}
                    opponents={listUsers}
                    localUsername={localUser.username}
                    maxUsers={maxUsers}
                  />
                </div>
                <div className="col-md-6 text-center">
                  <LocalSection
                    isLocal={isLocal}
                    handleClick={handleClick}
                    handleStart={handleStart}
                    listUsers={listUsers}
                    localUser={localUser}
                    start={start}
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
              handleReset={handleReset}
              localPosition={localPosition}
            />
          )}
          <div className="room-info">
            {timer !== undefined && start && (
              <h2 className="text-center">{timer} seconds remaining!</h2>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

export default RoomGame;
