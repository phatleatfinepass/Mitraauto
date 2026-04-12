import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const TABLE = 'pwa_push_subscriptions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function getEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

function formatDateInHelsinki(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Helsinki',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function isBookingAcknowledged(booking: { created_at: string | null; updated_at: string | null }) {
  if (!booking.created_at || !booking.updated_at) {
    return false;
  }

  const createdAt = new Date(booking.created_at).getTime();
  const updatedAt = new Date(booking.updated_at).getTime();

  if (!Number.isFinite(createdAt) || !Number.isFinite(updatedAt)) {
    return false;
  }

  return updatedAt - createdAt > 1000;
}

async function countBookingAttentionItems() {
  const startDate = formatDateInHelsinki(new Date());
  const endDate = formatDateInHelsinki(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const { data, error } = await supabase
    .from('bookings')
    .select('id, status, created_at, updated_at, booking_date')
    .gte('booking_date', startDate)
    .lte('booking_date', endDate)
    .not('status', 'in', '(cancelled,handoff)');

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).filter((booking) => !isBookingAcknowledged(booking)).length;
}

async function getSubscriptions() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('endpoint, subscription');

  if (error) {
    throw new Error(error.message);
  }

  const seen = new Set<string>();
  const unique = [];

  for (const entry of data ?? []) {
    const endpoint = entry?.endpoint;
    if (!endpoint || seen.has(endpoint)) {
      continue;
    }
    seen.add(endpoint);
    unique.push(entry);
  }

  return unique;
}

async function removeSubscription(endpoint: string) {
  await supabase.from(TABLE).delete().eq('endpoint', endpoint);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const booking = body?.booking;
    if (!booking?.id) {
      throw new Error('Missing booking payload');
    }

    webpush.setVapidDetails(
      getEnv('WEB_PUSH_SUBJECT'),
      getEnv('WEB_PUSH_VAPID_PUBLIC_KEY'),
      getEnv('WEB_PUSH_VAPID_PRIVATE_KEY'),
    );

    const badgeCount = await countBookingAttentionItems();
    const subscriptions = await getSubscriptions();
    const payload = JSON.stringify({
      title: 'New booking',
      body: [booking.license_plate, booking.customer_name, `${booking.booking_date} ${booking.booking_time}`]
        .filter(Boolean)
        .join(' • '),
      tag: `booking-${booking.id}`,
      badgeCount,
      icon: '/icons/mitra-app-icon-512.png',
      badge: '/icons/mitra-app-icon-512.png',
      data: { url: '/cms/booking' },
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (entry: any) => {
        try {
          await webpush.sendNotification(entry.subscription, payload);
        } catch (error: any) {
          const statusCode = error?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await removeSubscription(entry.endpoint);
            return;
          }
          throw error;
        }
      }),
    );

    const failures = results.filter((result) => result.status === 'rejected');
    return Response.json(
      { ok: true, sent: results.length - failures.length, failed: failures.length },
      { headers: corsHeaders },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400, headers: corsHeaders },
    );
  }
});
