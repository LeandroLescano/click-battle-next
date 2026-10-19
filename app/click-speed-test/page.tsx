import type {Metadata} from "next";

import {ClickSpeedTest} from "components-new/ClickSpeedTest";
import {ClickSpeedTestGuide} from "components-new/ClickSpeedTest/Guide";
import {createRouteMetadata} from "lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createRouteMetadata("clickSpeedTest");
}

export default function ClickSpeedTestPage() {
  return (
    <div className="cst-page">
      <ClickSpeedTest />
      <ClickSpeedTestGuide />
    </div>
  );
}
