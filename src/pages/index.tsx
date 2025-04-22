import { useTranslation } from "react-i18next";

const HomePage = () => {
  const { t } = useTranslation();
  return <div>{t("lorem ipsum")}</div>;
};

export default HomePage;
