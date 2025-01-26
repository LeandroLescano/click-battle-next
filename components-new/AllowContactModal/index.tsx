import React, {useEffect, useState} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {useTranslation} from "react-i18next";
import {Timestamp} from "firebase/firestore";

import {useAuth} from "contexts/AuthContext";
import {updateUser} from "services/user";
import {Button, Card} from "components-new";

export const AllowContactModal = () => {
  const [show, setShow] = useState(false);

  const {user, gameUser, updateGameUser, isAuthenticated} = useAuth();
  const {t} = useTranslation();

  const handlePreference = async (value: boolean) => {
    if (gameUser?.key) {
      const now = Timestamp.now();
      updateUser(gameUser.key, {
        userPreferences: {
          allowEmailContact: value,
          lastFeedbackRequest: now
        }
      });
      updateGameUser({
        userPreferences: {
          allowEmailContact: value,
          lastFeedbackRequest: now
        }
      });
    }
    setShow(false);
  };

  useEffect(() => {
    if (isAuthenticated && !gameUser?.userPreferences && !user?.isAnonymous) {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [gameUser]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{opacity: 0, y: 50}}
          animate={{opacity: 1, y: 0}}
          exit={{opacity: 0, y: 50}}
          transition={{duration: 0.3}}
          className="fixed flex w-full min-w-0 left-0 bottom-0 justify-center lg:justify-center items-end px-3 py-2 z-10 "
        >
          <Card className="w-96 text-primary-600 p-2 text-center">
            <h4 className="text-2xl font-bold">{t("Allow email contact")}</h4>
            <p className="text-lg">
              {t(
                "I’d like to reach out to you occasionally via email for feedback and updates. You can manage this in your profile settings."
              )}
            </p>
            <div className="flex justify-center space-x-4 py-2 text-primary-300">
              <Button
                className="w-20 h-10 rounded-lg transition p-1 text-2xl"
                onClick={() => handlePreference(false)}
              >
                {t("Decline")}
              </Button>
              <Button
                className="w-20 h-10 rounded-lg transition p-1 text-2xl"
                onClick={() => handlePreference(true)}
              >
                {t("Allow")}
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
