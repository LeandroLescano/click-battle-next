// observability/sentry.ts
import {metrics} from "@sentry/nextjs";
import {addBreadcrumb, startInactiveSpan, startSpan} from "@sentry/react";

const DEFAULT_TAGS = {
  platform: "web",
  env: process.env.NODE_ENV
};

export function withSpan<T>(name: string, fn: () => T) {
  const span = startInactiveSpan({name});

  try {
    return fn();
  } finally {
    span?.end();
  }
}

export function withSpanMin<T>(
  name: string,
  minDurationMs: number,
  callback: () => T
) {
  const start = performance.now();

  return startSpan({name}, (span) => {
    const result = callback();
    const duration = performance.now() - start;

    if (span) {
      if (duration < minDurationMs) {
        span.updateName(`discarded:${name}`);
        span.end();
      } else {
        span.setAttribute("duration_ms", duration);
        span.end();
      }
    }

    return result;
  });
}

export function breadcrumb(
  category: string,
  message: string,
  data: {[key: string]: unknown} | undefined = {}
) {
  addBreadcrumb({
    category,
    message,
    data,
    level: "info"
  });
}

const breadcrumbCache = new Map<string, number>();

export function breadcrumbOnce(
  category: string,
  message: string,
  data?: Record<string, unknown>,
  minIntervalMs = 500
) {
  const key = `${category}:${message}`;
  const now = performance.now();
  const last = breadcrumbCache.get(key) ?? 0;

  if (now - last < minIntervalMs) {
    return;
  }

  breadcrumbCache.set(key, now);

  addBreadcrumb({
    category,
    message,
    data
  });
}

export function metricCounter(
  name: string,
  value: number = 1,
  tags?: Record<string, string | number | boolean>
) {
  metrics.increment(name, value, {
    tags: {...DEFAULT_TAGS, ...tags}
  });
}

export function metricGauge(
  name: string,
  value: number,
  tags?: Record<string, string | number | boolean>,
  sampleRate: number = 1.0
) {
  if (sampleRate < 1.0 && Math.random() > sampleRate) return;

  metrics.set(name, value, {
    tags: {...DEFAULT_TAGS, ...tags}
  });
}

export function metricTiming(
  name: string,
  value: number,
  tags?: Record<string, string | number | boolean>,
  sampleRate: number = 1.0
) {
  if (sampleRate < 1.0 && Math.random() > sampleRate) return;

  metrics.distribution(name, value, {
    tags: {...DEFAULT_TAGS, ...tags},
    unit: "millisecond"
  });
}
