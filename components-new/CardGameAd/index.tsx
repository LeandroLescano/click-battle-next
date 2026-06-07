import {AdblockDetector} from "adblock-detector";
import React from "react";

import {Card} from "components-new/Card";
import {useWindowSize} from "hooks";
import {
  AD_LABEL,
  AD_PLACEMENTS,
  ADS_ENABLED,
  ADSENSE_PUBLISHER_ID
} from "lib/ads/placements";

import GoogleAdUnit from "./GoogleAdUnit";

export const CardGameAd = () => {
  const {width} = useWindowSize();
  const adbDetector = new AdblockDetector();
  const placement =
    width > 768
      ? AD_PLACEMENTS.homeRoomsDesktop
      : AD_PLACEMENTS.homeRoomsMobile;

  const userHasAdblock = adbDetector.detect() ?? true;

  if (!ADS_ENABLED || userHasAdblock) return <></>;

  return (
    <Card className="relative flex min-h-[96px] w-full items-center justify-center overflow-hidden border-primary-300/70 bg-primary-100 p-0 pt-4 md:min-h-[124px] md:w-64">
      <span className="absolute left-2 top-1 text-[9px] font-bold uppercase leading-none text-primary-600 md:text-[10px]">
        {AD_LABEL}
      </span>
      <GoogleAdUnit placement={placement}>
        {placement.format === "fluid" ? (
          <ins
            className="adsbygoogle"
            style={{display: "block", width: "100%", height: placement.height}}
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
    </Card>
  );
};
