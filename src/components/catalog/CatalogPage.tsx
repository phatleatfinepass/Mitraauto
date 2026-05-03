import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeContext';
import { useCart } from '../CartContext';
import { motion, AnimatePresence } from 'motion/react';
import { DEFAULT_TIRE_FILTERS, TireFilters } from './TireFilters';
import { RimFilters } from './RimFilters';
import { TireCard } from './TireCard';
import { RimCard } from './RimCard';
import { RimCatalogLayout } from './RimCatalogLayout';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { fetchProductsSearch, type ProductSearchRow } from '../../utils/productsSearch';
import { buildProductImageFallback } from '../../utils/productImage';
import type { ProductPricingRules } from '../../utils/pricing';
import { buildTyreLabelSectionData, type TyreLabelSectionData } from '../../utils/tyreLabel';
import type { TyreFitmentCandidate, TyreFitmentRecommendation } from '../../utils/etrtoFitment';
import type { VehicleTyreLookupResult } from '../../utils/vehicleFitmentLookup';

type CatalogMode = 'tires' | 'rims';
type SearchMode = 'license' | 'vehicle' | 'manual';

export interface CatalogProduct {
  id: string;
  brand: string;
  model: string;
  seo_slug?: string;
  product_type: 'tire' | 'rim';
  best_price_eur?: number;
  best_image_url: string;
  in_stock: boolean;
  stock_qty?: number;
  title?: string;
  subtitle?: string;
  short_description?: string;
  long_description?: string;
  hero_image_url?: string;
  gallery_images?: string[];
  supplier_name?: string;
  delivery_days?: string;
  delivery_days_min?: number;
  delivery_days_max?: number;
  pricing_rules?: ProductPricingRules | null;
  ean?: string;
  manufacture_year?: number;
  // Tire specific
  size_text?: string;
  eu_fuel?: string;
  eu_wet?: string;
  eu_noise?: number;
  season?: string;
  runflat?: boolean;
  xl?: boolean;
  studded?: boolean;
  load_index?: string;
  speed_rating?: string;
  ev_ready?: boolean;
  threepmsf?: boolean;
  winter_approved?: boolean;
  ice_approved?: boolean;
  tyre_label_section?: TyreLabelSectionData;
  // Rim specific
  rim_width?: number;
  rim_diameter?: number;
  pcd?: string;
  et_offset?: number;
  cb?: number;
  color?: string;
  material?: string;
  bolts_included?: boolean;
}

interface CatalogPageProps {
  onProductSelect?: (product: CatalogProduct) => void;
}

const ITEMS_PER_PAGE = 24;
const CATALOG_STATE_STORAGE_KEY = 'catalog_state';
const CATALOG_SNAPSHOT_STORAGE_KEY = 'catalog_snapshot';
const CATALOG_SCROLL_POSITION_STORAGE_KEY = 'catalog_scroll_position';
const CATALOG_SCROLL_TIMESTAMP_STORAGE_KEY = 'catalog_scroll_timestamp';

function clearCatalogRestoreStorage() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(CATALOG_STATE_STORAGE_KEY);
  sessionStorage.removeItem(CATALOG_SNAPSHOT_STORAGE_KEY);
  sessionStorage.removeItem(CATALOG_SCROLL_POSITION_STORAGE_KEY);
  sessionStorage.removeItem(CATALOG_SCROLL_TIMESTAMP_STORAGE_KEY);
}

function readCatalogRestore(language: 'fi' | 'en') {
  if (typeof window === 'undefined') return null;

  const savedState = sessionStorage.getItem(CATALOG_STATE_STORAGE_KEY);
  const savedTimestamp = sessionStorage.getItem(CATALOG_SCROLL_TIMESTAMP_STORAGE_KEY);
  if (!savedState || !savedTimestamp) return null;

  const timeDiff = Date.now() - parseInt(savedTimestamp, 10);
  if (!Number.isFinite(timeDiff) || timeDiff >= 300000) {
    clearCatalogRestoreStorage();
    return null;
  }

  try {
    const state = JSON.parse(savedState);
    const savedSnapshot = sessionStorage.getItem(CATALOG_SNAPSHOT_STORAGE_KEY);
    let snapshot: { products: CatalogProduct[]; totalCount: number } | null = null;

    if (savedSnapshot) {
      const parsedSnapshot = JSON.parse(savedSnapshot);
      const canRestoreSnapshot =
        parsedSnapshot?.mode === state.mode &&
        parsedSnapshot?.currentPage === state.currentPage &&
        parsedSnapshot?.language === language &&
        Array.isArray(parsedSnapshot?.products);

      if (canRestoreSnapshot) {
        snapshot = {
          products: parsedSnapshot.products,
          totalCount: Number.isFinite(parsedSnapshot.totalCount)
            ? parsedSnapshot.totalCount
            : parsedSnapshot.products.length,
        };
      }
    }

    return { state, snapshot };
  } catch (error) {
    console.error('Failed to read catalog restore state:', error);
    clearCatalogRestoreStorage();
    return null;
  }
}

function getFallbackImage(brand?: string, model?: string) {
  return buildProductImageFallback(brand, model);
}

function getCatalogProductHref(product: CatalogProduct) {
  const identifier = product.product_type === 'tire' && product.seo_slug
    ? product.seo_slug
    : product.id;

  return `/catalog/${product.product_type}/${identifier}`;
}

function buildFiltersFromFitmentCandidate(currentFilters: any, candidate: TyreFitmentCandidate) {
  return {
    ...currentFilters,
    width: String(candidate.widthMm),
    aspectRatio: String(candidate.aspectRatio),
    diameter: String(candidate.rimDiameterIn),
  };
}

function safeParseJson(value: unknown): unknown {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return value;
    }

    const isLikelyJson =
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"'));

    if (isLikelyJson) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return value;
      }
    }
  }

  return value;
}

function getFirstMeaningfulValue(...values: unknown[]): unknown {
  for (const rawValue of values) {
    if (rawValue === null || rawValue === undefined) {
      continue;
    }

    const parsed = safeParseJson(rawValue);

    if (typeof parsed === 'string') {
      const trimmed = parsed.trim();
      if (!trimmed) {
        continue;
      }

      const normalized = trimmed.toLowerCase();
      if (normalized === 'n/a' || normalized === 'na' || normalized === 'none' || normalized === '-') {
        continue;
      }

      return trimmed;
    }

    return parsed;
  }

  return undefined;
}

