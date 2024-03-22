import React, {useState} from "react";
import "firebase/database";
import {Modal} from "react-bootstrap";
import {useAuth} from "contexts/AuthContext";
import Swal from "sweetalert2";
import {isUsernameAvailable} from "services/user";

export const ModalCreateUsername = () => {
  const [name, setName] = useState("");
  const {user, gameUser, createUsername, signOut} = useAuth();

  const handleChange = (name: string) => {
    if (name.length <= 25) {
      setName(name);
    }
  };

  const handleCreateUsername = async (
    e?: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e?.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName.length >= 3) {
      //TODO: Add loading
      if (await isUsernameAvailable(trimmedName)) {
        createUsername(trimmedName, user?.isAnonymous || true);
        setName("");
      } else {
        Swal.fire({
          title: "Username not available",
          icon: "error",
          toast: true,
          position: "bottom-right",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false
        });
      }
    }
  };

  return (
    <Modal
      show={!!(user && !gameUser?.username)}
      animation
      centered
      backdrop="static"
      keyboard={false}
    >
      <Modal.Body>
        <div className="d-flex flex-column align-items-center gap-3">
          <h4>Enter your username</h4>
          <input
            type="text"
            className="form-name mb-2"
            data-label="username"
            value={name}
            placeholder="Username"
            onKeyPress={(e) => e.key === "Enter" && handleCreateUsername()}
            onChange={(e) => handleChange(e.target.value)}
          />
          <div className="d-flex gap-4 align-items-center">
            <button className="btn-click py-2 px-3 mb-3" onClick={signOut}>
              Cancel
            </button>
            <button
              className="btn-click py-2 px-3 mb-3"
              onClick={handleCreateUsername}
              type="submit"
            >
              Choose
            </button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};
