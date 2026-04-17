import { useCallback, useEffect, useMemo, useState } from 'react';

import { supabase } from '../../../utils/supabase/client';
import type { TireRow } from './types';

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

export function useTiresCmsList(pageSize = 50) {
  const [tires, setTires] = useState<TireRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showMissingEanOnly, setShowMissingEanOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

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
  }, [showMissingEanOnly, debouncedSearchTerm]);

  const fetchTires = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const trimmedSearch = debouncedSearchTerm.trim();
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
        'eu_fuel',
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

      let productsQuery = supabase
        .from('products_search')
        .select(productsSearchColumns, { count: 'estimated' })
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

      const variantIds = products.map((product: any) => product.variant_id);
      const chunkSize = 200;
      const cmsRows: any[] = [];
      const eanRows: any[] = [];

      for (let i = 0; i < variantIds.length; i += chunkSize) {
        const idChunk = variantIds.slice(i, i + chunkSize);
        const [{ data: cmsBatch, error: cmsError }, { data: eanBatch, error: eanError }] = await Promise.all([
          supabase.from('product_cms').select('*').in('variant_id', idChunk),
          supabase.from('catalog_tire_variants').select('id, ean').in('id', idChunk),
        ]);

        if (cmsError) throw cmsError;
        if (eanError) throw eanError;

        if (cmsBatch?.length) cmsRows.push(...cmsBatch);
        if (eanBatch?.length) eanRows.push(...eanBatch);
      }

      const cmsMap = new Map(cmsRows.map((row: any) => [row.variant_id, row]));
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

      const merged = products.map((product: any) => {
        const cmsData = cmsMap.get(product.variant_id) || null;
        const identity = (cmsData?.spec_overrides as any)?.identity ?? {};
        const identityEan = String(identity?.ean ?? '').replace(/\D/g, '');
        const resolvedEan = identityEan || product.derived_ean || eanMap.get(product.variant_id) || null;
        const euLabel = product.eu_label_json && typeof product.eu_label_json === 'object' ? product.eu_label_json : null;
        const euNoiseClass =
          euLabel?.noise_class ??
          euLabel?.noiseClass ??
          euLabel?.external_noise_class ??
          euLabel?.externalNoiseClass ??
          null;
        const missingEan = !resolvedEan || String(resolvedEan).trim().length === 0 || String(resolvedEan).startsWith('EANMISSING_');
        const duplicateEanConflict = (() => {
          const normalized = (resolvedEan ?? '').trim();
          return normalized ? (normalizedEanCounts.get(normalized) ?? 0) > 1 : false;
        })();
        const resolvedPrice = product.final_price_eur ?? product.price ?? null;
        const mandatoryFieldConflict =
          missingEan ||
          !product.brand ||
          String(product.brand).trim().length === 0 ||
          !product.model ||
          String(product.model).trim().length === 0 ||
          !product.size_string ||
          String(product.size_string).trim().length === 0 ||
          resolvedPrice === null ||
          resolvedPrice === undefined;
        const autoNonPassenger = isAutoNonPassengerTire(product);
        const manualNonPassenger = getManualNonPassengerFlag(cmsData?.spec_overrides);

        return {
          ...product,
          brand: identity.brand ?? product.brand,
          model: identity.model ?? product.model,
          size_string: identity.size_string ?? product.size_string,
          derived_ean: resolvedEan,
          eu_fuel_class: product.eu_fuel ?? null,
          eu_wet_grip_class: product.eu_wet ?? null,
          eu_noise_db: product.eu_noise ?? null,
          eu_noise_class: typeof euNoiseClass === 'string' ? euNoiseClass : null,
          final_price_eur:
            cmsData?.promo_enabled && cmsData?.promo_price_eur !== null && cmsData?.promo_price_eur !== undefined
              ? cmsData.promo_price_eur
              : cmsData?.price_override_eur ?? product.final_price_eur ?? product.price ?? null,
          has_missing_ean: missingEan,
          has_duplicate_ean_conflict: duplicateEanConflict,
          has_mandatory_field_conflict: mandatoryFieldConflict,
          is_non_passenger_auto: autoNonPassenger,
          is_non_passenger_manual: manualNonPassenger,
          is_non_passenger: autoNonPassenger || manualNonPassenger,
          ean_conflict_open: Boolean(product.ean_conflict_open) || duplicateEanConflict || mandatoryFieldConflict,
          cms_data: cmsData,
        } as TireRow;
      });

      setTires(showMissingEanOnly ? merged.filter((row) => Boolean(row.has_missing_ean)) : merged);
    } catch (err: any) {
      console.error('Fetch tires error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, getManualNonPassengerFlag, isAutoNonPassengerTire, pageSize, showMissingEanOnly]);

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
    setSearchTerm,
    setShowMissingEanOnly,
    showMissingEanOnly,
    startItem,
    tires,
    totalCount,
    totalPages,
    loading,
  };
}
