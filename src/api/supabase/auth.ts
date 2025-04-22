import { AuthChangeEvent, Provider, Session } from "@supabase/supabase-js";
import { supabase } from ".";
const logSupabaseCalls = import.meta.env.VITE_LOG_SUPABASE_CALLS ?? false; // Define the logging flag

export const authGetSession = async () => {
  const response = await supabase.auth.getSession();

  if (logSupabaseCalls) {
    console.log(`[SUPABASE LOG] authGetSession called. Response:`, response);
  }

  if (response.error) {
    console.error("Error fetching session:", response.error.message);
    throw new Error(response.error.message);
  }

  return response;
};

export const authGetUser = async () => {
  const response = await supabase.auth.getUser();

  if (logSupabaseCalls) {
    console.log(`[SUPABASE LOG] authGetUser called. Response:`, response);
  }

  if (response.error) {
    console.error("Error fetching user:", response.error.message);
    throw new Error(response.error.message);
  }

  return response;
};

export const authSignInWithOAuth = async (
  provider: Provider,
  redirect: string
) => {
  const response = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: redirect,
    },
  });

  if (logSupabaseCalls) {
    console.log(`[SUPABASE LOG] authSignInWithOAuth called. Response:`, response);
  }

  if (response.error) {
    console.error("Error signing in with OAuth:", response.error.message);
    throw new Error(response.error.message);
  }

  return response;
};

export const authSignOut = async () => {
  const response = await supabase.auth.signOut();

  if (logSupabaseCalls) {
    console.log(`[SUPABASE LOG] authSignOut called. Response:`, response);
  }

  if (response.error) {
    console.error("Error signing out:", response.error.message);
    throw new Error(response.error.message);
  }

  return response;
};

export const authOnAuthStateChange = (
  callback: (event: AuthChangeEvent, session: Session | null) => void | Promise<void>
) => {
  const { data: subscription } = supabase.auth.onAuthStateChange(callback);

  if (logSupabaseCalls) {
    console.log(`[SUPABASE LOG] Subscribing to auth state changes.`);
  }

  return subscription;
};
