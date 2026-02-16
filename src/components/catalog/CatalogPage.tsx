import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeContext';
import { useCart } from '../CartContext';
import { motion, AnimatePresence } from 'motion/react';
import { TireFilters } from './TireFilters';
import { RimFilters } from './RimFilters';
import { TireCard } from './TireCard';
import { RimCard } from './RimCard';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchProductsSearch, type ProductSearchRow } from '../../utils/productsSearch';

type CatalogMode = 'tires' | 'rims';
type SearchMode = 'license' | 'vehicle' | 'manual';

export interface CatalogProduct {
  id: string;
  brand: string;
  model: string;
  product_type: 'tire' | 'rim';
  best_price_eur?: number;
  best_image_url: string;
  in_stock: boolean;
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

function getFallbackImage(brand?: string, model?: string) {
  const label = encodeURIComponent(`${brand ?? 'Product'} ${model ?? ''}`.trim());
  return `https://picsum.photos/seed/${label}/640/640`;
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

function mapProductSearchRow(row: ProductSearchRow, productType: 'tire' | 'rim'): CatalogProduct {
  const priceEur = row.price !== null && row.price !== undefined ? row.price : undefined;
  const sizeParts = parseTireSizeParts(row.size_string);
  const tags = getTagList(row.tags);
  const loadIndex = normalizeLoadIndex((row as any).load_index) || normalizeLoadIndex(sizeParts.loadIndex);
  const speedRating = normalizeSpeedRating((row as any).speed_rating ?? (row as any).speed_index) || normalizeSpeedRating(sizeParts.speedRating);
  const seasonNormalized = String(row.season ?? '').toLowerCase();
  const evReady = Boolean((row as any).ev_ready) || hasAnyTag(tags, ['ev', 'electric']);
  const threepmsf = Boolean((row as any).threepmsf) || hasAnyTag(tags, ['3pmsf', 'snowflake', 'alpine']);
  const winterApproved = Boolean((row as any).winter_approved)
    || seasonNormalized === 'winter'
    || seasonNormalized === 'all_season'
    || hasAnyTag(tags, ['winter']);
  const iceApproved = Boolean((row as any).ice_approved) || hasAnyTag(tags, ['ice']);

  return {
    id: row.variant_id,
    brand: row.brand_display_name || row.brand,
    model: row.model,
    size_text: productType === 'tire' ? formatCanonicalTireSize(row.size_string, loadIndex, speedRating) : (row.size_string ?? undefined),
    best_price_eur: priceEur,
    best_image_url: row.best_image_url || getFallbackImage(row.brand, row.model),
    in_stock: row.in_stock ?? false,
    product_type: productType,
    // Tire-specific fields
    season: productType === 'tire' ? row.season ?? undefined : undefined,
    runflat: productType === 'tire' ? row.runflat ?? undefined : undefined,
    xl: productType === 'tire' ? row.xl_reinforced ?? undefined : undefined,
    studded: productType === 'tire' ? row.studded ?? undefined : undefined,
    load_index: productType === 'tire' ? loadIndex : undefined,
    speed_rating: productType === 'tire' ? speedRating : undefined,
    ev_ready: productType === 'tire' ? evReady : undefined,
    threepmsf: productType === 'tire' ? threepmsf : undefined,
    winter_approved: productType === 'tire' ? winterApproved : undefined,
    ice_approved: productType === 'tire' ? iceApproved : undefined,
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
  const [mode, setMode] = useState<CatalogMode>('tires');
  const [searchMode, setSearchMode] = useState<SearchMode>('manual');
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>({});
  const [isRestoringState, setIsRestoringState] = useState(false);
  const productsGridRef = React.useRef<HTMLDivElement>(null);
  
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
      sessionStorage.setItem('catalog_state', JSON.stringify(catalogState));
      sessionStorage.setItem('catalog_scroll_position', window.scrollY.toString());
      sessionStorage.setItem('catalog_scroll_timestamp', Date.now().toString());
      
      onProductSelect?.(product);
    },
    [onProductSelect, mode, searchMode, filters, currentPage, hasSearched]
  );

  const handleAddToCart = useCallback(
    (product: CatalogProduct, e: React.MouseEvent) => {
      e.stopPropagation();
      // Add 4 pieces (set of 4) by default for tires/rims
      addToCart(product, 4);
    },
    [addToCart]
  );

  // Restore catalog state when returning from product detail
  useEffect(() => {
    const savedState = sessionStorage.getItem('catalog_state');
    const savedTimestamp = sessionStorage.getItem('catalog_scroll_timestamp');
    
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
        } else {
          // Clear old data
          sessionStorage.removeItem('catalog_state');
          sessionStorage.removeItem('catalog_scroll_position');
          sessionStorage.removeItem('catalog_scroll_timestamp');
        }
      } catch (error) {
        console.error('Failed to restore catalog state:', error);
        sessionStorage.removeItem('catalog_state');
      }
    }
  }, []);

  // Restore scroll position after products are loaded
  useEffect(() => {
    if (isRestoringState && products.length > 0 && !loading) {
      const savedPosition = sessionStorage.getItem('catalog_scroll_position');
      if (savedPosition) {
        requestAnimationFrame(() => {
          window.scrollTo({
            top: parseInt(savedPosition, 10),
            behavior: 'instant'
          });
          // Clear the stored data after restoring
          sessionStorage.removeItem('catalog_scroll_position');
          sessionStorage.removeItem('catalog_scroll_timestamp');
          sessionStorage.removeItem('catalog_state');
          setIsRestoringState(false);
        });
      }
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
    if (isRestoringState && hasSearched) {
      fetchProducts();
    }
  }, [isRestoringState, hasSearched]);

  // Normal pagination
  useEffect(() => {
    if (hasSearched && !isRestoringState) {
      fetchProducts();
    }
  }, [currentPage, mode, hasSearched, isRestoringState]);

  const fetchProducts = async (
    page = currentPage,
    activeFilters = filters,
    activeMode = mode
  ) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const category: 'tire' | 'rim' = activeMode === 'tires' ? 'tire' : 'rim';
      const { items, total } = await fetchProductsSearch(category, {
        limit: ITEMS_PER_PAGE,
        offset: (page - 1) * ITEMS_PER_PAGE,
        filters: activeFilters,
      });
      const mapped = items.map((row) => mapProductSearchRow(row, category));

      setProducts(mapped);
      setTotalCount(total ?? mapped.length);
    } catch (e) {
      console.error('Error fetching products:', e);
      setProducts([]);
      setTotalCount(0);
      setErrorMessage(
        language === 'fi'
          ? 'Tuotteiden lataus epäonnistui. Yritä uudelleen hetken kuluttua.'
          : 'Failed to load products. Please try again soon.'
      );
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
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
                setFilters({});
                setHasSearched(true);
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
                {language === 'fi' ? '🛞 Renkaat' : '🛞 Tires'}
              </span>
            </button>

            <button
              onClick={() => {
                setMode('rims');
                setFilters({});
                setHasSearched(true);
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
                {language === 'fi' ? '⚙️ Vanteet' : '⚙️ Rims'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="container mx-auto max-w-7xl px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {mode === 'tires' ? (
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
            ) : (
              <div className="text-center mb-8">
                <h1 className={`text-5xl lg:text-6xl mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fi' ? 'Valitse Vanteesi' : 'Choose Your Rims'}
                </h1>
                <p className={`text-xl ${theme === 'dark' ? 'text-[#B0B8C4]' : 'text-gray-600'}`}>
                  {language === 'fi'
                    ? 'Valitse hakutapa löytääksesi täydelliset pyörät.'
                    : 'Choose your search method to find perfect-fit wheels.'}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Search Mode Tabs */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <button
            onClick={() => setSearchMode('license')}
            className={`
              px-6 py-2.5 rounded-lg transition-all duration-200 text-sm
              ${searchMode === 'license'
                ? 'bg-[#FF6B35] text-white shadow-[0_0_20px_rgba(255,107,53,0.3)]'
                : theme === 'dark'
                  ? 'bg-white/5 text-[#B0B8C4] hover:bg-white/10 border border-white/10'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
              }
            `}
          >
            {language === 'fi' ? '🚗 Rekisteritunnus' : '🚗 License Plate'}
          </button>
          <button
            onClick={() => setSearchMode('manual')}
            className={`
              px-6 py-2.5 rounded-lg transition-all duration-200 text-sm
              ${searchMode === 'manual'
                ? 'bg-[#FF6B35] text-white shadow-[0_0_20px_rgba(255,107,53,0.3)]'
                : theme === 'dark'
                  ? 'bg-white/5 text-[#B0B8C4] hover:bg-white/10 border border-white/10'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
              }
            `}
          >
            {language === 'fi' ? '⚙️ Manuaalinen haku' : '⚙️ Manual Search'}
          </button>
        </div>

        {/* Filters */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${mode}-${searchMode}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-8"
          >
            {mode === 'tires' ? (
              <TireFilters 
                onFilterChange={handleFilterChange} 
                onSearch={handleSearch}
                searchMode={searchMode}
              />
            ) : (
              <RimFilters 
                onFilterChange={handleFilterChange}
                onSearch={handleSearch}
                searchMode={searchMode}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Results Count */}
        {hasSearched && (
          <div ref={productsGridRef} className="flex items-center justify-between mb-6">
            <p className={theme === 'dark' ? 'text-[#B0B8C4]' : 'text-gray-600'}>
              {language === 'fi'
                ? `${totalCount} tuotetta löydetty`
                : `${totalCount} products found`}
            </p>
          </div>
        )}

        {errorMessage && (
          <div className={`mb-4 text-sm ${theme === 'dark' ? 'text-red-300' : 'text-red-600'}`}>
            {errorMessage}
          </div>
        )}


        {/* Empty State - Before Search */}
        {!hasSearched && (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#FF6B35]/10 flex items-center justify-center">
              <span className="text-5xl">🔍</span>
            </div>
            <h3 className={`text-2xl mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {language === 'fi' ? 'Aloita haku' : 'Start Your Search'}
            </h3>
            <p className={`max-w-md mx-auto ${theme === 'dark' ? 'text-[#B0B8C4]' : 'text-gray-600'}`}>
              {language === 'fi'
                ? 'Valitse hakutapa yllä ja täytä tiedot löytääksesi sopivat tuotteet.'
                : 'Select a search method above and fill in the details to find matching products.'}
            </p>
          </div>
        )}

        {/* Product Grid */}
        {hasSearched && loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {mode === 'tires' ? (
                    <TireCard
                      product={product}
                      index={index}
                      onClick={onProductSelect ? () => handleProductClick(product) : undefined}
                      onAddToCart={(e) => handleAddToCart(product, e)}
                    />
                  ) : (
                    <RimCard
                      product={product}
                      index={index}
                      onClick={onProductSelect ? () => handleProductClick(product) : undefined}
                      onAddToCart={(e) => handleAddToCart(product, e)}
                    />
                  )}
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
                ? 'Ei tuloksia hakuehdoillasi'
                : 'No products found with your filters'}
            </p>
            <Button
              onClick={() => {
                setFilters({});
                setHasSearched(true);
                setHasSearched(false);
                setProducts([]);
                setCurrentPage(1);
                setErrorMessage(null);
                fetchProducts();
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
    </div>
  );
}
