import { AuthChangeEvent, Provider, Session } from "@supabase/supabase-js";
import { supabase } from ".";

export const authGetSession = async () => {
  return supabase.auth.getSession();
};

export const authGetUser = () => {
  return supabase.auth.getUser();
};

export const authSignInWithOAuth = async (
  provider: Provider,
  redirect: string,
) => {
  return supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: redirect,
    },
  });
};

export const authSignOut = async () => {
  return supabase.auth.signOut();
};

export const authOnAuthStateChange = (
  callback: (
    event: AuthChangeEvent,
    session: Session | null,
  ) => void | Promise<void>,
) => {
  return supabase.auth.onAuthStateChange(callback);
};
