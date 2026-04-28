import { createClient } from "npm:@supabase/supabase-js@2";

export type SupportedLanguage = "fi" | "en";
export type BookingMailType = "confirmation" | "update" | "cancellation" | "message";
export type BookingManageAction =
  | "get_booking"
  | "validate_booking"
  | "view_booking"
  | "available_slots"
  | "update_booking"
  | "cancel_booking"
  | "complete_missing_fields";
export type BookingManageMode = "view" | "edit" | "cancel" | "complete";

export type BookingRow = {
  id: string;
  created_at?: string | null;
  updated_at?: string | null;
  status?: string | null;
  booking_language?: string | null;
  booking_date: string;
  booking_time: string;
  license_plate: string;
  service_name?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  notes?: string | null;
  customer_manage_token_hash?: string | null;
  customer_manage_token_expires_at?: string | null;
  customer_manage_last_used_at?: string | null;
  customer_action_state?: string | null;
  customer_action_email?: string | null;
  customer_action_revoked_at?: string | null;
  customer_last_action_at?: string | null;
  calendar_uid?: string | null;
  ics_sequence?: number | null;
  ics_last_sent_at?: string | null;
  calendar_last_sent_at?: string | null;
  cancellation_note?: string | null;
};

type GmailSyncStateRow = {
  mailbox_email: string;
  access_token?: string | null;
  refresh_token?: string | null;
  token_scope?: string | null;
  token_type?: string | null;
  token_expiry?: string | null;
};

type BookingEmailThreadRow = {
  id: string;
  booking_id: string;
  mailbox_email: string;
  provider_thread_id?: string | null;
  subject?: string | null;
  status?: string | null;
  history_id?: string | null;
  last_message_at?: string | null;
  last_synced_at?: string | null;
};

const HELSINKI_TZ = "Europe/Helsinki";
const SLOT_MINUTES = Number(Deno.env.get("BOOKING_SLOT_DURATION_MINUTES") ?? "30");
const DEFAULT_TOKEN_TTL_DAYS = Number(Deno.env.get("BOOKING_MANAGE_TOKEN_TTL_DAYS") ?? "180");
const DEFAULT_EDIT_CUTOFF_MINUTES = Number(Deno.env.get("BOOKING_MANAGE_EDIT_CUTOFF_MINUTES") ?? "120");
const DEFAULT_SITE_URL = Deno.env.get("BOOKING_SITE_URL") ?? Deno.env.get("SITE_URL") ?? "http://localhost:5173";
const WORKSHOP_LATITUDE = Deno.env.get("BOOKING_WORKSHOP_LATITUDE") ?? "60.247482";
const WORKSHOP_LONGITUDE = Deno.env.get("BOOKING_WORKSHOP_LONGITUDE") ?? "24.844299";
const WORKSHOP_PHONE = Deno.env.get("BOOKING_WORKSHOP_PHONE") ?? "+358407777163";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

function env(name: string, fallback?: string) {
  const value = Deno.env.get(name) ?? fallback;
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function addMinutesToTime(time: string, minutesToAdd: number) {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  const total = hours * 60 + minutes + minutesToAdd;
  const nextHours = Math.floor(total / 60);
  const nextMinutes = total % 60;
  return `${pad(nextHours)}:${pad(nextMinutes)}`;
}

function addDaysIso(date: string, days: number) {
  const current = new Date(`${date}T12:00:00Z`);
  current.setUTCDate(current.getUTCDate() + days);
  return current.toISOString().slice(0, 10);
}

function getHelsinkiNowParts() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: HELSINKI_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]),
  ) as Record<string, string>;

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  };
}

function isBookingInTheFuture(booking: BookingRow) {
  const now = getHelsinkiNowParts();
  const bookingTime = booking.booking_time.slice(0, 5);
  if (booking.booking_date > now.date) return true;
  if (booking.booking_date < now.date) return false;
  return bookingTime > now.time;
}

function getMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function isBookingMutable(booking: BookingRow) {
  if ((booking.status ?? "confirmed").toLowerCase() === "cancelled") return false;

  const now = getHelsinkiNowParts();
  if (booking.booking_date > now.date) return true;
  if (booking.booking_date < now.date) return false;

  const diff = getMinutes(booking.booking_time.slice(0, 5)) - getMinutes(now.time);
  return diff >= DEFAULT_EDIT_CUTOFF_MINUTES;
}

