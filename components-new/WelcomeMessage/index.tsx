import {Transition} from "@headlessui/react";
import React from "react";
import {useTranslation} from "react-i18next";

export const WelcomeMessage = () => {
  const {t} = useTranslation();

  return (
    <Transition show appear>
      <section className="space-y-3">
        <div className="flex items-start gap-2">
          <h1 className="text-3xl md:text-5xl font-bold text-primary-600 dark:text-primary-100">
            {t("Create a room and play Click Battle with friends")}
          </h1>
        </div>
        <p className="mt-2 max-w-[34rem] text-sm md:text-3xl">
          {t("Share the room link to invite friends to your match.")}
        </p>
      </section>
    </Transition>
  );
};
