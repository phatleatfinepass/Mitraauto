// supabase/functions/refresh_rd_token_db/index.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.4";
serve(async ()=>{
  try {
    const RD_AUTH_URL = Deno.env.get("RD_AUTH_URL");
    const RD_USERNAME = Deno.env.get("RD_USERNAME");
    const RD_PASSWORD = Deno.env.get("RD_PASSWORD");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!RD_AUTH_URL || !RD_USERNAME || !RD_PASSWORD || !SUPABASE_URL || !SERVICE_KEY) {
      return new Response(JSON.stringify({
        ok: false,
        step: "env_check",
        error: "RD_AUTH_URL, RD_USERNAME, RD_PASSWORD, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY must be set",
        has: {
          RD_AUTH_URL: !!RD_AUTH_URL,
          RD_USERNAME: !!RD_USERNAME,
          RD_PASSWORD: !!RD_PASSWORD,
          SUPABASE_URL: !!SUPABASE_URL,
          SERVICE_KEY: !!SERVICE_KEY
        }
      }, null, 2), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    // 1) Use RD_AUTH_URL exactly as the token endpoint
    const tokenUrl = RD_AUTH_URL;
    const body = new URLSearchParams({
      grant_type: "password",
      username: RD_USERNAME,
      password: RD_PASSWORD
    });
    console.log("[refresh_rd_token_db] requesting token from", tokenUrl);
    const resp = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    });
    if (!resp.ok) {
      const errorText = await resp.text().catch(()=>"<no body>");
      console.error("[refresh_rd_token_db] token request failed", {
        status: resp.status,
        tokenUrl,
        errorText
      });
      return new Response(JSON.stringify({
        ok: false,
        step: "fetch_token",
        status: resp.status,
        tokenUrl,
        errorText
      }, null, 2), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const data = await resp.json();
    const token = data.access_token;
    console.log("[TEST] New RD token fetched:", {
      preview: token.length > 20 ? token.slice(0, 10) + "..." + token.slice(-10) : token,
      issuedRaw: data[".issued"],
      expiresRaw: data[".expires"]
    });
    if (!token) {
      console.error("[refresh_rd_token_db] missing access_token", data);
      return new Response(JSON.stringify({
        ok: false,
        step: "parse_token",
        error: "No access_token in response",
        raw: data
      }, null, 2), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const issuedStr = data[".issued"];
    const expiresStr = data[".expires"];
    const issued_at = issuedStr ? new Date(issuedStr).toISOString() : new Date().toISOString();
    const expires_at = expiresStr ? new Date(expiresStr).toISOString() : null;
    console.log("[TEST] Normalized timestamps:", { issued_at, expires_at });
    // 2) Write token into public.supplier_tokens
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { error: upsertError } = await supabase.from("supplier_tokens").upsert({
      supplier_code: "RD",
      access_token: token,
      issued_at,
      expires_at
    }, {
      onConflict: "supplier_code"
    });
    if (upsertError) {
      console.error("[refresh_rd_token_db] upsert error", upsertError);
      return new Response(JSON.stringify({
        ok: false,
        step: "upsert_token",
        error: upsertError.message,
        details: upsertError.details,
        hint: upsertError.hint
      }, null, 2), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const preview = token.length > 20 ? token.slice(0, 10) + "..." + token.slice(-10) : token;
    console.log("[TEST] DB upsert complete — ready for cron verification");
    return new Response(JSON.stringify({
      ok: true,
      supplier: "RD",
      tokenLength: token.length,
      tokenPreview: preview,
      tokenUrl,
      issued_at,
      expires_at,
      updatedAt: new Date().toISOString()
    }, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("[refresh_rd_token_db] unexpected error", err);
    return new Response(JSON.stringify({
      ok: false,
      step: "unexpected",
      error: String(err)
    }, null, 2), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
});
