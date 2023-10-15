import React, {useState} from "react";
import "firebase/database";
import {getDatabase, ref, update} from "@firebase/database";

type AppProps = {
  onClose: VoidFunction;
};

export const ModalCreateUsername = ({onClose}: AppProps) => {
  const [name, setName] = useState("");
  const db = getDatabase();

  const handleChange = (name: string) => {
    if (name.length <= 25) {
      setName(name);
    }
  };

  const handleCreateUser = () => {
    if (name.length >= 3) {
      const key = sessionStorage.getItem("userKey");
      const refUser = ref(db, `users/${key}`);
      update(refUser, {username: name});
      sessionStorage.setItem("user", name);
      onClose();
    }
  };

  return (
    <div
      className="modal fade"
      id="modalCreateUsername"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
      data-tabindex="-1"
      aria-labelledby="modalCreateUsernameLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-md modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-body text-center">
            <h4>Enter your username</h4>
            <input
              type="text"
              className="form-name mb-2 me-5"
              data-label="username"
              value={name}
              placeholder="Username"
              onChange={(ref) => handleChange(ref.target.value)}
            />
            <button
              className="btn-click py-2 px-3 mb-3"
              onClick={() => handleCreateUser()}
            >
              Choose
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
