import {
  GameMode,
  GameUser,
  normalizeRoomCreation
} from "@leandrolescano/click-battle-core";
import {getAnalytics, logEvent} from "firebase/analytics";
import {
  child,
  get,
  getDatabase,
  push,
  ref,
  serverTimestamp,
  set
} from "firebase/database";
import lottie from "lottie-web";
import {useRouter} from "next/navigation";
import React, {useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import Swal from "sweetalert2";

import {Button} from "components-new/Button";
import {Input} from "components-new/Input";
import {Select} from "components-new/Select";
import {useAuth} from "contexts/AuthContext";
import {useGame} from "contexts/GameContext";
import {Game, Room} from "interfaces";
import {
  DEFAULT_GAME_MODE,
  getGameModeLabelKey,
  isReactionMode,
  SUPPORTED_WEB_GAME_MODES
} from "lib/game/gameModes";
import logoAnim from "lotties/logo-animated.json";
import {AVAILABLE_TIMES, DEFAULT_VALUES} from "resources/constants";
import {sha256} from "services/encode";
import {range} from "utils/numbers";

export const CreateSection = () => {
  const [creating, setCreating] = useState(false);
  const {user, gameUser} = useAuth();
  const [room, setRoom] = useState<Partial<Room>>({
    gameMode: DEFAULT_GAME_MODE,
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
  const selectedGameMode = room.gameMode || DEFAULT_GAME_MODE;
  const showTimerField = !isReactionMode(selectedGameMode);

  const handleUpdateRoom = (data: Partial<Room>) => {
    setRoom((prev) => ({...prev, ...data}));
  };

  const getModeSettings = (gameMode: GameMode) => {
    if (gameMode === "reaction") {
      return {
        gameMode,
        config: {}
      };
    }

    return {
      gameMode: "classic-speed" as const,
      config: {}
    };
  };

  //Function for create room
  const handleCreate = async () => {
    try {
      if (gameUser && room) {
        setCreating(true);
        const newGameRef = ref(db, "games/");

        const userToPush: GameUser = {
          username: gameUser.username,
          clicks: 0,
          rol: "owner"
        };

        if (gameUser.maxScores) {
          userToPush.maxScores = gameUser.maxScores;
        }

        const hashedPassword = room.password
          ? await sha256(room.password)
          : null;
        const normalizedRoom = normalizeRoomCreation(
          {
            roomName: room.name || t("Name's room", {name: gameUser.username}),
            password: room.password,
            timer: room.timer,
            maxUsers: room.maxUsers,
            gameMode: room.gameMode,
            modeSettings: getModeSettings(room.gameMode || DEFAULT_GAME_MODE)
          },
          {username: gameUser.username, key: user?.uid},
          {
            defaultTimer: DEFAULT_VALUES.DEFAULT_TIMER,
            minTimer: DEFAULT_VALUES.MIN_TIMER,
            maxTimer: DEFAULT_VALUES.MAX_TIMER,
            minUsers: DEFAULT_VALUES.MIN_USERS,
            maxUsers: config.maxUsers
          },
          {
            created: serverTimestamp(),
            storedPassword: hashedPassword
          }
        ).room;

        const objRoom: Game = {
          roomName: normalizedRoom.roomName,
          status: normalizedRoom.status,
          listUsers: [],
          ownerUser: {...gameUser, key: user?.uid},
          created: normalizedRoom.created,
          settings: normalizedRoom.settings,
          gameMode: normalizedRoom.gameMode,
          modeSettings: normalizedRoom.modeSettings,
          reactionSession: null
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
            maxUsers: objRoom.settings.maxUsers,
            gameMode: objRoom.gameMode,
            isRegistered: !user?.isAnonymous
          });

          setGame({
            ...objRoom,
            key: objRoom.key
          });

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
    } finally {
      setCreating(false);
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
      <h2 className="text-xl md:text-5xl font-extrabold self-start text-primary-600 dark:text-primary-100">
        {t("Create your own room")}
      </h2>
      <div className="flex-1 flex flex-col justify-end pr-1">
        <div className="flex justify-between items-end gap-x-9 w-full flex-1 flex-wrap">
          <Input
            label={t("Insert room name")}
            labelClassName="text-primary-500 dark:text-primary-200 text-xs md:text-lg"
            type="text"
            className="mb-2 h-9 md:h-12 text-xs md:text-lg min-w-48"
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
            labelClassName="text-primary-500 dark:text-primary-200 text-xs md:text-lg"
            type="password"
            className="mb-2 h-9 md:h-12 text-xs md:text-lg min-w-48"
            containerClassName="flex-1"
            data-label="Password"
            value={room?.password || ""}
            onChange={(ref) => handleUpdateRoom({password: ref.target.value})}
            placeholder={t("Password")}
          />
        </div>
        <div className="flex justify-between items-center gap-x-9 w-full flex-1 flex-wrap">
          <Select
            label={t("Game mode")}
            labelClassName="text-primary-500 dark:text-primary-200 text-xs md:text-lg"
            className="mb-2 h-9 md:h-12 text-xs md:text-lg min-w-48"
            containerClassName="flex-1"
            data-label="Game mode"
            value={selectedGameMode}
            onChange={(ref) =>
              handleUpdateRoom({gameMode: ref.target.value as GameMode})
            }
          >
            {SUPPORTED_WEB_GAME_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {t(getGameModeLabelKey(mode))}
              </option>
            ))}
          </Select>
          <Select
            label={t("Max number of users")}
            labelClassName="text-primary-500 dark:text-primary-200 text-xs md:text-lg"
            className="mb-2 h-9 md:h-12 text-xs md:text-lg min-w-48"
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
          {showTimerField && (
            <Select
              label={t("Timer")}
              labelClassName="text-primary-500 dark:text-primary-200 text-xs md:text-lg"
              className="mb-2 h-9 md:h-12 text-xs md:text-lg min-w-48"
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
          )}
        </div>
      </div>
      <div className="pl-1 md:pl-0 mt-2">
        <Button
          className="self-start w-full lg:w-9/12 text-lg md:text-3xl p-2 lg:p-6 leading-none overflow-visible"
          disabled={!gameUser?.username || creating}
          onClick={handleCreate}
          loading={creating}
          loadingText="Creating..."
        >
          {t("Create game")}
        </Button>
      </div>
    </>
  );
};
