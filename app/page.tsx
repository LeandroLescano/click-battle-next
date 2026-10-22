import type {Metadata} from "next";
import Link from "next/link";
import {Suspense} from "react";

import {Loading} from "components-new/Loading";
import {getServerTranslations} from "i18n/server";
import {createRouteMetadata} from "lib/seo/metadata";

import HomeClientPage from "./page-client";

export async function generateMetadata(): Promise<Metadata> {
  return createRouteMetadata("home");
}

export default async function Home() {
  const {t} = await getServerTranslations("translation");

  return (
    <>
      <Suspense
        fallback={
          <>
            <Loading />
            <div className="sr-only">
              <h1>{t("Create a room and play Click Battle with friends")}</h1>
              <p>{t("Share the room link to invite friends to your match.")}</p>
            </div>
          </>
        }
      >
        <HomeClientPage />
      </Suspense>
      <nav
        aria-label={t("Explore Click Battle")}
        className="flex flex-wrap justify-center gap-x-6 gap-y-3 border-t border-primary-300 px-5 py-5 font-sans text-sm font-semibold text-primary-600 dark:text-primary-100"
      >
        <Link href="/click-speed-test" className="underline underline-offset-4">
          {t("Try the Click Speed Test")}
        </Link>
        <Link href="/how-to-play" className="underline underline-offset-4">
          {t("How to play")}
        </Link>
        <Link href="/ranking" className="underline underline-offset-4">
          {t("Ranking")}
        </Link>
      </nav>
    </>
  );
}
