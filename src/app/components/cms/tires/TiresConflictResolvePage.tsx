import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Check, GitMerge, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../LanguageContext';
import { useTheme } from '../../ThemeContext';
import { supabase } from '../../../utils/supabase/client';

type ConflictRow = {
  selected_item_id: string;
  match_key: string;
  match_confidence: string;
  conflict_reason: string | null;
  review_status: string;
  selected_supplier: string;
  selected_external_id: string;
  selected_raw_table: string | null;
  selected_raw_id: string | null;
  selected_reason: string | null;
  ean: string | null;
  eprel_code: string | null;
  brand: string | null;
  model: string | null;
  supplier_title: string | null;
  size_string: string | null;
  season: string | null;
  width_mm: number | null;
  aspect_ratio: number | null;
  diameter_in: number | null;
  load_index: string | null;
  speed_rating: string | null;
  stock_qty: number | null;
  in_stock: boolean | null;
  wholesale_price_eur: number | null;
  consumer_price_eur: number | null;
  retail_price_eur: number | null;
  recycling_fee_eur: number | null;
  final_base_price_eur: number | null;
  eu_fuel_class: string | null;
  eu_wet_grip_class: string | null;
  eu_noise_db: number | null;
  eu_noise_class: string | null;
  supplier_image_id: string | null;
  supplier_image_url: string | null;
  supplier_metadata_json: Record<string, unknown> | null;
  last_seen_at: string | null;
  raw_supplier_price_ex_vat: number | null;
  shipping_fee_ex_vat: number | null;
  fair_cost_ex_vat: number | null;
  fair_cost_reason: string | null;
  alternative_offer_count: number;
  alternative_offers_json: Array<Record<string, unknown>>;
  total_count: number;
};

type ComparisonField = {
  key: string;
  label: string;
  format?: 'price' | 'boolean' | 'datetime' | 'metadata';
};

type ComparisonColumn = {
  key: string;
  title: string;
  subtitle: string;
  tone: 'selected' | 'candidate';
  source: Record<string, unknown>;
  mergeLabel?: string;
  onMerge?: () => void;
};

const CONFLICT_REASONS = [
  { value: 'identity_mismatch', label: 'Identity mismatch' },
  { value: 'eprel_mismatch', label: 'EPREL mismatch' },
  { value: 'missing_required_data', label: 'Missing required data' },
  { value: 'weak_match_missing_ean_eprel', label: 'Weak match' },
];

function navigateTo(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
}

function formatPrice(value: number | null | undefined) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `€${numeric.toFixed(2)}` : '-';
}

function textValue(value: unknown) {
  const text = String(value ?? '').trim();
  return text.length > 0 ? text : '-';
}

