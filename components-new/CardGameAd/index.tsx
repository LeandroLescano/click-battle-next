import {AdblockDetector} from "adblock-detector";
import React from "react";

import {Card} from "components-new/Card";
import {useWindowSize} from "hooks";

import GoogleAdUnit from "./GoogleAdUnit";

export const CardGameAd = () => {
  const {width} = useWindowSize();
  const adbDetector = new AdblockDetector();

  const userHasAdblock = adbDetector.detect() ?? true;

  if (userHasAdblock) return <></>;

  return (
    <Card className="flex min-h-[96px] w-full items-center justify-center overflow-hidden p-0 md:min-h-[124px] md:w-64">
      <GoogleAdUnit>
        {width > 768 ? (
          <ins
            className="adsbygoogle"
            style={{display: "block", width: "100%", height: "120px"}}
            data-ad-format="fluid"
            data-ad-layout-key="-gv-9+1i-2s+2u"
            data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}
            data-ad-slot="9606023479"
          ></ins>
        ) : (
          <ins
            className="adsbygoogle"
            data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}
            style={{
              display: "block",
              width: "149px",
              height: "63px",
              margin: "0 auto"
            }}
            data-ad-slot="4369393021"
          ></ins>
        )}
      </GoogleAdUnit>
    </Card>
  );
};
