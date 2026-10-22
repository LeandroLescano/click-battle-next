import {createInstance} from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import {cookies as getCookies} from "next/headers";
import {cache} from "react";
import {initReactI18next} from "react-i18next/initReactI18next";
import "server-only";

import {defaultLng, getOptions, languages} from "./settings";

const initServerI18next = async (language: string, ns: string | string[]) => {
  const i18nInstance = createInstance();
  await i18nInstance
    .use(initReactI18next)
    .use(
      resourcesToBackend(
        (language: string, ns: string) =>
          import(`./locales/${language}/${ns}.json`)
      )
    )
    .init(getOptions(language, Array.isArray(ns) ? ns[0] : ns));
  return i18nInstance;
};

const cookieName = "i18next";

export async function detectLanguage() {
  const cookies = await getCookies();

  // here we can read the session data
  // const session = await getSession();

  const preferredLanguage = cookies.get(cookieName)?.value;
  return preferredLanguage && languages.includes(preferredLanguage)
    ? preferredLanguage
    : defaultLng;
}

export const getServerTranslations = cache(
  async (ns: string | string[], options: Record<string, string> = {}) => {
    const language = await detectLanguage();
    const i18nextInstance = await initServerI18next(language, ns);
    return {
      t: i18nextInstance.getFixedT(
        language,
        Array.isArray(ns) ? ns[0] : ns,
        options.keyPrefix
      ),
      i18n: i18nextInstance
    };
  }
);
