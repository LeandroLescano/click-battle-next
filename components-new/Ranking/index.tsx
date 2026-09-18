"use client";

import moment from "moment";
import Link from "next/link";
import React, {useMemo, useState} from "react";
import {useTranslation} from "react-i18next";

import {Button} from "components-new/Button";
import {GameModeSelection} from "components-new/GameModeSelection";
import {LanguageDropdown} from "components-new/LanguageDropdown";
import {LeftArrow} from "icons/LeftArrow";

import {RankingAd} from "./components/RankingAd";
import {RankingList} from "./components/RankingList";
import {RankingMode, RankingProps} from "./types";

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
          <p className="max-w-[42rem] text-sm font-semibold text-primary-600 dark:text-primary-100 md:text-xl">
            {t("See who leads Classic Speed and Reaction Battle right now.")}
          </p>
        </div>

        <div className="mx-auto w-full max-w-[58rem]">
          <GameModeSelection
            onSelect={setSelectedMode}
            selectedGameMode={selectedMode}
            showHeader={false}
          />
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
