import { buildTyreFitmentRecommendation } from '../_shared/etrto_fitment.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const factorySizeText = typeof body?.factorySizeText === 'string'
      ? body.factorySizeText.trim()
      : '';

    if (!factorySizeText) {
      return jsonResponse({ error: 'factorySizeText is required' }, 400);
    }

    const vehicle = typeof body?.vehicle === 'object' && body.vehicle !== null
      ? body.vehicle
      : {};

    const recommendation = await buildTyreFitmentRecommendation(factorySizeText, {
      maxWeightKg: Number.isFinite(Number(vehicle.maxWeightKg)) ? Number(vehicle.maxWeightKg) : null,
      maxSpeedKmh: Number.isFinite(Number(vehicle.maxSpeedKmh)) ? Number(vehicle.maxSpeedKmh) : null,
    });

    return jsonResponse({ recommendation });
  } catch (error) {
    console.error('ETRTO recommendation failed:', error);
    return jsonResponse({ error: 'ETRTO recommendation failed' }, 500);
  }
});
