import { LOAD_KG_BY_INDEX } from './etrto_runtime/load_index.ts';
import { SPEED_KMH_BY_SYMBOL } from './etrto_runtime/speed_rating.ts';
import type { RuntimeTyreSize } from './etrto_runtime/types.ts';

export interface ParsedTyreSize {
  widthMm: number;
  aspectRatio: number;
  construction: string;
  rimDiameterIn: number;
  loadIndex?: number;
  speedRating?: string;
  extraLoad?: boolean;
  highLoad?: boolean;
}

export type EtrtoTyreSize = RuntimeTyreSize;

export interface TyreFitmentCandidate {
  sizeKey: string;
  label: string;
  widthMm: number;
  aspectRatio: number;
  rimDiameterIn: number;
  diameterMm: number;
  diameterDifferencePercent: number;
  loadIndex: number | null;
  loadCapacityKg: number | null;
  speedRating: string | null;
  loadVersion: 'standard' | 'reinforced' | 'highLoad';
  approvedRimWidths: number[];
  confidence: 'factory' | 'recommended' | 'possible';
  reasons: string[];
  sourcePage: string;
}

export interface TyreFitmentRecommendation {
  factory: TyreFitmentCandidate;
  alternatives: TyreFitmentCandidate[];
  auditedSeriesOnly: boolean;
  warnings: string[];
}

interface IndexedTyreSize {
  row: RuntimeTyreSize;
  diameterMm: number;
}

const AUDITED_SERIES = new Set([20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80]);
const DIAMETER_RECOMMENDED_TOLERANCE = 2;
const DIAMETER_POSSIBLE_TOLERANCE = 3;
const WIDTH_POSSIBLE_TOLERANCE_MM = 30;
const RIM_DIAMETER_POSSIBLE_TOLERANCE_IN = 2;
const AVAILABLE_RIM_DIAMETERS = new Set([10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 28, 30]);

const shardCache = new Map<number, Promise<IndexedTyreSize[]>>();

export function parseTyreSize(input: string | null | undefined): ParsedTyreSize | null {
  const normalized = String(input ?? '').toUpperCase().replace(/\s+/g, ' ').trim();
  if (!normalized) return null;
  const highLoad = /^HL(?:\s|$)/.test(normalized);

  const match = normalized.match(
    /(?:HL\s*)?(?<width>\d{3})\s*\/\s*(?<aspect>\d{2})\s*(?<construction>ZR|R)?\s*(?<rim>\d{2})(?:\s*(?<xl>XL|EXTRA\s*LOAD|REINF(?:ORCED)?\.?))?(?:\s*(?<load>\d{2,3})\s*(?<speed>[A-Z]{1,2}))?/i,
  );
  if (!match?.groups) return null;

  const loadIndex = match.groups.load ? Number.parseInt(match.groups.load, 10) : undefined;
  const speedRating = match.groups.speed ? match.groups.speed.toUpperCase() : undefined;

  return {
    widthMm: Number.parseInt(match.groups.width, 10),
    aspectRatio: Number.parseInt(match.groups.aspect, 10),
    construction: match.groups.construction?.toUpperCase() ?? 'R',
    rimDiameterIn: Number.parseInt(match.groups.rim, 10),
    loadIndex: Number.isFinite(loadIndex) ? loadIndex : undefined,
    speedRating,
    extraLoad: Boolean(match.groups.xl),
    highLoad,
  };
}

export function buildSizeKey(size: Pick<ParsedTyreSize, 'widthMm' | 'aspectRatio' | 'rimDiameterIn' | 'highLoad'>) {
  const prefix = size.highLoad ? 'HL_' : '';
  return `${prefix}${size.widthMm}_${size.aspectRatio}_R${size.rimDiameterIn}`;
}

export function formatTyreSize(
  size: Pick<ParsedTyreSize, 'widthMm' | 'aspectRatio' | 'rimDiameterIn'>,
  loadIndex?: number | null,
  speedRating?: string | null,
) {
  const suffix = loadIndex && speedRating ? ` ${loadIndex}${speedRating}` : '';
  return `${size.widthMm}/${size.aspectRatio} R${size.rimDiameterIn}${suffix}`;
}

