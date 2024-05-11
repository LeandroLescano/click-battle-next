// React
import React, {useEffect, useRef, useState} from "react";
import Image from "next/image";
import {useRouter} from "next/navigation";
import {Spinner} from "react-bootstrap";
import Swal from "sweetalert2";
import {getAnalytics, logEvent} from "firebase/analytics";
import lottie from "lottie-web";
import {
  child,
  get,
  getDatabase,
  push,
  ref,
  serverTimestamp,
  set
} from "firebase/database";

import logoAnim from "lotties/logo-animated.json";
import {Game, GameSettings, GameUser, Room} from "interfaces";
import {useAuth} from "contexts/AuthContext";
import {sha256} from "services/encode";
import {range} from "utils/numbers";
import {AVAILABLE_TIMES, DEFAULT_VALUES} from "resources/constants";

const CreateSection = () => {
  const [creating, setCreating] = useState(false);
  const {user, gameUser} = useAuth();
  const [room, setRoom] = useState<Partial<Room>>({
    maxUsers: DEFAULT_VALUES.MIN_USERS,
    timer: DEFAULT_VALUES.DEFAULT_TIMER
  });
  const [config, setConfig] = useState({
    maxUsers: 10
  });
  const logoContainer = useRef<HTMLDivElement>(null);
  const db = getDatabase();
  const router = useRouter();

  const handleUpdateRoom = (data: Partial<Room>) => {
    setRoom((prev) => ({...prev, ...data}));
  };

  //Function for create room
  const handleCreate = async () => {
    try {
      if (gameUser && room) {
        setCreating(true);
        const newRoomName = room.name || gameUser.username + "'s room";
        const newGameRef = ref(db, "games/");

        const userToPush: GameUser = {
          username: gameUser.username,
          clicks: 0,
          rol: "owner"
        };

        if (gameUser.maxScores) {
          userToPush.maxScores = gameUser.maxScores;
        }

        if (room.timer) {
          if (room.timer < DEFAULT_VALUES.MIN_TIMER)
            room.timer = DEFAULT_VALUES.MIN_TIMER;
          if (room.timer > DEFAULT_VALUES.MAX_TIMER)
            room.timer = DEFAULT_VALUES.MAX_TIMER;
        }

        if (room.maxUsers) {
          if (room.maxUsers > config.maxUsers) room.maxUsers = config.maxUsers;
          if (room.maxUsers < DEFAULT_VALUES.MIN_USERS)
            room.maxUsers = DEFAULT_VALUES.MIN_USERS;
        }

        const timer = room.timer || DEFAULT_VALUES.DEFAULT_TIMER;

        const settings: GameSettings = {
          timer,
          maxUsers: room.maxUsers || DEFAULT_VALUES.MIN_USERS
        };

        if (room.password) {
          settings.password = await sha256(room.password);
        }

        const objRoom: Game = {
          roomName: newRoomName,
          currentGame: false,
          gameStart: false,
          listUsers: [],
          ownerUser: gameUser,
          timeStart: 3,
          timer,
          created: serverTimestamp(),
          settings
        };

        objRoom.key = push(newGameRef, objRoom).key;
        const childNewGame = child(
          newGameRef,
          `${objRoom.key}/listUsers/${user?.uid}`
        );

        await set(childNewGame, userToPush);

        if (objRoom.key) {
          logEvent(getAnalytics(), "create_room", {
            action: "create_room",
            withCustomName: !!room.name,
            withPassword: !!room.password,
            maxUsers: room.maxUsers,
            isRegistered: !user?.isAnonymous
          });

          sessionStorage.setItem("actualIDGame", objRoom.key);
          sessionStorage.setItem("actualOwner", gameUser.username);
          sessionStorage.setItem("gameUserKey", "0");

          router.push("/game/" + objRoom.key);
        } else {
          Swal.fire({
            icon: "error",
            title: "Ups! We couldn't create the room, please try again.",
            timer: 3000,
            heightAuto: false
          });
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (gameUser?.username) {
      get(ref(db, "config")).then((snapshot) => {
        const defaultConfig = snapshot.val();
        if (defaultConfig) {
          setConfig(defaultConfig);
          sessionStorage.setItem("config", JSON.stringify(defaultConfig));
        }
      });
      if (logoContainer?.current?.innerHTML === "") {
        lottie.loadAnimation({
          container: logoContainer.current!,
          animationData: logoAnim,
          renderer: "svg",
          loop: true,
          autoplay: true
        });
      }
    }
  }, [gameUser?.username]);

  return (
    <>
      <div className="d-flex flex-column flex-md-row align-items-center justify-content-center gap-2 mb-2">
        <div ref={logoContainer} style={{height: "100px"}} />
        <h1 className="text-center mb-0 flex-1">Click battle!</h1>
      </div>
      <button
        className="btn-click mb-3 mb-md-5 d-flex justify-content-center align-items-center"
        disabled={!gameUser?.username || creating}
        onClick={handleCreate}
      >
        <span className={creating ? "opacity-0" : ""}>Create game</span>
        <Spinner
          className={`position-absolute ${!creating ? "opacity-0" : ""}`}
        />
      </button>
      <span>Insert room name</span>
      <input
        type="text"
        className="form-name mb-2"
        data-label="Room name"
        value={room?.name}
        onChange={(ref) => handleUpdateRoom({name: ref.target.value})}
        placeholder={
          gameUser?.username ? `${gameUser.username}'s room` : "Room name"
        }
      />
      <span>Insert room password (op)</span>
      <input
        type="password"
        className="form-name mb-2"
        data-label="Password"
        value={room?.password || ""}
        onChange={(ref) => handleUpdateRoom({password: ref.target.value})}
        placeholder={`Password`}
      />
      <span>Max number of users</span>
      <select
        className="form-name mb-2"
        data-label="Room name"
        value={room?.maxUsers}
        onChange={(ref) =>
          handleUpdateRoom({maxUsers: Number(ref.target.value)})
        }
      >
        {[
          ...Array.from(range(DEFAULT_VALUES.MIN_USERS, config.maxUsers + 1))
        ].map((val, i) => (
          <option key={i} value={val}>
            {val}
          </option>
        ))}
      </select>
      <span>Timer</span>
      <select
        className="form-name mb-2"
        data-label="Room name"
        value={room?.timer}
        onChange={(ref) => handleUpdateRoom({timer: Number(ref.target.value)})}
      >
        {AVAILABLE_TIMES.map((val, i) => (
          <option key={i} value={val}>
            {val}
          </option>
        ))}
      </select>
    </>
  );
};

export default CreateSection;
