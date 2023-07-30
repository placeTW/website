import { useTranslation } from "react-i18next";
import { supabase } from "../supabase";
import { MouseEvent } from "react";
import { Button } from "@chakra-ui/react";

const TranslationAuth = () => {
  const { t } = useTranslation();

  const handleLogin = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    await supabase.auth
      .signInWithOAuth({
        provider: "discord",
        options: {
          redirectTo: window.location.origin + "/translations",
        },
      })
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