function normalizeKey(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function extractLabelValue(source: unknown, keys: string[]): unknown {
  if (source === null || source === undefined) {
    return undefined;
  }

  const parsedSource = safeParseJson(source);

  if (Array.isArray(parsedSource)) {
    for (const entry of parsedSource) {
      const result = extractLabelValue(entry, keys);
      if (result !== undefined) {
        return result;
      }
    }
    return undefined;
  }

  if (typeof parsedSource !== 'object') {
    return undefined;
  }

  const record = parsedSource as Record<string, unknown>;
  const normalizedTargets = keys.map(normalizeKey);

  for (const [entryKey, entryValue] of Object.entries(record)) {
    const normalizedEntryKey = normalizeKey(entryKey);
    if (normalizedTargets.includes(normalizedEntryKey)) {
      const parsedEntryValue = safeParseJson(entryValue);
      if (parsedEntryValue !== undefined && parsedEntryValue !== null) {
        return parsedEntryValue;
      }
    }
  }

  const nestedContainers = [
    'ratings',
    'values',
    'labels',
    'metrics',
    'details',
    'data',
    'info',
    'classes',
    'grades',
    'levels',
    'attributes',
  ];

  for (const containerKey of nestedContainers) {
    if (containerKey in record) {
      const nestedResult = extractLabelValue(record[containerKey], keys);
      if (nestedResult !== undefined) {
        return nestedResult;
      }
    }
  }

  for (const [entryKey, entryValue] of Object.entries(record)) {
    const normalizedEntryKey = normalizeKey(entryKey);
    if (normalizedTargets.some((target) => normalizedEntryKey.includes(target))) {
      const nestedResult = extractLabelValue(entryValue, keys);
      if (nestedResult !== undefined) {
        return nestedResult;
      }
    }
  }

  return undefined;
}

function normalizeEuRating(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  
  const parsedValue = safeParseJson(value);

  if (Array.isArray(parsedValue)) {
    for (const entry of parsedValue) {
      const normalized = normalizeEuRating(entry);
      if (normalized) {
        return normalized;
      }
    }
    return undefined;
  }

  if (typeof parsedValue === 'object') {
    const record = parsedValue as Record<string, unknown>;
    const candidateKeys = ['grade', 'rating', 'value', 'class', 'letter', 'score'];

    for (const key of candidateKeys) {
      if (key in record) {
        const normalized = normalizeEuRating(record[key]);
        if (normalized) {
          return normalized;
        }
      }
    }

    for (const nestedValue of Object.values(record)) {
      const normalized = normalizeEuRating(nestedValue);
      if (normalized) {
        return normalized;
      }
    }

    return undefined;
  }

  const trimmed = String(parsedValue).trim();
  if (!trimmed) {
    return undefined;
  }

  const normalized = trimmed.toUpperCase();

  const numericMatch = normalized.match(/(?:^|[^0-9])([1-7])(?:[^0-9]|$)/);
  if (numericMatch) {
    const numericValue = Number.parseInt(numericMatch[1], 10);
    if (Number.isFinite(numericValue) && numericValue >= 1 && numericValue <= 7) {
      const euGrades = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
      return euGrades[numericValue - 1];
    }
  }

  const explicitLetterMatch = normalized.match(/\b([A-G])\b/);
  if (explicitLetterMatch) {
    return explicitLetterMatch[1];
  }

  const trailingLetterMatch = normalized.match(/([A-G])(?![A-Z])/);
  if (trailingLetterMatch) {
    return trailingLetterMatch[1];
  }

  return undefined;
}

function parseNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  const normalized = String(value)
    .replace(/[^0-9.,-]/g, '')
    .replace(',', '.');

  if (!normalized || normalized === '-' || normalized === '.') {
    return undefined;
  }

  const numeric = Number(normalized);

  return Number.isFinite(numeric) ? numeric : undefined;
}

function parseTireSizeParts(sizeString: string | null | undefined): {
  width?: number;
  aspect?: number;
  diameter?: number;
  loadIndex?: string;
  speedRating?: string;
} {
  if (!sizeString) return {};
  const normalized = sizeString.toUpperCase().replace(/\s+/g, '');
  const match =
    normalized.match(/(\d{3})[\/\-]?(\d{2})(?:ZR|R)?(\d{2})/) ??
    normalized.match(/(\d{3})[\/\-](\d{2}).*?R(\d{2})/);
  if (!match) return {};

  const tail = String(sizeString).toUpperCase();
  const liSrMatch = tail.match(/(?:^|\s)(\d{2,3})\s*([A-Z]{1,2})(?:\b|$)/);

  return {
    width: Number.parseInt(match[1], 10),
    aspect: Number.parseInt(match[2], 10),
    diameter: Number.parseInt(match[3], 10),
    loadIndex: liSrMatch?.[1] || undefined,
    speedRating: liSrMatch?.[2] || undefined,
  };
}

function normalizeSpeedRating(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const normalized = String(value).trim().toUpperCase().replace(/[^A-Z]/g, '');
  if (!normalized) return undefined;
  return normalized.slice(0, 2);
}

function normalizeLoadIndex(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const normalized = String(value).trim().replace(/[^0-9]/g, '');
  return normalized || undefined;
}

function formatCanonicalTireSize(
  sizeString: string | null | undefined,
  loadIndex?: string,
  speedRating?: string
): string | undefined {
  const parsed = parseTireSizeParts(sizeString);
  const li = normalizeLoadIndex(loadIndex) || normalizeLoadIndex(parsed.loadIndex);
  const sr = normalizeSpeedRating(speedRating) || normalizeSpeedRating(parsed.speedRating);

  if (parsed.width === undefined || parsed.aspect === undefined || parsed.diameter === undefined) {
    if (!sizeString) return undefined;
    return `${sizeString}${li ? ` ${li}` : ''}${sr ? ` ${sr}` : ''}`.trim();
  }

  const base = `${parsed.width} / ${String(parsed.aspect).padStart(2, '0')} R${String(parsed.diameter).padStart(2, '0')}`;
  return `${base}${li ? ` ${li}` : ''}${sr ? ` ${sr}` : ''}`.trim();
}

function getTagList(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags.map((tag) => String(tag).toLowerCase());
}

function hasAnyTag(tags: string[], patterns: string[]) {
  return patterns.some((pattern) => tags.some((tag) => tag.includes(pattern)));
}

function tireTextImpliesAllSeason(...values: unknown[]) {
  const normalized = values
    .filter((value) => value !== null && value !== undefined)
    .join(' ')
    .toLowerCase();

  return /(^|[^a-z0-9])(all[\s_-]*season|allseason|4[\s_-]*season|4seasons|multi[\s_-]*season|multiseason)([^a-z0-9]|$)/.test(normalized);
}

