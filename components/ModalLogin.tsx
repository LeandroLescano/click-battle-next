import React from "react";
import useIsMobile from "hooks/useIsMobile";
import {AuthProviders, useAuth} from "contexts/AuthContext";
import {Modal} from "react-bootstrap";
import GoogleButton from "./GoogleButton";
import GithubButton from "./GithubButton";
import TwitterButton from "./TwitterButton";

function ModalLogin() {
  const isMobile = useIsMobile();
  const {signInWithProvider, signInAnonymously, user} = useAuth();

  const handleLogin = (provider: AuthProviders = "google") => {
    signInWithProvider(provider);
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
              <button
                className="btn-click small py-2 px-3 mb-3"
                onClick={signInAnonymously}
                type="submit"
              >
                Login as guest
              </button>
            </div>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}

export default ModalLogin;
