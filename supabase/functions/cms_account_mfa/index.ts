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

async function getActor(request: Request, action: string) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) throw new Error("Unauthenticated");

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) throw new Error("Unauthenticated");

  const permissionAction = action === "reset" ? "write" : "read";
  const { data: canManageAccounts, error: permissionError } = await userClient.rpc("cms_has_permission", {
    p_module: "accounts",
    p_action: permissionAction,
  });

  if (permissionError || canManageAccounts !== true) {
    throw new Error("Forbidden");
  }

  if (action === "reset") {
    const { data: hasVerifiedMfa, error: mfaError } = await userClient.rpc("cms_has_verified_mfa");
    if (mfaError || hasVerifiedMfa !== true) {
      throw new Error("Verified MFA session required");
    }
  }

  return {
    id: user.id,
    email: user.email ?? "",
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
    const body = await request.json().catch(() => ({}));
    const action = normalizeText(body?.action) || "status";
    const targetProfileId = normalizeText(body?.targetProfileId);

    if (!["status", "reset"].includes(action)) {
      return jsonResponse({ error: "Unsupported MFA action" }, 400);
    }

    if (!targetProfileId) {
      return jsonResponse({ error: "Target profile is required" }, 400);
    }

    const actor = await getActor(request, action);
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data: targetProfile, error: profileError } = await serviceClient
      .from("profiles")
      .select("id, role, account_status")
      .eq("id", targetProfileId)
      .maybeSingle();

    if (profileError || !targetProfile?.id) {
      return jsonResponse({ error: "Target account profile not found" }, 404);
    }

    if (targetProfile.account_status === "deleted") {
      return jsonResponse({ error: "Cannot manage MFA for deleted account" }, 400);
    }

    if (action === "reset" && targetProfile.role === "super_admin" && targetProfileId !== actor.id) {
      const { data: actorProfile } = await serviceClient
        .from("profiles")
        .select("role, account_status")
        .eq("id", actor.id)
        .maybeSingle();

      if (actorProfile?.role !== "super_admin" || actorProfile?.account_status !== "active") {
        return jsonResponse({ error: "Only active super admin can reset another super admin MFA" }, 403);
      }
    }

    const { data: factorsData, error: factorsError } = await serviceClient.auth.admin.mfa.listFactors({
      userId: targetProfileId,
    });

    if (factorsError) {
      return jsonResponse({ error: factorsError.message }, 400);
    }

    const factors = factorsData?.factors ?? [];
    const totpFactors = factors.filter((factor) => factor.factor_type === "totp");
    const verifiedTotp = totpFactors.filter((factor) => factor.status === "verified");
    const unverifiedTotp = totpFactors.filter((factor) => factor.status !== "verified");

    if (action === "status") {
      return jsonResponse({
        ok: true,
        enabled: verifiedTotp.length > 0,
        verifiedTotpCount: verifiedTotp.length,
        pendingTotpCount: unverifiedTotp.length,
        factorCount: factors.length,
        updatedAt: new Date().toISOString(),
      });
    }

    const deletedFactorIds: string[] = [];
    for (const factor of totpFactors) {
      const { error: deleteError } = await serviceClient.auth.admin.mfa.deleteFactor({
        userId: targetProfileId,
        id: factor.id,
      });

      if (deleteError) {
        return jsonResponse({ error: deleteError.message }, 400);
      }

      deletedFactorIds.push(factor.id);
    }

    await serviceClient.from("cms_account_events").insert({
      target_profile_id: targetProfileId,
      actor_id: actor.id,
      event_type: "staff_mfa_reset",
      details: {
        actor_email: actor.email,
        deleted_totp_factor_count: deletedFactorIds.length,
      },
    });

    return jsonResponse({
      ok: true,
      enabled: false,
      verifiedTotpCount: 0,
      pendingTotpCount: 0,
      factorCount: Math.max(0, factors.length - deletedFactorIds.length),
      reset: true,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "MFA action failed";
    const status = message === "Unauthenticated" ? 401 : message === "Forbidden" ? 403 : 400;
    return jsonResponse({ error: message }, status);
  }
});
