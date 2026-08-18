import {getApp, getApps, initializeApp} from "firebase/app";
import type {Metadata} from "next";
import localFont from "next/font/local";
import React, {ReactNode, Suspense} from "react";

import {Loading} from "components-new/Loading";
import {UsernameModal} from "components-new/UsernameModal";
import {AuthProvider} from "contexts/AuthContext";
import {GameProvider} from "contexts/GameContext";
import {ThemeProvider} from "contexts/ThemeContext";
import {I18nProvider} from "i18n/i18n-context";
import {detectLanguage} from "i18n/server";
import {ADS_ENABLED, ADSENSE_PUBLISHER_ID} from "lib/ads/placements";
import {createRootMetadata} from "lib/seo/metadata";
import {firebaseConfig} from "resources/config";

import "./tailwind.scss";

if (!getApps().length) {
  initializeApp(firebaseConfig);
} else {
  getApp();
}

type Props = {
  children: ReactNode;
};

export async function generateMetadata(): Promise<Metadata> {
  return createRootMetadata();
}

const tinyFont = localFont({
  src: "../public/fonts/Tiny5-Regular.ttf",
  variable: "--font-tiny5"
});
const handjetFont = localFont({
  src: "../public/fonts/Handjet.ttf",
  variable: "--font-handjet"
});

export default async function Layout({children}: Props) {
  const lng = await detectLanguage();

  return (
    <I18nProvider language={lng}>
      <html
        lang={lng}
        dir={lng}
        className={`${tinyFont.variable} ${handjetFont.className}`}
      >
        <head>
          {ADS_ENABLED ? (
            <script
              async
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`}
              crossOrigin="anonymous"
            />
          ) : null}
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, minimum-scale=1, viewport-fit=cover"
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `!function(t){function e(){var e=this||self;e.globalThis=e,delete t.prototype._T_}"object"!=typeof globalThis&&(this?e():(t.defineProperty(t.prototype,"_T_",{configurable:!0,get:e}),_T_))}(Object);`
            }}
          />
        </head>
        <body>
          <ThemeProvider>
            <AuthProvider>
              <GameProvider>
                <Suspense fallback={<Loading />}>
                  {children}
                  <UsernameModal />
                </Suspense>
              </GameProvider>
            </AuthProvider>
          </ThemeProvider>
        </body>
      </html>
    </I18nProvider>
  );
}
