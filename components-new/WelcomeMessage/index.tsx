import React from "react";
import {Transition} from "@headlessui/react";
import {useTranslation} from "react-i18next";

export const WelcomeMessage = () => {
  const {t} = useTranslation();

  return (
    <Transition show appear>
      <section className="space-y-3">
        <div className="flex items-start gap-2">
          <h1 className="text-3xl md:text-5xl font-bold text-primary-600 dark:text-primary-100">
            {t("Start a room in seconds")}
          </h1>
        </div>
        <p className="mt-2 max-w-[34rem] text-sm md:text-3xl">
          {t(
            "Create a room, invite friends, and start a match in seconds."
          )}
        </p>
      </section>
    </Transition>
  );
};
