"use client";

import React, {useEffect} from "react";
import {Modal} from "react-bootstrap";

import useIsMobile from "hooks/useIsMobile";
import {AuthProviders, useAuth} from "contexts/AuthContext";

import GoogleButton from "./components/GoogleButton";
import GithubButton from "./components/GithubButton";
import TwitterButton from "./components/TwitterButton";
import {ModalLoginProps} from "./types";

export const ModalLogin = ({
  allowAnonymous = true,
  show = true,
  onClose
}: ModalLoginProps) => {
  const isMobile = useIsMobile();
  const {signInWithProvider, signInAnonymously, user} = useAuth();

  const handleLogin = (provider: AuthProviders = "google") => {
    signInWithProvider(provider);
  };

  useEffect(() => {
    if (user && !user.isAnonymous && !allowAnonymous && show) {
      onClose?.();
    }
  }, [user, show]);

  return (
    <Modal
      show={allowAnonymous ? !user : show}
      animation
      backdrop="static"
      keyboard={false}
      centered
      size={allowAnonymous ? "lg" : undefined}
    >
      <Modal.Body>
        <div className="content-login-modal">
          <div className={`row ${allowAnonymous ? "w-100" : ""}`}>
            <div
              className={`${
                allowAnonymous ? "col-lg-6" : ""
              } text-center align-self-center gap-4 d-flex flex-column`}
            >
              <h5>Login with</h5>
              <div className="d-flex gap-3 justify-content-center">
                <GoogleButton onClick={() => handleLogin("google")} />
                <GithubButton onClick={() => handleLogin("github")} />
                <TwitterButton onClick={() => handleLogin("twitter")} />
              </div>
              <sub className="mb-2">Save score, username and more!</sub>
            </div>
            {allowAnonymous ? (
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
            ) : (
              <button className="btn-click small mt-4" onClick={onClose}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};
