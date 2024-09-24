// React
import React, {useEffect, useRef, useState} from "react";
import {useRouter} from "next/navigation";
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
import {useTranslation} from "react-i18next";

import logoAnim from "lotties/logo-animated.json";
import {Game, GameSettings, GameUser, Room} from "interfaces";
import {useAuth} from "contexts/AuthContext";
import {sha256} from "services/encode";
import {range} from "utils/numbers";
import {AVAILABLE_TIMES, DEFAULT_VALUES} from "resources/constants";
import {useGame} from "contexts/GameContext";
import {Input} from "components-new/Input";
import {Button} from "components-new/Button";
import {Select} from "components-new/Select";

export const CreateSection = () => {
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
  const {t} = useTranslation();
  const {setGame} = useGame();

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
          ownerUser: {...gameUser, key: user?.uid},
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

          setGame({
            ...objRoom,
            key: objRoom.key
          });

          sessionStorage.setItem("gameUserKey", "0");

          router.push("/new/game/" + objRoom.key);
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
      <h2 className="text-5xl font-extrabold self-start">
        {t("Create your own room")}
      </h2>
      <div className="flex-1 flex flex-col justify-end">
        <div className="flex justify-between items-end gap-9 w-full flex-1">
          <Input
            label={t("Insert room name")}
            labelColor="text-primary-200"
            type="text"
            className="mb-2 h-12"
            containerClassName="flex-1"
            data-label="Room name"
            value={room?.name}
            onChange={(ref) => handleUpdateRoom({name: ref.target.value})}
            placeholder={
              gameUser?.username
                ? t("Name's room", {name: gameUser.username})
                : t("Room name")
            }
          />
          <Input
            label={t("Insert room password (op)")}
            labelColor="text-primary-200"
            type="password"
            className="mb-2 h-12"
            containerClassName="flex-1"
            data-label="Password"
            value={room?.password || ""}
            onChange={(ref) => handleUpdateRoom({password: ref.target.value})}
            placeholder={t("Password")}
          />
        </div>
        <div className="flex justify-between items-center gap-9 w-full flex-1">
          <Select
            label={t("Max number of users")}
            labelColor="text-primary-200"
            className="mb-2 h-12"
            containerClassName="flex-1"
            data-label="Max number of users"
            value={room?.maxUsers}
            onChange={(ref) =>
              handleUpdateRoom({maxUsers: Number(ref.target.value)})
            }
          >
            {[
              ...Array.from(
                range(DEFAULT_VALUES.MIN_USERS, config.maxUsers + 1)
              )
            ].map((val, i) => (
              <option key={i} value={val}>
                {val}
              </option>
            ))}
          </Select>
          <Select
            label={t("Timer")}
            labelColor="text-primary-200"
            className="mb-2 h-12"
            containerClassName="flex-1"
            data-label="Timer"
            value={room?.timer}
            onChange={(ref) =>
              handleUpdateRoom({timer: Number(ref.target.value)})
            }
          >
            {AVAILABLE_TIMES.map((val, i) => (
              <option key={i} value={val}>
                {val}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <Button
        className="self-start w-80 text-3xl p-6 leading-none"
        disabled={!gameUser?.username || creating}
        onClick={handleCreate}
        loading={creating}
        loadingText="Creating..."
      >
        {t("Create game")}
      </Button>
    </>
  );
};
