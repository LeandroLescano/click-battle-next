// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import {
  init,
  browserTracingIntegration,
  replayIntegration
} from "@sentry/nextjs";

init({
  dsn: "https://f053161aa27398231a93e423095b01b1@o4506887032143872.ingest.us.sentry.io/4506887122976768",

  tracesSampleRate: 0.15,

  debug: false,

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    browserTracingIntegration(),
    replayIntegration({
      maskAllText: false,
      blockAllMedia: false
    })
  ],

  enabled: process.env.NODE_ENV !== "development"
});
