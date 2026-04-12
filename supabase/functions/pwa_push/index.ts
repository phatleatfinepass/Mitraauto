import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

type PushSubscriptionPayload = {
  endpoint: string;
  expirationTime?: number | null;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

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

async function ensureAuthorized(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }

  const client = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) {
    throw new Error('Unauthenticated');
  }

  let isAdmin = user.email === 'admin@mitra-auto.fi';
  if (!isAdmin) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    isAdmin = profile?.role === 'admin';
  }

  if (!isAdmin) {
    throw new Error('Forbidden');
  }

  return user;
}

async function upsertSubscription(userId: string, userEmail: string | null, subscription: PushSubscriptionPayload) {
  const payload = {
    user_id: userId,
    user_email: userEmail,
    endpoint: subscription.endpoint,
    subscription,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: 'endpoint' });

  if (error) {
    throw new Error(error.message);
  }

  const { error: cleanupError } = await supabase
    .from(TABLE)
    .delete()
    .eq('user_id', userId)
    .neq('endpoint', subscription.endpoint);

  if (cleanupError) {
    throw new Error(cleanupError.message);
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const user = await ensureAuthorized(request);
    const body = await request.json().catch(() => ({}));
    const action = body?.action;

    if (action === 'public_key') {
      return Response.json(
        { publicKey: getEnv('WEB_PUSH_VAPID_PUBLIC_KEY') },
        { headers: corsHeaders },
      );
    }

    if (action === 'subscribe') {
      const subscription = body?.subscription as PushSubscriptionPayload | undefined;
      if (!subscription?.endpoint) {
        throw new Error('Missing subscription endpoint');
      }

      await upsertSubscription(user.id, user.email ?? null, subscription);
      return Response.json({ ok: true }, { headers: corsHeaders });
    }

    if (action === 'unsubscribe') {
      const endpoint = body?.endpoint as string | undefined;
      if (!endpoint) {
        throw new Error('Missing endpoint');
      }

      const { error } = await supabase.from(TABLE).delete().eq('endpoint', endpoint);
      if (error) {
        throw new Error(error.message);
      }

      return Response.json({ ok: true }, { headers: corsHeaders });
    }

    throw new Error('Unsupported action');
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400, headers: corsHeaders },
    );
  }
});
