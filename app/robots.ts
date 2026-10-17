import type {MetadataRoute} from "next";
import {headers} from "next/headers";

import {SITE_ORIGIN} from "lib/seo/config";
import {getRobotsPolicy} from "lib/seo/robotsPolicy";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host");

  return getRobotsPolicy(host, process.env.VERCEL_ENV, SITE_ORIGIN);
}
