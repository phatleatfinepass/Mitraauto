import {
  buildTyreFitmentRecommendation,
  buildSizeKey,
  getApprovedRimWidths,
  getEtrtoTyreSize,
  parseTyreSize,
  type TyreFitmentCandidate,
  type TyreFitmentRecommendation,
} from './etrto_fitment.ts';

export interface VehicleRimMountingInput {
  pcd?: string | null;
  centerBoreMm?: number | null;
  offsetMinMm?: number | null;
  offsetMaxMm?: number | null;
  factoryOffsetMm?: number | null;
  factoryRimWidthIn?: number | null;
  boltThread?: string | null;
  boltSeat?: string | null;
}

export interface RimFitmentProfile {
  tyreSizeKey: string;
  tyreSizeLabel: string;
  rimDiameterIn: number;
  approvedRimWidthsIn: number[];
  preferredRimWidthIn: number | null;
  mounting: {
    pcd: string | null;
    centerBoreMm: number | null;
    offsetMinMm: number | null;
    offsetMaxMm: number | null;
    factoryOffsetMm: number | null;
    boltThread: string | null;
    boltSeat: string | null;
  };
  catalogFilters: {
    rimDiameterIn: number;
    approvedWidthsIn: number[];
    pcd: string | null;
    centerBoreMinMm: number | null;
    offsetMinMm: number | null;
    offsetMaxMm: number | null;
  };
  warnings: string[];
}

export interface RimFitmentCandidate {
  tyreSizeKey: string;
  tyreSizeLabel: string;
  rimDiameterIn: number;
  approvedRimWidthsIn: number[];
  preferredRimWidthIn: number | null;
  confidence: 'factory' | 'recommended' | 'possible';
  tyreDiameterDifferencePercent: number;
  reasons: string[];
}

export interface RimFitmentRecommendation {
  factory: RimFitmentCandidate;
  alternatives: RimFitmentCandidate[];
  mounting: RimFitmentProfile['mounting'];
  catalogFilters: {
    factoryRimDiameterIn: number;
    factoryApprovedWidthsIn: number[];
    alternativeRimDiametersIn: number[];
    pcd: string | null;
    centerBoreMinMm: number | null;
    offsetMinMm: number | null;
    offsetMaxMm: number | null;
  };
  warnings: string[];
}

export async function buildRimFitmentProfile(
  factoryTyreSizeText: string,
  mounting: VehicleRimMountingInput = {},
): Promise<RimFitmentProfile | null> {
  const parsedTyre = parseTyreSize(factoryTyreSizeText);
  if (!parsedTyre) return null;

  const tyreSizeKey = buildSizeKey(parsedTyre);
  const etrtoTyre = await getEtrtoTyreSize(tyreSizeKey);
  if (!etrtoTyre) return null;

  const approvedRimWidthsIn = await getApprovedRimWidths(tyreSizeKey);
  if (!approvedRimWidthsIn.length) return null;

  const offsetRange = resolveOffsetRange(mounting);
  const preferredRimWidthIn = resolvePreferredRimWidth(
    approvedRimWidthsIn,
    mounting.factoryRimWidthIn,
    etrtoTyre.measuringRimWidthIn,
  );
  const normalizedPcd = normalizePcd(mounting.pcd);
  const centerBoreMm = nullableNumber(mounting.centerBoreMm);

  const warnings = [
    'Rim profile uses ETRTO tyre-to-rim width compatibility plus vehicle mounting constraints when supplied.',
    'Final rim fitment still requires brake clearance, caliper shape, spoke design, load rating, fastener seat, and local approval checks.',
  ];

  if (!normalizedPcd) {
    warnings.push('PCD is missing, so catalog rim filtering must not auto-match bolt pattern yet.');
  }
  if (centerBoreMm === null) {
    warnings.push('Center bore is missing, so hub-centric fitment cannot be verified yet.');
  }
  if (offsetRange.offsetMinMm === null || offsetRange.offsetMaxMm === null) {
    warnings.push('Offset range is missing, so ET compatibility cannot be verified yet.');
  }

  return {
    tyreSizeKey,
    tyreSizeLabel: `${parsedTyre.widthMm}/${parsedTyre.aspectRatio} R${parsedTyre.rimDiameterIn}`,
    rimDiameterIn: parsedTyre.rimDiameterIn,
    approvedRimWidthsIn,
    preferredRimWidthIn,
    mounting: {
      pcd: normalizedPcd,
      centerBoreMm,
      offsetMinMm: offsetRange.offsetMinMm,
      offsetMaxMm: offsetRange.offsetMaxMm,
      factoryOffsetMm: nullableNumber(mounting.factoryOffsetMm),
      boltThread: cleanString(mounting.boltThread),
      boltSeat: cleanString(mounting.boltSeat),
    },
    catalogFilters: {
      rimDiameterIn: parsedTyre.rimDiameterIn,
      approvedWidthsIn: approvedRimWidthsIn,
      pcd: normalizedPcd,
      centerBoreMinMm: centerBoreMm,
      offsetMinMm: offsetRange.offsetMinMm,
      offsetMaxMm: offsetRange.offsetMaxMm,
    },
    warnings,
  };
}

