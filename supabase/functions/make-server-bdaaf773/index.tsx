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

// Schema introspection endpoint
app.get("/make-server-bdaaf773/schema", async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get all columns for specified tables/views using raw SQL
    const targets = [
      'products_search',
      'product_cms',
      'catalog_tire_variants',
      'catalog_rim_variants',
      'catalog_supplier_offers',
      'catalog_tires_data',
      'catalog_rims_data'
    ];

    const schema: Record<string, any[]> = {};

    for (const tableName of targets) {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = '${tableName}'
          ORDER BY ordinal_position
        `
      });

      if (!error && data) {
        schema[tableName] = data;
      } else if (error) {
        // Try direct query as fallback
        const { data: sampleData, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!sampleError && sampleData && sampleData.length > 0) {
          // Extract column names from sample data
          schema[tableName] = Object.keys(sampleData[0]).map(col => ({
            column_name: col,
            data_type: typeof sampleData[0][col],
            is_nullable: 'YES',
            column_default: null
          }));
        }
      }
    }

    return c.json({ schema });
  } catch (error) {
    console.error('Schema introspection error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);