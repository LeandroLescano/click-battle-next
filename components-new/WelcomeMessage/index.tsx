import React, {useEffect, useState} from "react";
import {Transition} from "@headlessui/react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faClose} from "@fortawesome/free-solid-svg-icons";
import {useTranslation} from "react-i18next";

export const WelcomeMessage = () => {
  const [showMessage, setShowMessage] = useState(false);

  const {t} = useTranslation();

  useEffect(() => {
    if (!localStorage?.getItem("welcomeMessage")) {
      setShowMessage(true);
    }
  }, []);

  const handleCloseMessage = () => {
    localStorage?.setItem("welcomeMessage", "true");
    setShowMessage((prev) => !prev);
  };

  return (
    <Transition show={showMessage}>
      <div>
        <div className="flex gap-2">
          <h2 className="text-3xl md:text-6xl font-bold">
            {t("Welcome to Click Battle!")}
          </h2>
          <FontAwesomeIcon
            icon={faClose}
            className="cursor-pointer size-4 md:size-7"
            onClick={handleCloseMessage}
          />
        </div>
        <p className="text-sm md:text-3xl md:w-2/3 mt-4">
          {t(
            "Compete in real time against other players, test your speed and accuracy, and climb the leaderboard - click faster than anyone else and prove you're the best!"
          )}
        </p>
        <p className="text-sm md:text-3xl font-bold my-3">
          {t("Are you up for the challenge?")}
        </p>
      </div>
    </Transition>
  );
};
