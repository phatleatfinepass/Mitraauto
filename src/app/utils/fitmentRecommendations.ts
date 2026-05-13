import { getSupabaseClient } from './supabase/client';
import type { TyreFitmentRecommendation } from './etrtoFitment';
import type { RimFitmentProfile, RimFitmentRecommendation, VehicleRimMountingInput } from './rimFitment';

export interface FitmentVehicleInput {
  maxWeightKg?: number | null;
  maxSpeedKmh?: number | null;
}

export interface FitmentRecommendationsResponse {
  tyre: TyreFitmentRecommendation | null;
  rim: RimFitmentRecommendation | null;
  rimProfile: RimFitmentProfile | null;
  meta: {
    factoryTyreSizeText: string;
    tyreComputedOnce: boolean;
    rimDerivedFromTyreRecommendation: boolean;
    catalogRuntime: string;
  };
  warnings: string[];
}

export async function requestFitmentRecommendations(
  factoryTyreSizeText: string,
  vehicle?: FitmentVehicleInput,
  mounting?: VehicleRimMountingInput,
): Promise<FitmentRecommendationsResponse> {
  const { data, error } = await getSupabaseClient().functions.invoke<FitmentRecommendationsResponse & { error?: string }>(
    'rim_fitment_profile',
    {
      body: {
        factoryTyreSizeText,
        vehicle: {
          maxWeightKg: vehicle?.maxWeightKg ?? null,
          maxSpeedKmh: vehicle?.maxSpeedKmh ?? null,
        },
        mounting: mounting ?? {},
      },
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data) {
    throw new Error('Fitment recommendation returned an empty response.');
  }

  return data;
}