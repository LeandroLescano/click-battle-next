import React from "react";
import {Dialog, DialogBackdrop, DialogPanel} from "@headlessui/react";
import {useTranslation} from "react-i18next";

import {Button} from "components-new";
import {Prohibited} from "icons/Prohibited";
import {Warning} from "icons/Warning";

import {NotificationModalProps} from "./types";

export const NotificationModal = ({
  show,
  onClose,
  type
}: NotificationModalProps) => {
  const {t} = useTranslation();

  const TYPE_CONTENTS = {
    kickedOut: {
      title: t("Disconnected"),
      text: t(
        "You have been removed by the host. You can try to join again or create a new room."
      ),
      icon: Prohibited
    },
    hacks: {
      title: t("Misuse detected"),
      text: t(
        "Please refrain from using unauthorized tools or hacks while playing."
      ),
      icon: Warning
    },
    fullRoom: {
      title: t("Room is full"),
      text: t(
        "The room is full. You can try to join another room or create a new one."
      ),
      icon: Prohibited
    }
  };

  const Icon = TYPE_CONTENTS[type].icon;

  return (
    <Dialog
      open={show}
      className="relative z-10 focus:outline-none"
      onClose={onClose}
    >
      <DialogBackdrop className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="fixed inset-0 flex w-screen items-center justify-center dark:text-white">
        <DialogPanel className="flex items-center content-center rounded-md max-w-2xl py-7 px-36 bg-primary-50 dark:bg-primary-600">
          <div className="flex flex-col items-center gap-8">
            <div className="flex flex-col items-center gap-4">
              <Icon />
              <h2 className="text-5xl text-center font-extrabold text-primary-700 dark:text-primary-200">
                {TYPE_CONTENTS[type].title}
              </h2>
            </div>
            {TYPE_CONTENTS[type].text && (
              <h3 className="text-3xl text-center font-semibold text-primary-700 dark:text-primary-200">
                {TYPE_CONTENTS[type].text}
              </h3>
            )}

            <Button
              className="py-3 px-3 mb-3 flex justify-center items-center w-full text-2xl"
              onClick={onClose}
            >
              {t("Accept")}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
