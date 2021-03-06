import React, { useEffect, useRef, useState } from "react";
import { faCog, faTimes } from "@fortawesome/free-solid-svg-icons";
import { getDatabase, ref, update } from "@firebase/database";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";
import { sha256 } from "../services/encode";

type AppProps = {
  options: {
    maxUsers: number;
    roomName: string | undefined;
    password?: string | null;
  };
  idGame: String | undefined;
  showSideBar: boolean;
  handleSideBar: Function;
};

function SettingsSideBar({
  options,
  idGame,
  showSideBar,
  handleSideBar,
}: AppProps) {
  const [settings, setSettings] = useState(options);
  const [deletePassword, setDeletePassword] = useState(false);
  const inputPassword = useRef<HTMLInputElement>(null);
  const db = getDatabase();

  useEffect(() => {
    setSettings({ maxUsers: options.maxUsers, roomName: options.roomName });
  }, [options]);

  const handleUpdateSettings = () => {
    let updateSettings = settings;
    if (deletePassword) {
      updateSettings.password = null;
      updateDatabase(updateSettings);
    } else if (updateSettings.password) {
      sha256(updateSettings.password).then((hash) => {
        updateSettings.password = hash;
        updateDatabase(updateSettings);
      });
    } else {
      delete updateSettings.password;
      updateDatabase(updateSettings);
    }
    if (inputPassword.current) {
      inputPassword.current.value = "";
    }
    setDeletePassword(false);
  };

  const updateDatabase = (settings: object) => {
    let refGame = ref(db, `games/${idGame}`);
    update(refGame, { ...settings })
      .then(() => {
        Swal.fire({
          title: "Settings updated",
          toast: true,
          position: "bottom-end",
          showCloseButton: true,
          showConfirmButton: false,
          timer: 2500,
          icon: "success",
          timerProgressBar: true,
        });
      })
      .catch(() => {
        Swal.fire({
          title: "There was an error",
          toast: true,
          position: "bottom-end",
          showCloseButton: true,
          showConfirmButton: false,
          timer: 2500,
          icon: "error",
          timerProgressBar: true,
        });
      });
  };

  return (
    <>
      <div className="settings-icon" onClick={() => handleSideBar(true)}>
        <FontAwesomeIcon icon={faCog} />
      </div>
      <aside className={`sidebar ${showSideBar && "active"}`}>
        <div className="d-flex justify-content-between align-items-center">
          <h2 className="m-0">Settings</h2>
          <FontAwesomeIcon
            icon={faTimes}
            className="close-icon"
            onClick={() => handleSideBar(false)}
          />
        </div>
        <hr />
        <div className="d-flex flex-column justify-content-between">
          <section>
            <span>room name</span>
            <input
              type="text"
              className="form-name mb-2"
              data-label="Room name"
              value={settings.roomName ?? ""}
              onChange={(ref) =>
                setSettings({ ...settings, roomName: ref.target.value })
              }
            />
          </section>
          <section>
            <span>{options.password ? "change" : "set"} password</span>
            <div className="position-relative">
              <input
                ref={inputPassword}
                type="password"
                className="form-name mb-2 w-100"
                data-label="Password"
                disabled={deletePassword}
                onChange={(ref) =>
                  setSettings({ ...settings, password: ref.target.value })
                }
                placeholder={`Password`}
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
                    <label>Delete password</label>
                  </div>
                </>
              )}
            </div>
          </section>
          <section className="settings-users">
            <span>Max number of users</span>
            <select
              className="form-name ms-4"
              data-label="Room name"
              value={settings.maxUsers}
              onChange={(ref) =>
                setSettings({ ...settings, maxUsers: Number(ref.target.value) })
              }
            >
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>
              <option value="10">10</option>
            </select>
          </section>
        </div>
        <button
          className="btn-click btn-settings"
          onClick={() => handleUpdateSettings()}
        >
          Save settings
        </button>
      </aside>
    </>
  );
}

export default SettingsSideBar;