export async function getEtrtoTyreSize(sizeKey: string) {
  const rimDiameterIn = parseRimDiameterFromSizeKey(sizeKey);
  if (rimDiameterIn === null) return null;
  const shard = await loadTyreShard(rimDiameterIn);
  return shard.find(({ row }) => row.sizeKey === sizeKey)?.row ?? null;
}

export async function getApprovedRimWidths(sizeKey: string) {
  const tyre = await getEtrtoTyreSize(sizeKey);
  return tyre ? [...tyre.approvedRimWidthsIn].sort((a, b) => a - b) : [];
}

export function calculateTyreDiameterMm(size: Pick<ParsedTyreSize, 'widthMm' | 'aspectRatio' | 'rimDiameterIn'>) {
  return size.rimDiameterIn * 25.4 + 2 * (size.widthMm * (size.aspectRatio / 100));
}

export async function buildTyreFitmentRecommendation(
  factorySizeText: string,
  vehicle?: { maxWeightKg?: number | null; maxSpeedKmh?: number | null },
): Promise<TyreFitmentRecommendation | null> {
  const parsedFactory = parseTyreSize(factorySizeText);
  if (!parsedFactory) return null;

  const factorySizeKey = buildSizeKey(parsedFactory);
  const factoryEtrto = await getEtrtoTyreSize(factorySizeKey);
  if (!factoryEtrto) return null;

  const factoryDiameter = resolveTyreDiameterMm(factoryEtrto);
  const minimumLoadIndex = resolveMinimumLoadIndex(parsedFactory, vehicle);
  const minimumSpeedKmh = parsedFactory.speedRating ? SPEED_KMH_BY_SYMBOL[parsedFactory.speedRating] ?? null : null;
  const factoryLoadVersion = factoryEtrto.loadVersion === 'highLoad' ? 'highLoad' : parsedFactory.extraLoad ? 'reinforced' : 'standard';
  const factoryCandidate = buildCandidate(factoryEtrto, factoryDiameter, parsedFactory.loadIndex, parsedFactory.speedRating, 'factory', [
    'Factory size from vehicle lookup',
    'Best match for original rolling diameter',
  ], factoryLoadVersion);

  const alternatives = (await getPotentialAlternativeTyres(parsedFactory, factorySizeKey))
    .map(({ row, diameterMm }) => {
      const difference = percentDifference(diameterMm, factoryDiameter);
      if (Math.abs(difference) > DIAMETER_POSSIBLE_TOLERANCE) return null;

      const loadVersion = resolveCandidateLoadVersion(row, minimumLoadIndex);
      if (!loadVersion) return null;
      const candidateLoadIndex = loadVersion === 'reinforced' || loadVersion === 'highLoad' ? row.reinforcedLoadIndex : row.standardLoadIndex;

      const candidateSpeed = parsedFactory.speedRating ?? null;
      if (minimumSpeedKmh !== null && candidateSpeed) {
        const candidateSpeedKmh = SPEED_KMH_BY_SYMBOL[candidateSpeed] ?? null;
        if (candidateSpeedKmh !== null && candidateSpeedKmh < minimumSpeedKmh) return null;
      }

      const confidence = Math.abs(difference) <= DIAMETER_RECOMMENDED_TOLERANCE ? 'recommended' : 'possible';
      const reasons = [
        `Rolling diameter ${formatSignedPercent(difference)} from factory`,
        `Width change ${formatSignedMm(row.widthMm - parsedFactory.widthMm)} from factory`,
        `Rim diameter change ${formatSignedIn(row.rimDiameterIn - parsedFactory.rimDiameterIn)} from factory`,
        `Load index ${candidateLoadIndex ?? '-'} meets factory/vehicle requirement`,
        'ETRTO passenger-car size is present in the audited dataset',
      ];
      if (loadVersion === 'reinforced') {
        reasons.push('Requires XL/reinforced load version to meet the factory load index');
      }
      if (loadVersion === 'highLoad') {
        reasons.push('Requires HL high-load-capacity tyre version to meet the load requirement');
      }

      return buildCandidate(row, factoryDiameter, candidateLoadIndex, candidateSpeed, confidence, reasons, loadVersion);
    })
    .filter((candidate): candidate is TyreFitmentCandidate => Boolean(candidate))
    .sort((a, b) => Math.abs(a.diameterDifferencePercent) - Math.abs(b.diameterDifferencePercent))
    .slice(0, 12);

  return {
    factory: factoryCandidate,
    alternatives,
    auditedSeriesOnly: true,
    warnings: [
      'Recommendations are based on ETRTO dimensional standards and the vehicle factory tyre size, not Traficom type approval.',
      'Current extracted data is audited for normal passenger series 20-80 and HL high-load-capacity passenger tyres.',
      'Final wheel fitment still depends on PCD, center bore, offset, brake clearance, and vehicle clearance.',
    ],
  };
}

