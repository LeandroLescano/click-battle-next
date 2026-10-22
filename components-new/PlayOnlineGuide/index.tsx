"use client";

import {useTranslation} from "react-i18next";

import {ButtonLink} from "components-new/Button/ButtonLink";
import {LanguageDropdown} from "components-new/LanguageDropdown";
import {LeftArrow} from "icons/LeftArrow";

const GUIDE_SECTIONS = [
  {
    number: "01",
    title: "Create or join a room",
    body: "Use the lobby to create a room and choose a mode, or join an available room."
  },
  {
    number: "02",
    title: "Share the room link",
    body: "Invite friends with the room link. When everyone has joined, the host starts the match."
  },
  {
    number: "03",
    title: "Speed Battle: click before the timer ends",
    body: "Click or tap as many times as you can before the timer expires. The player with more clicks wins."
  },
  {
    number: "04",
    title: "Reaction Battle: wait for the signal",
    body: "After the signal appears, click, tap, or press Space. The fastest valid reaction wins; clicking early loses the round."
  }
] as const;

export const PlayOnlineGuide = () => {
  const {t} = useTranslation();

  return (
    <main className="min-h-dvh px-5 py-6 text-primary-700 md:px-8 md:py-8">
      <div className="relative mx-auto flex w-full max-w-[96rem] flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <ButtonLink
            href="/"
            variant="outlined"
            className="flex items-center gap-1 px-2.5 py-0.5 text-sm md:gap-2 md:px-5 md:py-1 md:text-2xl"
          >
            <LeftArrow />
            {t("Go Back!")}
          </ButtonLink>
          <LanguageDropdown />
        </div>

        <section className="flex w-full max-w-[72rem] flex-col gap-8">
          <div className="flex flex-col gap-4 border-b border-primary-300/80 pb-6 md:pb-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-500 dark:text-primary-200 md:text-lg">
              {t("How to play")}
            </p>
            <h1 className="max-w-[56rem] text-4xl font-bold leading-[0.95] text-primary-600 dark:text-primary-100 md:text-6xl">
              {t("How to play Click Battle")}
            </h1>
            <p className="max-w-[52rem] text-base font-semibold text-primary-600 dark:text-primary-100 md:text-2xl">
              {t(
                "Create or join a room, invite friends with its link, and learn how the available modes work."
              )}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <ButtonLink
                href="/"
                className="px-4 py-2 text-sm uppercase md:px-6 md:text-xl"
              >
                {t("Open lobby")}
              </ButtonLink>
              <ButtonLink
                href="/ranking"
                variant="outlined"
                className="px-4 py-2 text-sm uppercase md:px-6 md:text-xl"
              >
                {t("View ranking")}
              </ButtonLink>
              <ButtonLink
                href="/click-speed-test"
                variant="outlined"
                className="px-4 py-2 text-sm uppercase md:px-6 md:text-xl"
              >
                {t("Try the Click Speed Test")}
              </ButtonLink>
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
