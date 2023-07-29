import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import detector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

export interface Locale {
  displayName: string;
  en: string;
  zh: string;
  default: boolean;
}

export const locales = {
  en: {
    displayName: "English",
    en: "English",
    zh: "英文",
    default: true,
  } as Locale,
  zh: {
    displayName: "🇹🇼 國語 (臺灣國）",
    en: "Taiwanese Mandarin",
    zh: "臺灣國語",
    default: false,
  } as Locale,
  fr: {
    displayName: "Français",
    en: "French",
    zh: "法文",
    default: false,
  } as Locale,
  lv: {
    displayName: "Latviešu",
    en: "Latvian",
    zh: "拉脫維亞語",
    default: false,
  } as Locale,
  et: {
    displayName: "Eesti",
    en: "Estonian",
    zh: "愛沙尼亞語",
    default: false,
  } as Locale,
};
export const officialLocales = ["en", "zh"];

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
    load: "languageOnly",
  });

export default i18n;
