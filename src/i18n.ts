import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";

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
  lt: {
    displayName: "Lietuvių",
    en: "Lithuanian",
    zh: "立陶宛語",
    default: false,
  } as Locale,
  et: {
    displayName: "Eesti",
    en: "Estonian",
    zh: "愛沙尼亞語",
    default: false,
  } as Locale,
  cz: {
    displayName: "Čeština",
    en: "Czech",
    zh: "捷克語",
    default: false,
  },
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
  es: {
    displayName: "Español",
    en: "Spanish",
    zh: "西班牙語",
    default: false,
  } as Locale,
  ua: {
    displayName: "Українська",
    en: "Ukrainian",
    zh: "烏克蘭語",
    default: false,
  } as Locale,
};
export const officialLocales = ["en", "zh"];

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    debug: false,

    interpolation: {
      escapeValue: false,
    },
    load: "languageOnly",
    returnEmptyString: false,
    backend: {
      loadPath: `${import.meta.env?.VITE_CODE_SERVER ? '/absproxy/5173' : ''}/locales/{{lng}}/{{ns}}.json`,
    }
  });

export default i18n;
