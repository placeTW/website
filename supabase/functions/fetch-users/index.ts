import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";

console.log("Starting Edge Function...");

serve(async (req) => {
  console.log(`Received request: ${req.method} ${req.url}`);

  // Handle preflight requests for CORS
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request for CORS preflight");
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Max-Age": "86400", // Optional: cache the preflight response for 1 day
      },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Environment variables SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY are not set");
    return new Response(JSON.stringify({ error: "Environment variables are not set" }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  // Fetch users using the new Supabase client method
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error(`Error fetching users: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  console.log("Successfully fetched users");
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
});