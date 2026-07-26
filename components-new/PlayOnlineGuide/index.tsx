"use client";

import Link from "next/link";
import {useTranslation} from "react-i18next";

import {Button} from "components-new/Button";
import {LanguageDropdown} from "components-new/LanguageDropdown";
import {LeftArrow} from "icons/LeftArrow";

const GUIDE_SECTIONS = [
  {
    number: "01",
    title: "Create a room or join one",
    body: "Use the lobby to open your own match or jump into an available room with a shared link."
  },
  {
    number: "02",
    title: "Invite your players",
    body: "Share the room link, wait for everyone to appear, and use a password only when you want a private match."
  },
  {
    number: "03",
    title: "Start fast, play fast",
    body: "Click Battle is built for quick rounds, instant rematches, and simple controls on desktop or phone."
  },
  {
    number: "04",
    title: "Come back for rematches",
    body: "Replay with the same group, switch rooms, or check the ranking when someone wants proof."
  }
] as const;

export const PlayOnlineGuide = () => {
  const {t} = useTranslation();

  return (
    <main className="min-h-dvh px-5 py-6 text-primary-700 md:px-8 md:py-8">
      <div className="relative mx-auto flex w-full max-w-[96rem] flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" passHref>
            <Button
              variant="outlined"
              className="flex items-center gap-1 px-2.5 py-0.5 text-sm md:gap-2 md:px-5 md:py-1 md:text-2xl"
            >
              <LeftArrow />
              {t("Go Back!")}
            </Button>
          </Link>
          <LanguageDropdown />
        </div>

        <section className="flex w-full max-w-[72rem] flex-col gap-8">
          <div className="flex flex-col gap-4 border-b border-primary-300/80 pb-6 md:pb-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-500 dark:text-primary-200 md:text-lg">
              {t("How to play")}
            </p>
            <h1 className="max-w-[56rem] text-4xl font-bold leading-[0.95] text-primary-600 dark:text-primary-100 md:text-6xl">
              {t("How to start a Click Battle")}
            </h1>
            <p className="max-w-[52rem] text-base font-semibold text-primary-600 dark:text-primary-100 md:text-2xl">
              {t(
                "Open the lobby, create a room or join one, invite your players, and start as soon as everyone is ready."
              )}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/" passHref>
                <Button className="px-4 py-2 text-sm uppercase md:px-6 md:text-xl">
                  {t("Open lobby")}
                </Button>
              </Link>
              <Link href="/ranking" passHref>
                <Button
                  variant="outlined"
                  className="px-4 py-2 text-sm uppercase md:px-6 md:text-xl"
                >
                  {t("View ranking")}
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-4 pb-2 md:gap-6">
            {GUIDE_SECTIONS.map((section) => (
              <article
                key={section.number}
                className="grid gap-2 border-b border-primary-300/80 pb-4 md:grid-cols-[5.5rem_minmax(0,1fr)] md:gap-8 md:pb-6"
              >
                <p className="text-lg font-bold text-primary-400 md:pt-1 md:text-3xl">
                  {section.number}
                </p>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-primary-600 dark:text-primary-100 md:text-4xl">
                    {t(section.title)}
                  </h2>
                  <p className="max-w-[50rem] text-sm font-semibold text-primary-600 dark:text-primary-100 md:text-2xl">
                    {t(section.body)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};
