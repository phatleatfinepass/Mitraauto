import { useCallback, useEffect, useRef, useState } from 'react';

import { supabase } from '../../../utils/supabase/client';
import type { RimRow } from './types';

const RIMS_CMS_STATE_KEY = 'mitra.rims-cms.state.v1';
const RIMS_CMS_CACHE_KEY = 'mitra.rims-cms.cache.v1';
const CMS_COUNT_TIMEOUT_MS = 1200;
const CMS_PRELOAD_PAGE_COUNT = 3;
const CMS_PAGE_SETTLE_DELAY_MS = 1000;
const CMS_PERSISTED_QUERY_LIMIT = 3;
const CMS_PERSISTED_PAGE_LIMIT = 3;
const CMS_MAX_INDEXED_ROWS = 2000;

type RimsCmsCacheStore = {
  queries: Record<string, {
    totalCount: number;
    pages: Record<string, RimRow[]>;
  }>;
};

async function resolveWithTimeout<T>(promise: PromiseLike<T>, timeoutMs: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const normalizedPromise = Promise.resolve(promise);
  normalizedPromise.catch(() => undefined);
  try {
    return await Promise.race([
      normalizedPromise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

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
  'is_visible',
  'product_ready',
  'readiness_reasons',
  'primary_readiness_reason',
  'publish_status',
  'publish_block_reason',
  'conflict_status',
  'conflict_reason',
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
    const compactQueries = Object.fromEntries(
      Object.entries(cache.queries)
        .slice(-CMS_PERSISTED_QUERY_LIMIT)
        .map(([queryKey, query]) => [
          queryKey,
          {
            totalCount: query.totalCount,
            pages: Object.fromEntries(
              Object.entries(query.pages)
                .sort(([left], [right]) => Number(left) - Number(right))
                .slice(0, CMS_PERSISTED_PAGE_LIMIT),
            ),
          },
        ]),
    );
    window.sessionStorage.setItem(RIMS_CMS_CACHE_KEY, JSON.stringify({ queries: compactQueries }));
  } catch {
    window.sessionStorage.removeItem(RIMS_CMS_CACHE_KEY);
  }
}

function splitRowsByPage<T>(rows: T[], currentPage: number, pageSize: number) {
  const pages: Record<string, T[]> = {};
  for (let index = 0; index < rows.length; index += pageSize) {
    const pageRows = rows.slice(index, index + pageSize);
    if (pageRows.length === 0) continue;
    pages[String(currentPage + Math.floor(index / pageSize))] = pageRows;
  }
  return pages;
}

function countCachedRows(cache: RimsCmsCacheStore, queryKey: string) {
  const pages = cache.queries[queryKey]?.pages ?? {};
  return Object.values(pages).reduce((total, rows) => total + rows.length, 0);
}

function getPositiveWindowStartPage(currentPage: number, totalPages: number) {
  if (currentPage <= 1) return 1;
  if (totalPages > 0 && currentPage >= totalPages) {
    return Math.max(1, totalPages - CMS_PRELOAD_PAGE_COUNT + 1);
  }
  return Math.max(1, currentPage - 1);
}

function hasMissingPositiveWindow(
  cache: RimsCmsCacheStore,
  queryKey: string,
  currentPage: number,
  totalPages: number,
) {
  const pages = cache.queries[queryKey]?.pages ?? {};
  const startPage = getPositiveWindowStartPage(currentPage, totalPages);
  const endPage = Math.min(totalPages || startPage + CMS_PRELOAD_PAGE_COUNT - 1, startPage + CMS_PRELOAD_PAGE_COUNT - 1);
  for (let page = startPage; page <= endPage; page += 1) {
    if (!pages[String(page)]) return true;
  }
  return false;
}

function pruneIndexedPages(
  cache: RimsCmsCacheStore,
  queryKey: string,
  currentPage: number,
  pageSize: number,
): RimsCmsCacheStore {
  const query = cache.queries[queryKey];
  if (!query) return cache;

  const maxPages = Math.max(CMS_PRELOAD_PAGE_COUNT, Math.floor(CMS_MAX_INDEXED_ROWS / pageSize));
  const pageEntries = Object.entries(query.pages);
  if (pageEntries.length <= maxPages) return cache;

  const keptPages = Object.fromEntries(
    pageEntries
      .sort(([left], [right]) => Math.abs(Number(left) - currentPage) - Math.abs(Number(right) - currentPage))
      .slice(0, maxPages)
      .sort(([left], [right]) => Number(left) - Number(right)),
  );

  return {
    queries: {
      ...cache.queries,
      [queryKey]: {
        ...query,
        pages: keptPages,
      },
    },
  };
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
  const readinessReasons = Array.isArray(row.readiness_reasons)
    ? row.readiness_reasons.filter((reason: any): reason is string => typeof reason === 'string' && reason.trim().length > 0)
    : [];
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
    is_visible: row.is_visible ?? null,
    product_ready: row.product_ready ?? null,
    readiness_reasons: readinessReasons,
    primary_readiness_reason: row.primary_readiness_reason ?? readinessReasons[0] ?? null,
    publish_status: row.publish_status ?? null,
    publish_block_reason: row.publish_block_reason ?? null,
    conflict_status: row.conflict_status ?? null,
    conflict_reason: row.conflict_reason ?? null,
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
  const [cachedItemCount, setCachedItemCount] = useState(0);
  const [preloading, setPreloading] = useState(false);
  const didMountRef = useRef(false);
  const cacheRef = useRef<RimsCmsCacheStore>(readRimsCmsCacheStore());
  const lastForcedFetchAtRef = useRef(0);
  const activeQueryKeyRef = useRef('');
  const preloadRunRef = useRef(0);
  const activeFetchKeyRef = useRef<string | null>(null);
  const latestPageRequestRef = useRef(0);

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
    activeQueryKeyRef.current = queryKey;
    setCachedItemCount(countCachedRows(cacheRef.current, queryKey));
  }, [queryKey]);

  useEffect(() => {
    if (!cachedPage) return;
    latestPageRequestRef.current += 1;
    setRims(cachedPage);
    setTotalCount(cachedQuery?.totalCount ?? 0);
    setCachedItemCount(countCachedRows(cacheRef.current, queryKey));
    setLoading(false);
    setRefreshing(false);
    setError(null);
  }, [cachedPage, cachedQuery?.totalCount, queryKey]);

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

    const cachedTotalForWindow = cachedQuery?.totalCount ?? totalCount;
    const cachedTotalPagesForWindow = Math.max(1, Math.ceil(cachedTotalForWindow / pageSize));
    if (!force && cachedPage && !hasMissingPositiveWindow(cacheRef.current, queryKey, currentPage, cachedTotalPagesForWindow)) {
      return;
    }

    const requestKey = `${queryKey}:${currentPage}:${force ? 'force' : 'normal'}`;
    if (activeFetchKeyRef.current === requestKey) {
      return;
    }
    activeFetchKeyRef.current = requestKey;
    const requestId = latestPageRequestRef.current + 1;
    latestPageRequestRef.current = requestId;
    const requestPage = currentPage;
    const requestQueryKey = queryKey;
    const isCurrentRequest = () =>
      latestPageRequestRef.current === requestId &&
      activeQueryKeyRef.current === requestQueryKey;

    const isPageLoad = !cachedPage;
    const shouldShowPreloading =
      !isPageLoad &&
      hasMissingPositiveWindow(cacheRef.current, queryKey, requestPage, cachedTotalPagesForWindow);
    if (isPageLoad) {
      preloadRunRef.current += 1;
      setRims([]);
      setLoading(true);
    } else {
      setRefreshing(true);
      if (shouldShowPreloading) setPreloading(true);
    }
    setError(null);

    try {
      const fetchLimit = pageSize * CMS_PRELOAD_PAGE_COUNT;
      const cachedTotalPages = Math.max(1, Math.ceil((cachedQuery?.totalCount ?? 0) / pageSize));
      const windowStartPage = getPositiveWindowStartPage(currentPage, cachedQuery?.totalCount ? cachedTotalPages : 0);
      const offset = (windowStartPage - 1) * pageSize;
      const params = {
        p_search: debouncedSearchTerm.trim() || null,
        p_supplier_code: supplierFilter !== 'all' ? supplierFilter : null,
        p_missing_price_only: showMissingPriceOnly,
        p_missing_image_only: showMissingImagesOnly,
        p_missing_seo_only: showMissingSeoOnly,
        p_missing_specs_only: showMissingSpecsOnly,
        p_status: statusFilter,
      };

      const countPromise = supabase.rpc('cms_count_rims_admin_v1', params);
      const [{ data: rows, error: rowsError }, countResponse] = await Promise.all([
        supabase.rpc('cms_list_rims_admin_v1', {
          ...params,
          p_limit: fetchLimit,
          p_offset: offset,
        }),
        resolveWithTimeout(countPromise, CMS_COUNT_TIMEOUT_MS),
      ]);
      const count = countResponse?.data;
      const countError = countResponse?.error;
      if (!countResponse) {
        countPromise.then(({ data, error: exactCountError }) => {
          if (exactCountError || activeQueryKeyRef.current !== requestQueryKey) return;
          const exactTotal = Number(data ?? 0);
          setTotalCount(exactTotal);
          const existingQuery = cacheRef.current.queries[requestQueryKey];
          if (!existingQuery) return;
          const nextCacheStore: RimsCmsCacheStore = {
            queries: {
              ...cacheRef.current.queries,
              [requestQueryKey]: {
                ...existingQuery,
                totalCount: exactTotal,
              },
            },
          };
          const prunedCacheStore = pruneIndexedPages(nextCacheStore, requestQueryKey, requestPage, pageSize);
          cacheRef.current = prunedCacheStore;
          writeRimsCmsCacheStore(prunedCacheStore);
          setCachedItemCount(countCachedRows(prunedCacheStore, requestQueryKey));
        }).catch(() => undefined);
      }

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
            pageSize: fetchLimit,
            offset,
          });
          const pageCache = splitRowsByPage(fallbackRows, windowStartPage, pageSize);
          const currentRows = pageCache[String(requestPage)] ?? [];
          if (!isCurrentRequest()) return;
          setRims(currentRows);
          const fallbackTotalCount = fallbackRows.length === fetchLimit ? offset + fallbackRows.length + 1 : offset + fallbackRows.length;
          setTotalCount(fallbackTotalCount);
          const nextCacheStore: RimsCmsCacheStore = {
            queries: {
              ...cacheRef.current.queries,
              [queryKey]: {
                totalCount: fallbackTotalCount,
                pages: {
                  ...(cacheRef.current.queries[queryKey]?.pages ?? {}),
                  ...pageCache,
                },
              },
            },
          };
          const prunedCacheStore = pruneIndexedPages(nextCacheStore, queryKey, requestPage, pageSize);
          cacheRef.current = prunedCacheStore;
          writeRimsCmsCacheStore(prunedCacheStore);
          setCachedItemCount(countCachedRows(prunedCacheStore, queryKey));
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
        !countResponse || (countError && isStatementTimeoutError(countError))
          ? (mappedRows.length === fetchLimit ? offset + mappedRows.length + 1 : offset + mappedRows.length)
          : Number(count ?? 0);
      const pageCache = splitRowsByPage(mappedRows, windowStartPage, pageSize);
      const currentRows = pageCache[String(requestPage)] ?? [];
      if (!isCurrentRequest()) return;

      setRims(currentRows);
      setTotalCount(resolvedTotalCount);
      const nextCacheStore: RimsCmsCacheStore = {
        queries: {
          ...cacheRef.current.queries,
          [queryKey]: {
            totalCount: resolvedTotalCount,
            pages: {
              ...(cacheRef.current.queries[queryKey]?.pages ?? {}),
              ...pageCache,
            },
          },
        },
      };
      const prunedCacheStore = pruneIndexedPages(nextCacheStore, queryKey, requestPage, pageSize);
      cacheRef.current = prunedCacheStore;
      writeRimsCmsCacheStore(prunedCacheStore);
      setCachedItemCount(countCachedRows(prunedCacheStore, queryKey));

    } catch (err: any) {
      if (isRecoverableFetchError(err) && (rims.length > 0 || cachedPage)) {
        console.warn('Fetch rims CMS refresh failed, keeping current CMS page:', err);
        setError(null);
      } else {
        console.error('Fetch rims CMS error:', err);
        setError(err.message ?? String(err));
      }
    } finally {
      if (activeFetchKeyRef.current === requestKey) {
        activeFetchKeyRef.current = null;
        if (shouldShowPreloading) setPreloading(false);
      }
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
    totalCount,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      void fetchRims();
      return;
    }

    latestPageRequestRef.current += 1;
    preloadRunRef.current += 1;
    setPreloading(false);
    if (!cachedPage) {
      setRims([]);
      setLoading(true);
    }

    const timer = window.setTimeout(() => {
      void fetchRims();
    }, CMS_PAGE_SETTLE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [cachedPage, currentPage, fetchRims, queryKey]);

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
    cachedItemCount,
    preloading,
    fetchRims,
    patchLocalCmsData,
  };
}
