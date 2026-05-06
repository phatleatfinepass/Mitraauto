import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

async function ensureAccountManager(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) throw new Error("Unauthenticated");

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) throw new Error("Unauthenticated");

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
    const action = normalizeText(body?.action);
    const targetProfileId = normalizeText(body?.targetProfileId);

    if (action !== "delete") {
      return jsonResponse({ error: "Unsupported account action" }, 400);
    }

    if (!targetProfileId) {
      return jsonResponse({ error: "Target profile is required" }, 400);
    }

    if (targetProfileId === actor.id) {
      return jsonResponse({ error: "You cannot delete your own account" }, 400);
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data: targetProfile, error: profileError } = await serviceClient
      .from("profiles")
      .select("id, role, account_status, display_name")
      .eq("id", targetProfileId)
      .maybeSingle();

    if (profileError) {
      return jsonResponse({ error: profileError.message }, 400);
    }

    if (!targetProfile?.id) {
      return jsonResponse({ error: "Target account profile not found" }, 404);
    }

    if (targetProfile.role === "super_admin") {
      const { data: actorProfile, error: actorProfileError } = await serviceClient
        .from("profiles")
        .select("role, account_status")
        .eq("id", actor.id)
        .maybeSingle();

      if (actorProfileError) {
        return jsonResponse({ error: actorProfileError.message }, 400);
      }

      if (actorProfile?.role !== "super_admin" || actorProfile?.account_status !== "active") {
        return jsonResponse({ error: "Only active super admin can delete another super admin account" }, 403);
      }
    }

    const { error: updateError } = await serviceClient
      .from("profiles")
      .update({
        role: "disabled",
        account_status: "deleted",
        account_hidden: true,
        cms_permissions: {},
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetProfileId);

    if (updateError) {
      return jsonResponse({ error: updateError.message }, 400);
    }

    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(targetProfileId);
    if (deleteError) {
      await serviceClient.from("cms_account_events").insert({
        target_profile_id: targetProfileId,
        actor_id: actor.id,
        event_type: "staff_account_soft_deleted_auth_delete_failed",
        details: { error: deleteError.message },
      });

      return jsonResponse({
        error: `Profile was deleted, but Auth user deletion failed: ${deleteError.message}`,
      }, 400);
    }

    await serviceClient.from("cms_account_events").insert({
      target_profile_id: targetProfileId,
      actor_id: actor.id,
      event_type: "staff_account_deleted",
      details: {
        previous_role: targetProfile.role,
        previous_status: targetProfile.account_status,
      },
    });

    return jsonResponse({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Account action failed";
    const status = message === "Unauthenticated" ? 401 : message === "Forbidden" ? 403 : 400;
    return jsonResponse({ error: message }, status);
  }
});
