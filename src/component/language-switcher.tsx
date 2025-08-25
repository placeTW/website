import { Select } from "@chakra-ui/react";
import { locales } from "../i18n";
import { useTranslation } from "react-i18next";

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  return (
    <Select
      variant="filled"
      aria-label={t("Language")}
      onChange={(e) => {
        const newLanguage = e.target.value;
        i18n.changeLanguage(newLanguage);
      }}
      defaultValue={i18n.language}
      required
    >
      {Object.entries(locales).map(([language, locale]) => (
        <option key={language} value={language}>
          {locale.displayName}
        </option>
      ))}
    </Select>
  );
};

export default LanguageSwitcher;
