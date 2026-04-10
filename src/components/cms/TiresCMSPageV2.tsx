import React, { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';
import { useLanguage } from '../LanguageContext';
import { supabase } from '../../utils/supabase/client';
import { Edit, Eye, EyeOff, X, Save, AlertCircle, Upload, GripVertical, RotateCcw, AlertTriangle } from 'lucide-react';
import { TiresCmsToolbar } from './tires/TiresCmsToolbar';
import { TiresCmsPagination } from './tires/TiresCmsPagination';
import {
  calculateLinePricing,
  getPricingRulesFromSpecOverrides,
  isFixedBundleTotalCompatible,
  setPricingRulesToSpecOverrides,
  type BundlePricingMode,
  type ProductPricingRules,
} from '../../utils/pricing';

interface ProductSearchTire {
  variant_id: string;
  product_type: 'tire';
  ean?: string | null;
  derived_ean: string | null;
  supplier_code_best?: string | null;
  supplier_external_id_best?: string | null;
  brand: string;
  model: string;
  size_string: string | null;
  season: string | null;
  runflat?: boolean | null;
  xl_reinforced?: boolean | null;
  load_index?: string | number | null;
  speed_rating?: string | null;
  speed_index?: string | null;
  ev_ready?: boolean | null;
  threepmsf?: boolean | null;
  winter_approved?: boolean | null;
  ice_approved?: boolean | null;
  
  // Base EU values from supplier
  eu_fuel_class: string | null;
  eu_wet_grip_class: string | null;
  eu_noise_db: number | null;
  eu_noise_class: string | null;
  
  // Final computed values
  final_title: string | null;
  final_price_eur: number | null;
  final_is_hidden: boolean;
  price?: number | null;
  
  // Conflict detection
  ean_conflict_open?: boolean | null;
  has_duplicate_ean_conflict?: boolean;
  has_mandatory_field_conflict?: boolean;
  has_missing_ean?: boolean;
  is_non_passenger_auto?: boolean;
  is_non_passenger_manual?: boolean;
  is_non_passenger?: boolean;
}

interface ProductCMS {
  variant_id: string;
  title: string | null;
  subtitle: string | null;
  short_description: string | null;
  long_description: string | null;
  hero_image_url: string | null;
  gallery: string[] | null;
  seo_slug: string | null;
  seo_title: string | null;
  seo_description: string | null;
  is_hidden: boolean;
  spec_overrides: {
    eu?: {
      fuel_class?: string;
      wet_grip_class?: string;
      noise_db?: number;
      noise_class?: string;
    };
    [key: string]: any;
  } | null;
  price_override_eur: number | null;
  promo_enabled: boolean;
  promo_price_eur: number | null;
  promo_start: string | null;
  promo_end: string | null;
}

interface TireRow extends ProductSearchTire {
  cms_data?: ProductCMS | null;
}

const EU_FUEL_WET_OPTIONS = ['A', 'B', 'C', 'D', 'E'];
const EU_NOISE_CLASS_OPTIONS = ['A', 'B', 'C'];
const VAT_RATE = 0.255;
const VAT_MULTIPLIER = 1 + VAT_RATE;

export function TiresCMSPageV2() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isDark = theme === 'dark';
  const pageSize = 100;
  const EXCLUDED_TIRE_KEYWORDS = [
    'motorcycle',
    'motorbike',
    'moto',
    'scooter',
    'moped',
    'atv',
    'utv',
    'quad',
    'trailer',
    'tractor',
    'traktor',
    'agri',
    'agric',
    'farm',
    'implement',
    'forklift',
    'kart',
    'enduro',
  ];

  const [tires, setTires] = useState<TireRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMissingEanOnly, setShowMissingEanOnly] = useState(false);
  const [selectedTire, setSelectedTire] = useState<TireRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [syncingCatalog, setSyncingCatalog] = useState(false);
  const [hasPendingCatalogSync, setHasPendingCatalogSync] = useState(false);
  const [catalogSyncMessage, setCatalogSyncMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sizeParts, setSizeParts] = useState({ width: '', aspect: '', rim: '', load_index: '', speed_rating: '' });
  const [warningTooltip, setWarningTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  // Edit state
  const [editData, setEditData] = useState<Partial<ProductCMS>>({});

  // Image upload state
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const toNumberOrNull = (value: any) => {
    if (value === null || value === undefined || value === '') return null;
    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const toPriceWithVat = (priceWithoutVat: number | null | undefined) => {
    const numeric = toNumberOrNull(priceWithoutVat);
    if (numeric === null) return null;
    return numeric * VAT_MULTIPLIER;
  };

  const normalizeTextOrNull = (value: any) => {
    if (value === null || value === undefined) return null;
    const text = String(value).trim();
    return text.length > 0 ? text : null;
  };

  const normalizeGallery = (value: any): string[] => {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => normalizeTextOrNull(item))
      .filter((item): item is string => Boolean(item));
  };

  const normalizeSpecOverrides = (value: any): any => {
    const normalizeNode = (node: any): any => {
      if (node === undefined || node === null) return null;
      if (Array.isArray(node)) {
        const normalizedArray = node
          .map((item) => normalizeNode(item))
          .filter((item) => item !== null);
        return normalizedArray.length > 0 ? normalizedArray : null;
      }
      if (typeof node === 'object') {
        const normalizedEntries = Object.entries(node)
          .map(([key, item]) => [key, normalizeNode(item)] as const)
          .filter(([, item]) => item !== null);
        if (normalizedEntries.length === 0) return null;

        normalizedEntries.sort(([a], [b]) => a.localeCompare(b));
        return normalizedEntries.reduce((acc, [key, item]) => {
          acc[key] = item;
          return acc;
        }, {} as Record<string, any>);
      }
      if (typeof node === 'string') {
        const text = node.trim();
        return text.length > 0 ? text : null;
      }
      return node;
    };

    return normalizeNode(value);
  };

  const stableSerialize = (value: any): string => {
    if (Array.isArray(value)) {
      return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
    }
    if (value && typeof value === 'object') {
      const keys = Object.keys(value).sort((a, b) => a.localeCompare(b));
      const serialized = keys.map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`);
      return `{${serialized.join(',')}}`;
    }
    return JSON.stringify(value);
  };

  const buildComparableCmsData = (
    variantId: string,
    source: Partial<ProductCMS> | null | undefined
  ) => {
    const gallery = normalizeGallery(source?.gallery);
    return {
      variant_id: variantId,
      title: normalizeTextOrNull(source?.title),
      subtitle: normalizeTextOrNull(source?.subtitle),
      short_description: normalizeTextOrNull(source?.short_description),
      long_description: normalizeTextOrNull(source?.long_description),
      gallery,
      hero_image_url: normalizeTextOrNull(source?.hero_image_url) || gallery[0] || null,
      seo_slug: normalizeTextOrNull(source?.seo_slug),
      seo_title: normalizeTextOrNull(source?.seo_title),
      seo_description: normalizeTextOrNull(source?.seo_description),
      is_hidden: Boolean(source?.is_hidden),
      spec_overrides: normalizeSpecOverrides(source?.spec_overrides),
      price_override_eur: toNumberOrNull(source?.price_override_eur),
      promo_enabled: Boolean(source?.promo_enabled),
      promo_price_eur: toNumberOrNull(source?.promo_price_eur),
      promo_start: normalizeTextOrNull(source?.promo_start),
      promo_end: normalizeTextOrNull(source?.promo_end),
    };
  };

  const isValidEan13 = (ean: string) => {
    if (!/^\d{13}$/.test(ean)) return false;
    const digits = ean.split('').map((d) => Number(d));
    const check = digits[12];
    const sum = digits
      .slice(0, 12)
      .reduce((acc, digit, idx) => acc + digit * (idx % 2 === 0 ? 1 : 3), 0);
    const expected = (10 - (sum % 10)) % 10;
    return check === expected;
  };

  const isAutoNonPassengerTire = (row: any) => {
    const searchBlob = `${row.brand ?? ''} ${row.model ?? ''} ${row.size_string ?? ''}`.toLowerCase();
    const keywordMatched = EXCLUDED_TIRE_KEYWORDS.some((keyword) => searchBlob.includes(keyword));

    const widthMm = toNumberOrNull(row.width_mm);
    const aspectRatio = toNumberOrNull(row.aspect_ratio);
    const diameterIn = toNumberOrNull(row.diameter_in);

    const inchStyleNonPassenger =
      widthMm !== null &&
      widthMm > 0 &&
      widthMm < 80 &&
      !Number.isInteger(widthMm) &&
      aspectRatio === null &&
      diameterIn !== null &&
      diameterIn >= 20;

    return keywordMatched || inchStyleNonPassenger;
  };

  const getManualNonPassengerFlag = (specOverrides: any) =>
    Boolean(specOverrides?.classification?.non_passenger_manual);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchTerm(searchTerm), 250);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchTires();
  }, [showMissingEanOnly, debouncedSearchTerm, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [showMissingEanOnly, debouncedSearchTerm]);

  const fetchTires = async () => {
    setLoading(true);
    setError(null);

    try {
      const trimmedSearch = debouncedSearchTerm.trim();
      let productsQuery = supabase
        .from('products_search')
        .select('*', { count: 'estimated' })
        .eq('product_type', 'tire')
        .order('brand', { ascending: true })
        .order('model', { ascending: true })
        .order('variant_id', { ascending: true })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (trimmedSearch) {
        productsQuery = productsQuery.or([
          `brand.ilike.%${trimmedSearch}%`,
          `model.ilike.%${trimmedSearch}%`,
          `size_string.ilike.%${trimmedSearch}%`,
          `derived_ean.ilike.%${trimmedSearch}%`,
        ].join(','));
      }

      if (showMissingEanOnly) {
        productsQuery = productsQuery.or('derived_ean.is.null,derived_ean.like.EANMISSING_%');
      }

      const { data: products, error: productsError, count } = await productsQuery;

      if (productsError) throw productsError;

      const resolvedTotalCount = count ?? 0;
      setTotalCount(resolvedTotalCount);

      const safeTotalPages = Math.max(1, Math.ceil(resolvedTotalCount / pageSize));
      if (currentPage > safeTotalPages) {
        setCurrentPage(safeTotalPages);
      }

      if (!products || products.length === 0) {
        setTires([]);
        return;
      }

      // Fetch CMS data for these variants
      const variantIds = products.map((p: any) => p.variant_id);
      const chunkSize = 200;
      const cmsRows: any[] = [];
      const eanRows: any[] = [];

      for (let i = 0; i < variantIds.length; i += chunkSize) {
        const idChunk = variantIds.slice(i, i + chunkSize);
        const [{ data: cmsBatch, error: cmsError }, { data: eanBatch, error: eanError }] = await Promise.all([
          supabase
            .from('product_cms')
            .select('*')
            .in('variant_id', idChunk),
          supabase
            .from('catalog_tire_variants')
            .select('id, ean')
            .in('id', idChunk),
        ]);

        if (cmsError) throw cmsError;
        if (eanError) throw eanError;

        if (cmsBatch?.length) cmsRows.push(...cmsBatch);
        if (eanBatch?.length) eanRows.push(...eanBatch);
      }

      // Merge data
      const cmsMap = new Map(cmsRows.map((c: any) => [c.variant_id, c]));
      const eanMap = new Map(eanRows.map((row: any) => [row.id, row.ean]));
      const normalizedEanCounts = new Map<string, number>();

      for (const product of products) {
        const cmsData = cmsMap.get(product.variant_id) || null;
        const identity = (cmsData?.spec_overrides as any)?.identity ?? {};
        const identityEan = String(identity?.ean ?? '').replace(/\D/g, '');
        const ean = (identityEan || product.derived_ean || eanMap.get(product.variant_id) || '').trim();
        if (!ean) continue;
        normalizedEanCounts.set(ean, (normalizedEanCounts.get(ean) ?? 0) + 1);
      }

      const hasMandatoryFieldConflict = (product: any, resolvedEan: string | null) => {
        const missingEan = !resolvedEan || resolvedEan.trim().length === 0;
        const missingBrand = !product.brand || String(product.brand).trim().length === 0;
        const missingModel = !product.model || String(product.model).trim().length === 0;
        const missingSize = !product.size_string || String(product.size_string).trim().length === 0;
        const resolvedPrice = product.final_price_eur ?? product.price ?? null;
        const missingPrice = resolvedPrice === null || resolvedPrice === undefined;

        return missingEan || missingBrand || missingModel || missingSize || missingPrice;
      };

      const merged = products.map((p: any) => {
        const cmsData = cmsMap.get(p.variant_id) || null;
        const identity = (cmsData?.spec_overrides as any)?.identity ?? {};
        const identityEan = String(identity?.ean ?? '').replace(/\D/g, '');
        const resolvedEan = identityEan || p.derived_ean || eanMap.get(p.variant_id) || null;
        const missingEan = !resolvedEan || String(resolvedEan).trim().length === 0 || String(resolvedEan).startsWith('EANMISSING_');
        const duplicateEanConflict = (() => {
          const normalized = (resolvedEan ?? '').trim();
          return normalized ? (normalizedEanCounts.get(normalized) ?? 0) > 1 : false;
        })();
        const mandatoryFieldConflict = hasMandatoryFieldConflict(p, resolvedEan);
        const autoNonPassenger = isAutoNonPassengerTire(p);
        const manualNonPassenger = getManualNonPassengerFlag(cmsData?.spec_overrides);
        const nonPassenger = autoNonPassenger || manualNonPassenger;

        return {
          ...p,
          brand: identity.brand ?? p.brand,
          model: identity.model ?? p.model,
          size_string: identity.size_string ?? p.size_string,
          derived_ean: resolvedEan,
          final_price_eur:
            cmsData?.promo_enabled && cmsData?.promo_price_eur !== null && cmsData?.promo_price_eur !== undefined
              ? cmsData.promo_price_eur
              : cmsData?.price_override_eur ?? p.final_price_eur ?? p.price ?? null,
          has_missing_ean: missingEan,
          has_duplicate_ean_conflict: duplicateEanConflict,
          has_mandatory_field_conflict: mandatoryFieldConflict,
          is_non_passenger_auto: autoNonPassenger,
          is_non_passenger_manual: manualNonPassenger,
          is_non_passenger: nonPassenger,
          ean_conflict_open: Boolean(p.ean_conflict_open) || duplicateEanConflict || mandatoryFieldConflict,
          cms_data: cmsData
        };
      });

      const visibleRows = showMissingEanOnly
        ? merged.filter((row: any) => Boolean(row.has_missing_ean))
        : merged;

      setTires(visibleRows as TireRow[]);
    } catch (err: any) {
      console.error('Fetch tires error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

    const parseTireSize = (size?: string | null) => {
    const cleaned = size?.trim() ?? '';
    const baseMatch = cleaned.match(/(\d{3})\s*\/\s*(\d{2})\s*R?\s*(\d{2})/i);

    if (!baseMatch) {
      return { width: '', aspect: '', rim: '', load_index: '', speed_rating: '' };
    }

    const tail = cleaned.slice((baseMatch.index ?? 0) + baseMatch[0].length).trim();
    const liSrMatch = tail.match(/^(\d{2,3})\s*([A-Z]{1,2})/i);

    return {
      width: baseMatch[1],
      aspect: baseMatch[2],
      rim: baseMatch[3],
      load_index: liSrMatch?.[1] || '',
      speed_rating: (liSrMatch?.[2] || '').toUpperCase(),
    };
  };

  const formatTireSize = (parts: { width: string; aspect: string; rim: string; load_index?: string; speed_rating?: string }) => {
    if (!parts.width && !parts.aspect && !parts.rim && !parts.load_index && !parts.speed_rating) {
      return '';
    }

    if (!parts.width || !parts.aspect || !parts.rim) {
      return '';
    }

    const li = (parts.load_index || '').trim();
    const sr = (parts.speed_rating || '').trim().toUpperCase();
    return `${parts.width} / ${parts.aspect} R${parts.rim}${li ? ` ${li}` : ''}${sr ? ` ${sr}` : ''}`.trim();
  };

  const hasMissingSupplierPrice = (tire: TireRow | null) =>
    !tire || tire.final_price_eur === null || tire.final_price_eur === undefined;

  const mustHideFromStore = (tire: TireRow | null) =>
    hasMissingSupplierPrice(tire) || Boolean(tire?.is_non_passenger);

  const getWarningReasons = (tire: TireRow) => {
    const reasons: string[] = [];

    if (tire.has_duplicate_ean_conflict) {
      reasons.push(language === 'fi' ? 'Sama EAN löytyy useasta eri tuotteesta/specistä' : 'Same EAN appears on multiple different variants/specs');
    }
    if (tire.has_mandatory_field_conflict) {
      reasons.push(language === 'fi' ? 'Pakollisia kenttiä puuttuu' : 'Mandatory fields are missing');
    }
    if (tire.has_missing_ean) {
      reasons.push(language === 'fi' ? 'EAN puuttuu tai on väliaikainen' : 'EAN is missing or still a placeholder');
    }
    if (Boolean(tire.ean_conflict_open) && reasons.length === 0) {
      reasons.push(language === 'fi' ? 'Katalogissa on avoin konflikti tälle tuotteelle' : 'There is an open catalog conflict for this item');
    }

    return reasons;
  };

  const getWarningTooltip = (tire: TireRow) => {
    const reasons = getWarningReasons(tire);
    if (reasons.length === 0) {
      return language === 'fi' ? 'Varoitus' : 'Warning';
    }
    const prefix = language === 'fi' ? 'Varoitus:' : 'Warning:';
    return `${prefix} ${reasons.join(' | ')}`;
  };

  const showWarningTooltip = (text: string, x: number, y: number) => {
    setWarningTooltip({ text, x: x + 12, y: y + 12 });
  };

  const hideWarningTooltip = () => {
    setWarningTooltip(null);
  };

  const getEffectiveIdentity = (tire: TireRow | null) => {
    const identity = (tire?.cms_data?.spec_overrides as any)?.identity ?? {};
    const baseSize = (identity.size_string?.trim() || tire?.size_string || '').trim();
    const loadIndex = String(identity.load_index ?? tire?.load_index ?? '').trim();
    const speedRaw = String(identity.speed_rating ?? tire?.speed_rating ?? tire?.speed_index ?? '').trim();
    const speedIndex = speedRaw.toUpperCase();
    const hasLiSiInSize = /\s\d{2,3}\s?[A-Z]{1,2}$/.test(baseSize.toUpperCase());
    const liSiSuffix = `${loadIndex}${speedIndex ? ` ${speedIndex}` : ''}`.trim();
    const sizeWithLiSi = baseSize && !hasLiSiInSize && liSiSuffix
      ? `${baseSize} ${liSiSuffix}`.trim()
      : baseSize;

    return {
      brand: identity.brand?.trim() || tire?.brand || '',
      model: identity.model?.trim() || tire?.model || '',
      size_string: sizeWithLiSi,
    };
  };

  const handleEdit = (tire: TireRow) => {
    setSelectedTire(tire);
    
    // Initialize edit data
    const cms = tire.cms_data;
    setEditData({
      variant_id: tire.variant_id,
      title: cms?.title ?? '',
      subtitle: cms?.subtitle ?? '',
      short_description: cms?.short_description ?? '',
      long_description: cms?.long_description ?? '',
      hero_image_url: cms?.hero_image_url ?? null,
      gallery: cms?.gallery ?? [],
      seo_slug: cms?.seo_slug ?? '',
      seo_title: cms?.seo_title ?? '',
      seo_description: cms?.seo_description ?? '',
      is_hidden: cms?.is_hidden ?? mustHideFromStore(tire),
      spec_overrides: cms?.spec_overrides ?? {},
      price_override_eur: cms?.price_override_eur ?? null,
      promo_enabled: cms?.promo_enabled ?? false,
      promo_price_eur: cms?.promo_price_eur ?? null,
      promo_start: cms?.promo_start ?? null,
      promo_end: cms?.promo_end ?? null,
    });

    const sizeSource =
      (cms?.spec_overrides as any)?.identity?.size_string ??
      tire.size_string ??
      '';
    const parsedSize = parseTireSize(sizeSource);
    setSizeParts({
      ...parsedSize,
      load_index: String((cms?.spec_overrides as any)?.identity?.load_index ?? tire.load_index ?? parsedSize.load_index ?? ''),
      speed_rating: String((cms?.spec_overrides as any)?.identity?.speed_rating ?? tire.speed_rating ?? tire.speed_index ?? parsedSize.speed_rating ?? '').toUpperCase(),
    });
    
    setDrawerOpen(true);
    setUploadError(null);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedTire(null);
    setEditData({});
    setSaveError(null);
    setUploadError(null);
    setSizeParts({ width: '', aspect: '', rim: '', load_index: '', speed_rating: '' });
  };

  const patchLocalCmsData = (variantId: string, cmsPatch: Record<string, any> | null) => {
    const applyCmsPatch = (rows: TireRow[]) =>
      rows.map((tire) => {
        if (tire.variant_id !== variantId) return tire;
        if (cmsPatch === null) {
          const autoNonPassenger = Boolean(tire.is_non_passenger_auto);
          return {
            ...tire,
            cms_data: null,
            is_non_passenger_manual: false,
            is_non_passenger: autoNonPassenger,
          };
        }

        const nextCmsData = {
          ...(tire.cms_data ?? { variant_id: tire.variant_id }),
          ...cmsPatch,
        } as any;
        const effectivePrice =
          nextCmsData?.promo_enabled && nextCmsData?.promo_price_eur !== null && nextCmsData?.promo_price_eur !== undefined
            ? nextCmsData.promo_price_eur
            : nextCmsData?.price_override_eur ?? tire.price ?? null;
        const manualNonPassenger = getManualNonPassengerFlag(nextCmsData?.spec_overrides);
        const autoNonPassenger = Boolean(tire.is_non_passenger_auto);

        return {
          ...tire,
          final_price_eur: effectivePrice,
          cms_data: nextCmsData,
          is_non_passenger_manual: manualNonPassenger,
          is_non_passenger: autoNonPassenger || manualNonPassenger,
        };
      });

    setTires((prev) => applyCmsPatch(prev));
  };

  const patchLocalIdentityData = (variantId: string, specOverrides: any) => {
    const identity = specOverrides?.identity ?? {};
    const identityEan = String(identity?.ean ?? '').replace(/\D/g, '');

    const applyIdentityPatch = (rows: TireRow[]) =>
      rows.map((tire) =>
        tire.variant_id === variantId
          ? {
              ...tire,
              brand: identity?.brand ?? tire.brand,
              model: identity?.model ?? tire.model,
              size_string: identity?.size_string ?? tire.size_string,
              derived_ean: identityEan || tire.derived_ean,
            }
          : tire
      );

    setTires((prev) => applyIdentityPatch(prev));
  };

  const handleSave = async () => {
    if (!selectedTire) return;

    setSaving(true);
    setSaveError(null);

    try {
      const specOverrides = editData.spec_overrides ?? {};
      const pricingRules = getPricingRulesFromSpecOverrides(specOverrides);
      if (
        pricingRules?.qty2?.mode === 'fixed_total' &&
        !isFixedBundleTotalCompatible(pricingRules.qty2.fixed_total_eur, 2)
      ) {
        throw new Error(
          language === 'fi'
            ? '2 kpl kiinteä pakettihinta pitää jakautua tasan kahdelle tuotteelle (sentteihin asti).'
            : 'Fixed total for 2 items must be divisible evenly across 2 units (in cents).'
        );
      }
      if (
        pricingRules?.qty4?.mode === 'fixed_total' &&
        !isFixedBundleTotalCompatible(pricingRules.qty4.fixed_total_eur, 4)
      ) {
        throw new Error(
          language === 'fi'
            ? '4 kpl kiinteä pakettihinta pitää jakautua tasan neljälle tuotteelle (sentteihin asti).'
            : 'Fixed total for 4 items must be divisible evenly across 4 units (in cents).'
        );
      }
      const identityOverride = (specOverrides as any)?.identity ?? {};
      let targetVariantId = selectedTire.variant_id;
      const hasEanOverride =
        Object.prototype.hasOwnProperty.call(identityOverride, 'ean') &&
        selectedTire.supplier_code_best &&
        selectedTire.supplier_external_id_best;
      const eanDigits = String(identityOverride.ean ?? '').replace(/\D/g, '');
      const currentEanDigits = String(selectedTire.derived_ean ?? '').replace(/\D/g, '');
      const shouldPatchEan = Boolean(hasEanOverride) && eanDigits !== currentEanDigits;

      if (shouldPatchEan && eanDigits.length > 0 && !isValidEan13(eanDigits)) {
        throw new Error(
          language === 'fi'
            ? 'EAN ei ole kelvollinen EAN-13 (tarkistusnumero virheellinen).'
            : 'EAN is not a valid EAN-13 (check digit mismatch).'
        );
      }

      const draftManualNonPassenger = getManualNonPassengerFlag(specOverrides);
      const draftNonPassenger = Boolean(selectedTire.is_non_passenger_auto) || draftManualNonPassenger;
      const mustBeHidden = hasMissingSupplierPrice(selectedTire) || draftNonPassenger;
      const payload: any = {
        variant_id: targetVariantId,
        title: editData.title?.trim() || null,
        subtitle: editData.subtitle?.trim() || null,
        short_description: editData.short_description?.trim() || null,
        long_description: editData.long_description?.trim() || null,
        gallery: Array.isArray(editData.gallery) ? editData.gallery.filter(Boolean) : [],
        seo_slug: editData.seo_slug?.trim() || null,
        seo_title: editData.seo_title?.trim() || null,
        seo_description: editData.seo_description?.trim() || null,
        is_hidden: mustBeHidden ? true : (editData.is_hidden ?? false),
        spec_overrides: specOverrides,
        price_override_eur: editData.price_override_eur ?? null,
        promo_enabled: editData.promo_enabled ?? false,
        promo_price_eur: editData.promo_price_eur ?? null,
        promo_start: editData.promo_start || null,
        promo_end: editData.promo_end || null,
      };

      payload.hero_image_url = editData.hero_image_url || payload.gallery[0] || null;
      const hasCmsChanges =
        stableSerialize(buildComparableCmsData(targetVariantId, payload)) !==
        stableSerialize(buildComparableCmsData(selectedTire.variant_id, selectedTire.cms_data ?? null));

      if (!shouldPatchEan && !hasCmsChanges) {
        setCatalogSyncMessage(
          language === 'fi'
            ? 'Ei uusia muutoksia synkronoitavaksi.'
            : 'No new changes to sync.'
        );
        handleCloseDrawer();
        return;
      }

      if (shouldPatchEan) {
        const { data: eanPatchResult, error: eanPatchError } = await supabase.rpc('catalog_patch_offer_ean_v3', {
          p_supplier_code: selectedTire.supplier_code_best,
          p_product_type: selectedTire.product_type,
          p_external_id: selectedTire.supplier_external_id_best,
          p_ean: eanDigits || null,
          p_run_rebuild: false,
        });

        if (eanPatchError) throw eanPatchError;

        const remappedVariantId = (eanPatchResult as any)?.new_variant_id;
        if (typeof remappedVariantId === 'string' && remappedVariantId.trim().length > 0) {
          targetVariantId = remappedVariantId;
        }
      }

      payload.variant_id = targetVariantId;

      // Upsert to product_cms
      const { error } = await supabase
        .from('product_cms')
        .upsert(payload, { onConflict: 'variant_id' });

      if (error) throw error;
      setHasPendingCatalogSync(true);
      setCatalogSyncMessage(
        shouldPatchEan
          ? (language === 'fi'
            ? 'EAN-muutos tallennettu välimuistiin. Suorita "Apply Sync" julkaistaksesi muutokset katalogiin.'
            : 'EAN change cached. Run "Apply Sync" to publish changes to catalog.')
          : (language === 'fi'
            ? 'Muutokset tallennettu. Suorita "Apply Sync" julkaistaksesi muutokset katalogiin.'
            : 'Changes saved. Run "Apply Sync" to publish changes to catalog.')
      );

      if (targetVariantId !== selectedTire.variant_id) {
        await supabase
          .from('product_cms')
          .delete()
          .eq('variant_id', selectedTire.variant_id);

        await fetchTires();
      } else {
        patchLocalCmsData(targetVariantId, payload);
        patchLocalIdentityData(targetVariantId, specOverrides);
      }
      handleCloseDrawer();
    } catch (err: any) {
      console.error('Save error:', err);
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleApplyCatalogSync = async () => {
    if (syncingCatalog) return;
    setSyncingCatalog(true);
    setError(null);
    setCatalogSyncMessage(null);

    try {
      const { data: offersRun, error: offersError } = await supabase.rpc('catalog_build_offers_v3', { p_limit: 200000 });
      if (offersError) throw offersError;
      if ((offersRun as any)?.errors && Number((offersRun as any).errors) > 0) {
        throw new Error((offersRun as any)?.error || 'catalog_build_offers_v3 failed');
      }

      const { error: prefilterError } = await supabase.rpc('catalog_build_offer_prefilter_v3');
      if (prefilterError) throw prefilterError;

      const { error: variantsError } = await supabase.rpc('catalog_build_variants_v3');
      if (variantsError) throw variantsError;

      const { error: conflictsError } = await supabase.rpc('catalog_refresh_conflicts_v3');
      if (conflictsError) throw conflictsError;

      const { error: refreshError } = await supabase.rpc('catalog_refresh_products_search_v3');
      if (refreshError) throw refreshError;

      setHasPendingCatalogSync(false);
      setCatalogSyncMessage(language === 'fi' ? 'Catalog sync valmis.' : 'Catalog sync completed.');
      await fetchTires();
    } catch (err: any) {
      console.error('Catalog sync error:', err);
      setCatalogSyncMessage(err?.message || 'Catalog sync failed');
    } finally {
      setSyncingCatalog(false);
    }
  };

  const handleToggleVisibility = async (tire: TireRow) => {
    const missingSupplierPrice = hasMissingSupplierPrice(tire);
    const nonPassenger = Boolean(tire.is_non_passenger);
    const forceHidden = missingSupplierPrice || nonPassenger;
    const previousHiddenState = Boolean(tire.cms_data?.is_hidden);
    const currentlyHidden = Boolean(tire.cms_data?.is_hidden) || forceHidden;
    const newHiddenState = forceHidden ? true : !currentlyHidden;

    try {
      if (forceHidden) {
        setError(
          language === 'fi'
            ? (missingSupplierPrice
              ? 'Tuote on piilotettu, koska toimittajahinta puuttuu.'
              : 'Tuote on piilotettu, koska se ei ole henkilöauton rengas.')
            : (missingSupplierPrice
              ? 'Item is hidden because supplier price is missing.'
              : 'Item is hidden because it is not a passenger-car tire.')
        );
      }

      const { error } = await supabase
        .from('product_cms')
        .upsert({
          variant_id: tire.variant_id,
          is_hidden: newHiddenState,
          spec_overrides: tire.cms_data?.spec_overrides ?? {},
        }, { onConflict: 'variant_id' });

      if (error) throw error;

      patchLocalCmsData(tire.variant_id, {
        variant_id: tire.variant_id,
        is_hidden: newHiddenState,
        spec_overrides: tire.cms_data?.spec_overrides ?? {},
      });

      if (newHiddenState !== previousHiddenState) {
        setHasPendingCatalogSync(true);
        setCatalogSyncMessage(
          language === 'fi'
            ? 'Näkyvyysmuutos tallennettu. Suorita "Apply Sync" julkaistaksesi muutokset katalogiin.'
            : 'Visibility change saved. Run "Apply Sync" to publish changes to catalog.'
        );
      }
    } catch (err: any) {
      console.error('Toggle visibility error:', err);
      setError(err.message);
    }
  };

  // Image upload functions
  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedTire) return;

    setUploadingImages(true);
    setUploadError(null);

    try {
      const currentGallery = (editData.gallery as string[]) || [];
      if (currentGallery.length + files.length > 10) {
        throw new Error('Maximum 10 images allowed');
      }

      const newImages: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image`);
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} exceeds 5MB limit`);
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const ext = file.name.split('.').pop();
        const filename = `${timestamp}_${randomStr}.${ext}`;
        const path = `tires/${selectedTire.variant_id}/${filename}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(path);

        newImages.push(publicUrl);
      }

      // Add new images to gallery
      const updatedGallery = [...currentGallery, ...newImages];
      setEditData(prev => ({
        ...prev,
        gallery: updatedGallery,
        hero_image_url: updatedGallery[0] || prev.hero_image_url
      }));

    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = async (index: number) => {
    const gallery = (editData.gallery as string[]) || [];
    const imageUrl = gallery[index];
    
    // Try to delete from storage
    try {
      const urlPath = new URL(imageUrl).pathname;
      const pathParts = urlPath.split('/product-images/');
      if (pathParts.length > 1) {
        const storagePath = pathParts[1];
        await supabase.storage.from('product-images').remove([storagePath]);
      }
    } catch (error) {
      console.warn('Could not delete from storage:', error);
    }

    // Remove from gallery
    const updatedGallery = gallery.filter((_, i) => i !== index);
    setEditData(prev => ({
      ...prev,
      gallery: updatedGallery,
      hero_image_url: updatedGallery[0] || null
    }));
  };

  const handleImageReorder = (newGallery: string[]) => {
    setEditData(prev => ({
      ...prev,
      gallery: newGallery,
      hero_image_url: newGallery[0] || prev.hero_image_url
    }));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const gallery = (editData.gallery as string[]) || [];
    const newGallery = [...gallery];
    const draggedItem = newGallery[draggedIndex];
    newGallery.splice(draggedIndex, 1);
    newGallery.splice(index, 0, draggedItem);
    
    handleImageReorder(newGallery);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // EU override helpers
  const getEUOverride = () => {
    return editData.spec_overrides?.eu || null;
  };

  const setEUField = (field: string, value: any) => {
    const currentOverrides = editData.spec_overrides || {};
    const currentEU = currentOverrides.eu || {};
    
    const updatedEU = { ...currentEU, [field]: value };
    
    setEditData(prev => ({
      ...prev,
      spec_overrides: {
        ...currentOverrides,
        eu: updatedEU
      }
    }));
  };

  const clearEUOverrides = () => {
    const currentOverrides = editData.spec_overrides || {};
    const { eu, ...restOverrides } = currentOverrides;
    
    setEditData(prev => ({
      ...prev,
      spec_overrides: Object.keys(restOverrides).length > 0 ? restOverrides : null
    }));
  };

  const hasEUOverride = () => {
    const override = getEUOverride();
    return override && Object.keys(override).length > 0;
  };

  const getIdentityOverride = () => {
    return editData.spec_overrides?.identity || null;
  };

  const setIdentityField = (field: 'brand' | 'model' | 'ean' | 'size_string' | 'season' | 'load_index' | 'speed_rating', value?: string) => {
    setEditData(prev => {
      const currentOverrides = prev.spec_overrides || {};
      const currentIdentity = currentOverrides.identity || {};

      const updatedIdentity = { ...currentIdentity } as Record<string, string>;
      if (value === undefined) {
        delete updatedIdentity[field];
      } else {
        updatedIdentity[field] = value;
      }

      const { identity, ...restOverrides } = currentOverrides;
      const nextOverrides = {
        ...restOverrides,
        ...(Object.keys(updatedIdentity).length > 0 ? { identity: updatedIdentity } : {})
      };

      return {
        ...prev,
        spec_overrides: Object.keys(nextOverrides).length > 0 ? nextOverrides : null
      };
    });
  };

  const clearIdentityOverrides = () => {
    setEditData(prev => {
      const currentOverrides = prev.spec_overrides || {};
      const { identity, ...restOverrides } = currentOverrides;

      return {
        ...prev,
        spec_overrides: Object.keys(restOverrides).length > 0 ? restOverrides : null
      };
    });
    setSizeParts(parseTireSize(selectedTire?.size_string ?? ''));
  };

  const updateSizePart = (field: 'width' | 'aspect' | 'rim' | 'load_index' | 'speed_rating', value: string) => {
    setSizeParts(prev => {
      const next = { ...prev, [field]: value };
      setIdentityField('size_string', formatTireSize(next));
      setIdentityField('load_index', next.load_index || undefined);
      setIdentityField('speed_rating', next.speed_rating?.toUpperCase() || undefined);
      return next;
    });
  };

  const getFeatureOverrides = () => editData.spec_overrides?.features || null;

  const getBaseFeatureValue = (field: 'ev_ready' | 'runflat' | 'xl' | 'studded' | 'threepmsf' | 'winter_approved' | 'ice_approved') => {
    if (!selectedTire) return false;
    switch (field) {
      case 'ev_ready':
        return Boolean((selectedTire as any).ev_ready);
      case 'runflat':
        return Boolean(selectedTire.runflat);
      case 'xl':
        return Boolean(selectedTire.xl_reinforced);
      case 'studded':
        return Boolean(selectedTire.studded);
      case 'threepmsf':
        return Boolean((selectedTire as any).threepmsf);
      case 'winter_approved':
        return Boolean((selectedTire as any).winter_approved) || selectedTire.season === 'winter' || selectedTire.season === 'all_season';
      case 'ice_approved':
        return Boolean((selectedTire as any).ice_approved);
      default:
        return false;
    }
  };

  const getEffectiveFeatureValue = (field: 'ev_ready' | 'runflat' | 'xl' | 'studded' | 'threepmsf' | 'winter_approved' | 'ice_approved') => {
    const overrides = getFeatureOverrides();
    if (overrides && Object.prototype.hasOwnProperty.call(overrides, field)) {
      return Boolean(overrides[field]);
    }
    return getBaseFeatureValue(field);
  };

  const setFeatureField = (field: 'ev_ready' | 'runflat' | 'xl' | 'studded' | 'threepmsf' | 'winter_approved' | 'ice_approved', value: boolean) => {
    setEditData((prev) => {
      const currentOverrides = prev.spec_overrides || {};
      const currentFeatures = { ...(currentOverrides.features || {}) };
      currentFeatures[field] = value;
      return {
        ...prev,
        spec_overrides: {
          ...currentOverrides,
          features: currentFeatures,
        },
      };
    });
  };

  const clearFeatureOverrides = () => {
    setEditData((prev) => {
      const currentOverrides = prev.spec_overrides || {};
      const { features, ...rest } = currentOverrides;
      return {
        ...prev,
        spec_overrides: Object.keys(rest).length > 0 ? rest : null,
      };
    });
  };

  const getBundlePricing = (): ProductPricingRules | null =>
    getPricingRulesFromSpecOverrides(editData.spec_overrides);

  const getBundleTier = (qty: 2 | 4) =>
    qty === 2 ? (getBundlePricing()?.qty2 ?? null) : (getBundlePricing()?.qty4 ?? null);

  const setBundleTier = (qty: 2 | 4, tier: { mode?: BundlePricingMode; percent_off?: number | null; fixed_total_eur?: number | null }) => {
    setEditData((prev) => {
      const currentPricing = getPricingRulesFromSpecOverrides(prev.spec_overrides) ?? { qty2: null, qty4: null };
      const key = qty === 2 ? 'qty2' : 'qty4';
      const existingTier = currentPricing[key] ?? { mode: 'none' as BundlePricingMode, percent_off: null, fixed_total_eur: null };
      const mergedTier = {
        ...existingTier,
        ...tier,
      };
      const nextPricing: ProductPricingRules = {
        qty2: key === 'qty2' ? mergedTier : currentPricing.qty2,
        qty4: key === 'qty4' ? mergedTier : currentPricing.qty4,
      };

      return {
        ...prev,
        spec_overrides: setPricingRulesToSpecOverrides(prev.spec_overrides, nextPricing),
      };
    });
  };

  const clearBundlePricing = () => {
    setEditData((prev) => ({
      ...prev,
      spec_overrides: setPricingRulesToSpecOverrides(prev.spec_overrides, null),
    }));
  };

  const handleResetCms = async () => {
    if (!selectedTire) return;
    if (!selectedTire.cms_data) {
      setCatalogSyncMessage(language === 'fi' ? 'Ei uusia muutoksia synkronoitavaksi.' : 'No new changes to sync.');
      handleCloseDrawer();
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const { error } = await supabase
        .from('product_cms')
        .delete()
        .eq('variant_id', selectedTire.variant_id);

      if (error) throw error;

      patchLocalCmsData(selectedTire.variant_id, null);
      setHasPendingCatalogSync(true);
      setCatalogSyncMessage(
        language === 'fi'
          ? 'CMS-ohitukset poistettu. Suorita "Apply Sync" julkaistaksesi muutokset katalogiin.'
          : 'CMS overrides cleared. Run "Apply Sync" to publish changes to catalog.'
      );
      handleCloseDrawer();
    } catch (err: any) {
      console.error('Reset error:', err);
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredTires = tires;

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);
  const paginationItems = (() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const items: Array<number | 'ellipsis-left' | 'ellipsis-right'> = [1];
    const windowStart = Math.max(2, currentPage - 1);
    const windowEnd = Math.min(totalPages - 1, currentPage + 1);

    if (windowStart > 2) {
      items.push('ellipsis-left');
    }

    for (let page = windowStart; page <= windowEnd; page += 1) {
      items.push(page);
    }

    if (windowEnd < totalPages - 1) {
      items.push('ellipsis-right');
    }

    items.push(totalPages);
    return items;
  })();

  const originalApiPrice =
    selectedTire?.price !== null && selectedTire?.price !== undefined
      ? Number(selectedTire.price)
      : null;
  const effectiveDraftPrice =
    editData.promo_enabled && editData.promo_price_eur !== null && editData.promo_price_eur !== undefined
      ? Number(editData.promo_price_eur)
      : editData.price_override_eur !== null && editData.price_override_eur !== undefined
        ? Number(editData.price_override_eur)
        : originalApiPrice;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0B0D10]' : 'bg-gray-50'}`}>
      {warningTooltip && (
        <div
          className={`fixed z-[120] max-w-[380px] rounded-md px-2 py-1.5 text-xs shadow-lg pointer-events-none ${
            isDark ? 'bg-black/95 text-white border border-white/20' : 'bg-gray-900 text-white border border-gray-700'
          }`}
          style={{ left: `${warningTooltip.x}px`, top: `${warningTooltip.y}px` }}
        >
          {warningTooltip.text}
        </div>
      )}
      <TiresCmsToolbar
        isDark={isDark}
        language={language}
        searchTerm={searchTerm}
        showMissingEanOnly={showMissingEanOnly}
        syncingCatalog={syncingCatalog}
        hasPendingCatalogSync={hasPendingCatalogSync}
        catalogSyncMessage={catalogSyncMessage}
        onSearchTermChange={setSearchTerm}
        onShowMissingEanOnlyChange={setShowMissingEanOnly}
        onApplyCatalogSync={handleApplyCatalogSync}
      />

      {/* Main Content */}
      <div className="px-8 py-6">
        {loading ? (
          <div className="text-center py-20">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto ${
              isDark ? 'border-white' : 'border-gray-900'
            }`} />
          </div>
        ) : error ? (
          <div className={`p-4 rounded-lg ${isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {language === 'fi'
                  ? `Yhteensä ${totalCount} tuotetta`
                  : `${totalCount} items total`}
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {language === 'fi'
                  ? `Näytetään ${startItem}-${endItem} / ${totalCount} (sivu ${currentPage}/${totalPages})`
                  : `Showing ${startItem}-${endItem} of ${totalCount} (page ${currentPage}/${totalPages})`}
              </p>
            </div>

            {/* Table */}
            <div className={`rounded-lg border overflow-hidden ${
              isDark ? 'border-white/10 bg-[#161A22]' : 'border-gray-200 bg-white'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {language === 'fi' ? 'Brändi' : 'Brand'}
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {language === 'fi' ? 'Malli' : 'Model'}
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {language === 'fi' ? 'Koko' : 'Size'}
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        EAN
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {language === 'fi' ? 'Hinta' : 'Price'}
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {language === 'fi' ? 'Näkyvyys' : 'Visible'}
                      </th>
                      <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {language === 'fi' ? 'Toiminnot' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredTires.map((tire) => (
                      <tr
                        key={tire.variant_id}
                        className={`${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} ${
                          tire.ean_conflict_open ? (isDark ? 'bg-yellow-500/10' : 'bg-yellow-50') : ''
                        }`}
                      >
                        <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          <div className="flex items-center gap-2">
                            {getEffectiveIdentity(tire).brand}
                            {tire.ean_conflict_open && (
                              <span
                                className="inline-flex items-center px-1 cursor-help"
                                aria-label={getWarningTooltip(tire)}
                                onMouseEnter={(e) => showWarningTooltip(getWarningTooltip(tire), e.clientX, e.clientY)}
                                onMouseMove={(e) => showWarningTooltip(getWarningTooltip(tire), e.clientX, e.clientY)}
                                onMouseLeave={hideWarningTooltip}
                                onFocus={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  showWarningTooltip(getWarningTooltip(tire), rect.left, rect.bottom);
                                }}
                                onBlur={hideWarningTooltip}
                              >
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                              </span>
                            )}
                            {tire.is_non_passenger && (
                              <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700'
                              }`}>
                                {language === 'fi'
                                  ? (tire.is_non_passenger_manual ? 'Ei-henkilöauto (manuaali)' : 'Ei-henkilöauto')
                                  : (tire.is_non_passenger_manual ? 'Non-passenger (manual)' : 'Non-passenger')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {getEffectiveIdentity(tire).model}
                        </td>
                        <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {getEffectiveIdentity(tire).size_string || '—'}
                        </td>
                        <td className={`px-4 py-3 text-xs font-mono ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {tire.derived_ean || '—'}
                        </td>
                        <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {tire.final_price_eur !== null && tire.final_price_eur !== undefined
                            ? `€${tire.final_price_eur.toFixed(2)}`
                            : '—'}
                          {hasMissingSupplierPrice(tire) && (
                            <p className={`mt-1 text-xs ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                              {language === 'fi' ? 'Toimittajahinta puuttuu' : 'Missing supplier price'}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleVisibility(tire)}
                            className={`p-1 rounded transition-colors ${
                              (tire.cms_data?.is_hidden || mustHideFromStore(tire))
                                ? (isDark ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600')
                                : (isDark ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700')
                            }`}
                          >
                            {(tire.cms_data?.is_hidden || mustHideFromStore(tire)) ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleEdit(tire)}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              isDark 
                                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                          >
                            <Edit className="w-4 h-4" />
                            {language === 'fi' ? 'Muokkaa' : 'Edit'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {filteredTires.length === 0 && (
              <div className="text-center py-20">
                <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {language === 'fi' ? 'Ei renkaita löytynyt' : 'No tires found'}
                </p>
              </div>
            )}

            <TiresCmsPagination
              isDark={isDark}
              language={language}
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              startItem={startItem}
              endItem={endItem}
              paginationItems={paginationItems}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Edit Drawer */}
      {drawerOpen && selectedTire && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseDrawer}
          />

          {/* Drawer */}
          <div className={`absolute right-0 top-0 bottom-0 w-full max-w-3xl ${
            isDark ? 'bg-[#0B0D10]' : 'bg-white'
          } shadow-2xl overflow-y-auto`}>
            {/* Drawer Header */}
            <div className={`sticky top-0 z-10 border-b ${
              isDark ? 'bg-[#161A22] border-white/10' : 'bg-white border-gray-200'
            } px-6 py-4 flex items-center justify-between`}>
              <div>
                <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fi' ? 'Muokkaa rengasta' : 'Edit Tire'}
                </h2>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {getEffectiveIdentity(selectedTire).brand} {getEffectiveIdentity(selectedTire).model} — {getEffectiveIdentity(selectedTire).size_string || '—'}
                </p>
              </div>
              <button
                onClick={handleCloseDrawer}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                }`}
              >
                <X className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="px-6 py-6 space-y-8">
              
              {/* Section A: Identity */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fi' ? 'Tunnisteet' : 'Identity'}
                  </h3>
                  <button
                    type="button"
                    onClick={clearIdentityOverrides}
                    className={`flex items-center gap-2 text-sm ${isDark ? 'text-blue-200 hover:text-white' : 'text-blue-700 hover:text-blue-900'}`}
                  >
                    <RotateCcw className="w-4 h-4" />
                    {language === 'fi' ? 'Palauta perustasot' : 'Reset to base'}
                  </button>
                </div>

                <div className={`grid grid-cols-2 gap-4 p-4 rounded-lg ${
                  isDark ? 'bg-white/5' : 'bg-gray-50'
                }`}>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fi' ? 'Brändi' : 'Brand'}
                    </label>
                    <input
                      type="text"
                      value={getIdentityOverride()?.brand ?? selectedTire.brand}
                      onChange={(e) => setIdentityField('brand', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fi' ? 'Malli' : 'Model'}
                    </label>
                    <input
                      type="text"
                      value={getIdentityOverride()?.model ?? selectedTire.model}
                      onChange={(e) => setIdentityField('model', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      EAN
                    </label>
                    <input
                      type="text"
                      value={getIdentityOverride()?.ean ?? ''}
                      onChange={(e) => setIdentityField('ean', e.target.value)}
                      placeholder={selectedTire.ean || selectedTire.derived_ean || 'EAN'}
                      className={`w-full px-3 py-2 rounded-lg border font-mono ${
                        isDark ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                    <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {language === 'fi'
                        ? 'Syötä oikea EAN korvaamaan puuttuva EAN.'
                        : 'Enter real EAN to replace missing EAN.'}
                    </p>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fi' ? 'Koko' : 'Size'}
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="205"
                        value={sizeParts.width}
                        onChange={(e) => updateSizePart('width', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="55"
                        value={sizeParts.aspect}
                        onChange={(e) => updateSizePart('aspect', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="16"
                        value={sizeParts.rim}
                        onChange={(e) => updateSizePart('rim', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="91"
                        value={sizeParts.load_index}
                        onChange={(e) => updateSizePart('load_index', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                      <input
                        type="text"
                        placeholder="V"
                        value={sizeParts.speed_rating}
                        onChange={(e) => updateSizePart('speed_rating', e.target.value.toUpperCase())}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {language === 'fi' ? 'Muoto: 205 / 55 R16 91 V' : 'Format: 205 / 55 R16 91 V'}
                    </p>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fi' ? 'Kausi' : 'Season'}
                    </label>
                    <select
                      value={getIdentityOverride()?.season ?? selectedTire.season ?? ''}
                      onChange={(e) => setIdentityField('season', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">{language === 'fi' ? 'Perusta (ei muutosta)' : 'Use base value'}</option>
                      <option value="summer">{language === 'fi' ? 'Kesä' : 'Summer'}</option>
                      <option value="winter">{language === 'fi' ? 'Talvi' : 'Winter'}</option>
                      <option value="all_season">{language === 'fi' ? 'Ympärivuotinen' : 'All Season'}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section B: Tire Badges */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fi' ? 'Rengasmerkit (badges)' : 'Tire badges'}
                  </h3>
                  <button
                    type="button"
                    onClick={clearFeatureOverrides}
                    className={`flex items-center gap-2 text-sm ${isDark ? 'text-blue-200 hover:text-white' : 'text-blue-700 hover:text-blue-900'}`}
                  >
                    <RotateCcw className="w-4 h-4" />
                    {language === 'fi' ? 'Palauta badge-ohitukset' : 'Reset badge overrides'}
                  </button>
                </div>

                <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-lg ${
                  isDark ? 'bg-white/5' : 'bg-gray-50'
                }`}>
                  {[
                    { key: 'ev_ready', labelFi: 'EV', labelEn: 'EV' },
                    { key: 'runflat', labelFi: 'RunFlat', labelEn: 'RunFlat' },
                    { key: 'xl', labelFi: 'XL', labelEn: 'XL' },
                    { key: 'studded', labelFi: 'Nastat', labelEn: 'Studded' },
                    { key: 'threepmsf', labelFi: '3PMSF', labelEn: '3PMSF' },
                    { key: 'winter_approved', labelFi: 'M+S', labelEn: 'M+S' },
                    { key: 'ice_approved', labelFi: 'Jää', labelEn: 'Ice approved' },
                  ].map((feature) => (
                    <label key={feature.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={getEffectiveFeatureValue(feature.key as any)}
                        onChange={(e) => setFeatureField(feature.key as any, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {language === 'fi' ? feature.labelFi : feature.labelEn}
                      </span>
                    </label>
                  ))}
                </div>
                <p className={`mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  {language === 'fi'
                    ? 'Nämä arvot tallennetaan CMS-ohituksina ja voidaan näyttää verkkokaupan korteissa.'
                    : 'These are saved as CMS overrides and can be shown on webshop cards.'}
                </p>
              </div>

              {/* Section B: EU Labels */}
              <div>
                <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fi' ? 'EU-rengas­merkintä' : 'EU Tyre Label'}
                </h3>
                
                <div className={`flex gap-3 p-4 rounded-lg border mb-6 ${
                  isDark 
                    ? 'bg-blue-500/10 border-blue-500/30' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <div className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-900'}`}>
                    {language === 'fi' 
                      ? 'Voit ohittaa toimittajan arvot. Tyhjä = käytä perusarvoa.'
                      : 'Override supplier values. Empty = use base value.'}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Fuel Efficiency */}
                  <div className="space-y-3">
                    <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'fi' ? 'Polttoaine­tehokkuus' : 'Fuel Efficiency'}
                    </label>
                    
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {language === 'fi' ? 'Perustaso:' : 'Base:'}
                      </span>
                      <span className={`font-mono font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {selectedTire.eu_fuel_class || '—'}
                      </span>
                    </div>

                    <select
                      value={getEUOverride()?.fuel_class || ''}
                      onChange={(e) => setEUField('fuel_class', e.target.value || undefined)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-[#1C1C1E] border-white/20 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">{language === 'fi' ? '— Käytä perustasoa —' : '— Use base value —'}</option>
                      {EU_FUEL_WET_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Wet Grip */}
                  <div className="space-y-3">
                    <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'fi' ? 'Märkäpito' : 'Wet Grip'}
                    </label>
                    
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {language === 'fi' ? 'Perustaso:' : 'Base:'}
                      </span>
                      <span className={`font-mono font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {selectedTire.eu_wet_grip_class || '—'}
                      </span>
                    </div>

                    <select
                      value={getEUOverride()?.wet_grip_class || ''}
                      onChange={(e) => setEUField('wet_grip_class', e.target.value || undefined)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-[#1C1C1E] border-white/20 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">{language === 'fi' ? '— Käytä perustasoa —' : '— Use base value —'}</option>
                      {EU_FUEL_WET_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Noise dB */}
                  <div className="space-y-3">
                    <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'fi' ? 'Melutaso (dB)' : 'Noise Level (dB)'}
                    </label>
                    
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {language === 'fi' ? 'Perustaso:' : 'Base:'}
                      </span>
                      <span className={`font-mono font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {selectedTire.eu_noise_db ? `${selectedTire.eu_noise_db} dB` : '—'}
                      </span>
                    </div>

                    <input
                      type="number"
                      min="50"
                      max="90"
                      step="1"
                      value={getEUOverride()?.noise_db ?? ''}
                      onChange={(e) => setEUField('noise_db', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder={language === 'fi' ? 'Käytä perustasoa' : 'Use base value'}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>

                  {/* Noise Class */}
                  <div className="space-y-3">
                    <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'fi' ? 'Meluluokka' : 'Noise Class'}
                    </label>
                    
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {language === 'fi' ? 'Perustaso:' : 'Base:'}
                      </span>
                      <span className={`font-mono font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {selectedTire.eu_noise_class || '—'}
                      </span>
                    </div>

                    <select
                      value={getEUOverride()?.noise_class || ''}
                      onChange={(e) => setEUField('noise_class', e.target.value || undefined)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-[#1C1C1E] border-white/20 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">{language === 'fi' ? '— Käytä perustasoa —' : '— Use base value —'}</option>
                      {EU_NOISE_CLASS_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {hasEUOverride() && (
                  <div className="flex justify-end pt-4 mt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={clearEUOverrides}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                        isDark 
                          ? 'border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400' 
                          : 'border-red-300 bg-red-50 hover:bg-red-100 text-red-700'
                      }`}
                    >
                      <RotateCcw className="w-4 h-4" />
                      {language === 'fi' ? 'Tyhjennä EU-ohitukset' : 'Clear EU Overrides'}
                    </button>
                  </div>
                )}
              </div>

              {/* Section C: Pricing */}
              <div>
                <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fi' ? 'Hinnoittelu' : 'Pricing'}
                </h3>
                
                <div className="space-y-4">
	                  <div className={`p-4 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
	                    <div className="flex justify-between items-center mb-2">
	                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
	                        {language === 'fi' ? 'API / tietokannan alkuperäinen hinta (ilman ALV):' : 'Original API / database price (excl. VAT):'}
	                      </span>
	                      <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
	                        €{originalApiPrice?.toFixed(2) || '0.00'}
	                      </span>
	                    </div>
	                    <div className="flex justify-between items-center">
	                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
	                        {language === 'fi' ? 'Nykyinen voimassa oleva hinta (ilman ALV):' : 'Current effective price (excl. VAT):'}
	                      </span>
	                      <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
	                        €{effectiveDraftPrice?.toFixed(2) || '0.00'}
	                      </span>
	                    </div>
	                    <div className="flex justify-between items-center mt-2">
	                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
	                        {language === 'fi' ? 'Voimassa oleva hinta ALV 25.5% kanssa:' : 'Effective price incl. VAT 25.5%:'}
	                      </span>
	                      <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
	                        €{(toPriceWithVat(effectiveDraftPrice ?? null) ?? 0).toFixed(2)}
	                      </span>
	                    </div>
	                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'fi' ? 'Hinnan ohitus (€)' : 'Price Override (€)'}
                    </label>
	                    <input
	                      type="number"
                      min="0"
                      step="0.01"
                      value={editData.price_override_eur ?? ''}
                      onChange={(e) => setEditData(prev => ({ 
                        ...prev, 
                        price_override_eur: e.target.value ? parseFloat(e.target.value) : null 
                      }))}
                      placeholder={language === 'fi' ? 'Jätä tyhjäksi käyttääksesi perushintaa' : 'Leave empty to use base price'}
	                      className={`w-full px-3 py-2 rounded-lg border ${
	                        isDark 
	                          ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500' 
	                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
	                      }`}
	                    />
	                    <div className="mt-2 flex flex-wrap items-center gap-3">
	                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
	                        {language === 'fi'
	                          ? 'Tyhjä arvo palauttaa alkuperäisen API-hinnan.'
	                          : 'Leaving this empty restores the original API price.'}
	                      </p>
	                      {editData.price_override_eur !== null && editData.price_override_eur !== undefined && (
	                        <button
	                          type="button"
	                          onClick={() => setEditData((prev) => ({ ...prev, price_override_eur: null }))}
	                          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
	                            isDark
	                              ? 'border-white/10 text-gray-200 hover:bg-white/10'
	                              : 'border-gray-300 text-gray-700 hover:bg-gray-100'
	                          }`}
	                        >
	                          <RotateCcw className="w-3.5 h-3.5" />
	                          {language === 'fi' ? 'Palauta alkuperäinen API-hinta' : 'Restore original API price'}
	                        </button>
	                      )}
	                    </div>
	                    <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
	                      {language === 'fi' ? 'ALV 25.5% kanssa:' : 'Incl. VAT 25.5%:'}{' '}
	                      €{(toPriceWithVat(editData.price_override_eur ?? null) ?? 0).toFixed(2)}
	                    </p>
	                  </div>

                  <div className="border-t pt-4 border-white/10">
                    <label className="flex items-center gap-3 cursor-pointer mb-4">
                      <input
                        type="checkbox"
                        checked={editData.promo_enabled || false}
                        onChange={(e) => setEditData(prev => ({ ...prev, promo_enabled: e.target.checked }))}
                        className="w-5 h-5 rounded border-gray-300"
                      />
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {language === 'fi' ? 'Tarjoushinta käytössä' : 'Promotional price enabled'}
                      </span>
                    </label>

                    {editData.promo_enabled && (
                      <div className="space-y-4">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {language === 'fi' ? 'Tarjoushinta (€)' : 'Promo Price (€)'}
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editData.promo_price_eur ?? ''}
                            onChange={(e) => setEditData(prev => ({ 
                              ...prev, 
                              promo_price_eur: e.target.value ? parseFloat(e.target.value) : null 
                            }))}
                            className={`w-full px-3 py-2 rounded-lg border ${
                              isDark 
                                ? 'bg-[#1C1C1E] border-white/20 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {language === 'fi' ? 'Alkaa' : 'Start Date'}
                            </label>
                            <input
                              type="date"
                              value={editData.promo_start ?? ''}
                              onChange={(e) => setEditData(prev => ({ ...prev, promo_start: e.target.value || null }))}
                              className={`w-full px-3 py-2 rounded-lg border ${
                                isDark 
                                  ? 'bg-[#1C1C1E] border-white/20 text-white' 
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            />
                            <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {language === 'fi' ? 'ALV 25.5% kanssa:' : 'Incl. VAT 25.5%:'}{' '}
                              €{(toPriceWithVat(editData.promo_price_eur ?? null) ?? 0).toFixed(2)}
                            </p>
                          </div>

                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {language === 'fi' ? 'Päättyy' : 'End Date'}
                            </label>
                            <input
                              type="date"
                              value={editData.promo_end ?? ''}
                              onChange={(e) => setEditData(prev => ({ ...prev, promo_end: e.target.value || null }))}
                              className={`w-full px-3 py-2 rounded-lg border ${
                                isDark 
                                  ? 'bg-[#1C1C1E] border-white/20 text-white' 
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4 border-white/10 space-y-4">
                    {(() => {
                      const bundlePricing = getBundlePricing();
                      const tier2 = bundlePricing?.qty2 ?? { mode: 'none' as BundlePricingMode, percent_off: null, fixed_total_eur: null };
                      const tier4 = bundlePricing?.qty4 ?? { mode: 'none' as BundlePricingMode, percent_off: null, fixed_total_eur: null };
                      const basePrice = Number(selectedTire.final_price_eur ?? selectedTire.price ?? 0);
                      const preview2 = calculateLinePricing(basePrice, 2, bundlePricing);
                      const preview4 = calculateLinePricing(basePrice, 4, bundlePricing);
                      const invalidFixed2 = tier2.mode === 'fixed_total' && tier2.fixed_total_eur !== null && !isFixedBundleTotalCompatible(tier2.fixed_total_eur, 2);
                      const invalidFixed4 = tier4.mode === 'fixed_total' && tier4.fixed_total_eur !== null && !isFixedBundleTotalCompatible(tier4.fixed_total_eur, 4);

                      return (
                        <>
                          <div>
                            <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {language === 'fi' ? 'Pakettihinnoittelu (2 / 4 kpl)' : 'Bundle pricing (2 / 4 items)'}
                            </h4>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {language === 'fi'
                                ? 'Valitse alennusprosentti tai kiinteä kokonaishinta 2 tai 4 kappaleelle.'
                                : 'Choose percentage discount or fixed total for bundles of 2 or 4 units.'}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={`rounded-lg border p-3 space-y-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                              <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>2 {language === 'fi' ? 'kpl' : 'items'}</p>
                              <select
                                value={tier2.mode}
                                onChange={(e) => setBundleTier(2, {
                                  mode: e.target.value as BundlePricingMode,
                                  percent_off: null,
                                  fixed_total_eur: null,
                                })}
                                className={`w-full px-3 py-2 rounded-lg border ${
                                  isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              >
                                <option value="none">{language === 'fi' ? 'Ei alennusta' : 'No bundle discount'}</option>
                                <option value="percent">{language === 'fi' ? 'Alennus %' : 'Discount %'}</option>
                                <option value="fixed_total">{language === 'fi' ? 'Kiinteä kokonaishinta' : 'Fixed total price'}</option>
                              </select>
                              {tier2.mode === 'percent' && (
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  value={tier2.percent_off ?? ''}
                                  onChange={(e) => setBundleTier(2, { percent_off: e.target.value ? Number(e.target.value) : null })}
                                  placeholder={language === 'fi' ? 'Esim. 5' : 'e.g. 5'}
                                  className={`w-full px-3 py-2 rounded-lg border ${
                                    isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                />
                              )}
                              {tier2.mode === 'fixed_total' && (
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={tier2.fixed_total_eur ?? ''}
                                  onChange={(e) => setBundleTier(2, { fixed_total_eur: e.target.value ? Number(e.target.value) : null })}
                                  placeholder={language === 'fi' ? 'Esim. 220.00' : 'e.g. 220.00'}
                                  className={`w-full px-3 py-2 rounded-lg border ${
                                    isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                />
                              )}
                              {invalidFixed2 && (
                                <p className={`text-xs ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                                  {language === 'fi'
                                    ? 'Kiinteä hinta ei jakaudu tasan 2 kappaleelle senttitasolla.'
                                    : 'Fixed total does not divide evenly across 2 units in cents.'}
                                </p>
                              )}
                              <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {language === 'fi' ? 'Esikatselu:' : 'Preview:'} €{preview2.lineTotalEur.toFixed(2)}
                                {preview2.savingsEur > 0 ? ` (${language === 'fi' ? 'säästö' : 'saving'} €${preview2.savingsEur.toFixed(2)})` : ''}
                              </p>
                            </div>

                            <div className={`rounded-lg border p-3 space-y-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                              <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>4 {language === 'fi' ? 'kpl' : 'items'}</p>
                              <select
                                value={tier4.mode}
                                onChange={(e) => setBundleTier(4, {
                                  mode: e.target.value as BundlePricingMode,
                                  percent_off: null,
                                  fixed_total_eur: null,
                                })}
                                className={`w-full px-3 py-2 rounded-lg border ${
                                  isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              >
                                <option value="none">{language === 'fi' ? 'Ei alennusta' : 'No bundle discount'}</option>
                                <option value="percent">{language === 'fi' ? 'Alennus %' : 'Discount %'}</option>
                                <option value="fixed_total">{language === 'fi' ? 'Kiinteä kokonaishinta' : 'Fixed total price'}</option>
                              </select>
                              {tier4.mode === 'percent' && (
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  value={tier4.percent_off ?? ''}
                                  onChange={(e) => setBundleTier(4, { percent_off: e.target.value ? Number(e.target.value) : null })}
                                  placeholder={language === 'fi' ? 'Esim. 10' : 'e.g. 10'}
                                  className={`w-full px-3 py-2 rounded-lg border ${
                                    isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                />
                              )}
                              {tier4.mode === 'fixed_total' && (
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={tier4.fixed_total_eur ?? ''}
                                  onChange={(e) => setBundleTier(4, { fixed_total_eur: e.target.value ? Number(e.target.value) : null })}
                                  placeholder={language === 'fi' ? 'Esim. 420.00' : 'e.g. 420.00'}
                                  className={`w-full px-3 py-2 rounded-lg border ${
                                    isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                />
                              )}
                              {invalidFixed4 && (
                                <p className={`text-xs ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                                  {language === 'fi'
                                    ? 'Kiinteä hinta ei jakaudu tasan 4 kappaleelle senttitasolla.'
                                    : 'Fixed total does not divide evenly across 4 units in cents.'}
                                </p>
                              )}
                              <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {language === 'fi' ? 'Esikatselu:' : 'Preview:'} €{preview4.lineTotalEur.toFixed(2)}
                                {preview4.savingsEur > 0 ? ` (${language === 'fi' ? 'säästö' : 'saving'} €${preview4.savingsEur.toFixed(2)})` : ''}
                              </p>
                            </div>
                          </div>

                          {(bundlePricing?.qty2 || bundlePricing?.qty4) && (
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={clearBundlePricing}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                                  isDark
                                    ? 'border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400'
                                    : 'border-red-300 bg-red-50 hover:bg-red-100 text-red-700'
                                }`}
                              >
                                <RotateCcw className="w-4 h-4" />
                                {language === 'fi' ? 'Tyhjennä pakettihinnoittelu' : 'Clear bundle pricing'}
                              </button>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Section D: Images */}
              <div>
                <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fi' ? 'Kuvat' : 'Images'}
                </h3>

                {/* Upload Button */}
                {((editData.gallery as string[])?.length || 0) < 10 && (
                  <label className="block cursor-pointer mb-4">
                    <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDark 
                        ? 'border-white/20 hover:border-white/40 bg-white/5' 
                        : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                    }`}>
                      <Upload className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <p className={`text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {uploadingImages ? (language === 'fi' ? 'Ladataan...' : 'Uploading...') : (language === 'fi' ? 'Klikkaa ladataksesi kuvia' : 'Click to upload images')}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        PNG, JPG max 5MB ({(editData.gallery as string[])?.length || 0}/10)
                      </p>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files)}
                      disabled={uploadingImages}
                      className="hidden"
                    />
                  </label>
                )}

                {uploadError && (
                  <div className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
                    <p className="text-sm">{uploadError}</p>
                  </div>
                )}

                {/* Image Grid */}
                {((editData.gallery as string[])?.length || 0) > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {(editData.gallery as string[]).map((url, index) => (
                      <div
                        key={url}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                          draggedIndex === index 
                            ? 'opacity-50 scale-95' 
                            : 'opacity-100 scale-100'
                        } ${
                          isDark ? 'border-white/10 hover:border-white/30' : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <div className="aspect-square bg-white">
                          <img 
                            src={url} 
                            alt={`Product ${index + 1}`}
                            className="w-full h-full object-contain"
                          />
                        </div>

                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 cursor-move"
                            title="Drag to reorder"
                          >
                            <GripVertical className="w-5 h-5 text-white" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="p-2 rounded-lg bg-red-500/80 hover:bg-red-500 transition-colors"
                            title="Remove"
                          >
                            <X className="w-5 h-5 text-white" />
                          </button>
                        </div>

                        <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${
                          index === 0 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-black/50 text-white'
                        }`}>
                          {index === 0 ? 'Hero' : `#${index + 1}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section E: Content */}
              <div>
                <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fi' ? 'Sisältö' : 'Content'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'fi' ? 'Otsikko' : 'Title'}
                    </label>
                    <input
                      type="text"
                      value={editData.title ?? ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder={`${getEffectiveIdentity(selectedTire).brand} ${getEffectiveIdentity(selectedTire).model}`}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'fi' ? 'Alaotsikko' : 'Subtitle'}
                    </label>
                    <input
                      type="text"
                      value={editData.subtitle ?? ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, subtitle: e.target.value }))}
                      placeholder={getEffectiveIdentity(selectedTire).size_string || ''}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'fi' ? 'Lyhyt kuvaus' : 'Short Description'}
                    </label>
                    <textarea
                      rows={3}
                      value={editData.short_description ?? ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, short_description: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'fi' ? 'Pitkä kuvaus' : 'Long Description'}
                    </label>
                    <textarea
                      rows={6}
                      value={editData.long_description ?? ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, long_description: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Section F: SEO */}
              <div>
                <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  SEO
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'fi' ? 'URL-tunniste' : 'SEO Slug'}
                    </label>
                    <input
                      type="text"
                      value={editData.seo_slug ?? ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, seo_slug: e.target.value }))}
                      placeholder="tire-brand-model-size"
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'fi' ? 'SEO-otsikko' : 'SEO Title'}
                    </label>
                    <input
                      type="text"
                      value={editData.seo_title ?? ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, seo_title: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'fi' ? 'SEO-kuvaus' : 'SEO Description'}
                    </label>
                    <textarea
                      rows={3}
                      value={editData.seo_description ?? ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, seo_description: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Section G: Visibility */}
              <div>
                <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fi' ? 'Näkyvyys' : 'Visibility'}
                </h3>
                {mustHideFromStore(selectedTire) && (
                  <div className={`mb-3 flex items-start gap-2 rounded-lg border p-3 ${
                    isDark ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' : 'border-amber-300 bg-amber-50 text-amber-800'
                  }`}>
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p className="text-sm">
                      {language === 'fi'
                        ? (
                          hasMissingSupplierPrice(selectedTire)
                            ? 'Toimittajahinta puuttuu. Tuote pidetään automaattisesti piilotettuna verkkokaupasta.'
                            : 'Tämä ei ole henkilöauton rengas. Tuote pidetään automaattisesti piilotettuna verkkokaupasta.'
                        )
                        : (
                          hasMissingSupplierPrice(selectedTire)
                            ? 'Supplier price is missing. This product is automatically kept hidden from webshop.'
                            : 'This is not a passenger-car tire. The product is automatically kept hidden from webshop.'
                        )}
                    </p>
                  </div>
                )}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editData.is_hidden) || mustHideFromStore(selectedTire)}
                    disabled={mustHideFromStore(selectedTire)}
                    onChange={(e) => setEditData(prev => ({ ...prev, is_hidden: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fi' ? 'Piilota kaupasta' : 'Hide from store'}
                  </span>
                </label>
                <label className="mt-3 flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={getManualNonPassengerFlag(editData.spec_overrides)}
                    onChange={(e) =>
                      setEditData((prev) => {
                        const currentOverrides = prev.spec_overrides || {};
                        const currentClassification = (currentOverrides.classification || {}) as Record<string, any>;
                        const nextClassification = { ...currentClassification };

                        if (e.target.checked) {
                          nextClassification.non_passenger_manual = true;
                        } else {
                          delete nextClassification.non_passenger_manual;
                        }

                        const { classification, ...restOverrides } = currentOverrides;
                        const nextOverrides = {
                          ...restOverrides,
                          ...(Object.keys(nextClassification).length > 0 ? { classification: nextClassification } : {}),
                        };

                        return {
                          ...prev,
                          spec_overrides: Object.keys(nextOverrides).length > 0 ? nextOverrides : null,
                        };
                      })
                    }
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fi' ? 'Merkitse ei-henkilöautoksi' : 'Mark as non-passenger'}
                  </span>
                </label>
              </div>

              {/* Save Error */}
              {saveError && (
                <div className={`flex gap-3 p-4 rounded-lg ${
                  isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'
                }`}>
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{saveError}</p>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className={`sticky bottom-0 border-t ${
              isDark ? 'bg-[#161A22] border-white/10' : 'bg-white border-gray-200'
            } px-6 py-4 flex items-center justify-between gap-3`}>
              <button
                onClick={handleResetCms}
                disabled={saving}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark
                    ? 'border border-red-500/40 text-red-300 hover:bg-red-500/20'
                    : 'border border-red-300 text-red-600 hover:bg-red-50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <RotateCcw className="w-4 h-4" />
                {language === 'fi' ? 'Tyhjennä CMS' : 'Reset CMS'}
              </button>
              <button
                onClick={handleCloseDrawer}
                disabled={saving}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark 
                    ? 'bg-white/10 text-white hover:bg-white/20' 
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {language === 'fi' ? 'Peruuta' : 'Cancel'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Save className="w-4 h-4" />
                {saving ? (language === 'fi' ? 'Tallennetaan...' : 'Saving...') : (language === 'fi' ? 'Tallenna' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
