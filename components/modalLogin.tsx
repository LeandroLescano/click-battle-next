import React, {useEffect, useState} from "react";
import GoogleButton from "react-google-button";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential
} from "firebase/auth";

type AppProps = {
  loginGoogle: (user: UserCredential) => void;
  loginGuest: (username: string) => void;
  close: VoidFunction;
};

function ModalLogin({loginGoogle, loginGuest, close}: AppProps) {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [guestUser, setGuestUser] = useState<string>("");
  const auth = getAuth();

  useEffect(() => {
    let mounted = true;
    if (window && mounted) {
      window.addEventListener("resize", () => {
        if (window.innerWidth > 992) {
          setIsMobile(false);
        } else {
          setIsMobile(true);
        }
      });

      window.addEventListener("load", () => {
        if (window.innerWidth > 992) {
          setIsMobile(false);
        } else {
          setIsMobile(true);
        }
      });
    }
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogin = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then((result) => {
        loginGoogle(result);
      })
      .catch((error) => console.log(error.message))
      .finally(() => {
        close();
      });
  };

  const handleLoginGuest = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    if (guestUser.trim().length > 3) {
      loginGuest(guestUser);
    }
  };

  const handleChange = (name: string) => {
    if (name.length <= 25) {
      setGuestUser(name);
    }
  };

  return (
    <div
      className="modal fade"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
      id="modalLogin"
      data-tabindex="-1"
      aria-labelledby="modalLoginLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-body content-login-modal">
            <div className="row w-100">
              <div className="col-lg-6 text-center align-self-center">
                <h5>Login as guest</h5>
                <form>
                  <input
                    type="text"
                    className="form-name mb-2"
                    data-label="username"
                    data-value={guestUser}
                    placeholder="Username"
                    onChange={(ref) => handleChange(ref.target.value)}
                  />
                  <br />
                  <button
                    className="btn-click py-2 px-3 mb-3"
                    onClick={(e) => handleLoginGuest(e)}
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
                <GoogleButton id="btnGoogle" onClick={() => handleLogin()} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalLogin;
