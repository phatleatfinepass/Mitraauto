import React, { useCallback, useEffect, useState } from 'react';
import { useTheme } from '../../../theme/ThemeContext';
import { translateForLanguage, useLanguage } from '../../../i18n/LanguageContext';
import { supabase } from '../../../utils/supabase/client';
import { X, Save, AlertCircle, Upload, GripVertical, RotateCcw, Loader2, Wand2, ExternalLink } from 'lucide-react';
import { TiresCmsToolbar } from './TiresCmsToolbar';
import TiresImagesSection from './TiresImagesSection';
import { TiresBundlePricingSection } from './TiresBundlePricingSection';
import { TiresCmsTableSection } from './TiresCmsTableSection';
import { TiresContentSection } from './TiresContentSection';
import { TiresPricingSection } from './TiresPricingSection';
import { TiresTyreLabelSection } from './TiresTyreLabelSection';
import { TiresVisibilitySection } from './TiresVisibilitySection';
import { TiresWarningTooltip } from './TiresWarningTooltip';
import {
  TIRES_CONTENT_AI_FIELDS,
  TIRES_SEO_AI_FIELDS,
  type TiresAiCopyField,
  type TiresAiGenerationState,
} from './aiCopy';
import type { TireEanAuditResult, TireEprelIdSuggestion } from './eanAudit';
import {
  useTiresCmsEditor,
  getManualNonPassengerFlag,
  TIRES_CMS_EDITOR_STATE_KEY,
} from './useTiresCmsEditor';
import { useTiresCmsCatalogSync } from './useTiresCmsCatalogSync';
import { useTiresCmsImages } from './useTiresCmsImages';
import { useTiresCmsList } from './useTiresCmsList';
import { useTiresCmsMutations } from './useTiresCmsMutations';
import { useTiresCmsSupplierMarkup } from './useTiresCmsSupplierMarkup';
import { useTiresCmsWarnings } from './useTiresCmsWarnings';
import type { TireAdminPricingDetails, TireRow } from './types';
import { buildTyreLabelSectionData } from '../../../utils/tyreLabel';

const EU_FUEL_WET_OPTIONS = ['A', 'B', 'C', 'D', 'E'];
const EU_NOISE_CLASS_OPTIONS = ['A', 'B', 'C'];
const VAT_RATE = 0.255;
const VAT_MULTIPLIER = 1 + VAT_RATE;
const RD_SHIPPING_COST_EX_VAT = 12;
const VT_TIRE_FIXED_SHIPPING_EX_VAT = 20;

type EprelMatchRow = {
  id: string;
  gtin_queried: string;
  eprel_registration_number: string | null;
  match_status: TireEanAuditResult['match_status'];
  match_reason: string | null;
  supplier_or_trademark: string | null;
  commercial_name: string | null;
  size_designation: string | null;
  tyre_designation: string | null;
  eprel_source_url: string | null;
  eprel_fiche_url: string | null;
  fetched_at: string;
};

type EprelFieldReviewRow = {
  field_name: string;
  current_value: unknown;
  proposed_value: unknown;
  review_status: 'pending' | 'accepted' | 'rejected' | 'kept_current';
};

type EprelListVariantStatus = {
  match_status: TireEanAuditResult['match_status'];
  review_status: 'not_reviewed' | 'pending' | 'accepted' | 'rejected' | 'kept_current' | 'mixed' | 'audited';
  eprel_registration_number: string | null;
};

function toAuditString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
}

function resolvePreferredEan(overrideEan: unknown, baseEan: unknown, derivedEan: unknown) {
  const normalizedOverride = String(overrideEan ?? '').replace(/\D/g, '').trim();
  if (normalizedOverride) return normalizedOverride;

  const baseText = String(baseEan ?? '').trim();
  const normalizedBase = baseText.startsWith('EANMISSING_') ? '' : baseText.replace(/\D/g, '').trim();
  if (normalizedBase) return normalizedBase;

  return String(derivedEan ?? '').replace(/\D/g, '').trim();
}

function fromStoredAuditRows(
  match: EprelMatchRow,
  reviews: EprelFieldReviewRow[],
): TireEanAuditResult {
  const byField = new Map(reviews.map((row) => [row.field_name, row]));
  const reviewCheck = (field: string, label: string) => {
    const row = byField.get(field);
    const currentValue = toAuditString(row?.current_value);
    const auditedValue = toAuditString(row?.proposed_value);
    const status =
      !currentValue && !auditedValue
        ? 'unknown'
        : !currentValue && auditedValue
          ? 'missing_current'
          : currentValue && !auditedValue
            ? 'missing_audited'
            : currentValue === auditedValue
              ? 'match'
              : 'mismatch';
    return {
      field,
      label,
      current_value: currentValue,
      audited_value: auditedValue,
      status,
      review_status: row?.review_status ?? null,
    } as const;
  };

  const sourceUrls = [match.eprel_source_url, match.eprel_fiche_url].filter((value): value is string => Boolean(value));
  const sizeString = toAuditString(byField.get('size_string')?.proposed_value)
    ?? match.tyre_designation
    ?? match.size_designation
    ?? null;

  return {
    ean: match.gtin_queried,
    eprel_match_id: match.id,
    match_status: match.match_status ?? 'error',
    eprel_registration_number: match.eprel_registration_number,
    eprel_fiche_url: match.eprel_fiche_url,
    summary: match.match_reason || (match.match_status === 'matched'
      ? `EPREL match found${match.commercial_name ? `: ${match.commercial_name}` : ''}.`
      : `EPREL status: ${match.match_status ?? 'error'}`),
    confidence: match.match_status === 'matched' ? 'high' : match.match_status === 'multiple_matches' ? 'low' : 'medium',
    source_urls: sourceUrls,
    extracted: {
      brand: toAuditString(byField.get('brand')?.proposed_value) ?? match.supplier_or_trademark,
      model: toAuditString(byField.get('model')?.proposed_value) ?? match.commercial_name,
      size_string: sizeString,
      season: (toAuditString(byField.get('season')?.proposed_value) as any) ?? null,
      metadata: {
        ean: toAuditString(byField.get('ean')?.proposed_value) ?? match.gtin_queried ?? null,
        tyre_type_identifier: null,
        tyre_class: null,
        load_version: null,
        eprel_registration_number: match.eprel_registration_number,
        eprel_qr_url: match.eprel_registration_number ? `https://eprel.ec.europa.eu/qr/${match.eprel_registration_number}` : null,
        eprel_sheet_url: match.eprel_fiche_url,
        production_start: null,
        production_end: null,
        market_start: null,
        supplier_website: null,
        supplier_contact_name: null,
        supplier_contact_email: null,
        supplier_contact_phone: null,
        data_source: 'EPREL',
        data_source_url: match.eprel_source_url,
        last_verified_at: null,
      },
      badges: {
        runflat: byField.get('runflat')?.proposed_value as boolean | null ?? null,
        xl: byField.get('xl')?.proposed_value as boolean | null ?? null,
        studded: byField.get('studded')?.proposed_value as boolean | null ?? null,
        threepmsf: byField.get('threepmsf')?.proposed_value as boolean | null ?? null,
        winter_approved: byField.get('winter_approved')?.proposed_value as boolean | null ?? null,
        ice_approved: byField.get('ice_approved')?.proposed_value as boolean | null ?? null,
      },
      eu_label: {
        fuel_class: toAuditString(byField.get('eu_fuel')?.proposed_value),
        wet_grip_class: toAuditString(byField.get('eu_wet')?.proposed_value),
        noise_db: byField.get('eu_noise')?.proposed_value as number | null ?? null,
        noise_class: toAuditString(byField.get('eu_noise_class')?.proposed_value),
      },
    },
    checks: [
      reviewCheck('ean', 'EAN'),
      reviewCheck('brand', 'Brand'),
      reviewCheck('model', 'Model'),
      reviewCheck('size_string', 'Size'),
      reviewCheck('season', 'Season'),
      reviewCheck('runflat', 'RunFlat'),
      reviewCheck('xl', 'XL'),
      reviewCheck('studded', 'Studded'),
      reviewCheck('threepmsf', '3PMSF'),
      reviewCheck('winter_approved', 'Winter approved'),
      reviewCheck('ice_approved', 'Ice approved'),
      reviewCheck('eu_fuel', 'EU Fuel'),
      reviewCheck('eu_wet', 'EU Wet Grip'),
      reviewCheck('eu_noise', 'EU Noise'),
      reviewCheck('eu_noise_class', 'EU Noise Class'),
    ],
  };
}

const SUPPLIER_OPTIONS = [
  { code: 'RD', label: 'Rengasduo' },
  { code: 'VT', label: 'Vannetukku' },
];

function navigateToCmsTireConflicts() {
  window.history.pushState({}, '', '/cms/tires/conflicts');
  window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
}

function extractEprelRegistrationNumber(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const raw = String(value ?? '').trim();
    if (!raw) continue;

    const direct = raw.match(/^\d+$/);
    if (direct) return direct[0];

    const patterns = [
      /\/qr\/(\d+)/i,
      /\/screen\/product\/tyres\/(\d+)/i,
      /\/products\/tyres\/(\d+)/i,
      /Fiche_(\d+)_/i,
      /registration(?:Number)?[=/:](\d+)/i,
    ];

    for (const pattern of patterns) {
      const match = raw.match(pattern);
      if (match?.[1]) return match[1];
    }
  }

  return null;
}

