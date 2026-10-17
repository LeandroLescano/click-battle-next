import {
  GameMode,
  GameUser,
  normalizeRoomCreation
} from "@leandrolescano/click-battle-core";
import {getAnalytics, logEvent} from "firebase/analytics";
import {
  get,
  getDatabase,
  push,
  ref,
  serverTimestamp,
  set
} from "firebase/database";
import {useRouter} from "next/navigation";
import React, {useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import Swal from "sweetalert2";

import {Button} from "components-new/Button";
import {GameModeSelection} from "components-new/GameModeSelection";
import {Input} from "components-new/Input";
import {Select} from "components-new/Select";
import {useAuth} from "contexts/AuthContext";
import {useGame} from "contexts/GameContext";
import {Game, Room} from "interfaces";
import {DEFAULT_GAME_MODE, isReactionMode} from "lib/game/gameModes";
import {buildInitialHostLease, createHostSessionId} from "lib/game/hostLease";
import logoAnim from "lotties/logo-animated.json";
import {AVAILABLE_TIMES, DEFAULT_VALUES} from "resources/constants";
import {sha256} from "services/encode";
import {range} from "utils/numbers";

const getStoredHostSessionKey = (roomId: string) =>
  `host-room-session:${roomId}`;

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
        const newRoomRef = push(newGameRef);
        const roomId = newRoomRef.key;

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
          reactionCurrentRoundId: null,
          reactionRounds: {}
        };

        if (roomId && user?.uid) {
          const sessionId = createHostSessionId(user.uid);
          objRoom.key = roomId;

          await set(ref(db, `games/${roomId}`), {
            ...objRoom,
            listUsers: {
              [user.uid]: userToPush
            },
            hostLease: buildInitialHostLease(user.uid, sessionId)
          });

          sessionStorage.setItem(getStoredHostSessionKey(roomId), sessionId);

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
            key: roomId
          });

          sessionStorage.setItem("gameUserKey", "0");

          router.push("/game/" + roomId);
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
    let disposed = false;
    let animation: {destroy: () => void} | undefined;

    if (gameUser?.username) {
      get(ref(db, "config")).then((snapshot) => {
        const defaultConfig = snapshot.val();
        if (defaultConfig && !disposed) {
          setConfig(defaultConfig);
          sessionStorage.setItem("config", JSON.stringify(defaultConfig));
        }
      });

      void import("lottie-web").then(({default: lottie}) => {
        if (
          disposed ||
          !logoContainer.current ||
          logoContainer.current.innerHTML !== ""
        ) {
          return;
        }

        animation = lottie.loadAnimation({
          container: logoContainer.current,
          animationData: logoAnim,
          renderer: "svg",
          loop: true,
          autoplay: true
        });

        if (disposed) {
          animation.destroy();
        }
      });
    }

    return () => {
      disposed = true;
      animation?.destroy();
    };
  }, [gameUser?.username]);

  return (
    <>
      <h2 className="text-2xl md:text-5xl font-extrabold self-start text-primary-600 dark:text-primary-100">
        {t("Create your own room")}
      </h2>
      <div className="flex w-full flex-col gap-4 md:gap-5">
        <GameModeSelection
          onSelect={(gameMode) => handleUpdateRoom({gameMode})}
          selectedGameMode={selectedGameMode}
        />
        <div className="flex flex-col justify-start pr-1 md:flex-1 md:justify-end">
          <div className="flex justify-between items-end gap-x-9 w-full flex-1 flex-wrap">
            <Input
              label={t("Insert room name")}
              labelClassName="text-primary-500 dark:text-primary-200 text-sm md:text-lg"
              type="text"
              className="mb-2 h-11 md:h-12 text-sm md:text-lg min-w-48"
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
              labelClassName="text-primary-500 dark:text-primary-200 text-sm md:text-lg"
              type="password"
              className="mb-2 h-11 md:h-12 text-sm md:text-lg min-w-48"
              containerClassName="flex-1"
              data-label="Password"
              value={room?.password || ""}
              onChange={(ref) => handleUpdateRoom({password: ref.target.value})}
              placeholder={t("Password")}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 w-full">
            <Select
              label={t("Max number of users")}
              labelClassName="text-primary-500 dark:text-primary-200 text-sm md:text-lg"
              className="mb-2 h-11 md:h-12 text-sm md:text-lg min-w-0"
              containerClassName="min-w-0"
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
            {showTimerField ? (
              <Select
                label={t("Timer")}
                labelClassName="text-primary-500 dark:text-primary-200 text-sm md:text-lg"
                className="mb-2 h-11 md:h-12 text-sm md:text-lg min-w-0"
                containerClassName="min-w-0"
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
            ) : (
              <div className="min-w-0">
                <p className="text-sm font-medium leading-6 text-primary-500 dark:text-primary-200 md:text-lg">
                  {t("Timer")}
                </p>
                <div
                  className="mt-1.5 flex h-11 items-center rounded-lg border border-primary-300 bg-primary-100 px-3 text-sm font-semibold text-primary-500 dark:border-white/60 dark:bg-primary-700 dark:text-primary-200 md:mt-3 md:h-12 md:px-6 md:text-lg"
                  data-testid="reaction-no-timer"
                >
                  <span className="md:hidden">{t("No timer")}</span>
                  <span className="hidden md:inline">
                    {t("Reaction Battle has no timer")}
                  </span>
                </div>
              </div>
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
      </div>
    </>
  );
};
