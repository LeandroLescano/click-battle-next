// React
import React, {useEffect, useState} from "react";

// Hooks
import {useAuth} from "contexts/AuthContext";

// Firebase
import {getAnalytics, logEvent} from "firebase/analytics";
import {
  child,
  get,
  getDatabase,
  push,
  ref,
  serverTimestamp,
  set,
  update
} from "firebase/database";

// Interfaces
import {Game, GameUser, Room} from "interfaces";

// Router
import {useRouter} from "next/router";

// Utils
import {sha256} from "services/encode";
import Swal from "sweetalert2";
import {range} from "utils/numbers";
import {AVAILABLE_TIMES} from "resources/constants";

const CreateSection = () => {
  const [creating, setCreating] = useState(false);
  const {user, gameUser} = useAuth();
  const [room, setRoom] = useState<Partial<Room>>({
    maxUsers: 2,
    timer: 10
  });
  const [config, setConfig] = useState({
    maxUsers: 10
  });
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
        let newRoomName = gameUser.username + "'s room";
        const newGameRef = ref(db, "games/");

        if (room.name) {
          newRoomName = room.name;
        }

        const userToPush: GameUser = {
          username: gameUser.username,
          clicks: 0,
          rol: "owner"
        };

        if (gameUser.maxScore) {
          userToPush["maxScore"] = gameUser.maxScore;
        }

        const objRoom: Game = {
          roomName: newRoomName,
          currentGame: false,
          gameStart: false,
          listUsers: [],
          ownerUser: gameUser,
          visitorUser: "",
          timeStart: 3,
          timer: room.timer || 10,
          maxUsers: room.maxUsers || 2,
          created: serverTimestamp()
        };

        objRoom.key = push(newGameRef, objRoom).key;
        const childNewGame = child(
          newGameRef,
          `${objRoom.key}/listUsers/${user?.uid}`
        );

        await set(childNewGame, userToPush);

        if (room.password) {
          const refActualGame = ref(db, `games/${objRoom.key}`);
          sha256(room.password).then((hash) =>
            update(refActualGame, {password: hash})
          );
        }

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
            timer: 3000
          });
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (gameUser?.username) {
      get(ref(db, "/config")).then((snapshot) => {
        if (snapshot.val()) {
          setConfig(snapshot.val());
          sessionStorage.setItem("config", JSON.stringify(snapshot.val()));
        }
      });
    }
  }, [gameUser?.username]);

  return (
    <div className="col-lg-4 order-md-2 create-section">
      <h1 className="text-center mb-4">Click battle!</h1>
      <button
        className="btn-click mb-3 mb-md-5"
        disabled={!gameUser?.username || creating}
        onClick={() => handleCreate()}
      >
        Create game
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
        {[...Array.from(range(2, config.maxUsers + 1))].map((val, i) => (
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
    </div>
  );
};

export default CreateSection;
