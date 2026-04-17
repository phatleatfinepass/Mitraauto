import { BookingRow, corsHeaders, jsonResponse, supabaseAdmin } from "./booking.ts";

type GmailOAuthStateRow = {
  state: string;
  mailbox_email: string;
  redirect_to?: string | null;
  expires_at: string;
  consumed_at?: string | null;
};

type GmailTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

type GmailProfileResponse = {
  emailAddress: string;
  historyId?: string;
};

type GmailSyncStateRow = {
  mailbox_email: string;
  google_email?: string | null;
  access_token?: string | null;
  refresh_token?: string | null;
  token_scope?: string | null;
  token_type?: string | null;
  token_expiry?: string | null;
  history_id?: string | null;
  watch_expiration?: string | null;
  pubsub_topic?: string | null;
  last_sync_at?: string | null;
  last_error?: string | null;
};

type BookingEmailThreadRow = {
  id: string;
  booking_id: string;
  provider: string;
  mailbox_email: string;
  provider_thread_id?: string | null;
  subject?: string | null;
  status?: string | null;
  history_id?: string | null;
  last_message_at?: string | null;
  last_synced_at?: string | null;
};

type BookingConversationAnchor = {
  subject?: string | null;
  messageIdHeader?: string | null;
  referencesHeader?: string | null;
};

type GmailMessageHeader = {
  name: string;
  value: string;
};

type GmailMessagePart = {
  mimeType?: string;
  filename?: string;
  body?: {
    data?: string;
    size?: number;
  };
  headers?: GmailMessageHeader[];
  parts?: GmailMessagePart[];
};

type GmailMessageResource = {
  id: string;
  threadId: string;
  historyId?: string;
  internalDate?: string;
  snippet?: string;
  payload?: GmailMessagePart;
};

type GmailThreadResource = {
  id: string;
  historyId?: string;
  messages?: GmailMessageResource[];
};

const DEFAULT_GMAIL_MAILBOX = Deno.env.get("GMAIL_MAILBOX_EMAIL") ?? "contact@mitra-auto.fi";
const DEFAULT_GMAIL_REDIRECT_URI = Deno.env.get("GMAIL_REDIRECT_URI") ??
  "https://rcmmbwdebnmicrweoiyz.supabase.co/functions/v1/gmail_oauth_callback";
const DEFAULT_GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.send",
].join(" ");
const OAUTH_STATE_TTL_MS = 15 * 60 * 1000;
const DEFAULT_SITE_URL = Deno.env.get("BOOKING_SITE_URL") ?? Deno.env.get("SITE_URL") ?? "https://mitra-auto.fi";

