import { Select } from "@chakra-ui/react";
import { locales } from "../i18n";
import { useTranslation } from "react-i18next";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  return (
    <Select
      variant="filled"
      aria-label="Language"
      onChange={(e) => {
        const newLanguage = e.target.value;
        i18n.changeLanguage(newLanguage);
      }}
      defaultValue={i18n.language}
      required
    >
      {Object.entries(locales).map(([language, locale]) => (
        <option key={language} value={language}>
          {locale.title}
        </option>
      ))}
    </Select>
  );
};

export default LanguageSwitcher;
