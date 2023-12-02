import React, {useState} from "react";
import "firebase/database";
import {Modal} from "react-bootstrap";
import {useAuth} from "contexts/AuthContext";

export const ModalCreateUsername = () => {
  const [name, setName] = useState("");
  const {user, gameUser, createUser} = useAuth();

  const handleChange = (name: string) => {
    if (name.length <= 25) {
      setName(name);
    }
  };

  const handleCreateUser = (
    e?: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e?.preventDefault();
    if (name.length >= 3) {
      createUser(name);
      setName("");
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
            onKeyPress={(e) => e.key === "Enter" && handleCreateUser()}
            onChange={(e) => handleChange(e.target.value)}
          />
          <button
            className="btn-click py-2 px-3 mb-3"
            onClick={handleCreateUser}
            type="submit"
          >
            Choose
          </button>
        </div>
      </Modal.Body>
    </Modal>
  );
};