function env(name: string, fallback?: string) {
  const value = Deno.env.get(name) ?? fallback;
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function randomToken(bytes = 24) {
  const buffer = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(buffer).map((item) => item.toString(16).padStart(2, "0")).join("");
}

function normalizeRedirectTo(value?: string | null) {
  if (!value?.trim()) return null;

  try {
    const site = new URL(DEFAULT_SITE_URL);
    const next = new URL(value, DEFAULT_SITE_URL);
    return next.origin === site.origin ? next.toString() : null;
  } catch {
    return null;
  }
}

function gmailClientId() {
  return env("GMAIL_CLIENT_ID");
}

function gmailClientSecret() {
  return env("GMAIL_CLIENT_SECRET");
}

function gmailMailboxEmail() {
  return env("GMAIL_MAILBOX_EMAIL", DEFAULT_GMAIL_MAILBOX).trim().toLowerCase();
}

function gmailRedirectUri() {
  return env("GMAIL_REDIRECT_URI", DEFAULT_GMAIL_REDIRECT_URI);
}

function gmailPubsubTopic() {
  return Deno.env.get("GMAIL_PUBSUB_TOPIC") ?? null;
}

function gmailMailboxLabel() {
  return gmailMailboxEmail();
}

function getHeader(headers: GmailMessageHeader[] | undefined, name: string) {
  return headers?.find((header) => header.name.toLowerCase() === name.toLowerCase())?.value ?? null;
}

function decodeBase64Url(value?: string) {
  if (!value) return "";
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

function extractBody(part?: GmailMessagePart, mimeType?: string): string {
  if (!part) return "";
  if (mimeType && part.mimeType === mimeType && part.body?.data) {
    return decodeBase64Url(part.body.data);
  }

  for (const child of part.parts ?? []) {
    const found = extractBody(child, mimeType);
    if (found) return found;
  }

  if (!mimeType && part.body?.data) {
    return decodeBase64Url(part.body.data);
  }

  return "";
}

function buildEmailAddress(name: string | null | undefined, email: string) {
  return name?.trim() ? `${name.trim()} <${email}>` : email;
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

async function updateGmailSyncState(mailboxEmail: string, patch: Partial<GmailSyncStateRow>) {
  const { error } = await supabaseAdmin
    .from("gmail_sync_state")
    .update({
      ...patch,
      last_sync_at: patch.last_sync_at ?? new Date().toISOString(),
    })
    .eq("mailbox_email", mailboxEmail);

  if (error) throw new Error(error.message);
}

async function getGmailSyncState(mailboxEmail = gmailMailboxLabel()) {
  const { data, error } = await supabaseAdmin
    .from("gmail_sync_state")
    .select("*")
    .eq("mailbox_email", mailboxEmail)
    .maybeSingle<GmailSyncStateRow>();

  if (error) throw new Error(error.message);
  if (!data) throw new Error(`No Gmail connection found for ${mailboxEmail}`);
  return data;
}

async function refreshGoogleAccessToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: gmailClientId(),
      client_secret: gmailClientSecret(),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gmail access token refresh failed: ${response.status} ${detail}`);
  }

  return await response.json() as GmailTokenResponse;
}

export async function getValidGmailAccessToken(mailboxEmail = gmailMailboxLabel()) {
  const state = await getGmailSyncState(mailboxEmail);
  const expiry = state.token_expiry ? new Date(state.token_expiry).getTime() : 0;
  const hasValidToken = state.access_token && expiry > Date.now() + 60_000;
  if (hasValidToken) return { mailboxEmail, accessToken: state.access_token!, state };
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
    mailboxEmail,
    accessToken: refreshed.access_token,
    state: {
      ...state,
      access_token: refreshed.access_token,
      token_expiry: tokenExpiry,
      token_scope: refreshed.scope ?? state.token_scope,
      token_type: refreshed.token_type ?? state.token_type,
    },
  };
}

async function gmailApi<T>(args: {
  mailboxEmail?: string;
  path: string;
  method?: string;
  body?: unknown;
}): Promise<T> {
  const { mailboxEmail, accessToken } = await getValidGmailAccessToken(args.mailboxEmail);
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me${args.path}`, {
    method: args.method ?? "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(args.body ? { "Content-Type": "application/json" } : {}),
    },
    body: args.body ? JSON.stringify(args.body) : undefined,
  });

  if (!response.ok) {
    const detail = await response.text();
    await updateGmailSyncState(mailboxEmail, {
      last_error: `Gmail API ${args.method ?? "GET"} ${args.path} failed: ${response.status} ${detail}`,
    });
    throw new Error(`Gmail API ${args.method ?? "GET"} ${args.path} failed: ${response.status} ${detail}`);
  }

  if (response.status === 204) return {} as T;
  return await response.json() as T;
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

async function getThreadForBooking(bookingId: string, mailboxEmail = gmailMailboxLabel()) {
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

async function getLatestConversationAnchor(
  bookingId: string,
  mailboxEmail = gmailMailboxLabel(),
): Promise<BookingConversationAnchor> {
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
  mailboxEmail?: string;
  providerThreadId?: string | null;
  subject?: string | null;
  status?: string | null;
  historyId?: string | null;
  lastMessageAt?: string | null;
}) {
  const mailboxEmail = (args.mailboxEmail ?? gmailMailboxLabel()).toLowerCase();
  const existing = await getThreadForBooking(args.bookingId, mailboxEmail);
  const payload = {
    booking_id: args.bookingId,
    provider: "gmail",
    mailbox_email: mailboxEmail,
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
  mailboxEmail?: string;
  providerMessageId?: string | null;
  providerThreadId?: string | null;
  direction: "inbound" | "outbound";
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
  receivedAt?: string | null;
  payload?: Record<string, unknown>;
}) {
  const mailboxEmail = (args.mailboxEmail ?? gmailMailboxLabel()).toLowerCase();
  const existingQuery = args.providerMessageId
    ? supabaseAdmin
      .from("booking_email_messages")
      .select("id")
      .eq("provider", "gmail")
      .eq("mailbox_email", mailboxEmail)
      .eq("provider_message_id", args.providerMessageId)
      .maybeSingle<{ id: string }>()
    : Promise.resolve({ data: null, error: null as { message: string } | null });

  const existing = await existingQuery;
  if (existing.error) throw new Error(existing.error.message);

  const payload = {
    thread_id: args.threadId ?? null,
    booking_id: args.bookingId,
    provider: "gmail",
    direction: args.direction,
    mailbox_email: mailboxEmail,
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
    received_at: args.receivedAt ?? null,
    payload: args.payload ?? {},
  };

  const query = existing.data
    ? supabaseAdmin.from("booking_email_messages").update(payload).eq("id", existing.data.id)
    : supabaseAdmin.from("booking_email_messages").insert(payload);

  const { error } = await query;
  if (error) throw new Error(error.message);
}

function formatRfc2822Date(date = new Date()) {
  return date.toUTCString();
}

function buildRawMessage(args: {
  fromEmail: string;
  fromName?: string | null;
  toEmail: string;
  toName?: string | null;
  subject: string;
  text: string;
  html?: string | null;
  messageId?: string;
  inReplyTo?: string | null;
  referencesHeader?: string | null;
}) {
  const boundary = `mitra-auto-${randomToken(12)}`;
  const messageId = args.messageId ?? `<booking-${randomToken(12)}@mitra-auto.fi>`;
  const lines = [
    `From: ${buildEmailAddress(args.fromName, args.fromEmail)}`,
    `To: ${buildEmailAddress(args.toName, args.toEmail)}`,
    `Subject: ${encodeMimeHeader(args.subject)}`,
    `Date: ${formatRfc2822Date()}`,
    `Message-ID: ${messageId}`,
    "MIME-Version: 1.0",
  ];

  if (args.inReplyTo) lines.push(`In-Reply-To: ${args.inReplyTo}`);
  if (args.referencesHeader) lines.push(`References: ${args.referencesHeader}`);

  if (args.html?.trim()) {
    lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`, "");
    lines.push(
      `--${boundary}`,
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: 8bit",
      "",
      args.text,
      `--${boundary}`,
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: 8bit",
      "",
      args.html,
      `--${boundary}--`,
    );
  } else {
    lines.push("Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: 8bit", "", args.text);
  }

  return { raw: lines.join("\r\n"), messageId };
}

function buildMessageBodies(booking: BookingRow, message: string) {
  const bookingSummary = [
    booking.service_name ? `Service: ${booking.service_name}` : null,
    `Date: ${booking.booking_date}`,
    `Time: ${booking.booking_time.slice(0, 5)}`,
    booking.license_plate ? `Vehicle: ${booking.license_plate}` : null,
  ].filter(Boolean).join("\n");

  const text = `${message.trim()}\n\n${bookingSummary}`.trim();
  const html = [
    `<p>${escapeHtml(message.trim()).replaceAll("\n", "<br />")}</p>`,
    "<hr />",
    "<p>",
    booking.service_name ? `<strong>Service:</strong> ${escapeHtml(booking.service_name)}<br />` : "",
    `<strong>Date:</strong> ${escapeHtml(booking.booking_date)}<br />`,
    `<strong>Time:</strong> ${escapeHtml(booking.booking_time.slice(0, 5))}<br />`,
    booking.license_plate ? `<strong>Vehicle:</strong> ${escapeHtml(booking.license_plate)}` : "",
    "</p>",
  ].join("");

  return { text, html };
}

async function recordGmailMessageFromResource(
  bookingId: string,
  thread: BookingEmailThreadRow,
  message: GmailMessageResource,
  mailboxEmail = gmailMailboxLabel(),
) {
  const headers = message.payload?.headers;
  const messageIdHeader = getHeader(headers, "Message-Id") ?? getHeader(headers, "Message-ID");
  const fromEmail = getHeader(headers, "From");
  const toEmail = getHeader(headers, "To");
  const subject = getHeader(headers, "Subject");
  const inReplyTo = getHeader(headers, "In-Reply-To");
  const referencesHeader = getHeader(headers, "References");
  const bodyText = extractBody(message.payload, "text/plain") || extractBody(message.payload);
  const bodyHtml = extractBody(message.payload, "text/html");
  const receivedAt = message.internalDate ? new Date(Number(message.internalDate)).toISOString() : null;
  const mailbox = mailboxEmail.toLowerCase();
  const direction = fromEmail?.toLowerCase().includes(mailbox) ? "outbound" : "inbound";

  await upsertBookingMessage({
    bookingId,
    threadId: thread.id,
    mailboxEmail,
    providerMessageId: message.id,
    providerThreadId: message.threadId,
    direction,
    messageIdHeader,
    inReplyTo,
    referencesHeader,
    fromEmail,
    toEmail,
    subject,
    snippet: message.snippet ?? null,
    bodyText,
    bodyHtml,
    sentAt: direction === "outbound" ? receivedAt : null,
    receivedAt,
    payload: {
      historyId: message.historyId ?? null,
    },
  });
}

export function buildGmailOAuthUrl(args: { state: string; loginHint?: string }) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", gmailClientId());
  url.searchParams.set("redirect_uri", gmailRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", DEFAULT_GMAIL_SCOPES);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", args.state);
  url.searchParams.set("login_hint", (args.loginHint ?? gmailMailboxEmail()).trim());
  return url.toString();
}

async function storeOAuthState(state: GmailOAuthStateRow) {
  const { error } = await supabaseAdmin
    .from("gmail_oauth_states")
    .upsert(state, { onConflict: "state" });

  if (error) throw new Error(error.message);
}

async function consumeOAuthState(state: string) {
  const { data, error } = await supabaseAdmin
    .from("gmail_oauth_states")
    .select("*")
    .eq("state", state)
    .single<GmailOAuthStateRow>();

  if (error || !data) throw new Error("Invalid Gmail OAuth state");
  if (data.consumed_at) throw new Error("Gmail OAuth state has already been used");
  if (new Date(data.expires_at).getTime() < Date.now()) throw new Error("Gmail OAuth state has expired");

  const { error: updateError } = await supabaseAdmin
    .from("gmail_oauth_states")
    .update({ consumed_at: new Date().toISOString() })
    .eq("state", state);

  if (updateError) throw new Error(updateError.message);
  return data;
}

async function fetchGoogleTokens(code: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: gmailClientId(),
      client_secret: gmailClientSecret(),
      redirect_uri: gmailRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gmail token exchange failed: ${response.status} ${detail}`);
  }

  return await response.json() as GmailTokenResponse;
}

