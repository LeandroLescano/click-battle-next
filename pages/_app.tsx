import React from "react";
import "../styles/globals.css";
import "../styles/styles.css";
import "../styles/roomGame.css";
import "../styles/index.css";
import "../styles/404.scss";
import "../styles/footer.scss";

import {getApp, getApps, initializeApp} from "firebase/app";

import type {AppProps} from "next/app";
import Script from "next/script";
import Layout from "../components/Layout";
import {connectAuthEmulator, getAuth} from "firebase/auth";
import {connectDatabaseEmulator, getDatabase} from "firebase/database";

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

try {
  connectAuthEmulator(getAuth(), "http://localhost:9099", {
    disableWarnings: true
  });
  connectDatabaseEmulator(getDatabase(), "localhost", 9000);
} catch (error) {
  console.log({error});
}
function MyApp({Component, pageProps}: AppProps) {
  return (
    <Layout>
      <>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.measurementId}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.measurementId}', {
              page_path: window.location.pathname,
            });`}
        </Script>
        <Component {...pageProps} />
      </>
    </Layout>
  );
}
export default MyApp;