function normalizeBookingText(value?: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeBookingPlate(value?: unknown) {
  return normalizeBookingText(value).toUpperCase();
}

function getCalendarUid(bookingId: string) {
  return `booking-${bookingId}@mitra-auto.fi`;
}

function getMapUrl() {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(garageAddress())}`;
}

function getAppleStructuredLocation() {
  return `X-APPLE-STRUCTURED-LOCATION;VALUE=URI;X-TITLE=${escapeIcsText(garageName())}:geo:${WORKSHOP_LATITUDE},${WORKSHOP_LONGITUDE}`;
}

function foldIcsLine(line: string) {
  if (line.length <= 74) {
    return line;
  }

  const parts: string[] = [];
  let remaining = line;

  while (remaining.length > 74) {
    parts.push(remaining.slice(0, 74));
    remaining = ` ${remaining.slice(74)}`;
  }

  parts.push(remaining);
  return parts.join("\r\n");
}

function buildIcsLine(key: string, value: string) {
  return foldIcsLine(`${key}:${value}`);
}

function getMissingCustomerFields(booking: BookingRow) {
  const missing: string[] = [];
  if (!normalizeBookingPlate(booking.license_plate)) missing.push("licensePlate");
  if (!normalizeBookingText(booking.customer_phone)) missing.push("customerPhone");
  if (!normalizeBookingText(booking.customer_email)) missing.push("customerEmail");
  return missing;
}

function deriveCustomerActionState(booking: BookingRow) {
  if ((booking.status ?? "confirmed").toLowerCase() === "cancelled") {
    return "cancelled";
  }

  return getMissingCustomerFields(booking).length > 0 ? "awaiting_completion" : "active";
}

function getAllowedCustomerActions(booking: BookingRow) {
  if ((booking.status ?? "confirmed").toLowerCase() === "cancelled") {
    return ["validate_booking", "get_booking"] as const;
  }

  if (!isBookingInTheFuture(booking)) {
    return ["validate_booking", "get_booking"] as const;
  }

  const base = ["validate_booking", "get_booking", "cancel_booking"] as const;
  if (!isBookingMutable(booking)) {
    return base;
  }

  return getMissingCustomerFields(booking).length > 0
    ? [...base, "complete_missing_fields"] as const
    : [...base, "update_booking"] as const;
}

function toLocalIcsDateTime(date: string, time: string) {
  const normalized = time.slice(0, 5).replace(":", "");
  return `${date.replaceAll("-", "")}T${normalized}00`;
}

function escapeIcsText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll("\n", "\\n");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeLanguage(value?: string | null): SupportedLanguage {
  return value?.toLowerCase() === "en" ? "en" : "fi";
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((item) => item.toString(16).padStart(2, "0")).join("");
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes).map((item) => item.toString(16).padStart(2, "0")).join("");
}

function toBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll(/=+$/g, "");
}

function toBase64Utf8(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function encodeMimeHeader(value: string) {
  if (!/[^\u0000-\u007f]/.test(value)) {
    return value;
  }

  return `=?UTF-8?B?${toBase64Utf8(value)}?=`;
}

function baseSiteUrl() {
  return DEFAULT_SITE_URL.replace(/\/+$/, "");
}

export function buildManageUrl(token: string, language: SupportedLanguage, mode?: BookingManageMode) {
  const localePrefix = language === "en" ? "/en" : "";
  const params = new URLSearchParams({ token });
  if (mode) params.set("mode", mode);
  return `${baseSiteUrl()}${localePrefix}/booking/manage?${params.toString()}`;
}

function garageName() {
  return Deno.env.get("BOOKING_GARAGE_NAME") ?? "Mitra Auto";
}

function garageAddress() {
  return Deno.env.get("BOOKING_GARAGE_ADDRESS") ?? "Mitra Auto, Helsinki";
}

function senderAddress() {
  const configured = Deno.env.get("EMAIL_FROM") ?? Deno.env.get("BOOKING_FROM_EMAIL");
  if (configured?.trim()) return configured.trim();

  const mailbox = (Deno.env.get("GMAIL_MAILBOX_EMAIL") ?? "").trim();
  if (mailbox) return `Mitra Auto <${mailbox}>`;

  throw new Error("Missing environment variable EMAIL_FROM");
}

function extractMailbox(value: string) {
  const match = value.match(/<([^>]+)>/);
  return (match?.[1] ?? value).trim();
}

function organizerEmail() {
  return extractMailbox(senderAddress());
}

function replyToEmail() {
  return Deno.env.get("BOOKING_REPLY_TO_EMAIL") ?? organizerEmail();
}

function formatHumanDate(date: string, language: SupportedLanguage) {
  return new Intl.DateTimeFormat(language === "fi" ? "fi-FI" : "en-US", {
    timeZone: HELSINKI_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00+03:00`));
}

function formatHumanTime(time: string) {
  return time.slice(0, 5);
}

function buildBookingTitle(booking: BookingRow) {
  const service = booking.service_name?.trim() || "Service";
  const plate = booking.license_plate?.trim();
  return plate ? `${garageName()}: ${service} (${plate})` : `${garageName()}: ${service}`;
}

export function bookingResponse(booking: BookingRow) {
  const missingFields = getMissingCustomerFields(booking);
  return {
    id: booking.id,
    status: booking.status ?? "confirmed",
    bookingLanguage: normalizeLanguage(booking.booking_language),
    bookingDate: booking.booking_date,
    bookingTime: booking.booking_time?.slice(0, 5),
    bookingEndTime: addMinutesToTime(booking.booking_time, SLOT_MINUTES),
    licensePlate: booking.license_plate,
    serviceName: booking.service_name ?? "",
    customerName: booking.customer_name ?? "",
    customerPhone: booking.customer_phone ?? "",
    customerEmail: booking.customer_email ?? "",
    notes: booking.notes ?? "",
    cancellationNote: booking.cancellation_note ?? "",
    manageTokenExpiresAt: booking.customer_manage_token_expires_at ?? null,
    customerActionState: booking.customer_action_state ?? deriveCustomerActionState(booking),
    customerActionEmail: booking.customer_action_email ?? booking.customer_email ?? "",
    customerLastActionAt: booking.customer_last_action_at ?? null,
    customerActionRevokedAt: booking.customer_action_revoked_at ?? null,
    calendarUid: booking.calendar_uid ?? getCalendarUid(booking.id),
    calendarSequence: booking.ics_sequence ?? 0,
    calendarLastSentAt: booking.calendar_last_sent_at ?? booking.ics_last_sent_at ?? null,
    missingFields,
    allowedActions: getAllowedCustomerActions(booking),
    canManage: (booking.status ?? "confirmed").toLowerCase() !== "cancelled",
  };
}

async function findBooking(bookingId: string) {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single<BookingRow>();

  if (error || !data) throw new Error(error?.message ?? "Booking not found");
  return data;
}

