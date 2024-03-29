import React, {useEffect, useState} from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {useRouter} from "next/navigation";

import {timeout} from "utils/timeout";
import {updateUser} from "services/user";
import {useAuth} from "contexts/AuthContext";
import {loadingAlert, loginWithGoogleAlert} from "utils/alerts";

import RatingStars from "./RatingStars";

interface contactProps {
  title?: string;
  text?: string;
}

export const Footer = () => {
  const ReactSwal = withReactContent(
    Swal.mixin({
      heightAuto: false,
      buttonsStyling: false,
      customClass: {
        confirmButton: "btn-click small"
      }
    })
  );
  const [rating, setRating] = useState(0);
  const [send, setSend] = useState(false);
  const {user, gameUser, signOut} = useAuth();
  const router = useRouter();

  //Function for logout user.
  const handleLogOut = () => {
    if (user) {
      signOut();
    }
    localStorage.removeItem("user");
    sessionStorage.removeItem("userKey");
  };

  const handleContact = async ({
    title = "Contact us",
    text = "You can send a criticism, a complaint or whatever you want..."
  }: contactProps = {}) => {
    if (user?.isAnonymous) {
      loginWithGoogleAlert();
      return;
    }
    ReactSwal.fire({
      title: title,
      html: `<textarea type="text" id="message" class="form-name w-100" placeholder="${text}">`,
      confirmButtonText: "Send message",
      showCloseButton: true,
      preConfirm: async () => {
        const value = (document.getElementById("message") as HTMLInputElement)
          ?.value;
        if (value.length > 0) {
          return value;
        } else {
          ReactSwal.showValidationMessage("Please enter a valid message");
          await timeout(2500);
          ReactSwal.resetValidationMessage();
          return false;
        }
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        sendEmail(result.value as string);
      }
    });
  };

  const sendEmail = async (message: string) => {
    if (user?.email) {
      loadingAlert("Sending email...");
      fetch("/api/sendEmail", {
        method: "POST",
        body: JSON.stringify({
          message: message,
          author: user?.email
        })
      }).then(
        ({status}) => {
          const isSuccess = status === 200;
          ReactSwal.fire({
            icon: isSuccess ? "success" : "error",
            title: isSuccess
              ? "Thanks for your time!"
              : "Oops, we have a problem sending your feedback",
            toast: true,
            position: "bottom",
            timerProgressBar: true,
            timer: 2500,
            showConfirmButton: false,
            showCloseButton: true
          });
        },
        (e) => {
          console.error(e);
        }
      );
    } else {
      Swal.fire({
        title: "Error",
        text: "We can't send the email, please try again",
        heightAuto: false
      });
    }
  };

  const sendRating = async () => {
    loadingAlert("Sending feedback...");
    const key = sessionStorage.getItem("userKey");
    if (key) {
      await updateUser(key, {rating: rating});
    }

    if (rating > 0 && rating < 3) {
      handleContact({
        title: "We're sad about your rating 🥺",
        text: "Please tell us what can do to improve your experience 🤗..."
      });
    } else {
      ReactSwal.fire({
        icon: "success",
        title: "Thanks for your time!",
        toast: true,
        position: "bottom",
        timerProgressBar: true,
        timer: 2500,
        showConfirmButton: false,
        showCloseButton: true
      });
    }
    setSend(false);
    setRating(0);
  };

  const handleFeedback = () => {
    if (user?.isAnonymous) {
      loginWithGoogleAlert();
      return;
    }
    ReactSwal.fire({
      title: "Feedback",
      html: (
        <RatingStars
          onSelect={setRating}
          initialValue={rating > 0 ? rating : undefined}
        />
      ),
      confirmButtonText: "Send feedback",
      didOpen: () => {
        ReactSwal.disableButtons();
      }
    }).then((result) => {
      if (result.isConfirmed) {
        ReactSwal.showLoading();
        setSend(true);
        return false;
      }
    });
  };

  useEffect(() => {
    if (rating > 0 && ReactSwal.isVisible()) {
      ReactSwal.resetValidationMessage();
      ReactSwal.enableButtons();
    }
  }, [rating]);

  useEffect(() => {
    let mounted = true;
    if (send && mounted) {
      sendRating();
    }
    return () => {
      mounted = false;
    };
  }, [send]);

  return (
    <>
      <footer className="mt-auto d-flex flex-column-reverse flex-md-row justify-content-centers justify-content-md-between w-100 align-items-baseline pb-2">
        <div className="footer mx-auto mx-md-0">
          <a
            href="https://cafecito.app/leanlescano"
            rel="noreferrer"
            target="_blank"
          >
            <img
              srcSet="https://cdn.cafecito.app/imgs/buttons/button_2.png 1x, https://cdn.cafecito.app/imgs/buttons/button_2_2x.png 2x, https://cdn.cafecito.app/imgs/buttons/button_2_3.75x.png 3.75x"
              src="https://cdn.cafecito.app/imgs/buttons/button_2.png"
              alt="Invitame un café en cafecito.app"
            />
          </a>
        </div>
        {user && !user.isAnonymous ? (
          <div className="d-flex gap-2 mx-auto mx-md-0 my-2">
            <a onClick={handleFeedback}>Feedback</a>
            <span>|</span>
            <a onClick={() => handleContact()}>Contact</a>
            <span>|</span>
            <a onClick={() => router.push("/ranking")}>Ranking</a>
          </div>
        ) : (
          <div className="d-flex justify-content-center w-sm-100 flex-fill align-self-center pb-sm-2 pb-0">
            <a onClick={() => router.push("/ranking")}>Ranking</a>
          </div>
        )}
        {gameUser?.username && (
          <div className="txt-user text-center mx-auto mx-md-0 mt-1">
            {`logged as ${gameUser.username} - `}
            <button className="btn-logout btn-click" onClick={handleLogOut}>
              Log out
            </button>
          </div>
        )}
      </footer>
      {/* {gameUser?.email && (
        <div className="score-container float-right">
          Max score: {gameUser.maxScores}
        </div>
      )} */}
    </>
  );
};
