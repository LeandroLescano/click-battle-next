// React
import React, {createRef, useEffect, useState} from "react";

// Utils
import {sha256} from "services/encode";

// Interfaces
import {Game, User} from "interfaces";

// Router
import {useRouter} from "next/dist/client/router";

// Firebase
import {
  child,
  get,
  getDatabase,
  onValue,
  push,
  ref,
  set,
  update,
  serverTimestamp
} from "@firebase/database";
import {getAuth, signInAnonymously, UserCredential} from "firebase/auth";
import {getAnalytics, logEvent} from "firebase/analytics";
import {getUser} from "services/user";

// Components
import {CardGame, Footer, requestPassword} from "components";
import {ModalCreateUsername} from "components/ModalCreateUsername";
import ModalLogin from "../components/modalLogin";

// Utils
import Swal from "sweetalert2";
import {range} from "utils/numbers";

import type {NextPage} from "next";

const Home: NextPage = () => {
  const [listGames, setListGames] = useState<Game[]>([]);
  const [user, setUser] = useState<User>({username: ""});
  const [roomName, setRoomName] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [maxUsers, setMaxUsers] = useState(2);
  const [config, setConfig] = useState({
    maxUsers: 10
  });
  const router = useRouter();
  const db = getDatabase();
  const auth = getAuth();
  const btnModal = createRef<HTMLButtonElement>();
  const btnModalUsername = createRef<HTMLButtonElement>();

  const updateUserName = (name: string) => {
    const key = sessionStorage.getItem("userKey");
    const objUser: User = JSON.parse(sessionStorage.getItem("objUser")!);
    if (objUser) {
      setUser(objUser);
    } else if (key !== null) {
      const refUsers = ref(db, `users/${key}`);
      onValue(refUsers, (snapshot) => {
        const obj = {
          username: snapshot.val().username,
          maxScore: snapshot.val().maxScore,
          email: snapshot.val().email
        };
        setUser(obj);
        sessionStorage.setItem("objUser", JSON.stringify(obj));
      });
    } else {
      setUser({
        username: name
      });
    }
  };

  useEffect(() => {
    //If exist userKey get user from DB
    let mounted = true;
    if (router.query.kickedOut === "true") {
      router.replace("/");
      Swal.fire({
        title: "You were kicked out by the owner.",
        icon: "error",
        confirmButtonText: "Ok"
      });
    } else if (router.query.fullRoom === "true") {
      router.replace("/");
      Swal.fire({
        title: "The room is full.",
        icon: "error",
        confirmButtonText: "Ok"
      });
    }

    //If user name exist, update it on state
    if (mounted) {
      auth.onAuthStateChanged((user) => {
        console.log({user});
        if (user) {
          if (user.isAnonymous) {
            const username = localStorage.getItem("user");
            if (user.uid && username) {
              localStorage.setItem("uid", user.uid);
              setUser({username: username});
            }
          } else {
            const key = sessionStorage.getItem("userKey");
            const objUser = JSON.parse(sessionStorage.getItem("objUser")!);
            if (objUser) {
              if (!localStorage.getItem("user")) {
                localStorage.setItem("user", objUser.username);
              }
              setUser(objUser);
              if (key) {
                getUser(key).then((dbUser) => {
                  if (dbUser !== objUser) {
                    setUser(dbUser);
                    sessionStorage.setItem("objUser", JSON.stringify(dbUser));
                  }
                });
              }
            } else if (key) {
              updateUserName("");
            } else {
              let finded = false;
              const refUsers = ref(db, "users");
              get(refUsers).then((snapshot) => {
                if (snapshot.val() !== null) {
                  const usersDB: User = snapshot.val();
                  console.log({usersDB});
                  Object.entries(usersDB).forEach((value) => {
                    if (value[1].email && value[1].email === user.email) {
                      finded = true;
                      const obj = {
                        username: value[1].username,
                        maxScore: value[1].maxScore,
                        email: value[1].email
                      };
                      localStorage.setItem("user", value[1].username);
                      sessionStorage.setItem("userKey", value[0]);
                      setUser(obj);
                      sessionStorage.setItem("objUser", JSON.stringify(obj));
                    }
                  });
                }
              });
              if (!finded) {
                btnModal.current?.click();
                auth.signOut();
              }
            }
          }
        } else {
          const currentUser = localStorage.getItem("user");
          console.log({currentUser});
          if (currentUser) {
            updateUserName(currentUser);
          } else {
            console.log("OPEN MODAL");
            btnModal.current?.click();
          }
        }
      });
    }
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    //Get rooms of games from DB
    if (user.username !== "") {
      const refGames = ref(db, `games`);
      onValue(refGames, (snapshot) => {
        if (snapshot.val() !== null) {
          if (mounted) {
            setListGames(snapshot.val());
          }
        } else {
          setListGames([]);
        }
      });
      get(ref(db, "/config")).then((snapshot) => {
        if (snapshot.val()) {
          setConfig(snapshot.val());
          sessionStorage.setItem("config", JSON.stringify(snapshot.val()));
        }
      });
    }
    return () => {
      mounted = false;
    };
  }, [user.username]);

  //Function for create room
  const handleCreate = () => {
    let newRoomName;
    const newGameRef = ref(db, "games/");
    if (roomName === "") {
      newRoomName = user.username + "'s room";
    } else {
      newRoomName = roomName;
    }
    const userToPush: User = {
      username: user.username,
      clicks: 0,
      rol: "owner"
    };
    if (user.maxScore) {
      userToPush["maxScore"] = user.maxScore;
    }

    const objRoom: Game = {
      roomName: newRoomName,
      currentGame: false,
      gameStart: false,
      listUsers: [],
      ownerUser: user,
      visitorUser: "",
      timeStart: 3,
      timer: 10,
      maxUsers: +maxUsers,
      created: serverTimestamp()
    };
    const newKey = push(newGameRef, objRoom).key;
    const childNewGame = child(
      newGameRef,
      `${newKey}/listUsers/${auth.currentUser?.uid}`
    );
    set(childNewGame, userToPush);
    if (roomPassword !== "") {
      const refActualGame = ref(db, `games/${newKey}`);
      sha256(roomPassword).then((hash) =>
        update(refActualGame, {password: hash})
      );
    }
    if (newKey) {
      logEvent(getAnalytics(), "create_room", {
        action: "create_room",
        params: {
          withCustomName: !!roomName,
          withPassword: !!roomPassword,
          maxUsers: maxUsers,
          isRegistered: !auth.currentUser?.isAnonymous
        }
      });
      sessionStorage.setItem("actualIDGame", newKey);
      sessionStorage.setItem("actualOwner", user.username);
      sessionStorage.setItem("gameUserKey", "0");
      router.push("/game/" + newKey);
    } else {
      Swal.fire({
        icon: "error",
        title: "Ups! We couldn't create the room, please try again.",
        timer: 3000
      });
    }
  };

  //Function for enter room
  const handleEnterGame = (
    idGame: string,
    owner: string,
    actualUsers: User[],
    maxUsers: number,
    password: string
  ) => {
    try {
      if (Object.keys(actualUsers).length === maxUsers) {
        Swal.fire({
          icon: "warning",
          title: "Room is full",
          toast: true,
          showConfirmButton: false,
          position: "bottom-end",
          timer: 3000
        });
      } else {
        if (password) {
          requestPassword(password).then((val) => {
            console.log(val);
            if (val) configRoomToEnter(idGame, owner);
          });
        } else {
          configRoomToEnter(idGame, owner);
        }
      }
    } catch (error) {
      console.log(error);
      Swal.fire({
        icon: "error",
        title: "Ups! We couldn't enter the room, please try again.",
        timer: 3000,
        timerProgressBar: true
      });
    }
  };

  //Function for add actualGameID to sessionStorage and add new user to game in database
  const configRoomToEnter = (idGame: string, owner: string) => {
    sessionStorage.setItem("actualIDGame", idGame);
    sessionStorage.setItem("actualOwner", owner);
    if (owner !== user.username) {
      if (auth.currentUser?.uid) {
        const userToPush: User = {
          username: user.username,
          clicks: 0,
          rol: "visitor"
        };
        if (user.maxScore) {
          userToPush["maxScore"] = user.maxScore;
        }
        const refGame = ref(db, `games/${idGame}/listUsers`);
        const childRef = child(refGame, auth.currentUser.uid);
        set(childRef, userToPush);
        logEvent(getAnalytics(), "enter_room", {
          action: "enter_room",
          params: {
            withCustomName: !!roomName,
            withPassword: !!roomPassword,
            maxUsers: maxUsers,
            isRegistered: !auth.currentUser.isAnonymous
          }
        });
        router.push(`game/${idGame}`);
      } else {
        console.error("Error loading user to game");
      }
    }
  };

  //Function for handle input room name
  const handleChangeRoomName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomName(e.target.value);
  };

  //Function for update the password of the room
  const handleChangePass = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomPassword(e.target.value);
  };

  //Function for update maxUsers for the new room
  const handleNumberUsers = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMaxUsers(Number(e.target.value));
  };

  //Function for login a guest user
  const handleLoginGuest = (user: string) => {
    localStorage.setItem("user", user);
    signInAnonymously(auth)
      .then(() => {
        setUser({username: user});
      })
      .catch((e) => console.error(e));
    btnModal.current?.click();
  };

  //Function for login a Google account user
  const handleLoginGoogle = (data: UserCredential) => {
    //Check if user is new
    const userEmail = data.user.email;
    let userNew = true;
    const refUsers = ref(db, "users");
    onValue(refUsers, (snapshot) => {
      if (snapshot.val() !== null) {
        const usersDB: User = snapshot.val();
        Object.entries(usersDB).forEach((value) => {
          if (value[1].email && value[1].email === userEmail) {
            userNew = false;
            localStorage.setItem("user", value[1].username);
            sessionStorage.setItem("userKey", value[0]);
            setUser({
              username: value[1].username,
              maxScore: value[1].maxScore,
              email: value[1].email
            });
            return;
          }
        });
        if (userNew) {
          const refUsers = ref(db, "users");
          const newKeyUser = push(refUsers, {
            email: userEmail,
            maxScore: 0,
            username: data.user.displayName
          }).key;
          if (newKeyUser) {
            sessionStorage.setItem("userKey", newKeyUser);
          } else {
            console.error("Error generating new user");
          }
          if (data.user.displayName) {
            setUser({
              username: data.user.displayName
            });
            btnModal.current?.click();
            btnModalUsername.current?.click();
          }
        }
      }
    });
  };

  //Function for logout user.
  const handleLogOut = () => {
    if (auth.currentUser) {
      auth.signOut();
    }
    setUser({...user, username: "", maxScore: 0});
    localStorage.removeItem("user");
    sessionStorage.removeItem("userKey");
    btnModal.current?.click();
  };

  return (
    <>
      <div className="main">
        <button
          ref={btnModal}
          type="button"
          hidden
          data-bs-toggle="modal"
          data-bs-target="#modalLogin"
          id="btnModal"
        ></button>
        <button
          type="button"
          hidden
          data-bs-toggle="modal"
          data-bs-target="#modalCreateUsername"
          id="btnModalUsername"
          ref={btnModalUsername}
        ></button>
        <div className="row row-home h-100 w-100">
          <div className="col-lg-4 order-md-2 create-section">
            <h1 className="text-center mb-4">Click battle!</h1>
            <button
              className="btn-click mb-3 mb-md-5"
              disabled={!user.username}
              onClick={() => handleCreate()}
            >
              Create game
            </button>
            <span>Insert room name</span>
            <input
              type="text"
              className="form-name mb-2"
              data-label="Room name"
              value={roomName}
              onChange={(ref) => handleChangeRoomName(ref)}
              placeholder={`${user.username}'s room`}
            />
            <span>Insert room password (op)</span>
            <input
              type="password"
              className="form-name mb-2"
              data-label="Password"
              value={roomPassword}
              onChange={(ref) => handleChangePass(ref)}
              placeholder={`Password`}
            />
            <span>Max number of users</span>
            <select
              className="form-name mb-2"
              data-label="Room name"
              value={maxUsers}
              onChange={(ref) => handleNumberUsers(ref)}
            >
              {[...Array.from(range(2, config.maxUsers + 1))].map((val, i) => (
                <option key={i} value={val}>
                  {val}
                </option>
              ))}
            </select>
          </div>
          <div className="col-lg-8 order-md-1 rooms-section">
            <h2>Available rooms</h2>
            {Object.entries(listGames).length > 0 ? (
              <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 h-100">
                {Object.entries(listGames).map((game, i) => {
                  return (
                    <CardGame
                      game={game}
                      key={i}
                      roomNumber={i}
                      handleEnterGame={() =>
                        handleEnterGame(
                          game[0],
                          game[1].ownerUser.username,
                          game[1].listUsers,
                          game[1].maxUsers,
                          game[1].password || ""
                        )
                      }
                    />
                  );
                })}
              </div>
            ) : (
              <h4 className="h-100">
                No available rooms right now, create one!
              </h4>
            )}
          </div>
        </div>
        <Footer user={user} handleLogOut={handleLogOut} />
        {user.email && (
          <div className="score-container float-right">
            Max score: {user.maxScore}
          </div>
        )}
      </div>
      <ModalLogin
        loginGuest={(name) => handleLoginGuest(name)}
        close={() => document.getElementById("btnModal")!.click()}
        loginGoogle={(name) => handleLoginGoogle(name)}
      />
      <ModalCreateUsername onClose={() => btnModalUsername.current?.click()} />
    </>
  );
};

export default Home;