export async function validateManageToken(token: string) {
  if (!token?.trim()) throw new Error("Missing manage token");
  const tokenHash = await sha256Hex(token.trim());
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("customer_manage_token_hash", tokenHash)
    .gt("customer_manage_token_expires_at", new Date().toISOString())
    .single<BookingRow>();

  if (error || !data) throw new Error("Invalid or expired booking token");

  await supabaseAdmin
    .from("bookings")
    .update({ customer_manage_last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return data;
}

async function persistBookingLifecycleState(
  bookingId: string,
  patch: Partial<Pick<
    BookingRow,
    | "customer_manage_token_hash"
    | "customer_manage_token_expires_at"
    | "customer_manage_last_used_at"
    | "customer_action_state"
    | "customer_action_email"
    | "customer_action_revoked_at"
    | "customer_last_action_at"
    | "calendar_uid"
    | "ics_sequence"
    | "ics_last_sent_at"
    | "calendar_last_sent_at"
    | "cancellation_note"
    | "status"
    | "booking_date"
    | "booking_time"
    | "license_plate"
    | "service_name"
    | "customer_name"
    | "customer_phone"
    | "customer_email"
    | "notes"
  >>,
) {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .update(patch)
    .eq("id", bookingId)
    .select("*")
    .single<BookingRow>();

  if (error || !data) throw new Error(error?.message ?? "Failed to update booking lifecycle state");
  return data;
}

async function issueManageToken(
  booking: BookingRow,
  options: { recipientEmail?: string | null; actionState?: string } = {},
) {
  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + DEFAULT_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const data = await persistBookingLifecycleState(booking.id, {
    customer_manage_token_hash: tokenHash,
    customer_manage_token_expires_at: expiresAt,
    customer_manage_last_used_at: null,
    customer_action_state: options.actionState ?? deriveCustomerActionState(booking),
    customer_action_email: options.recipientEmail ?? booking.customer_email ?? null,
    customer_action_revoked_at: null,
    calendar_uid: booking.calendar_uid ?? getCalendarUid(booking.id),
  });

  return { booking: data, token };
}

export async function getAvailableSlots(date: string, excludeBookingId?: string) {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  if (weekday === 0) return [];

  const opening = weekday === 6 ? { start: 10, end: 17 } : { start: 9, end: 18 };
  const slots: string[] = [];

  for (let hour = opening.start; hour < opening.end; hour += 1) {
    slots.push(`${pad(hour)}:00`);
    slots.push(`${pad(hour)}:30`);
  }

  const [{ data: bookings, error: bookingsError }, { data: blocked, error: blockedError }] = await Promise.all([
    supabaseAdmin
      .from("bookings")
      .select("id, booking_time, status")
      .eq("booking_date", date),
    supabaseAdmin
      .from("blocked_slots")
      .select("start_time, end_time")
      .eq("date", date),
  ]);

  if (bookingsError) throw new Error(bookingsError.message);
  if (blockedError) throw new Error(blockedError.message);

  return slots.filter((slot) => {
    const blockedSlot = (blocked ?? []).some((row) => slot >= row.start_time && slot < row.end_time);
    if (blockedSlot) return false;

    const occupied = (bookings ?? []).some((row) => {
      if (excludeBookingId && row.id === excludeBookingId) return false;
      const normalizedStatus = (row.status ?? "confirmed").toLowerCase();
      return normalizedStatus !== "cancelled" && row.booking_time.slice(0, 5) === slot;
    });

    return !occupied;
  });
}

function buildTextBody(type: BookingMailType, booking: BookingRow, manageUrl?: string, customMessage?: string) {
  const language = normalizeLanguage(booking.booking_language);
  const dateLabel = formatHumanDate(booking.booking_date, language);
  const timeLabel = formatHumanTime(booking.booking_time);
  const subjectService = booking.service_name?.trim() || (language === "fi" ? "Huolto" : "Service");
  const completionPending = getMissingCustomerFields(booking).length > 0;
  const actionLines = manageUrl
    ? [
        language === "fi" ? `Hallitse varaustasi: ${manageUrl}` : `Manage your booking: ${manageUrl}`,
      ]
    : [];

  if (manageUrl) {
    const token = new URL(manageUrl).searchParams.get("token") ?? "";
    if (token) {
      actionLines.push(
        `${language === "fi" ? "Nayta varaus" : "View booking"}: ${buildManageUrl(token, language, "view")}`,
        `${language === "fi" ? "Muokkaa varausta" : "Edit booking"}: ${buildManageUrl(token, language, completionPending ? "complete" : "edit")}`,
        `${language === "fi" ? "Peruuta varaus" : "Cancel booking"}: ${buildManageUrl(token, language, "cancel")}`,
      );

      if (completionPending) {
        actionLines.push(
          `${language === "fi" ? "Täydennä puuttuvat tiedot" : "Complete missing details"}: ${buildManageUrl(token, language, "complete")}`,
        );
      }
    }
  }

  const manageLine = actionLines.join("\n");

  if (type === "cancellation") {
    return language === "fi"
      ? `Varauksesi ${subjectService} ajalle ${dateLabel} klo ${timeLabel} on peruttu.\n${booking.cancellation_note ? `Syy: ${booking.cancellation_note}\n` : ""}${manageLine}`.trim()
      : `Your ${subjectService} booking for ${dateLabel} at ${timeLabel} has been cancelled.\n${booking.cancellation_note ? `Reason: ${booking.cancellation_note}\n` : ""}${manageLine}`.trim();
  }

  if (type === "message") {
    return `${customMessage ?? ""}\n\n${manageLine}`.trim();
  }

  return language === "fi"
    ? `Varauksesi ${subjectService} on ${type === "confirmation" ? "vahvistettu" : "päivitetty"} ajalle ${dateLabel} klo ${timeLabel}.\n${manageLine}`.trim()
    : `Your ${subjectService} booking has been ${type === "confirmation" ? "confirmed" : "updated"} for ${dateLabel} at ${timeLabel}.\n${manageLine}`.trim();
}

function buildHtmlBody(type: BookingMailType, booking: BookingRow, manageUrl?: string, customMessage?: string) {
  const language = normalizeLanguage(booking.booking_language);
  const dateLabel = escapeHtml(formatHumanDate(booking.booking_date, language));
  const timeLabel = escapeHtml(formatHumanTime(booking.booking_time));
  const serviceLabel = escapeHtml(booking.service_name?.trim() || (language === "fi" ? "Huolto" : "Service"));
  const customerLabel = escapeHtml(booking.customer_name?.trim() || "");
  const noteLabel = booking.notes?.trim() ? `<p><strong>${language === "fi" ? "Lisatiedot" : "Notes"}:</strong> ${escapeHtml(booking.notes)}</p>` : "";
  const cancellationLabel = booking.cancellation_note?.trim()
    ? `<p><strong>${language === "fi" ? "Peruutuksen syy" : "Cancellation reason"}:</strong> ${escapeHtml(booking.cancellation_note)}</p>`
    : "";
  const completionPending = getMissingCustomerFields(booking).length > 0;
  let manageCta = "";
  if (manageUrl) {
    const token = new URL(manageUrl).searchParams.get("token") ?? "";
    const links = token
      ? [
          {
            href: buildManageUrl(token, language, "view"),
            label: language === "fi" ? "Hallitse varausta" : "Manage booking",
            primary: true,
          },
          {
            href: buildManageUrl(token, language, completionPending ? "complete" : "edit"),
            label: completionPending ? (language === "fi" ? "Täydennä tiedot" : "Complete details") : (language === "fi" ? "Muokkaa varausta" : "Edit booking"),
            primary: false,
          },
          {
            href: buildManageUrl(token, language, "cancel"),
            label: language === "fi" ? "Peruuta varaus" : "Cancel booking",
            primary: false,
          },
        ]
      : [
          {
            href: manageUrl,
            label: language === "fi" ? "Hallitse varausta" : "Manage booking",
            primary: true,
          },
        ];

    manageCta = `<div style="margin-top:24px;display:flex;flex-wrap:wrap;gap:12px;">${
      links.map((link) =>
        `<a href="${escapeHtml(link.href)}" style="${link.primary ? "background:#111827;color:#ffffff;" : "background:#ffffff;color:#111827;border:1px solid #d1d5db;"}padding:12px 16px;border-radius:8px;text-decoration:none;display:inline-block;">${escapeHtml(link.label)}</a>`
      ).join("")
    }</div>`;
  }

  let intro = "";
  if (type === "confirmation") {
    intro = language === "fi" ? "Varauksesi on vahvistettu." : "Your booking is confirmed.";
  } else if (type === "update") {
    intro = language === "fi" ? "Varauksesi tiedot on paivitetty." : "Your booking details have been updated.";
  } else if (type === "cancellation") {
    intro = language === "fi" ? "Varauksesi on peruttu." : "Your booking has been cancelled.";
  } else {
    intro = customMessage ? escapeHtml(customMessage).replaceAll("\n", "<br />") : "";
  }

  return [
    `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:620px;margin:0 auto;padding:24px;">`,
    `<h1 style="font-size:24px;margin:0 0 16px;">${escapeHtml(garageName())}</h1>`,
    `<p>${customerLabel ? `${language === "fi" ? "Hei" : "Hi"} ${customerLabel}, ` : ""}${intro}</p>`,
    type === "message" ? "" : `<div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:20px 0;"><p><strong>${language === "fi" ? "Palvelu" : "Service"}:</strong> ${serviceLabel}</p><p><strong>${language === "fi" ? "Ajankohta" : "When"}:</strong> ${dateLabel} ${language === "fi" ? "klo" : "at"} ${timeLabel}</p><p><strong>${language === "fi" ? "Ajoneuvo" : "Vehicle"}:</strong> ${escapeHtml(booking.license_plate)}</p></div>`,
    noteLabel,
    cancellationLabel,
    manageCta,
    `<p style="margin-top:24px;font-size:14px;color:#6b7280;">${escapeHtml(garageAddress())}<br />${escapeHtml(WORKSHOP_PHONE)}<br />${escapeHtml(replyToEmail())}</p>`,
    `</div>`,
  ].join("");
}

