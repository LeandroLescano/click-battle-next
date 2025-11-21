import {init} from "@sentry/nextjs";

export function register() {
  init({
    dsn: process.env.SENTRY_DSN,

    tracesSampleRate: 0.5,

    profilesSampleRate: 0.3,

    debug: false,

    enabled: process.env.NODE_ENV !== "development"
  });
}