function buildCandidate(
  row: RuntimeTyreSize,
  factoryDiameterMm: number,
  loadIndex: number | null | undefined,
  speedRating: string | null | undefined,
  confidence: TyreFitmentCandidate['confidence'],
  reasons: string[],
  loadVersion: TyreFitmentCandidate['loadVersion'] = 'standard',
): TyreFitmentCandidate {
  const diameter = resolveTyreDiameterMm(row);
  const resolvedLoadIndex = loadIndex ?? (loadVersion === 'highLoad' ? row.reinforcedLoadIndex : row.standardLoadIndex);
  const label = `${loadVersion === 'highLoad' ? 'HL ' : ''}${formatTyreSize(row, resolvedLoadIndex, speedRating ?? null)}`;

  return {
    sizeKey: row.sizeKey,
    label,
    widthMm: row.widthMm,
    aspectRatio: row.aspectRatio,
    rimDiameterIn: row.rimDiameterIn,
    diameterMm: diameter,
    diameterDifferencePercent: percentDifference(diameter, factoryDiameterMm),
    loadIndex: resolvedLoadIndex ?? null,
    loadCapacityKg: loadVersion === 'reinforced' || loadVersion === 'highLoad'
      ? row.reinforcedLoadCapacityKg ?? (resolvedLoadIndex ? LOAD_KG_BY_INDEX[resolvedLoadIndex] ?? null : null)
      : resolvedLoadIndex ? LOAD_KG_BY_INDEX[resolvedLoadIndex] ?? row.standardLoadCapacityKg ?? null : row.standardLoadCapacityKg ?? null,
    speedRating: speedRating ?? null,
    loadVersion,
    approvedRimWidths: [...row.approvedRimWidthsIn].sort((a, b) => a - b),
    confidence,
    reasons,
    sourcePage: row.sourcePage,
  };
}

async function getPotentialAlternativeTyres(parsedFactory: ParsedTyreSize, factorySizeKey: string) {
  const rimDiameters = getNearbyRimDiameters(parsedFactory.rimDiameterIn);
  const shards = await Promise.all(rimDiameters.map(loadTyreShard));
  return shards.flat()
    .filter(({ row }) => row.sizeKey !== factorySizeKey)
    .filter(({ row }) => AUDITED_SERIES.has(row.series))
    .filter(({ row }) => Math.abs(row.widthMm - parsedFactory.widthMm) <= WIDTH_POSSIBLE_TOLERANCE_MM)
    .filter(({ row }) => Math.abs(row.rimDiameterIn - parsedFactory.rimDiameterIn) <= RIM_DIAMETER_POSSIBLE_TOLERANCE_IN);
}

function loadTyreShard(rimDiameterIn: number): Promise<IndexedTyreSize[]> {
  if (!AVAILABLE_RIM_DIAMETERS.has(rimDiameterIn)) return Promise.resolve([]);
  const cached = shardCache.get(rimDiameterIn);
  if (cached) return cached;

  const promise = importTyreShard(rimDiameterIn)
    .then((module) => (module.TYRES as RuntimeTyreSize[]).map(indexTyreSize));
  shardCache.set(rimDiameterIn, promise);
  return promise;
}

