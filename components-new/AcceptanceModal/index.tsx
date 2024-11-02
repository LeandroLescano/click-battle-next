import React, {useEffect, useState} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {useTranslation} from "react-i18next";

import {Thumb} from "icons/Thumb";
import {timeout} from "utils/timeout";
import {Card} from "components-new/Card";
import {useAuth} from "contexts/AuthContext";
import {addDesignPreferences} from "services/experience";

export const AcceptanceModal = () => {
  const [show, setShow] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const {user} = useAuth();
  const {t} = useTranslation();

  const handleFeedback = async (value: boolean) => {
    localStorage.setItem("feedbackGiven", value ? "true" : "false");
    setFeedbackGiven(true);
    if (user) {
      addDesignPreferences(value, user);
    }

    await timeout(1500);
    setShow(false);
  };

  useEffect(() => {
    const feedbackGivenStorage = localStorage.getItem("feedbackGiven");
    setFeedbackGiven(feedbackGivenStorage === "true");
    if (!feedbackGivenStorage) {
      setShow(true);
    }
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{opacity: 0, y: 50}}
          animate={{opacity: 1, y: 0}}
          exit={{opacity: 0, y: 50}}
          transition={{duration: 0.3}}
          className="fixed flex w-full h-full bottom-0 left-0 justify-center lg:justify-start items-end px-3 py-2 z-40"
        >
          <Card className="w-80 text-primary-400 text-2xl font-bold p-2 text-center">
            <h4>{t("Enjoying the new experience?")}</h4>
            {!feedbackGiven ? (
              <div className="flex justify-center space-x-4 py-2">
                <button
                  className="w-10 h-10 rounded-lg transition hover:bg-green-200/50 p-1"
                  onClick={() => handleFeedback(true)}
                >
                  <Thumb className="text-green-500" />
                </button>
                <button
                  className="w-10 h-10 rounded-lg transition hover:bg-red-300/50 p-1"
                  onClick={() => handleFeedback(false)}
                >
                  <Thumb className="text-red-500 rotate-180" />
                </button>
              </div>
            ) : (
              <p className="text-center text-xl py-2 h-14">
                {t("Thank you for your feedback!")}
              </p>
            )}
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
