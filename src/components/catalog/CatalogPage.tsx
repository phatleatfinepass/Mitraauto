import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import { TireFilters } from './TireFilters';
import { RimFilters } from './RimFilters';
import { TireCard } from './TireCard';
import { RimCard } from './RimCard';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { tiresSearchUI, rimsSearchUI } from '../../utils/rpc';

type CatalogMode = 'tires' | 'rims';
type SearchMode = 'license' | 'vehicle' | 'manual';

interface Product {
  id: string;
  brand: string;
  model: string;
  product_type: string;
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

const ITEMS_PER_PAGE = 12;

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

function mapTireRow(row: any, fallbackSize?: string): Product {
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

function mapRimRow(row: any): Product {
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

// Demo data until products_search view is created
const DEMO_TIRES: Product[] = [
  {
    id: '1',
    brand: 'Nokian',
    model: 'Hakkapeliitta R5',
    product_type: 'tire',
    size_text: '205/55 R16 91H',
    eu_fuel: 'B',
    eu_wet: 'A',
    eu_noise: 68,
    season: 'winter',
    runflat: false,
    xl: false,
    studded: false,
    best_price_eur: 129.00,
    best_image_url: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=400',
    in_stock: true,
  },
  {
    id: '2',
    brand: 'Michelin',
    model: 'Pilot Sport 4',
    product_type: 'tire',
    size_text: '225/45 R17 94W',
    eu_fuel: 'C',
    eu_wet: 'A',
    eu_noise: 71,
    season: 'summer',
    runflat: false,
    xl: true,
    studded: false,
    best_price_eur: 159.00,
    best_image_url: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=400',
    in_stock: true,
  },
  {
    id: '3',
    brand: 'Continental',
    model: 'AllSeasonContact',
    product_type: 'tire',
    size_text: '195/65 R15 91H',
    eu_fuel: 'B',
    eu_wet: 'B',
    eu_noise: 70,
    season: 'all_season',
    runflat: false,
    xl: false,
    studded: false,
    best_price_eur: 99.00,
    best_image_url: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=400',
    in_stock: true,
  },
];

const DEMO_RIMS: Product[] = [
  {
    id: '4',
    brand: 'BBS',
    model: 'CH-R',
    product_type: 'rim',
    rim_width: 8,
    rim_diameter: 18,
    pcd: '5×112',
    et_offset: 35,
    cb: 66.6,
    color: 'silver',
    material: 'alloy',
    best_price_eur: 450.00,
    best_image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    in_stock: true,
  },
  {
    id: '5',
    brand: 'OZ Racing',
    model: 'Superturismo GT',
    product_type: 'rim',
    rim_width: 7.5,
    rim_diameter: 17,
    pcd: '5×100',
    et_offset: 48,
    cb: 68.0,
    color: 'gunmetal',
    material: 'alloy',
    best_price_eur: 380.00,
    best_image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    in_stock: true,
  },
];

export function CatalogPage() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [mode, setMode] = useState<CatalogMode>('tires');
  const [searchMode, setSearchMode] = useState<SearchMode>('manual');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<any>({});
  const productsGridRef = React.useRef<HTMLDivElement>(null);


  // Only fetch when search is explicitly triggered
  const handleSearch = () => {
    setHasSearched(true);
    setCurrentPage(1);
    fetchProducts();
  };

  useEffect(() => {
    if (hasSearched) {
      fetchProducts();
    }
  }, [currentPage]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      if (mode === 'tires') {
        const wStr = String(filters.width ?? '').trim();
        const aStr = String(filters.aspectRatio ?? '').trim();
        const dStr = String(filters.diameter ?? '').trim();

        const w = wStr && wStr !== 'all' ? parseInt(wStr, 10) : null;
        const a = aStr && aStr !== 'all' ? parseInt(aStr, 10) : null;
        const d = dStr && dStr !== 'all' ? parseInt(dStr, 10) : null;

        // If any of the filters are missing -> browse with the provided subset
        if (w === null || a === null || d === null) {
          console.debug('[TIRES] Browse query (subset allowed)', { w, a, d });
          const supabase = (await import('../../utils/supabase/client')).getSupabaseClient();
          const { data, error } = await supabase.rpc('tires_browse_ui', {
            p_width: w, p_aspect: a, p_diameter: d,
            p_limit: 48, p_offset: 0,
          });
          if (error) throw error;

          const mapped = (data ?? []).map((row: any) => mapTireRow(row));

          setProducts(mapped);
          setTotalCount(mapped.length);
        } else {
          // All three provided -> exact mode
          console.debug('[TIRES] Exact query', { w, a, d });
          const { data, error } = await tiresSearchUI(w, a, d);
          if (error) throw error;

          const mapped = (data ?? []).map((row: any) => mapTireRow(row, `${w}/${a} R${d}`));

          setProducts(mapped);
          setTotalCount(mapped.length);
        }
      } else {
        // RIMS (exact or browse)

        const rwStr = String(filters.rimWidth ?? '').trim();
        const rdStr = String(filters.rimDiameter ?? '').trim();

        // Normalize values
        const rw = rwStr && rwStr !== 'all' ? parseFloat(rwStr.replace(',', '.')) : null;
        const rd = rdStr && rdStr !== 'all' ? parseInt(rdStr.replace(/[^0-9]/g, ''), 10) : null;

        const rawPCD = (filters.pcd && filters.pcd !== 'all') ? String(filters.pcd) : '';
        const pcd = rawPCD
          ? rawPCD.toLowerCase().replace(/×/g, 'x').replace(/\s+/g, '')
          : null;

        // If we have both width and diameter -> exact RPC
        if (rw !== null && rd !== null) {
          console.debug('[RIMS] Exact query', { rw, rd, pcd });
          const { data, error } = await rimsSearchUI(rw, rd, pcd);
          if (error) throw error;

          const mapped = (data ?? []).map((row: any) => {
            const rim = mapRimRow(row);
            return {
              ...rim,
              rim_width: rim.rim_width ?? rw ?? undefined,
              rim_diameter: rim.rim_diameter ?? rd ?? undefined,
              pcd: rim.pcd ?? pcd ?? undefined,
            };
          });

          setProducts(mapped);
          setTotalCount(mapped.length);
        } else {
          // Otherwise -> browse RPC (supports any subset, including all-null)
          console.debug('[RIMS] Browse query', { rw, rd, pcd });
          const supabase = (await import('../../utils/supabase/client')).getSupabaseClient();
          const { data, error } = await supabase.rpc('rims_browse_ui', {
            p_width: rw, p_diameter: rd, p_pcd: pcd,
            p_limit: 48, p_offset: 0,
          });
          if (error) throw error;

          const mapped = (data ?? []).map((row: any) => mapRimRow(row));

          setProducts(mapped);
          setTotalCount(mapped.length);
        }
      }
      
    } catch (e) {
      console.error('Error fetching products:', e);
      // Fallback to demo data on any error
      const demoData = mode === 'tires' ? DEMO_TIRES : DEMO_RIMS;
      setProducts(demoData);
      setTotalCount(demoData.length);
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
                setHasSearched(false);
                setProducts([]);
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
                setHasSearched(false);
                setProducts([]);
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
              {products
                .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                .map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {mode === 'tires' ? (
                      <TireCard product={product} index={index} />
                    ) : (
                      <RimCard product={product} index={index} />
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
                setHasSearched(false);
                setProducts([]);
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
