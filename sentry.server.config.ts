// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://f053161aa27398231a93e423095b01b1@o4506887032143872.ingest.us.sentry.io/4506887122976768",

  tracesSampleRate: 0.5,

  profilesSampleRate: 0.3,

  debug: false,

  enabled: process.env.NODE_ENV !== "development"
});