function numberValue(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function booleanValue(value: unknown) {
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

function datetimeValue(value: unknown) {
  const text = String(value ?? '').trim();
  if (!text) return '-';
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? text : date.toLocaleString();
}

function metadataValue(value: unknown) {
  if (!value || typeof value !== 'object') return '-';
  const entries = Object.entries(value as Record<string, unknown>);
  if (!entries.length) return '-';
  return entries.map(([key, rawValue]) => `${key}: ${textValue(rawValue)}`).join(' | ');
}

const COMPARISON_FIELDS: ComparisonField[] = [
  { key: 'supplier', label: 'Supplier' },
  { key: 'external_id', label: 'External ID' },
  { key: 'raw_table', label: 'Raw table' },
  { key: 'raw_id', label: 'Raw ID' },
  { key: 'selected_reason', label: 'Selected reason' },
  { key: 'brand', label: 'Brand' },
  { key: 'model', label: 'Model' },
  { key: 'supplier_title', label: 'Supplier title' },
  { key: 'size_string', label: 'Size' },
  { key: 'season', label: 'Season' },
  { key: 'ean', label: 'EAN' },
  { key: 'eprel_code', label: 'EPREL' },
  { key: 'width_mm', label: 'Width' },
  { key: 'aspect_ratio', label: 'Aspect' },
  { key: 'diameter_in', label: 'Diameter' },
  { key: 'load_index', label: 'Load index' },
  { key: 'speed_rating', label: 'Speed rating' },
  { key: 'stock_qty', label: 'Stock' },
  { key: 'external_stock_qty', label: 'External stock' },
  { key: 'in_stock', label: 'In stock', format: 'boolean' },
  { key: 'wholesale_price_eur', label: 'Wholesale price', format: 'price' },
  { key: 'consumer_price_eur', label: 'Consumer price', format: 'price' },
  { key: 'retail_price_eur', label: 'Retail price', format: 'price' },
  { key: 'raw_supplier_price_ex_vat', label: 'Raw supplier price ex VAT', format: 'price' },
  { key: 'recycling_fee_eur', label: 'Recycling fee', format: 'price' },
  { key: 'shipping_fee_ex_vat', label: 'Shipping fee ex VAT', format: 'price' },
  { key: 'final_base_price_eur', label: 'Final base price', format: 'price' },
  { key: 'fair_cost_ex_vat', label: 'Fair cost ex VAT', format: 'price' },
  { key: 'fair_cost_reason', label: 'Fair cost reason' },
  { key: 'eu_fuel_class', label: 'EU fuel' },
  { key: 'eu_wet_grip_class', label: 'EU wet grip' },
  { key: 'eu_noise_db', label: 'EU noise dB' },
  { key: 'eu_noise_class', label: 'EU noise class' },
  { key: 'supplier_image_id', label: 'Supplier image ID' },
  { key: 'supplier_image_url', label: 'Supplier image URL' },
  { key: 'last_seen_at', label: 'Last seen', format: 'datetime' },
  { key: 'supplier_metadata_json', label: 'Supplier metadata', format: 'metadata' },
];

function selectedSource(row: ConflictRow): Record<string, unknown> {
  return {
    supplier: row.selected_supplier,
    external_id: row.selected_external_id,
    raw_table: row.selected_raw_table,
    raw_id: row.selected_raw_id,
    selected_reason: row.selected_reason,
    brand: row.brand,
    model: row.model,
    supplier_title: row.supplier_title,
    size_string: row.size_string,
    season: row.season,
    ean: row.ean,
    eprel_code: row.eprel_code,
    width_mm: row.width_mm,
    aspect_ratio: row.aspect_ratio,
    diameter_in: row.diameter_in,
    load_index: row.load_index,
    speed_rating: row.speed_rating,
    stock_qty: row.stock_qty,
    external_stock_qty: null,
    in_stock: row.in_stock,
    wholesale_price_eur: row.wholesale_price_eur,
    consumer_price_eur: row.consumer_price_eur,
    retail_price_eur: row.retail_price_eur,
    recycling_fee_eur: row.recycling_fee_eur,
    final_base_price_eur: row.final_base_price_eur,
    eu_fuel_class: row.eu_fuel_class,
    eu_wet_grip_class: row.eu_wet_grip_class,
    eu_noise_db: row.eu_noise_db,
    eu_noise_class: row.eu_noise_class,
    supplier_image_id: row.supplier_image_id,
    supplier_image_url: row.supplier_image_url,
    last_seen_at: row.last_seen_at,
    raw_supplier_price_ex_vat: row.raw_supplier_price_ex_vat,
    shipping_fee_ex_vat: row.shipping_fee_ex_vat,
    fair_cost_ex_vat: row.fair_cost_ex_vat,
    fair_cost_reason: row.fair_cost_reason,
    supplier_metadata_json: row.supplier_metadata_json,
  };
}

function fieldValue(source: Record<string, unknown>, field: ComparisonField) {
  const value = source[field.key];
  if (field.format === 'price') return formatPrice(numberValue(value));
  if (field.format === 'boolean') return booleanValue(value);
  if (field.format === 'datetime') return datetimeValue(value);
  if (field.format === 'metadata') return metadataValue(value);
  return textValue(value);
}

function ComparisonMatrix({ isDark, columns }: { isDark: boolean; columns: ComparisonColumn[] }) {
  return (
    <div className={`overflow-x-auto rounded-lg border ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
      <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
        <thead>
          <tr className={isDark ? 'bg-white/[0.04]' : 'bg-gray-50'}>
            <th className={`w-52 border-b px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] ${isDark ? 'border-white/10 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
              Field
            </th>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`min-w-72 border-b px-4 py-3 align-top ${isDark ? 'border-white/10' : 'border-gray-200'} ${
                  column.tone === 'selected' ? (isDark ? 'bg-blue-500/10' : 'bg-blue-50') : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em]">{column.title}</p>
                    <p className={`mt-1 text-xs font-normal ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{column.subtitle}</p>
                  </div>
                  {column.onMerge && (
                    <button
                      type="button"
                      onClick={column.onMerge}
                      className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${
                        isDark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      <GitMerge className="h-3.5 w-3.5" />
                      {column.mergeLabel ?? 'Merge metadata'}
                    </button>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARISON_FIELDS.map((field) => (
            <tr key={field.key} className={isDark ? 'odd:bg-white/[0.02]' : 'odd:bg-gray-50/50'}>
              <th className={`border-b px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] ${isDark ? 'border-white/10 text-gray-500' : 'border-gray-200 text-gray-500'}`}>
                {field.label}
              </th>
              {columns.map((column) => (
                <td
                  key={`${column.key}-${field.key}`}
                  className={`border-b px-4 py-2 align-top font-medium ${isDark ? 'border-white/10 text-gray-100' : 'border-gray-200 text-gray-900'} ${
                    field.key === 'supplier_metadata_json' || field.key === 'supplier_image_url' || field.key === 'raw_id'
                      ? 'max-w-[420px] break-words text-xs leading-5'
                      : ''
                  }`}
                >
                  {fieldValue(column.source, field)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TiresConflictResolvePage() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [rows, setRows] = useState<ConflictRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<string>('pending');
  const totalCount = rows[0]?.total_count ?? 0;

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('catalog_list_selected_tire_conflicts_v1', {
        p_conflict_reason: reasonFilter === 'all' ? null : reasonFilter,
        p_review_status: reviewStatusFilter === 'all' ? null : reviewStatusFilter,
        p_limit: 100,
        p_offset: 0,
      });
      if (error) throw error;
      setRows((data ?? []) as ConflictRow[]);
    } catch (err: any) {
      console.error('Load tire conflicts failed:', err);
      setError(err?.message ?? 'Failed to load conflicts');
    } finally {
      setLoading(false);
    }
  }, [reasonFilter, reviewStatusFilter]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const markReviewed = async (row: ConflictRow, action: 'accept_selected' | 'keep_for_manual_review') => {
    setSavingId(row.selected_item_id);
    setError(null);
    try {
      const { error } = await supabase.rpc('catalog_set_selected_item_review_v1', {
        p_selected_item_id: row.selected_item_id,
        p_review_status: action === 'accept_selected' ? 'accepted' : 'needs_supplier_check',
        p_resolution_action: action,
        p_selected_supplier: row.selected_supplier,
        p_selected_external_id: row.selected_external_id,
        p_notes: action === 'accept_selected' ? 'Accepted from conflict review page.' : 'Kept for supplier/manual check.',
      });
      if (error) throw error;
      await loadRows();
    } catch (err: any) {
      console.error('Save tire conflict review failed:', err);
      setError(err?.message ?? 'Failed to save review');
    } finally {
      setSavingId(null);
    }
  };

  const mergeMetadata = async (row: ConflictRow, offer: Record<string, unknown>, index: number) => {
    const supplier = textValue(offer.supplier);
    const externalId = textValue(offer.external_id);
    setSavingId(`${row.selected_item_id}:merge:${index}`);
    setError(null);
    try {
      const { error } = await supabase.rpc('catalog_set_selected_item_review_v1', {
        p_selected_item_id: row.selected_item_id,
        p_review_status: 'needs_supplier_check',
        p_resolution_action: 'fix_source_data',
        p_selected_supplier: supplier === '-' ? row.selected_supplier : supplier,
        p_selected_external_id: externalId === '-' ? row.selected_external_id : externalId,
        p_notes: `Merge metadata from ${supplier} #${externalId}.`,
      });
      if (error) throw error;
      await loadRows();
    } catch (err: any) {
      console.error('Merge metadata review failed:', err);
      setError(err?.message ?? 'Failed to mark metadata merge');
    } finally {
      setSavingId(null);
    }
  };

  const pageTitle = language === 'fi' ? 'Rengaskonfliktit' : 'Tire conflicts';
  const helperText = useMemo(
    () =>
      language === 'fi'
        ? 'Tarkista uuden selected catalog -kerroksen konfliktit ennen kuin data wiretetään webshoppiin.'
        : 'Review conflicts from the new selected catalog layer before wiring data into the webshop.',
    [language],
  );

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0B0D10] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className={`border-b ${isDark ? 'border-white/10 bg-[#161A22]' : 'border-gray-200 bg-white'}`}>
        <div className="px-8 py-6">
          <button
            type="button"
            onClick={() => navigateTo('/cms/tires')}
            className={`mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
              isDark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            {language === 'fi' ? 'Takaisin Tire CMS:ään' : 'Back to Tire CMS'}
          </button>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
                <h1 className="text-3xl font-semibold">{pageTitle}</h1>
              </div>
              <p className={`mt-2 max-w-3xl text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{helperText}</p>
            </div>
            <button
              type="button"
              onClick={() => void loadRows()}
              disabled={loading}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                isDark ? 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-white/10' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-200'
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {language === 'fi' ? 'Päivitä' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-5">
        <div className={`mb-5 rounded-lg border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{language === 'fi' ? 'Näytetään' : 'Showing'} </span>
              <span className="font-semibold">{rows.length}</span>
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}> / {totalCount}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={reasonFilter}
                onChange={(event) => setReasonFilter(event.target.value)}
                className={`rounded-lg border px-3 py-2 text-sm ${isDark ? 'border-white/20 bg-[#1C1C1E] text-white' : 'border-gray-300 bg-white text-gray-900'}`}
              >
                <option value="all">{language === 'fi' ? 'Kaikki syyt' : 'All reasons'}</option>
                {CONFLICT_REASONS.map((reason) => (
                  <option key={reason.value} value={reason.value}>{reason.label}</option>
                ))}
              </select>
              <select
                value={reviewStatusFilter}
                onChange={(event) => setReviewStatusFilter(event.target.value)}
                className={`rounded-lg border px-3 py-2 text-sm ${isDark ? 'border-white/20 bg-[#1C1C1E] text-white' : 'border-gray-300 bg-white text-gray-900'}`}
              >
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="needs_supplier_check">Needs supplier check</option>
                <option value="all">All statuses</option>
              </select>
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        </div>

        <div className="space-y-4">
          {loading && rows.length === 0 ? (
            <div className={`rounded-lg border p-8 text-center ${isDark ? 'border-white/10 bg-white/5 text-gray-300' : 'border-gray-200 bg-white text-gray-600'}`}>
              {language === 'fi' ? 'Ladataan konflikteja...' : 'Loading conflicts...'}
            </div>
          ) : rows.length === 0 ? (
            <div className={`rounded-lg border p-8 text-center ${isDark ? 'border-white/10 bg-white/5 text-gray-300' : 'border-gray-200 bg-white text-gray-600'}`}>
              {language === 'fi' ? 'Ei konflikteja tällä suodatuksella.' : 'No conflicts for this filter.'}
            </div>
          ) : (
            rows.map((row) => (
              <div key={row.selected_item_id} className={`rounded-lg border ${isDark ? 'border-white/10 bg-[#161A22]' : 'border-gray-200 bg-white'}`}>
                <div className="flex flex-col gap-3 border-b border-current/10 p-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className={`mb-2 text-xs font-semibold uppercase tracking-[0.14em] ${isDark ? 'text-amber-200' : 'text-amber-700'}`}>
                      Item need resolve
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{row.brand} {row.model}</span>
                      <span className={`rounded-full px-2 py-1 text-xs ${isDark ? 'bg-amber-500/15 text-amber-200' : 'bg-amber-50 text-amber-700'}`}>
                        {row.conflict_reason ?? 'conflict'}
                      </span>
                      <span className={`rounded-full px-2 py-1 text-xs ${isDark ? 'bg-white/10 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
                        {row.match_confidence}
                      </span>
                    </div>
                    <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {row.size_string} | EAN {row.ean ?? '-'} | EPREL {row.eprel_code ?? '-'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void markReviewed(row, 'accept_selected')}
                      disabled={savingId === row.selected_item_id}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                        isDark ? 'bg-green-500 text-white hover:bg-green-600 disabled:bg-white/10' : 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-200'
                      }`}
                    >
                      <Check className="h-4 w-4" />
                      Accept selected
                    </button>
                    <button
                      type="button"
                      onClick={() => void markReviewed(row, 'keep_for_manual_review')}
                      disabled={savingId === row.selected_item_id}
                      className={`rounded-lg px-3 py-2 text-sm font-medium ${
                        isDark ? 'bg-white/10 text-white hover:bg-white/15 disabled:text-gray-500' : 'bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:text-gray-400'
                      }`}
                    >
                      Keep review
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  {row.alternative_offers_json?.length ? (
                    <ComparisonMatrix
                      isDark={isDark}
                      columns={[
                        {
                          key: `${row.selected_item_id}-selected`,
                          title: 'Selected item',
                          subtitle: `${row.selected_supplier} #${row.selected_external_id}`,
                          tone: 'selected',
                          source: selectedSource(row),
                        },
                        ...row.alternative_offers_json.map((offer, index) => ({
                          key: `${row.selected_item_id}-candidate-${index}`,
                          title: `Candidate ${index + 1}`,
                          subtitle: `${textValue(offer.supplier)} #${textValue(offer.external_id)}`,
                          tone: 'candidate' as const,
                          source: offer,
                          mergeLabel: savingId === `${row.selected_item_id}:merge:${index}` ? 'Saving...' : 'Merge metadata',
                          onMerge: () => void mergeMetadata(row, offer, index),
                        })),
                      ]}
                    />
                  ) : (
                    <div className={`rounded-lg border p-4 text-sm ${isDark ? 'border-white/10 bg-white/[0.04] text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
                      No candidate offers for this item.
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
