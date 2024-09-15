import React, {useEffect, useState} from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {useTranslation} from "react-i18next";
import {changeLanguage} from "i18next";
import {
  Dropdown,
  DropdownButton,
  OverlayTrigger,
  Tooltip
} from "react-bootstrap";

import {timeout} from "utils/timeout";
import {updateUser} from "services/user";
import {useAuth} from "contexts/AuthContext";
import {loadingAlert, loginWithGoogleAlert} from "utils/alerts";
import {languages} from "app/i18n/settings";

import RatingStars from "./RatingStars";
import {ModalLogin} from "./ModalLogin";

interface contactProps {
  title?: string;
  text?: string;
}

const ReactSwal = withReactContent(
  Swal.mixin({
    heightAuto: false,
    buttonsStyling: false,
    customClass: {
      confirmButton: "btn-click small"
    }
  })
);

export const Footer = () => {
  const [rating, setRating] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [send, setSend] = useState(false);
  const {user, gameUser, signOut, updateGameUser} = useAuth();
  const {t, i18n} = useTranslation();

  //Function for logout user.
  const handleLogOut = () => {
    if (user) {
      signOut();
    }
    updateGameUser({});
    localStorage.removeItem("user");
    sessionStorage.removeItem("userKey");
  };

  const handleContact = async ({
    title = t("Contact us"),
    text = t("You can send a criticism, a complaint or whatever you want...")
  }: contactProps = {}) => {
    if (user?.isAnonymous) {
      loginWithGoogleAlert();
      return;
    }
    ReactSwal.fire({
      title: title,
      html: `<textarea type="text" id="message" class="form-name w-100" placeholder="${text}">`,
      confirmButtonText: t("Send message"),
      showCloseButton: true,
      preConfirm: async () => {
        const value = (document.getElementById("message") as HTMLInputElement)
          ?.value;
        if (value.length > 0) {
          return value;
        } else {
          ReactSwal.showValidationMessage(t("Please enter a valid message"));
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
      loadingAlert(t("Sending email..."));
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
              ? t("Thanks for your time!")
              : t("Oops, we have a problem sending your feedback"),
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
        text: t("We can't send the email, please try again"),
        heightAuto: false
      });
    }
  };

  const sendRating = async () => {
    loadingAlert(t("Sending feedback..."));
    const key = sessionStorage.getItem("userKey");
    if (key) {
      await updateUser(key, {rating: rating});
    }

    if (rating > 0 && rating < 3) {
      handleContact({
        title: t("We're sad about your rating 🥺"),
        text: t("Please tell us what can do to improve your experience 🤗...")
      });
    } else {
      ReactSwal.fire({
        icon: "success",
        title: t("Thanks for your time!"),
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
      confirmButtonText: t("Send feedback"),
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

  const toggleModal = () => setShowModal((prev) => !prev);

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
            <a onClick={() => handleContact()}>{t("Contact")}</a>
            <span>|</span>
            <Link href="/ranking">{t("Ranking")}</Link>
          </div>
        ) : (
          <div className="d-flex gap-2 justify-content-center w-sm-100 flex-fill align-self-center pb-sm-2 pb-0">
            <Link href="/ranking">{t("Ranking")}</Link>
            <span>|</span>
            <a onClick={toggleModal}>{t("Save my data")}</a>
          </div>
        )}
        {gameUser?.username && (
          <div className="txt-user text-center mx-auto mx-md-0 mt-1 d-flex align-items-center gap-2">
            <DropdownButton
              title={
                <img
                  src={`/flags/${i18n.language}.svg`}
                  height={25}
                  alt={i18n.language}
                />
              }
              variant="secondary"
              size="sm"
              drop="up"
            >
              {languages.map((lang) => (
                <Dropdown.Item
                  as="button"
                  key={lang}
                  active={i18n.language === lang}
                  onClick={() => changeLanguage(lang)}
                >
                  <img src={`/flags/${lang}.svg`} alt={lang} />
                </Dropdown.Item>
              ))}
            </DropdownButton>
            <OverlayTrigger
              overlay={
                <Tooltip>{t("Logged as", {name: gameUser.username})}</Tooltip>
              }
            >
              <img src="/icons/clicky-right.svg" height={35} />
            </OverlayTrigger>
            <button className="btn-logout btn-click" onClick={handleLogOut}>
              {t("Log out")}
            </button>
          </div>
        )}
      </footer>
      {/* {gameUser?.email && (
        <div className="score-container float-right">
          Max score: {gameUser.maxScores}
        </div>
      )} */}
      <ModalLogin
        allowAnonymous={false}
        show={showModal}
        onClose={toggleModal}
      />
    </>
  );
};
