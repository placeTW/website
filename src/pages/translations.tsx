import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { Session } from "@supabase/supabase-js";
import TranslationAuth from "../modules/translation-auth";
import TranslationVerification from "../modules/translation-verification";

const Translations = () => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
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
