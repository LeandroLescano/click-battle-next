import React, {ChangeEvent, useCallback, useState} from "react";
import {Dialog, DialogBackdrop, DialogPanel} from "@headlessui/react";
import {useTranslation} from "react-i18next";
import Swal from "sweetalert2";
import clsx from "clsx";
import {twMerge} from "tailwind-merge";

import {Button, Input} from "components-new";
import {AuthProviders, useAuth} from "contexts/AuthContext";
import {isUsernameAvailable} from "services/user";

import {LoginModalProps} from "./types";
import SocialButton from "./components/SocialButton";
import {timeout} from "utils/timeout";

export const LoginModal = ({
  allowAnonymous = true,
  onClose,
  show
}: LoginModalProps) => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [incorrectLength, setIncorrectLength] = useState(false);

  const {
    signInWithProvider,
    signInAnonymously,
    user,
    gameUser,
    createUsername
  } = useAuth();
  const {t} = useTranslation();

  const handleLogin = (provider: AuthProviders = "google") => {
    signInWithProvider(provider);
  };

  const handleOnClose = useCallback((_?: boolean) => {
    onClose?.();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length <= 25) {
      setName(e.target.value);
    }
  };

  const handleCreateUsername = async (
    e?: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e?.preventDefault();
    const trimmedName = name.trim();

    if (trimmedName.length >= 3 && trimmedName.length <= 25) {
      setLoading(true);

      if (!user) {
        await signInAnonymously();
      }

      if (await isUsernameAvailable(trimmedName)) {
        createUsername(trimmedName, user?.isAnonymous ?? true);
        setName("");
      } else {
        Swal.fire({
          title: t("Username not available"),
          icon: "error",
          toast: true,
          position: "bottom-right",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false
        });
      }
      setLoading(false);
    } else {
      setIncorrectLength(true);
      await timeout(1000).then(() => setIncorrectLength(false));
    }
  };

  return (
    <Dialog
      open={
        allowAnonymous
          ? !user || (user.isAnonymous && !gameUser?.username)
          : !!(show && user && user?.isAnonymous)
      }
      onClose={handleOnClose}
      className="relative z-10 focus:outline-none"
    >
      <DialogBackdrop className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="fixed inset-0 flex w-screen items-center justify-center dark:text-white">
        <DialogPanel className="mx-3 sm:mx-0 flex items-center content-center min-h-64 rounded-md px-4 py-7 sm:p-16 bg-primary-50 dark:bg-primary-600">
          <div
            className={twMerge(
              clsx(
                "flex",
                allowAnonymous
                  ? "w-full flex-col md:flex-row"
                  : "flex-col gap-6",
                "md:gap-11"
              )
            )}
          >
            <div className="gap-4 flex flex-col justify-between flex-1">
              <h2
                className={twMerge(
                  "text-2xl font-bold",
                  !allowAnonymous ? "text-center" : "text-center md:text-start"
                )}
              >
                {t("Login with")}
              </h2>
              <div
                className={twMerge(
                  clsx(
                    "flex gap-4 center",
                    !allowAnonymous
                      ? "justify-center"
                      : "justify-center md:justify-start"
                  )
                )}
              >
                <SocialButton
                  variant="google"
                  onClick={() => handleLogin("google")}
                />
                <SocialButton
                  variant="github"
                  onClick={() => handleLogin("github")}
                />
                <SocialButton
                  variant="twitter-new"
                  onClick={() => handleLogin("twitter")}
                />
              </div>
              <p
                className={twMerge(
                  clsx(
                    "mb-2 text-lg text-balance",
                    !allowAnonymous
                      ? "mb-0 text-center"
                      : "text-center md:text-start"
                  )
                )}
              >
                {t(
                  "Log in with your account to save your name, score and more!"
                )}
              </p>
            </div>
            {allowAnonymous ? (
              <div
                className={`flex-1 mt-4 pt-4 border-t border-primary-700 dark:border-white/60 md:border-l-2 md:border-t-0 md:pl-11 md:pt-0 md:mt-0

                  `}
              >
                <h2 className="text-2xl font-bold">
                  {t("Enter your username")}
                </h2>
                <Input
                  type="text"
                  data-label="username"
                  value={name}
                  onChange={handleChange}
                  descriptionClassName={incorrectLength ? "animate-shake" : ""}
                  placeholder={t("Username")}
                  description={t("Username must be 3-25 characters")}
                  onKeyUp={(e) => e.key === "Enter" && handleCreateUsername()}
                />
                <Button
                  className="py-2 px-3 mb-3 mt-5 w-full"
                  onClick={handleCreateUsername}
                  type="submit"
                  loading={loading}
                >
                  {t("Choose")}
                </Button>
              </div>
            ) : (
              <Button className="w-full text-2xl py-2" onClick={handleOnClose}>
                {t("Cancel")}
              </Button>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
