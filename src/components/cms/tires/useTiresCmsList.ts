import { useCallback, useEffect, useMemo, useState } from 'react';

import { supabase } from '../../../utils/supabase/client';
import type { TireRow } from './types';

const TIRES_CMS_STATE_KEY = 'mitra.tires-cms.state.v1';
const TIRES_CMS_CACHE_KEY = 'mitra.tires-cms.cache.v1';

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

function normalizeEuRating(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim().toUpperCase();
  return /^[A-E]$/.test(normalized) ? normalized : null;
}

function normalizeEuNoise(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function extractLabelValue(label: any, keys: string[]): unknown {
  if (!label || typeof label !== 'object') return null;

  for (const key of keys) {
    if (label[key] !== undefined && label[key] !== null && label[key] !== '') {
      return label[key];
    }
  }

  return null;
}

export function useTiresCmsList(pageSize = 25) {
  const initialState = (() => {
    if (typeof window === 'undefined') {
      return {
        tires: [] as TireRow[],
        totalCount: 0,
        searchTerm: '',
        showMissingEanOnly: false,
        hideNonPassenger: true,
        currentPage: 1,
      };
    }

    try {
      const rawState = window.sessionStorage.getItem(TIRES_CMS_STATE_KEY);
      const parsedState = rawState ? JSON.parse(rawState) : null;
      const rawCache = window.sessionStorage.getItem(TIRES_CMS_CACHE_KEY);
      const parsedCache = rawCache ? JSON.parse(rawCache) : null;

      return {
        tires: Array.isArray(parsedCache?.tires) ? parsedCache.tires : [],
        totalCount: Number.isFinite(parsedCache?.totalCount) ? parsedCache.totalCount : 0,
        searchTerm: typeof parsedState?.searchTerm === 'string' ? parsedState.searchTerm : '',
        showMissingEanOnly: Boolean(parsedState?.showMissingEanOnly),
        hideNonPassenger:
          typeof parsedState?.hideNonPassenger === 'boolean' ? parsedState.hideNonPassenger : true,
        currentPage:
          Number.isInteger(parsedState?.currentPage) && parsedState.currentPage > 0
            ? parsedState.currentPage
            : 1,
      };
    } catch {
      return {
        tires: [] as TireRow[],
        totalCount: 0,
        searchTerm: '',
        showMissingEanOnly: false,
        hideNonPassenger: true,
        currentPage: 1,
      };
    }
  })();

  const [tires, setTires] = useState<TireRow[]>(initialState.tires);
  const [loading, setLoading] = useState(initialState.tires.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialState.searchTerm);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialState.searchTerm);
  const [showMissingEanOnly, setShowMissingEanOnly] = useState(initialState.showMissingEanOnly);
  const [hideNonPassenger, setHideNonPassenger] = useState(initialState.hideNonPassenger);
  const [currentPage, setCurrentPage] = useState(initialState.currentPage);
  const [totalCount, setTotalCount] = useState(initialState.totalCount);

  const toNumberOrNull = useCallback((value: any) => {
    if (value === null || value === undefined || value === '') return null;
    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }, []);

  const isAutoNonPassengerTire = useCallback((row: any) => {
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
  }, [toNumberOrNull]);

  const getManualNonPassengerFlag = useCallback((specOverrides: any) =>
    Boolean(specOverrides?.classification?.non_passenger_manual), []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchTerm(searchTerm), 250);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [showMissingEanOnly, hideNonPassenger, debouncedSearchTerm]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(
      TIRES_CMS_STATE_KEY,
      JSON.stringify({
        searchTerm,
        showMissingEanOnly,
        hideNonPassenger,
        currentPage,
      })
    );
  }, [currentPage, hideNonPassenger, searchTerm, showMissingEanOnly]);

  const fetchTires = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const trimmedSearch = debouncedSearchTerm.trim();
      const offset = (currentPage - 1) * pageSize;
      const mapRowsToTires = (rows: any[]) => {
        const normalizedEanCounts = new Map<string, number>();

        for (const row of rows) {
          const cmsData = row.cms_data || null;
          const identity = (cmsData?.spec_overrides as any)?.identity ?? {};
          const identityEan = String(identity?.ean ?? '').replace(/\D/g, '');
          const ean = (identityEan || row.derived_ean || row.ean || '').trim();
          if (!ean) continue;
          normalizedEanCounts.set(ean, (normalizedEanCounts.get(ean) ?? 0) + 1);
        }

        return rows.map((row: any) => {
          const cmsData = row.cms_data || null;
          const identity = (cmsData?.spec_overrides as any)?.identity ?? {};
          const identityEan = String(identity?.ean ?? '').replace(/\D/g, '');
          const resolvedEan = identityEan || row.derived_ean || row.ean || null;
          const euLabel = row.eu_label_json && typeof row.eu_label_json === 'object' ? row.eu_label_json : null;
          const euNoiseClass =
            euLabel?.noise_class ??
            euLabel?.noiseClass ??
            euLabel?.external_noise_class ??
            euLabel?.externalNoiseClass ??
            null;
          const euFuel = normalizeEuRating(
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
          );
          const euWet = normalizeEuRating(
            row.eu_wet ??
              extractLabelValue(euLabel, [
                'wet',
                'wet_class',
                'wet_grip_class',
                'wetgripclass',
                'wet_grip',
                'wetgrip',
              ])
          );
          const euNoise = normalizeEuNoise(
            row.eu_noise ??
              extractLabelValue(euLabel, [
                'noise',
                'noise_db',
                'noiseclass',
                'noise_class',
                'noisedb',
                'db',
              ])
          );
          const missingEan =
            !resolvedEan ||
            String(resolvedEan).trim().length === 0 ||
            String(resolvedEan).startsWith('EANMISSING_');
          const duplicateEanConflict = (() => {
            const normalized = (resolvedEan ?? '').trim();
            return normalized ? (normalizedEanCounts.get(normalized) ?? 0) > 1 : false;
          })();
          const resolvedPrice = row.final_price_eur ?? row.price ?? null;
          const mandatoryFieldConflict =
            Boolean(row.has_mandatory_conflict) ||
            missingEan ||
            !row.brand ||
            String(row.brand).trim().length === 0 ||
            !row.model ||
            String(row.model).trim().length === 0 ||
            !row.size_string ||
            String(row.size_string).trim().length === 0 ||
            resolvedPrice === null ||
            resolvedPrice === undefined;
          const autoNonPassenger =
            typeof row.is_non_passenger_auto === 'boolean' ? row.is_non_passenger_auto : isAutoNonPassengerTire(row);
          const manualNonPassenger = getManualNonPassengerFlag(cmsData?.spec_overrides);

          return {
            ...row,
            brand: identity.brand ?? row.brand,
            model: identity.model ?? row.model,
            size_string: identity.size_string ?? row.size_string,
            derived_ean: resolvedEan,
            eu_fuel_class: euFuel,
            eu_wet_grip_class: euWet,
            eu_noise_db: euNoise,
            eu_noise_class: typeof euNoiseClass === 'string' ? euNoiseClass : null,
            final_price_eur:
              cmsData?.promo_enabled && cmsData?.promo_price_eur !== null && cmsData?.promo_price_eur !== undefined
                ? cmsData.promo_price_eur
                : cmsData?.price_override_eur ?? row.final_price_eur ?? row.price ?? null,
            has_missing_ean: missingEan,
            has_duplicate_ean_conflict: Boolean(row.has_ean_multi_spec_conflict) || duplicateEanConflict,
            has_mandatory_field_conflict: mandatoryFieldConflict,
            is_non_passenger_auto: autoNonPassenger,
            is_non_passenger_manual: manualNonPassenger,
            is_non_passenger: autoNonPassenger || manualNonPassenger,
            ean_conflict_open:
              Boolean(row.ean_conflict_open) ||
              Boolean(row.has_ean_multi_spec_conflict) ||
              mandatoryFieldConflict,
            cms_data: cmsData,
          } as TireRow;
        });
      };

      try {
        const { data: rpcRows, error: rpcError } = await supabase.rpc('cms_list_tires_admin_v1', {
          p_search: trimmedSearch || null,
          p_missing_ean_only: showMissingEanOnly,
          p_exclude_non_passenger: hideNonPassenger,
          p_limit: pageSize + 1,
          p_offset: offset,
        });

        if (rpcError) {
          throw rpcError;
        }

        const rows = rpcRows ?? [];
        if (rows.length === 0) {
          setTires([]);
          setTotalCount(offset);
          return;
        }

        const hasMorePages = rows.length > pageSize;
        const visibleRows = hasMorePages ? rows.slice(0, pageSize) : rows;
        const resolvedTotalCount = hasMorePages ? offset + visibleRows.length + 1 : offset + visibleRows.length;

        const mappedRows = mapRowsToTires(visibleRows);
        setTotalCount(resolvedTotalCount);
        setTires(mappedRows);
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(
            TIRES_CMS_CACHE_KEY,
            JSON.stringify({
              tires: mappedRows,
              totalCount: resolvedTotalCount,
            })
          );
        }
        return;
      } catch (rpcListError) {
        console.warn('cms_list_tires_admin_v1 fallback to products_search path:', rpcListError);
      }

      const productsSearchColumns = [
        'variant_id',
        'product_type',
        'derived_ean',
        'supplier_code_best',
        'supplier_external_id_best',
        'brand',
        'model',
        'size_string',
        'season',
        'runflat',
        'xl_reinforced',
        'load_index',
        'speed_rating',
        'speed_index',
        'ev_ready',
        'threepmsf',
        'winter_approved',
        'ice_approved',
        'eu_wet',
        'eu_noise',
        'eu_label_json',
        'final_price_eur',
        'price',
        'ean_conflict_open',
        'width_mm',
        'aspect_ratio',
        'diameter_in',
      ].join(', ');
      const productCmsColumns = [
        'variant_id',
        'title',
        'subtitle',
        'short_description',
        'long_description',
        'hero_image_url',
        'gallery',
        'seo_slug',
        'seo_title',
        'seo_description',
        'is_hidden',
        'spec_overrides',
        'price_override_eur',
        'promo_enabled',
        'promo_price_eur',
        'promo_start',
        'promo_end',
      ].join(', ');

      let productsQuery = supabase
        .from('products_search')
        .select(productsSearchColumns)
        .eq('product_type', 'tire')
        .order('brand', { ascending: true })
        .order('model', { ascending: true })
        .order('variant_id', { ascending: true })
        .range(offset, offset + pageSize);

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
      if (hideNonPassenger) {
        productsQuery = productsQuery.eq('is_non_passenger', false);
      }

      const { data: products, error: productsError } = await productsQuery;
      if (productsError) throw productsError;

      if (!products || products.length === 0) {
        setTires([]);
        setTotalCount(offset);
        return;
      }

      const hasMorePages = products.length > pageSize;
      const visibleProducts = hasMorePages ? products.slice(0, pageSize) : products;
      const resolvedTotalCount = hasMorePages ? offset + visibleProducts.length + 1 : offset + visibleProducts.length;
      setTotalCount(resolvedTotalCount);

      const variantIds = visibleProducts.map((product: any) => product.variant_id);
      const variantIdsNeedingFallbackEan = visibleProducts
        .filter((product: any) => !product.derived_ean || String(product.derived_ean).startsWith('EANMISSING_'))
        .map((product: any) => product.variant_id);
      const chunkSize = 200;
      const cmsRows: any[] = [];
      const eanRows: any[] = [];

      for (let i = 0; i < variantIds.length; i += chunkSize) {
        const idChunk = variantIds.slice(i, i + chunkSize);
        const eanChunk = variantIdsNeedingFallbackEan.filter((variantId) => idChunk.includes(variantId));
        const queries: [PromiseLike<any>, PromiseLike<any> | null] = [
          supabase.from('product_cms').select(productCmsColumns).in('variant_id', idChunk),
          eanChunk.length > 0
            ? supabase.from('catalog_tire_variants').select('id, ean').in('id', eanChunk)
            : null,
        ];
        const [cmsResult, eanResult] = await Promise.all([
          queries[0],
          queries[1] ?? Promise.resolve({ data: [], error: null }),
        ]);
        const { data: cmsBatch, error: cmsError } = cmsResult;
        const { data: eanBatch, error: eanError } = eanResult;

        if (cmsError) throw cmsError;
        if (eanError) throw eanError;

        if (cmsBatch?.length) cmsRows.push(...cmsBatch);
        if (eanBatch?.length) eanRows.push(...eanBatch);
      }

      const cmsMap = new Map(cmsRows.map((row: any) => [row.variant_id, row]));
      const eanMap = new Map(eanRows.map((row: any) => [row.id, row.ean]));
      const fallbackRows = visibleProducts.map((product: any) => ({
        ...product,
        ean: eanMap.get(product.variant_id) ?? null,
        cms_data: cmsMap.get(product.variant_id) || null,
      }));

      const mappedFallbackRows = mapRowsToTires(fallbackRows);
      setTires(mappedFallbackRows);
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          TIRES_CMS_CACHE_KEY,
          JSON.stringify({
            tires: mappedFallbackRows,
            totalCount: resolvedTotalCount,
          })
        );
      }
    } catch (err: any) {
      console.error('Fetch tires error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    debouncedSearchTerm,
    getManualNonPassengerFlag,
    hideNonPassenger,
    isAutoNonPassengerTire,
    pageSize,
    showMissingEanOnly,
  ]);

  useEffect(() => {
    void fetchTires();
  }, [fetchTires]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / pageSize)), [pageSize, totalCount]);
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);
  const paginationItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const items: Array<number | 'ellipsis-left' | 'ellipsis-right'> = [1];
    const windowStart = Math.max(2, currentPage - 1);
    const windowEnd = Math.min(totalPages - 1, currentPage + 1);

    if (windowStart > 2) items.push('ellipsis-left');
    for (let page = windowStart; page <= windowEnd; page += 1) items.push(page);
    if (windowEnd < totalPages - 1) items.push('ellipsis-right');
    items.push(totalPages);
    return items;
  }, [currentPage, totalPages]);

  const patchLocalCmsData = useCallback((variantId: string, cmsPatch: Record<string, any> | null) => {
    setTires((previous) =>
      previous.map((tire) => {
        if (tire.variant_id !== variantId) return tire;
        if (cmsPatch === null) {
          const autoNonPassenger = Boolean(tire.is_non_passenger_auto);
          return { ...tire, cms_data: null, is_non_passenger_manual: false, is_non_passenger: autoNonPassenger };
        }

        const nextCmsData = { ...(tire.cms_data ?? { variant_id: tire.variant_id }), ...cmsPatch } as any;
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
      }),
    );
  }, [getManualNonPassengerFlag]);

  const patchLocalIdentityData = useCallback((variantId: string, specOverrides: any) => {
    const identity = specOverrides?.identity ?? {};
    const identityEan = String(identity?.ean ?? '').replace(/\D/g, '');

    setTires((previous) =>
      previous.map((tire) =>
        tire.variant_id === variantId
          ? {
              ...tire,
              brand: identity?.brand ?? tire.brand,
              model: identity?.model ?? tire.model,
              size_string: identity?.size_string ?? tire.size_string,
              derived_ean: identityEan || tire.derived_ean,
            }
          : tire,
      ),
    );
  }, []);

  return {
    currentPage,
    debouncedSearchTerm,
    endItem,
    error,
    fetchTires,
    paginationItems,
    patchLocalCmsData,
    patchLocalIdentityData,
    searchTerm,
    setCurrentPage,
    setHideNonPassenger,
    setSearchTerm,
    setShowMissingEanOnly,
    hideNonPassenger,
    showMissingEanOnly,
    startItem,
    tires,
    totalCount,
    totalPages,
    loading,
  };
}
