import type {Instrumentation} from "next";

const sentryEnabled = process.env.SENTRY_ENABLED === "true";
let sentryImport: Promise<typeof import("@sentry/nextjs")> | null = null;

const loadSentry = () => {
  sentryImport ??= import("@sentry/nextjs");
  return sentryImport;
};

export async function register() {
  if (!sentryEnabled) {
    return;
  }

  const Sentry = await loadSentry();
  if (Sentry.isInitialized()) {
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

export const onRequestError: Instrumentation.onRequestError = async (
  ...args
) => {
  if (!sentryEnabled) {
    return;
  }

  const Sentry = await loadSentry();
  Sentry.captureRequestError(...args);
};
