"use client";

import {AdblockDetector} from "adblock-detector";
import React, {useEffect, useState} from "react";

import {Card} from "components-new/Card";
import GoogleAdUnit from "components-new/CardGameAd/GoogleAdUnit";
import {useWindowSize} from "hooks";
import {
  AD_LABEL,
  AD_PLACEMENTS,
  ADS_ENABLED,
  ADSENSE_PUBLISHER_ID
} from "lib/ads/placements";

export const RankingAd = () => {
  const [hasMounted, setHasMounted] = useState(false);
  const {width} = useWindowSize();
  const placement =
    width > 768
      ? AD_PLACEMENTS.rankingBottomDesktop
      : AD_PLACEMENTS.rankingBottomMobile;

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  const adbDetector = new AdblockDetector();
  const userHasAdblock = adbDetector.detect() ?? true;
  const shouldRenderAd = ADS_ENABLED && !userHasAdblock;

  return (
    <Card className="relative mx-auto mt-1 flex min-h-[96px] w-[180px] shrink-0 self-start items-center justify-center overflow-hidden border-primary-300/70 bg-primary-100 p-0 pt-4 md:mt-0 md:min-h-[132px] md:w-[420px] md:pt-5 xl:mx-0 xl:mt-14 xl:w-72 2xl:mt-0">
      <span className="absolute left-2 top-1 text-[9px] font-bold uppercase leading-none text-primary-600 md:text-[10px]">
        {AD_LABEL}
      </span>
      {shouldRenderAd ? (
        <GoogleAdUnit placement={placement}>
          {placement.format === "fluid" ? (
            <ins
              className="adsbygoogle"
              style={{
                display: "block",
                width: "100%",
                height: placement.height
              }}
              data-ad-format="fluid"
              data-ad-layout-key={placement.layoutKey}
              data-ad-client={ADSENSE_PUBLISHER_ID}
              data-ad-slot={placement.slot}
            ></ins>
          ) : (
            <ins
              className="adsbygoogle"
              data-ad-client={ADSENSE_PUBLISHER_ID}
              style={{
                display: "block",
                width: placement.width,
                height: placement.height,
                margin: "0 auto"
              }}
              data-ad-slot={placement.slot}
            ></ins>
          )}
        </GoogleAdUnit>
      ) : (
        <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs font-bold uppercase tracking-normal text-primary-500/80 md:text-sm">
          {userHasAdblock ? "Ad blocked" : "Ad slot"}
        </div>
      )}
    </Card>
  );
};
