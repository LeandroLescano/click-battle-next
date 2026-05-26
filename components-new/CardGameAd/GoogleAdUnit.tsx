"use client";
import {usePathname, useSearchParams} from "next/navigation";
import React, {ReactNode, useEffect, useRef} from "react";

type Props = {
  children: ReactNode;
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const GoogleAdUnit = ({children}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frame = 0;
    let pushed = false;

    const pushAd = () => {
      if (pushed) return true;

      const slot = container.querySelector<HTMLElement>("ins.adsbygoogle");
      if (!slot || slot.dataset.adStatus) return false;

      const containerWidth = container.getBoundingClientRect().width;
      const slotWidth = slot.getBoundingClientRect().width;
      const availableWidth = Math.max(containerWidth, slotWidth);
      const isFluidAd = slot.dataset.adFormat === "fluid";

      if (availableWidth <= 0 || (isFluidAd && availableWidth < 250)) {
        return false;
      }

      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
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

    const observer = new ResizeObserver(schedulePush);
    observer.observe(container);
    observer.observe(
      container.querySelector<HTMLElement>("ins.adsbygoogle") ?? container
    );
    schedulePush();

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [pathname, searchKey]);

  return (
    <div ref={containerRef} className="w-full">
      {children}
    </div>
  );
};

export default GoogleAdUnit;