function normalizeProductSeason(row: ProductSearchRow, productType: 'tire' | 'rim'): string | undefined {
  if (productType !== 'tire') return undefined;

  if (tireTextImpliesAllSeason(row.model, row.card_title, (row as any).title, row.subtitle, row.seo_slug)) {
    return 'all_season';
  }

  const normalized = String(row.season ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (normalized === 'allseason') return 'all_season';
  return normalized || undefined;
}

function normalizeEuNoise(value: unknown): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const parsedValue = safeParseJson(value);

  if (Array.isArray(parsedValue)) {
    for (const entry of parsedValue) {
      const numeric = normalizeEuNoise(entry);
      if (numeric !== undefined) {
        return numeric;
      }
    }
    return undefined;
  }

  if (parsedValue && typeof parsedValue === 'object') {
    const maybeRecord = parsedValue as Record<string, unknown>;
    const candidateKeys = ['db', 'decibel', 'value', 'noise', 'level', 'amount', 'external', 'number'];
    for (const key of candidateKeys) {
      if (key in maybeRecord) {
        const numeric = normalizeEuNoise(maybeRecord[key]);
        if (numeric !== undefined) {
          return numeric;
        }
      }
    }
    return undefined;
  }

  const numeric = parseNumber(parsedValue);
  if (numeric === undefined) {
    return undefined;
  }

  return Number.isFinite(numeric) ? numeric : undefined;
}

function mapTireRow(row: any, fallbackSize?: string): CatalogProduct {
  const euLabel = safeParseJson(
    getFirstMeaningfulValue(
      row.eu_label,
      row.eu_label_data,
      row.eu_label_json,
      row.eu_label_details,
      row.eu_label_info,
      row.eu_label_values,
      row.energy_label,
      row.energy_label_data,
      row.energy_label_json,
      row.energy_label_details,
      row.tire_label,
      row.tire_label_data,
      row.label_data,
      row.label_json,
      row.eu_ratings
    )
  );

  const euFuel = normalizeEuRating(
    getFirstMeaningfulValue(
      row.eu_fuel,
      row.eu_fuel_rating,
      row.eu_fuel_grade,
      row.eu_label_fuel,
      row.eu_label_fuel_rating,
      row.eu_label_fuel_grade,
      row.fuel_efficiency,
      row.fuel_efficiency_rating,
      row.fuel_efficiency_grade,
      row.fuel_grade,
      row.fuel_rating,
      row.fuel_class,
      row.rolling_resistance,
      row.rolling_resistance_grade,
      extractLabelValue(euLabel, [
        'fuel',
        'fuel_efficiency',
        'fuelefficiency',
        'rolling_resistance',
        'rollingresistance',
        'energy',
        'energy_efficiency',
        'energyefficiency',
        'energy_class',
        'energyclass',
        'efficiency',
        'efficiency_class',
        'efficiencyclass',
      ])
    )
  );
  const euWet = normalizeEuRating(
    getFirstMeaningfulValue(
      row.eu_wet,
      row.eu_wet_rating,
      row.eu_wet_grade,
      row.eu_label_wet,
      row.eu_label_wet_rating,
      row.eu_label_wet_grade,
      row.wet_grip,
      row.wet_grip_rating,
      row.wet_grip_grade,
      row.grip,
      row.grip_rating,
      extractLabelValue(euLabel, [
        'wet',
        'wet_grip',
        'wetgrip',
        'grip',
        'rain',
        'braking',
      ])
    )
  );
  const euNoise = normalizeEuNoise(
    getFirstMeaningfulValue(
      row.eu_noise,
      row.eu_noise_level,
      row.eu_noise_db,
      row.eu_label_noise,
      row.eu_label_noise_db,
      row.eu_label_noise_value,
      row.noise,
      row.noise_level,
      row.noise_db,
      row.external_noise,
      row.external_noise_db,
      row.sound_level,
      extractLabelValue(euLabel, [
        'noise',
        'noise_level',
        'noiselevel',
        'noise_db',
        'noisedb',
        'external_noise',
        'externalnoise',
        'sound',
        'sound_level',
        'soundlevel',
        'db',
        'decibel',
      ])
    )
  );

  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    size_text: row.size_text ?? fallbackSize ?? undefined,
    eu_fuel: euFuel,
    eu_wet: euWet,
    eu_noise: euNoise,
    season: row.season ?? undefined,
    runflat: row.runflat ?? undefined,
    xl: row.xl ?? undefined,
    studded: row.studded ?? undefined,
    best_price_eur: parseNumber(row.best_price_eur),
    best_image_url: row.best_image_url || getFallbackImage(row.brand, row.model),
    in_stock: !!row.in_stock,
    product_type: 'tire',
    ean: row.ean ?? row.derived_ean ?? undefined,
  };
}

function mapRimRow(row: any): CatalogProduct {
  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    rim_width: parseNumber(row.rim_width),
    rim_diameter: parseNumber(row.rim_diameter),
    pcd: row.pcd ?? undefined,
    et_offset: parseNumber(row.et_offset),
    cb: parseNumber(row.cb),
    color: row.color ?? undefined,
    material: row.material ?? undefined,
    bolts_included: row.bolts_included ?? undefined,
    best_price_eur: parseNumber(row.best_price_eur),
    best_image_url: row.best_image_url || getFallbackImage(row.brand, row.model),
    in_stock: !!row.in_stock,
    product_type: 'rim',
  };
}

