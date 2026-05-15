import { useCallback, useEffect, useRef, useState } from 'react';

import { supabase } from '../../../utils/supabase/client';
import type { TireRow } from './types';

const TIRES_CMS_STATE_KEY = 'mitra.tires-cms.state.v3';
const TIRES_CMS_CACHE_KEY = 'mitra.tires-cms.cache.v3';
const TIRES_CMS_SYNC_KEY = 'mitra.tires-cms.sync.v1';
const CMS_COUNT_TIMEOUT_MS = 1200;
const CMS_PRELOAD_PAGE_COUNT = 3;
const CMS_PAGE_SETTLE_DELAY_MS = 1000;
const CMS_PERSISTED_QUERY_LIMIT = 3;
const CMS_PERSISTED_PAGE_LIMIT = 3;
const CMS_MAX_INDEXED_ROWS = 3000;

type TiresCmsQueryCacheEntry = {
  totalCount: number;
  pages: Record<string, TireRow[]>;
};

type TiresCmsCacheStore = {
  queries: Record<string, TiresCmsQueryCacheEntry>;
};

type MissingMetadataField =
  | 'brand'
  | 'model'
  | 'ean'
  | 'size'
  | 'season'
  | 'ev_ready'
  | 'sound_absorber'
  | 'runflat'
  | 'xl'
  | 'studded'
  | 'threepmsf'
  | 'winter_approved'
  | 'ice_approved'
  | 'eu_fuel_class'
  | 'eu_wet_grip_class'
  | 'eu_noise_db'
  | 'eu_noise_class';

type MissingSeoField =
  | 'title'
  | 'subtitle'
  | 'short_description'
  | 'long_description'
  | 'seo_slug'
  | 'seo_title'
  | 'seo_description';

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

function buildTiresCmsQueryKey(params: {
  searchTerm: string;
  showMissingEanOnly: boolean;
  hideNonPassenger: boolean;
  supplierFilter: string;
  tireSegmentFilter: string;
  missingMetadataFields: string[];
  showMissingImagesOnly: boolean;
  showWithEprelOnly: boolean;
  missingSeoFields: string[];
  pageSize: number;
}) {
  return JSON.stringify({
    q: params.searchTerm.trim().toLowerCase(),
    missing: params.showMissingEanOnly,
    hideNonPassenger: params.hideNonPassenger,
    supplier: params.supplierFilter,
    tireSegment: params.tireSegmentFilter,
    missingMetadataFields: [...params.missingMetadataFields].sort(),
    missingImages: params.showMissingImagesOnly,
    withEprel: params.showWithEprelOnly,
    missingSeoFields: [...params.missingSeoFields].sort(),
    pageSize: params.pageSize,
  });
}

function isStatementTimeoutError(error: any) {
  return error?.code === '57014' || String(error?.message ?? '').toLowerCase().includes('statement timeout');
}

function isRecoverableFetchError(error: any) {
  const message = String(error?.message ?? error ?? '').toLowerCase();
  const details = String(error?.details ?? '').toLowerCase();
  return isStatementTimeoutError(error) || message.includes('failed to fetch') || details.includes('failed to fetch');
}

function readTiresCmsCacheStore(): TiresCmsCacheStore {
  if (typeof window === 'undefined') {
    return { queries: {} };
  }

  try {
    const rawCache = window.sessionStorage.getItem(TIRES_CMS_CACHE_KEY);
    const parsedCache = rawCache ? JSON.parse(rawCache) : null;
    return parsedCache && typeof parsedCache === 'object' && parsedCache.queries && typeof parsedCache.queries === 'object'
      ? parsedCache
      : { queries: {} };
  } catch {
    return { queries: {} };
  }
}

