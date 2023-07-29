import { supabase } from "../supabase";
import { MouseEvent } from "react";

const TranslationAuth = () => {
  const handleLogin = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    await supabase.auth
      .signInWithOAuth({
        provider: "discord",
        options: {
          redirectTo: window.location.origin + "/translations"
        }
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
        <h1 className="header">Log in with Discord</h1>

        <button onClick={handleLogin} className="button block full-width">
          Log in
        </button>
      </div>
    </div>
  );
};

export default TranslationAuth;