export function mapProductSearchRow(row: ProductSearchRow, productType: 'tire' | 'rim', language: 'fi' | 'en' = 'en'): CatalogProduct {
  const effectivePrice = row.final_price_eur ?? row.price;
  const priceEur = effectivePrice !== null && effectivePrice !== undefined ? effectivePrice : undefined;
  const sizeParts = parseTireSizeParts(row.size_string);
  const tags = getTagList(row.tags);
  const cmsTitle = String((row as any).title ?? '').trim() || undefined;
  const cmsSubtitle = String((row as any).subtitle ?? '').trim() || undefined;
  const cmsShortDescription = String((row as any).short_description ?? '').trim() || undefined;
  const cmsLongDescription = String((row as any).long_description ?? '').trim() || undefined;
  const cmsGallery = Array.isArray(row.gallery)
    ? row.gallery
        .map((value: unknown) => String(value ?? '').trim())
        .filter((value: string) => value.length > 0)
    : [];
  const cmsHeroImage = String((row as any).hero_image_url ?? '').trim() || undefined;
  const heroImage = cmsHeroImage || row.best_image_url || getFallbackImage(row.brand, row.model);
  const galleryImages = cmsGallery.length > 0 ? cmsGallery : [heroImage];
  const deliveryMin = typeof (row as any).delivery_days_min === 'number' ? (row as any).delivery_days_min : undefined;
  const deliveryMax = typeof (row as any).delivery_days_max === 'number' ? (row as any).delivery_days_max : undefined;
  const supplierCode = String((row as any).supplier_code_best ?? '').trim();
  const supplierName =
    supplierCode === 'VT' ? 'Vannetukku' :
    supplierCode === 'RD' ? 'RengasDuo' :
    undefined;
  const deliveryDays =
    deliveryMin !== undefined && deliveryMax !== undefined
      ? (deliveryMin === deliveryMax
          ? `${deliveryMin} ${language === 'fi' ? 'päivää' : 'Days'}`
          : `${deliveryMin}-${deliveryMax} ${language === 'fi' ? 'päivää' : 'Days'}`)
      : (deliveryMin !== undefined ? `${deliveryMin} ${language === 'fi' ? 'päivää' : 'Days'}` : undefined);
  const euLabel = safeParseJson((row as any).eu_label_json);
  const euFuel = normalizeEuRating(
    getFirstMeaningfulValue(
      (row as any).eu_fuel,
      extractLabelValue(euLabel, [
        'fuel',
        'fuel_class',
        'fuelclass',
        'fuelefficiency',
        'fuel_efficiency',
        'rrc',
        'rolling_resistance',
        'energy',
      ])
    )
  );
  const euWet = normalizeEuRating(
    getFirstMeaningfulValue(
      (row as any).eu_wet,
      extractLabelValue(euLabel, [
        'wet',
        'wet_class',
        'wet_grip_class',
        'wetgripclass',
        'wet_grip',
        'wetgrip',
      ])
    )
  );
  const euNoise = normalizeEuNoise(
    getFirstMeaningfulValue(
      (row as any).eu_noise,
      extractLabelValue(euLabel, [
        'noise',
        'noise_db',
        'noiseclass',
        'noise_class',
        'noisedb',
        'db',
      ])
    )
  );
  const loadIndex = normalizeLoadIndex((row as any).load_index) || normalizeLoadIndex(sizeParts.loadIndex);
  const speedRating = normalizeSpeedRating((row as any).speed_rating ?? (row as any).speed_index) || normalizeSpeedRating(sizeParts.speedRating);
  const season = normalizeProductSeason(row, productType);
  const seasonNormalized = season ?? '';
  const ean = String((row as any).ean ?? (row as any).derived_ean ?? '').trim() || undefined;
  const manufactureYear = parseNumber((row as any).manufacture_year);
  const evReady = Boolean((row as any).ev_ready) || hasAnyTag(tags, ['ev', 'electric']);
  const threepmsf = Boolean((row as any).threepmsf) || hasAnyTag(tags, ['3pmsf', 'snowflake', 'alpine']);
  const winterApproved = Boolean((row as any).winter_approved)
    || seasonNormalized === 'winter'
    || seasonNormalized === 'all_season'
    || hasAnyTag(tags, ['winter']);
  const iceApproved = Boolean((row as any).ice_approved) || hasAnyTag(tags, ['ice']);
  const tyreLabelSection =
    productType === 'tire'
      ? buildTyreLabelSectionData({
          existing: (row as any)?.spec_overrides?.tyre_label_section,
          brand: row.brand_display_name || row.brand,
          supplierName: supplierName,
          model: row.model,
          sizeString: formatCanonicalTireSize(row.size_string, loadIndex, speedRating) ?? row.size_string,
          widthMm: row.width_mm,
          aspectRatio: row.aspect_ratio,
          diameterIn: row.diameter_in,
          loadIndex,
          speedRating,
          season,
          ean,
          supplierCodeBest: supplierCode,
          runflat: row.runflat,
          xlReinforced: row.xl_reinforced,
          evReady,
          studded: row.studded,
          threepmsf,
          winterApproved,
          iceApproved,
          euFuelClass: euFuel,
          euWetGripClass: euWet,
          euNoiseDb: euNoise,
        })
      : undefined;

  return {
    id: row.variant_id,
    brand: row.brand_display_name || row.brand,
    model: row.model,
    seo_slug: row.seo_slug ?? undefined,
    title: cmsTitle || row.card_title || undefined,
    subtitle: cmsSubtitle || undefined,
    short_description: cmsShortDescription,
    long_description: cmsLongDescription,
    hero_image_url: heroImage,
    gallery_images: galleryImages,
    supplier_name: supplierName,
    delivery_days: deliveryDays,
    delivery_days_min: deliveryMin,
    delivery_days_max: deliveryMax,
    size_text: productType === 'tire' ? formatCanonicalTireSize(row.size_string, loadIndex, speedRating) : (row.size_string ?? undefined),
    ean,
    manufacture_year: productType === 'tire' ? manufactureYear : undefined,
    best_price_eur: priceEur,
    best_image_url: heroImage,
    in_stock: row.in_stock ?? false,
    stock_qty: row.stock_qty ?? undefined,
    pricing_rules: row.pricing_rules ?? null,
    product_type: productType,
    // Tire-specific fields
    season,
    runflat: productType === 'tire' ? row.runflat ?? undefined : undefined,
    xl: productType === 'tire' ? row.xl_reinforced ?? undefined : undefined,
    studded: productType === 'tire' ? row.studded ?? undefined : undefined,
    eu_fuel: productType === 'tire' ? euFuel : undefined,
    eu_wet: productType === 'tire' ? euWet : undefined,
    eu_noise: productType === 'tire' ? euNoise : undefined,
    load_index: productType === 'tire' ? loadIndex : undefined,
    speed_rating: productType === 'tire' ? speedRating : undefined,
    ev_ready: productType === 'tire' ? evReady : undefined,
    threepmsf: productType === 'tire' ? threepmsf : undefined,
    winter_approved: productType === 'tire' ? winterApproved : undefined,
    ice_approved: productType === 'tire' ? iceApproved : undefined,
    tyre_label_section: tyreLabelSection,
    // Rim-specific fields
    rim_width: productType === 'rim' ? row.width_in ?? undefined : undefined,
    rim_diameter: productType === 'rim' ? row.rim_diameter_in ?? undefined : undefined,
    et_offset: productType === 'rim' ? row.et_offset_mm ?? undefined : undefined,
    pcd: productType === 'rim' ? row.bolt_pattern ?? undefined : undefined,
    color: productType === 'rim' ? row.color ?? undefined : undefined,
    cb: productType === 'rim' ? (row as any).cb_mm ?? (row as any).center_bore_mm ?? undefined : undefined,
    material: productType === 'rim' ? (row as any).material ?? row.finish ?? undefined : undefined,
    bolts_included: productType === 'rim' ? (row as any).bolts_included ?? undefined : undefined,
  };
}

