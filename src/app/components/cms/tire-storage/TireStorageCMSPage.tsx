import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowLeftRight,
  Boxes,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Loader2,
  MapPin,
  PackageCheck,
  RefreshCcw,
  Search,
  ShieldCheck,
  Warehouse,
  X,
} from 'lucide-react';

import { useLanguage } from '../../../i18n/LanguageContext';
import { useTheme } from '../../../theme/ThemeContext';
import { supabase } from '../../../utils/supabase/client';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Skeleton } from '../../ui/skeleton';

type TireStorageStatus = 'all' | 'stored' | 'checked_out' | 'reserved' | 'removed' | 'lost' | 'disposed';
type TireStorageSummaryKey = 'stored' | 'checked_out' | 'reserved' | 'attention';

type TireStorageRow = {
  id: string;
  status: string | null;
  customer_id: string | null;
  customer_vehicle_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  license_plate: string | null;
  location_code: string | null;
  tire_brand_text: string | null;
  tire_size_text: string | null;
  tire_season: string | null;
  rim_text: string | null;
  quantity: number | null;
  condition_status: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  payment_status: string | null;
  price_cents: number | null;
  total_count: number | null;
};

type TireStorageDetail = {
  set?: Record<string, any>;
  customer?: Record<string, any> | null;
  vehicle?: Record<string, any> | null;
  location?: Record<string, any> | null;
  events?: Array<Record<string, any>>;
  photos?: Array<Record<string, any>>;
};

const PAGE_SIZE = 25;
const STORAGE_STATUSES: TireStorageStatus[] = ['all', 'stored', 'reserved', 'checked_out', 'removed', 'lost', 'disposed'];
const SUMMARY_KEYS: TireStorageSummaryKey[] = ['stored', 'reserved', 'checked_out', 'attention'];
const STORAGE_LOCALE_BY_LANGUAGE: Record<string, string> = {
  fi: 'fi-FI',
  en: 'en-US',
};

function getStorageLocale(language: string): string {
  return STORAGE_LOCALE_BY_LANGUAGE[language] ?? 'en-US';
}

