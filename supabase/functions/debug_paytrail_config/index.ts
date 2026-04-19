import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(() => {
  return new Response(
    JSON.stringify({
      apiBase: Deno.env.get("PAYTRAIL_API_BASE"),
      merchantIdConfigured: !!Deno.env.get("PAYTRAIL_MERCHANT_ID"),
      signatureScheme: Deno.env.get("PAYTRAIL_SIGNATURE_SCHEME"),
      successUrl: Deno.env.get("FRONTEND_SUCCESS_URL"),
      cancelUrl: Deno.env.get("FRONTEND_CANCEL_URL"),
      webhookUrl: Deno.env.get("PAYTRAIL_WEBHOOK_URL"),
      environment: Deno.env.get("PAYTRAIL_ENVIRONMENT"),
    }, null, 2),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
});