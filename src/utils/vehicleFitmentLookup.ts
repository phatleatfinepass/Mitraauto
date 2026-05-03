export interface VehicleTyreLookupResult {
  plate: string;
  vin?: string;
  description: string;
  make?: string;
  model?: string;
  variant?: string;
  factoryTyreSize: string;
  maxWeightKg?: number | null;
  weightEmptyKg?: number | null;
  maxSpeedKmh?: number | null;
  powerKw?: number | null;
  source: 'carsxe' | 'development-fallback';
}

type CarsXePlateResponse = {
  success?: boolean;
  vin?: string;
  description?: string;
  make?: string;
  model?: string;
  variant?: string;
  power?: string | number;
};

type CarsXeVinResponse = {
  success?: boolean;
  attributes?: Record<string, unknown>;
};

const DEVELOPMENT_FIXTURES: Record<string, VehicleTyreLookupResult> = {
  'XJZ-140': {
    plate: 'XJZ-140',
    vin: 'TMAD381CADJ004071',
    description: 'Hyundai i30 Kombi',
    make: 'Hyundai',
    model: 'i30 Kombi',
    variant: 'Hyundai i30 Kombi 1.6 GDI Manuaalinen, 6 vaihdetta, 135ps, 2013',
    factoryTyreSize: '195/65 R15 91H',
    maxWeightKg: 1820,
    weightEmptyKg: 1298,
    maxSpeedKmh: 192,
    powerKw: 99,
    source: 'development-fallback',
  },
};

export function normalizeFinnishPlate(value: string) {
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  if (compact.length <= 3) return compact;
  return `${compact.slice(0, 3)}-${compact.slice(3)}`;
}

export async function lookupVehicleTyreFitment(plateInput: string): Promise<VehicleTyreLookupResult> {
  const plate = normalizeFinnishPlate(plateInput);
  const apiKey = import.meta.env.VITE_CARSXE_API_KEY;

  if (!apiKey) {
    const fixture = DEVELOPMENT_FIXTURES[plate];
    if (fixture) return fixture;
    throw new Error('CarsXE API key is not configured. Add VITE_CARSXE_API_KEY or use XJZ-140 for local development.');
  }

  const plateResponse = await callCarsXePlateLookup(plate, apiKey);
  if (!plateResponse.success || !plateResponse.vin) {
    throw new Error('Vehicle lookup did not return a VIN for this plate.');
  }

  const vinResponse = await callCarsXeVinLookup(plateResponse.vin, apiKey);
  const attributes = vinResponse.attributes ?? {};
  const factoryTyreSize = firstString(attributes.wheel_size, attributes.wheel_size_array);
  if (!factoryTyreSize) {
    throw new Error('Vehicle lookup succeeded, but no factory tyre size was returned.');
  }

  return {
    plate,
    vin: plateResponse.vin,
    description: plateResponse.description || [plateResponse.make, plateResponse.model].filter(Boolean).join(' ') || plate,
    make: plateResponse.make,
    model: plateResponse.model,
    variant: plateResponse.variant,
    factoryTyreSize,
    maxWeightKg: numberOrNull(attributes.max_weight_kg),
    weightEmptyKg: numberOrNull(attributes.weight_empty_kg),
    maxSpeedKmh: numberOrNull(attributes.max_speed_kmh),
    powerKw: numberOrNull(plateResponse.power),
    source: 'carsxe',
  };
}

async function callCarsXePlateLookup(plate: string, apiKey: string): Promise<CarsXePlateResponse> {
  const endpoint = import.meta.env.VITE_CARSXE_PLATE_ENDPOINT;
  if (!endpoint) {
    throw new Error('CarsXE plate endpoint is not configured. Add VITE_CARSXE_PLATE_ENDPOINT.');
  }

  const url = new URL(endpoint);
  url.searchParams.set('plate', plate);
  url.searchParams.set('state', 'FI');
  url.searchParams.set('country', 'FI');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'x-api-key': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`CarsXE plate lookup failed (${response.status}).`);
  }

  return response.json();
}

async function callCarsXeVinLookup(vin: string, apiKey: string): Promise<CarsXeVinResponse> {
  const endpoint = import.meta.env.VITE_CARSXE_VIN_ENDPOINT;
  if (!endpoint) {
    throw new Error('CarsXE VIN endpoint is not configured. Add VITE_CARSXE_VIN_ENDPOINT.');
  }

  const url = new URL(endpoint);
  url.searchParams.set('vin', vin);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'x-api-key': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`CarsXE VIN lookup failed (${response.status}).`);
  }

  return response.json();
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text) return text;
  }
  return '';
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}
