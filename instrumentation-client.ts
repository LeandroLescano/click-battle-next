import * as Sentry from "@sentry/nextjs";

const sentryEnabled = process.env.SENTRY_ENABLED === "true";

if (sentryEnabled && !Sentry.isInitialized()) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.5,
    debug: false,
    enabled: true
  });
}

export const onRouterTransitionStart = sentryEnabled
  ? Sentry.captureRouterTransitionStart
  : () => {};
