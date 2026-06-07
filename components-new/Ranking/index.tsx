"use client";

import moment from "moment";
import Link from "next/link";
import React, {useMemo, useState} from "react";
import {useTranslation} from "react-i18next";

import {Button} from "components-new/Button";
import {LanguageDropdown} from "components-new/LanguageDropdown";
import {LeftArrow} from "icons/LeftArrow";
import {getGameModeLabel} from "lib/game/gameModes";

import {RankingAd} from "./components/RankingAd";
import {RankingList} from "./components/RankingList";
import {RankingMode, RankingProps} from "./types";

const RANKING_MODE_ORDER: RankingMode[] = ["classic-speed", "reaction"];

export const Ranking = ({lastUpdate, rankings}: RankingProps) => {
  const {t} = useTranslation();
  const [selectedMode, setSelectedMode] =
    useState<RankingMode>("classic-speed");

  const activeEntries = rankings[selectedMode];
  const activeMeta = useMemo(() => {
    if (selectedMode === "reaction") {
      return {
        title: t("Fastest reactions")
      };
    }

    return {
      title: t("Click masters")
    };
  }, [selectedMode, t]);

  return (
    <main className="h-dvh overflow-hidden px-5 py-6 md:px-8 md:py-8">
      <div className="relative mx-auto flex h-[calc(100dvh-3rem)] w-full max-w-[96rem] flex-col gap-5 overflow-hidden">
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

        <div className="mx-auto flex w-full max-w-[58rem] flex-col items-center gap-2 text-center">
          <h1 className="text-5xl font-bold text-primary-400 dark:text-primary-200 md:text-7xl">
            {activeMeta.title}
          </h1>
          <p className="text-lg font-semibold text-primary-600 dark:text-primary-100 md:text-3xl">
            {t("Last update")}:{" "}
            {moment(lastUpdate).format("DD/MM/YYYY HH:mm:ss")}
          </p>
        </div>

        <div className="mx-auto flex w-full max-w-[58rem] justify-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 bg-transparent p-1.5">
            {RANKING_MODE_ORDER.map((mode) => {
              const isActive = mode === selectedMode;

              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSelectedMode(mode)}
                  className={[
                    "min-w-[9rem] rounded-md border-2 px-4 py-2 text-sm font-bold uppercase transition md:min-w-[12rem] md:px-5 md:py-3 md:text-xl",
                    isActive
                      ? "border-primary-300 bg-primary-200 text-primary-700 shadow-[3px_4px_0_var(--color-primary-250)]"
                      : "border-transparent bg-transparent text-primary-600 hover:border-primary-300/60 hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-100"
                  ].join(" ")}
                >
                  {getGameModeLabel(t, mode)}
                </button>
              );
            })}
          </div>
        </div>

        <section className="relative flex min-h-0 flex-1 items-stretch justify-center overflow-hidden">
          <div className="mx-auto flex min-h-0 w-full max-w-[58rem] flex-1 flex-col overflow-hidden">
            <RankingList mode={selectedMode} users={activeEntries} />
          </div>
        </section>

        <div className="pointer-events-none absolute bottom-0 right-0 hidden min-[1440px]:block">
          <div className="pointer-events-auto">
            <RankingAd />
          </div>
        </div>
      </div>
    </main>
  );
};
