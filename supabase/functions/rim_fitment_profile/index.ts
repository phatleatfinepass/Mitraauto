import {
  buildRimFitmentProfile,
  buildRimFitmentRecommendationFromTyres,
} from '../_shared/rim_fitment.ts';
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
    const factoryTyreSizeText = typeof body?.factoryTyreSizeText === 'string'
      ? body.factoryTyreSizeText.trim()
      : '';

    if (!factoryTyreSizeText) {
      return jsonResponse({ error: 'factoryTyreSizeText is required' }, 400);
    }

    const mounting = typeof body?.mounting === 'object' && body.mounting !== null
      ? body.mounting
      : {};
    const vehicle = typeof body?.vehicle === 'object' && body.vehicle !== null
      ? body.vehicle
      : {};
    const profile = await buildRimFitmentProfile(factoryTyreSizeText, mounting);
    const providedTyreRecommendation = typeof body?.tyreRecommendation === 'object' && body.tyreRecommendation !== null
      ? body.tyreRecommendation
      : null;
    const tyreRecommendation = providedTyreRecommendation
      ?? await buildTyreFitmentRecommendation(factoryTyreSizeText, {
          maxWeightKg: Number.isFinite(Number(vehicle.maxWeightKg)) ? Number(vehicle.maxWeightKg) : null,
          maxSpeedKmh: Number.isFinite(Number(vehicle.maxSpeedKmh)) ? Number(vehicle.maxSpeedKmh) : null,
        });
    const recommendation = tyreRecommendation
      ? await buildRimFitmentRecommendationFromTyres(factoryTyreSizeText, tyreRecommendation, mounting)
      : null;

    return jsonResponse({
      profile,
      recommendation,
      tyre: tyreRecommendation ?? null,
      rim: recommendation,
      rimProfile: profile,
      usedTyreRecommendationInput: Boolean(providedTyreRecommendation),
      meta: {
        factoryTyreSizeText,
        tyreComputedOnce: true,
        rimDerivedFromTyreRecommendation: Boolean(tyreRecommendation && recommendation),
        catalogRuntime: 'etrto_runtime_by_rim_diameter',
        compatibilityEndpoint: 'rim_fitment_profile',
      },
      warnings: [
        ...(recommendation?.warnings ?? profile?.warnings ?? []),
      ],
    });
  } catch (error) {
    console.error('Rim fitment profile failed:', error);
    return jsonResponse({ error: 'Rim fitment profile failed' }, 500);
  }
});
