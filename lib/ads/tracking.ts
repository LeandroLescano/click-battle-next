import {getAnalytics, logEvent} from "firebase/analytics";

import {breadcrumb, metricCounter} from "observability/sentry";

import {AdPlacement} from "./placements";

export type AdLifecycleEvent =
  | "filled"
  | "hidden_by_size"
  | "push"
  | "push_error"
  | "rendered"
  | "unfilled";

type AdLifecycleData = {
  availableWidth?: number;
};

export const trackAdLifecycle = (
  placement: AdPlacement,
  event: AdLifecycleEvent,
  data: AdLifecycleData = {}
) => {
  if (typeof window === "undefined") return;

  const eventData = {
    adPlacement: placement.id,
    adFormat: placement.format,
    ...data
  };

  breadcrumb("ads", `ad_${event}`, eventData);
  metricCounter("ad_slot_lifecycle", undefined, {
    ad_placement: placement.id,
    ad_event: event,
    ad_format: placement.format
  });

  try {
    logEvent(getAnalytics(), "ad_slot_lifecycle", eventData);
  } catch {
    // Analytics can be unavailable in test/dev contexts; ads should not care.
  }
};
