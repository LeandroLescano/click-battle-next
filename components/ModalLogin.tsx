import React, {useState} from "react";
import GoogleButton from "react-google-button";
import useIsMobile from "hooks/useIsMobile";
import {useAuth} from "contexts/AuthContext";
import {Modal} from "react-bootstrap";

function ModalLogin() {
  const isMobile = useIsMobile();
  const [guestUsername, setGuestUsername] = useState("");
  const {signInWithGoogle, signInAnonymously, user} = useAuth();

  const handleLogin = () => {
    signInWithGoogle();
  };

  const handleLoginGuest = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    if (guestUsername.trim().length >= 3) {
      signInAnonymously(guestUsername);
      setGuestUsername("");
    }
  };

  const handleChange = (name: string) => {
    if (name.length <= 25) {
      setGuestUsername(name);
    }
  };

  return (
    <Modal
      show={!user}
      animation
      backdrop="static"
      keyboard={false}
      centered
      size="lg"
    >
      <Modal.Body>
        <div className="content-login-modal">
          <div className="row w-100">
            <div className="col-lg-6 text-center align-self-center">
              <h5>Login as guest</h5>
              <form className="d-flex gap-2 flex-column align-items-center">
                <input
                  type="text"
                  className="form-name mb-2"
                  data-label="username"
                  data-value={guestUsername}
                  placeholder="Username"
                  onChange={(ref) => handleChange(ref.target.value)}
                />
                <button
                  className="btn-click py-2 px-3 mb-3"
                  onClick={handleLoginGuest}
                  type="submit"
                >
                  Login
                </button>
              </form>
            </div>
            <div
              className={`col-lg-6 text-center align-self-center ${
                isMobile ? "border-top mt-4 pt-4" : "border-start"
              }`}
            >
              <h5>Login with Google</h5>
              <GoogleButton id="btnGoogle" onClick={handleLogin} />
            </div>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}

export default ModalLogin;
