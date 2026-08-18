import type {Metadata} from "next";
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
    <Suspense
      fallback={
        <>
          <Loading />
          <div className="sr-only">
            <h1>{t("Start a room in seconds")}</h1>
            <p>
              {t(
                "Create a room, invite friends, and start a match in seconds."
              )}
            </p>
          </div>
        </>
      }
    >
      <HomeClientPage />
    </Suspense>
  );
}
