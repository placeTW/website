import { PostgrestSingleResponse } from "@supabase/supabase-js";

const logSupabaseCalls = import.meta.env.LOG_SUPABASE_CALLS ?? false;

export const logSupabaseDatabaseQuery = <T>(
  query: PostgrestSingleResponse<T>,
  queryName: string,
) => {
  if (logSupabaseCalls) {
    console.log(`[SUPABASE LOG] Executing database query ${queryName}`);
  }

  const { data, error } = query;

  if (error && logSupabaseCalls) {
    console.error(
      `[SUPABASE ERROR] database query error ${queryName}: ${error.message}`,
    );
  }

  return { data, error };
};
