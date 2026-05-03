import { getSupabaseClient } from './supabase/client';

export interface VehicleTyreLookupResult {
  plate: string;
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

export async function lookupVehicleTyreFitment(plateInput: string): Promise<VehicleTyreLookupResult> {
  const plate = normalizeFinnishPlate(plateInput);

  const { data, error } = await getSupabaseClient().functions.invoke<VehicleLookupFunctionResponse>(
    'vehicle_lookup',
    {
      body: { plate },
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.vehicle) {
    throw new Error('Vehicle lookup returned an empty response.');
  }

  return data.vehicle;
}
