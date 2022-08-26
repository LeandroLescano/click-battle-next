import React, { useEffect, useRef, useState } from "react";
import {
  child,
  get,
  getDatabase,
  onDisconnect,
  onValue,
  ref,
  remove,
  set,
  update,
} from "@firebase/database";

import CelebrationResult from "../../components/roomGame/CelebrationResult";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import LocalSection from "../../components/roomGame/LocalSection";
import OpponentSection from "../../components/roomGame/OpponentSection";
import ResultSection from "../../components/roomGame/ResultSection";
import SettingsSideBar from "../../components/SettingsSideBar";
import Swal from "sweetalert2";
import celebrationAnim from "../../lotties/celebrationAnim.json";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { getAuth } from "@firebase/auth";
import lottie from "lottie-web";
import { requestPassword } from "../../components/Alerts";
import { useRouter } from "next/dist/client/router";

export interface User {
  username: string;
  clicks: number;
  rol?: string;
  maxScore?: number;
  key?: string;
  kickOut?: boolean;
}

function RoomGame() {
  const [isLocal, setIsLocal] = useState(false);
  const [idGame, setIdGame] = useState<String>();
  const [roomName, setRoomName] = useState<string>();
  const [maxUsers, setMaxUsers] = useState(2);
  const [start, setStart] = useState(false);
  const [startCountdown, setStartCountdown] = useState(false);
  const [roomPassword, setRoomPassword] = useState<string>();
  const [localPosition, setLocalPosition] = useState<String>();
  const [showSideBar, setShowSideBar] = useState(false);
  const [localUser, setLocalUser] = useState<User>({
    username: "",
    clicks: 0,
  });
  const [listUsers, setListUsers] = useState<User[]>([
    { username: "", clicks: 0, rol: "visitor" },
  ]);
  const [timer, setTimer] = useState(10);
  const [timeToStart, setTimeToStart] = useState(3);
  const flagEnter = useRef(false);
  const celebrationContainer = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const db = getDatabase();
  const auth = getAuth();
  const listUsersRef = useRef<User[]>([
    { username: "", clicks: 0, rol: "visitor" },
  ]);
  const localUserRef = useRef<User>();

  useEffect(() => {
    let pathIdGame = window.location.pathname.slice(1).substring(5);
    let user = localStorage.getItem("user");
    let userOwner = sessionStorage.getItem("actualOwner");
    //! Uncomment this to test the game
    // onDisconnect(
    //   ref(db, `games/${pathIdGame}/listUsers/${auth.currentUser?.uid}`)
    // )
    //   .remove()
    //   .catch((e) => console.error(e));
    // if (user === userOwner) {
    //   return () => {
    //     let refGame = ref(db, `games/${pathIdGame}`);
    //     remove(refGame);
    //     let refGameList = ref(db, `gamesList/${pathIdGame}`);
    //     remove(refGameList);
    //   };
    // } else {
    //   return () => {
    //     let refGame = ref(
    //       db,
    //       `games/${pathIdGame}/listUsers/${auth.currentUser?.uid}`
    //     );
    //     remove(refGame);
    //   };
    // }
  }, [auth]);

  //* useEffect for update all data in state
  useEffect(() => {
    try {
      let idGame = sessionStorage.getItem("actualIDGame");
      let pathIdGame = window.location.pathname.slice(1).substring(5);
      let user = localStorage.getItem("user");
      // if (idGame !== pathIdGame) {
      //   router.push("/");
      //   return;
      // }
      let actualUser = localStorage.getItem("user");
      setIdGame(pathIdGame);
      // sessionStorage.setItem("actualIDGame", id);
      let refGame = ref(db, `games/${pathIdGame}/`);
      onValue(refGame, (snapshot) => {
        if (snapshot.val() !== null) {
          setRoomName(snapshot.val().roomName);
          setTimer(snapshot.val().timer);
          setTimeToStart(snapshot.val().timeStart);
          setStart(snapshot.val().currentGame);
          setMaxUsers(snapshot.val().maxUsers);
          setRoomPassword(snapshot.val().password);
          if (snapshot.val().gameStart) {
            setStartCountdown(true);
          } else {
            setStartCountdown(false);
          }
          let listUsersToPush: User[] = [];
          let listUsersDB: User[] = snapshot.val().listUsers;
          if (!listUsersDB) {
            listUsersDB = [];
          }
          const checkOrderArray = (arr1: User[], arr2: User[]) => {
            for (let x = 0; x < arr1.length; x++) {
              if (arr1[x].key !== arr2[x]?.key) {
                return false;
              }
            }
            return true;
          };
          Object.entries(listUsersDB).forEach((val) => {
            if (!val[1].kickOut) {
              let objUser: User = {
                username: val[1].username,
                clicks: val[1].clicks,
                rol: val[1].rol,
                maxScore: val[1].maxScore,
                key: val[0],
              };
              if (val[0] === auth.currentUser?.uid) {
                if (objUser.clicks !== localUserRef.current?.clicks) {
                  localUserRef.current = objUser;
                  setLocalUser(objUser);
                }
              }
              listUsersToPush.push(objUser);
            } else if (val[0] === auth.currentUser?.uid) {
              router.push({ pathname: "/", query: { kickedOut: true } });
            }
          });
          // if (
          //   !checkOrderArray(
          //     listUsersToPush.sort((a, b) => b.clicks - a.clicks),
          //     listUsersRef.current.sort((a, b) => b.clicks - a.clicks)
          //   )
          // ) {
          //   listUsersRef.current = listUsersToPush;
          setListUsers(listUsersToPush);
          // }
          // if (!listUsersRef.current[0].key) {
          //   listUsersRef.current = listUsersToPush;
          // }
          if (snapshot.val().ownerUser.username === actualUser) {
            setIsLocal(true);
          } else {
            if (
              listUsersToPush.filter((u) => u.username !== user).length ===
              snapshot.val().maxUsers
            ) {
              router.push({ pathname: "/", query: { fullRoom: true } });
              return;
            }
            if (
              snapshot.val().password &&
              idGame !== pathIdGame &&
              !flagEnter.current
            ) {
              flagEnter.current = true;
              requestPassword(snapshot.val().password).then((val) => {
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
        text: "Sorry, something went wrong. Please try again..",
      }).then(() => {
        router.push("/");
      });
    }
  }, []);

  //* function for add user to database and update state
  const addNewUserToDB = (pathIdGame: string, user: string | null) => {
    let refUser = ref(
      db,
      `games/${idGame}/listUsers/${auth.currentUser?.uid}`
    ).ref;
    get(refUser).then((data) => {
      if (data.val() === null) {
        let objUser = {
          username: user!,
          clicks: 0,
          key: auth.currentUser?.uid,
        };
        setLocalUser(objUser);
        let userRef = ref(db, `games/${pathIdGame}/listUsers`);
        let localUserRef = child(userRef, `${auth.currentUser?.uid}`);
        set(localUserRef, objUser);
      }
    });
  };

  //* useEffect for update timer in state and show result
  useEffect(() => {
    if (start) {
      if (!timer) {
        let refGame = ref(db, `games/${idGame}`);
        update(refGame, { timer: null });
        let userKey = sessionStorage.getItem("userKey");
        console.log({ userKey }, { localUser });
        if (userKey && localUser.maxScore) {
          if (localUser.clicks > localUser.maxScore) {
            let refUser = ref(db, `users/${userKey}`);
            update(refUser, { maxScore: localUser.clicks });
          }
        }
        if (celebrationContainer?.current?.innerHTML === "") {
          lottie.loadAnimation({
            container: celebrationContainer.current!,
            animationData: celebrationAnim,
          });
        }
        return;
      }

      lottie.destroy();
      const intervalId = setInterval(() => {
        let refGame = ref(db, `games/${idGame}`);
        update(refGame, { timer: timer - 1 });
      }, 1000);
      return () => clearInterval(intervalId);
    } else if (startCountdown) {
      if (!timeToStart) {
        let refGame = ref(db, `games/${idGame}`);
        update(refGame, {
          gameStart: false,
          timeStart: null,
          currentGame: true,
        });
        return;
      }

      const intervalIdStart = setInterval(() => {
        let refGame = ref(db, `games/${idGame}`);
        update(refGame, { timeStart: timeToStart - 1 });
      }, 1000);
      return () => clearInterval(intervalIdStart);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer, start, timeToStart, startCountdown]);

  //* useEffect for put the position of the localUser
  useEffect(() => {
    if (timer === undefined) {
      for (const i in listUsers) {
        if (listUsers[i].username === localUser.username) {
          setLocalPosition(getSuffixPosition(Number(i) + 1));
        }
      }
    }
  }, [listUsers]);

  //* function for get suffix position
  const getSuffixPosition = (i: number) => {
    var j = i % 10,
      k = i % 100;
    if (j == 1 && k != 11) {
      return i + "st";
    }
    if (j == 2 && k != 12) {
      return i + "nd";
    }
    if (j == 3 && k != 13) {
      return i + "rd";
    }
    return i + "th";
  };

  //* function for update clicks
  const handleClick = () => {
    let refGame = ref(db, `games/${idGame}/listUsers/${auth.currentUser?.uid}`);
    update(refGame, { clicks: localUser.clicks + 1 });
  };

  //* function for start game
  const handleStart = () => {
    let refGame = ref(db, `games/${idGame}`);
    update(refGame, { gameStart: true });
  };

  //* function for reset all data
  const handleReset = () => {
    let refGame = ref(db, `games/${idGame}`);
    update(refGame, {
      timer: 10,
      gameStart: false,
      timeStart: 3,
      currentGame: false,
    });
    let refGameUsers = ref(db, `games/${idGame}/listUsers`);
    get(refGameUsers).then((snapshot) => {
      snapshot.forEach((child) => {
        update(child.ref, { clicks: 0 });
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
            options={{ maxUsers, roomName, password: roomPassword }}
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
                icon={faArrowLeft}
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