export async function buildRimFitmentRecommendation(
  factoryTyreSizeText: string,
  mounting: VehicleRimMountingInput = {},
  vehicle?: { maxWeightKg?: number | null; maxSpeedKmh?: number | null },
): Promise<RimFitmentRecommendation | null> {
  const tyreRecommendation = await buildTyreFitmentRecommendation(factoryTyreSizeText, vehicle);
  if (!tyreRecommendation) return null;

  return buildRimFitmentRecommendationFromTyres(factoryTyreSizeText, tyreRecommendation, mounting);
}

export async function buildRimFitmentRecommendationFromTyres(
  factoryTyreSizeText: string,
  tyreRecommendation: TyreFitmentRecommendation,
  mounting: VehicleRimMountingInput = {},
): Promise<RimFitmentRecommendation | null> {
  const factoryProfile = await buildRimFitmentProfile(factoryTyreSizeText, mounting);
  if (!factoryProfile) return null;

  const factory = await buildRimCandidate(tyreRecommendation.factory);
  if (!factory) return null;

  const alternatives = (await Promise.all(tyreRecommendation.alternatives.map(buildRimCandidate)))
    .filter((candidate): candidate is RimFitmentCandidate => Boolean(candidate))
    .sort((a, b) => {
      const diameterSort = Math.abs(a.tyreDiameterDifferencePercent) - Math.abs(b.tyreDiameterDifferencePercent);
      if (diameterSort !== 0) return diameterSort;
      return Math.abs(a.rimDiameterIn - factory.rimDiameterIn) - Math.abs(b.rimDiameterIn - factory.rimDiameterIn);
    })
    .slice(0, 12);

  return {
    factory,
    alternatives,
    mounting: factoryProfile.mounting,
    catalogFilters: {
      factoryRimDiameterIn: factory.rimDiameterIn,
      factoryApprovedWidthsIn: factory.approvedRimWidthsIn,
      alternativeRimDiametersIn: uniqueSortedNumbers([
        factory.rimDiameterIn,
        ...alternatives.map((candidate) => candidate.rimDiameterIn),
      ]),
      pcd: factoryProfile.catalogFilters.pcd,
      centerBoreMinMm: factoryProfile.catalogFilters.centerBoreMinMm,
      offsetMinMm: factoryProfile.catalogFilters.offsetMinMm,
      offsetMaxMm: factoryProfile.catalogFilters.offsetMaxMm,
    },
    warnings: factoryProfile.warnings,
  };
}

async function buildRimCandidate(tyreCandidate: TyreFitmentCandidate): Promise<RimFitmentCandidate | null> {
  const etrtoTyre = await getEtrtoTyreSize(tyreCandidate.sizeKey);
  const approvedRimWidthsIn = await getApprovedRimWidths(tyreCandidate.sizeKey);
  if (!etrtoTyre || !approvedRimWidthsIn.length) return null;

  return {
    tyreSizeKey: tyreCandidate.sizeKey,
    tyreSizeLabel: tyreCandidate.label,
    rimDiameterIn: tyreCandidate.rimDiameterIn,
    approvedRimWidthsIn,
    preferredRimWidthIn: resolvePreferredRimWidth(
      approvedRimWidthsIn,
      null,
      etrtoTyre.measuringRimWidthIn,
    ),
    confidence: tyreCandidate.confidence,
    tyreDiameterDifferencePercent: tyreCandidate.diameterDifferencePercent,
    reasons: [
      ...tyreCandidate.reasons,
      `Approved rim widths: ${approvedRimWidthsIn.map((width) => `${width}J`).join(', ')}`,
    ],
  };
}

function resolvePreferredRimWidth(
  approvedRimWidthsIn: number[],
  factoryRimWidthIn?: number | null,
  measuringRimWidthIn?: number | null,
) {
  const target = nullableNumber(factoryRimWidthIn) ?? nullableNumber(measuringRimWidthIn);
  if (target === null) return null;
  return [...approvedRimWidthsIn].sort((a, b) => Math.abs(a - target) - Math.abs(b - target))[0] ?? null;
}

function resolveOffsetRange(mounting: VehicleRimMountingInput) {
  const explicitMin = nullableNumber(mounting.offsetMinMm);
  const explicitMax = nullableNumber(mounting.offsetMaxMm);
  if (explicitMin !== null && explicitMax !== null) {
    return {
      offsetMinMm: Math.min(explicitMin, explicitMax),
      offsetMaxMm: Math.max(explicitMin, explicitMax),
    };
  }

  const factoryOffset = nullableNumber(mounting.factoryOffsetMm);
  if (factoryOffset === null) {
    return { offsetMinMm: null, offsetMaxMm: null };
  }

  return {
    offsetMinMm: factoryOffset - 5,
    offsetMaxMm: factoryOffset + 5,
  };
}

function normalizePcd(value?: string | null) {
  const text = cleanString(value);
  if (!text) return null;
  return text.replace(/\s+/g, '').replace('×', 'x').toLowerCase();
}

function cleanString(value?: string | null) {
  const text = String(value ?? '').trim();
  return text || null;
}

function nullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function uniqueSortedNumbers(values: number[]) {
  return [...new Set(values.filter(Number.isFinite))].sort((a, b) => a - b);
}
