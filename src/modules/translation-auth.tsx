import { Button } from "@chakra-ui/react";
import { MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { supabaseSignInWithOAuth } from "../api/supabase";

const TranslationAuth = () => {
  const { t } = useTranslation();

  const handleLogin = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    await supabaseSignInWithOAuth(
      "discord",
      window.location.origin + "/translations",
    )
      .then((data) => {
        console.log(data);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <div className="row flex flex-center">
      <div className="col-6 form-widget">
        <h1 className="header">{t("Log in with Discord")}</h1>

        <Button onClick={handleLogin} className="button block full-width">
          {t("Log in")}
        </Button>
      </div>
    </div>
  );
};

export default TranslationAuth;
