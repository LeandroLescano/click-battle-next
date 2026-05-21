import * as Sentry from "@sentry/nextjs";

const sentryEnabled = process.env.SENTRY_ENABLED === "true";

export async function register() {
  if (!sentryEnabled) {
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.5,
    profilesSampleRate: 0.3,
    debug: false,
    enabled: true
  });
}

export const onRequestError = sentryEnabled
  ? Sentry.captureRequestError
  : undefined;
