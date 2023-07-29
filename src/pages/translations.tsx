import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabase";
import { Session } from "@supabase/supabase-js";

const Translations = () => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
    });

    setLoading(false);
  };

  async function signout() {
    const { error } = await supabase.auth.signOut();
  }

  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      console.log(session?.user?.identities[0].id);
    });
  }, []);

  return (
    <div className="row flex flex-center">
      <div className="col-6 form-widget">
        <h1 className="header">Supabase + React</h1>

        <button onClick={handleLogin} className="button block full-width">
          Log in with Discord
        </button>
        <button onClick={signout} className="button block full-width">
          Log out
        </button>
      </div>
    </div>
  );
};

export default Translations;
