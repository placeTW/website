import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabase";
import { Session } from "@supabase/supabase-js";
import TranslationAuth from "../modules/translation-auth";
import TranslationVerification from "../modules/translation-verification";

const Translations = () => {
  const { t } = useTranslation();

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
      {!session ? (
        <TranslationAuth />
      ) : (
        <TranslationVerification key={session.user.id} session={session} />
      )}
    </div>
  );
};

export default Translations;
