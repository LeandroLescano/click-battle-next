"use client";

import {createInstance} from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import React, {useEffect, useState} from "react";
import {I18nextProvider as Provider, initReactI18next} from "react-i18next";

import {getOptions} from "./settings";
import enTranslation from "./locales/en/translation.json";
import esTranslation from "./locales/es/translation.json";
import prTranslation from "./locales/pr/translation.json";

const resources = {
  en: {translation: enTranslation},
  es: {translation: esTranslation},
  pr: {translation: prTranslation}
};

const createI18nInstance = (language: string) => {
  const instance = createInstance();

  void instance
    .use(initReactI18next)
    .use(LanguageDetector)
    .init({
      ...getOptions(language),
      resources,
      initImmediate: false,
      interpolation: {
        escapeValue: false
      },
      detection: {
        caches: ["cookie"]
      }
    });

  return instance;
};

interface I18nProviderProps {
  children: React.ReactNode;
  language: string;
}

export function I18nProvider({children, language}: I18nProviderProps) {
  const [instance] = useState(() => createI18nInstance(language));

  useEffect(() => {
    if (instance.resolvedLanguage !== language) {
      void instance.changeLanguage(language);
    }
  }, [instance, language]);

  return <Provider i18n={instance}>{children}</Provider>;
}
