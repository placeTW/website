import { Session } from "@supabase/supabase-js";
import { supabase } from "../supabase";

const TranslationVerification = ({ session }: { session: Session }) => {
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
    </div>
  );
};

export default TranslationVerification;
