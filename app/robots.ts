import type {MetadataRoute} from "next";
import {headers} from "next/headers";

import {absoluteUrl, SITE_ORIGIN} from "lib/seo/config";

const isPublicSiteHost = (host: string | null) => {
  const publicHost = new URL(SITE_ORIGIN).host;

  return host?.split(":")[0] === publicHost;
};

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host");

  if (!isPublicSiteHost(host)) {
    return {
      rules: {
        userAgent: "*",
        // Preview deployments carry X-Robots-Tag: noindex on every response.
        // Crawlers must be allowed to fetch those responses to see it.
        ...(process.env.VERCEL_ENV === "preview"
          ? {allow: "/"}
          : {disallow: "/"})
      }
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/admin"
      }
    ],
    sitemap: absoluteUrl("/sitemap.xml")
  };
}
