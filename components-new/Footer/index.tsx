import React, {useCallback, useEffect, useState} from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {useTranslation} from "react-i18next";

import {timeout} from "utils/timeout";
import {updateUser} from "services/user";
import {useAuth} from "contexts/AuthContext";
import {loadingAlert, loginWithGoogleAlert} from "utils/alerts";
import {LoginModal, RatingStars} from "components-new";

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
  const {user} = useAuth();
  const {t} = useTranslation();

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

  const toggleModal = useCallback(() => setShowModal((prev) => !prev), []);

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
      <footer className="mt-auto flex flex-col-reverse md:flex-row text-2xl font-semibold text-primary-700 dark:text-primary-100 justify-center md:justify-between w-full items-baseline pb-2">
        <div className="mx-auto md:mx-0 ">
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
          <div className="flex gap-2 mx-auto md:mx-0 my-2 uppercase">
            <a onClick={handleFeedback}>Feedback</a>
            <span> | </span>
            <a onClick={() => handleContact()}>{t("Contact")}</a>
            <span> | </span>
            <Link href="/new/ranking">{t("Ranking")}</Link>
          </div>
        ) : (
          <div className="flex justify-end self-center gap-2 w-full pb-sm-2 pb-0 uppercase">
            <Link href="/new/ranking">{t("Ranking")}</Link>
            <span> | </span>
            <span onClick={toggleModal} className="cursor-pointer">
              {t("Save my data")}
            </span>
          </div>
        )}
      </footer>
      <LoginModal
        allowAnonymous={false}
        show={showModal}
        onClose={toggleModal}
      />
    </>
  );
};