function formatDate(value: string | null | undefined, language: string): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat(getStorageLocale(language), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatMoney(cents: number | null | undefined, language: string): string {
  if (cents === null || cents === undefined) return '-';
  return new Intl.NumberFormat(getStorageLocale(language), {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

function getStatusTone(status: string | null | undefined, isDark: boolean): string {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'stored') return isDark ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (normalized === 'reserved') return isDark ? 'border-blue-400/30 bg-blue-400/10 text-blue-200' : 'border-blue-200 bg-blue-50 text-blue-700';
  if (normalized === 'checked_out') return isDark ? 'border-slate-400/30 bg-slate-400/10 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700';
  if (normalized === 'removed' || normalized === 'disposed') return isDark ? 'border-zinc-400/30 bg-zinc-400/10 text-zinc-300' : 'border-zinc-200 bg-zinc-50 text-zinc-700';
  if (normalized === 'lost') return isDark ? 'border-red-400/30 bg-red-400/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700';
  return isDark ? 'border-amber-400/30 bg-amber-400/10 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-700';
}

function getConditionTone(condition: string | null | undefined, isDark: boolean): string {
  const normalized = (condition ?? '').toLowerCase();
  if (!normalized || normalized === 'unknown') return isDark ? 'border-white/10 bg-white/5 text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-700';
  if (normalized === 'good') return isDark ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (normalized === 'worn' || normalized === 'damaged' || normalized === 'review_needed') return isDark ? 'border-amber-400/30 bg-amber-400/10 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-700';
  return isDark ? 'border-red-400/30 bg-red-400/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700';
}

function normalizeLabel(value: string | null | undefined): string {
  if (!value) return '-';
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function TireStorageTableSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <>
      {Array.from({ length: PAGE_SIZE }).map((_, index) => (
        <tr key={`storage-skeleton-${index}`} className={isDark ? 'border-white/10' : 'border-gray-200'}>
          {Array.from({ length: 8 }).map((__, cellIndex) => (
            <td key={`storage-skeleton-${index}-${cellIndex}`} className="px-4 py-3">
              <Skeleton className="h-5 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function getSummaryTone(key: TireStorageSummaryKey, isDark: boolean): string {
  if (key === 'stored') return isDark ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (key === 'reserved') return isDark ? 'border-blue-400/20 bg-blue-400/10 text-blue-200' : 'border-blue-200 bg-blue-50 text-blue-700';
  if (key === 'checked_out') return isDark ? 'border-zinc-400/20 bg-zinc-400/10 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-700';
  return isDark ? 'border-amber-400/20 bg-amber-400/10 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-700';
}

export function TireStorageCMSPage() {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [rows, setRows] = useState<TireStorageRow[]>([]);
  const [summary, setSummary] = useState<Record<TireStorageSummaryKey, number>>({
    stored: 0,
    checked_out: 0,
    reserved: 0,
    attention: 0,
  });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TireStorageStatus>('stored');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TireStorageDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const selectedRow = rows.find((row) => row.id === selectedId) ?? null;

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('cms_tire_storage_list', {
        p_search: search || null,
        p_status: status === 'all' ? null : status,
        p_limit: PAGE_SIZE,
        p_offset: (page - 1) * PAGE_SIZE,
      });

      if (rpcError) throw rpcError;

      const nextRows = (data ?? []) as TireStorageRow[];
      setRows(nextRows);
      setTotalCount(Number(nextRows[0]?.total_count ?? 0));
      if (selectedId && !nextRows.some((row) => row.id === selectedId)) {
        setSelectedId(null);
        setDetail(null);
      }
    } catch (loadError) {
      console.error('Fetch tire storage error:', loadError);
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedId, status]);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const [stored, reserved, checkedOut, damaged, unknown] = await Promise.all([
        supabase.rpc('cms_tire_storage_list', { p_search: null, p_status: 'stored', p_limit: 1, p_offset: 0 }),
        supabase.rpc('cms_tire_storage_list', { p_search: null, p_status: 'reserved', p_limit: 1, p_offset: 0 }),
        supabase.rpc('cms_tire_storage_list', { p_search: null, p_status: 'checked_out', p_limit: 1, p_offset: 0 }),
        supabase.from('tire_storage_sets').select('id', { count: 'exact', head: true }).in('condition_status', ['damaged', 'worn', 'review_needed']),
        supabase.from('tire_storage_import_rows').select('id', { count: 'exact', head: true }).eq('review_status', 'pending'),
      ]);

      const firstCount = (result: { data: any[] | null }) => Number(result.data?.[0]?.total_count ?? 0);
      setSummary({
        stored: firstCount(stored),
        reserved: firstCount(reserved),
        checked_out: firstCount(checkedOut),
        attention: Number(damaged.count ?? 0) + Number(unknown.count ?? 0),
      });
    } catch (summaryError) {
      console.error('Fetch tire storage summary error:', summaryError);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('cms_tire_storage_get', {
        p_storage_set_id: id,
      });
      if (rpcError) throw rpcError;
      setDetail((data ?? null) as TireStorageDetail | null);
    } catch (detailError) {
      console.error('Fetch tire storage detail error:', detailError);
      toast.error(detailError instanceof Error ? detailError.message : t('tireStorageCms.loadFailed'));
    } finally {
      setDetailLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (!selectedId) return;
    void loadDetail(selectedId);
  }, [loadDetail, selectedId]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleRefresh = () => {
    void loadRows();
    void loadSummary();
    if (selectedId) void loadDetail(selectedId);
  };

  const handleCheckOut = async (row: TireStorageRow) => {
    if (actionId) return;
    if (typeof window !== 'undefined' && !window.confirm(t('tireStorageCms.confirmCheckOut', { plate: row.license_plate ?? '-' }))) return;

    setActionId(row.id);
    try {
      const { error: rpcError } = await supabase.rpc('cms_tire_storage_check_out', {
        p_storage_set_id: row.id,
        p_reason: 'cms_checkout',
        p_booking_id: null,
        p_order_id: null,
        p_notes: null,
      });
      if (rpcError) throw rpcError;
      toast.success(t('tireStorageCms.checkedOut'));
      handleRefresh();
    } catch (checkOutError) {
      console.error('Tire storage checkout error:', checkOutError);
      toast.error(checkOutError instanceof Error ? checkOutError.message : t('tireStorageCms.actionFailed'));
    } finally {
      setActionId(null);
    }
  };

  const handleReturn = async (row: TireStorageRow) => {
    if (actionId) return;
    if (typeof window !== 'undefined' && !window.confirm(t('tireStorageCms.confirmReturn', { plate: row.license_plate ?? '-' }))) return;

    setActionId(row.id);
    try {
      const { error: rpcError } = await supabase.rpc('cms_tire_storage_return_to_storage', {
        p_storage_set_id: row.id,
        p_location_id: null,
        p_notes: null,
      });
      if (rpcError) throw rpcError;
      toast.success(t('tireStorageCms.returned'));
      handleRefresh();
    } catch (returnError) {
      console.error('Tire storage return error:', returnError);
      toast.error(returnError instanceof Error ? returnError.message : t('tireStorageCms.actionFailed'));
    } finally {
      setActionId(null);
    }
  };

  const summaryCards = useMemo(() => {
    return SUMMARY_KEYS.map((key) => {
      const icon = key === 'stored'
        ? Warehouse
        : key === 'reserved'
          ? CalendarDays
          : key === 'checked_out'
            ? ArrowLeftRight
            : AlertTriangle;
      return {
        key,
        icon,
        value: summary[key],
        label: t(`tireStorageCms.summary.${key}`),
      };
    });
  }, [summary, t]);

  const tableRows = loading ? [] : rows;
  const fillerRows = Math.max(0, PAGE_SIZE - tableRows.length);
  const shellClass = isDark ? 'bg-[#0B0E13] text-white' : 'bg-[#F4F6F8] text-gray-950';
  const panelClass = isDark ? 'border-white/10 bg-[#151B24] shadow-[0_20px_70px_-48px_rgba(0,0,0,0.9)]' : 'border-gray-200 bg-white shadow-[0_24px_80px_-60px_rgba(15,23,42,0.45)]';
  const softPanelClass = isDark ? 'border-white/10 bg-white/[0.035]' : 'border-gray-200 bg-gray-50/80';
  const inputClass = isDark ? 'border-white/10 bg-[#0B0E13] text-white placeholder:text-gray-600 focus-visible:ring-blue-500/40' : 'border-gray-200 bg-white';
  const subtleTextClass = isDark ? 'text-gray-400' : 'text-gray-600';
  const mutedTextClass = isDark ? 'text-gray-500' : 'text-gray-500';

  return (
    <div className={`min-h-[760px] ${shellClass}`}>
      <div className={`border-b ${isDark ? 'border-white/10 bg-[#0F141C]' : 'border-gray-200 bg-white'}`}>
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,520px)] lg:items-end">
            <div className="max-w-4xl">
              <div className={`mb-4 inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${isDark ? 'border-white/10 bg-white/5 text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
                <ShieldCheck className="size-3.5" />
                {t('tireStorageCms.operationalWorkspace')}
              </div>
              <h2 className="text-4xl font-semibold leading-none tracking-tight sm:text-5xl">
                {t('tireStorageCms.title')}
              </h2>
              <p className={`mt-4 max-w-3xl text-sm leading-6 ${subtleTextClass}`}>
                {t('tireStorageCms.description')}
              </p>
            </div>

            <div className={`rounded-xl border p-3 ${softPanelClass}`}>
              <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_168px_auto] sm:items-end">
                <div>
                  <Label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.08em] ${mutedTextClass}`}>
                    {t('tireStorageCms.searchLabel')}
                  </Label>
                  <div className="relative">
                    <Search className={`pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 ${mutedTextClass}`} />
                    <Input
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      placeholder={t('tireStorageCms.searchPlaceholder')}
                      className={`h-10 rounded-lg pl-9 ${inputClass}`}
                    />
                  </div>
                </div>
                <div>
                  <Label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.08em] ${mutedTextClass}`}>
                    {t('tireStorageCms.statusLabel')}
                  </Label>
                  <Select value={status} onValueChange={(value) => {
                    setStatus(value as TireStorageStatus);
                    setPage(1);
                  }}>
                    <SelectTrigger className={`h-10 rounded-lg ${inputClass}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STORAGE_STATUSES.map((statusOption) => (
                        <SelectItem key={statusOption} value={statusOption}>
                          {t(`tireStorageCms.status.${statusOption}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="h-10 rounded-lg bg-blue-600 text-white transition-transform hover:bg-blue-700 active:scale-[0.98]">
                  {t('tireStorageCms.search')}
                </Button>
              </form>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.key} className={`group rounded-xl border p-4 transition-transform active:scale-[0.99] ${panelClass}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`truncate text-[11px] font-semibold uppercase tracking-[0.12em] ${mutedTextClass}`}>{card.label}</p>
                      <p className="mt-3 text-3xl font-semibold leading-none tracking-tight">
                        {summaryLoading ? '-' : card.value.toLocaleString(getStorageLocale(language))}
                      </p>
                    </div>
                    <span className={`inline-flex size-10 shrink-0 items-center justify-center rounded-lg border ${getSummaryTone(card.key, isDark)}`}>
                      <Icon className="size-5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6 lg:p-8">
        <div className={`overflow-hidden rounded-xl border ${panelClass}`}>
          <div className={`flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                {t('tireStorageCms.showingCount', {
                  count: totalCount,
                  page,
                  pages: totalPages,
                })}
              </p>
              {error ? (
                <p className="mt-1 text-sm text-red-500">{error}</p>
              ) : (
                <p className={`mt-1 text-xs ${mutedTextClass}`}>{t(`tireStorageCms.status.${status}`)}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={handleRefresh} className={`h-9 rounded-lg transition-transform active:scale-[0.98] ${isDark ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border-gray-200 bg-white'}`}>
                <RefreshCcw className="mr-2 size-4" />
                {t('tireStorageCms.refresh')}
              </Button>
              <Button type="button" className="h-9 rounded-lg bg-blue-600 text-white transition-transform hover:bg-blue-700 active:scale-[0.98]">
                <PackageCheck className="mr-2 size-4" />
                {t('tireStorageCms.newCheckIn')}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="min-w-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1080px] table-fixed">
                  <thead className={isDark ? 'bg-white/[0.035]' : 'bg-gray-50'}>
                    <tr>
                      <th className={`w-[116px] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] ${mutedTextClass}`}>{t('tireStorageCms.table.location')}</th>
                      <th className={`w-[188px] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] ${mutedTextClass}`}>{t('tireStorageCms.table.customer')}</th>
                      <th className={`w-[112px] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] ${mutedTextClass}`}>{t('tireStorageCms.table.plate')}</th>
                      <th className={`w-[268px] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] ${mutedTextClass}`}>{t('tireStorageCms.table.tires')}</th>
                      <th className={`w-[72px] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] ${mutedTextClass}`}>{t('tireStorageCms.table.qty')}</th>
                      <th className={`w-[120px] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] ${mutedTextClass}`}>{t('tireStorageCms.table.condition')}</th>
                      <th className={`w-[116px] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] ${mutedTextClass}`}>{t('tireStorageCms.table.status')}</th>
                      <th className={`w-[132px] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.1em] ${mutedTextClass}`}>{t('tireStorageCms.table.action')}</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-white/10' : 'divide-gray-200'}`}>
                    {loading ? (
                      <TireStorageTableSkeleton isDark={isDark} />
                    ) : tableRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className={`h-[104px] px-4 py-8 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {t('tireStorageCms.empty')}
                        </td>
                      </tr>
                    ) : (
                      tableRows.map((row) => (
                        <tr
                          key={row.id}
                          onClick={() => setSelectedId(row.id)}
                          className={`h-[58px] cursor-pointer transition-colors ${
                            selectedId === row.id
                              ? isDark ? 'bg-blue-400/10 shadow-[inset_3px_0_0_rgba(96,165,250,0.95)]' : 'bg-blue-50 shadow-[inset_3px_0_0_rgba(37,99,235,0.95)]'
                              : isDark ? 'hover:bg-white/[0.035]' : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-gray-950'}`}>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex size-7 shrink-0 items-center justify-center rounded-md border ${isDark ? 'border-blue-400/20 bg-blue-400/10 text-blue-200' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
                                <MapPin className="size-3.5" />
                              </span>
                              <span className="truncate font-mono text-sm font-semibold">{row.location_code ?? '-'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className={`truncate text-sm font-medium ${isDark ? 'text-white' : 'text-gray-950'}`}>{row.customer_name ?? '-'}</p>
                            <p className={`truncate text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{row.customer_phone ?? '-'}</p>
                          </td>
                          <td className={`px-4 py-3 font-mono text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{row.license_plate ?? '-'}</td>
                          <td className="px-4 py-3">
                            <p className={`truncate text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                              {[row.tire_brand_text, row.tire_size_text].filter(Boolean).join(' · ') || '-'}
                            </p>
                            <p className={`truncate text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                              {row.rim_text || row.tire_season || '-'}
                            </p>
                          </td>
                          <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.quantity ?? '-'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex max-w-full rounded-full border px-2 py-1 text-[11px] font-semibold ${getConditionTone(row.condition_status, isDark)}`}>
                              <span className="truncate">{normalizeLabel(row.condition_status)}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex max-w-full rounded-full border px-2 py-1 text-[11px] font-semibold ${getStatusTone(row.status, isDark)}`}>
                              <span className="truncate">{normalizeLabel(row.status)}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {row.status === 'stored' || row.status === 'reserved' ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={actionId === row.id}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleCheckOut(row);
                                }}
                                className={`h-8 rounded-md transition-transform active:scale-[0.98] ${isDark ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border-gray-200 bg-white'}`}
                              >
                                {actionId === row.id ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : <ArrowLeftRight className="mr-2 size-3.5" />}
                                {t('tireStorageCms.checkOut')}
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={actionId === row.id}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleReturn(row);
                                }}
                                className={`h-8 rounded-md transition-transform active:scale-[0.98] ${isDark ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border-gray-200 bg-white'}`}
                              >
                                {actionId === row.id ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : <Warehouse className="mr-2 size-3.5" />}
                                {t('tireStorageCms.return')}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                    {!loading && tableRows.length > 0 && Array.from({ length: fillerRows }).map((_, index) => (
                      <tr key={`storage-filler-${index}`} aria-hidden="true" className="invisible">
                        <td className="px-4 py-3" colSpan={8}>-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={`flex items-center justify-between border-t px-4 py-3 ${isDark ? 'border-white/10 bg-[#111720]' : 'border-gray-200 bg-gray-50/70'}`}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className={`rounded-lg transition-transform active:scale-[0.98] ${isDark ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border-gray-200 bg-white'}`}
                >
                  <ChevronLeft className="mr-2 size-4" />
                  {t('tireStorageCms.previous')}
                </Button>
                <span className={`rounded-md px-2 py-1 font-mono text-sm ${isDark ? 'bg-white/5 text-gray-300' : 'bg-white text-gray-600'}`}>
                  {page} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  className={`rounded-lg transition-transform active:scale-[0.98] ${isDark ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border-gray-200 bg-white'}`}
                >
                  {t('tireStorageCms.next')}
                  <ChevronRight className="ml-2 size-4" />
                </Button>
              </div>
            </div>

            <aside className={`border-t p-4 xl:border-l xl:border-t-0 ${isDark ? 'border-white/10 bg-[#101720]' : 'border-gray-200 bg-gray-50/80'}`}>
              {!selectedRow ? (
                <div className={`flex min-h-[520px] flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center ${isDark ? 'border-white/10 text-gray-400' : 'border-gray-300 text-gray-600'}`}>
                  <span className={`mb-4 inline-flex size-12 items-center justify-center rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}>
                    <Boxes className="size-6" />
                  </span>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-950'}`}>{t('tireStorageCms.detailEmptyTitle')}</p>
                  <p className="mt-2 max-w-[260px] text-sm leading-6">{t('tireStorageCms.detailEmptyBody')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-white/[0.035]' : 'border-gray-200 bg-white'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${mutedTextClass}`}>{t('tireStorageCms.selectedSet')}</p>
                        <h3 className="mt-2 truncate font-mono text-3xl font-semibold tracking-tight">{selectedRow.license_plate ?? '-'}</h3>
                        <p className={`mt-1 truncate text-sm ${subtleTextClass}`}>{selectedRow.customer_name ?? '-'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(null);
                          setDetail(null);
                        }}
                        className={`rounded-lg p-2 transition-transform active:scale-[0.95] ${isDark ? 'text-gray-400 hover:bg-white/10 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <span className={`rounded-lg border px-3 py-2 text-xs font-semibold ${getStatusTone(selectedRow.status, isDark)}`}>
                        {normalizeLabel(selectedRow.status)}
                      </span>
                      <span className={`rounded-lg border px-3 py-2 text-xs font-semibold ${getConditionTone(selectedRow.condition_status, isDark)}`}>
                        {normalizeLabel(selectedRow.condition_status)}
                      </span>
                    </div>
                  </div>

                  <div className="hidden items-start justify-between gap-3">
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-[0.08em] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{t('tireStorageCms.selectedSet')}</p>
                      <h3 className={`mt-1 text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-950'}`}>{selectedRow.license_plate ?? '-'}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(null);
                        setDetail(null);
                      }}
                      className={`rounded-lg p-2 ${isDark ? 'text-gray-400 hover:bg-white/10 hover:text-white' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-900'}`}
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  {detailLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 6 }).map((_, index) => <Skeleton key={`detail-skeleton-${index}`} className="h-12 w-full" />)}
                    </div>
                  ) : (
                    <>
                      <div className={`rounded-xl border p-4 ${softPanelClass}`}>
                        <p className={`mb-3 text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-950'}`}>{t('tireStorageCms.detail.customer')}</p>
                        <div className={`space-y-2 text-sm ${subtleTextClass}`}>
                          <p className="truncate">{selectedRow.customer_name ?? '-'}</p>
                          <p className="truncate font-mono text-xs">{selectedRow.customer_phone ?? '-'}</p>
                        </div>
                      </div>

                      <div className={`rounded-xl border p-4 ${softPanelClass}`}>
                        <p className={`mb-3 text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-950'}`}>{t('tireStorageCms.detail.storage')}</p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className={mutedTextClass}>{t('tireStorageCms.table.location')}</p>
                            <p className={`font-mono ${isDark ? 'text-white' : 'text-gray-950'}`}>{selectedRow.location_code ?? '-'}</p>
                          </div>
                          <div>
                            <p className={mutedTextClass}>{t('tireStorageCms.table.status')}</p>
                            <p className={isDark ? 'text-white' : 'text-gray-950'}>{normalizeLabel(selectedRow.status)}</p>
                          </div>
                          <div>
                            <p className={mutedTextClass}>{t('tireStorageCms.checkedIn')}</p>
                            <p className={isDark ? 'text-white' : 'text-gray-950'}>{formatDate(selectedRow.checked_in_at, language)}</p>
                          </div>
                          <div>
                            <p className={mutedTextClass}>{t('tireStorageCms.checkedOutAt')}</p>
                            <p className={isDark ? 'text-white' : 'text-gray-950'}>{formatDate(selectedRow.checked_out_at, language)}</p>
                          </div>
                        </div>
                      </div>

                      <div className={`rounded-xl border p-4 ${softPanelClass}`}>
                        <p className={`mb-3 text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-950'}`}>{t('tireStorageCms.detail.tires')}</p>
                        <div className={`space-y-2 text-sm ${subtleTextClass}`}>
                          <p>{[selectedRow.tire_brand_text, selectedRow.tire_size_text].filter(Boolean).join(' · ') || '-'}</p>
                          <p>{selectedRow.rim_text || '-'}</p>
                          <p>{t('tireStorageCms.quantityValue', { count: selectedRow.quantity ?? '-' })}</p>
                        </div>
                      </div>

                      <div className={`rounded-xl border p-4 ${softPanelClass}`}>
                        <p className={`mb-3 text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-950'}`}>{t('tireStorageCms.detail.commercial')}</p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <CircleDollarSign className={`size-4 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
                            <span className={isDark ? 'text-white' : 'text-gray-950'}>{formatMoney(selectedRow.price_cents, language)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className={`size-4 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
                            <span className={isDark ? 'text-white' : 'text-gray-950'}>{normalizeLabel(selectedRow.payment_status)}</span>
                          </div>
                        </div>
                      </div>

                      <div className={`rounded-xl border p-4 ${softPanelClass}`}>
                        <p className={`mb-3 text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-950'}`}>{t('tireStorageCms.detail.timeline')}</p>
                        {(detail?.events ?? []).length === 0 ? (
                          <p className={`text-sm ${mutedTextClass}`}>{t('tireStorageCms.noEvents')}</p>
                        ) : (
                          <div className="space-y-3">
                            {(detail?.events ?? []).slice(0, 5).map((event) => (
                              <div key={event.id ?? `${event.event_type}-${event.created_at}`} className="flex gap-3">
                                <ClipboardCheck className={`mt-0.5 size-4 shrink-0 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
                                <div>
                                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-950'}`}>{normalizeLabel(event.event_type)}</p>
                                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{formatDate(event.created_at, language)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
