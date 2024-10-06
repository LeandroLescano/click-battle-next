import React, {useState} from "react";
import "firebase/database";
import {useTranslation} from "react-i18next";
import {Dialog, DialogBackdrop, DialogPanel} from "@headlessui/react";
import Swal from "sweetalert2";

import {useAuth} from "contexts/AuthContext";
import {isUsernameAvailable} from "services/user";
import {Button, Input} from "components-new";

export const UsernameModal = () => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const {user, gameUser, createUsername, signOut} = useAuth();
  const {t} = useTranslation();

  const handleChange = (name: string) => {
    if (name.length <= 25) {
      setName(name);
    }
  };

  const handleCreateUsername = async (
    e?: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e?.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName.length >= 3) {
      setLoading(true);
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
    }
  };

  return (
    <Dialog
      open={!!(user && !user.isAnonymous && !gameUser?.username)}
      className="relative z-10 focus:outline-none"
      onClose={signOut}
    >
      <DialogBackdrop className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="fixed inset-0 flex w-screen items-center justify-center dark:text-white">
        <DialogPanel className="flex items-center content-center rounded-md py-4 px-6 bg-primary-50 dark:bg-primary-600">
          <div className="flex flex-col items-center gap-3">
            <h2 className="text-2xl font-bold">{t("Enter your username")}</h2>
            <Input
              type="text"
              className="form-name"
              data-label="username"
              value={name}
              placeholder={t("Username")}
              onChange={(e) => handleChange(e.target.value)}
              description={t("Username must be 3-25 characters")}
              descriptionClassName="text-center"
              onKeyUp={(e) => e.key === "Enter" && handleCreateUsername()}
            />
            <div className="flex gap-4 items-center">
              <Button className="py-2 px-3 mb-3" onClick={signOut}>
                {t("Cancel")}
              </Button>
              <Button
                disabled={name.trim().length < 3 || name.trim().length > 25}
                className="py-2 px-3 mb-3 flex justify-center items-center"
                onClick={handleCreateUsername}
                type="submit"
                loading={loading}
              >
                {t("Choose")}
              </Button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
