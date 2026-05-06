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

async function getActor(request: Request) {
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

  const { data: hasVerifiedMfa, error: mfaError } = await userClient.rpc("cms_has_verified_mfa");
  if (mfaError || hasVerifiedMfa !== true) {
    throw new Error("Verified MFA session required");
  }

  return {
    id: user.id,
    email: user.email ?? "",
    canManageAccounts: !permissionError && canManageAccounts === true,
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const actor = await getActor(request);
    const body = await request.json().catch(() => ({}));
    const targetProfileId = normalizeText(body?.targetProfileId);
    const password = normalizeText(body?.password);
    const targetUserId = targetProfileId || actor.id;
    const isSelfChange = targetUserId === actor.id;

    if (!password || password.length < 8) {
      return jsonResponse({ error: "Password must be at least 8 characters" }, 400);
    }

    if (!isSelfChange && !actor.canManageAccounts) {
      return jsonResponse({ error: "Account management access required" }, 403);
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data: targetProfile, error: profileError } = await serviceClient
      .from("profiles")
      .select("id, role, account_status")
      .eq("id", targetUserId)
      .maybeSingle();

    if (profileError || !targetProfile?.id) {
      return jsonResponse({ error: "Target account profile not found" }, 404);
    }

    if (targetProfile.account_status === "deleted") {
      return jsonResponse({ error: "Cannot change password for deleted account" }, 400);
    }

    if (!isSelfChange && targetProfile.role === "super_admin") {
      const { data: actorProfile } = await serviceClient
        .from("profiles")
        .select("role, account_status")
        .eq("id", actor.id)
        .maybeSingle();

      if (actorProfile?.role !== "super_admin" || actorProfile?.account_status !== "active") {
        return jsonResponse({ error: "Only active super admin can change another super admin password" }, 403);
      }
    }

    const { error: updateError } = await serviceClient.auth.admin.updateUserById(targetUserId, {
      password,
    });

    if (updateError) {
      return jsonResponse({ error: updateError.message }, 400);
    }

    await serviceClient.from("cms_account_events").insert({
      target_profile_id: targetUserId,
      actor_id: actor.id,
      event_type: isSelfChange ? "staff_password_changed_self" : "staff_password_changed_by_admin",
      details: {
        actor_email: actor.email,
        self_change: isSelfChange,
      },
    });

    return jsonResponse({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Password change failed";
    const status = message === "Unauthenticated" ? 401 : 400;
    return jsonResponse({ error: message }, status);
  }
});
