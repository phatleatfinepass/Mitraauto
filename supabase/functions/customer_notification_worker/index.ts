import { createClient } from "npm:@supabase/supabase-js@2";
import { sendGmailRawEmail } from "../_shared/gmail.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-notification-worker-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type NotificationRow = {
  id: string;
  customer_id: string | null;
  customer_vehicle_id: string | null;
  reminder_id: string | null;
  notification_type: string;
  recipient: string;
  subject: string | null;
  details: Record<string, unknown>;
};

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

function text(value: unknown, fallback = "") {
  return String(value ?? fallback).trim();
}

function formatDate(value: unknown) {
  const raw = text(value);
  if (!raw) return "";
  return raw;
}

function formatTime(value: unknown) {
  const raw = text(value);
  if (!raw) return "";
  return raw.slice(0, 5);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function siteUrl() {
  const candidates = [
    Deno.env.get("PUBLIC_SITE_URL"),
    Deno.env.get("SITE_URL"),
    Deno.env.get("BOOKING_SITE_URL"),
  ];

  for (const candidate of candidates) {
    const value = String(candidate ?? "").trim().replace(/\/+$/, "");
    if (!value) continue;
    try {
      const url = new URL(value);
      if (url.protocol === "https:" && !["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname.toLowerCase())) {
        return value;
      }
    } catch {
      // Ignore invalid deployment environment values.
    }
  }

  return "https://mitra-auto.com";
}

function buildMessage(row: NotificationRow) {
  const details = row.details ?? {};
  const template = text(details.template || row.notification_type);
  const customerName = text(details.customer_name, "Customer");
  const portalUrl = `${siteUrl()}/cms`;

  if (template === "appointment_reminder") {
    const serviceName = text(details.service_name, "your appointment");
    const bookingDate = formatDate(details.booking_date);
    const bookingTime = formatTime(details.booking_time);
    const licensePlate = text(details.license_plate);
    const summary = [
      `Service: ${serviceName}`,
      bookingDate ? `Date: ${bookingDate}` : null,
      bookingTime ? `Time: ${bookingTime}` : null,
      licensePlate ? `Vehicle: ${licensePlate}` : null,
    ].filter(Boolean).join("\n");

    const textBody = [
      `Hello ${customerName},`,
      "",
      "This is a reminder for your upcoming Mitra Auto appointment.",
      "",
      summary,
      "",
      "If you need to change the appointment, please contact Mitra Auto.",
    ].join("\n");

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
        <p>Hello ${escapeHtml(customerName)},</p>
        <p>This is a reminder for your upcoming Mitra Auto appointment.</p>
        <ul>
          <li><strong>Service:</strong> ${escapeHtml(serviceName)}</li>
          ${bookingDate ? `<li><strong>Date:</strong> ${escapeHtml(bookingDate)}</li>` : ""}
          ${bookingTime ? `<li><strong>Time:</strong> ${escapeHtml(bookingTime)}</li>` : ""}
          ${licensePlate ? `<li><strong>Vehicle:</strong> ${escapeHtml(licensePlate)}</li>` : ""}
        </ul>
        <p>If you need to change the appointment, please contact Mitra Auto.</p>
      </div>
    `.trim();

    return {
      subject: row.subject || "Mitra Auto appointment reminder",
      text: textBody,
      html,
    };
  }

  const title = text(details.title, row.subject || "Service reminder");
  const description = text(details.description);
  const dueDate = formatDate(details.due_date);
  const dueMileage = text(details.due_mileage_km);
  const licensePlate = text(details.license_plate);
  const vehicleName = text(details.vehicle_name);
  const vehicle = [licensePlate, vehicleName].filter(Boolean).join(" - ");
  const summary = [
    dueDate ? `Due date: ${dueDate}` : null,
    dueMileage ? `Due mileage: ${dueMileage} km` : null,
    vehicle ? `Vehicle: ${vehicle}` : null,
  ].filter(Boolean).join("\n");

  const textBody = [
    `Hello ${customerName},`,
    "",
    `Mitra Auto service reminder: ${title}`,
    description ? `\n${description}` : "",
    summary ? `\n${summary}` : "",
    "",
    "You can contact Mitra Auto to schedule the service.",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
      <p>Hello ${escapeHtml(customerName)},</p>
      <p><strong>Mitra Auto service reminder:</strong> ${escapeHtml(title)}</p>
      ${description ? `<p>${escapeHtml(description).replaceAll("\n", "<br />")}</p>` : ""}
      <ul>
        ${dueDate ? `<li><strong>Due date:</strong> ${escapeHtml(dueDate)}</li>` : ""}
        ${dueMileage ? `<li><strong>Due mileage:</strong> ${escapeHtml(dueMileage)} km</li>` : ""}
        ${vehicle ? `<li><strong>Vehicle:</strong> ${escapeHtml(vehicle)}</li>` : ""}
      </ul>
      <p>You can contact Mitra Auto to schedule the service.</p>
      <p style="font-size:12px;color:#6b7280">Customer portal: ${escapeHtml(portalUrl)}</p>
    </div>
  `.trim();

  return {
    subject: row.subject || `Mitra Auto service reminder: ${title}`,
    text: textBody,
    html,
  };
}

async function ensureAuthorized(request: Request, userClient: ReturnType<typeof createClient>) {
  const configuredSecret = Deno.env.get("CUSTOMER_NOTIFICATION_WORKER_SECRET")?.trim();
  const providedSecret = request.headers.get("x-notification-worker-secret")?.trim();
  if (configuredSecret && providedSecret && configuredSecret === providedSecret) return;

  const { data: canWrite, error } = await userClient.rpc("cms_has_permission", {
    p_module: "customers",
    p_action: "write",
  });
  if (error || canWrite !== true) {
    throw new Error("Forbidden");
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = request.headers.get("Authorization") ?? "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    await ensureAuthorized(request, userClient);

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const body = await request.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(body?.limit ?? 25) || 25, 1), 100);
    const enqueue = body?.enqueue === false
      ? { skipped: true }
      : await serviceClient.rpc("customer_enqueue_due_notifications", {
        p_limit: limit,
      }).then(({ data, error }) => {
        if (error) throw error;
        return data;
      });

    const { data: claimed, error: claimError } = await serviceClient.rpc("customer_notification_claim_email_queue", {
      p_limit: limit,
    });
    if (claimError) throw claimError;

    const rows = (Array.isArray(claimed) ? claimed : []) as NotificationRow[];
    const results: Array<{ id: string; status: string; error?: string }> = [];

    for (const row of rows) {
      try {
        const message = buildMessage(row);
        const sent = await sendGmailRawEmail({
          toEmail: row.recipient,
          toName: text(row.details?.customer_name),
          subject: message.subject,
          text: message.text,
          html: message.html,
        });

        const sentAt = new Date().toISOString();
        const { error: updateError } = await serviceClient
          .from("customer_notification_history")
          .update({
            status: "sent",
            provider_message_id: sent.messageId,
            sent_at: sentAt,
            details: {
              ...row.details,
              sent_at: sentAt,
              provider: sent.provider,
              provider_thread_id: sent.threadId,
              provider_message_id_header: sent.messageIdHeader,
            },
          })
          .eq("id", row.id);
        if (updateError) throw updateError;

        if (row.reminder_id) {
          await serviceClient
            .from("customer_maintenance_reminders")
            .update({ status: "sent", last_email_at: sentAt, updated_at: sentAt })
            .eq("id", row.reminder_id);
        }

        results.push({ id: row.id, status: "sent" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Send failed";
        await serviceClient
          .from("customer_notification_history")
          .update({
            status: "failed",
            details: {
              ...row.details,
              failed_at: new Date().toISOString(),
              error: message,
            },
          })
          .eq("id", row.id);
        results.push({ id: row.id, status: "failed", error: message });
      }
    }

    return jsonResponse({
      ok: true,
      enqueue,
      claimed: rows.length,
      results,
    });
  } catch (error) {
    console.error("Customer notification worker failed", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Notification worker failed" }, 400);
  }
});
