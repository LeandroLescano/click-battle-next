"use client";

import Link from "next/link";
import {useTranslation} from "react-i18next";

export function ClickSpeedTestGuide() {
  const {t} = useTranslation();

  return (
    <section
      aria-labelledby="click-speed-test-guide"
      className="mx-auto w-full max-w-[90rem] border-t border-primary-300 px-5 py-10 font-sans text-primary-600 dark:text-primary-100 md:px-10 md:py-14"
    >
      <div className="grid gap-10 md:grid-cols-2 md:gap-16">
        <div>
          <h2
            id="click-speed-test-guide"
            className="text-xl font-bold md:text-2xl"
          >
            {t("How to take the click speed test")}
          </h2>
          <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-6 md:text-base">
            <li>{t("Press Start test and wait for 3–2–1.")}</li>
            <li>
              {t(
                "When Click! appears, click or tap the button until time runs out."
              )}
            </li>
            <li>
              {t(
                "Your result shows your total clicks and clicks per second (CPS)."
              )}
            </li>
          </ol>
        </div>
        <div>
          <h2 className="text-xl font-bold md:text-2xl">
            {t("What does CPS mean?")}
          </h2>
          <p className="mt-5 text-sm leading-6 md:text-base">
            {t(
              "CPS means clicks per second. Your score is your total clicks divided by the test duration."
            )}
          </p>
          <p className="mt-4 rounded-lg border border-primary-300 px-4 py-3 text-sm font-bold md:text-base">
            {t("CPS = total clicks / 5 seconds")}
          </p>
          <p className="mt-3 text-sm leading-6 md:text-base">
            {t(
              "For example, 30 clicks in 5 seconds is 6 CPS. The result is rounded to one decimal place."
            )}
          </p>
        </div>
        <div>
          <h2 className="text-xl font-bold md:text-2xl">
            {t("Can I use a phone or play without an account?")}
          </h2>
          <p className="mt-5 text-sm leading-6 md:text-base">
            {t(
              "Yes. Tap the button on your phone or click with a mouse. You do not need to sign up to take this test."
            )}
          </p>
          <p className="mt-3 text-sm leading-6 md:text-base">
            {t("Use the same device and input method when comparing attempts.")}
          </p>
        </div>
        <div>
          <h2 className="text-xl font-bold md:text-2xl">
            {t("Play with friends")}
          </h2>
          <p className="mt-5 text-sm leading-6 md:text-base">
            {t(
              "Create a room, share its link and play Speed Battle or Reaction Battle with friends."
            )}
          </p>
          <nav
            aria-label={t("Explore Click Battle")}
            className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold underline underline-offset-4 md:text-base"
          >
            <Link href="/?entry_point=click_speed_test">
              {t("Play Click Battle with friends")}
            </Link>
            <Link href="/how-to-play">{t("How to play")}</Link>
            <Link href="/ranking">{t("Ranking")}</Link>
          </nav>
        </div>
      </div>
    </section>
  );
}
