import type {Metadata} from "next";

import {PlayOnlineGuide} from "components-new/PlayOnlineGuide";
import {createRouteMetadata} from "lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createRouteMetadata("playOnline");
}

export default function HowToPlayPage() {
  return <PlayOnlineGuide />;
}
