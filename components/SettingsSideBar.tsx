import React, {useEffect, useRef, useState} from "react";
import {getDatabase, ref, update} from "@firebase/database";
import Swal from "sweetalert2";
import {faCog, faTimes} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {IconProp} from "@fortawesome/fontawesome-svg-core";
import {useTranslation} from "react-i18next";

import {sha256} from "services/encode";
import {range} from "utils/numbers";
import {AVAILABLE_TIMES} from "resources/constants";
import {Game} from "interfaces";
import {adjustRoomSettings} from "utils/room";

const Toast = Swal.mixin({
  toast: true,
  position: "bottom-end",
  showCloseButton: true,
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true
});

export interface Settings {
  maxUsers: number;
  roomName: string | undefined;
  password?: string | null;
  timer: number;
}

type SettingsSideBarProps = {
  options: Settings;
  idGame: string | undefined;
  showSideBar: boolean;
  handleSideBar: (value: boolean) => void;
};

export const SettingsSideBar = ({
  options,
  idGame,
  showSideBar,
  handleSideBar
}: SettingsSideBarProps) => {
  const [settings, setSettings] = useState(options);
  const [deletePassword, setDeletePassword] = useState(false);
  const [config, setConfig] = useState({
    maxUsers: 10
  });
  const inputPassword = useRef<HTMLInputElement>(null);
  const db = getDatabase();
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

  const updateDatabase = async (settings: Settings) => {
    try {
      settings = adjustRoomSettings({settings, maxUsers: config.maxUsers});

      const refGame = ref(db, `games/${idGame}`);

      await update(refGame, {
        roomName: settings.roomName,
        timer: settings.timer,
        settings: {
          maxUsers: settings.maxUsers,
          timer: settings.timer,
          password: settings.password || null
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
    <>
      <div className="settings-icon" onClick={() => handleSideBar(true)}>
        <FontAwesomeIcon icon={faCog as IconProp} />
      </div>
      <aside className={`sidebar ${showSideBar && "active"}`}>
        <div className="d-flex justify-content-between align-items-center">
          <h2 className="m-0">{t("Settings")}</h2>
          <FontAwesomeIcon
            icon={faTimes as IconProp}
            className="close-icon"
            onClick={() => handleSideBar(false)}
          />
        </div>
        <hr />
        <div className="d-flex flex-column justify-content-between">
          <section>
            <span>{t("Room name")}</span>
            <input
              type="text"
              className="form-name mb-2"
              data-label="Room name"
              value={settings.roomName ?? ""}
              onChange={(ref) =>
                setSettings({...settings, roomName: ref.target.value})
              }
            />
          </section>
          <section>
            <span>
              {options.password ? t("Change password") : t("Set password")}
            </span>
            <div className="position-relative">
              <input
                ref={inputPassword}
                type="password"
                className="form-name mb-2 w-100"
                data-label="Password"
                disabled={deletePassword}
                onChange={(ref) =>
                  setSettings({...settings, password: ref.target.value})
                }
                placeholder={t("Password")}
              />
              {options.password && (
                <>
                  <div className="container-input text-end">
                    <input
                      type="checkbox"
                      className="me-2"
                      defaultChecked={deletePassword}
                      onChange={() => setDeletePassword((prev) => !prev)}
                    />
                    <span className="checkmark"></span>
                    <label>{t("Delete password")}</label>
                  </div>
                </>
              )}
            </div>
          </section>
          <section className="settings-users">
            <span>{t("Max number of users")}</span>
            <select
              className="form-name ms-4"
              data-label="Room name"
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
            </select>
          </section>
          <section className="settings-users">
            <span>{t("Timer")}</span>
            <select
              className="form-name ms-4"
              data-label="Room name"
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
            </select>
          </section>
        </div>
        <button
          className="btn-click small btn-settings"
          onClick={handleUpdateSettings}
        >
          {t("Save settings")}
        </button>
      </aside>
    </>
  );
};
