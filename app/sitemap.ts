import type {MetadataRoute} from "next";

import {absoluteUrl} from "lib/seo/config";
import {INDEXABLE_ROUTE_KEYS, SEO_ROUTES} from "lib/seo/routes";

export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXABLE_ROUTE_KEYS.map((routeKey) => {
    const route = SEO_ROUTES[routeKey];

    return {
      url: absoluteUrl(route.canonicalPath),
      changeFrequency: route.changeFrequency,
      priority: route.priority
    };
  });
}
