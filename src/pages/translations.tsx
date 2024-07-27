import { useEffect, useState } from "react";
import { authGetSession, authOnAuthStateChange } from "../api/supabase";
import { Session } from "@supabase/supabase-js";
import TranslationAuth from "../modules/translation-auth";
import TranslationVerification from "../modules/translation-verification";

const Translations = () => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    authGetSession().then(({ data: { session } }) => {
      setSession(session);
    });

    authOnAuthStateChange((_event, session) => {
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
