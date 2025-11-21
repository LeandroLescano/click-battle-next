import {Dialog, DialogBackdrop, DialogPanel} from "@headlessui/react";
import {GameUser} from "@leandrolescano/click-battle-core";
import {Timestamp} from "firebase/firestore";
import React, {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";

import {
  Button,
  LanguageDropdown,
  Input,
  ThemeSelector,
  Switch
} from "components-new";
import {useAuth} from "contexts/AuthContext";
import {isUsernameAvailable, updateUser} from "services/user";

import {ProfileModalProps} from "./types";

export const ProfileModal = ({show, onClose}: ProfileModalProps) => {
  const [localData, setLocalData] = useState<Partial<GameUser>>();
  const [usernameError, setUsernameError] = useState<
    undefined | "length" | "available"
  >();
  const [loading, setLoading] = useState(false);

  const {t} = useTranslation();
  const {gameUser, user, updateGameUser} = useAuth();

  const onSave = async () => {
    setLoading(true);
    if (gameUser?.key) {
      if (
        localData?.username &&
        localData.username.trim().length >= 3 &&
        localData.username.trim().length <= 25
      ) {
        const dataToUpdate: Partial<GameUser> = {};

        if (localData.username !== gameUser.username) {
          if (await isUsernameAvailable(localData.username)) {
            dataToUpdate.username = localData.username;
          } else {
            setUsernameError("available");
            setLoading(false);
            return;
          }
        }

        if (
          localData.userPreferences?.allowEmailContact !==
          gameUser.userPreferences?.allowEmailContact
        ) {
          dataToUpdate.userPreferences = {
            allowEmailContact:
              localData?.userPreferences?.allowEmailContact || false,
            lastFeedbackRequest: Timestamp.now()
          };
        }
        updateUser(gameUser.key, dataToUpdate);
        updateGameUser(dataToUpdate);
        handleOnClose();
      } else {
        setUsernameError("length");
      }
    } else {
      if (
        localData?.username &&
        localData.username.trim().length >= 3 &&
        localData.username.trim().length <= 25
      ) {
        const dataToUpdate: Partial<GameUser> = {};

        if (localData.username !== gameUser?.username) {
          if (await isUsernameAvailable(localData.username)) {
            dataToUpdate.username = localData.username;
            localStorage.setItem("user", localData.username);
            updateGameUser(dataToUpdate);
            handleOnClose();
          } else {
            setUsernameError("available");
          }
        }
      } else {
        setUsernameError("length");
      }
    }
    setLoading(false);
  };

  const handleOnClose = () => {
    onClose();
  };

  const handleUpdateData = (data: Partial<GameUser>) => {
    setUsernameError(undefined);
    setLocalData((prev) => ({...prev, ...data}));
  };

  useEffect(() => {
    setLocalData(gameUser);
  }, [show]);

  return (
    <Dialog
      open={show}
      className="relative z-10 focus:outline-none"
      onClose={handleOnClose}
    >
      <DialogBackdrop className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="fixed inset-0 flex w-screen items-center justify-center dark:text-white">
        <DialogPanel className="flex items-center content-center rounded-md mx-3 sm:mx-0 px-7 py-16 md:px-16 bg-primary-50 dark:bg-primary-600">
          <div className="px-4 flex flex-col gap-3 md:gap-6">
            <h2 className="text-3xl md:text-5xl text-center font-extrabold text-primary-700 dark:text-primary-200">
              {t("Profile")}
            </h2>
            <Input
              label={t("Username")}
              labelClassName="text-primary-500 dark:text-primary-200 text-xs md:text-lg"
              type="text"
              className="h-9 md:h-12 text-xs md:text-lg min-w-80"
              containerClassName="flex-1"
              data-label="Username"
              value={localData?.username}
              description={
                usernameError === "available"
                  ? t("Username not available")
                  : usernameError === "length"
                  ? t("Username must be 3-25 characters")
                  : ""
              }
              onChange={(ref) => handleUpdateData({username: ref.target.value})}
            />
            {!user?.isAnonymous && (
              <Input
                label="Email"
                labelClassName="text-primary-500 dark:text-primary-200 text-xs md:text-lg"
                type="text"
                className="h-9 md:h-12 text-xs md:text-lg min-w-80 dark:text-slate-400"
                containerClassName="flex-1"
                data-label="Email"
                disabled
                value={localData?.email}
              />
            )}
            <div className="flex gap-3 md:gap-6 mt-2">
              <LanguageDropdown />
              <ThemeSelector />
            </div>
            {!user?.isAnonymous && (
              <Switch
                checked={localData?.userPreferences?.allowEmailContact || false}
                label={t("Allow contact by email")}
                containerClassName="flex gap-3 md:gap-6 flex-row-reverse self-start"
                onChange={(checked) =>
                  handleUpdateData({
                    userPreferences: {
                      allowEmailContact: checked,
                      lastFeedbackRequest: Timestamp.now()
                    }
                  })
                }
              />
            )}
            <Button
              className="p-1 md:p-2 text-primary-500 text-sm md:text-2xl font-semibold w-full mt-2"
              onClick={onSave}
              loading={loading}
              loadingText={t("Saving...")}
            >
              {t("Save")}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
