export const defaultLng = "es";
export const fallbackLng = "en";
export const languages = ["en", "es", "pr"];
export const defaultNS = "translation";

export function getOptions(lng = defaultLng, ns = defaultNS) {
  return {
    // debug: true,
    supportedLngs: languages,
    // preload: languages,
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns
  };
}
