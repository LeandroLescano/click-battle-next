import type {Metadata} from "next";

import {getServerTranslations} from "i18n/server";
import {
  absoluteUrl,
  DEFAULT_SHARE_IMAGE,
  DEFAULT_SHARE_IMAGE_ALT,
  DEFAULT_SHARE_IMAGE_HEIGHT,
  DEFAULT_SHARE_IMAGE_WIDTH,
  SITE_AUTHOR,
  SITE_NAME,
  SITE_ORIGIN,
  SITE_TWITTER
} from "lib/seo/config";
import {SEO_ROUTES, SeoRouteKey} from "lib/seo/routes";

const DEFAULT_IMAGE = absoluteUrl(DEFAULT_SHARE_IMAGE);

const OPEN_GRAPH_LOCALES: Record<string, string> = {
  en: "en_US",
  es: "es_AR",
  pr: "pt_BR"
};

const resolveTitle = (title: string) =>
  title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;

const getLocalizedSeo = async () => {
  const {t, i18n} = await getServerTranslations("translation");
  const language = i18n.resolvedLanguage ?? i18n.language ?? "en";

  return {
    locale: OPEN_GRAPH_LOCALES[language] ?? OPEN_GRAPH_LOCALES.en,
    translate: (value: string) => t(value)
  };
};

const createOpenGraphImage = () => ({
  url: DEFAULT_IMAGE,
  alt: DEFAULT_SHARE_IMAGE_ALT,
  width: DEFAULT_SHARE_IMAGE_WIDTH,
  height: DEFAULT_SHARE_IMAGE_HEIGHT,
  type: "image/png"
});

export const createRootMetadata = async (): Promise<Metadata> => {
  const {locale, translate} = await getLocalizedSeo();
  const description = translate(SEO_ROUTES.home.description);

  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`
    },
    applicationName: SITE_NAME,
    authors: [{name: SITE_AUTHOR}],
    alternates: {
      canonical: absoluteUrl("/")
    },
    description,
    openGraph: {
      type: "website",
      locale,
      siteName: SITE_NAME,
      title: SITE_NAME,
      description,
      url: absoluteUrl("/"),
      images: [createOpenGraphImage()]
    },
    twitter: {
      card: "summary_large_image",
      creator: SITE_TWITTER,
      title: SITE_NAME,
      description,
      images: [DEFAULT_IMAGE]
    }
  };
};

export const createRouteMetadata = async (
  routeKey: SeoRouteKey
): Promise<Metadata> => {
  const {locale, translate} = await getLocalizedSeo();
  const route = SEO_ROUTES[routeKey];
  const canonical = absoluteUrl(route.canonicalPath);
  const routeTitle = translate(route.title);
  const description = translate(route.description);
  const title = route.fullTitle
    ? translate(route.fullTitle)
    : resolveTitle(routeTitle);

  return {
    title: route.fullTitle ? {absolute: title} : routeTitle,
    description,
    alternates: {
      canonical
    },
    openGraph: {
      type: "website",
      locale,
      siteName: SITE_NAME,
      title,
      description,
      url: canonical,
      images: [createOpenGraphImage()]
    },
    robots: route.index
      ? {
          index: true,
          follow: true
        }
      : {
          index: false,
          follow: route.follow ?? false
        },
    twitter: {
      card: "summary_large_image",
      creator: SITE_TWITTER,
      title,
      description,
      images: [DEFAULT_IMAGE]
    }
  };
};
