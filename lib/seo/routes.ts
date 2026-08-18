import type {MetadataRoute} from "next";

export type SeoRouteKey =
  | "home"
  | "playOnline"
  | "ranking"
  | "privacyPolicy"
  | "termsOfService"
  | "admin"
  | "gameRoom";

type ChangeFrequency = NonNullable<
  MetadataRoute.Sitemap[number]["changeFrequency"]
>;

export type SeoRouteDefinition = {
  canonicalPath: string;
  changeFrequency?: ChangeFrequency;
  description: string;
  fullTitle?: string;
  follow?: boolean;
  index: boolean;
  path: string;
  priority?: number;
  title: string;
};

export const SEO_ROUTES: Record<SeoRouteKey, SeoRouteDefinition> = {
  home: {
    path: "/",
    canonicalPath: "/",
    title: "Play online",
    fullTitle: "Click Battle | Play online",
    description:
      "Create a room, invite friends, and play real-time click battles or reaction rounds in your browser.",
    index: true,
    priority: 1,
    changeFrequency: "daily"
  },
  playOnline: {
    path: "/how-to-play",
    canonicalPath: "/how-to-play",
    title: "How to play",
    description:
      "Learn how Click Battle rooms, game modes, and rankings work before jumping into a match with friends.",
    index: true,
    priority: 0.7,
    changeFrequency: "weekly"
  },
  ranking: {
    path: "/ranking",
    canonicalPath: "/ranking",
    title: "Click Battle rankings",
    description:
      "See the fastest clickers and best reaction times across Click Battle game modes.",
    index: true,
    priority: 0.8,
    changeFrequency: "hourly"
  },
  privacyPolicy: {
    path: "/about/privacy-policy",
    canonicalPath: "/about/privacy-policy",
    title: "Privacy Policy",
    description:
      "Read how Click Battle handles accounts, gameplay data, browser storage, and support communication.",
    index: true,
    priority: 0.4,
    changeFrequency: "yearly"
  },
  termsOfService: {
    path: "/about/terms-of-service",
    canonicalPath: "/about/terms-of-service",
    title: "Terms of Service",
    description:
      "Review the rules, fair play expectations, and service terms for playing Click Battle.",
    index: true,
    priority: 0.4,
    changeFrequency: "yearly"
  },
  admin: {
    path: "/admin",
    canonicalPath: "/admin",
    title: "Admin analytics",
    description: "Internal Click Battle analytics dashboard.",
    index: false,
    follow: false
  },
  gameRoom: {
    path: "/game/[gameID]",
    canonicalPath: "/",
    title: "Join a Click Battle room",
    description:
      "Join an active Click Battle room or return to the home lobby to create your own challenge.",
    index: false,
    follow: true
  }
};

export const INDEXABLE_ROUTE_KEYS: SeoRouteKey[] = [
  "home",
  "playOnline",
  "ranking",
  "privacyPolicy",
  "termsOfService"
];
