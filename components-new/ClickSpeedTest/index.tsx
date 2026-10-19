"use client";

import {getAnalytics, logEvent} from "firebase/analytics";
import Link from "next/link";
import {useCallback, useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";

import {Button} from "components-new/Button";
import {ButtonLink} from "components-new/Button/ButtonLink";
import {BrandTitle} from "components-new/Header/BrandTitle";
import {LanguageDropdown} from "components-new/LanguageDropdown";
import {
  buildClickSpeedTestResult,
  CLICK_SPEED_TEST_DURATION_SECONDS
} from "lib/click-speed-test/session.cjs";

import "./styles.scss";

const DURATION_MS = CLICK_SPEED_TEST_DURATION_SECONDS * 1000;

export const ClickSpeedTest = () => {
  const {t} = useTranslation();
  const [clicks, setClicks] = useState(0);
  const [remainingMs, setRemainingMs] = useState(DURATION_MS);
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
    setRemainingMs(0);
    setPhase("locked");
    logEvent(getAnalytics(), "click_speed_test_complete", result);
  }, []);

  useEffect(() => {
    if (phase !== "running" || deadlineRef.current === null) return;
    const updateCountdown = () => {
      setRemainingMs(Math.max(deadlineRef.current! - Date.now(), 0));
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
    // Preserve the safety window: final rapid taps must not trigger a retry.
    const resultTimer = window.setTimeout(() => setPhase("complete"), 600);
    return () => window.clearTimeout(resultTimer);
  }, [phase]);

  const startTest = () => {
    clicksRef.current = 0;
    deadlineRef.current = Date.now() + DURATION_MS;
    finishedRef.current = false;
    setClicks(0);
    setRemainingMs(DURATION_MS);
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
  const showResult = isLocked || phase === "complete";
  const timeLeft = (remainingMs / 1000).toFixed(1);

  return (
    <main className="cst">
      <div className="cst-shell">
        <header className="cst-header">
          <Link
            href="/"
            className="cst-brand text-primary-600 dark:text-primary-100"
          >
            <BrandTitle />
          </Link>
          <LanguageDropdown />
        </header>

        <div className="cst-layout">
          <section className="cst-intro">
            <p className="cst-eyebrow">
              {t("Click speed test")} <span aria-hidden="true">/ 05</span>
            </p>
            <h1>{t("5-Second Click Speed Test")}</h1>
            <p className="cst-description">
              {t(
                "Measure your clicks per second in one quick, five-second round."
              )}
            </p>
            <p className="cst-caption">
              {t("Free to play. No account needed.")}
            </p>
            <a className="cst-guide-link" href="#click-speed-test-guide">
              {t("How your CPS is calculated")}{" "}
              <span aria-hidden="true">↓</span>
            </a>
          </section>

          <section
            className="cst-arena"
            data-phase={phase}
            data-urgent={isRunning && remainingMs <= 1000}
            aria-label={t("Click speed test")}
          >
            <div className="cst-arena-heading">
              <span className="cst-state">
                <span className="cst-state-dot" aria-hidden="true" />
                {showResult
                  ? t("Sprint complete")
                  : isRunning
                  ? t("In progress")
                  : t("Ready to play")}
              </span>
              <span className="cst-round-label">{t("5-second test")}</span>
            </div>

            <div className="cst-metrics">
              <div className="cst-time" role="timer" aria-live="off">
                <span className="cst-label">{t("Time remaining")}</span>
                <strong data-testid="click-speed-test-timer">
                  {timeLeft}
                  <span>s</span>
                </strong>
              </div>
              <div className="cst-clicks">
                <span className="cst-label">{t("Clicks")}</span>
                <strong>{clicks}</strong>
              </div>
            </div>
            <div
              className="cst-progress"
              role="progressbar"
              aria-label={t("Time remaining")}
              aria-valuemin={0}
              aria-valuemax={CLICK_SPEED_TEST_DURATION_SECONDS}
              aria-valuenow={Number(timeLeft)}
            >
              <span
                style={{transform: `scaleX(${remainingMs / DURATION_MS})`}}
              />
            </div>

            <div className="cst-stage">
              {showResult ? (
                <div
                  className="cst-result"
                  data-testid="click-speed-test-result"
                  aria-live="polite"
                >
                  <p className="cst-label">{t("Your result")}</p>
                  <div className="cst-result-score">
                    <strong data-testid="click-speed-test-score-cps">
                      {result.clicksPerSecond.toFixed(1)}
                    </strong>
                    <span>CPS</span>
                  </div>
                  <p className="cst-result-summary">
                    <span>{t("n clicks", {clicks: result.clicks})}</span>
                    <span aria-hidden="true"> · </span>
                    {t("5-second test")}
                  </p>
                  <div className="cst-actions">
                    {isLocked ? (
                      <Button
                        className="cst-challenge cst-action-disabled"
                        disabled
                      >
                        {t("Challenge a friend")}
                      </Button>
                    ) : (
                      <ButtonLink
                        data-testid="click-speed-test-challenge"
                        href="/?entry_point=click_speed_test"
                        className="cst-challenge"
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
                      </ButtonLink>
                    )}
                    <Button
                      data-testid="click-speed-test-retry"
                      variant="outlined"
                      className="cst-retry"
                      disabled={isLocked}
                      onClick={startTest}
                    >
                      {t("Try again")}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  data-testid={
                    isRunning
                      ? "click-speed-test-button"
                      : "click-speed-test-start"
                  }
                  className="cst-pad"
                  onClick={isRunning ? registerClick : startTest}
                >
                  <svg
                    className="cst-pointer"
                    width="32"
                    height="32"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    shapeRendering="crispEdges"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M3 1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1H7v2H5v3H3V1Z M7 10h2v2h1v2H8v-2H7Z" />
                  </svg>
                  <strong>{isRunning ? t("Click!") : t("Start test")}</strong>
                  <span>
                    {isRunning
                      ? t("Click or tap anywhere here")
                      : t("The timer starts immediately")}
                  </span>
                </Button>
              )}
            </div>
            <p className="cst-hint" role="status">
              {showResult
                ? t("Same device. Same test. Beat your score.")
                : isRunning
                ? t("Keep going — every click counts.")
                : t("Start the timer, then click or tap.")}
            </p>
          </section>
        </div>
      </div>
    </main>
  );
};
