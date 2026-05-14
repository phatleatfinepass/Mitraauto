import { useCallback, useEffect, useRef, useState } from 'react';

import { supabase } from '../../../utils/supabase/client';
import type { RimRow } from './types';

const RIMS_CMS_STATE_KEY = 'mitra.rims-cms.state.v1';
const RIMS_CMS_CACHE_KEY = 'mitra.rims-cms.cache.v1';

type RimsCmsCacheStore = {
  queries: Record<string, {
    totalCount: number;
    pages: Record<string, RimRow[]>;
  }>;
};

const RIMS_CMS_WEBSTORE_FALLBACK_SELECT = [
  'variant_id',
  'product_type',
  'ean',
  'derived_ean',
  'supplier_code_best',
  'supplier_external_id_best',
  'brand',
  'brand_display_name',
  'model',
  'size_string',
  'width_in',
  'rim_diameter_in',
  'et_offset_mm',
  'bolt_pattern',
  'center_bore_mm',
  'cb_mm',
  'color',
  'finish',
  'material',
  'bolts_included',
  'winter_approved',
  'wheel_load_kg',
  'final_price_eur',
  'price',
  'stock_qty',
  'in_stock',
  'delivery_days_min',
  'delivery_days_max',
  'best_image_url',
  'hero_image_url',
  'seo_title',
  'seo_description',
  'spec_overrides',
  'publish_status',
  'publish_block_reason',
].join(',');

function toNumberOrNull(value: any) {
  if (value === null || value === undefined || value === '') return null;
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function isStatementTimeoutError(error: any) {
  return error?.code === '57014' || String(error?.message ?? '').toLowerCase().includes('statement timeout');
}

function isRecoverableFetchError(error: any) {
  const message = String(error?.message ?? error ?? '').toLowerCase();
  const details = String(error?.details ?? '').toLowerCase();
  return isStatementTimeoutError(error) || message.includes('failed to fetch') || details.includes('failed to fetch');
}

function readRimsCmsCacheStore(): RimsCmsCacheStore {
  if (typeof window === 'undefined') return { queries: {} };
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(RIMS_CMS_CACHE_KEY) || 'null');
    if (parsed && typeof parsed === 'object' && parsed.queries && typeof parsed.queries === 'object') {
      return parsed as RimsCmsCacheStore;
    }
  } catch {
    // Ignore corrupt session cache and rebuild it from fresh responses.
  }
  return { queries: {} };
}

function writeRimsCmsCacheStore(cache: RimsCmsCacheStore) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(RIMS_CMS_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Session storage can be unavailable or full. The CMS still works without cache.
  }
}

function normalizeCmsData(value: any) {
  if (!value || typeof value !== 'object') return null;
  const gallery = Array.isArray(value.gallery)
    ? value.gallery.filter((url: any): url is string => typeof url === 'string' && url.trim().length > 0)
    : [];
  const badges = Array.isArray(value.badges)
    ? value.badges.filter((badge: any): badge is string => typeof badge === 'string' && badge.trim().length > 0)
    : [];

  return {
    ...value,
    gallery,
    badges,
    spec_overrides: value.spec_overrides && typeof value.spec_overrides === 'object' ? value.spec_overrides : {},
    is_hidden: Boolean(value.is_hidden),
    price_override_eur: toNumberOrNull(value.price_override_eur),
    promo_enabled: Boolean(value.promo_enabled),
    promo_price_eur: toNumberOrNull(value.promo_price_eur),
    stock_override: toNumberOrNull(value.stock_override),
    force_out_of_stock: Boolean(value.force_out_of_stock),
  };
}