export function CatalogPage({ onProductSelect }: CatalogPageProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { addToCart } = useCart();
  const initialRestoreRef = React.useRef(readCatalogRestore(language));
  const [mode, setMode] = useState<CatalogMode>(initialRestoreRef.current?.state?.mode ?? 'tires');
  const [searchMode, setSearchMode] = useState<SearchMode>(initialRestoreRef.current?.state?.searchMode ?? 'license');
  const [products, setProducts] = useState<CatalogProduct[]>(initialRestoreRef.current?.snapshot?.products ?? []);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(initialRestoreRef.current?.state?.hasSearched ?? true);
  const [currentPage, setCurrentPage] = useState(initialRestoreRef.current?.state?.currentPage ?? 1);
  const [totalCount, setTotalCount] = useState(initialRestoreRef.current?.snapshot?.totalCount ?? 0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>(initialRestoreRef.current?.state?.filters ?? { ...DEFAULT_TIRE_FILTERS });
  const [vehicleFitment, setVehicleFitment] = useState<{
    vehicle: VehicleTyreLookupResult;
    recommendation: TyreFitmentRecommendation;
    selectedSizeKey: string;
  } | null>(null);
  const [isRestoringState, setIsRestoringState] = useState(Boolean(initialRestoreRef.current));
  const productsGridRef = React.useRef<HTMLDivElement>(null);
  const restoreFetchStartedRef = React.useRef(Boolean(initialRestoreRef.current));
  const skipNextCatalogFetchRef = React.useRef(false);
  
  const handleProductClick = useCallback(
    (product: CatalogProduct) => {
      // Save catalog state before navigation
      const catalogState = {
        mode,
        searchMode,
        filters,
        currentPage,
        hasSearched,
      };
      const catalogSnapshot = {
        mode,
        currentPage,
        language,
        products,
        totalCount,
      };
      sessionStorage.setItem(CATALOG_STATE_STORAGE_KEY, JSON.stringify(catalogState));
      sessionStorage.setItem(CATALOG_SNAPSHOT_STORAGE_KEY, JSON.stringify(catalogSnapshot));
      sessionStorage.setItem(CATALOG_SCROLL_POSITION_STORAGE_KEY, window.scrollY.toString());
      sessionStorage.setItem(CATALOG_SCROLL_TIMESTAMP_STORAGE_KEY, Date.now().toString());
      
      onProductSelect?.(product);
    },
    [onProductSelect, mode, searchMode, filters, currentPage, hasSearched, language, products, totalCount]
  );

  const handleAddToCart = useCallback(
    (product: CatalogProduct, e: React.MouseEvent) => {
      e.stopPropagation();
      // Add 4 pieces (set of 4) by default for tires/rims
      const stockLimit = product.in_stock && typeof product.stock_qty === 'number' && product.stock_qty > 0
        ? Math.floor(product.stock_qty)
        : null;
      addToCart(product, Math.min(4, stockLimit ?? 4));
    },
    [addToCart]
  );

  // Restore catalog state when returning from product detail
  useEffect(() => {
    const savedState = sessionStorage.getItem(CATALOG_STATE_STORAGE_KEY);
    const savedTimestamp = sessionStorage.getItem(CATALOG_SCROLL_TIMESTAMP_STORAGE_KEY);
    
    if (savedState && savedTimestamp) {
      try {
        // Only restore if timestamp is recent (within 5 minutes)
        const timeDiff = Date.now() - parseInt(savedTimestamp, 10);
        if (timeDiff < 300000) { // 5 minutes
          const state = JSON.parse(savedState);
          setIsRestoringState(true);
          
          // Restore all catalog state
          setMode(state.mode);
          setSearchMode(state.searchMode);
          setFilters(state.filters);
          setCurrentPage(state.currentPage);
          setHasSearched(state.hasSearched);

          const savedSnapshot = sessionStorage.getItem(CATALOG_SNAPSHOT_STORAGE_KEY);
          if (savedSnapshot) {
            try {
              const snapshot = JSON.parse(savedSnapshot);
              const canRestoreSnapshot =
                snapshot?.mode === state.mode &&
                snapshot?.currentPage === state.currentPage &&
                snapshot?.language === language &&
                Array.isArray(snapshot?.products);

              if (canRestoreSnapshot) {
                setProducts(snapshot.products);
                setTotalCount(Number.isFinite(snapshot.totalCount) ? snapshot.totalCount : snapshot.products.length);
              }
            } catch (snapshotError) {
              console.error('Failed to restore catalog snapshot:', snapshotError);
              sessionStorage.removeItem(CATALOG_SNAPSHOT_STORAGE_KEY);
            }
          }

          restoreFetchStartedRef.current = true;
          void fetchProducts(state.currentPage, state.filters, state.mode, { silent: true });
        } else {
          // Clear old data
          sessionStorage.removeItem(CATALOG_STATE_STORAGE_KEY);
          sessionStorage.removeItem(CATALOG_SNAPSHOT_STORAGE_KEY);
          sessionStorage.removeItem(CATALOG_SCROLL_POSITION_STORAGE_KEY);
          sessionStorage.removeItem(CATALOG_SCROLL_TIMESTAMP_STORAGE_KEY);
        }
      } catch (error) {
        console.error('Failed to restore catalog state:', error);
        sessionStorage.removeItem(CATALOG_STATE_STORAGE_KEY);
        sessionStorage.removeItem(CATALOG_SNAPSHOT_STORAGE_KEY);
      }
    }
  }, []);

  // Restore scroll position after products are loaded
  useEffect(() => {
    if (!isRestoringState || loading) return;

    const savedPosition = sessionStorage.getItem(CATALOG_SCROLL_POSITION_STORAGE_KEY);

    if (products.length > 0 && savedPosition) {
      requestAnimationFrame(() => {
        window.scrollTo({
          top: parseInt(savedPosition, 10),
          behavior: 'auto'
        });
        sessionStorage.removeItem(CATALOG_SCROLL_POSITION_STORAGE_KEY);
        sessionStorage.removeItem(CATALOG_SCROLL_TIMESTAMP_STORAGE_KEY);
        sessionStorage.removeItem(CATALOG_STATE_STORAGE_KEY);
        sessionStorage.removeItem(CATALOG_SNAPSHOT_STORAGE_KEY);
        restoreFetchStartedRef.current = false;
        skipNextCatalogFetchRef.current = true;
        setIsRestoringState(false);
      });
      return;
    }

    if (!restoreFetchStartedRef.current) {
      sessionStorage.removeItem(CATALOG_SCROLL_POSITION_STORAGE_KEY);
      sessionStorage.removeItem(CATALOG_SCROLL_TIMESTAMP_STORAGE_KEY);
      sessionStorage.removeItem(CATALOG_STATE_STORAGE_KEY);
      sessionStorage.removeItem(CATALOG_SNAPSHOT_STORAGE_KEY);
      setIsRestoringState(false);
    }
  }, [isRestoringState, products, loading]);


  // Only fetch when search is explicitly triggered
  const handleSearch = () => {
    setHasSearched(true);
    setCurrentPage(1);
    fetchProducts(1, filters, mode);
  };

  // Trigger fetch when state is restored
  useEffect(() => {
    if (isRestoringState && hasSearched && !restoreFetchStartedRef.current) {
      restoreFetchStartedRef.current = true;
      fetchProducts();
    }
  }, [isRestoringState, hasSearched]);

  // Normal pagination
  useEffect(() => {
    if (hasSearched && !isRestoringState) {
      if (skipNextCatalogFetchRef.current) {
        skipNextCatalogFetchRef.current = false;
        return;
      }
      fetchProducts();
    }
  }, [currentPage, mode, hasSearched, isRestoringState]);

  const fetchProducts = async (
    page = currentPage,
    activeFilters = filters,
    activeMode = mode,
    options: { silent?: boolean } = {}
  ) => {
    if (!options.silent) {
      setLoading(true);
      setErrorMessage(null);
    }
    try {
      const category: 'tire' | 'rim' = activeMode === 'tires' ? 'tire' : 'rim';
      const { items, total } = await fetchProductsSearch(category, {
        limit: ITEMS_PER_PAGE,
        offset: (page - 1) * ITEMS_PER_PAGE,
        filters: activeFilters,
      });
      const mapped = items.map((row) => mapProductSearchRow(row, category, language));

      setProducts(mapped);
      setTotalCount(total ?? mapped.length);
    } catch (e) {
      console.error('Error fetching products:', e);
      if (options.silent) {
        return;
      }
      setProducts([]);
      setTotalCount(0);
      const message = e instanceof Error ? e.message : '';
      const isSupabaseConfigError = message.includes('VITE_SUPABASE_ANON_KEY');
      setErrorMessage(
        isSupabaseConfigError
          ? (language === 'fi'
              ? 'Supabase-asetukset puuttuvat. Lisää VITE_SUPABASE_ANON_KEY Vite-ympäristöön.'
              : 'Supabase config is missing. Add VITE_SUPABASE_ANON_KEY to the Vite environment.')
          : (language === 'fi'
              ? 'Tuotteiden lataus epäonnistui. Yritä uudelleen hetken kuluttua.'
              : 'Failed to load products. Please try again soon.')
      );
    } finally {
      if (!options.silent) {
        setLoading(false);
      }
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const productGridClass = mode === 'rims'
    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5'
    : 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-6';
  const shouldAnimateProductGrid = !isRestoringState;

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleVehicleRecommendation = (
    vehicle: VehicleTyreLookupResult,
    recommendation: TyreFitmentRecommendation,
  ) => {
    const factoryFilters = buildFiltersFromFitmentCandidate(filters, recommendation.factory);

    setVehicleFitment({ vehicle, recommendation, selectedSizeKey: recommendation.factory.sizeKey });
    setFilters(factoryFilters);
    setHasSearched(true);
    setCurrentPage(1);
    void fetchProducts(1, factoryFilters, 'tires');
  };

  const handleFitmentSizeSelect = (candidate: TyreFitmentCandidate) => {
    const nextFilters = buildFiltersFromFitmentCandidate(filters, candidate);
    setVehicleFitment((current) => current
      ? { ...current, selectedSizeKey: candidate.sizeKey }
      : current);
    setFilters(nextFilters);
    setHasSearched(true);
    setCurrentPage(1);
    void fetchProducts(1, nextFilters, 'tires');
  };

  const scrollToProducts = () => {
    if (productsGridRef.current) {
      const offset = 100; // Offset for sticky header
      const elementPosition = productsGridRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className={`min-h-screen ${
      theme === 'dark'
        ? 'bg-gradient-to-b from-[#0B0D10] to-[#161A22]'
        : 'bg-gradient-to-b from-white to-gray-50'
    }`}>
      {/* Mode Selector Tabs */}
      <div className={`sticky top-16 z-30 backdrop-blur-xl border-b ${
        theme === 'dark'
          ? 'bg-[#0B0D10]/80 border-white/5'
          : 'bg-white/80 border-gray-200'
      }`}>
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center justify-center gap-4 py-6">
            <button
              onClick={() => {
                setMode('tires');
                setFilters({ ...DEFAULT_TIRE_FILTERS });
                setHasSearched(false);
                setProducts([]);
                setErrorMessage(null);
                setCurrentPage(1);
              }}
              className={`
                relative px-8 py-3 rounded-xl transition-all duration-300
                ${mode === 'tires'
                  ? 'bg-[#FF6B35]/20 border border-[#FF6B35]/50'
                  : theme === 'dark'
                    ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                    : 'bg-gray-100 hover:bg-gray-200 border border-gray-300'
                }
                ${theme === 'dark' ? 'text-white' : mode === 'tires' ? 'text-[#FF6B35]' : 'text-gray-600'}
              `}
            >
              {mode === 'tires' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-[#FF6B35]/20 rounded-xl border border-[#FF6B35]/50"
                  style={{ boxShadow: '0 0 24px rgba(255,107,53,0.25)' }}
                />
              )}
              <span className="relative z-10">
                {language === 'fi' ? 'Renkaat' : 'Tires'}
              </span>
            </button>

            <button
              onClick={() => {
                setMode('rims');
                setFilters({});
                setHasSearched(false);
                setProducts([]);
                setErrorMessage(null);
                setCurrentPage(1);
              }}
              className={`
                relative px-8 py-3 rounded-xl transition-all duration-300
                ${mode === 'rims'
                  ? 'bg-[#FF6B35]/20 border border-[#FF6B35]/50'
                  : theme === 'dark'
                    ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                    : 'bg-gray-100 hover:bg-gray-200 border border-gray-300'
                }
                ${theme === 'dark' ? 'text-white' : mode === 'rims' ? 'text-[#FF6B35]' : 'text-gray-600'}
              `}
            >
              {mode === 'rims' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-[#FF6B35]/20 rounded-xl border border-[#FF6B35]/50"
                  style={{ boxShadow: '0 0 24px rgba(255,107,53,0.25)' }}
                />
              )}
              <span className="relative z-10">
                {language === 'fi' ? 'Vanteet' : 'Rims'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      {mode === 'rims' ? (
        <RimCatalogLayout
          language={language}
          theme={theme}
          searchMode={searchMode === 'license' ? 'license' : 'manual'}
          onSearchModeChange={setSearchMode}
          filters={(
            <RimFilters
              onFilterChange={handleFilterChange}
              onSearch={handleSearch}
              searchMode={searchMode}
            />
          )}
          hasSearched={hasSearched}
          totalCount={totalCount}
          errorMessage={errorMessage}
          loading={loading}
          productsGridRef={productsGridRef}
          emptyBeforeSearch={(
            <div className={`rounded-xl border px-6 py-12 text-center ${theme === 'dark' ? 'border-white/10 bg-[#0f1319]' : 'border-gray-200 bg-gray-50'}`}>
              <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {language === 'fi' ? 'Aloita vannemitoituksen haku' : 'Start a rim fitment search'}
              </h2>
              <p className={`mx-auto mt-2 max-w-xl text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {language === 'fi'
                  ? 'Hae rekisterinumerolla, jos haluat suositellut vaihtoehdot ajoneuvolle. Käytä manuaalista hakua, kun tiedät halkaisijan, leveyden tai PCD:n jo valmiiksi.'
                  : 'Use vehicle search for recommended fitment, or switch to manual search when you already know the diameter, width, or PCD you need.'}
              </p>
            </div>
          )}
          content={loading ? (
            <div className={productGridClass}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-[500px] rounded-xl animate-pulse ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-200'}`}
                />
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${mode}-${currentPage}`}
                initial={shouldAnimateProductGrid ? { opacity: 0, y: 20 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldAnimateProductGrid ? { opacity: 0, y: -20 } : undefined}
                transition={{ duration: shouldAnimateProductGrid ? 0.3 : 0 }}
                className={productGridClass}
              >
                {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={shouldAnimateProductGrid ? { opacity: 0, y: 20 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: shouldAnimateProductGrid ? index * 0.05 : 0 }}
                  className="h-full"
                >
                  <RimCard
                      product={product}
                      href={getCatalogProductHref(product)}
                      index={index}
                      onClick={onProductSelect ? () => handleProductClick(product) : undefined}
                      onAddToCart={(e) => handleAddToCart(product, e)}
                      disableInitialAnimation={!shouldAnimateProductGrid}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
          emptyAfterSearch={(
            <div className={`rounded-xl border px-6 py-12 text-center ${theme === 'dark' ? 'border-white/10 bg-[#0f1319]' : 'border-gray-200 bg-gray-50'}`}>
              <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {language === 'fi' ? 'Hakuehdoilla ei löytynyt vanteita' : 'No rims matched these filters'}
              </h2>
              <p className={`mx-auto mt-2 max-w-xl text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {language === 'fi'
                  ? 'Kokeile toista halkaisijaa, väljempää PCD-suodatusta tai poista ET- ja keskiöreikärajaukset.'
                  : 'Try a different diameter, a wider PCD match, or remove the ET and center-bore constraints.'}
              </p>
            </div>
          )}
          pagination={totalPages > 1 ? (
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={() => {
                  setCurrentPage(prev => Math.max(1, prev - 1));
                  scrollToProducts();
                }}
                disabled={currentPage === 1}
                variant="outline"
                className={`disabled:opacity-30 flex items-center justify-center ${
                  theme === 'dark'
                    ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white'
                    : 'border-gray-300 bg-gray-100 hover:bg-gray-200 text-gray-900'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <span className={theme === 'dark' ? 'text-[#B0B8C4]' : 'text-gray-600'}>
                {currentPage} / {totalPages}
              </span>
              <Button
                onClick={() => {
                  setCurrentPage(prev => Math.min(totalPages, prev + 1));
                  scrollToProducts();
                }}
                disabled={currentPage === totalPages}
                variant="outline"
                className={`disabled:opacity-30 flex items-center justify-center ${
                  theme === 'dark'
                    ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white'
                    : 'border-gray-300 bg-gray-100 hover:bg-gray-200 text-gray-900'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          ) : null}
          onClearSearch={() => {
            setFilters({});
            setHasSearched(false);
            setProducts([]);
            setCurrentPage(1);
            setErrorMessage(null);
          }}
        />
      ) : (
      <div className="container mx-auto max-w-7xl px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-8">
              <h1 className={`text-5xl lg:text-6xl mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {language === 'fi' ? 'Löydä Renkaasi' : 'Find Your Tires'}
              </h1>
              <p className={`text-xl ${theme === 'dark' ? 'text-[#B0B8C4]' : 'text-gray-600'}`}>
                {language === 'fi'
                  ? 'Valitse hakutapa löytääksesi täydellisen sopivuuden ajoneuvollesi.'
                  : 'Choose your search method to find the perfect fit for your vehicle.'}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Filters */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-8"
          >
            <TireFilters 
              filters={filters}
              onFilterChange={handleFilterChange} 
              onSearch={handleSearch}
              onVehicleRecommendation={handleVehicleRecommendation}
              onSearchModeChange={setSearchMode}
              searchMode={searchMode}
            />
          </motion.div>
        </AnimatePresence>

        {vehicleFitment ? (
          <div className={`mb-8 rounded-2xl border p-5 ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white' : 'border-gray-200 bg-white text-gray-900'}`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-[#B0B8C4]' : 'text-gray-600'}`}>
                  {vehicleFitment.vehicle.plate} · {vehicleFitment.vehicle.description}
                  {vehicleFitment.vehicle.year ? ` · ${vehicleFitment.vehicle.year}` : ''}
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  {language === 'fi' ? 'Tehdaskoot' : 'Factory sizes'}: {(vehicleFitment.vehicle.factoryTyreSizes?.length ? vehicleFitment.vehicle.factoryTyreSizes : [vehicleFitment.recommendation.factory.label]).join(', ')}
                </h2>
                <p className={`mt-2 max-w-3xl text-sm ${theme === 'dark' ? 'text-[#B0B8C4]' : 'text-gray-600'}`}>
                  {language === 'fi'
                    ? 'Vaihtoehdot on laskettu tehdaskoon ja ETRTO-standardin perusteella. Lopullinen sopivuus riippuu vanteesta, ET-luvusta, keskireiästä ja ajoneuvon välyksistä.'
                    : 'Alternatives are calculated from the factory size and ETRTO standards. Final fitment depends on wheel width, offset, center bore, and vehicle clearance.'}
                </p>
              </div>
              <div className={`rounded-xl border px-4 py-3 text-sm ${theme === 'dark' ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-gray-50'}`}>
                <div className="font-medium">{language === 'fi' ? 'ETRTO vanneleveydet' : 'ETRTO rim widths'}</div>
                <div className="mt-1 font-mono">
                  {vehicleFitment.recommendation.factory.approvedRimWidths.map((width) => `${width}J`).join(', ') || '-'}
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className={`mb-3 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {language === 'fi' ? 'Valitse koko ja näytä varastotuotteet' : 'Select a size to show matching products'}
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {[vehicleFitment.recommendation.factory, ...vehicleFitment.recommendation.alternatives.slice(0, 8)].map((candidate) => {
                  const selected = vehicleFitment.selectedSizeKey === candidate.sizeKey;
                  const isFactory = candidate.confidence === 'factory';
                  return (
                    <button
                      key={`${candidate.sizeKey}-${isFactory ? 'factory' : 'alternative'}`}
                      type="button"
                      onClick={() => handleFitmentSizeSelect(candidate)}
                      className={`rounded-xl border p-4 text-left transition ${
                        selected
                          ? 'border-[#FF6B35] bg-[#FF6B35]/10 shadow-[0_0_0_1px_rgba(255,107,53,0.35)]'
                          : theme === 'dark'
                            ? 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">{candidate.label}</div>
                          <div className={`mt-1 text-xs ${theme === 'dark' ? 'text-[#B0B8C4]' : 'text-gray-600'}`}>
                            {isFactory
                              ? (language === 'fi' ? 'Auton tehdaskoko' : 'Vehicle factory size')
                              : `${language === 'fi' ? 'Halkaisijaero' : 'Diameter difference'}: ${candidate.diameterDifferencePercent > 0 ? '+' : ''}${candidate.diameterDifferencePercent.toFixed(1)}%`}
                          </div>
                        </div>
                        <span className={`rounded-md px-2 py-1 text-xs font-medium ${
                          isFactory
                            ? 'bg-[#FF6B35]/15 text-[#FF6B35]'
                            : candidate.confidence === 'recommended'
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : 'bg-amber-500/15 text-amber-500'
                        }`}>
                          {isFactory
                            ? (language === 'fi' ? 'Tehdas' : 'Factory')
                            : candidate.confidence === 'recommended'
                              ? (language === 'fi' ? 'Suositus' : 'Recommended')
                              : (language === 'fi' ? 'Mahdollinen' : 'Possible')}
                        </span>
                      </div>
                      <div className={`mt-3 text-xs ${theme === 'dark' ? 'text-[#B0B8C4]' : 'text-gray-600'}`}>
                        LI {candidate.loadIndex ?? '-'}{candidate.loadVersion === 'highLoad' ? ' HL' : candidate.loadVersion === 'reinforced' ? ' XL' : ''} · {candidate.loadCapacityKg ?? '-'} kg · {candidate.approvedRimWidths.map((width) => `${width}J`).join(', ')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {hasSearched && <div ref={productsGridRef} className="mb-0 h-0" aria-hidden="true" />}

        {errorMessage && (
          <div className={`mb-4 text-sm ${theme === 'dark' ? 'text-red-300' : 'text-red-600'}`}>
            {errorMessage}
          </div>
        )}


        {/* Empty State - Before Search */}
        {!hasSearched && (
          <div className="text-center py-20">
            <div className={`mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-lg border ${theme === 'dark' ? 'border-white/10 bg-white/5 text-[#B0B8C4]' : 'border-gray-200 bg-white text-gray-500'}`}>
              <Search className="h-5 w-5" />
            </div>
            <h3 className={`text-2xl mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {language === 'fi' ? 'Aloita haku' : 'Start Your Search'}
            </h3>
              <p className={`max-w-md mx-auto ${theme === 'dark' ? 'text-[#B0B8C4]' : 'text-gray-600'}`}>
                {language === 'fi'
                  ? 'Valitse hakutapa yllä ja täytä tiedot löytääksesi sopivat renkaat.'
                  : 'Select a search method above and fill in the details to find matching tires.'}
              </p>
          </div>
        )}

        {/* Product Grid */}
        {hasSearched && loading ? (
          <div className={productGridClass}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={`h-[500px] rounded-2xl backdrop-blur-sm animate-pulse ${
                  theme === 'dark' ? 'bg-white/5' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${mode}-${currentPage}`}
              initial={shouldAnimateProductGrid ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldAnimateProductGrid ? { opacity: 0, y: -20 } : undefined}
              transition={{ duration: shouldAnimateProductGrid ? 0.3 : 0 }}
              className={productGridClass}
            >
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={shouldAnimateProductGrid ? { opacity: 0, y: 20 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: shouldAnimateProductGrid ? index * 0.05 : 0 }}
                  className="h-full"
                >
                  <TireCard
                    product={product}
                    href={getCatalogProductHref(product)}
                    index={index}
                    onClick={onProductSelect ? () => handleProductClick(product) : undefined}
                    onAddToCart={(e) => handleAddToCart(product, e)}
                    disableInitialAnimation={!shouldAnimateProductGrid}
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Empty State - No Results */}
        {hasSearched && !loading && products.length === 0 && (
          <div className="text-center py-20">
            <p className={`text-2xl mb-4 ${theme === 'dark' ? 'text-[#B0B8C4]' : 'text-gray-600'}`}>
              {language === 'fi'
                ? 'Ei renkaita hakuehdoillasi'
                : 'No tires found with your filters'}
            </p>
            <Button
              onClick={() => {
                setFilters({ ...DEFAULT_TIRE_FILTERS });
                setHasSearched(false);
                setProducts([]);
                setCurrentPage(1);
                setErrorMessage(null);
              }}
              className="bg-[#FF6B35] hover:bg-[#FF6B35]/80"
            >
              {language === 'fi' ? 'Tyhjennä haku' : 'Clear Search'}
            </Button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-12">
            <Button
              onClick={() => {
                setCurrentPage(prev => Math.max(1, prev - 1));
                scrollToProducts();
              }}
              disabled={currentPage === 1}
              variant="outline"
              className={`disabled:opacity-30 flex items-center justify-center ${
                theme === 'dark'
                  ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white'
                  : 'border-gray-300 bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => {
                      setCurrentPage(pageNum);
                      scrollToProducts();
                    }}
                    className={`
                      w-10 h-10 rounded-lg transition-all duration-200
                      flex items-center justify-center
                      ${currentPage === pageNum
                        ? 'bg-[#FF6B35] text-white shadow-[0_0_24px_rgba(255,107,53,0.25)]'
                        : theme === 'dark'
                          ? 'bg-white/5 text-[#B0B8C4] hover:bg-white/10 hover:text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                      }
                    `}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <Button
              onClick={() => {
                setCurrentPage(prev => Math.min(totalPages, prev + 1));
                scrollToProducts();
              }}
              disabled={currentPage === totalPages}
              variant="outline"
              className={`disabled:opacity-30 flex items-center justify-center ${
                theme === 'dark'
                  ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white'
                  : 'border-gray-300 bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
