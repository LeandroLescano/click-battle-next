import React, {Suspense} from "react";
import Script from "next/script";
import "../styles/globals.scss";
import "../styles/styles.scss";
import "../styles/roomGame.scss";
import "../styles/index.scss";
import "../styles/404.scss";
import "../styles/footer.scss";
import "../styles/about.scss";
import "../styles/loginButton.scss";

import {getApp, getApps, initializeApp} from "firebase/app";

import {connectAuthEmulator, getAuth} from "firebase/auth";
import {connectDatabaseEmulator, getDatabase} from "firebase/database";
import {AuthProvider} from "contexts/AuthContext";
import {Loading} from "components/Loading";
import {connectFirestoreEmulator, getFirestore} from "firebase/firestore";
import {
  getAnalytics,
  isSupported,
  setAnalyticsCollectionEnabled
} from "firebase/analytics";
import {detectLanguage} from "app/i18n/server";
import {I18nProvider} from "app/i18n/i18n-context";
import {firebaseConfig} from "resources/config";

if (!getApps.length) {
  initializeApp(firebaseConfig);
} else {
  getApp(); // if already initialized, use that one
}

if (process.env.NODE_ENV === "development") {
  try {
    connectAuthEmulator(getAuth(), "http://localhost:9099", {
      disableWarnings: true
    });
    connectFirestoreEmulator(getFirestore(), "localhost", 8080);
    connectDatabaseEmulator(getDatabase(), "localhost", 9000);

    isSupported().then(
      (supported) =>
        supported && setAnalyticsCollectionEnabled(getAnalytics(), false)
    );
  } catch (error) {
    console.log({error});
  }
}

type Props = {
  children: JSX.Element;
};

export default async function Layout({children}: Props) {
  const lng = await detectLanguage();

  console.log({lng});

  return (
    <I18nProvider language={lng}>
      <html lang={lng} dir={lng}>
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
            content="Online multiplayer Click battle - Challenge your friends to a 10 second click battle!"
          />
          <meta
            name="keywords"
            content="click, clicks, battle, game, multiplayer, online, friends"
          />
          <meta property="og:type" content="article" />
          <meta property="og:title" content="CLICK BATTLE" />
          <meta
            property="og:image"
            content="http://pngimg.com/uploads/cursor/cursor_PNG100721.png"
          />
          <meta
            property="og:description"
            content="Online multiplayer Click battle game"
          />
          <meta property="og:url" content="https://click-battle-mp.web.app/" />
          <meta property="og:site_name" content="Click battle" />
          <meta name="twitter:title" content="Click battle" />
          <meta
            name="twitter:description"
            content="Online multiplayer Click battle game"
          />
          <meta
            name="twitter:image"
            content="http://pngimg.com/uploads/cursor/cursor_PNG100721.png"
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
          <AuthProvider>
            <Suspense fallback={<Loading />}>{children}</Suspense>
          </AuthProvider>
        </body>
      </html>
    </I18nProvider>
  );
}
