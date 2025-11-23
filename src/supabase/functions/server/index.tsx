import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-bdaaf773/health", (c) => {
  return c.json({ status: "ok" });
});

// Sign Up Endpoint
app.post("/make-server-bdaaf773/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Diagnostic: Check if we can list users (verifies Admin privileges)
    const { error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (listError) {
      console.error("Admin Client Verification Failed:", listError);
      return c.json({ error: "Server Configuration Error: Cannot access admin Auth API. Check SUPABASE_SERVICE_ROLE_KEY." }, 500);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name,
        full_name: name,
        username: email.split('@')[0],
        avatar_url: "",
        website: ""
      },
      email_confirm: true, // Auto-confirm
    });

    if (error) {
      console.error("Supabase Create User Error:", error);
      // Check for common "Database error" which usually implies a broken Trigger on auth.users
      if (error.message.includes("Database error")) {
        return c.json({ 
          error: "CRITICAL DATABASE ERROR: A Postgres Trigger on the 'auth.users' table is crashing. This often happens when a Supabase Starter Kit expects a 'public.profiles' table that doesn't exist. Please go to Supabase Dashboard -> Database -> Triggers and DISABLE the trigger on 'users'." 
        }, 500);
      }
      return c.json({ error: error.message }, 400);
    }

    return c.json(data);
  } catch (err: any) {
    console.error("Signup Error:", err);
    return c.json({ error: err.message || "Internal Server Error" }, 500);
  }
});

Deno.serve(app.fetch);