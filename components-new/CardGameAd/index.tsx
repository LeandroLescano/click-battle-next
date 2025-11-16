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
    <Card className="w-full md:w-64 p-0">
      <GoogleAdUnit>
        {width > 768 ? (
          <ins
            className="adsbygoogle"
            style={{display: "block", height: "120px"}}
            data-ad-format="fluid"
            data-ad-layout-key="-gv-9+1i-2s+2u"
            data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}
            data-ad-slot="9606023479"
          ></ins>
        ) : (
          <ins
            className="adsbygoogle"
            data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}
            style={{display: "inline-block", width: "149px", height: "63px"}}
            data-ad-slot="4369393021"
          ></ins>
        )}
      </GoogleAdUnit>
    </Card>
  );
};
