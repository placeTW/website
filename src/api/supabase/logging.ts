import { PostgrestSingleResponse } from "@supabase/supabase-js";

const logSupabaseCalls = import.meta.env.VITE_LOG_SUPABASE_CALLS ?? false;

export const logSupabaseDatabaseQuery = <T>(
  query: PostgrestSingleResponse<T>,
  queryName: string,
) => {
  if (logSupabaseCalls) {
    const error = new Error();
    Error.stackTraceLimit = 20; // Increase this limit if you want more stack trace levels
    const stack = error.stack?.split("\n").slice(2).join("\n"); // Adjust slice to skip more/less lines
    console.log(
      `[SUPABASE LOG] Executing database query ${queryName} at ${stack}`,
    );
  }

  const { data, error } = query;

  if (error && logSupabaseCalls) {
    console.error(
      `[SUPABASE ERROR] database query error ${queryName}: ${error.message}`,
    );
  }

  return { data, error };
};

export const logSupabaseFetch = (response: Response, functionName: string) => {
  if (logSupabaseCalls) {
    const error = new Error();
    Error.stackTraceLimit = 20; // Increase this limit if you want more stack trace levels
    const stack = error.stack?.split("\n").slice(2).join("\n"); // Adjust slice to skip more/less lines
    console.log(`[SUPABASE LOG] Executing fetch ${functionName} at ${stack}`);
  }

  return response;
};
