import { getSupabaseClient } from './supabase/client';
import type { TyreFitmentRecommendation } from './etrtoFitment';
import type { RimFitmentProfile, RimFitmentRecommendation, VehicleRimMountingInput } from './rimFitment';

export interface RimFitmentVehicleInput {
  maxWeightKg?: number | null;
  maxSpeedKmh?: number | null;
}

export interface RimFitmentResponse {
  profile: RimFitmentProfile | null;
  recommendation: RimFitmentRecommendation | null;
  usedTyreRecommendationInput: boolean;
}

export async function requestRimFitmentProfile(
  factoryTyreSizeText: string,
  mounting?: VehicleRimMountingInput,
  vehicle?: RimFitmentVehicleInput,
  tyreRecommendation?: TyreFitmentRecommendation | null,
): Promise<RimFitmentResponse> {
  const { data, error } = await getSupabaseClient().functions.invoke<{
    profile: RimFitmentProfile | null;
    recommendation: RimFitmentRecommendation | null;
    usedTyreRecommendationInput?: boolean;
    error?: string;
  }>('rim_fitment_profile', {
    body: {
      factoryTyreSizeText,
      mounting: mounting ?? {},
      vehicle: vehicle ?? {},
      tyreRecommendation: tyreRecommendation ?? null,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return {
    profile: data?.profile ?? null,
    recommendation: data?.recommendation ?? null,
    usedTyreRecommendationInput: Boolean(data?.usedTyreRecommendationInput),
  };
}
