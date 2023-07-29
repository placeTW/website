import { Session } from "@supabase/supabase-js";
import { supabase } from "../supabase";
import { useEffect, useState } from "react";
import TranslationFileEditor from "../component/translation/translation-file-editor";
import { officialLocales } from "../i18n";

const TranslationVerification = ({ session }: { session: Session }) => {
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    setVerified(true)
  }, [session]);
  // display the session user id
  return (
    <div className="col-6 form-widget">
      <h1 className="header">
        Logged in as {(session?.user?.identities ?? [])[0].id}
      </h1>
      <button
        onClick={() => supabase.auth.signOut()}
        className="button block full-width"
      >
        Log out
      </button>
      {verified && (
        <TranslationFileEditor filename="translation" editableLangs={officialLocales} />
      )}
    </div>
  );
};

export default TranslationVerification;
