import i18n from "../i18n";

export const geti18nLanguage = (): string => {
  return i18n.resolvedLanguage ?? i18n.languages[0];
};