function writeTiresCmsCacheStore(cacheStore: TiresCmsCacheStore) {
  if (typeof window === 'undefined') return;
  try {
    const compactQueries = Object.fromEntries(
      Object.entries(cacheStore.queries)
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
    window.sessionStorage.setItem(TIRES_CMS_CACHE_KEY, JSON.stringify({ queries: compactQueries }));
  } catch {
    window.sessionStorage.removeItem(TIRES_CMS_CACHE_KEY);
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

function countCachedRows(cacheStore: TiresCmsCacheStore, queryKey: string) {
  const pages = cacheStore.queries[queryKey]?.pages ?? {};
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
  cacheStore: TiresCmsCacheStore,
  queryKey: string,
  currentPage: number,
  totalPages: number,
) {
  const pages = cacheStore.queries[queryKey]?.pages ?? {};
  const startPage = getPositiveWindowStartPage(currentPage, totalPages);
  const endPage = Math.min(totalPages || startPage + CMS_PRELOAD_PAGE_COUNT - 1, startPage + CMS_PRELOAD_PAGE_COUNT - 1);
  for (let page = startPage; page <= endPage; page += 1) {
    if (!pages[String(page)]) return true;
  }
  return false;
}

function pruneIndexedPages(
  cacheStore: TiresCmsCacheStore,
  queryKey: string,
  currentPage: number,
  pageSize: number,
): TiresCmsCacheStore {
  const query = cacheStore.queries[queryKey];
  if (!query) return cacheStore;

  const maxPages = Math.max(CMS_PRELOAD_PAGE_COUNT, Math.floor(CMS_MAX_INDEXED_ROWS / pageSize));
  const pageEntries = Object.entries(query.pages);
  if (pageEntries.length <= maxPages) return cacheStore;

  const keptPages = Object.fromEntries(
    pageEntries
      .sort(([left], [right]) => Math.abs(Number(left) - currentPage) - Math.abs(Number(right) - currentPage))
      .slice(0, maxPages)
      .sort(([left], [right]) => Number(left) - Number(right)),
  );

  return {
    queries: {
      ...cacheStore.queries,
      [queryKey]: {
        ...query,
        pages: keptPages,
      },
    },
  };
}

function resolveEffectiveEan(identityEan: unknown, rowDerivedEan: unknown, rowEan: unknown) {
  const normalizedIdentityEan = String(identityEan ?? '').replace(/\D/g, '');
  const fallbackEan = String(rowDerivedEan ?? rowEan ?? '').trim();
  return normalizedIdentityEan || fallbackEan || null;
}

function getTyreLabelIdentity(specOverrides: any) {
  return specOverrides?.tyre_label_section?.identity ?? {};
}

function resolveEffectiveMandatoryIdentity(specOverrides: any, row: any) {
  const identity = specOverrides?.identity ?? {};
  const tyreLabelIdentity = getTyreLabelIdentity(specOverrides);
  const hasIdentityBrandOverride = Object.prototype.hasOwnProperty.call(identity, 'brand');
  const hasIdentityModelOverride = Object.prototype.hasOwnProperty.call(identity, 'model');
  const hasIdentitySizeOverride = Object.prototype.hasOwnProperty.call(identity, 'size_string');
  const hasIdentityEanOverride = Object.prototype.hasOwnProperty.call(identity, 'ean');
  const hasTyreLabelSupplierTrademark = Object.prototype.hasOwnProperty.call(tyreLabelIdentity, 'supplier_trademark');
  const hasTyreLabelSupplierName = Object.prototype.hasOwnProperty.call(tyreLabelIdentity, 'supplier_name');
  const hasTyreLabelCommercialName = Object.prototype.hasOwnProperty.call(tyreLabelIdentity, 'commercial_name');
  const hasTyreLabelModel = Object.prototype.hasOwnProperty.call(tyreLabelIdentity, 'model');
  const hasTyreLabelSize = Object.prototype.hasOwnProperty.call(tyreLabelIdentity, 'size_designation');
  const hasTyreLabelEan = Object.prototype.hasOwnProperty.call(tyreLabelIdentity, 'ean');

  const effectiveBrand = hasTyreLabelSupplierTrademark
    ? String(tyreLabelIdentity.supplier_trademark ?? '').trim()
    : hasTyreLabelSupplierName
      ? String(tyreLabelIdentity.supplier_name ?? '').trim()
      : hasIdentityBrandOverride
        ? String(identity.brand ?? '').trim()
        : String(row.brand ?? '').trim();

  const effectiveModel = hasTyreLabelCommercialName
    ? String(tyreLabelIdentity.commercial_name ?? '').trim()
    : hasTyreLabelModel
      ? String(tyreLabelIdentity.model ?? '').trim()
      : hasIdentityModelOverride
        ? String(identity.model ?? '').trim()
        : String(row.model ?? '').trim();

  const effectiveSize = hasTyreLabelSize
    ? String(tyreLabelIdentity.size_designation ?? '').trim()
    : hasIdentitySizeOverride
      ? String(identity.size_string ?? '').trim()
      : String(row.size_string ?? '').trim();

  const effectiveEan = resolveEffectiveEan(
    hasTyreLabelEan ? tyreLabelIdentity?.ean : hasIdentityEanOverride ? identity?.ean : undefined,
    row.derived_ean,
    row.ean,
  );

  return {
    effectiveBrand,
    effectiveModel,
    effectiveSize,
    effectiveEan,
  };
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
        supplierFilter: 'all',
        tireSegmentFilter: 'all',
        missingMetadataFields: [] as MissingMetadataField[],
        showMissingImagesOnly: false,
        showWithEprelOnly: false,
        missingSeoFields: [] as MissingSeoField[],
        currentPage: 1,
      };
    }

    try {
      const rawState = window.sessionStorage.getItem(TIRES_CMS_STATE_KEY);
      const parsedState = rawState ? JSON.parse(rawState) : null;
      const parsedCache = readTiresCmsCacheStore();
      const initialQueryKey = buildTiresCmsQueryKey({
        searchTerm: typeof parsedState?.searchTerm === 'string' ? parsedState.searchTerm : '',
        showMissingEanOnly: false,
        hideNonPassenger:
          typeof parsedState?.hideNonPassenger === 'boolean' ? parsedState.hideNonPassenger : true,
        supplierFilter: typeof parsedState?.supplierFilter === 'string' ? parsedState.supplierFilter : 'all',
        tireSegmentFilter: typeof parsedState?.tireSegmentFilter === 'string' ? parsedState.tireSegmentFilter : 'all',
        missingMetadataFields: Array.isArray(parsedState?.missingMetadataFields) ? parsedState.missingMetadataFields : [],
        showMissingImagesOnly: Boolean(parsedState?.showMissingImagesOnly),
        showWithEprelOnly: Boolean(parsedState?.showWithEprelOnly),
        missingSeoFields: Array.isArray(parsedState?.missingSeoFields) ? parsedState.missingSeoFields : [],
        pageSize,
      });
      const initialPage =
        Number.isInteger(parsedState?.currentPage) && parsedState.currentPage > 0
          ? parsedState.currentPage
          : 1;
      const cachedQuery = parsedCache.queries?.[initialQueryKey];
      const cachedPage = cachedQuery?.pages?.[String(initialPage)] ?? [];

      return {
        cacheStore: parsedCache,
        tires: Array.isArray(cachedPage) ? cachedPage : [],
        totalCount: Number.isFinite(cachedQuery?.totalCount) ? cachedQuery.totalCount : 0,
        searchTerm: typeof parsedState?.searchTerm === 'string' ? parsedState.searchTerm : '',
        showMissingEanOnly: false,
        hideNonPassenger:
          typeof parsedState?.hideNonPassenger === 'boolean' ? parsedState.hideNonPassenger : true,
        supplierFilter: typeof parsedState?.supplierFilter === 'string' ? parsedState.supplierFilter : 'all',
        tireSegmentFilter: typeof parsedState?.tireSegmentFilter === 'string' ? parsedState.tireSegmentFilter : 'all',
        missingMetadataFields: Array.isArray(parsedState?.missingMetadataFields) ? parsedState.missingMetadataFields : [],
        showMissingImagesOnly: Boolean(parsedState?.showMissingImagesOnly),
        showWithEprelOnly: Boolean(parsedState?.showWithEprelOnly),
        missingSeoFields: Array.isArray(parsedState?.missingSeoFields) ? parsedState.missingSeoFields : [],
        currentPage: initialPage,
      };
    } catch {
      return {
        cacheStore: { queries: {} } as TiresCmsCacheStore,
        tires: [] as TireRow[],
        totalCount: 0,
        searchTerm: '',
        showMissingEanOnly: false,
        hideNonPassenger: true,
        supplierFilter: 'all',
        tireSegmentFilter: 'all',
        missingMetadataFields: [] as MissingMetadataField[],
        showMissingImagesOnly: false,
        showWithEprelOnly: false,
        missingSeoFields: [] as MissingSeoField[],
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
  const [supplierFilter, setSupplierFilter] = useState(initialState.supplierFilter);
  const [tireSegmentFilter, setTireSegmentFilter] = useState(initialState.tireSegmentFilter);
  const [missingMetadataFields, setMissingMetadataFields] = useState<MissingMetadataField[]>(
    initialState.missingMetadataFields,
  );
  const [showMissingImagesOnly, setShowMissingImagesOnly] = useState(initialState.showMissingImagesOnly);
  const [showWithEprelOnly, setShowWithEprelOnly] = useState(initialState.showWithEprelOnly);
  const [missingSeoFields, setMissingSeoFields] = useState<MissingSeoField[]>(initialState.missingSeoFields);
  const [currentPage, setCurrentPage] = useState(initialState.currentPage);
  const [totalCount, setTotalCount] = useState(initialState.totalCount);
  const [hasNextPage, setHasNextPage] = useState(initialState.totalCount > initialState.currentPage * pageSize);
  const [cachedItemCount, setCachedItemCount] = useState(0);
  const [preloading, setPreloading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const didMountRef = useRef(false);
  const cacheRef = useRef<TiresCmsCacheStore>(initialState.cacheStore);
  const lastForcedFetchAtRef = useRef(0);
  const activeQueryKeyRef = useRef('');
  const preloadRunRef = useRef(0);
  const activeFetchKeyRef = useRef<string | null>(null);
  const latestPageRequestRef = useRef(0);
  const queryKey = buildTiresCmsQueryKey({
    searchTerm: debouncedSearchTerm,
    showMissingEanOnly,
    hideNonPassenger,
    supplierFilter,
    tireSegmentFilter,
    missingMetadataFields,
    showMissingImagesOnly,
    showWithEprelOnly,
    missingSeoFields,
    pageSize,
  });
  const cachedQuery = cacheRef.current.queries[queryKey];
  const cachedPage = cachedQuery?.pages?.[String(currentPage)] ?? null;

  useEffect(() => {
    activeQueryKeyRef.current = queryKey;
    setCachedItemCount(countCachedRows(cacheRef.current, queryKey));
  }, [queryKey]);

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
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    setCurrentPage(1);
  }, [
    showMissingEanOnly,
    hideNonPassenger,
    supplierFilter,
    tireSegmentFilter,
    debouncedSearchTerm,
    missingMetadataFields,
    showMissingImagesOnly,
    showWithEprelOnly,
    missingSeoFields,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(
      TIRES_CMS_STATE_KEY,
      JSON.stringify({
        searchTerm,
        showMissingEanOnly,
        hideNonPassenger,
    supplierFilter,
    tireSegmentFilter,
    missingMetadataFields,
        showMissingImagesOnly,
        showWithEprelOnly,
        missingSeoFields,
        currentPage,
      })
    );
  }, [
    currentPage,
    hideNonPassenger,
    searchTerm,
    showMissingEanOnly,
        supplierFilter,
        tireSegmentFilter,
        missingMetadataFields,
    showMissingImagesOnly,
    showWithEprelOnly,
    missingSeoFields,
  ]);

  useEffect(() => {
    if (!cachedPage) return;
    latestPageRequestRef.current += 1;
    setTires(cachedPage);
    setTotalCount(cachedQuery?.totalCount ?? 0);
    setCachedItemCount(countCachedRows(cacheRef.current, queryKey));
    setHasNextPage(currentPage * pageSize < (cachedQuery?.totalCount ?? 0));
    setLoading(false);
    setRefreshing(false);
    setError(null);
  }, [cachedPage, cachedQuery?.totalCount, currentPage, pageSize, queryKey]);

  const fetchTires = useCallback(async (options?: { force?: boolean }) => {
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
      setTires([]);
      setLoading(true);
    } else {
      setRefreshing(true);
      if (shouldShowPreloading) setPreloading(true);
    }
    setError(null);

    try {
      const trimmedSearch = debouncedSearchTerm.trim();
      const fetchLimit = pageSize * CMS_PRELOAD_PAGE_COUNT;
      const cachedTotalPages = Math.max(1, Math.ceil((cachedQuery?.totalCount ?? 0) / pageSize));
      const windowStartPage = getPositiveWindowStartPage(currentPage, cachedQuery?.totalCount ? cachedTotalPages : 0);
      const offset = (windowStartPage - 1) * pageSize;
      const mapRowsToTires = (rows: any[]) => {
        const normalizedEanCounts = new Map<string, number>();

        for (const row of rows) {
          const cmsData = row.cms_data || null;
          const identity = (cmsData?.spec_overrides as any)?.identity ?? {};
          const ean = (resolveEffectiveEan(identity?.ean, row.derived_ean, row.ean) || '').trim();
          if (!ean) continue;
          normalizedEanCounts.set(ean, (normalizedEanCounts.get(ean) ?? 0) + 1);
        }

        return rows.map((row: any) => {
          const cmsData = row.cms_data || null;
          const specOverrides = (cmsData?.spec_overrides as any) ?? {};
          const identity = specOverrides.identity ?? {};
          const tyreLabelIdentity = getTyreLabelIdentity(specOverrides);
          const identityEanDigits = String(tyreLabelIdentity?.ean ?? identity?.ean ?? '').replace(/\D/g, '');
          const {
            effectiveBrand,
            effectiveModel,
            effectiveSize,
            effectiveEan: resolvedEan,
          } = resolveEffectiveMandatoryIdentity(specOverrides, row);
          const euLabel = row.eu_label_json && typeof row.eu_label_json === 'object' ? row.eu_label_json : null;
          const eprelCode =
            extractLabelValue(euLabel, [
              'eprel_code',
              'eprel_registration_number',
              'eprel_id',
              'eprel',
              'EPRELId',
              'EprelCode',
            ]) ?? null;
          const eprelRegistrationNumber = eprelCode ? String(eprelCode).trim() : null;
          const eprelQrUrl =
            extractLabelValue(euLabel, ['eprel_qr_url', 'qr_url']) ??
            (eprelRegistrationNumber ? `https://eprel.ec.europa.eu/qr/${eprelRegistrationNumber}` : null);
          const eprelSheetUrl =
            extractLabelValue(euLabel, ['eprel_sheet_url', 'eprel_fiche_url', 'fiche_url']) ?? null;
          const eprelSourceUrl =
            extractLabelValue(euLabel, ['eprel_url', 'source_url', 'data_source_url', 'register_code']) ??
            eprelQrUrl;
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
            const keepServerDuplicateFlag =
              Boolean(row.has_ean_multi_spec_conflict) && identityEanDigits.length === 0;
            return normalized ? keepServerDuplicateFlag || (normalizedEanCounts.get(normalized) ?? 0) > 1 : false;
          })();
          const resolvedPrice = row.final_price_eur ?? row.price ?? null;
          const mandatoryFieldConflict =
            missingEan ||
            effectiveBrand.length === 0 ||
            effectiveModel.length === 0 ||
            effectiveSize.length === 0 ||
            resolvedPrice === null ||
            resolvedPrice === undefined;
          const autoNonPassenger =
            typeof row.is_non_passenger_auto === 'boolean' ? row.is_non_passenger_auto : isAutoNonPassengerTire(row);
          const manualNonPassenger = getManualNonPassengerFlag(cmsData?.spec_overrides);

          return {
            ...row,
            brand: effectiveBrand,
            model: effectiveModel,
            size_string: effectiveSize,
            derived_ean: resolvedEan,
            eu_fuel_class: euFuel,
            eu_wet_grip_class: euWet,
            eu_noise_db: euNoise,
            eu_noise_class: typeof euNoiseClass === 'string' ? euNoiseClass : null,
            eprel_code: eprelRegistrationNumber,
            eprel_registration_number: eprelRegistrationNumber,
            eprel_qr_url: eprelQrUrl ? String(eprelQrUrl) : null,
            eprel_sheet_url: eprelSheetUrl ? String(eprelSheetUrl) : null,
            eprel_source: euLabel?.source ? String(euLabel.source) : null,
            eprel_source_url: eprelSourceUrl ? String(eprelSourceUrl) : null,
            final_price_eur:
              cmsData?.promo_enabled && cmsData?.promo_price_eur !== null && cmsData?.promo_price_eur !== undefined
                ? cmsData.promo_price_eur
                : cmsData?.price_override_eur ?? row.final_price_eur ?? row.price ?? null,
            has_missing_ean: missingEan,
            has_duplicate_ean_conflict: duplicateEanConflict,
            has_mandatory_field_conflict: mandatoryFieldConflict,
            is_non_passenger_auto: autoNonPassenger,
            is_non_passenger_manual: manualNonPassenger,
            is_non_passenger: autoNonPassenger || manualNonPassenger,
            ean_conflict_open:
              (Boolean(row.ean_conflict_open) && identityEanDigits.length === 0) ||
              duplicateEanConflict ||
              mandatoryFieldConflict,
            cms_data: cmsData,
          } as TireRow;
        });
      };

      try {
        const listParams = {
          p_search: trimmedSearch || null,
          p_missing_ean_only: showMissingEanOnly,
          p_exclude_non_passenger: hideNonPassenger,
          p_supplier_code: supplierFilter !== 'all' ? supplierFilter : null,
          p_tire_segment: tireSegmentFilter !== 'all' ? tireSegmentFilter : null,
          p_missing_metadata_fields: missingMetadataFields.length > 0 ? missingMetadataFields : null,
          p_missing_image_only: showMissingImagesOnly,
          p_has_eprel_only: showWithEprelOnly,
          p_missing_seo_fields: missingSeoFields.length > 0 ? missingSeoFields : null,
          p_limit: fetchLimit,
          p_offset: offset,
        };
        const countParams = {
          p_search: trimmedSearch || null,
          p_missing_ean_only: showMissingEanOnly,
          p_exclude_non_passenger: hideNonPassenger,
          p_supplier_code: supplierFilter !== 'all' ? supplierFilter : null,
          p_tire_segment: tireSegmentFilter !== 'all' ? tireSegmentFilter : null,
          p_missing_metadata_fields: missingMetadataFields.length > 0 ? missingMetadataFields : null,
          p_missing_image_only: showMissingImagesOnly,
          p_has_eprel_only: showWithEprelOnly,
          p_missing_seo_fields: missingSeoFields.length > 0 ? missingSeoFields : null,
        };
        let { data: rpcRows, error: rpcError } = await supabase.rpc('cms_list_tires_admin_v1', listParams);

        if (rpcError) {
          if (!isStatementTimeoutError(rpcError)) {
            throw rpcError;
          }

          let fallbackQuery = supabase
            .from('webshop_items')
            .select(
              'variant_id,product_type,ean,derived_ean,supplier_code_best,supplier_external_id_best,brand,brand_display_name,model,size_string,season,tire_segment,studded,runflat,xl_reinforced,load_index,speed_rating,speed_index,ev_ready,sound_absorber,threepmsf,winter_approved,ice_approved,eu_wet,eu_noise,eu_label_json,final_price_eur,price,in_stock,hero_image_url,gallery,manufacture_year',
            )
            .eq('product_type', 'tire')
            .eq('is_visible', true)
            .eq('publish_status', 'published')
            .order('variant_id', { ascending: true })
            .range(offset, offset + fetchLimit - 1);

          if (trimmedSearch) {
            fallbackQuery = fallbackQuery.or([
              `brand.ilike.%${trimmedSearch}%`,
              `brand_display_name.ilike.%${trimmedSearch}%`,
              `model.ilike.%${trimmedSearch}%`,
              `size_string.ilike.%${trimmedSearch}%`,
              `ean.ilike.%${trimmedSearch}%`,
              `derived_ean.ilike.%${trimmedSearch}%`,
            ].join(','));
          }
          if (supplierFilter !== 'all') fallbackQuery = fallbackQuery.eq('supplier_code_best', supplierFilter);
          if (tireSegmentFilter !== 'all') fallbackQuery = fallbackQuery.eq('tire_segment', tireSegmentFilter);

          const { data: fallbackRows, error: fallbackError } = await fallbackQuery;
          if (fallbackError) throw fallbackError;
          rpcRows = fallbackRows ?? [];
        }

        let resolvedTotalCount = 0;
        const countPromise = supabase.rpc('cms_count_tires_admin_v1', countParams);
        const countResponse = await resolveWithTimeout(countPromise, CMS_COUNT_TIMEOUT_MS);
        const rpcCount = countResponse?.data;
        const rpcCountError = countResponse?.error;
        if (!countResponse) {
          countPromise.then(({ data, error: exactCountError }) => {
            if (exactCountError || activeQueryKeyRef.current !== requestQueryKey) return;
            const exactTotal = Number(data ?? 0);
            setTotalCount(exactTotal);
            setHasNextPage(requestPage * pageSize < exactTotal);
            const existingQuery = cacheRef.current.queries[requestQueryKey];
            if (!existingQuery) return;
            const nextCacheStore: TiresCmsCacheStore = {
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
            writeTiresCmsCacheStore(prunedCacheStore);
            setCachedItemCount(countCachedRows(prunedCacheStore, requestQueryKey));
          }).catch(() => undefined);
        }

        if (!countResponse) {
          resolvedTotalCount = offset + (Array.isArray(rpcRows) && rpcRows.length === fetchLimit ? rpcRows.length + 1 : (rpcRows?.length ?? 0));
        } else if (rpcCountError) {
          if (isStatementTimeoutError(rpcCountError)) {
            resolvedTotalCount = offset + (Array.isArray(rpcRows) ? rpcRows.length : 0);
          } else {
            throw rpcCountError;
          }
        } else {
          resolvedTotalCount = Number(rpcCount ?? 0);
        }
        let rows = rpcRows ?? [];

        const variantIds = (rows as any[])
          .map((row: any) => row?.variant_id)
          .filter((value: any): value is string => typeof value === 'string' && value.length > 0);

        if (variantIds.length > 0) {
          const [{ data: liveCmsRows, error: liveCmsError }, { data: selectedRows, error: selectedRowsError }] = await Promise.all([
            supabase
            .from('product_cms')
            .select(
              'variant_id,title,subtitle,short_description,long_description,hero_image_url,gallery,seo_slug,seo_title,seo_description,is_hidden,spec_overrides,price_override_eur,promo_enabled,promo_price_eur,promo_start,promo_end',
            )
              .in('variant_id', variantIds),
            supabase
              .from('catalog_selected_items')
              .select('id,manufacture_year,tire_segment')
              .in('id', variantIds),
          ]);

          if (liveCmsError) {
            throw liveCmsError;
          }

          let fallbackWebshopRows: any[] = [];
          if (selectedRowsError) {
            console.warn('Failed to enrich CMS tire DOT years from catalog_selected_items:', selectedRowsError);
            const { data: webshopRows, error: webshopRowsError } = await supabase
              .from('webshop_items')
              .select('variant_id,manufacture_year,tire_segment')
              .in('variant_id', variantIds);
            if (webshopRowsError) {
              console.warn('Failed to enrich CMS tire DOT years from webshop_items:', webshopRowsError);
            } else {
              fallbackWebshopRows = (webshopRows ?? []) as any[];
            }
          }

          const liveCmsByVariantId = new Map(
            ((liveCmsRows ?? []) as any[]).map((row) => [row.variant_id, row]),
          );
          const selectedByVariantId = new Map(
            ((selectedRows ?? []) as any[]).map((row) => [row.id, row]),
          );
          const webshopByVariantId = new Map(
            fallbackWebshopRows.map((row) => [row.variant_id, row]),
          );

          rows = (rows as any[]).map((row) => ({
            ...row,
            manufacture_year:
              selectedByVariantId.get(row.variant_id)?.manufacture_year
              ?? webshopByVariantId.get(row.variant_id)?.manufacture_year
              ?? row.manufacture_year
              ?? null,
            tire_segment:
              selectedByVariantId.get(row.variant_id)?.tire_segment
              ?? webshopByVariantId.get(row.variant_id)?.tire_segment
              ?? row.tire_segment
              ?? null,
            cms_data: liveCmsByVariantId.has(row.variant_id)
              ? liveCmsByVariantId.get(row.variant_id)
              : row.cms_data ?? null,
          }));
        }

        if (rows.length === 0) {
          if (!isCurrentRequest()) return;
          setTires([]);
          setTotalCount(resolvedTotalCount);
          setHasNextPage(false);
          const nextCacheStore: TiresCmsCacheStore = {
            queries: {
              ...cacheRef.current.queries,
              [queryKey]: {
                totalCount: resolvedTotalCount,
                pages: {
                  ...(cacheRef.current.queries[queryKey]?.pages ?? {}),
                  [String(windowStartPage)]: [],
                },
              },
            },
          };
          const prunedCacheStore = pruneIndexedPages(nextCacheStore, queryKey, currentPage, pageSize);
          cacheRef.current = prunedCacheStore;
          writeTiresCmsCacheStore(prunedCacheStore);
          setCachedItemCount(countCachedRows(prunedCacheStore, queryKey));
          return;
        }

        const mappedRows = mapRowsToTires(rows);
        const pageCache = splitRowsByPage(mappedRows, windowStartPage, pageSize);
        const currentRows = pageCache[String(requestPage)] ?? [];
        const resolvedHasNextPage = requestPage * pageSize < resolvedTotalCount;
        if (!isCurrentRequest()) return;
        setTotalCount(resolvedTotalCount);
        setHasNextPage(resolvedHasNextPage);
        setTires(currentRows);
        const nextCacheStore: TiresCmsCacheStore = {
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
        writeTiresCmsCacheStore(prunedCacheStore);
        setCachedItemCount(countCachedRows(prunedCacheStore, queryKey));

        return;
      } catch (rpcListError: any) {
        if (cachedPage && force) {
          if (!isRecoverableFetchError(rpcListError)) {
            console.warn('Background fetch tires refresh failed, keeping cached CMS page:', rpcListError);
          }
          setError(null);
          return;
        }
        throw rpcListError;
      }
    } catch (err: any) {
      if (isRecoverableFetchError(err) && cachedPage) {
        setError(null);
      } else {
        console.error('Fetch tires error:', err);
        setError(err.message);
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
    getManualNonPassengerFlag,
    hideNonPassenger,
    isAutoNonPassengerTire,
    pageSize,
    queryKey,
    showMissingEanOnly,
    supplierFilter,
    tireSegmentFilter,
    missingMetadataFields,
    showMissingImagesOnly,
    showWithEprelOnly,
    missingSeoFields,
    totalCount,
    tires.length,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      void fetchTires();
      return;
    }

    latestPageRequestRef.current += 1;
    preloadRunRef.current += 1;
    setPreloading(false);
    if (!cachedPage) {
      setTires([]);
      setLoading(true);
    }

    const timer = window.setTimeout(() => {
      void fetchTires();
    }, CMS_PAGE_SETTLE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [cachedPage, currentPage, fetchTires, queryKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleExternalSync = () => {
      cacheRef.current = { queries: {} };
      writeTiresCmsCacheStore(cacheRef.current);
      lastForcedFetchAtRef.current = 0;
      void fetchTires({ force: true });
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== TIRES_CMS_SYNC_KEY || !event.newValue) {
        return;
      }
      handleExternalSync();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void fetchTires({ force: true });
      }
    };

    const handleWindowFocus = () => {
      void fetchTires({ force: true });
    };

    window.addEventListener('storage', handleStorage);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [fetchTires]);

  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const patchLocalCmsData = useCallback((variantId: string, cmsPatch: Record<string, any> | null) => {
    setTires((previous) => {
      const nextPageRows = previous.map((tire) => {
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
        const specOverrides = (nextCmsData?.spec_overrides as any) ?? {};
        const identity = specOverrides.identity ?? {};
        const {
          effectiveBrand,
          effectiveModel,
          effectiveSize,
          effectiveEan,
        } = resolveEffectiveMandatoryIdentity(specOverrides, tire);
        const missingEan =
          !effectiveEan ||
          String(effectiveEan).trim().length === 0 ||
          String(effectiveEan).startsWith('EANMISSING_');
        const hasRequiredCmsContent =
          String(nextCmsData?.title ?? '').trim().length > 0 &&
          String(nextCmsData?.subtitle ?? '').trim().length > 0 &&
          String(nextCmsData?.short_description ?? '').trim().length > 0 &&
          String(nextCmsData?.long_description ?? '').trim().length > 0;
        const nextMandatoryFieldConflict =
          missingEan ||
          !effectiveBrand ||
          !effectiveModel ||
          !effectiveSize ||
          (effectivePrice === null || effectivePrice === undefined) ||
          !hasRequiredCmsContent;
        const nextEanConflictOpen =
          (Boolean(tire.ean_conflict_open) &&
            String(getTyreLabelIdentity(specOverrides)?.ean ?? identity?.ean ?? '').replace(/\D/g, '').length === 0) ||
          Boolean(tire.has_duplicate_ean_conflict) ||
          nextMandatoryFieldConflict;

        return {
          ...tire,
          final_price_eur: effectivePrice,
          brand: effectiveBrand,
          model: effectiveModel,
          size_string: effectiveSize,
          derived_ean: effectiveEan,
          cms_data: nextCmsData,
          is_non_passenger_manual: manualNonPassenger,
          is_non_passenger: autoNonPassenger || manualNonPassenger,
          has_missing_ean: missingEan,
          has_mandatory_field_conflict: nextMandatoryFieldConflict,
          ean_conflict_open: nextEanConflictOpen,
        };
      });

      const existingQuery = cacheRef.current.queries[queryKey];
      if (existingQuery) {
        const nextCacheStore: TiresCmsCacheStore = {
          queries: {
            ...cacheRef.current.queries,
            [queryKey]: {
              ...existingQuery,
              pages: {
                ...existingQuery.pages,
                [String(currentPage)]: nextPageRows,
              },
            },
          },
        };
        cacheRef.current = nextCacheStore;
        writeTiresCmsCacheStore(nextCacheStore);
      }

      return nextPageRows;
    });
  }, [currentPage, getManualNonPassengerFlag, queryKey]);

  const patchLocalIdentityData = useCallback((variantId: string, specOverrides: any) => {
    const identity = specOverrides?.identity ?? {};
    const tyreLabelIdentity = getTyreLabelIdentity(specOverrides);
    const identityEanDigits = String(tyreLabelIdentity?.ean ?? identity?.ean ?? '').replace(/\D/g, '');

    setTires((previous) => {
      const nextPageRows = previous.map((tire) =>
        tire.variant_id === variantId
          ? (() => {
              const {
                effectiveBrand: nextBrand,
                effectiveModel: nextModel,
                effectiveSize: nextSizeString,
                effectiveEan: resolvedEan,
              } = resolveEffectiveMandatoryIdentity(specOverrides, tire);
              const missingEan =
                !resolvedEan ||
                String(resolvedEan).trim().length === 0 ||
                String(resolvedEan).startsWith('EANMISSING_');
              const nextMandatoryFieldConflict =
                missingEan ||
                !String(nextBrand ?? '').trim() ||
                !String(nextModel ?? '').trim() ||
                !String(nextSizeString ?? '').trim() ||
                (tire.final_price_eur === null || tire.final_price_eur === undefined);

              return {
                ...tire,
                brand: nextBrand,
                model: nextModel,
                size_string: nextSizeString,
                derived_ean: resolvedEan,
                has_missing_ean: missingEan,
                has_duplicate_ean_conflict:
                  identityEanDigits.length === 0 ? tire.has_duplicate_ean_conflict : false,
                has_mandatory_field_conflict: nextMandatoryFieldConflict,
                ean_conflict_open:
                  identityEanDigits.length === 0
                    ? Boolean(tire.ean_conflict_open) || nextMandatoryFieldConflict
                    : nextMandatoryFieldConflict,
              };
            })()
          : tire,
      );

      const existingQuery = cacheRef.current.queries[queryKey];
      if (existingQuery) {
        const nextCacheStore: TiresCmsCacheStore = {
          queries: {
            ...cacheRef.current.queries,
            [queryKey]: {
              ...existingQuery,
              pages: {
                ...existingQuery.pages,
                [String(currentPage)]: nextPageRows,
              },
            },
          },
        };
        cacheRef.current = nextCacheStore;
        writeTiresCmsCacheStore(nextCacheStore);
      }

      return nextPageRows;
    });
  }, [currentPage, queryKey]);

  const invalidateCache = useCallback(() => {
    cacheRef.current = { queries: {} };
    writeTiresCmsCacheStore(cacheRef.current);
  }, []);

  return {
    currentPage,
    debouncedSearchTerm,
    endItem,
    error,
    fetchTires,
    hasNextPage,
    invalidateCache,
    patchLocalCmsData,
    patchLocalIdentityData,
    refreshing,
    searchTerm,
    setCurrentPage,
    setHideNonPassenger,
    setMissingMetadataFields,
    setMissingSeoFields,
    setSearchTerm,
    setShowMissingEanOnly,
    setShowMissingImagesOnly,
    setShowWithEprelOnly,
    setSupplierFilter,
    setTireSegmentFilter,
    hideNonPassenger,
    missingMetadataFields,
    missingSeoFields,
    showMissingEanOnly,
    showMissingImagesOnly,
    showWithEprelOnly,
    startItem,
    tireSegmentFilter,
    tires,
    totalCount,
    cachedItemCount,
    preloading,
    totalPages,
    loading,
  };
}
