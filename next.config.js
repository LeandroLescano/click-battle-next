// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const {withSentryConfig} = require("@sentry/nextjs");

/* eslint-disable no-undef */
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true
  },
  env: {
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    databaseURL: process.env.DATABASE_URL,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID,
    measurementId: process.env.MEASUREMENT_ID,
    REACT_APP_EMAIL: process.env.REACT_APP_EMAIL,
    REACT_APP_PASSWORD: process.env.REACT_APP_PASSWORD,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    PRIVATE_KEY: process.env.PRIVATE_KEY,
    CLIENT_EMAIL: process.env.CLIENT_EMAIL,
    NEXT_PUBLIC_ADSENSE_PUBLISHER_ID:
      process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID,
    SENTRY_DSN: process.env.SENTRY_DSN
  }
};

const sentryEnabled = process.env.SENTRY_ENABLED === "true";

module.exports = sentryEnabled
  ? withSentryConfig(
      nextConfig,
      {
        silent: true,
        org: "leandro-lescano",
        project: "click-battle"
      },
      {
        widenClientFileUpload: true,
        transpileClientSDK: true,
        tunnelRoute: "/monitoring",
        hideSourceMaps: true,
        disableLogger: true,
        automaticVercelMonitors: true
      }
    )
  : nextConfig;
