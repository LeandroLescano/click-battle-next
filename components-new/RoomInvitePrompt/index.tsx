import {Dialog, DialogBackdrop, DialogPanel} from "@headlessui/react";
import React from "react";
import {useTranslation} from "react-i18next";

import {Button} from "components-new/Button";
import {Game} from "interfaces";
import {getGameModeLabel} from "lib/game/gameModes";

type RoomInvitePromptProps = {
  game: Game;
  onInvite: () => void;
  onDismiss: () => void;
  onOpenSettings: () => void;
  show: boolean;
};

export const RoomInvitePrompt = ({
  game,
  onInvite,
  onDismiss,
  onOpenSettings,
  show
}: RoomInvitePromptProps) => {
  const {t} = useTranslation();
  const connectedPlayers = game.listUsers.length;

  return (
    <Dialog className="relative z-20" onClose={onDismiss} open={show}>
      <DialogBackdrop className="fixed inset-0 bg-black/55 backdrop-blur-sm" />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel
          className="w-full max-w-md rounded-2xl border border-primary-300 bg-primary-50 p-5 text-primary-700 shadow-2xl dark:border-primary-200 dark:bg-primary-700 dark:text-primary-100 md:p-7"
          data-testid="room-invite-prompt"
        >
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-primary-500 dark:text-primary-200">
            {t("Room lobby")}
          </p>
          <h2 className="mt-2 text-3xl font-extrabold md:text-5xl">
            {t("Invite a friend to start")}
          </h2>
          <p className="mt-2 text-base font-semibold text-primary-500 dark:text-primary-200 md:text-xl">
            {t("You need one more player to start.")}
          </p>

          <div className="mt-5 rounded-xl bg-primary-100 p-3 dark:bg-primary-600 md:p-4">
            <p className="break-words text-xl font-extrabold md:text-2xl">
              {game.roomName}
            </p>
            <p className="mt-1 text-sm font-semibold text-primary-500 dark:text-primary-200 md:text-base">
              {getGameModeLabel(t, game.gameMode)} ·{" "}
              {t("Players connected", {
                count: connectedPlayers,
                max: game.settings.maxUsers
              })}
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <Button
              className="w-full px-4 py-3 text-xl md:text-3xl"
              onClick={onInvite}
            >
              {t("Invite friends")}
            </Button>
            <Button
              className="w-full px-4 py-2 text-lg md:text-2xl"
              onClick={onOpenSettings}
              variant="outlined"
            >
              {t("Room settings")}
            </Button>
            <button
              className="self-center text-sm font-semibold text-primary-500 underline underline-offset-4 dark:text-primary-200"
              onClick={onDismiss}
              type="button"
            >
              {t("Continue waiting")}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
