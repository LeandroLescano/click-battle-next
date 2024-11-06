import React, {Suspense} from "react";
import Script from "next/script";
import localFont from "next/font/local";
import "./tailwind.scss";

import {getApp, getApps, initializeApp} from "firebase/app";

import {AuthProvider} from "contexts/AuthContext";
import {Loading} from "components-new/Loading";
import {detectLanguage} from "i18n/server";
import {I18nProvider} from "i18n/i18n-context";
import {firebaseConfig} from "resources/config";
import {GameProvider} from "contexts/GameContext";
import {ThemeProvider} from "contexts/ThemeContext";
import {UsernameModal} from "components-new/UsernameModal";

if (!getApps.length) {
  initializeApp(firebaseConfig);
} else {
  getApp(); // if already initialized, use that one
}

type Props = {
  children: JSX.Element;
};

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
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}`}
            crossOrigin="anonymous"
          ></Script>
          <title>Click Battle</title>
          <meta name="viewport" content="width=device-width, minimum-scale=1" />
          <meta
            name="description"
            content="Click Battle is an online multiplayer click battle game where you can challenge your friends to a 10 second click battle. The player with the most clicks at the end of the battle wins. Click Battle is a fun and addictive game that is perfect for a quick break or a long gaming session."
          />
          <meta
            name="keywords"
            content="click, clicks, battle, game, multiplayer, online, friends, competition, challenge, high score, leaderboard, social, fun, addictive, casual, free"
          />
          <meta property="og:type" content="article" />
          <meta property="og:title" content="Click Battle" />
          <meta
            property="og:image"
            content="https://www.click-battle.com.ar/logo/logo.svg"
          />
          <meta
            property="og:description"
            content="Online multiplayer click battle game"
          />
          <meta property="og:url" content="https://www.click-battle.com.ar/" />
          <meta property="og:site_name" content="Click Battle" />
          <meta name="twitter:title" content="Click Battle" />
          <meta
            name="twitter:description"
            content="Online multiplayer click battle game"
          />
          <meta
            name="twitter:image"
            content="https://www.click-battle.com.ar/logo/logo.svg"
          />
          <meta name="twitter:creator" content="@LeanLescano_" />
          <meta name="author" content="Lescano Leandro Nicolas" />
          {/* Script to fix 'globalThis is not defined' errors */}
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
