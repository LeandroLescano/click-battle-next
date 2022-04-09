import React, { forwardRef, useEffect, useRef, useState } from "react";
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

import FlipMove from "react-flip-move";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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

  useEffect(() => {
    let pathIdGame = window.location.pathname.slice(1).substring(5);
    let user = localStorage.getItem("user");
    let userOwner = sessionStorage.getItem("actualOwner");
    //! Uncomment this to test the game
    onDisconnect(
      ref(db, `games/${pathIdGame}/listUsers/${auth.currentUser?.uid}`)
    )
      .remove()
      .catch((e) => console.error(e));
    if (user === userOwner) {
      return () => {
        let refGame = ref(db, `games/${pathIdGame}`);
        remove(refGame);
      };
    } else {
      return () => {
        let refGame = ref(
          db,
          `games/${pathIdGame}/listUsers/${auth.currentUser?.uid}`
        );
        remove(refGame);
      };
    }
  }, [auth]);

  //* useEffect for update all data in state
  useEffect(() => {
    let idGame = sessionStorage.getItem("actualIDGame");
    let pathIdGame = window.location.pathname.slice(1).substring(5);
    let user = localStorage.getItem("user");
    // if (idGame !== pathIdGame) {
    //   router.push("/");
    //   return;
    // }
    let actualUser = localStorage.getItem("user");
    let id = window.location.pathname.slice(1).substring(5);
    setIdGame(id);
    // sessionStorage.setItem("actualIDGame", id);
    let refGame = ref(db, `games/${id}/`);
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
        let listUsers: User[] = [];
        let listUsersDB: User[] = snapshot.val().listUsers;
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
              setLocalUser(objUser);
            }
            listUsers.push(objUser);
          } else if (val[0] === auth.currentUser?.uid) {
            router.push({ pathname: "/", query: { kickedOut: true } });
          }
        });
        setListUsers(listUsers);
        if (snapshot.val().ownerUser.username === actualUser) {
          setIsLocal(true);
        } else {
          if (
            listUsers.filter((u) => u.username !== user).length ===
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
  }, []);

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

  useEffect(() => {
    if (timer === undefined) {
      for (const i in listUsers) {
        if (listUsers[i].username === localUser.username) {
          setLocalPosition(getSuffixPosition(Number(i) + 1));
        }
      }
    }
  }, [listUsers]);

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

  const checkSideBarToClose = () => {
    if (showSideBar) {
      setShowSideBar(false);
    }
  };

  //* function for kick users
  const kickUser = (userKey: string | null) => {
    if (userKey) {
      let userRef = ref(db, `games/${idGame}/listUsers/${userKey}`);
      update(userRef, { kickOut: true }).then(() => {
        Swal.fire({
          title: "The user has been kicked.",
          icon: "success",
          toast: true,
          showConfirmButton: false,
          position: "bottom-end",
          timer: 2500,
        });
      });
    }
  };

  const FlipItem = forwardRef((user: User, ref: any) => (
    <div className="visitor-container" ref={ref}>
      <div
        className={`row row-user ${
          localUser.username === user.username && "local-row"
        }`}
      >
        <div className="col-8 text-start">{user.username}</div>
        <div className={isLocal ? "col-2" : "col-4"}>{user.clicks}</div>
        {isLocal && localUser.username !== user.username && (
          <div className="col-2" onClick={() => kickUser(user.key || null)}>
            X
          </div>
        )}
      </div>
    </div>
  ));

  return (
    <>
      {startCountdown && timeToStart >= 0 && (
        <div className="start-countdown">
          {timeToStart === 0 ? "Go" : timeToStart}
        </div>
      )}
      <div
        ref={celebrationContainer}
        className={`position-absolute ${
          timer > 0
            ? "d-none"
            : listUsers[0].username === localUser.username
            ? "d-block"
            : "d-none"
        } `}
        id="celebration"
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
        <main className="main" onClick={() => checkSideBarToClose()}>
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
                  {listUsers.length > 1 ? (
                    <div className="row row-users-title">
                      <div className="col-8 text-start">
                        <p className="mb-2">
                          Opponents ({listUsers.length - 1}/{maxUsers - 1})
                        </p>
                      </div>
                      <div className={`${isLocal ? "col-2" : "col-4"} pe-4`}>
                        Clicks
                      </div>
                    </div>
                  ) : (
                    isLocal && <h4>Waiting for opponents...</h4>
                  )}
                  {/* {listUsers
                    // .filter((user) => user.key !== localUser.key)
                    .sort((a, b) => b.clicks - a.clicks)
                    .map((user, i) => {
                      return (
                        <div className="visitor-container" key={i}>
                          <div className="row row-user">
                            <div className="col-8 text-start">
                              {user.username}
                            </div>
                            <div className={isLocal ? "col-2" : "col-4"}>
                              {user.clicks}
                            </div>
                            {isLocal && (
                              <div
                                className="col-2"
                                onClick={() => kickUser(user.key || null)}
                              >
                                X
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })} */}
                  <FlipMove
                    duration={700}
                    delay={0}
                    easing="ease"
                    staggerDurationBy={15}
                    staggerDelayBy={20}
                  >
                    {listUsers
                      // .filter((user) => user.key !== localUser.key)
                      .sort((a, b) => b.clicks - a.clicks)
                      .map((user, i) => {
                        return <FlipItem key={user.key} {...user} />;
                      })}
                  </FlipMove>
                </div>
                <div className="col-md-6 text-center">
                  {!start && !startCountdown ? (
                    isLocal ? (
                      <h4>press start to play</h4>
                    ) : (
                      <h4>Waiting for host...</h4>
                    )
                  ) : (
                    <h4>You have {localUser.clicks} clicks!</h4>
                  )}
                  <div className="d-flex justify-content-around">
                    <button
                      className="btn-click my-2"
                      disabled={!start}
                      onClick={handleClick}
                    >
                      Click
                    </button>
                    {isLocal && !start && !startCountdown && (
                      <button
                        className="btn-click my-2"
                        disabled={!start && listUsers.length < 2}
                        onClick={() => handleStart()}
                      >
                        Start!
                      </button>
                    )}
                  </div>
                  <p className="mt-3 mb-0">{localUser.username}</p>
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
