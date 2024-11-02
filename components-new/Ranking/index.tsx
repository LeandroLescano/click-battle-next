"use client";

import React from "react";
import Link from "next/link";
import moment from "moment";
import {useTranslation} from "react-i18next";

import {LeftArrow} from "icons/LeftArrow";
import {Button} from "components-new/Button";
import {LanguageDropdown} from "components-new/LanguageDropdown";

import {RankingProps} from "./types";
import {RankingList} from "./components/RankingList";

export const Ranking = ({lastUpdate, usersWithScore}: RankingProps) => {
  const {t} = useTranslation();

  return (
    <main>
      <div className="text-primary-200 h-dvh flex flex-col gap-3 md:gap-6">
        <div className="flex justify-between items-center gap-9">
          <Link href="/" passHref>
            <Button
              variant="outlined"
              className="px-2.5 py-0.5 md:px-5 md:py-1 text-sm md:text-2xl flex gap-1 md:gap-2 items-center"
            >
              <LeftArrow />
              {t("Go Back!")}
            </Button>
          </Link>
          <LanguageDropdown />
        </div>
        <h1 className="text-5xl md:text-7xl text-primary-400 dark:text-primary-200 font-bold text-center">
          Click masters
        </h1>
        <h3 className="text-xl md:text-3xl text-primary-600 dark:text-primary-100 font-semibold text-center">
          {t("Last update")}: {moment(lastUpdate).format("DD/MM/YYYY HH:mm:ss")}
        </h3>
        <RankingList users={usersWithScore} />
      </div>
    </main>
  );
};
