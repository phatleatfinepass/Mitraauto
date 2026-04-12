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

async function countBookingAttentionItems() {
  const { count, error } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .not('status', 'in', '(cancelled,handoff)');

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

async function getSubscriptions() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('endpoint, subscription');

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
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
