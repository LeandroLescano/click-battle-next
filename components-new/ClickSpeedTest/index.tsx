"use client";

import {getAnalytics, logEvent} from "firebase/analytics";
import Link from "next/link";
import {useCallback, useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";

import {Button} from "components-new/Button";
import {LanguageDropdown} from "components-new/LanguageDropdown";
import {
  buildClickSpeedTestResult,
  CLICK_SPEED_TEST_DURATION_SECONDS
} from "lib/click-speed-test/session.cjs";

export const ClickSpeedTest = () => {
  const {t} = useTranslation();
  const [clicks, setClicks] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(
    CLICK_SPEED_TEST_DURATION_SECONDS
  );
  const [phase, setPhase] = useState<
    "ready" | "running" | "locked" | "complete"
  >("ready");
  const clicksRef = useRef(0);
  const deadlineRef = useRef<number | null>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    logEvent(getAnalytics(), "click_speed_test_view", {
      duration_seconds: CLICK_SPEED_TEST_DURATION_SECONDS
    });
  }, []);

  const finishTest = useCallback(() => {
    if (finishedRef.current) return;

    finishedRef.current = true;
    deadlineRef.current = null;
    const result = buildClickSpeedTestResult(clicksRef.current);
    setRemainingSeconds(0);
    setPhase("locked");
    logEvent(getAnalytics(), "click_speed_test_complete", result);
  }, []);

  useEffect(() => {
    if (phase !== "running" || deadlineRef.current === null) return;

    const updateCountdown = () => {
      const remainingMilliseconds = Math.max(
        deadlineRef.current! - Date.now(),
        0
      );
      setRemainingSeconds(Math.ceil(remainingMilliseconds / 1000));
    };
    const timer = window.setInterval(updateCountdown, 100);
    const timeout = window.setTimeout(
      finishTest,
      Math.max(deadlineRef.current - Date.now(), 0)
    );

    return () => {
      window.clearInterval(timer);
      window.clearTimeout(timeout);
    };
  }, [finishTest, phase]);

  useEffect(() => {
    if (phase !== "locked") return;

    const resultTimer = window.setTimeout(() => setPhase("complete"), 600);
    return () => window.clearTimeout(resultTimer);
  }, [phase]);

  const startTest = () => {
    clicksRef.current = 0;
    deadlineRef.current = Date.now() + CLICK_SPEED_TEST_DURATION_SECONDS * 1000;
    finishedRef.current = false;
    setClicks(0);
    setRemainingSeconds(CLICK_SPEED_TEST_DURATION_SECONDS);
    setPhase("running");
    logEvent(getAnalytics(), "click_speed_test_start", {
      duration_seconds: CLICK_SPEED_TEST_DURATION_SECONDS
    });
  };

  const registerClick = () => {
    if (phase !== "running") return;

    if (deadlineRef.current === null || Date.now() >= deadlineRef.current) {
      finishTest();
      return;
    }

    clicksRef.current += 1;
    setClicks(clicksRef.current);
  };

  const result = buildClickSpeedTestResult(clicks);
  const isRunning = phase === "running";
  const isLocked = phase === "locked";
  const isComplete = phase === "complete";

  return (
    <main className="min-h-dvh px-5 py-5 text-primary-700 md:h-dvh md:overflow-hidden md:px-10 md:py-8">
      <div className="relative mx-auto flex h-full w-full max-w-[90rem] flex-col gap-4 !px-0 !py-0 md:gap-6">
        <header className="flex h-8 items-center justify-between">
          <Link
            href="/"
            className="font-bold uppercase tracking-[0.16em] text-primary-600 transition-opacity hover:opacity-70 dark:text-primary-100"
          >
            Click Battle
          </Link>
          <LanguageDropdown />
        </header>

        <section className="grid min-h-0 flex-1 gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center md:gap-20">
          <div className="flex min-h-0 flex-col justify-center py-2 md:py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-500 dark:text-primary-200 md:text-xs">
              {t("Click speed test")}
            </p>
            <h1 className="mt-3 max-w-[34rem] text-5xl font-bold leading-[0.88] text-primary-600 dark:text-primary-100 md:text-7xl">
              {t("How many clicks can you make in 5 seconds?")}
            </h1>
            <p className="mt-5 max-w-[31rem] text-base font-semibold leading-snug text-primary-600 dark:text-primary-100 md:text-xl">
              {t(
                "Start the timer, click as fast as you can, then challenge a friend to a real-time Click Battle."
              )}
            </p>
            <div className="mt-10 max-w-[31rem] text-primary-600 dark:text-primary-100">
              <h2 className="font-sans text-sm font-bold md:text-base">
                {t("What is a click speed test?")}
              </h2>
              <p className="mt-2 max-w-[31rem] font-sans text-xs font-medium leading-5 md:text-sm">
                {t(
                  "A click speed test measures how many times you can click in a short time. Use this 5-second challenge to warm up, compare scores, and then take the competition into a 1v1 Click Battle room."
                )}
              </p>
            </div>
          </div>

          <section className="flex min-h-[26rem] flex-col py-6 text-center md:h-[28rem] md:min-h-0 md:self-center md:py-8">
            <div className="grid grid-cols-2 gap-3 self-end">
              <div className="min-w-28 rounded-xl border border-primary-300 bg-primary-100 px-4 py-2 dark:border-primary-300 dark:bg-primary-600">
                <p className="text-[10px] font-bold uppercase tracking-wide text-primary-500 dark:text-primary-50">
                  {t("Time")}
                </p>
                <p className="text-4xl font-bold tabular-nums text-primary-600 dark:text-primary-50 md:text-5xl">
                  {remainingSeconds}s
                </p>
              </div>
              <div className="min-w-28 rounded-xl border border-primary-300 bg-primary-100 px-4 py-2 dark:border-primary-300 dark:bg-primary-600">
                <p className="text-[10px] font-bold uppercase tracking-wide text-primary-500 dark:text-primary-50">
                  {t("Clicks")}
                </p>
                <p className="text-4xl font-bold tabular-nums text-primary-600 dark:text-primary-50 md:text-5xl">
                  {clicks}
                </p>
              </div>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-8 pt-4 md:px-8 md:pb-10">
              <div className="flex min-h-28 max-w-[34rem] flex-col justify-center">
                {isComplete ? (
                  <div className="space-y-2" aria-live="polite">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-500 dark:text-primary-200 md:text-lg">
                      {t("Your result")}
                    </p>
                    <p className="text-5xl font-bold tabular-nums text-primary-600 dark:text-primary-100 md:text-7xl">
                      {t("n clicks", {clicks: result.clicks})}
                    </p>
                    <p className="text-base font-semibold text-primary-600 dark:text-primary-100 md:text-xl">
                      {t("n clicks per second", {
                        clicks: result.clicksPerSecond
                      })}
                    </p>
                  </div>
                ) : isLocked ? (
                  <p
                    className="text-lg font-bold text-primary-600 dark:text-primary-100 md:text-2xl"
                    role="status"
                  >
                    {t("Time! Locking your score…")}
                  </p>
                ) : (
                  <p className="text-lg font-bold text-primary-600 dark:text-primary-100 md:text-2xl">
                    {isRunning
                      ? t("Click the button as fast as you can!")
                      : t(
                          "Ready? Your 5-second challenge starts when you press start."
                        )}
                  </p>
                )}
              </div>

              {isRunning ? (
                <Button
                  data-testid="click-speed-test-button"
                  className="h-36 w-full max-w-[34rem] px-8 text-4xl md:h-44 md:text-6xl"
                  onClick={registerClick}
                >
                  {t("Click!")}
                </Button>
              ) : isLocked ? (
                <div
                  aria-hidden="true"
                  className="h-36 w-full max-w-[34rem] rounded-md border-2 border-primary-300/50 bg-primary-200/30 md:h-44"
                />
              ) : isComplete ? null : (
                <Button
                  data-testid="click-speed-test-start"
                  className="h-36 w-full max-w-[34rem] px-8 text-4xl uppercase md:h-44 md:text-6xl"
                  onClick={startTest}
                >
                  {t("Start test")}
                </Button>
              )}

              <div className="h-12">
                {isComplete ? (
                  <div className="flex h-full items-center justify-center gap-3">
                    <Link
                      data-testid="click-speed-test-challenge"
                      href="/?entry_point=click_speed_test"
                      className="inline-flex h-full items-center rounded-lg bg-primary-600 px-6 text-base font-bold uppercase text-primary-50 transition-colors hover:bg-primary-500 dark:bg-primary-100 dark:text-primary-700 dark:hover:bg-primary-200 md:px-8 md:text-xl"
                      onClick={() =>
                        logEvent(
                          getAnalytics(),
                          "click_speed_test_challenge_click",
                          {
                            clicks: result.clicks,
                            clicks_per_second: result.clicksPerSecond
                          }
                        )
                      }
                    >
                      {t("Challenge a friend")}
                    </Link>
                    <Button
                      data-testid="click-speed-test-retry"
                      variant="outlined"
                      className="h-full px-4 text-base uppercase md:px-6 md:text-xl"
                      onClick={startTest}
                    >
                      {t("Try again")}
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
};
