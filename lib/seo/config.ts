export const SITE_NAME = "Click Battle";
export const SITE_AUTHOR = "Lescano Leandro Nicolas";
export const SITE_TWITTER = "@LeanLescano_";
export const SITE_ORIGIN = "https://www.click-battle.com.ar";
export const DEFAULT_SHARE_IMAGE = "/opengraph-image.png";
export const DEFAULT_SHARE_IMAGE_ALT =
  "Click Battle — battle your friends in real-time browser games";
export const DEFAULT_SHARE_IMAGE_HEIGHT = 630;
export const DEFAULT_SHARE_IMAGE_WIDTH = 1200;

export const absoluteUrl = (path = "/") =>
  new URL(path, SITE_ORIGIN).toString();
