import React, {useState} from "react";
import Swal from "sweetalert2";
import {Dialog, DialogBackdrop, DialogPanel} from "@headlessui/react";
import {Trans, useTranslation} from "react-i18next";

import {Button} from "components-new/Button";
import {RatingStars} from "components-new/RatingStars";
import {updateUser} from "services/user";
import {useAuth} from "contexts/AuthContext";

import {FeedbackModalProps} from "./types";

export const FeedbackModal = ({
  show,
  onClose,
  onRequestContact
}: FeedbackModalProps) => {
  const [rating, setRating] = useState(0);
  const [loadingFeedback, setloadingFeedback] = useState(false);

  const {t} = useTranslation();
  const {gameUser} = useAuth();

  const sendRating = async () => {
    setloadingFeedback(true);
    if (gameUser?.key) {
      await updateUser(gameUser.key, {rating: rating});
    }

    if (rating > 0 && rating < 3) {
      setloadingFeedback(false);
      onRequestContact({
        title: t("We are sorry to hear that your experience was not the best"),
        text: t(
          "Tell us what we can improve. Your opinion will help us to offer you a better service."
        )
      });
      handleOnClose();
    } else {
      Swal.fire({
        icon: "success",
        title: t("Thanks for your time!"),
        toast: true,
        position: "bottom",
        timerProgressBar: true,
        timer: 2500,
        showConfirmButton: false,
        showCloseButton: true
      });
      setloadingFeedback(false);
      handleOnClose();
    }
  };

  const handleOnClose = () => {
    setRating(0);
    onClose();
  };

  return (
    <Dialog
      open={show}
      className="relative z-10 focus:outline-none"
      onClose={handleOnClose}
    >
      <DialogBackdrop className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="fixed inset-0 flex w-screen items-center justify-center dark:text-white">
        <DialogPanel className="flex items-center content-center rounded-md py-16 px-36 bg-primary-50 dark:bg-primary-600">
          <div className="px-4 flex flex-col gap-6">
            <h2 className="text-5xl text-center font-extrabold text-primary-700 dark:text-primary-200">
              Feedback
            </h2>
            <h3 className="text-3xl text-center font-semibold text-primary-700 dark:text-primary-200">
              {<Trans i18nKey="rateUs" components={{1: <br />}} />}
            </h3>
            <RatingStars
              onSelect={setRating}
              initialValue={rating > 0 ? rating : undefined}
            />
            <Button
              className="p-2 text-primary-500 text-2xl font-semibold w-full mt-2"
              disabled={!rating}
              onClick={sendRating}
              loading={loadingFeedback}
              loadingText={t("Sending feedback...")}
            >
              {t("Send feedback")}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
