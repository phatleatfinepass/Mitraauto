import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const PAYTRAIL_WEBHOOK_URL = Deno.env.get("PAYTRAIL_WEBHOOK_URL") ?? "";
const FRONTEND_SUCCESS_URL = Deno.env.get("FRONTEND_SUCCESS_URL") ?? "";
const FRONTEND_CANCEL_URL = Deno.env.get("FRONTEND_CANCEL_URL") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const limit = Math.min(Number(body?.limit ?? 5) || 5, 20);
    const requestedOrderIds = Array.isArray(body?.orderIds)
      ? body.orderIds.filter((value: unknown) => typeof value === "string" && value.trim())
      : [];

    let pollerResult: unknown = null;
    if (body?.runPoller === true) {
      const functionUrl = `${SUPABASE_URL}/functions/v1/payments_status_poller`;
      const pollerResponse = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ source: "debug_order_state" }),
      });

      const pollerText = await pollerResponse.text();
      try {
        pollerResult = JSON.parse(pollerText);
      } catch {
        pollerResult = { raw: pollerText, status: pollerResponse.status };
      }
    }

    let ordersQuery = supabase
      .from("orders")
      .select("id, created_at, status, paytrail_status, paytrail_transaction_id, paytrail_reference, paytrail_stamp, grand_total_cents, cart_snapshot")
      .order("created_at", { ascending: false });

    if (requestedOrderIds.length > 0) {
      ordersQuery = ordersQuery.in("id", requestedOrderIds);
    } else {
      ordersQuery = ordersQuery.limit(limit);
    }

    const { data: orders, error: ordersError } = await ordersQuery;

    if (ordersError) {
      throw ordersError;
    }

    const orderIds = (orders ?? []).map((o: any) => o.id).filter(Boolean);

    let events: any[] = [];
    if (orderIds.length > 0) {
      const { data: eventRows, error: eventsError } = await supabase
        .from("payment_events")
        .select("order_id, event_type, ext_transaction_id, ext_stamp, ext_status, source, created_at")
        .in("order_id", orderIds)
        .order("created_at", { ascending: false })
        .limit(50);

      if (eventsError) {
        throw eventsError;
      }

      events = eventRows ?? [];
    }

    return new Response(JSON.stringify({
      config: {
        webhookUrl: PAYTRAIL_WEBHOOK_URL,
        successUrl: FRONTEND_SUCCESS_URL,
        cancelUrl: FRONTEND_CANCEL_URL,
      },
      pollerResult,
      orders,
      events
    }, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  }
});