function buildSubject(type: BookingMailType, booking: BookingRow, explicitSubject?: string) {
  if (explicitSubject?.trim()) return explicitSubject.trim();
  const language = normalizeLanguage(booking.booking_language);
  const service = booking.service_name?.trim() || (language === "fi" ? "huolto" : "service");
  if (type === "confirmation") return language === "fi" ? `Varausvahvistus: ${service}` : `Booking confirmation: ${service}`;
  if (type === "update") return language === "fi" ? `Varauksesi paivitetty: ${service}` : `Booking updated: ${service}`;
  if (type === "cancellation") return language === "fi" ? `Varauksesi peruttu: ${service}` : `Booking cancelled: ${service}`;
  return language === "fi" ? "Viesti varaukseesi liittyen" : "Message about your booking";
}

function buildIcsContent(booking: BookingRow, method: "REQUEST" | "CANCEL") {
  const start = toLocalIcsDateTime(booking.booking_date, booking.booking_time);
  const end = toLocalIcsDateTime(booking.booking_date, addMinutesToTime(booking.booking_time, SLOT_MINUTES));
  const description = [
    `${booking.service_name ?? "Service"}`,
    `${booking.license_plate}`,
    booking.notes ?? "",
    booking.customer_name ? `Customer: ${booking.customer_name}` : "",
    booking.customer_phone ? `Phone: ${booking.customer_phone}` : "",
    booking.customer_email ? `Email: ${booking.customer_email}` : "",
    `Map: ${getMapUrl()}`,
  ].filter(Boolean).join("\n");
  const uid = booking.calendar_uid ?? getCalendarUid(booking.id);
  const sequence = booking.ics_sequence ?? 0;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    buildIcsLine("PRODID", "-//Mitra Auto//Booking//EN"),
    "CALSCALE:GREGORIAN",
    buildIcsLine("METHOD", method),
    "BEGIN:VEVENT",
    buildIcsLine("UID", uid),
    buildIcsLine("SEQUENCE", String(sequence)),
    buildIcsLine("DTSTAMP", new Date().toISOString().replaceAll(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")),
    foldIcsLine(`DTSTART;TZID=${HELSINKI_TZ}:${start}`),
    foldIcsLine(`DTEND;TZID=${HELSINKI_TZ}:${end}`),
    buildIcsLine("SUMMARY", escapeIcsText(buildBookingTitle(booking))),
    buildIcsLine("LOCATION", escapeIcsText(garageAddress())),
    buildIcsLine("URL", escapeIcsText(getMapUrl())),
    buildIcsLine("DESCRIPTION", escapeIcsText(description)),
    buildIcsLine("STATUS", method === "CANCEL" ? "CANCELLED" : "CONFIRMED"),
    foldIcsLine(`ORGANIZER;CN=${escapeIcsText(garageName())}:mailto:${organizerEmail()}`),
    foldIcsLine(`ATTENDEE;CN=${escapeIcsText(booking.customer_name ?? booking.customer_email ?? "Customer")};RSVP=TRUE:mailto:${booking.customer_email ?? replyToEmail()}`),
    buildIcsLine("X-MICROSOFT-CDO-BUSYSTATUS", method === "CANCEL" ? "FREE" : "BUSY"),
    buildIcsLine("X-MICROSOFT-CDO-INTENDEDSTATUS", method === "CANCEL" ? "FREE" : "BUSY"),
    getAppleStructuredLocation(),
    buildIcsLine("GEO", `${WORKSHOP_LATITUDE};${WORKSHOP_LONGITUDE}`),
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}

async function sendEmail(args: {
  booking: BookingRow;
  type: BookingMailType;
  to: string;
  subject: string;
  html: string;
  text: string;
  icsContent?: string;
  icsFilename?: string;
}) {
  function gmailMailboxEmail() {
    return (Deno.env.get("GMAIL_MAILBOX_EMAIL") ?? organizerEmail()).trim().toLowerCase();
  }

  async function getGmailSyncState(mailboxEmail: string) {
    const { data, error } = await supabaseAdmin
      .from("gmail_sync_state")
      .select("*")
      .eq("mailbox_email", mailboxEmail)
      .maybeSingle<GmailSyncStateRow>();

    if (error) throw new Error(error.message);
    if (!data) throw new Error(`No Gmail connection found for ${mailboxEmail}`);
    return data;
  }

  async function updateGmailSyncState(mailboxEmail: string, patch: Partial<GmailSyncStateRow> & { history_id?: string | null; last_error?: string | null }) {
    const { error } = await supabaseAdmin
      .from("gmail_sync_state")
      .update(patch)
      .eq("mailbox_email", mailboxEmail);

    if (error) throw new Error(error.message);
  }

  async function refreshGoogleAccessToken(refreshToken: string) {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: env("GMAIL_CLIENT_ID"),
        client_secret: env("GMAIL_CLIENT_SECRET"),
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Gmail access token refresh failed: ${response.status} ${detail}`);
    }

    return await response.json() as {
      access_token: string;
      expires_in: number;
      scope?: string;
      token_type?: string;
    };
  }

  async function getValidGmailAccessToken(mailboxEmail: string) {
    const state = await getGmailSyncState(mailboxEmail);
    const expiry = state.token_expiry ? new Date(state.token_expiry).getTime() : 0;
    if (state.access_token && expiry > Date.now() + 60_000) {
      return { accessToken: state.access_token, state };
    }

    if (!state.refresh_token) throw new Error(`No Gmail refresh token stored for ${mailboxEmail}`);
    const refreshed = await refreshGoogleAccessToken(state.refresh_token);
    const tokenExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
    await updateGmailSyncState(mailboxEmail, {
      access_token: refreshed.access_token,
      token_expiry: tokenExpiry,
      token_scope: refreshed.scope ?? state.token_scope ?? null,
      token_type: refreshed.token_type ?? state.token_type ?? null,
      last_error: null,
    });

    return {
      accessToken: refreshed.access_token,
      state: {
        ...state,
        access_token: refreshed.access_token,
        token_expiry: tokenExpiry,
      },
    };
  }

  async function gmailApi<T>(mailboxEmail: string, path: string, method = "GET", body?: unknown): Promise<T> {
    const { accessToken } = await getValidGmailAccessToken(mailboxEmail);
    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const detail = await response.text();
      await updateGmailSyncState(mailboxEmail, {
        last_error: `Gmail API ${method} ${path} failed: ${response.status} ${detail}`,
      });
      throw new Error(`Gmail API ${method} ${path} failed: ${response.status} ${detail}`);
    }

    if (response.status === 204) return {} as T;
    return await response.json() as T;
  }

  async function getThreadForBooking(bookingId: string, mailboxEmail: string) {
    const { data, error } = await supabaseAdmin
      .from("booking_email_threads")
      .select("*")
      .eq("booking_id", bookingId)
      .eq("provider", "gmail")
      .eq("mailbox_email", mailboxEmail)
      .maybeSingle<BookingEmailThreadRow>();

    if (error) throw new Error(error.message);
    return data;
  }

  async function getLatestConversationAnchor(bookingId: string, mailboxEmail: string) {
    const { data: latestMessage, error: messageError } = await supabaseAdmin
      .from("booking_email_messages")
      .select("subject, message_id_header, references_header")
      .eq("booking_id", bookingId)
      .eq("mailbox_email", mailboxEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ subject?: string | null; message_id_header?: string | null; references_header?: string | null }>();

    if (messageError) throw new Error(messageError.message);
    if (latestMessage?.message_id_header) {
      return {
        subject: latestMessage.subject ?? null,
        messageIdHeader: latestMessage.message_id_header ?? null,
        referencesHeader: latestMessage.references_header ?? latestMessage.message_id_header ?? null,
      };
    }
    return {
      subject: null,
      messageIdHeader: null,
      referencesHeader: null,
    };
  }

  async function upsertBookingThread(args: {
    bookingId: string;
    mailboxEmail: string;
    providerThreadId?: string | null;
    subject?: string | null;
    status?: string | null;
    historyId?: string | null;
    lastMessageAt?: string | null;
  }) {
    const existing = await getThreadForBooking(args.bookingId, args.mailboxEmail);
    const payload = {
      booking_id: args.bookingId,
      provider: "gmail",
      mailbox_email: args.mailboxEmail,
      provider_thread_id: args.providerThreadId ?? existing?.provider_thread_id ?? null,
      subject: args.subject ?? existing?.subject ?? null,
      status: args.status ?? existing?.status ?? "active",
      history_id: args.historyId ?? existing?.history_id ?? null,
      last_message_at: args.lastMessageAt ?? existing?.last_message_at ?? null,
      last_synced_at: new Date().toISOString(),
    };

    const query = existing
      ? supabaseAdmin.from("booking_email_threads").update(payload).eq("id", existing.id)
      : supabaseAdmin.from("booking_email_threads").insert(payload);

    const { data, error } = await query.select("*").single<BookingEmailThreadRow>();
    if (error || !data) throw new Error(error?.message ?? "Failed to upsert booking email thread");
    return data;
  }

  async function upsertBookingMessage(args: {
    bookingId: string;
    threadId?: string | null;
    mailboxEmail: string;
    providerMessageId?: string | null;
    providerThreadId?: string | null;
    direction: "outbound";
    messageIdHeader?: string | null;
    inReplyTo?: string | null;
    referencesHeader?: string | null;
    fromEmail?: string | null;
    toEmail?: string | null;
    subject?: string | null;
    snippet?: string | null;
    bodyText?: string | null;
    bodyHtml?: string | null;
    sentAt?: string | null;
    payload?: Record<string, unknown>;
  }) {
    const { data: existing, error: existingError } = args.providerMessageId
      ? await supabaseAdmin
        .from("booking_email_messages")
        .select("id")
        .eq("provider", "gmail")
        .eq("mailbox_email", args.mailboxEmail)
        .eq("provider_message_id", args.providerMessageId)
        .maybeSingle<{ id: string }>()
      : { data: null, error: null };

    if (existingError) throw new Error(existingError.message);

  const payload = {
      thread_id: args.threadId ?? null,
      booking_id: args.bookingId,
      provider: "gmail",
      direction: args.direction,
      mailbox_email: args.mailboxEmail,
      provider_message_id: args.providerMessageId ?? null,
      provider_thread_id: args.providerThreadId ?? null,
      message_id_header: args.messageIdHeader ?? null,
      in_reply_to: args.inReplyTo ?? null,
      references_header: args.referencesHeader ?? null,
      from_email: args.fromEmail ?? null,
      to_email: args.toEmail ?? null,
      subject: args.subject ?? null,
      snippet: args.snippet ?? null,
      body_text: args.bodyText ?? null,
      body_html: args.bodyHtml ?? null,
      sent_at: args.sentAt ?? null,
      received_at: args.sentAt ?? null,
      payload: args.payload ?? {},
    };

    const query = existing?.id
      ? supabaseAdmin.from("booking_email_messages").update(payload).eq("id", existing.id)
      : supabaseAdmin.from("booking_email_messages").insert(payload);

    const { error } = await query;
    if (error) throw new Error(error.message);
  }

  function buildRawMessage(messageArgs: {
    subject: string;
    text: string;
    html: string;
    inReplyTo?: string | null;
    referencesHeader?: string | null;
    icsContent?: string;
    icsFilename?: string;
  }) {
    const rootBoundary = `mitra-auto-${randomToken().slice(0, 12)}`;
    const altBoundary = `mitra-auto-alt-${randomToken().slice(0, 10)}`;
    const messageId = `<booking-${args.booking.id}-${randomToken().slice(0, 6)}@mitra-auto.fi>`;
    const lines = [
      `From: ${senderAddress()}`,
      `To: ${args.to}`,
      `Reply-To: ${replyToEmail()}`,
      `Subject: ${encodeMimeHeader(messageArgs.subject)}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: ${messageId}`,
      "MIME-Version: 1.0",
    ];

    if (messageArgs.inReplyTo) lines.push(`In-Reply-To: ${messageArgs.inReplyTo}`);
    if (messageArgs.referencesHeader) lines.push(`References: ${messageArgs.referencesHeader}`);

    if (messageArgs.icsContent) {
      const method = messageArgs.icsContent.includes("METHOD:CANCEL") ? "CANCEL" : "REQUEST";
      lines.push(`Content-Type: multipart/mixed; boundary="${rootBoundary}"`, "");
      lines.push(
        `--${rootBoundary}`,
        `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
        "",
        `--${altBoundary}`,
        "Content-Type: text/plain; charset=UTF-8",
        "Content-Transfer-Encoding: 8bit",
        "",
        messageArgs.text,
        `--${altBoundary}`,
        "Content-Type: text/html; charset=UTF-8",
        "Content-Transfer-Encoding: 8bit",
        "",
        messageArgs.html,
        `--${altBoundary}--`,
        `--${rootBoundary}`,
        `Content-Type: text/calendar; charset=UTF-8; method=${method}; name="${messageArgs.icsFilename ?? "booking.ics"}"`,
        "Content-Transfer-Encoding: base64",
        `Content-Disposition: attachment; filename="${messageArgs.icsFilename ?? "booking.ics"}"`,
        "",
        toBase64Utf8(messageArgs.icsContent),
        `--${rootBoundary}--`,
      );
    } else {
      lines.push(`Content-Type: multipart/alternative; boundary="${altBoundary}"`, "");
      lines.push(
        `--${altBoundary}`,
        "Content-Type: text/plain; charset=UTF-8",
        "Content-Transfer-Encoding: 8bit",
        "",
        messageArgs.text,
        `--${altBoundary}`,
        "Content-Type: text/html; charset=UTF-8",
        "Content-Transfer-Encoding: 8bit",
        "",
        messageArgs.html,
        `--${altBoundary}--`,
      );
    }

    return { raw: lines.join("\r\n"), messageId };
  }

  const mailboxEmail = gmailMailboxEmail();
  const existingThread = await getThreadForBooking(args.booking.id, mailboxEmail);
  const { data: latestThreadMessage, error: latestThreadMessageError } = existingThread
    ? await supabaseAdmin
      .from("booking_email_messages")
      .select("message_id_header, references_header")
      .eq("thread_id", existingThread.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ message_id_header?: string | null; references_header?: string | null }>()
    : { data: null, error: null };

  if (latestThreadMessageError) throw new Error(latestThreadMessageError.message);
  const anchor = latestThreadMessage?.message_id_header
    ? {
        subject: existingThread?.subject ?? null,
        messageIdHeader: latestThreadMessage.message_id_header ?? null,
        referencesHeader: latestThreadMessage.references_header ?? latestThreadMessage.message_id_header ?? null,
      }
    : await getLatestConversationAnchor(args.booking.id, mailboxEmail);

  const finalSubject = args.subject.trim();
  const shouldThread = args.type === "message";
  const rawMessage = buildRawMessage({
    subject: finalSubject,
    text: args.text,
    html: args.html,
    inReplyTo: shouldThread ? (anchor.messageIdHeader ?? null) : null,
    referencesHeader: shouldThread ? (anchor.referencesHeader ?? anchor.messageIdHeader ?? null) : null,
    icsContent: args.icsContent,
    icsFilename: args.icsFilename,
  });

  const result = await gmailApi<{ id: string; threadId: string; historyId?: string; internalDate?: string }>(
    mailboxEmail,
    "/messages/send",
    "POST",
    {
      raw: toBase64Url(rawMessage.raw),
      ...(shouldThread && existingThread?.provider_thread_id ? { threadId: existingThread.provider_thread_id } : {}),
    },
  );

  const sentAt = result.internalDate ? new Date(Number(result.internalDate)).toISOString() : new Date().toISOString();
  const thread = await upsertBookingThread({
    bookingId: args.booking.id,
    mailboxEmail,
    providerThreadId: result.threadId,
    subject: finalSubject,
    historyId: result.historyId ?? null,
    lastMessageAt: sentAt,
  });

  await upsertBookingMessage({
    bookingId: args.booking.id,
    threadId: thread.id,
    mailboxEmail,
    providerMessageId: result.id,
    providerThreadId: result.threadId,
    direction: "outbound",
    messageIdHeader: rawMessage.messageId,
    inReplyTo: anchor.messageIdHeader ?? null,
    referencesHeader: anchor.referencesHeader ?? anchor.messageIdHeader ?? null,
    fromEmail: senderAddress(),
    toEmail: args.to,
    subject: finalSubject,
    snippet: args.text.slice(0, 255),
    bodyText: args.text,
    bodyHtml: args.html,
    sentAt,
    payload: {
      booking_mail_type: args.type,
      gmail_history_id: result.historyId ?? null,
    },
  });

  await updateGmailSyncState(mailboxEmail, {
    history_id: result.historyId ?? null,
    last_error: null,
  });

  return {
    id: rawMessage.messageId,
    providerMessageId: result.id,
    threadId: result.threadId,
  };
}