function mapRow(row: any): RimRow {
  const cmsData = normalizeCmsData(row.cms_data);
  const specOverrides = cmsData?.spec_overrides ?? {};
  const identity = specOverrides.identity ?? {};
  const rim = specOverrides.rim ?? {};
  const finalPrice =
    cmsData?.promo_enabled && cmsData?.promo_price_eur !== null && cmsData?.promo_price_eur !== undefined
      ? cmsData.promo_price_eur
      : cmsData?.price_override_eur ?? row.final_price_eur ?? row.price ?? null;

  return {
    ...row,
    variant_id: row.variant_id,
    id: row.variant_id,
    brand: String(identity.brand ?? row.brand ?? 'Unknown').trim() || 'Unknown',
    model: String(identity.model ?? row.model ?? '').trim(),
    size_string: identity.size_string ?? row.size_string ?? null,
    ean: row.ean ?? row.derived_ean ?? null,
    derived_ean: row.derived_ean ?? row.ean ?? null,
    width_in: toNumberOrNull(rim.width_in ?? row.width_in),
    rim_diameter_in: toNumberOrNull(rim.rim_diameter_in ?? row.rim_diameter_in),
    et_offset_mm: toNumberOrNull(rim.et_offset_mm ?? row.et_offset_mm),
    bolt_pattern: rim.bolt_pattern ?? row.bolt_pattern ?? null,
    center_bore_mm: toNumberOrNull(rim.center_bore_mm ?? row.center_bore_mm ?? row.cb_mm),
    cb_mm: toNumberOrNull(rim.center_bore_mm ?? row.cb_mm ?? row.center_bore_mm),
    color: rim.color ?? row.color ?? null,
    finish: rim.finish ?? row.finish ?? null,
    material: rim.material ?? row.material ?? null,
    bolts_included:
      rim.bolts_included !== undefined ? Boolean(rim.bolts_included) : row.bolts_included ?? null,
    winter_approved:
      rim.winter_approved !== undefined ? Boolean(rim.winter_approved) : row.winter_approved ?? null,
    wheel_load_kg: toNumberOrNull(rim.wheel_load_kg ?? row.wheel_load_kg),
    final_price_eur: toNumberOrNull(finalPrice),
    price: toNumberOrNull(row.price),
    price_eur: toNumberOrNull(finalPrice),
    stock_qty: toNumberOrNull(cmsData?.stock_override ?? row.stock_qty),
    in_stock: cmsData?.force_out_of_stock ? false : row.in_stock ?? null,
    supplier_image_url: row.supplier_image_url ?? null,
    missing_supplier_price: Boolean(row.missing_supplier_price) || finalPrice === null || finalPrice === undefined,
    missing_supplier_image: Boolean(row.missing_supplier_image),
    cms_data: cmsData,
  } as RimRow;
}

async function fetchPublishedRimFallback(params: {
  search: string;
  supplierFilter: string;
  showMissingPriceOnly: boolean;
  showMissingImagesOnly: boolean;
  showMissingSeoOnly: boolean;
  showMissingSpecsOnly: boolean;
  statusFilter: string;
  pageSize: number;
  offset: number;
}) {
  let query = supabase
    .from('webshop_items')
    .select(RIMS_CMS_WEBSTORE_FALLBACK_SELECT)
    .eq('product_type', 'rim')
    .order('variant_id', { ascending: true })
    .range(params.offset, params.offset + params.pageSize - 1);

  const search = params.search.trim();
  if (search) {
    query = query.or([
      `brand.ilike.%${search}%`,
      `brand_display_name.ilike.%${search}%`,
      `model.ilike.%${search}%`,
      `size_string.ilike.%${search}%`,
      `ean.ilike.%${search}%`,
      `derived_ean.ilike.%${search}%`,
      `supplier_external_id_best.ilike.%${search}%`,
    ].join(','));
  }

  if (params.supplierFilter !== 'all') query = query.eq('supplier_code_best', params.supplierFilter);
  if (params.showMissingPriceOnly || params.statusFilter === 'missing_price') query = query.is('final_price_eur', null);
  if (params.showMissingImagesOnly || params.statusFilter === 'missing_image') query = query.is('hero_image_url', null);
  if (params.showMissingSeoOnly) query = query.or('seo_title.is.null,seo_description.is.null');
  if (params.showMissingSpecsOnly) query = query.or('width_in.is.null,rim_diameter_in.is.null,bolt_pattern.is.null,et_offset_mm.is.null,center_bore_mm.is.null');
  if (params.statusFilter === 'visible') {
    query = query.eq('is_visible', true).eq('publish_status', 'published');
  } else if (params.statusFilter === 'hidden') {
    query = query.or('is_visible.eq.false,publish_status.eq.hidden');
  } else if (params.statusFilter === 'manual_not_sellable') {
    query = query.eq('publish_block_reason', 'manual_not_sellable');
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row: any) => mapRow({
    ...row,
    supplier_image_url: row.best_image_url ?? row.hero_image_url ?? null,
    missing_supplier_price: row.final_price_eur === null && row.price === null,
    missing_supplier_image: !row.hero_image_url && !row.best_image_url,
    cms_data: null,
  }));
}

