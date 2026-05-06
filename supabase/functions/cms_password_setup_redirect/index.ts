import { createClient } from "npm:@supabase/supabase-js@2";

function fallbackSiteUrl() {
  const candidates = [
    Deno.env.get("PUBLIC_SITE_URL"),
    Deno.env.get("SITE_URL"),
    Deno.env.get("BOOKING_SITE_URL"),
  ];

  for (const candidate of candidates) {
    const value = String(candidate ?? "").trim().replace(/\/+$/, "");
    if (value) return value;
  }

  return "https://www.mitra-auto.fi";
}

function passwordRedirectUrl() {
  const explicit = String(Deno.env.get("CMS_PASSWORD_REDIRECT_URL") ?? "").trim();
  if (explicit) return explicit;
  return `${fallbackSiteUrl()}/cms/password-setup`;
}

function redirectWithError(message: string) {
  const url = new URL(passwordRedirectUrl());
  url.hash = new URLSearchParams({
    error: "password_setup_failed",
    error_description: message,
  }).toString();
  return Response.redirect(url.toString(), 303);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  }

  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const tokenHash = url.searchParams.get("token_hash") || "";
    const type = url.searchParams.get("type") === "invite" ? "invite" : "recovery";

    if (!tokenHash) {
      return redirectWithError("Password setup token is missing. Send a new active link.");
    }

    const client = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data, error } = await client.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (error || !data.session) {
      return redirectWithError(error?.message || "Password setup link is invalid or expired.");
    }

    const redirectUrl = new URL(passwordRedirectUrl());
    redirectUrl.hash = new URLSearchParams({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: String(data.session.expires_in ?? 3600),
      expires_at: String(data.session.expires_at ?? ""),
      token_type: data.session.token_type,
      type: "recovery",
    }).toString();

    return Response.redirect(redirectUrl.toString(), 303);
  } catch (error) {
    return redirectWithError(error instanceof Error ? error.message : "Password setup failed.");
  }
});
