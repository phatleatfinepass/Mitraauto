import { getSupabaseClient } from './supabase/client';
import type { VehicleRimMountingInput } from './rimFitment';

export interface VehicleRimMountingData extends VehicleRimMountingInput {
  source?: 'provider' | 'development-fallback' | 'cache' | null;
}

export interface VehicleTyreLookupResult {
  plate: string;
  country?: string;
  vin?: string;
  description: string;
  make?: string;
  model?: string;
  year?: string;
  variant?: string;
  factoryTyreSize: string;
  factoryTyreSizes?: string[];
  maxWeightKg?: number | null;
  weightEmptyKg?: number | null;
  maxSpeedKmh?: number | null;
  powerKw?: number | null;
  engineSizeCc?: number | null;
  rimMounting?: VehicleRimMountingData | null;
  source: 'carsxe' | 'development-fallback';
  specifications?: Record<string, unknown>;
  lookups?: {
    plateDecoder: Record<string, unknown>;
    specifications: Record<string, unknown> | null;
    internationalVinDecoder: Record<string, unknown> | null;
  };
  warnings?: string[];
}

type VehicleLookupFunctionResponse = {
  vehicle?: VehicleTyreLookupResult;
  usingFixture?: boolean;
  error?: string;
};

export function normalizeFinnishPlate(value: string) {
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  if (compact.length <= 3) return compact;
  return `${compact.slice(0, 3)}-${compact.slice(3)}`;
}

export function normalizePlate(value: string, country = 'FI') {
  if (country === 'FI') {
    return normalizeFinnishPlate(value);
  }
  return value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12);
}

export async function lookupVehicleTyreFitment(plateInput: string, country = 'FI'): Promise<VehicleTyreLookupResult> {
  const normalizedCountry = country.toUpperCase();
  const plate = normalizePlate(plateInput, normalizedCountry);

  const { data, error } = await getSupabaseClient().functions.invoke<VehicleLookupFunctionResponse>(
    'vehicle_lookup',
    {
      body: {
        plate,
        country: normalizedCountry,
        state: normalizedCountry,
      },
    },
  );

  if (error) {
    const functionError = await readVehicleLookupFunctionError(error);
    throw new Error(functionError || error.message);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.vehicle) {
    throw new Error('Vehicle lookup returned an empty response.');
  }

  return data.vehicle;
}

async function readVehicleLookupFunctionError(error: unknown): Promise<string | null> {
  const context = (error as { context?: unknown })?.context;
  if (!context || typeof (context as Response).clone !== 'function') return null;

  try {
    const payload = await (context as Response).clone().json();
    const message = String(payload?.error ?? payload?.message ?? '').trim();
    return message || null;
  } catch {
    return null;
  }
}
