import React, {useState} from "react";
import useIsMobile from "hooks/useIsMobile";
import {AuthProviders, useAuth} from "contexts/AuthContext";
import {Modal} from "react-bootstrap";
import GoogleButton from "./GoogleButton";
import GithubButton from "./GithubButton";
import TwitterButton from "./TwitterButton";

function ModalLogin() {
  const isMobile = useIsMobile();
  const [guestUsername, setGuestUsername] = useState("");
  const {signInWithProvider, signInAnonymously, user} = useAuth();

  const handleLogin = (provider: AuthProviders = "google") => {
    signInWithProvider(provider);
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
            <div
              className={`col-lg-6 text-center align-self-center gap-4 d-flex flex-column`}
            >
              <h5>Login with</h5>
              <div className="d-flex gap-3 justify-content-center">
                <GoogleButton onClick={() => handleLogin("google")} />
                <GithubButton onClick={() => handleLogin("github")} />
                <TwitterButton onClick={() => handleLogin("twitter")} />
              </div>
              <sub className="mb-2">Save score, username and more!</sub>
            </div>
            <div
              className={`col-lg-6 text-center align-self-center ${
                isMobile ? "border-top mt-4 pt-4" : "border-start"
              }`}
            >
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
                  className="btn-click small py-2 px-3 mb-3"
                  onClick={handleLoginGuest}
                  type="submit"
                >
                  Login
                </button>
              </form>
            </div>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}

export default ModalLogin;
