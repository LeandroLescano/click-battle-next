import React, {useState} from "react";
import {Dialog, DialogBackdrop, DialogPanel, Textarea} from "@headlessui/react";
import {Button} from "components-new/Button";
import {useTranslation} from "react-i18next";
import Swal from "sweetalert2";
import clsx from "clsx";

import {useAuth} from "contexts/AuthContext";
import {BrokenHearth} from "icons/BrokenHearth";

import {ContactModalProps} from "./types";

export const ContactModal = ({
  show,
  onClose,
  title,
  text
}: ContactModalProps) => {
  const [loading, setloading] = useState(false);
  const [message, setMessage] = useState("");
  const {t} = useTranslation();
  const {user} = useAuth();

  const sendEmail = async () => {
    if (user?.email) {
      setloading(true);
      fetch("/api/sendEmail", {
        method: "POST",
        body: JSON.stringify({
          message: message,
          author: user?.email
        })
      })
        .then(
          ({status}) => {
            const isSuccess = status === 200;
            Swal.fire({
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
            if (isSuccess) {
              onClose();
            }
          },
          (e) => {
            console.error(e);
          }
        )
        .finally(() => {
          setloading(false);
        });
    } else {
      Swal.fire({
        title: "Error",
        text: t("We can't send the email, please try again"),
        heightAuto: false
      });
    }
  };

  const handleOnClose = () => {
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
          <div className="px-4 flex flex-col gap-6 max-w-md items-center">
            {title && <BrokenHearth />}
            <h2 className="text-5xl text-center font-extrabold text-primary-700 dark:text-primary-200">
              {title ?? t("Comments")}
            </h2>
            <h3 className="text-2xl text-center font-semibold text-primary-700 dark:text-primary-200">
              {text ??
                t(
                  "Leave us your suggestions or impressions about your experience or what you want to share."
                )}
            </h3>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={clsx(
                "w-full rounded-lg border dark:border-white/60 bg-primary-50 dark:bg-primary-700 py-1.5 px-6 text-base text-slate-500 dark:text-white"
              )}
              placeholder={t("Comments")}
              rows={3}
            />
            <Button
              className="p-2 text-primary-500 text-2xl font-semibold w-full mt-2"
              disabled={message.length === 0}
              loading={loading}
              loadingText={t("Sending message...")}
              onClick={sendEmail}
            >
              {t("Send message")}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
