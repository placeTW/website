import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const SUPABASE_FUNCTIONS_URL = `${supabaseUrl}/functions/v1`;

// Export from the other supabase files
export * from "./auth";
export * from "./database";