async function recordEmailEvent(bookingId: string, eventType: string, recipientEmail: string | null, payload: Record<string, unknown>) {
  const primaryInsert = await supabaseAdmin.from("booking_email_events").insert({
    booking_id: bookingId,
    event_type: eventType,
    recipient_email: recipientEmail,
    payload,
  });

  if (!primaryInsert.error) return;
  if (!primaryInsert.error.message.includes("payload")) {
    throw new Error(primaryInsert.error.message);
  }

  const fallbackInsert = await supabaseAdmin.from("booking_email_events").insert({
    booking_id: bookingId,
    event_type: eventType,
    recipient_email: recipientEmail,
  });

  if (fallbackInsert.error) {
    throw new Error(fallbackInsert.error.message);
  }
}

async function updateBookingAfterSend(bookingId: string, patch: Partial<BookingRow>) {
  return await persistBookingLifecycleState(bookingId, patch);
}

export async function sendManagedBookingMail(args: {
  bookingId: string;
  type: BookingMailType;
  customSubject?: string;
  customMessage?: string;
  recipientEmail?: string | null;
  incrementSequence?: boolean;
}) {
  let booking = await findBooking(args.bookingId);
  const normalizedStatus = (booking.status ?? "confirmed").toLowerCase();
  if (normalizedStatus === "cancelled" && args.type !== "cancellation") {
    throw new Error("Cancelled bookings can only receive cancellation emails");
  }
  const hadPreviousInvite = Boolean(booking.ics_last_sent_at);
  const recipientEmail = normalizeBookingText(args.recipientEmail ?? booking.customer_email);
  if (recipientEmail && recipientEmail !== booking.customer_email) {
    booking = await persistBookingLifecycleState(booking.id, {
      customer_email: recipientEmail,
    });
  }
  const actionState = args.type === "cancellation"
    ? "cancelled"
    : getMissingCustomerFields(booking).length > 0
    ? "awaiting_completion"
    : "active";
  const ensured = await issueManageToken(booking, {
    recipientEmail: recipientEmail || null,
    actionState,
  });
  booking = ensured.booking;
  const token = ensured.token;
  const language = normalizeLanguage(booking.booking_language);
  const manageUrl = recipientEmail && token ? buildManageUrl(token, language) : undefined;

  let sequence = booking.ics_sequence ?? 0;
  if (args.incrementSequence) {
    sequence += 1;
    booking = await updateBookingAfterSend(booking.id, {
      ics_sequence: sequence,
      calendar_uid: booking.calendar_uid ?? getCalendarUid(booking.id),
    });
  }

  if (!recipientEmail) return { ok: true, skipped: true };

  const subject = buildSubject(args.type, booking, args.customSubject);
  const html = buildHtmlBody(args.type, booking, manageUrl, args.customMessage);
  const text = buildTextBody(args.type, booking, manageUrl, args.customMessage);
  const icsMethod = args.type === "cancellation" ? "CANCEL" : args.type === "message" ? undefined : "REQUEST";
  const icsContent = icsMethod ? buildIcsContent(booking, icsMethod) : undefined;

  const sendResult = await sendEmail({
    booking,
    type: args.type,
    to: recipientEmail,
    subject,
    html,
    text,
    icsContent,
    icsFilename: `${booking.id}-${args.type}.ics`,
  });

  booking = await updateBookingAfterSend(booking.id, {
    ics_last_sent_at: new Date().toISOString(),
    calendar_last_sent_at: new Date().toISOString(),
  });

  try {
    await recordEmailEvent(
      booking.id,
      args.type === "confirmation" && hadPreviousInvite ? "confirmation_resent" : args.type,
      recipientEmail,
      {
        subject,
        manage_url: manageUrl,
        message_id: sendResult?.id ?? null,
        provider_message_id: sendResult?.providerMessageId ?? null,
        provider_thread_id: sendResult?.threadId ?? null,
        provider: "gmail",
      },
    );
  } catch (error) {
    console.error("Failed to record booking email event", error);
  }

  return { ok: true, booking: bookingResponse(booking), manageUrl };
}

