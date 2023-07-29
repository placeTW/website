import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import detector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

export const locales = {
  en: { title: "English" },
  zh: { title: "🇹🇼 國語 (臺灣國）" },
};

i18n
  .use(detector)
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    debug: true,

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
