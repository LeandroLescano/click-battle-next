"use client";
import {usePathname, useSearchParams} from "next/navigation";
import React, {ReactNode, useEffect, useRef} from "react";

import {ADS_ENABLED, AdPlacement} from "lib/ads/placements";
import {trackAdLifecycle} from "lib/ads/tracking";

type Props = {
  children: ReactNode;
  placement: AdPlacement;
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const GoogleAdUnit = ({children, placement}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  useEffect(() => {
    if (!ADS_ENABLED) return;

    const container = containerRef.current;
    if (!container) return;

    let frame = 0;
    let pushed = false;
    const trackedEvents = new Set<string>();

    const trackOnce = (
      event: Parameters<typeof trackAdLifecycle>[1],
      data?: Parameters<typeof trackAdLifecycle>[2]
    ) => {
      if (trackedEvents.has(event)) return;
      trackedEvents.add(event);
      trackAdLifecycle(placement, event, data);
    };

    const pushAd = () => {
      if (pushed) return true;

      const slot = container.querySelector<HTMLElement>("ins.adsbygoogle");
      if (!slot || slot.dataset.adStatus) return false;

      const containerWidth = container.getBoundingClientRect().width;
      const slotWidth = slot.getBoundingClientRect().width;
      const availableWidth = Math.max(containerWidth, slotWidth);

      if (availableWidth < placement.minWidth) {
        trackOnce("hidden_by_size", {availableWidth});
        return false;
      }

      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        trackOnce("push", {availableWidth});
      } catch (err) {
        trackOnce("push_error", {availableWidth});
        console.error(err);
      }

      pushed = true;
      return true;
    };

    const schedulePush = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (pushAd()) observer.disconnect();
      });
    };

    trackOnce("rendered");

    const slot = container.querySelector<HTMLElement>("ins.adsbygoogle");
    const observer = new ResizeObserver(schedulePush);
    observer.observe(container);
    if (slot) observer.observe(slot);

    const mutationObserver = new MutationObserver(() => {
      if (slot?.dataset.adStatus === "filled") {
        trackOnce("filled");
      }

      if (slot?.dataset.adStatus === "unfilled") {
        trackOnce("unfilled");
      }
    });

    if (slot) {
      mutationObserver.observe(slot, {
        attributeFilter: ["data-ad-status"],
        attributes: true
      });
    }

    schedulePush();

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [pathname, placement, searchKey]);

  if (!ADS_ENABLED) return null;

  return (
    <div
      ref={containerRef}
      className="google-ad-unit w-full"
      data-ad-placement={placement.id}
    >
      {children}
    </div>
  );
};

export default GoogleAdUnit;