export function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...(init.headers ?? {}),
    },
  });
}

export async function withCors(request: Request, handler: () => Promise<Response>) {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    return await handler();
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    );
  }
}

function assertManageActionAllowed(booking: BookingRow, action: BookingManageAction) {
  const cancelled = (booking.status ?? "confirmed").toLowerCase() === "cancelled";
  const inFuture = isBookingInTheFuture(booking);

  if (action === "available_slots") {
    if (cancelled) throw new Error("This booking is already cancelled");
    return;
  }

  if (action === "get_booking" || action === "validate_booking" || action === "view_booking") {
    return;
  }

  if (cancelled) {
    throw new Error("This booking is already cancelled");
  }

  if (!inFuture) {
    throw new Error("This booking can no longer be changed");
  }

  if (action === "complete_missing_fields") {
    return;
  }

  if (action !== "cancel_booking" && !isBookingMutable(booking)) {
    throw new Error("This booking can no longer be changed");
  }
}

function normalizeActionField(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function buildCustomerUpdatePatch(body: Record<string, unknown>, booking: BookingRow) {
  const patch: Partial<BookingRow> = {
    status: "confirmed",
  };

  const licensePlate = normalizeBookingPlate(body.licensePlate ?? body.license_plate);
  const customerName = normalizeActionField(body.customerName ?? body.customer_name);
  const customerPhone = normalizeActionField(body.customerPhone ?? body.customer_phone);
  const customerEmail = normalizeActionField(body.customerEmail ?? body.customer_email);
  const notes = normalizeActionField(body.notes);
  const bookingDate = normalizeActionField(body.bookingDate ?? body.booking_date);
  const bookingTime = normalizeActionField(body.bookingTime ?? body.booking_time).slice(0, 5);

  if (licensePlate) patch.license_plate = licensePlate;
  if (customerName) patch.customer_name = customerName;
  if (customerPhone) patch.customer_phone = customerPhone;
  if (customerEmail) patch.customer_email = customerEmail;
  if (notes || body.notes === "") patch.notes = notes || null;

  if (bookingDate && bookingDate !== booking.booking_date) patch.booking_date = bookingDate;
  if (bookingTime && bookingTime !== booking.booking_time.slice(0, 5)) patch.booking_time = bookingTime;

  if (!patch.license_plate && !patch.customer_name && !patch.customer_phone && !patch.customer_email && patch.notes === undefined && !patch.booking_date && !patch.booking_time) {
    throw new Error("No valid booking fields were provided");
  }

  return patch;
}

function buildCompletionPatch(body: Record<string, unknown>, booking: BookingRow) {
  const missing = new Set(getMissingCustomerFields(booking));
  const patch: Partial<BookingRow> = {
    status: "confirmed",
  };

  const licensePlate = normalizeBookingPlate(body.licensePlate ?? body.license_plate);
  const customerName = normalizeActionField(body.customerName ?? body.customer_name);
  const customerPhone = normalizeActionField(body.customerPhone ?? body.customer_phone);
  const customerEmail = normalizeActionField(body.customerEmail ?? body.customer_email);
  const notes = normalizeActionField(body.notes);

  if (missing.has("licensePlate")) {
    if (!licensePlate) throw new Error("Missing license plate");
    patch.license_plate = licensePlate;
  }

  if (missing.has("customerName") && customerName) patch.customer_name = customerName;
  if (missing.has("customerPhone")) {
    if (!customerPhone) throw new Error("Missing customer phone");
    patch.customer_phone = customerPhone;
  }
  if (missing.has("customerEmail")) {
    if (!customerEmail) throw new Error("Missing customer email");
    patch.customer_email = customerEmail;
  }
  if (missing.has("licensePlate") && !patch.license_plate) {
    throw new Error("Missing license plate");
  }
  if (notes || body.notes === "") patch.notes = notes || null;

  if (!patch.license_plate && !patch.customer_name && !patch.customer_phone && !patch.customer_email && patch.notes === undefined) {
    throw new Error("No missing fields were provided");
  }

  return patch;
}

async function sendLifecycleMailForBooking(bookingId: string, type: BookingMailType, incrementSequence: boolean) {
  return await sendManagedBookingMail({
    bookingId,
    type,
    incrementSequence,
  });
}

export async function handleBookingManageAction(action: BookingManageAction, body: Record<string, unknown>) {
  if (action === "get_booking" || action === "validate_booking" || action === "view_booking") {
    const booking = await validateManageToken(String(body.token ?? ""));
    assertManageActionAllowed(booking, action);
    return {
      booking: bookingResponse(booking),
    };
  }

  if (action === "available_slots") {
    const booking = await validateManageToken(String(body.token ?? ""));
    assertManageActionAllowed(booking, action);
    const date = String(body.date ?? booking.booking_date);
    const slots = await getAvailableSlots(date, booking.id);
    return { slots };
  }

  if (action === "cancel_booking") {
    const booking = await validateManageToken(String(body.token ?? ""));
    assertManageActionAllowed(booking, action);
    if ((booking.status ?? "confirmed").toLowerCase() === "cancelled") {
      return { booking: bookingResponse(booking) };
    }

    const cancellationNote = String(body.cancellationNote ?? "").trim() || null;
    const data = await persistBookingLifecycleState(booking.id, {
      status: "cancelled",
      cancellation_note: cancellationNote,
      customer_last_action_at: new Date().toISOString(),
      customer_action_state: "cancelled",
      calendar_uid: booking.calendar_uid ?? getCalendarUid(booking.id),
    });

    const mailResult = await sendLifecycleMailForBooking(data.id, "cancellation", true);

    return {
      booking: mailResult.booking ?? bookingResponse(data),
    };
  }

  if (action === "complete_missing_fields") {
    const booking = await validateManageToken(String(body.token ?? ""));
    assertManageActionAllowed(booking, action);

    const missingBefore = getMissingCustomerFields(booking);
    if (missingBefore.length === 0) {
      return { booking: bookingResponse(booking) };
    }

    const patch = buildCompletionPatch(body, booking);
    const data = await persistBookingLifecycleState(booking.id, {
      ...patch,
      customer_last_action_at: new Date().toISOString(),
      customer_action_state: getMissingCustomerFields({
        ...booking,
        ...patch,
      }).length > 0 ? "awaiting_completion" : "active",
      status: "confirmed",
      calendar_uid: booking.calendar_uid ?? getCalendarUid(booking.id),
    });

    const mailType = getMissingCustomerFields(data).length > 0 ? "update" : "confirmation";
    const mailResult = await sendLifecycleMailForBooking(data.id, mailType, true);

    return {
      booking: mailResult.booking ?? bookingResponse(data),
    };
  }

  if (action === "update_booking") {
    const booking = await validateManageToken(String(body.token ?? ""));
    assertManageActionAllowed(booking, action);
    const patch = buildCustomerUpdatePatch(body, booking);
    const nextDate = patch.booking_date ?? booking.booking_date;
    const nextTime = patch.booking_time ?? booking.booking_time.slice(0, 5);
    if (nextDate !== booking.booking_date || nextTime !== booking.booking_time.slice(0, 5)) {
      const availableSlots = await getAvailableSlots(nextDate, booking.id);
      if (!availableSlots.includes(nextTime)) {
        throw new Error("Selected booking slot is no longer available");
      }
    }
    const data = await persistBookingLifecycleState(booking.id, {
      ...patch,
      customer_last_action_at: new Date().toISOString(),
      customer_action_state: getMissingCustomerFields({
        ...booking,
        ...patch,
      }).length > 0 ? "awaiting_completion" : "active",
      status: "confirmed",
      calendar_uid: booking.calendar_uid ?? getCalendarUid(booking.id),
    });

    const mailResult = await sendLifecycleMailForBooking(data.id, "update", true);

    return {
      booking: mailResult.booking ?? bookingResponse(data),
    };
  }

  throw new Error(`Unsupported action: ${action}`);
}
