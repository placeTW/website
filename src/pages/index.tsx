import { useTranslation } from "react-i18next";

const HomePage = () => {
  const { t } = useTranslation();
  return <div>{t("Hot gay sex")}</div>;
};

export default HomePage;