async function fetchGmailProfile(accessToken: string) {
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gmail profile fetch failed: ${response.status} ${detail}`);
  }

  return await response.json() as GmailProfileResponse;
}

async function upsertGmailSyncState(args: {
  mailboxEmail: string;
  googleEmail: string;
  accessToken: string;
  refreshToken?: string;
  scope?: string;
  tokenType?: string;
  expiresIn: number;
  historyId?: string;
}) {
  const now = new Date();
  const tokenExpiry = new Date(now.getTime() + args.expiresIn * 1000).toISOString();
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("gmail_sync_state")
    .select("refresh_token")
    .eq("mailbox_email", args.mailboxEmail)
    .maybeSingle<{ refresh_token?: string | null }>();

  if (existingError) throw new Error(existingError.message);

  const { error } = await supabaseAdmin
    .from("gmail_sync_state")
    .upsert({
      mailbox_email: args.mailboxEmail,
      provider: "gmail",
      google_email: args.googleEmail,
      access_token: args.accessToken,
      refresh_token: args.refreshToken ?? existing?.refresh_token ?? null,
      token_scope: args.scope ?? null,
      token_type: args.tokenType ?? null,
      token_expiry: tokenExpiry,
      history_id: args.historyId ?? null,
      pubsub_topic: gmailPubsubTopic(),
      connected_at: now.toISOString(),
      disconnected_at: null,
      last_error: null,
    }, { onConflict: "mailbox_email" });

  if (error) throw new Error(error.message);
}

function successHtml(redirectTo?: string | null) {
  const safeRedirect = redirectTo?.trim();
  const content = [
    "<!doctype html>",
    "<html><head><meta charset=\"utf-8\" /><title>Gmail Connected</title></head>",
    "<body style=\"font-family:Arial,sans-serif;padding:32px;line-height:1.5;\">",
    "<h1>Gmail connected</h1>",
    "<p>The mailbox connection has been saved for the booking CMS.</p>",
    safeRedirect
      ? `<p><a href="${escapeHtml(safeRedirect)}">Return to CMS</a></p><script>window.setTimeout(function(){window.location.href=${JSON.stringify(safeRedirect)};},1200);</script>`
      : "<p>You can close this window now.</p>",
    "</body></html>",
  ];

  return new Response(content.join(""), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      ...corsHeaders,
    },
  });
}

function errorHtml(message: string) {
  const content = [
    "<!doctype html>",
    "<html><head><meta charset=\"utf-8\" /><title>Gmail Connection Failed</title></head>",
    "<body style=\"font-family:Arial,sans-serif;padding:32px;line-height:1.5;\">",
    "<h1>Gmail connection failed</h1>",
    `<p>${escapeHtml(message)}</p>`,
    "</body></html>",
  ];

  return new Response(content.join(""), {
    status: 400,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      ...corsHeaders,
    },
  });
}

export async function handleGmailOAuthStart(request: Request) {
  const url = new URL(request.url);
  const redirectTo = normalizeRedirectTo(url.searchParams.get("redirect_to"));
  const mailboxEmail = gmailMailboxEmail();
  const state = randomToken();
  const expiresAt = new Date(Date.now() + OAUTH_STATE_TTL_MS).toISOString();
  await storeOAuthState({
    state,
    mailbox_email: mailboxEmail,
    redirect_to: redirectTo,
    expires_at: expiresAt,
  });

  const authUrl = buildGmailOAuthUrl({
    state,
    loginHint: mailboxEmail,
  });

  if (url.searchParams.get("format") === "json" || request.headers.get("accept")?.includes("application/json")) {
    return jsonResponse({
      ok: true,
      authUrl,
      state,
      redirectUri: gmailRedirectUri(),
      mailboxEmail,
    });
  }

  return Response.redirect(authUrl, 302);
}

export async function handleGmailOAuthCallback(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code")?.trim();
    const state = url.searchParams.get("state")?.trim();
    const oauthError = url.searchParams.get("error")?.trim();

    if (oauthError) return errorHtml(`Google returned an error: ${oauthError}`);
    if (!code) return errorHtml("Missing Google authorization code");
    if (!state) return errorHtml("Missing Gmail OAuth state");

    const savedState = await consumeOAuthState(state);
    const tokenResponse = await fetchGoogleTokens(code);
    const profile = await fetchGmailProfile(tokenResponse.access_token);
    const expectedMailbox = savedState.mailbox_email.trim().toLowerCase();
    const actualMailbox = profile.emailAddress.trim().toLowerCase();

    if (actualMailbox !== expectedMailbox) {
      throw new Error(`Connected mailbox ${actualMailbox} does not match expected mailbox ${expectedMailbox}`);
    }

    await upsertGmailSyncState({
      mailboxEmail: expectedMailbox,
      googleEmail: profile.emailAddress,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      scope: tokenResponse.scope,
      tokenType: tokenResponse.token_type,
      expiresIn: tokenResponse.expires_in,
      historyId: profile.historyId,
    });

    return successHtml(savedState.redirect_to);
  } catch (error) {
    return errorHtml(error instanceof Error ? error.message : String(error));
  }
}

export async function sendGmailBookingMessage(args: {
  bookingId: string;
  subject: string;
  message: string;
  mailboxEmail?: string;
}) {
  const mailboxEmail = (args.mailboxEmail ?? gmailMailboxLabel()).toLowerCase();
  const booking = await findBooking(args.bookingId);
  const recipientEmail = booking.customer_email?.trim();
  if (!recipientEmail) throw new Error("Booking is missing customer email");

  const existingThread = await getThreadForBooking(args.bookingId, mailboxEmail);
  const threadMessages = existingThread
    ? await supabaseAdmin
      .from("booking_email_messages")
      .select("message_id_header, references_header")
      .eq("thread_id", existingThread.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ message_id_header?: string | null; references_header?: string | null }>()
    : { data: null, error: null as { message: string } | null };

  if (threadMessages.error) throw new Error(threadMessages.error.message);
  const anchor = threadMessages.data?.message_id_header
    ? {
        subject: existingThread?.subject ?? null,
        messageIdHeader: threadMessages.data.message_id_header ?? null,
        referencesHeader: threadMessages.data.references_header ?? threadMessages.data.message_id_header ?? null,
      }
    : await getLatestConversationAnchor(args.bookingId, mailboxEmail);

  const finalSubject = (existingThread?.subject ?? anchor.subject ?? args.subject).trim();

  const bodies = buildMessageBodies(booking, args.message);
  const rawMessage = buildRawMessage({
    fromEmail: mailboxEmail,
    fromName: "Mitra Auto",
    toEmail: recipientEmail,
    toName: booking.customer_name ?? null,
    subject: finalSubject,
    text: bodies.text,
    html: bodies.html,
    inReplyTo: anchor.messageIdHeader ?? null,
    referencesHeader: anchor.referencesHeader ?? anchor.messageIdHeader ?? null,
  });

  const result = await gmailApi<GmailMessageResource>({
    mailboxEmail,
    path: "/messages/send",
    method: "POST",
    body: {
      raw: toBase64Url(rawMessage.raw),
      ...(existingThread?.provider_thread_id ? { threadId: existingThread.provider_thread_id } : {}),
    },
  });

  const thread = await upsertBookingThread({
    bookingId: args.bookingId,
    mailboxEmail,
    providerThreadId: result.threadId,
    subject: finalSubject,
    historyId: result.historyId ?? null,
    lastMessageAt: result.internalDate ? new Date(Number(result.internalDate)).toISOString() : new Date().toISOString(),
  });

  await upsertBookingMessage({
    bookingId: args.bookingId,
    threadId: thread.id,
    mailboxEmail,
    providerMessageId: result.id,
    providerThreadId: result.threadId,
    direction: "outbound",
    messageIdHeader: rawMessage.messageId,
    inReplyTo: anchor.messageIdHeader ?? null,
    referencesHeader: anchor.referencesHeader ?? anchor.messageIdHeader ?? null,
    fromEmail: mailboxEmail,
    toEmail: recipientEmail,
    subject: finalSubject,
    snippet: args.message.trim().slice(0, 255),
    bodyText: bodies.text,
    bodyHtml: bodies.html,
    sentAt: new Date().toISOString(),
    payload: {
      gmailMessageId: result.id,
      gmailThreadId: result.threadId,
    },
  });

  await updateGmailSyncState(mailboxEmail, {
    history_id: result.historyId ?? null,
    last_error: null,
  });

  return {
    ok: true,
    bookingId: args.bookingId,
    provider: "gmail",
    threadId: result.threadId,
    messageId: result.id,
  };
}

export async function syncGmailBookingThreads(args: {
  bookingId?: string;
  mailboxEmail?: string;
}) {
  const mailboxEmail = (args.mailboxEmail ?? gmailMailboxLabel()).toLowerCase();
  const query = supabaseAdmin
    .from("booking_email_threads")
    .select("*")
    .eq("provider", "gmail")
    .eq("mailbox_email", mailboxEmail)
    .not("provider_thread_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(args.bookingId ? 1 : 25);

  if (args.bookingId) query.eq("booking_id", args.bookingId);
  const { data: threads, error } = await query.returns<BookingEmailThreadRow[]>();
  if (error) throw new Error(error.message);

  const results: Array<{ bookingId: string; threadId: string; messageCount: number }> = [];

  for (const thread of threads ?? []) {
    if (!thread.provider_thread_id) continue;
    const gmailThread = await gmailApi<GmailThreadResource>({
      mailboxEmail,
      path: `/threads/${encodeURIComponent(thread.provider_thread_id)}?format=full`,
    });

    let lastMessageAt: string | null = null;
    for (const message of gmailThread.messages ?? []) {
      const receivedAt = message.internalDate ? new Date(Number(message.internalDate)).toISOString() : null;
      if (receivedAt && (!lastMessageAt || receivedAt > lastMessageAt)) lastMessageAt = receivedAt;
      await recordGmailMessageFromResource(thread.booking_id, thread, message, mailboxEmail);
    }

    await upsertBookingThread({
      bookingId: thread.booking_id,
      mailboxEmail,
      providerThreadId: gmailThread.id,
      subject: thread.subject ?? null,
      historyId: gmailThread.historyId ?? thread.history_id ?? null,
      lastMessageAt,
    });

    results.push({
      bookingId: thread.booking_id,
      threadId: gmailThread.id,
      messageCount: gmailThread.messages?.length ?? 0,
    });
  }

  await updateGmailSyncState(mailboxEmail, {
    last_error: null,
  });

  return {
    ok: true,
    synced: results.length,
    results,
  };
}

export async function getBookingConversation(args: {
  bookingId: string;
  mailboxEmail?: string;
  sync?: boolean;
}) {
  const mailboxEmail = (args.mailboxEmail ?? gmailMailboxLabel()).toLowerCase();
  const booking = await findBooking(args.bookingId);

  if (args.sync) {
    await syncGmailBookingThreads({
      bookingId: args.bookingId,
      mailboxEmail,
    });
  }

  const { data: thread, error: threadError } = await supabaseAdmin
    .from("booking_email_threads")
    .select("*")
    .eq("booking_id", args.bookingId)
    .eq("provider", "gmail")
    .eq("mailbox_email", mailboxEmail)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<BookingEmailThreadRow>();

  if (threadError) throw new Error(threadError.message);

  const { data: messages, error: messageError } = await supabaseAdmin
    .from("booking_email_messages")
    .select(`
      id,
      thread_id,
      booking_id,
      provider,
      direction,
      mailbox_email,
      provider_message_id,
      provider_thread_id,
      message_id_header,
      in_reply_to,
      references_header,
      from_email,
      to_email,
      subject,
      snippet,
      body_text,
      body_html,
      sent_at,
      received_at,
      created_at
    `)
    .eq("booking_id", args.bookingId)
    .eq("provider", "gmail")
    .eq("mailbox_email", mailboxEmail)
    .order("sent_at", { ascending: true, nullsFirst: false })
    .order("received_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (messageError) throw new Error(messageError.message);

  return {
    ok: true,
    booking: {
      id: booking.id,
      customerName: booking.customer_name ?? null,
      customerEmail: booking.customer_email ?? null,
      status: booking.status ?? null,
      serviceName: booking.service_name ?? null,
      bookingDate: booking.booking_date,
      bookingTime: booking.booking_time,
      licensePlate: booking.license_plate ?? null,
    },
    mailboxEmail,
    thread: thread
      ? {
          id: thread.id,
          provider: thread.provider,
          providerThreadId: thread.provider_thread_id ?? null,
          subject: thread.subject ?? null,
          status: thread.status ?? null,
          historyId: thread.history_id ?? null,
          lastMessageAt: thread.last_message_at ?? null,
          lastSyncedAt: thread.last_synced_at ?? null,
        }
      : null,
    messages: (messages ?? []).map((message) => ({
      id: message.id,
      threadId: message.thread_id,
      provider: message.provider,
      direction: message.direction,
      mailboxEmail: message.mailbox_email,
      providerMessageId: message.provider_message_id,
      providerThreadId: message.provider_thread_id,
      messageIdHeader: message.message_id_header,
      inReplyTo: message.in_reply_to,
      referencesHeader: message.references_header,
      fromEmail: message.from_email,
      toEmail: message.to_email,
      subject: message.subject,
      snippet: message.snippet,
      bodyText: message.body_text,
      bodyHtml: message.body_html,
      sentAt: message.sent_at,
      receivedAt: message.received_at,
      createdAt: message.created_at,
    })),
  };
}