function TireEprelDrawerSection({
  auditResult,
  eprelListStatus,
  isDark,
  selectedTire,
}: {
  auditResult: TireEanAuditResult | null;
  eprelListStatus?: EprelListVariantStatus;
  isDark: boolean;
  selectedTire: TireRow;
}) {
  const { t } = useLanguage();
  const catalogRegistrationNumber = extractEprelRegistrationNumber(
    selectedTire.eprel_registration_number,
    selectedTire.eprel_code,
    selectedTire.eprel_qr_url,
    selectedTire.eprel_source_url,
  );
  const catalogQrUrl = selectedTire.eprel_qr_url
    ?? (catalogRegistrationNumber ? `https://eprel.ec.europa.eu/qr/${catalogRegistrationNumber}` : null);
  const latestRegistrationNumber = auditResult?.eprel_registration_number
    ?? auditResult?.extracted?.metadata?.eprel_registration_number
    ?? eprelListStatus?.eprel_registration_number
    ?? null;
  const latestFicheUrl = auditResult?.eprel_fiche_url ?? auditResult?.extracted?.metadata?.eprel_sheet_url ?? null;
  const latestSourceUrl = auditResult?.source_urls?.[0] ?? auditResult?.extracted?.metadata?.data_source_url ?? null;
  const latestReviewStatus = eprelListStatus?.review_status ?? 'not_reviewed';
  const chipClass = isDark
    ? 'border-white/10 bg-white/5 text-gray-200'
    : 'border-gray-200 bg-gray-50 text-gray-700';
  const linkClass = isDark ? 'text-blue-300 hover:text-blue-200' : 'text-blue-700 hover:text-blue-900';

  const Field = ({ label, value }: { label: string; value?: React.ReactNode }) => (
    <div>
      <div className={`text-[11px] uppercase tracking-[0.16em] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{label}</div>
      <div className={`mt-1 text-sm font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{value || '—'}</div>
    </div>
  );

  const LinkValue = ({ href, label }: { href?: string | null; label: string }) => (
    href ? (
      <a href={href} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1 ${linkClass}`}>
        {label}
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    ) : '—'
  );

  return (
    <section className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-[#11151D]' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className={`text-sm font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {t('tiresCmsPage.eprelItems')}
          </h3>
          <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {selectedTire.brand} {selectedTire.model}
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${chipClass}`}>
          {latestReviewStatus.replace('_', ' ')}
        </span>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className={`rounded-lg border p-4 ${isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-white'}`}>
          <div className={`mb-4 text-xs font-semibold uppercase tracking-[0.16em] ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>
            {t('tiresCmsPage.catalogItem')}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="EPREL ID" value={catalogRegistrationNumber} />
            <Field label="Source" value={selectedTire.eprel_source || '—'} />
            <Field label="QR" value={<LinkValue href={catalogQrUrl} label={catalogRegistrationNumber ? `QR ${catalogRegistrationNumber}` : t('tiresCmsPage.open')} />} />
            <Field label="Fiche" value={<LinkValue href={selectedTire.eprel_sheet_url} label={t('tiresCmsPage.openFiche')} />} />
          </div>
        </div>

        <div className={`rounded-lg border p-4 ${isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-white'}`}>
          <div className={`mb-4 text-xs font-semibold uppercase tracking-[0.16em] ${isDark ? 'text-emerald-200' : 'text-emerald-700'}`}>
            {t('tiresCmsPage.latestEprelFetch')}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="EPREL ID" value={latestRegistrationNumber} />
            <Field label="Status" value={auditResult?.match_status ?? eprelListStatus?.match_status ?? '—'} />
            <Field label="Brand" value={auditResult?.extracted?.brand} />
            <Field label="Model" value={auditResult?.extracted?.model} />
            <Field label="Size" value={auditResult?.extracted?.size_string} />
            <Field label="EAN" value={auditResult?.extracted?.metadata?.ean ?? auditResult?.ean} />
            <Field label="Source" value={auditResult?.extracted?.metadata?.data_source} />
            <Field label="Links" value={<LinkValue href={latestFicheUrl ?? latestSourceUrl} label={latestFicheUrl ? t('tiresCmsPage.openFiche') : t('tiresCmsPage.openSource')} />} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function TiresCMSPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const isDark = theme === 'dark';
  const [bulkMarkupAmount, setBulkMarkupAmount] = useState('20');
  const [bulkMarkupPercent, setBulkMarkupPercent] = useState('');
  const [bulkMarkupSupplier, setBulkMarkupSupplier] = useState('');
  const [bulkMarkupMatchCount, setBulkMarkupMatchCount] = useState<number | null>(null);
  const [loadingBulkMarkupCount, setLoadingBulkMarkupCount] = useState(false);
  const [applyingBulkMarkup, setApplyingBulkMarkup] = useState(false);
  const [revertingBulkMarkup, setRevertingBulkMarkup] = useState(false);
  const [bulkMarkupProgress, setBulkMarkupProgress] = useState<{
    mode: 'apply' | 'revert';
    processed: number;
    total: number;
  } | null>(null);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [supplierDraft, setSupplierDraft] = useState('all');
  const [tireSegmentDraft, setTireSegmentDraft] = useState('all');
  const [showNonPassengerDraft, setShowNonPassengerDraft] = useState(false);
  const [missingMetadataFieldsDraft, setMissingMetadataFieldsDraft] = useState<string[]>([]);
  const [showMissingImagesOnlyDraft, setShowMissingImagesOnlyDraft] = useState(false);
  const [showWithEprelOnlyDraft, setShowWithEprelOnlyDraft] = useState(false);
  const [missingSeoFieldsDraft, setMissingSeoFieldsDraft] = useState<string[]>([]);
  const [pricingDetails, setPricingDetails] = useState<TireAdminPricingDetails | null>(null);
  const [aiGeneratingField, setAiGeneratingField] = useState<TiresAiGenerationState | null>(null);
  const [aiGenerationError, setAiGenerationError] = useState<string | null>(null);
  const [aiGenerationErrorField, setAiGenerationErrorField] = useState<TiresAiCopyField | null>(null);
  const [eanAuditLoading, setEanAuditLoading] = useState(false);
  const [eanAuditError, setEanAuditError] = useState<string | null>(null);
  const [eanAuditResult, setEanAuditResult] = useState<TireEanAuditResult | null>(null);
  const [aiGenerationProgress, setAiGenerationProgress] = useState<{ current: number; total: number; label: string } | null>(null);
  const [eanAuditProgress, setEanAuditProgress] = useState<number | null>(null);
  const [eanReviewLoading, setEanReviewLoading] = useState(false);
  const [eprelSuggestionLoading, setEprelSuggestionLoading] = useState(false);
  const [eprelSuggestionError, setEprelSuggestionError] = useState<string | null>(null);
  const [eprelSuggestionResult, setEprelSuggestionResult] = useState<TireEprelIdSuggestion | null>(null);
  const [eprelListStatuses, setEprelListStatuses] = useState<Record<string, EprelListVariantStatus>>({});
  const [, setEprelListLoading] = useState(false);
  const [pendingConflictCount, setPendingConflictCount] = useState(0);

  const {
    currentPage,
    cachedItemCount,
    endItem,
    error,
    fetchTires,
    invalidateCache,
    loading,
    patchLocalCmsData,
    patchLocalIdentityData,
    preloading,
    searchTerm,
    setCurrentPage,
    setHideNonPassenger,
    setMissingMetadataFields,
    setMissingSeoFields,
    setSearchTerm,
    setShowMissingImagesOnly,
    setShowWithEprelOnly,
    setSupplierFilter,
    setTireSegmentFilter,
    hideNonPassenger,
    missingMetadataFields,
    missingSeoFields,
    showMissingImagesOnly,
    showWithEprelOnly,
    startItem,
    supplierFilter,
    tireSegmentFilter,
    tires,
    totalCount,
    totalPages,
  } = useTiresCmsList(25);

  const loadPendingConflictCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('catalog_selected_tire_conflict_queue')
        .select('selected_item_id', { count: 'exact', head: true })
        .eq('review_status', 'pending');
      if (error) throw error;
      setPendingConflictCount(count ?? 0);
    } catch (error) {
      console.error('Load pending tire conflict count failed:', error);
      setPendingConflictCount(0);
    }
  }, []);

  useEffect(() => {
    void loadPendingConflictCount();

    const handleFocus = () => {
      void loadPendingConflictCount();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadPendingConflictCount]);

  const loadEprelListStatuses = useCallback(async (rows: TireRow[]) => {
    const variantIds = Array.from(new Set(rows.map((row) => row.variant_id).filter(Boolean)));
    if (variantIds.length === 0) {
      setEprelListStatuses({});
      return;
    }

    setEprelListLoading(true);
    try {
      const { data: matchRows, error: matchesError } = await supabase
        .from('cms_tire_eprel_matches')
        .select('id, variant_id, eprel_registration_number, match_status, fetched_at')
        .in('variant_id', variantIds)
        .order('fetched_at', { ascending: false });

      if (matchesError) throw matchesError;

      const latestByVariant = new Map<string, {
        id: string;
        variant_id: string;
        eprel_registration_number: string | null;
        match_status: TireEanAuditResult['match_status'];
      }>();

      for (const row of matchRows ?? []) {
        if (!latestByVariant.has(row.variant_id)) {
          latestByVariant.set(row.variant_id, {
            id: row.id,
            variant_id: row.variant_id,
            eprel_registration_number: row.eprel_registration_number ?? null,
            match_status: row.match_status ?? 'error',
          });
        }
      }

      const latestMatchIds = Array.from(latestByVariant.values()).map((row) => row.id);
      const reviewStatusByMatchId = new Map<string, EprelListVariantStatus['review_status']>();

      if (latestMatchIds.length > 0) {
        const { data: reviewRows, error: reviewsError } = await supabase
          .from('cms_tire_eprel_field_reviews')
          .select('eprel_match_id, review_status')
          .in('eprel_match_id', latestMatchIds);

        if (reviewsError) throw reviewsError;

        const grouped = new Map<string, Set<'pending' | 'accepted' | 'rejected' | 'kept_current'>>();
        for (const row of reviewRows ?? []) {
          const current = grouped.get(row.eprel_match_id) ?? new Set<'pending' | 'accepted' | 'rejected' | 'kept_current'>();
          current.add(row.review_status);
          grouped.set(row.eprel_match_id, current);
        }

        for (const matchId of latestMatchIds) {
          const statuses = grouped.get(matchId);
          if (!statuses || statuses.size === 0) {
            reviewStatusByMatchId.set(matchId, 'not_reviewed');
            continue;
          }
          if (statuses.has('pending')) {
            reviewStatusByMatchId.set(matchId, 'pending');
            continue;
          }
          if (statuses.size === 1) {
            if (statuses.has('accepted')) reviewStatusByMatchId.set(matchId, 'accepted');
            else if (statuses.has('rejected')) reviewStatusByMatchId.set(matchId, 'rejected');
            else if (statuses.has('kept_current')) reviewStatusByMatchId.set(matchId, 'kept_current');
            else reviewStatusByMatchId.set(matchId, 'not_reviewed');
            continue;
          }
          reviewStatusByMatchId.set(matchId, 'audited');
        }
      }

      const nextStatuses: Record<string, EprelListVariantStatus> = {};
      for (const row of rows) {
        const latest = latestByVariant.get(row.variant_id);
        if (!latest) continue;
        nextStatuses[row.variant_id] = {
          match_status: latest.match_status ?? 'error',
          review_status: reviewStatusByMatchId.get(latest.id) ?? 'not_reviewed',
          eprel_registration_number: latest.eprel_registration_number,
        };
      }

      setEprelListStatuses(nextStatuses);
    } catch (error) {
      console.error('Load EPREL list statuses failed:', error);
      setEprelListStatuses({});
    } finally {
      setEprelListLoading(false);
    }
  }, []);

  useEffect(() => {
    setSupplierDraft(supplierFilter);
    setTireSegmentDraft(tireSegmentFilter);
    setShowNonPassengerDraft(!hideNonPassenger);
    setMissingMetadataFieldsDraft(missingMetadataFields);
    setShowMissingImagesOnlyDraft(showMissingImagesOnly);
    setShowWithEprelOnlyDraft(showWithEprelOnly);
    setMissingSeoFieldsDraft(missingSeoFields);
  }, [
    supplierFilter,
    tireSegmentFilter,
    hideNonPassenger,
    missingMetadataFields,
    showMissingImagesOnly,
    showWithEprelOnly,
    missingSeoFields,
  ]);

  const {
    catalogSyncMessage,
    catalogSyncProgress,
    handleApplyCatalogSync,
    hasPendingCatalogSync,
    setCatalogSyncMessage,
    setHasPendingCatalogSync,
    syncingCatalog,
  } = useTiresCmsCatalogSync({
    fetchTires,
    invalidateCache,
  });

  useEffect(() => {
    if (!settingsDrawerOpen) return;
    if (!bulkMarkupSupplier) {
      setBulkMarkupMatchCount(null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoadingBulkMarkupCount(true);
      try {
        const { data, error } = await supabase.rpc('cms_count_tires_admin_v1', {
          p_search: searchTerm.trim() || null,
          p_missing_ean_only: false,
          p_exclude_non_passenger: hideNonPassenger,
          p_supplier_code: bulkMarkupSupplier,
          p_tire_segment: tireSegmentFilter !== 'all' ? tireSegmentFilter : null,
          p_missing_metadata_fields: missingMetadataFields.length > 0 ? missingMetadataFields : null,
          p_missing_image_only: showMissingImagesOnly,
          p_has_eprel_only: showWithEprelOnly,
          p_missing_seo_fields: missingSeoFields.length > 0 ? missingSeoFields : null,
        });
        if (error) throw error;
        if (!cancelled) {
          setBulkMarkupMatchCount(Number(data ?? 0));
        }
      } catch (error) {
        console.error('Bulk markup count error:', error);
        if (!cancelled) {
          setBulkMarkupMatchCount(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingBulkMarkupCount(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    bulkMarkupSupplier,
    hideNonPassenger,
    missingMetadataFields,
    missingSeoFields,
    searchTerm,
    settingsDrawerOpen,
    showMissingImagesOnly,
    showWithEprelOnly,
    tireSegmentFilter,
  ]);

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

  const hasMissingSupplierPrice = (tire: TireRow | null) =>
    !tire || tire.final_price_eur === null || tire.final_price_eur === undefined;

  const mustHideFromStore = (tire: TireRow | null) =>
    hasMissingSupplierPrice(tire) || Boolean(tire?.is_non_passenger);

  const {
    clearBundlePricing,
    clearEUOverrides,
    clearFeatureOverrides,
    clearIdentityOverrides,
    closeEditor,
    draggedIndex,
    drawerOpen,
    editData,
    getBundlePricing,
    getEUOverride,
    getEffectiveFeatureValue,
    getEffectiveIdentity,
    getIdentityOverride,
    handleDragEnd,
    handleDragOver,
    handleDragStart,
    handleImageReorder,
    hasEUOverride,
    openEditor,
    restoreEditor,
    selectedTire,
    setBundleTier,
    setEditData,
    setEUField,
    setFeatureField,
    setIdentityField,
    setSizeParts,
    setSupplierMarkupAmount,
    setSupplierMarkupPercent,
    setSupplierMarkupSupplier,
    sizeParts,
    supplierMarkupAmount,
    supplierMarkupPercent,
    supplierMarkupSupplier,
    updateSizePart,
  } = useTiresCmsEditor({ mustHideFromStore });

  useEffect(() => {
    if (typeof window === 'undefined' || drawerOpen) {
      return;
    }

    const rawState = window.sessionStorage.getItem(TIRES_CMS_EDITOR_STATE_KEY);
    if (!rawState) {
      return;
    }

    try {
      const parsedState = JSON.parse(rawState) as {
        selectedTire?: TireRow;
        editData?: Partial<any>;
        sizeParts?: {
          width?: string;
          aspect?: string;
          rim?: string;
          load_index?: string;
          speed_rating?: string;
        };
        supplierMarkupSupplier?: string;
        supplierMarkupAmount?: string;
        supplierMarkupPercent?: string;
      };

      if (!parsedState?.selectedTire?.variant_id) {
        window.sessionStorage.removeItem(TIRES_CMS_EDITOR_STATE_KEY);
        return;
      }

      const matchedTire =
        tires.find((tire) => tire.variant_id === parsedState.selectedTire?.variant_id) ??
        parsedState.selectedTire;

      restoreEditor(matchedTire, {
        selectedTire: matchedTire,
        editData: parsedState.editData ?? {},
        sizeParts: {
          width: parsedState.sizeParts?.width ?? '',
          aspect: parsedState.sizeParts?.aspect ?? '',
          rim: parsedState.sizeParts?.rim ?? '',
          load_index: parsedState.sizeParts?.load_index ?? '',
          speed_rating: parsedState.sizeParts?.speed_rating ?? '',
        },
        supplierMarkupSupplier: parsedState.supplierMarkupSupplier ?? 'RD',
        supplierMarkupAmount: parsedState.supplierMarkupAmount ?? '',
        supplierMarkupPercent: parsedState.supplierMarkupPercent ?? '',
      });
    } catch (error) {
      console.error('Restore tire editor state error:', error);
      window.sessionStorage.removeItem(TIRES_CMS_EDITOR_STATE_KEY);
    }
  }, [drawerOpen, restoreEditor, tires]);

  useEffect(() => {
    if (!selectedTire?.variant_id) {
      setPricingDetails(null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const { data, error } = await supabase.rpc('cms_get_tire_admin_pricing_v1', {
          p_variant_id: selectedTire.variant_id,
        });

        if (error) throw error;

        const row = Array.isArray(data) ? data[0] : data;
        if (!cancelled) {
          setPricingDetails((row as TireAdminPricingDetails | null) ?? null);
        }
      } catch (error) {
        console.error('Fetch tire pricing details error:', error);
        if (!cancelled) {
          setPricingDetails(null);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [selectedTire?.variant_id]);

  const {
    clearImageFeedback,
    handleClipboardImagePaste,
    handleImageUpload,
    handleRemoveImage,
    uploadError,
    uploadingImages,
  } = useTiresCmsImages({
    editData,
    selectedTire,
    setEditData,
  });

  useEffect(() => {
    if (!drawerOpen || !selectedTire) {
      return;
    }

    const handlePaste = (event: ClipboardEvent) => {
      if (!event.clipboardData) {
        return;
      }

      const containsClipboardImage = Array.from(event.clipboardData.items).some(
        (item) => item.kind === 'file' && item.type.startsWith('image/'),
      );

      if (!containsClipboardImage) {
        return;
      }

      event.preventDefault();
      void handleClipboardImagePaste(event.clipboardData);
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [drawerOpen, handleClipboardImagePaste, selectedTire]);

  const {
    handleResetCms,
    handleSave,
    handleToggleVisibility,
    saveError,
    saving,
    setSaveError,
  } = useTiresCmsMutations({
    editData,
    eprelMatchId: eanAuditResult?.eprel_match_id ?? null,
    fetchTires,
    invalidateCache,
    hasMissingSupplierPrice,
    onCloseEditor: closeEditor,
    patchLocalCmsData,
    patchLocalIdentityData,
    selectedTire,
    setCatalogSyncMessage,
    setHasPendingCatalogSync,
  });

  const { getWarningTooltip, hideWarningTooltip, showWarningTooltip, warningTooltip } =
    useTiresCmsWarnings();

  const handleImageDragOver = (event: React.DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
    handleDragOver(index);
  };

  const loadPersistedEprelReview = React.useCallback(async (variantId?: string | null) => {
    if (!variantId) {
      setEanAuditResult(null);
      return;
    }

    setEanReviewLoading(true);
    try {
      const { data: matchData, error: matchError } = await supabase
        .from('cms_tire_eprel_matches')
        .select('id, gtin_queried, eprel_registration_number, match_status, match_reason, supplier_or_trademark, commercial_name, size_designation, tyre_designation, eprel_source_url, eprel_fiche_url, fetched_at')
        .eq('variant_id', variantId)
        .order('fetched_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (matchError) throw matchError;

      if (!matchData?.id) {
        setEanAuditResult(null);
        return;
      }

      const { data: reviewRows, error: reviewsError } = await supabase
        .from('cms_tire_eprel_field_reviews')
        .select('field_name, current_value, proposed_value, review_status')
        .eq('eprel_match_id', matchData.id)
        .order('created_at', { ascending: true });

      if (reviewsError) throw reviewsError;

      setEanAuditResult(fromStoredAuditRows(matchData as EprelMatchRow, (reviewRows ?? []) as EprelFieldReviewRow[]));
    } catch (error) {
      console.error('Load persisted EPREL review error:', error);
    } finally {
      setEanReviewLoading(false);
    }
  }, []);

  const handleEdit = (tire: TireRow) => {
    openEditor(tire);
    clearImageFeedback();
  };

  const handleCloseDrawer = () => {
    closeEditor();
    setSaveError(null);
    setAiGenerationError(null);
    setAiGenerationErrorField(null);
    setAiGeneratingField(null);
    setEanAuditLoading(false);
    setEanAuditError(null);
    setEanAuditResult(null);
    setEprelSuggestionLoading(false);
    setEprelSuggestionError(null);
    setEprelSuggestionResult(null);
    clearImageFeedback();
  };

  useEffect(() => {
    if (!drawerOpen || !selectedTire?.variant_id) {
      return;
    }

    void loadPersistedEprelReview(selectedTire.variant_id);
  }, [drawerOpen, selectedTire?.variant_id, loadPersistedEprelReview]);

  const generateAiFieldValue = async (field: TiresAiCopyField, targetLanguage: 'fi' | 'en' = 'fi') => {
    if (!selectedTire) {
      throw new Error(t('tiresCmsPage.noTireSelected'));
    }

    const effectiveIdentity = getEffectiveIdentity(selectedTire);
    const { data, error } = await supabase.functions.invoke('generate_tire_cms_copy', {
      body: {
        field,
        language: targetLanguage,
        tire: {
          variant_id: selectedTire.variant_id,
          brand: effectiveIdentity.brand,
          model: effectiveIdentity.model,
          size_string: effectiveIdentity.size_string,
          season: selectedTire.season,
          supplier_code_best: selectedTire.supplier_code_best,
          studded: selectedTire.studded,
          runflat: selectedTire.runflat,
          xl_reinforced: selectedTire.xl_reinforced,
          ev_ready: selectedTire.ev_ready,
          sound_absorber: selectedTire.sound_absorber,
          threepmsf: selectedTire.threepmsf,
          winter_approved: selectedTire.winter_approved,
          ice_approved: selectedTire.ice_approved,
          eu_fuel: selectedTire.eu_fuel_class ?? selectedTire.eu_fuel ?? null,
          eu_wet: selectedTire.eu_wet_grip_class ?? selectedTire.eu_wet ?? null,
          eu_noise: selectedTire.eu_noise_db ?? selectedTire.eu_noise ?? null,
        },
        cms: {
          title: editData.title ?? null,
          subtitle: editData.subtitle ?? null,
          short_description: editData.short_description ?? null,
          long_description: editData.long_description ?? null,
          seo_slug: editData.seo_slug ?? null,
          seo_title: editData.seo_title ?? null,
          seo_description: editData.seo_description ?? null,
        },
      },
    });

    if (error) {
      throw error;
    }

    const value = String((data as { value?: string } | null)?.value ?? '').trim();
    if (!value) {
      throw new Error(translateForLanguage(targetLanguage, 'tiresCmsPage.aiNoContent'));
    }

    return value;
  };

  const generateAllAiValues = async (targetLanguage: 'fi' | 'en') => {
    if (!selectedTire) {
      throw new Error(t('tiresCmsPage.noTireSelected'));
    }

    const effectiveIdentity = getEffectiveIdentity(selectedTire);
    const { data, error } = await supabase.functions.invoke('generate_tire_cms_copy', {
      body: {
        field: 'all_fields',
        language: targetLanguage,
        tire: {
          variant_id: selectedTire.variant_id,
          brand: effectiveIdentity.brand,
          model: effectiveIdentity.model,
          size_string: effectiveIdentity.size_string,
          season: selectedTire.season,
          supplier_code_best: selectedTire.supplier_code_best,
          studded: selectedTire.studded,
          runflat: selectedTire.runflat,
          xl_reinforced: selectedTire.xl_reinforced,
          ev_ready: selectedTire.ev_ready,
          sound_absorber: selectedTire.sound_absorber,
          threepmsf: selectedTire.threepmsf,
          winter_approved: selectedTire.winter_approved,
          ice_approved: selectedTire.ice_approved,
          eu_fuel: selectedTire.eu_fuel_class ?? selectedTire.eu_fuel ?? null,
          eu_wet: selectedTire.eu_wet_grip_class ?? selectedTire.eu_wet ?? null,
          eu_noise: selectedTire.eu_noise_db ?? selectedTire.eu_noise ?? null,
        },
        cms: {
          title: editData.title ?? null,
          subtitle: editData.subtitle ?? null,
          short_description: editData.short_description ?? null,
          long_description: editData.long_description ?? null,
          seo_slug: editData.seo_slug ?? null,
          seo_title: editData.seo_title ?? null,
          seo_description: editData.seo_description ?? null,
        },
      },
    });

    if (error) {
      throw error;
    }

    const values = (data as { values?: Partial<Record<TiresAiCopyField, string>> } | null)?.values;
    if (!values) {
      throw new Error(translateForLanguage(targetLanguage, 'tiresCmsPage.aiNoContent'));
    }

    return values;
  };

  const handleAiGenerationFailure = async (error: any, field: TiresAiCopyField | null = null) => {
      console.error('AI tire copy generation failed:', error);
      let detailedMessage: string | null = null;

      const responseContext = error?.context;
      if (responseContext && typeof responseContext.clone === 'function') {
        try {
          const body = await responseContext.clone().json();
          detailedMessage = body?.error ?? body?.message ?? null;
        } catch {
          try {
            detailedMessage = await responseContext.clone().text();
          } catch {
            detailedMessage = null;
          }
        }
      }

      setAiGenerationError(
        detailedMessage ||
          error?.message ||
          t('tiresCmsPage.aiContentFailed')
      );
      setAiGenerationErrorField(field);
  };

  const handleGenerateAiField = async (field: TiresAiCopyField) => {
    if (!selectedTire) {
      return;
    }

    setAiGeneratingField(field);
    setAiGenerationError(null);
    setAiGenerationErrorField(null);

    try {
      const value = await generateAiFieldValue(field);
      setEditData((prev) => ({
        ...prev,
        [field]: value,
      }));
      setAiGenerationErrorField(null);
    } catch (error: any) {
      await handleAiGenerationFailure(error, field);
    } finally {
      setAiGeneratingField(null);
    }
  };

  const handleGenerateAllAiFields = async () => {
    if (!selectedTire) {
      return;
    }

    setAiGeneratingField('all_fields');
    setAiGenerationError(null);
    setAiGenerationErrorField(null);
    setAiGenerationProgress({ current: 0, total: 4, label: t('tiresCmsPage.preparingData') });

    try {
      setAiGenerationProgress({ current: 0.35, total: 4, label: t('tiresCmsPage.generatingFinnishContent') });
      const fiValues = await generateAllAiValues('fi');
      setAiGenerationProgress({ current: 2, total: 4, label: t('tiresCmsPage.finnishContentReady') });

      setAiGenerationProgress({ current: 2.35, total: 4, label: t('tiresCmsPage.generatingEnglishContent') });
      const enValues = await generateAllAiValues('en');
      setAiGenerationProgress({ current: 4, total: 4, label: t('tiresCmsPage.done') });

      setEditData((prev) => ({
        ...prev,
        ...fiValues,
        spec_overrides: {
          ...(prev.spec_overrides || {}),
          i18n: {
            ...((prev.spec_overrides as any)?.i18n || {}),
            en: {
              ...(((prev.spec_overrides as any)?.i18n || {}).en || {}),
              ...enValues,
            },
          },
        },
      }));
    } catch (error: any) {
      await handleAiGenerationFailure(error, null);
    } finally {
      setAiGeneratingField(null);
      setAiGenerationProgress(null);
    }
  };

  const runEprelAudit = async (options?: {
    manualRegistrationNumber?: string;
    useFallbackSearch?: boolean;
  }) => {
    if (!selectedTire) {
      return;
    }

    const effectiveIdentity = getEffectiveIdentity(selectedTire);
    const effectiveEan = resolvePreferredEan(
      getIdentityOverride()?.ean,
      selectedTire.ean,
      selectedTire.derived_ean,
    );

    const supplierEprelRegistrationNumber = extractEprelRegistrationNumber(
      options?.manualRegistrationNumber,
      selectedTire.eprel_registration_number,
      selectedTire.eprel_code,
      selectedTire.eprel_qr_url,
      selectedTire.eprel_source_url,
    );

    if (!supplierEprelRegistrationNumber && !effectiveEan) {
      setEanAuditError(
        t('tiresCmsPage.eanAuditMissingInput')
      );
      setEanAuditResult(null);
      return;
    }

    setEanAuditLoading(true);
    setEanAuditError(null);
    setEanAuditProgress(8);

    try {
      const { data, error } = await supabase.functions.invoke('audit_tire_by_ean', {
        body: {
          variant_id: selectedTire.variant_id,
          ean: effectiveEan ?? null,
          manual_eprel_registration_number: supplierEprelRegistrationNumber,
          use_fallback_search: options?.useFallbackSearch === true,
          language,
          current: {
            ean: effectiveEan ?? null,
            brand: effectiveIdentity.brand,
            model: effectiveIdentity.model,
            size_string: effectiveIdentity.size_string,
            season: getIdentityOverride()?.season ?? selectedTire.season ?? null,
            runflat: getEffectiveFeatureValue('runflat'),
            xl: getEffectiveFeatureValue('xl'),
            studded: getEffectiveFeatureValue('studded'),
            threepmsf: getEffectiveFeatureValue('threepmsf'),
            winter_approved: getEffectiveFeatureValue('winter_approved'),
            ice_approved: getEffectiveFeatureValue('ice_approved'),
            eu_fuel: getEUOverride()?.fuel_class ?? selectedTire.eu_fuel_class ?? selectedTire.eu_fuel ?? null,
            eu_wet: getEUOverride()?.wet_grip_class ?? selectedTire.eu_wet_grip_class ?? selectedTire.eu_wet ?? null,
            eu_noise: getEUOverride()?.noise_db ?? selectedTire.eu_noise_db ?? selectedTire.eu_noise ?? null,
            eu_noise_class: getEUOverride()?.noise_class ?? selectedTire.eu_noise_class ?? null,
          },
        },
      });

      if (error) {
        throw error;
      }

      setEanAuditProgress(96);
      setEanAuditResult((data as TireEanAuditResult | null) ?? null);
      setEprelSuggestionError(null);
      setEprelSuggestionResult(null);
      setEanAuditProgress(100);
      await loadEprelListStatuses(filteredTires);
    } catch (error: any) {
      console.error('AI tire EAN audit failed:', error);
      let detailedMessage: string | null = null;
      const responseContext = error?.context;
      if (responseContext && typeof responseContext.clone === 'function') {
        try {
          const body = await responseContext.clone().json();
          detailedMessage = body?.error ?? body?.message ?? null;
        } catch {
          try {
            detailedMessage = await responseContext.clone().text();
          } catch {
            detailedMessage = null;
          }
        }
      }
      setEanAuditError(
        detailedMessage ||
          error?.message ||
          t('tiresCmsPage.eanAuditFailed')
      );
      setEanAuditResult(null);
    } finally {
      setEanAuditLoading(false);
      window.setTimeout(() => setEanAuditProgress(null), 600);
    }
  };

  const handleAuditByEan = async () => {
    await runEprelAudit({ useFallbackSearch: false });
  };

  const handleAuditByRegistration = async (registrationNumber: string) => {
    await runEprelAudit({ manualRegistrationNumber: registrationNumber, useFallbackSearch: true });
  };

  const handleSuggestEprelId = async () => {
    if (!selectedTire) return;

    const effectiveIdentity = getEffectiveIdentity(selectedTire);
    setEprelSuggestionLoading(true);
    setEprelSuggestionError(null);
    setEprelSuggestionResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('suggest_eprel_id', {
        body: {
          ean: resolvePreferredEan(
            getIdentityOverride()?.ean,
            selectedTire.ean,
            selectedTire.derived_ean,
          ),
          brand: effectiveIdentity.brand,
          model: effectiveIdentity.model,
          size_string: effectiveIdentity.size_string,
          language,
        },
      });

      if (error) throw error;

      setEprelSuggestionResult((data as TireEprelIdSuggestion | null) ?? null);
    } catch (error: any) {
      console.error('Suggest EPREL ID failed:', error);
      let detailedMessage: string | null = null;
      const responseContext = error?.context;
      if (responseContext && typeof responseContext.clone === 'function') {
        try {
          const body = await responseContext.clone().json();
          detailedMessage = body?.error ?? body?.message ?? null;
        } catch {
          try {
            detailedMessage = await responseContext.clone().text();
          } catch {
            detailedMessage = null;
          }
        }
      }
      setEprelSuggestionError(
        detailedMessage ||
          error?.message ||
          t('tiresCmsPage.eprelSuggestionFailed')
      );
    } finally {
      setEprelSuggestionLoading(false);
    }
  };

  const handleSetAuditReviewStatus = async (
    field: string,
    status: 'accepted' | 'rejected' | 'kept_current',
  ) => {
    if (!eanAuditResult) {
      return;
    }

    try {
      if (eanAuditResult.eprel_match_id) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const payload: Record<string, any> = {
          review_status: status,
          reviewed_at: new Date().toISOString(),
        };
        if (user?.id) {
          payload.reviewed_by = user.id;
        }

        const { error } = await supabase
          .from('cms_tire_eprel_field_reviews')
          .update(payload)
          .eq('eprel_match_id', eanAuditResult.eprel_match_id)
          .eq('field_name', field);

        if (error) throw error;
      }

      setEanAuditResult((prev) =>
        prev
          ? {
              ...prev,
              checks: prev.checks.map((check) =>
                check.field === field
                  ? {
                      ...check,
                      review_status: status,
                    }
                  : check
              ),
            }
          : prev
      );
      if (status === 'accepted') {
        await applyEanAuditResult([field]);
      }
      await loadEprelListStatuses(filteredTires);
    } catch (error) {
      console.error('Set EPREL review status failed:', error);
    }
  };

  const applyEanAuditResult = async (fieldsToApply?: string[]) => {
    if (!eanAuditResult) {
      return;
    }

    const { extracted } = eanAuditResult;
    const selectedFields = fieldsToApply ? new Set(fieldsToApply) : null;
    const auditedEan = String(extracted.metadata.ean ?? eanAuditResult.ean ?? '').replace(/\D/g, '').trim();
    const reviewStatusByField = new Map(
      eanAuditResult.checks.map((check) => [check.field, check.review_status ?? 'pending'])
    );
    const shouldApplyField = (field: string) => {
      if (selectedFields && !selectedFields.has(field)) return false;
      const status = reviewStatusByField.get(field);
      return status !== 'rejected' && status !== 'kept_current';
    };
    const parsedSize = extracted.size_string
      ? (() => {
          const match = extracted.size_string.match(/(\d{3})\s*\/\s*(\d{2})\s*R?\s*(\d{2})(?:\s+(\d{2,3}))?(?:\s+([A-Z]{1,2}))?/i);
          return {
            width: match?.[1] ?? '',
            aspect: match?.[2] ?? '',
            rim: match?.[3] ?? '',
            load_index: match?.[4] ?? '',
            speed_rating: match?.[5]?.toUpperCase() ?? '',
          };
        })()
      : { width: '', aspect: '', rim: '', load_index: '', speed_rating: '' };
    const nextSizeParts = {
      width: shouldApplyField('size_string') ? (parsedSize.width || sizeParts.width) : sizeParts.width,
      aspect: shouldApplyField('size_string') ? (parsedSize.aspect || sizeParts.aspect) : sizeParts.aspect,
      rim: shouldApplyField('size_string') ? (parsedSize.rim || sizeParts.rim) : sizeParts.rim,
      load_index: shouldApplyField('size_string') ? (parsedSize.load_index || sizeParts.load_index) : sizeParts.load_index,
      speed_rating: shouldApplyField('size_string') ? (parsedSize.speed_rating || sizeParts.speed_rating) : sizeParts.speed_rating,
    };
    const formattedSizeString =
      nextSizeParts.width && nextSizeParts.aspect && nextSizeParts.rim
        ? `${nextSizeParts.width} / ${nextSizeParts.aspect} R${nextSizeParts.rim}${nextSizeParts.load_index ? ` ${nextSizeParts.load_index}` : ''}${nextSizeParts.speed_rating ? ` ${nextSizeParts.speed_rating}` : ''}`.trim()
        : extracted.size_string || '';

    if (shouldApplyField('size_string')) {
      setSizeParts(nextSizeParts);
    }
    setEditData((prev) => {
      const currentOverrides = (prev.spec_overrides || {}) as Record<string, any>;
      const currentIdentity = { ...(currentOverrides.identity || {}) };
      const currentFeatures = { ...(currentOverrides.features || {}) };
      const currentEu = { ...(currentOverrides.eu || {}) };
      const currentTyreLabelSection = { ...(currentOverrides.tyre_label_section || {}) };
      const currentTyreLabelIdentity = { ...(currentTyreLabelSection.identity || {}) };
      const currentTyreLabelEu = { ...(currentTyreLabelSection.eu_label || {}) };
      const currentTyreLabelCompliance = { ...(currentTyreLabelSection.compliance || {}) };

      if (auditedEan && shouldApplyField('ean')) currentIdentity.ean = auditedEan;
      if (extracted.brand && shouldApplyField('brand')) currentIdentity.brand = extracted.brand;
      if (extracted.model && shouldApplyField('model')) currentIdentity.model = extracted.model;
      if (extracted.season && shouldApplyField('season')) currentIdentity.season = extracted.season;
      if (formattedSizeString && shouldApplyField('size_string')) currentIdentity.size_string = formattedSizeString;
      if (nextSizeParts.load_index && shouldApplyField('size_string')) currentIdentity.load_index = nextSizeParts.load_index;
      if (nextSizeParts.speed_rating && shouldApplyField('size_string')) currentIdentity.speed_rating = nextSizeParts.speed_rating;

      if (extracted.badges.runflat !== null && shouldApplyField('runflat')) currentFeatures.runflat = extracted.badges.runflat;
      if (extracted.badges.xl !== null && shouldApplyField('xl')) currentFeatures.xl = extracted.badges.xl;
      if (extracted.badges.studded !== null && shouldApplyField('studded')) currentFeatures.studded = extracted.badges.studded;
      if (extracted.badges.threepmsf !== null && shouldApplyField('threepmsf')) currentFeatures.threepmsf = extracted.badges.threepmsf;
      if (extracted.badges.winter_approved !== null && shouldApplyField('winter_approved')) currentFeatures.winter_approved = extracted.badges.winter_approved;
      if (extracted.badges.ice_approved !== null && shouldApplyField('ice_approved')) currentFeatures.ice_approved = extracted.badges.ice_approved;

      if (extracted.eu_label.fuel_class && shouldApplyField('eu_fuel')) currentEu.fuel_class = extracted.eu_label.fuel_class;
      if (extracted.eu_label.wet_grip_class && shouldApplyField('eu_wet')) currentEu.wet_grip_class = extracted.eu_label.wet_grip_class;
      if (extracted.eu_label.noise_db !== null && shouldApplyField('eu_noise')) currentEu.noise_db = extracted.eu_label.noise_db;
      if (extracted.eu_label.noise_class && shouldApplyField('eu_noise_class')) currentEu.noise_class = extracted.eu_label.noise_class;

      if (extracted.brand) currentTyreLabelIdentity.supplier_name = extracted.brand;
      if (extracted.brand) currentTyreLabelIdentity.supplier_trademark = extracted.brand;
      if (extracted.model) currentTyreLabelIdentity.commercial_name = extracted.model;
      if (extracted.metadata.tyre_type_identifier) currentTyreLabelIdentity.tyre_type_identifier = extracted.metadata.tyre_type_identifier;
      if (extracted.metadata.tyre_class) currentTyreLabelIdentity.tyre_class = extracted.metadata.tyre_class;
      if (extracted.metadata.load_version) currentTyreLabelIdentity.load_version = extracted.metadata.load_version;

      if (extracted.metadata.eprel_registration_number) currentTyreLabelEu.eprel_registration_number = extracted.metadata.eprel_registration_number;
      if (extracted.metadata.eprel_qr_url) currentTyreLabelEu.eprel_qr_url = extracted.metadata.eprel_qr_url;
      if (extracted.metadata.eprel_sheet_url) currentTyreLabelEu.eprel_sheet_url = extracted.metadata.eprel_sheet_url;

      if (extracted.metadata.production_start) currentTyreLabelCompliance.production_start = extracted.metadata.production_start;
      if (extracted.metadata.production_end) currentTyreLabelCompliance.production_end = extracted.metadata.production_end;
      if (extracted.metadata.market_start) currentTyreLabelCompliance.market_start = extracted.metadata.market_start;
      if (extracted.metadata.supplier_website) currentTyreLabelCompliance.supplier_website = extracted.metadata.supplier_website;
      if (extracted.metadata.supplier_contact_name) currentTyreLabelCompliance.supplier_contact_name = extracted.metadata.supplier_contact_name;
      if (extracted.metadata.supplier_contact_email) currentTyreLabelCompliance.supplier_contact_email = extracted.metadata.supplier_contact_email;
      if (extracted.metadata.supplier_contact_phone) currentTyreLabelCompliance.supplier_contact_phone = extracted.metadata.supplier_contact_phone;
      if (extracted.metadata.data_source) currentTyreLabelCompliance.data_source = extracted.metadata.data_source;
      if (extracted.metadata.data_source_url) currentTyreLabelCompliance.data_source_url = extracted.metadata.data_source_url;
      if (extracted.metadata.last_verified_at) currentTyreLabelCompliance.last_verified_at = extracted.metadata.last_verified_at;

      return {
        ...prev,
        spec_overrides: {
          ...currentOverrides,
          identity: currentIdentity,
          features: currentFeatures,
          eu: currentEu,
          tyre_label_section: {
            ...currentTyreLabelSection,
            identity: currentTyreLabelIdentity,
            eu_label: currentTyreLabelEu,
            compliance: currentTyreLabelCompliance,
          },
        },
      };
    });

    if (eanAuditResult.eprel_match_id) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const persistedReviewFields = new Set([
          'brand',
          'ean',
          'model',
          'size_string',
          'season',
          'runflat',
          'xl',
          'studded',
          'threepmsf',
          'winter_approved',
          'ice_approved',
          'eu_fuel',
          'eu_wet',
          'eu_noise',
          'eu_noise_class',
        ]);

        const rowsToUpdate = eanAuditResult.checks
          .filter((check) => persistedReviewFields.has(check.field))
          .filter((check) => !selectedFields || selectedFields.has(check.field))
          .map((check) => {
            const currentStatus = check.review_status ?? 'pending';
            const nextStatus =
              currentStatus === 'rejected' || currentStatus === 'kept_current'
                ? currentStatus
                : check.audited_value === null || check.audited_value === ''
                  ? 'kept_current'
                  : 'accepted';

            return {
              field_name: check.field,
              current_status: currentStatus,
              review_status: nextStatus,
            };
          })
          .filter((row) => row.current_status !== row.review_status);

        for (const row of rowsToUpdate) {
          const updatePayload: Record<string, any> = {
            review_status: row.review_status,
            reviewed_at: new Date().toISOString(),
          };
          if (user?.id) {
            updatePayload.reviewed_by = user.id;
          }

          const { error } = await supabase
            .from('cms_tire_eprel_field_reviews')
            .update(updatePayload)
            .eq('eprel_match_id', eanAuditResult.eprel_match_id)
            .eq('field_name', row.field_name);

          if (error) throw error;
        }

        setEanAuditResult((prev) =>
          prev
            ? {
                ...prev,
                checks: prev.checks.map((check) => {
                  const currentStatus = check.review_status ?? 'pending';
                  const nextStatus =
                    currentStatus === 'rejected' || currentStatus === 'kept_current'
                      ? currentStatus
                      : check.audited_value === null || check.audited_value === ''
                        ? 'kept_current'
                        : 'accepted';

                  return {
                    ...check,
                    review_status: nextStatus,
                  };
                }),
              }
            : prev
        );
      } catch (error) {
        console.error('Apply EPREL review status update failed:', error);
      }
    }
  };

  const filteredTires = tires;
  const draftTyreLabelSection = selectedTire
    ? buildTyreLabelSectionData({
        existing: (editData.spec_overrides as any)?.tyre_label_section,
        brand: getEffectiveIdentity(selectedTire).brand,
        model: getEffectiveIdentity(selectedTire).model,
        tyreTypeIdentifier: (editData.spec_overrides as any)?.tyre_label_section?.identity?.tyre_type_identifier ?? null,
        sizeString: getEffectiveIdentity(selectedTire).size_string,
        season: getIdentityOverride()?.season ?? selectedTire.season,
        loadIndex: (editData.spec_overrides as any)?.identity?.load_index ?? selectedTire.load_index,
        speedRating:
          (editData.spec_overrides as any)?.identity?.speed_rating ??
          selectedTire.speed_rating ??
          selectedTire.speed_index,
        ean: resolvePreferredEan(
          getIdentityOverride()?.ean,
          selectedTire.ean,
          selectedTire.derived_ean,
        ),
        supplierCodeBest: selectedTire.supplier_code_best,
        runflat: getEffectiveFeatureValue('runflat'),
        xlReinforced: getEffectiveFeatureValue('xl'),
        evReady: getEffectiveFeatureValue('ev_ready'),
        soundAbsorber: getEffectiveFeatureValue('sound_absorber'),
        studded: getEffectiveFeatureValue('studded'),
        threepmsf: getEffectiveFeatureValue('threepmsf'),
        winterApproved: getEffectiveFeatureValue('winter_approved'),
        iceApproved: getEffectiveFeatureValue('ice_approved'),
        euFuelClass: getEUOverride()?.fuel_class ?? selectedTire.eu_fuel_class ?? selectedTire.eu_fuel ?? null,
        euWetGripClass: getEUOverride()?.wet_grip_class ?? selectedTire.eu_wet_grip_class ?? selectedTire.eu_wet ?? null,
        euNoiseDb: getEUOverride()?.noise_db ?? selectedTire.eu_noise_db ?? selectedTire.eu_noise ?? null,
        euNoiseClass: getEUOverride()?.noise_class ?? selectedTire.eu_noise_class ?? null,
        eprelRegistrationNumber: selectedTire.eprel_registration_number ?? selectedTire.eprel_code ?? null,
        eprelQrUrl: selectedTire.eprel_qr_url ?? null,
        eprelSheetUrl: selectedTire.eprel_sheet_url ?? null,
        productionStart: (editData.spec_overrides as any)?.tyre_label_section?.compliance?.production_start ?? null,
        productionEnd: (editData.spec_overrides as any)?.tyre_label_section?.compliance?.production_end ?? null,
        marketStart: (editData.spec_overrides as any)?.tyre_label_section?.compliance?.market_start ?? null,
        supplierWebsite: (editData.spec_overrides as any)?.tyre_label_section?.compliance?.supplier_website ?? null,
        supplierContactName: (editData.spec_overrides as any)?.tyre_label_section?.compliance?.supplier_contact_name ?? null,
        supplierContactEmail: (editData.spec_overrides as any)?.tyre_label_section?.compliance?.supplier_contact_email ?? null,
        supplierContactPhone: (editData.spec_overrides as any)?.tyre_label_section?.compliance?.supplier_contact_phone ?? null,
        dataSource: (editData.spec_overrides as any)?.tyre_label_section?.compliance?.data_source ?? selectedTire.eprel_source ?? null,
        dataSourceUrl: (editData.spec_overrides as any)?.tyre_label_section?.compliance?.data_source_url ?? selectedTire.eprel_source_url ?? null,
        lastVerifiedAt: (editData.spec_overrides as any)?.tyre_label_section?.compliance?.last_verified_at ?? null,
      })
    : null;

  const setTyreLabelField = (
    group: 'identity' | 'eu_label' | 'compliance',
    field: string,
    value?: string,
  ) => {
    setEditData((prev) => {
      const currentOverrides = (prev.spec_overrides || {}) as Record<string, any>;
      const currentSection = currentOverrides.tyre_label_section || {};
      const currentGroup = { ...(currentSection[group] || {}) };

      currentGroup[field] = value?.trim() ?? '';

      const nextSection = {
        ...currentSection,
        [group]: currentGroup,
      };

      const cleanedSection = Object.entries(nextSection).reduce((acc, [key, entry]) => {
        if (entry && typeof entry === 'object' && Object.keys(entry).length > 0) {
          acc[key] = entry;
        }
        return acc;
      }, {} as Record<string, any>);

      const nextOverrides = { ...currentOverrides };
      if (Object.keys(cleanedSection).length > 0) {
        nextOverrides.tyre_label_section = cleanedSection;
      } else {
        delete nextOverrides.tyre_label_section;
      }

      return {
        ...prev,
        spec_overrides: Object.keys(nextOverrides).length > 0 ? nextOverrides : null,
      };
    });
  };

  useEffect(() => {
    setEanAuditError(null);
    setEanAuditResult(null);
    setEanAuditLoading(false);
    setEanAuditProgress(null);
  }, [selectedTire?.variant_id]);

  useEffect(() => {
    void loadEprelListStatuses(filteredTires);
  }, [filteredTires, loadEprelListStatuses]);

  useEffect(() => {
    if (!eanAuditLoading || eanAuditProgress === null) {
      return;
    }

    const timer = window.setTimeout(() => {
      setEanAuditProgress((prev) => {
        if (prev === null) return prev;
        const cappedTarget = 94;
        if (prev >= cappedTarget) {
          return prev;
        }

        return Math.min(cappedTarget, prev + (prev < 60 ? 4 : prev < 80 ? 2 : 1));
      });
    }, 220);

    return () => window.clearTimeout(timer);
  }, [eanAuditLoading, eanAuditProgress]);

  const supplierCodeForPricing = String(
    pricingDetails?.supplier_code_best ?? selectedTire?.supplier_code_best ?? '',
  )
    .trim()
    .toUpperCase();
  const isRengasDuoTire = supplierCodeForPricing === 'RD';
  const isVannetukkuTire = supplierCodeForPricing === 'VT';
  const vtShippingFeeExVat = Number(pricingDetails?.shipping_fee_ex_vat ?? VT_TIRE_FIXED_SHIPPING_EX_VAT);

  const originalApiPrice = (() => {
    if (isRengasDuoTire) {
      const preferred =
        pricingDetails?.raw_net_price_ex_vat ??
        pricingDetails?.wholesale_price_ex_vat ??
        null;
      if (preferred !== null && preferred !== undefined && Number.isFinite(Number(preferred))) {
        return Number(preferred);
      }
    }
    if (isVannetukkuTire) {
      const preferred =
        pricingDetails?.raw_price_ex_vat ??
        pricingDetails?.wholesale_price_ex_vat ??
        (selectedTire?.price !== null && selectedTire?.price !== undefined
          ? Number(selectedTire.price) - vtShippingFeeExVat
          : null) ??
        null;
      if (preferred !== null && preferred !== undefined && Number.isFinite(Number(preferred))) {
        return Number(preferred);
      }
    }
    return selectedTire?.price !== null && selectedTire?.price !== undefined
      ? Number(selectedTire.price)
      : null;
  })();
  const recyclingFeeExVat =
    isRengasDuoTire &&
    pricingDetails?.recycling_fee_ex_vat !== null &&
    pricingDetails?.recycling_fee_ex_vat !== undefined
      ? Number(pricingDetails.recycling_fee_ex_vat)
      : null;
  const shippingFeeExVat = isRengasDuoTire
    ? RD_SHIPPING_COST_EX_VAT
    : isVannetukkuTire
      ? vtShippingFeeExVat
      : null;
  const costAfterFeesExVat =
    originalApiPrice !== null && (recyclingFeeExVat !== null || shippingFeeExVat !== null)
      ? Number(
          (
            originalApiPrice +
            (recyclingFeeExVat ?? 0) +
            (shippingFeeExVat ?? 0)
          ).toFixed(2)
        )
      : null;
  const effectiveDraftPrice =
    editData.promo_enabled && editData.promo_price_eur !== null && editData.promo_price_eur !== undefined
      ? Number(editData.promo_price_eur)
      : editData.price_override_eur !== null && editData.price_override_eur !== undefined
        ? Number(editData.price_override_eur)
        : costAfterFeesExVat ?? originalApiPrice;
  const { applySupplierMarkup: applySupplierMarkupWithBase } = useTiresCmsSupplierMarkup({
    baseApiPrice: costAfterFeesExVat ?? originalApiPrice,
    selectedTire,
    setEditData,
    setSaveError,
    supplierMarkupAmount,
    supplierMarkupPercent,
  });

  const fetchSupplierBulkPage = async (supplierCode: string, offset: number, pageSize: number) => {
    const { data, error } = await supabase.rpc('cms_list_tires_admin_v1', {
      p_search: searchTerm.trim() || null,
      p_missing_ean_only: false,
      p_exclude_non_passenger: hideNonPassenger,
      p_supplier_code: supplierCode,
      p_tire_segment: tireSegmentFilter !== 'all' ? tireSegmentFilter : null,
      p_missing_metadata_fields: missingMetadataFields.length > 0 ? missingMetadataFields : null,
      p_missing_image_only: showMissingImagesOnly,
      p_has_eprel_only: showWithEprelOnly,
      p_missing_seo_fields: missingSeoFields.length > 0 ? missingSeoFields : null,
      p_limit: pageSize,
      p_offset: offset,
    });
    if (error) throw error;

    return (data ?? [])
      .filter((row: any) => typeof row.variant_id === 'string' && Number.isFinite(Number(row.price)))
      .map((row: any) => ({
        variant_id: row.variant_id,
        price: Number(row.price),
      }));
  };

  const handleApplyBulkSupplierMarkup = async () => {
    const supplierCode = String(bulkMarkupSupplier).trim().toUpperCase();
    const hasAmountInput = bulkMarkupAmount.trim() !== '';
    const hasPercentInput = bulkMarkupPercent.trim() !== '';
    const amountAdjustment = Number(bulkMarkupAmount);
    const percentAdjustment = Number(bulkMarkupPercent);

    if (!supplierCode || supplierCode === 'ALL') {
      setCatalogSyncMessage(t('tiresCmsPage.chooseSupplier'));
      return;
    }

    if (!hasAmountInput && !hasPercentInput) {
      setCatalogSyncMessage(
        t('tiresCmsPage.enterAdjustment')
      );
      return;
    }

    if (hasAmountInput && !Number.isFinite(amountAdjustment)) {
      setCatalogSyncMessage(
        t('tiresCmsPage.invalidEuroAdjustment')
      );
      return;
    }

    if (hasPercentInput && !Number.isFinite(percentAdjustment)) {
      setCatalogSyncMessage(
        t('tiresCmsPage.invalidPercentAdjustment')
      );
      return;
    }

    setApplyingBulkMarkup(true);
    setCatalogSyncMessage(null);

    try {
      const totalItems = bulkMarkupMatchCount ?? 0;

      if (totalItems === 0) {
        setCatalogSyncMessage(
          t('tiresCmsPage.noMatchingTires')
        );
        return;
      }
      const pageSize = 500;
      let offset = 0;
      let processed = 0;
      setBulkMarkupProgress({ mode: 'apply', processed: 0, total: totalItems });

      while (offset < totalItems) {
        const rows = await fetchSupplierBulkPage(supplierCode, offset, pageSize);
        if (rows.length === 0) break;

        const payload = rows.map((row) => ({
          variant_id: row.variant_id,
          price_override_eur: Math.round(
            (hasPercentInput
              ? row.price * (1 + percentAdjustment / 100)
              : row.price + amountAdjustment) * 100
          ) / 100,
        }));

        const { error } = await supabase.from('product_cms').upsert(payload, { onConflict: 'variant_id' });
        if (error) throw error;

        processed += rows.length;
        offset += pageSize;
        setBulkMarkupProgress({ mode: 'apply', processed, total: totalItems });
      }

      filteredTires
        .filter((tire) => String(tire.supplier_code_best ?? '').toUpperCase() === supplierCode)
        .forEach((tire) => {
          const nextOverride = Math.round(
            ((hasPercentInput
              ? Number(tire.price ?? 0) * (1 + percentAdjustment / 100)
              : Number(tire.price ?? 0) + amountAdjustment) || 0) * 100
          ) / 100;

          patchLocalCmsData(tire.variant_id, {
            price_override_eur: nextOverride,
          });
        });

      setHasPendingCatalogSync(true);
      setCatalogSyncMessage(
        t('tiresCmsPage.bulkMarkupApplied', {
          adjustment: hasPercentInput ? t('tiresCmsPage.percentAdjustment') : t('tiresCmsPage.priceAdjustment'),
          count: processed,
          supplier: supplierCode,
        })
      );
    } catch (error: any) {
      console.error('Bulk supplier markup error:', error);
      setCatalogSyncMessage(error?.message || t('tiresCmsPage.bulkMarkupFailed'));
    } finally {
      setApplyingBulkMarkup(false);
      setBulkMarkupProgress(null);
    }
  };

  const handleRevertBulkSupplierMarkup = async () => {
    const supplierCode = String(bulkMarkupSupplier).trim().toUpperCase();

    if (!supplierCode || supplierCode === 'ALL') {
      setCatalogSyncMessage(t('tiresCmsPage.chooseSupplier'));
      return;
    }

    setRevertingBulkMarkup(true);
    setCatalogSyncMessage(null);

    try {
      const totalItems = bulkMarkupMatchCount ?? 0;

      if (totalItems === 0) {
        setCatalogSyncMessage(
          t('tiresCmsPage.noMatchingTires')
        );
        return;
      }
      const pageSize = 500;
      let offset = 0;
      let processed = 0;
      setBulkMarkupProgress({ mode: 'revert', processed: 0, total: totalItems });

      while (offset < totalItems) {
        const rows = await fetchSupplierBulkPage(supplierCode, offset, pageSize);
        if (rows.length === 0) break;

        const payload = rows.map((row) => ({
          variant_id: row.variant_id,
          price_override_eur: null,
        }));

        const { error } = await supabase.from('product_cms').upsert(payload, { onConflict: 'variant_id' });
        if (error) throw error;

        processed += rows.length;
        offset += pageSize;
        setBulkMarkupProgress({ mode: 'revert', processed, total: totalItems });
      }

      filteredTires
        .filter((tire) => String(tire.supplier_code_best ?? '').toUpperCase() === supplierCode)
        .forEach((tire) => {
          patchLocalCmsData(tire.variant_id, {
            price_override_eur: null,
          });
        });

      setHasPendingCatalogSync(true);
      setCatalogSyncMessage(
        t('tiresCmsPage.revertedToApiPrice', {
          count: processed,
          supplier: supplierCode,
        })
      );
    } catch (error: any) {
      console.error('Bulk supplier markup revert error:', error);
      setCatalogSyncMessage(
        error?.message || t('tiresCmsPage.revertToApiPriceFailed')
      );
    } finally {
      setRevertingBulkMarkup(false);
      setBulkMarkupProgress(null);
    }
  };

  const handleApplySupplierFilter = () => {
    const nextHideNonPassenger = !showNonPassengerDraft;
    const hasChanges =
      supplierDraft !== supplierFilter ||
      tireSegmentDraft !== tireSegmentFilter ||
      nextHideNonPassenger !== hideNonPassenger ||
      showMissingImagesOnlyDraft !== showMissingImagesOnly ||
      showWithEprelOnlyDraft !== showWithEprelOnly ||
      missingMetadataFieldsDraft.join('|') !== missingMetadataFields.join('|') ||
      missingSeoFieldsDraft.join('|') !== missingSeoFields.join('|');

    if (!hasChanges) {
      setSettingsDrawerOpen(false);
      return;
    }

    invalidateCache();
    setCurrentPage(1);
    setSupplierFilter(supplierDraft);
    setTireSegmentFilter(tireSegmentDraft);
    setHideNonPassenger(nextHideNonPassenger);
    setMissingMetadataFields(missingMetadataFieldsDraft);
    setShowMissingImagesOnly(showMissingImagesOnlyDraft);
    setShowWithEprelOnly(showWithEprelOnlyDraft);
    setMissingSeoFields(missingSeoFieldsDraft);
    setSettingsDrawerOpen(false);
  };

  return (
    <div className={`${embedded ? 'min-h-0' : 'min-h-screen'} ${isDark ? 'bg-[#0B0D10]' : 'bg-gray-50'}`}>
      <TiresWarningTooltip isDark={isDark} warningTooltip={warningTooltip} />
      <TiresCmsToolbar
        isDark={isDark}
        hideHeader={embedded}
        searchTerm={searchTerm}
        showNonPassengerDraft={showNonPassengerDraft}
        missingMetadataFieldsDraft={missingMetadataFieldsDraft}
        showMissingImagesOnlyDraft={showMissingImagesOnlyDraft}
        showWithEprelOnlyDraft={showWithEprelOnlyDraft}
        missingSeoFieldsDraft={missingSeoFieldsDraft}
        supplierFilter={supplierFilter}
        supplierDraft={supplierDraft}
        tireSegmentDraft={tireSegmentDraft}
        supplierOptions={SUPPLIER_OPTIONS}
        syncingCatalog={syncingCatalog}
        hasPendingCatalogSync={hasPendingCatalogSync}
        catalogSyncMessage={catalogSyncMessage}
        catalogSyncProgress={catalogSyncProgress}
        pendingConflictCount={pendingConflictCount}
        bulkMarkupAmount={bulkMarkupAmount}
        bulkMarkupPercent={bulkMarkupPercent}
        bulkMarkupSupplier={bulkMarkupSupplier}
        bulkMarkupMatchCount={bulkMarkupMatchCount}
        loadingBulkMarkupCount={loadingBulkMarkupCount}
        applyingBulkMarkup={applyingBulkMarkup}
        revertingBulkMarkup={revertingBulkMarkup}
        bulkMarkupProgress={bulkMarkupProgress}
        settingsDrawerOpen={settingsDrawerOpen}
        supplierFilterDirty={
          supplierDraft !== supplierFilter ||
          tireSegmentDraft !== tireSegmentFilter ||
          (!showNonPassengerDraft) !== hideNonPassenger ||
          showMissingImagesOnlyDraft !== showMissingImagesOnly ||
          showWithEprelOnlyDraft !== showWithEprelOnly ||
          missingMetadataFieldsDraft.join('|') !== missingMetadataFields.join('|') ||
          missingSeoFieldsDraft.join('|') !== missingSeoFields.join('|')
        }
        onSearchTermChange={setSearchTerm}
        onShowNonPassengerDraftChange={setShowNonPassengerDraft}
        onMissingMetadataFieldsDraftChange={setMissingMetadataFieldsDraft}
        onShowMissingImagesOnlyDraftChange={setShowMissingImagesOnlyDraft}
        onShowWithEprelOnlyDraftChange={setShowWithEprelOnlyDraft}
        onMissingSeoFieldsDraftChange={setMissingSeoFieldsDraft}
        onSupplierDraftChange={setSupplierDraft}
        onTireSegmentDraftChange={setTireSegmentDraft}
        onBulkMarkupSupplierChange={setBulkMarkupSupplier}
        onSettingsDrawerOpenChange={setSettingsDrawerOpen}
        onApplySupplierFilter={handleApplySupplierFilter}
        onBulkMarkupAmountChange={(value) => {
          setBulkMarkupAmount(value);
          if (value.trim() !== '') {
            setBulkMarkupPercent('');
          }
        }}
        onBulkMarkupPercentChange={(value) => {
          setBulkMarkupPercent(value);
          if (value.trim() !== '') {
            setBulkMarkupAmount('');
          }
        }}
        onApplyBulkSupplierMarkup={handleApplyBulkSupplierMarkup}
        onRevertBulkSupplierMarkup={handleRevertBulkSupplierMarkup}
        onApplyCatalogSync={handleApplyCatalogSync}
        onResolveConflict={navigateToCmsTireConflicts}
      />

      {/* Main Content */}
      <div className="px-8 py-6">
        <TiresCmsTableSection
          currentPage={currentPage}
          endItem={endItem}
          error={error}
          filteredTires={filteredTires}
          cachedItemCount={cachedItemCount}
          getEffectiveIdentity={getEffectiveIdentity}
          handleEdit={handleEdit}
          handleToggleVisibility={handleToggleVisibility}
          hasMissingSupplierPrice={hasMissingSupplierPrice}
          isDark={isDark}
          loading={loading}
          preloading={preloading}
          mustHideFromStore={mustHideFromStore}
          onPageChange={setCurrentPage}
          startItem={startItem}
          totalCount={totalCount}
          totalPages={totalPages}
        />
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
                  {t('tiresCmsPage.editTire')}
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
              <TireEprelDrawerSection
                auditResult={eanAuditResult}
                eprelListStatus={eprelListStatuses[selectedTire.variant_id]}
                isDark={isDark}
                selectedTire={selectedTire}
              />
              
              {draftTyreLabelSection && (
                <TiresTyreLabelSection
                  applyAuditResult={applyEanAuditResult}
                  auditError={eanAuditError}
                  auditLoading={eanAuditLoading || eanReviewLoading}
                  auditProgress={eanAuditProgress}
                  auditResult={eanAuditResult}
                  auditSuggestion={eprelSuggestionResult}
                  auditSuggestionError={eprelSuggestionError}
                  auditSuggestionLoading={eprelSuggestionLoading}
                  baseBrand={selectedTire.brand}
                  baseDerivedEan={selectedTire.derived_ean}
                  baseEan={selectedTire.ean}
                  baseEprelRegistrationNumber={extractEprelRegistrationNumber(
                    selectedTire.eprel_registration_number,
                    selectedTire.eprel_code,
                    selectedTire.eprel_qr_url,
                    selectedTire.eprel_source_url,
                  )}
                  baseModel={selectedTire.model}
                  baseSeason={selectedTire.season}
                  clearEUOverrides={clearEUOverrides}
                  clearFeatureOverrides={clearFeatureOverrides}
                  clearIdentityOverrides={clearIdentityOverrides}
                  euFuelWetOptions={EU_FUEL_WET_OPTIONS}
                  euNoiseClassOptions={EU_NOISE_CLASS_OPTIONS}
                  getEffectiveFeatureValue={getEffectiveFeatureValue}
                  getEuOverride={getEUOverride}
                  getIdentityOverride={getIdentityOverride}
                  hasEuOverride={hasEUOverride()}
                  isDark={isDark}
                  onAuditByEan={handleAuditByEan}
                  onSuggestEprelId={handleSuggestEprelId}
                  onSetAuditReviewStatus={handleSetAuditReviewStatus}
                  onSetEuField={setEUField}
                  onTyreLabelFieldChange={setTyreLabelField}
                  selectedTire={selectedTire}
                  setFeatureField={setFeatureField}
                  setIdentityField={setIdentityField}
                  sizeParts={sizeParts}
                  tyreLabelSection={draftTyreLabelSection}
                  updateSizePart={updateSizePart}
                />
              )}

              {/* Section C: Pricing */}
              <TiresPricingSection
                costAfterFeesExVat={costAfterFeesExVat}
                editData={editData}
                effectiveDraftPrice={effectiveDraftPrice}
                isDark={isDark}
                onApplySupplierMarkup={applySupplierMarkupWithBase}
                onEditDataChange={(updater) => setEditData((prev) => updater(prev))}
                originalApiPrice={originalApiPrice}
                recyclingFeeExVat={recyclingFeeExVat}
                selectedTire={selectedTire}
                shippingFeeExVat={shippingFeeExVat}
                setSupplierMarkupAmount={setSupplierMarkupAmount}
                setSupplierMarkupPercent={setSupplierMarkupPercent}
                supplierMarkupAmount={supplierMarkupAmount}
                supplierMarkupPercent={supplierMarkupPercent}
                toPriceWithVat={toPriceWithVat}
              >
                <TiresBundlePricingSection
                  clearBundlePricing={clearBundlePricing}
                  getBundlePricing={getBundlePricing}
                  isDark={isDark}
                  selectedTireFinalPriceEur={effectiveDraftPrice}
                  selectedTirePrice={originalApiPrice}
                  setBundleTier={setBundleTier}
                />
              </TiresPricingSection>

              <TiresImagesSection
                draggedIndex={draggedIndex}
                editGallery={(editData.gallery as string[]) ?? []}
                handleDragEnd={handleDragEnd}
                handleDragOver={handleImageDragOver}
                handleDragStart={handleDragStart}
                handleImageUpload={handleImageUpload}
                handleRemoveImage={handleRemoveImage}
                isDark={isDark}
                uploadError={uploadError}
                uploadingImages={uploadingImages}
              />

              <TiresContentSection
                aiError={
                  aiGenerationError &&
                  (aiGenerationErrorField === null ||
                    TIRES_CONTENT_AI_FIELDS.includes(aiGenerationErrorField) ||
                    TIRES_SEO_AI_FIELDS.includes(aiGenerationErrorField))
                    ? aiGenerationError
                    : null
                }
                aiGeneratingField={aiGeneratingField}
                aiGenerationProgress={aiGenerationProgress}
                editData={editData}
                identityBrand={getEffectiveIdentity(selectedTire).brand}
                identityModel={getEffectiveIdentity(selectedTire).model}
                identitySizeString={getEffectiveIdentity(selectedTire).size_string}
                isDark={isDark}
                onEditDataChange={(updater) => setEditData((prev) => updater(prev))}
                onGenerateAllFields={handleGenerateAllAiFields}
              />

              <TiresVisibilitySection
                editData={editData}
                hasMissingSupplierPrice={hasMissingSupplierPrice}
                isDark={isDark}
                isManualNonPassenger={getManualNonPassengerFlag(editData.spec_overrides)}
                mustHideFromStore={mustHideFromStore}
                onHiddenChange={(hidden) => setEditData((prev) => ({ ...prev, is_hidden: hidden }))}
                onManualNonPassengerChange={(checked) =>
                  setEditData((prev) => {
                    const currentOverrides = prev.spec_overrides || {};
                    const currentClassification = (currentOverrides.classification || {}) as Record<string, any>;
                    const nextClassification = { ...currentClassification };

                    if (checked) {
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
                selectedTire={selectedTire}
              />

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
                {t('tiresCmsPage.resetCms')}
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
                {t('tiresCmsPage.cancel')}
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
                {saving ? t('tiresCmsPage.saving') : t('tiresCmsPage.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
