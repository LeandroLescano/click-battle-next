import React, {useEffect, useRef, useState} from "react";
import {getDatabase, ref, update} from "@firebase/database";
import Swal from "sweetalert2";
import {useTranslation} from "react-i18next";
import clsx from "clsx";

import {sha256} from "services/encode";
import {range} from "utils/numbers";
import {AVAILABLE_TIMES} from "resources/constants";
import {Game} from "interfaces";
import {adjustRoomSettings} from "utils/room";
import {Button} from "components-new/Button";
import {Select} from "components-new/Select";
import {Input} from "components-new/Input";
import {Cross} from "icons/Cross";
import {useGame} from "contexts/GameContext";

import {Settings, SettingsSidebarProps} from "./types";
import "./styles.scss";

const Toast = Swal.mixin({
  toast: true,
  position: "bottom-end",
  showCloseButton: true,
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true
});

export const SettingsSidebar = ({
  options,
  idGame,
  showSideBar,
  handleSideBar
}: SettingsSidebarProps) => {
  const [settings, setSettings] = useState(options);
  const [deletePassword, setDeletePassword] = useState(false);
  const [config, setConfig] = useState({
    maxUsers: 10
  });
  const inputPassword = useRef<HTMLInputElement>(null);
  const db = getDatabase();
  const {game} = useGame();
  const {t} = useTranslation();

  useEffect(() => {
    setSettings({
      maxUsers: options.maxUsers,
      roomName: options.roomName,
      timer: options.timer
    });
    const config = sessionStorage.getItem("config");
    if (config) {
      setConfig(JSON.parse(config));
    }
  }, [options]);

  const handleUpdateSettings = () => {
    const updateSettings = settings;
    if (deletePassword) {
      updateSettings.password = null;
      updateDatabase(updateSettings);
    } else if (updateSettings.password) {
      sha256(updateSettings.password).then((hash) => {
        updateSettings.password = hash;
        updateDatabase(updateSettings);
      });
    } else {
      const {password: _, ...updateSettingsWithoutPwd} = updateSettings;
      updateDatabase(updateSettingsWithoutPwd);
    }
    if (inputPassword.current) {
      inputPassword.current.value = "";
    }
    setDeletePassword(false);
  };

  const handleDeletePassword = () => {
    const updateSettings = settings;
    updateSettings.password = null;
    updateDatabase(updateSettings);
  };

  const updateDatabase = async (localSettings: Settings) => {
    try {
      localSettings = adjustRoomSettings({
        settings: localSettings,
        maxUsers: config.maxUsers
      });

      const refGame = ref(db, `games/${idGame}`);

      await update(refGame, {
        roomName: localSettings.roomName,
        timer: game.timer && localSettings.timer,
        settings: {
          maxUsers: localSettings.maxUsers,
          timer: localSettings.timer,
          password: localSettings.password || null
        }
      } as Partial<Game>);

      Toast.fire({
        title: t("Settings updated"),
        icon: "success"
      });
    } catch (error) {
      console.error(error);
      Toast.fire({
        title: t("There was an error"),
        icon: "error"
      });
    }
  };

  return (
    <aside className={clsx("sidebar", {active: showSideBar})}>
      <div className="px-10 py-12 md:px-20 md:pt-24 min-w-96 md:min-w-[470px]">
        <div className="flex justify-between items-center mb-3 md:mb-6">
          <h2 className="font-extrabold text-primary-300 text-2xl md:text-5xl">
            {t("Settings")}
          </h2>
          <Cross className="size-8" onClick={() => handleSideBar(false)} />
        </div>
        <div className="flex flex-col justify-between gap-2 md:gap-4">
          <Input
            label={t("Room name")}
            labelClassName="text-primary-500 dark:text-primary-200 text-xs md:text-lg"
            type="text"
            className="h-9 md:h-12 text-xs md:text-lg mb-2"
            containerClassName="flex-1"
            data-label="Room name"
            value={settings.roomName ?? ""}
            onChange={(ref) =>
              setSettings({...settings, roomName: ref.target.value})
            }
          />
          <div>
            <Input
              label={
                options.password ? t("Change password") : t("Set password")
              }
              labelClassName="text-primary-500 dark:text-primary-200 text-xs md:text-lg"
              type="password"
              className="h-9 md:h-12 text-xs md:text-lg mb-2"
              containerClassName="flex-1"
              data-label="Password"
              onChange={(ref) =>
                setSettings({...settings, password: ref.target.value})
              }
              placeholder={t("Password")}
            />
            {options.password && (
              <label
                className="underline cursor-pointer"
                onClick={handleDeletePassword}
              >
                {t("Delete password")}
              </label>
            )}
          </div>
          <Select
            label={t("Max number of users")}
            labelClassName="text-primary-500 dark:text-primary-200 text-xs md:text-lg"
            className="mb-2 h-9 md:h-12 text-xs md:text-lg"
            containerClassName="flex-1"
            data-label="Max number of users"
            value={settings.maxUsers}
            onChange={(ref) =>
              setSettings({...settings, maxUsers: Number(ref.target.value)})
            }
          >
            {[...Array.from(range(2, config.maxUsers + 1))].map((val, i) => (
              <option key={i} value={val}>
                {val}
              </option>
            ))}
          </Select>
          <Select
            label={t("Timer")}
            labelClassName="text-primary-500 dark:text-primary-200 text-xs md:text-lg"
            className="mb-2 h-9 md:h-12 text-xs md:text-lg"
            containerClassName="flex-1"
            data-label="Timer"
            value={settings.timer}
            onChange={(ref) =>
              setSettings({...settings, timer: Number(ref.target.value)})
            }
          >
            {AVAILABLE_TIMES.map((val, i) => (
              <option key={i} value={val}>
                {val}
              </option>
            ))}
          </Select>
          <Button
            className="w-full py-2 px-3 md:py-4 md:px-5 text-base md:text-3xl mt-4"
            onClick={handleUpdateSettings}
          >
            {t("Save settings")}
          </Button>
        </div>
      </div>
    </aside>
  );
};
