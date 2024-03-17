"use client";

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
import "bootstrap/dist/css/bootstrap.css";

import {getApp, getApps, initializeApp} from "firebase/app";

import {connectAuthEmulator, getAuth} from "firebase/auth";
import {connectDatabaseEmulator, getDatabase} from "firebase/database";
import {AuthProvider} from "contexts/AuthContext";
import Loading from "components/Loading";

const firebaseConfig = {
  apiKey: process.env.apiKey,
  authDomain: process.env.authDomain,
  databaseURL: process.env.databaseURL,
  projectId: process.env.projectId,
  storageBucket: process.env.storageBucket,
  messagingSenderId: process.env.messagingSenderId,
  appId: process.env.appId,
  measurementId: process.env.measurementId
};

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
    connectDatabaseEmulator(getDatabase(), "localhost", 9000);
  } catch (error) {
    console.log({error});
  }
}

type Props = {
  children: JSX.Element;
};

export default function Layout({children}: Props) {
  return (
    <html lang="en">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4229101464965146"
          crossOrigin="anonymous"
        ></Script>
        <title>Click Battle</title>
        <meta name="viewport" content="width=device-width, minimum-scale=1" />
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
          rel="stylesheet"
          integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN"
          crossOrigin="anonymous"
        />
        <meta
          name="description"
          content="Online multiplayer Click battle - Challenge your friends to a 10 second click battle!"
        />
        <meta property="og:type" content="article" />
        <meta property="og:title" content="CLICK BATTLE" />
        <meta
          property="og:image"
          content="http://pngimg.com/uploads/cursor/cursor_PNG100721.png"
        />
        <meta
          property="og:description"
          content="Online multiplayer Click battle"
        />
        <meta property="og:url" content="https://click-battle-mp.web.app/" />
        <meta property="og:site_name" content="Click battle" />
        <meta name="twitter:title" content="Click battle" />
        <meta
          name="twitter:description"
          content="Online multiplayer Click battle"
        />
        <meta
          name="twitter:image"
          content="http://pngimg.com/uploads/cursor/cursor_PNG100721.png"
        />
        <meta name="twitter:creator" content="@LeanLescano_" />
        <meta name="author" content="Lescano Leandro Nicolas" />
      </head>
      <body>
        <AuthProvider>
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
