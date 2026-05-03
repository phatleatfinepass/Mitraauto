import { buildTyreFitmentRecommendation } from '../_shared/etrto_fitment.ts';
import { buildRimFitmentProfile, buildRimFitmentRecommendationFromTyres } from '../_shared/rim_fitment.ts';

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

function nullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
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
    const factoryTyreSizeText = typeof body?.factoryTyreSizeText === 'string'
      ? body.factoryTyreSizeText.trim()
      : typeof body?.factorySizeText === 'string'
        ? body.factorySizeText.trim()
        : '';

    if (!factoryTyreSizeText) {
      return jsonResponse({ error: 'factoryTyreSizeText is required' }, 400);
    }

    const vehicle = typeof body?.vehicle === 'object' && body.vehicle !== null ? body.vehicle : {};
    const mounting = typeof body?.mounting === 'object' && body.mounting !== null ? body.mounting : {};
    const normalizedVehicle = {
      maxWeightKg: nullableNumber(vehicle.maxWeightKg),
      maxSpeedKmh: nullableNumber(vehicle.maxSpeedKmh),
    };

    const tyre = await buildTyreFitmentRecommendation(factoryTyreSizeText, normalizedVehicle);
    const rimProfile = await buildRimFitmentProfile(factoryTyreSizeText, mounting);
    const rim = tyre
      ? await buildRimFitmentRecommendationFromTyres(factoryTyreSizeText, tyre, mounting)
      : null;

    return jsonResponse({
      tyre,
      rim,
      rimProfile,
      meta: {
        factoryTyreSizeText,
        tyreComputedOnce: true,
        rimDerivedFromTyreRecommendation: Boolean(tyre && rim),
        catalogRuntime: 'etrto_runtime_by_rim_diameter',
      },
      warnings: [
        ...(tyre?.warnings ?? []),
        ...(rim?.warnings ?? rimProfile?.warnings ?? []),
      ].filter((warning, index, list) => list.indexOf(warning) === index),
    });
  } catch (error) {
    console.error('Fitment recommendation failed:', error);
    return jsonResponse({ error: 'Fitment recommendation failed' }, 500);
  }
});

