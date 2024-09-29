import React from "react";
import {AdblockDetector} from "adblock-detector";

import {Button} from "components-new/Button";

import GoogleAdUnit from "./GoogleAdUnit";

export const CardGameAd = () => {
  const adbDetector = new AdblockDetector();

  const userHasAdblock = adbDetector.detect() ?? true;

  if (userHasAdblock) return <></>;

  return (
    <Button variant="card" className="w-64">
      <GoogleAdUnit>
        <ins
          className="adsbygoogle"
          style={{display: "block", height: "120px"}}
          data-ad-format="fluid"
          data-ad-layout-key="-gv-9+1i-2s+2u"
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}
          data-ad-slot="9606023479"
        ></ins>
      </GoogleAdUnit>
    </Button>
  );
};
