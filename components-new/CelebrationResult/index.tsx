"use client";

import confetti from "canvas-confetti";
import React, {useEffect, useRef} from "react";

import {useGame} from "contexts/GameContext";

// canvas-confetti exposes shape helpers on the default export in its types.
// eslint-disable-next-line import/no-named-as-default-member
const {create: createConfetti, shapeFromPath} = confetti;

interface Props {
  shouldCelebrate?: boolean;
}

const PIXEL_BAR_PATH = "M0 0H14V5H0Z";
const PIXEL_DIAMOND_PATH = "M5 0L10 5L5 10L0 5Z";
const FALLBACK_COLORS = ["#c8d6fa", "#8ca8f1", "#5463e6", "#30458e", "#f9f9f9"];
const THEME_CONFETTI_TOKENS = [
  "--color-primary-100",
  "--color-primary-200",
  "--color-primary-250",
  "--color-primary-300",
  "--color-primary-400",
  "--color-primary-500"
];

function CelebrationResult({shouldCelebrate}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiRef = useRef<ReturnType<typeof createConfetti> | null>(null);
  const shapesRef = useRef<confetti.Shape[] | null>(null);
  const hasPlayedRef = useRef(false);
  const scheduledBurstsRef = useRef<number[]>([]);
  const {finalResults, game} = useGame();
  const showCelebration =
    shouldCelebrate ??
    (game.status === "ended" && finalResults?.localPosition === 1);

  useEffect(() => {
    const clearScheduledBursts = () => {
      scheduledBurstsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      scheduledBurstsRef.current = [];
    };

    if (!showCelebration) {
      clearScheduledBursts();
      hasPlayedRef.current = false;
      confettiRef.current?.reset();
      return;
    }

    if (hasPlayedRef.current || !canvasRef.current) return;

    hasPlayedRef.current = true;
    const fire =
      confettiRef.current ??
      createConfetti(canvasRef.current, {
        disableForReducedMotion: true,
        resize: true
      });
    confettiRef.current = fire;

    const shapes = shapesRef.current ?? [
      "square",
      shapeFromPath({path: PIXEL_BAR_PATH}),
      shapeFromPath({path: PIXEL_DIAMOND_PATH})
    ];
    shapesRef.current = shapes;

    const commonOptions: confetti.Options = {
      colors: getThemeConfettiColors(),
      decay: 0.92,
      disableForReducedMotion: true,
      flat: true,
      gravity: 0.72,
      scalar: 0.92,
      shapes,
      ticks: 205,
      zIndex: 20
    };
    const scheduleBurst = (delay: number, options: confetti.Options): void => {
      scheduledBurstsRef.current.push(
        window.setTimeout(() => {
          void fire({...commonOptions, ...options});
        }, delay)
      );
    };

    void fire({
      ...commonOptions,
      angle: 90,
      origin: {x: 0.5, y: 1.04},
      particleCount: 78,
      spread: 86,
      startVelocity: 54
    });

    void fire({
      ...commonOptions,
      angle: 52,
      drift: 0.24,
      origin: {x: -0.04, y: 0.72},
      particleCount: 48,
      spread: 68,
      startVelocity: 46
    });

    void fire({
      ...commonOptions,
      angle: 128,
      drift: -0.24,
      origin: {x: 1.04, y: 0.72},
      particleCount: 48,
      spread: 68,
      startVelocity: 46
    });

    scheduleBurst(220, {
      angle: 72,
      drift: 0.12,
      origin: {x: 0.08, y: 0.95},
      particleCount: 34,
      spread: 58,
      startVelocity: 40
    });

    scheduleBurst(340, {
      angle: 108,
      drift: -0.12,
      origin: {x: 0.92, y: 0.95},
      particleCount: 34,
      spread: 58,
      startVelocity: 40
    });

    scheduleBurst(560, {
      angle: 90,
      gravity: 0.68,
      origin: {x: 0.5, y: 1.04},
      particleCount: 40,
      spread: 96,
      startVelocity: 38
    });

    scheduleBurst(820, {
      angle: 90,
      gravity: 0.66,
      origin: {x: 0.5, y: 1.04},
      particleCount: 26,
      spread: 118,
      startVelocity: 32
    });

    return clearScheduledBursts;
  }, [showCelebration]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-20 h-screen w-screen overflow-hidden ${
        showCelebration ? "block" : "hidden"
      }`}
      id="celebration"
    />
  );
}

function getThemeConfettiColors() {
  if (typeof window === "undefined") return FALLBACK_COLORS;

  const themedElement = document.body ?? document.documentElement;
  const themedStyles = window.getComputedStyle(themedElement);
  const rootStyles = window.getComputedStyle(document.documentElement);
  const themeColors = THEME_CONFETTI_TOKENS.reduce<string[]>(
    (colors, token) => {
      const color =
        themedStyles.getPropertyValue(token).trim() ||
        rootStyles.getPropertyValue(token).trim();

      if (color && !colors.includes(color)) {
        colors.push(color);
      }

      return colors;
    },
    []
  );

  return themeColors.length ? themeColors : FALLBACK_COLORS;
}

export default CelebrationResult;
