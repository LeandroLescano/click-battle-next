import {AdblockDetector} from "adblock-detector";
import React, {memo} from "react";

import {
  AD_LABEL,
  AD_PLACEMENTS,
  ADS_ENABLED,
  ADSENSE_PUBLISHER_ID
} from "lib/ads/placements";

import GoogleAdUnit from "./GoogleAdUnit";

export const CardGameAd = memo(() => {
  const adbDetector = new AdblockDetector();
  const placement = AD_PLACEMENTS.homeRoomsDesktop;

  const userHasAdblock = adbDetector.detect() ?? true;

  if (!ADS_ENABLED || userHasAdblock) return <></>;

  return (
    <div className="col col-card mb-3">
      <div className="card card-room shadow-sm position-relative pt-4">
        <span className="position-absolute top-0 start-0 ms-2 mt-1 small text-uppercase">
          {AD_LABEL}
        </span>
        <GoogleAdUnit placement={placement}>
          <ins
            className="adsbygoogle"
            style={{display: "block", width: "100%", height: placement.height}}
            data-ad-format="fluid"
            data-ad-layout-key={placement.layoutKey}
            data-ad-client={ADSENSE_PUBLISHER_ID}
            data-ad-slot={placement.slot}
          ></ins>
        </GoogleAdUnit>
      </div>
    </div>
  );
});

CardGameAd.displayName = "CardGameAd";
