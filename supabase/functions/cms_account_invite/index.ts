import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_ROLES = new Set(["super_admin", "admin", "supervisor", "staff", "customer", "user", "disabled"]);
const ALLOWED_PERMISSIONS = new Set(["none", "read", "read_write"]);
const CMS_MODULES = ["rescue", "schedule", "catalog_tires", "catalog_rims", "orders", "invoices", "customers", "accounts"];

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeRole(value: unknown) {
  const role = normalizeText(value);
  return ALLOWED_ROLES.has(role) ? role : "supervisor";
}

function normalizePermissions(value: unknown) {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return CMS_MODULES.reduce<Record<string, string>>((permissions, module) => {
    const permission = normalizeText(source[module]);
    permissions[module] = ALLOWED_PERMISSIONS.has(permission) ? permission : "none";
    return permissions;
  }, {});
}

async function ensureAccountManager(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    throw new Error("Missing Authorization header");
  }

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) {
    throw new Error("Unauthenticated");
  }

  const { data: canManageAccounts, error: permissionError } = await userClient.rpc("cms_has_permission", {
    p_module: "accounts",
    p_action: "write",
  });

  if (permissionError || canManageAccounts !== true) {
    throw new Error("Forbidden");
  }

  return user;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const actor = await ensureAccountManager(request);
    const body = await request.json().catch(() => ({}));
    const email = normalizeText(body?.email).toLowerCase();
    const role = normalizeRole(body?.role);
    const displayName = normalizeText(body?.displayName);
    const permissions = normalizePermissions(body?.permissions);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ error: "Valid email is required" }, 400);
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const publicSiteUrl = (Deno.env.get("PUBLIC_SITE_URL") || "https://www.mitra-auto.fi").replace(/\/+$/, "");
    const { data: inviteData, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${publicSiteUrl}/cms`,
      data: { display_name: displayName, cms_role: role },
    });

    if (inviteError || !inviteData.user?.id) {
      return jsonResponse({ error: inviteError?.message || "Failed to invite user" }, 400);
    }

    const userId = inviteData.user.id;
    const { error: profileError } = await serviceClient
      .from("profiles")
      .upsert({
        id: userId,
        role,
        display_name: displayName || null,
        cms_permissions: permissions,
        account_status: "active",
        account_hidden: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

    if (profileError) {
      return jsonResponse({ error: profileError.message }, 400);
    }

    await serviceClient.from("cms_account_events").insert({
      target_profile_id: userId,
      actor_id: actor.id,
      event_type: "staff_account_invited",
      details: { email, role },
    });

    return jsonResponse({ ok: true, userId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invite failed";
    const status = message === "Unauthenticated" ? 401 : message === "Forbidden" ? 403 : 400;
    return jsonResponse({ error: message }, status);
  }
});
