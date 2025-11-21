// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const {withSentryConfig} = require("@sentry/nextjs");

/* eslint-disable no-undef */
/** @type {import('next').NextConfig} */
module.exports = {
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

// Injected content via Sentry wizard below

module.exports = withSentryConfig(
  module.exports,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,
    org: "leandro-lescano",
    project: "click-battle"
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: true,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
    tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors.
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true
  }
);