function importTyreShard(rimDiameterIn: number): Promise<{ TYRES: RuntimeTyreSize[] }> {
  switch (rimDiameterIn) {
    case 10:
      return import('./etrto_runtime/tyres_r10.ts');
    case 12:
      return import('./etrto_runtime/tyres_r12.ts');
    case 13:
      return import('./etrto_runtime/tyres_r13.ts');
    case 14:
      return import('./etrto_runtime/tyres_r14.ts');
    case 15:
      return import('./etrto_runtime/tyres_r15.ts');
    case 16:
      return import('./etrto_runtime/tyres_r16.ts');
    case 17:
      return import('./etrto_runtime/tyres_r17.ts');
    case 18:
      return import('./etrto_runtime/tyres_r18.ts');
    case 19:
      return import('./etrto_runtime/tyres_r19.ts');
    case 20:
      return import('./etrto_runtime/tyres_r20.ts');
    case 21:
      return import('./etrto_runtime/tyres_r21.ts');
    case 22:
      return import('./etrto_runtime/tyres_r22.ts');
    case 23:
      return import('./etrto_runtime/tyres_r23.ts');
    case 24:
      return import('./etrto_runtime/tyres_r24.ts');
    case 25:
      return import('./etrto_runtime/tyres_r25.ts');
    case 26:
      return import('./etrto_runtime/tyres_r26.ts');
    case 28:
      return import('./etrto_runtime/tyres_r28.ts');
    case 30:
      return import('./etrto_runtime/tyres_r30.ts');
    default:
      return Promise.resolve({ TYRES: [] });
  }
}

function getNearbyRimDiameters(factoryRimDiameterIn: number) {
  const values: number[] = [];
  for (
    let rim = factoryRimDiameterIn - RIM_DIAMETER_POSSIBLE_TOLERANCE_IN;
    rim <= factoryRimDiameterIn + RIM_DIAMETER_POSSIBLE_TOLERANCE_IN;
    rim += 1
  ) {
    if (AVAILABLE_RIM_DIAMETERS.has(rim)) values.push(rim);
  }
  return values;
}

function indexTyreSize(row: RuntimeTyreSize): IndexedTyreSize {
  return {
    row,
    diameterMm: resolveTyreDiameterMm(row),
  };
}

function resolveTyreDiameterMm(size: Pick<RuntimeTyreSize, 'designOverallDiameterMm' | 'widthMm' | 'aspectRatio' | 'rimDiameterIn'>) {
  return size.designOverallDiameterMm ?? calculateTyreDiameterMm(size);
}

function resolveCandidateLoadVersion(row: RuntimeTyreSize, minimumLoadIndex: number | null): TyreFitmentCandidate['loadVersion'] | null {
  if (row.loadVersion === 'highLoad') {
    if (minimumLoadIndex === null) return null;
    return row.reinforcedLoadIndex !== null && row.reinforcedLoadIndex !== undefined && row.reinforcedLoadIndex >= minimumLoadIndex ? 'highLoad' : null;
  }
  if (minimumLoadIndex === null) return 'standard';
  if (row.standardLoadIndex !== null && row.standardLoadIndex !== undefined && row.standardLoadIndex >= minimumLoadIndex) return 'standard';
  if (row.reinforcedLoadIndex !== null && row.reinforcedLoadIndex !== undefined && row.reinforcedLoadIndex >= minimumLoadIndex) return 'reinforced';
  return null;
}

function resolveMinimumLoadIndex(parsedFactory: ParsedTyreSize, vehicle?: { maxWeightKg?: number | null }) {
  if (parsedFactory.loadIndex) return parsedFactory.loadIndex;
  const requiredKgPerTyre = vehicle?.maxWeightKg ? Math.ceil(vehicle.maxWeightKg / 4) : null;
  if (requiredKgPerTyre === null) return null;

  for (const [loadIndexText, kg] of Object.entries(LOAD_KG_BY_INDEX).sort((a, b) => Number(a[0]) - Number(b[0]))) {
    if (kg >= requiredKgPerTyre) return Number(loadIndexText);
  }
  return null;
}

function parseRimDiameterFromSizeKey(sizeKey: string) {
  const match = sizeKey.match(/_R(?<rim>\d+)$/);
  if (!match?.groups?.rim) return null;
  const rim = Number(match.groups.rim);
  return Number.isFinite(rim) ? rim : null;
}

function percentDifference(value: number, reference: number) {
  if (!reference) return 0;
  return ((value - reference) / reference) * 100;
}

function formatSignedPercent(value: number) {
  const rounded = value.toFixed(1);
  return `${value > 0 ? '+' : ''}${rounded}%`;
}

function formatSignedMm(value: number) {
  return `${value > 0 ? '+' : ''}${value} mm`;
}

function formatSignedIn(value: number) {
  return `${value > 0 ? '+' : ''}${value} in`;
}
