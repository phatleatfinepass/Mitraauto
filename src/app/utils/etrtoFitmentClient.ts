import { getSupabaseClient } from './supabase/client';
import type { TyreFitmentRecommendation } from './etrtoFitment';

export interface EtrtoRecommendationVehicleInput {
  maxWeightKg?: number | null;
  maxSpeedKmh?: number | null;
}

export async function requestTyreFitmentRecommendation(
  factorySizeText: string,
  vehicle?: EtrtoRecommendationVehicleInput,
): Promise<TyreFitmentRecommendation | null> {
  const { data, error } = await getSupabaseClient().functions.invoke<{
    recommendation: TyreFitmentRecommendation | null;
    error?: string;
  }>('etrto_recommend_tyres', {
    body: {
      factorySizeText,
      vehicle: {
        maxWeightKg: vehicle?.maxWeightKg ?? null,
        maxSpeedKmh: vehicle?.maxSpeedKmh ?? null,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data?.recommendation ?? null;
}

