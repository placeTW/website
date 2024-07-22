import { Provider } from "@supabase/supabase-js";
import { supabase } from ".";

export const getSupabaseSession = async () => {
  return supabase.auth.getSession();
}

export const supabaseSignInWithOAuth = async (provider: Provider, redirect: string) => {
  return supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: redirect,
    },
  });
}

export const supabaseSignOut = async () => {
  return supabase.auth.signOut();
}