export function useRimsCmsList(pageSize = 100) {
  const initialState = (() => {
    if (typeof window === 'undefined') return null;
    try {
      return JSON.parse(window.sessionStorage.getItem(RIMS_CMS_STATE_KEY) || 'null');
    } catch {
      return null;
    }
  })();

  const [rims, setRims] = useState<RimRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialState?.searchTerm ?? '');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialState?.searchTerm ?? '');
  const [supplierFilter, setSupplierFilter] = useState(initialState?.supplierFilter ?? 'all');
  const [showMissingPriceOnly, setShowMissingPriceOnly] = useState(Boolean(initialState?.showMissingPriceOnly));
  const [showMissingImagesOnly, setShowMissingImagesOnly] = useState(Boolean(initialState?.showMissingImagesOnly));
  const [showMissingSeoOnly, setShowMissingSeoOnly] = useState(Boolean(initialState?.showMissingSeoOnly));
  const [showMissingSpecsOnly, setShowMissingSpecsOnly] = useState(Boolean(initialState?.showMissingSpecsOnly));
  const [statusFilter, setStatusFilter] = useState(initialState?.statusFilter ?? 'all');
  const [currentPage, setCurrentPage] = useState(
    Number.isInteger(initialState?.currentPage) && initialState.currentPage > 0 ? initialState.currentPage : 1,
  );
  const [totalCount, setTotalCount] = useState(0);
  const didMountRef = useRef(false);
  const cacheRef = useRef<RimsCmsCacheStore>(readRimsCmsCacheStore());
  const initialRevalidatedRef = useRef(false);
  const lastForcedFetchAtRef = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchTerm(searchTerm), 250);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    setCurrentPage(1);
  }, [
    debouncedSearchTerm,
    supplierFilter,
    showMissingPriceOnly,
    showMissingImagesOnly,
    showMissingSeoOnly,
    showMissingSpecsOnly,
    statusFilter,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(
      RIMS_CMS_STATE_KEY,
      JSON.stringify({
        searchTerm,
        supplierFilter,
        showMissingPriceOnly,
        showMissingImagesOnly,
        showMissingSeoOnly,
        showMissingSpecsOnly,
        statusFilter,
        currentPage,
      }),
    );
  }, [
    currentPage,
    searchTerm,
    supplierFilter,
    showMissingPriceOnly,
    showMissingImagesOnly,
    showMissingSeoOnly,
    showMissingSpecsOnly,
    statusFilter,
  ]);

  const queryKey = JSON.stringify({
    search: debouncedSearchTerm.trim(),
    supplierFilter,
    showMissingPriceOnly,
    showMissingImagesOnly,
    showMissingSeoOnly,
    showMissingSpecsOnly,
    statusFilter,
  });
  const cachedQuery = cacheRef.current.queries[queryKey];
  const cachedPage = cachedQuery?.pages?.[String(currentPage)] ?? null;

  useEffect(() => {
    if (!cachedPage) return;
    setRims(cachedPage);
    setTotalCount(cachedQuery?.totalCount ?? 0);
    setLoading(false);
    setRefreshing(false);
    setError(null);
  }, [cachedPage, cachedQuery?.totalCount]);

  const fetchRims = useCallback(async (options?: { force?: boolean }) => {
    const force = Boolean(options?.force);
    const now = Date.now();
    if (force) {
      const elapsed = now - lastForcedFetchAtRef.current;
      if (elapsed < 8000) {
        return;
      }
      lastForcedFetchAtRef.current = now;
    }

    if (!force && cachedPage) {
      return;
    }

    if (rims.length === 0) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const offset = (currentPage - 1) * pageSize;
      const params = {
        p_search: debouncedSearchTerm.trim() || null,
        p_supplier_code: supplierFilter !== 'all' ? supplierFilter : null,
        p_missing_price_only: showMissingPriceOnly,
        p_missing_image_only: showMissingImagesOnly,
        p_missing_seo_only: showMissingSeoOnly,
        p_missing_specs_only: showMissingSpecsOnly,
        p_status: statusFilter,
      };

      const [{ data: rows, error: rowsError }, { data: count, error: countError }] = await Promise.all([
        supabase.rpc('cms_list_rims_admin_v1', {
          ...params,
          p_limit: pageSize,
          p_offset: offset,
        }),
        supabase.rpc('cms_count_rims_admin_v1', params),
      ]);

      if (rowsError && isRecoverableFetchError(rowsError)) {
        try {
          const fallbackRows = await fetchPublishedRimFallback({
            search: debouncedSearchTerm,
            supplierFilter,
            showMissingPriceOnly,
            showMissingImagesOnly,
            showMissingSeoOnly,
            showMissingSpecsOnly,
            statusFilter,
            pageSize,
            offset,
          });
          setRims(fallbackRows);
          const fallbackTotalCount = fallbackRows.length === pageSize ? offset + fallbackRows.length + 1 : offset + fallbackRows.length;
          setTotalCount(fallbackTotalCount);
          const nextCacheStore: RimsCmsCacheStore = {
            queries: {
              ...cacheRef.current.queries,
              [queryKey]: {
                totalCount: fallbackTotalCount,
                pages: {
                  ...(cacheRef.current.queries[queryKey]?.pages ?? {}),
                  [String(currentPage)]: fallbackRows,
                },
              },
            },
          };
          cacheRef.current = nextCacheStore;
          writeRimsCmsCacheStore(nextCacheStore);
          return;
        } catch (fallbackError: any) {
          if (isRecoverableFetchError(fallbackError) && (rims.length > 0 || cachedPage)) {
            console.warn('Fetch rims CMS refresh failed, keeping current CMS page:', fallbackError);
            setError(null);
            return;
          }
          throw fallbackError;
        }
      }

      if (rowsError) throw rowsError;
      if (countError && !isStatementTimeoutError(countError)) throw countError;

      const mappedRows = (rows ?? []).map(mapRow);
      const resolvedTotalCount =
        countError && isStatementTimeoutError(countError)
          ? (mappedRows.length === pageSize ? offset + mappedRows.length + 1 : offset + mappedRows.length)
          : Number(count ?? 0);

      setRims(mappedRows);
      setTotalCount(resolvedTotalCount);
      const nextCacheStore: RimsCmsCacheStore = {
        queries: {
          ...cacheRef.current.queries,
          [queryKey]: {
            totalCount: resolvedTotalCount,
            pages: {
              ...(cacheRef.current.queries[queryKey]?.pages ?? {}),
              [String(currentPage)]: mappedRows,
            },
          },
        },
      };
      cacheRef.current = nextCacheStore;
      writeRimsCmsCacheStore(nextCacheStore);
    } catch (err: any) {
      if (isRecoverableFetchError(err) && (rims.length > 0 || cachedPage)) {
        console.warn('Fetch rims CMS refresh failed, keeping current CMS page:', err);
        setError(null);
      } else {
        console.error('Fetch rims CMS error:', err);
        setError(err.message ?? String(err));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    currentPage,
    cachedPage,
    debouncedSearchTerm,
    pageSize,
    queryKey,
    rims.length,
    showMissingImagesOnly,
    showMissingPriceOnly,
    showMissingSeoOnly,
    showMissingSpecsOnly,
    statusFilter,
    supplierFilter,
  ]);

  useEffect(() => {
    if (cachedPage && initialRevalidatedRef.current) {
      return;
    }

    if (cachedPage) {
      initialRevalidatedRef.current = true;
    }

    void fetchRims({ force: Boolean(cachedPage) });
  }, [cachedPage, fetchRims]);

  const patchLocalCmsData = useCallback((variantId: string, cmsPatch: Record<string, any> | null) => {
    setRims((prev) =>
      prev.map((rim) => {
        if (rim.variant_id !== variantId) return rim;
        if (cmsPatch === null) return { ...rim, cms_data: null };
        return mapRow({
          ...rim,
          cms_data: {
            ...(rim.cms_data ?? { variant_id: rim.variant_id }),
            ...cmsPatch,
          },
        });
      }),
    );
  }, []);

  return {
    rims,
    setRims,
    loading,
    refreshing,
    error,
    setError,
    searchTerm,
    setSearchTerm,
    supplierFilter,
    setSupplierFilter,
    showMissingPriceOnly,
    setShowMissingPriceOnly,
    showMissingImagesOnly,
    setShowMissingImagesOnly,
    showMissingSeoOnly,
    setShowMissingSeoOnly,
    showMissingSpecsOnly,
    setShowMissingSpecsOnly,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    totalCount,
    fetchRims,
    patchLocalCmsData,
  };
}
