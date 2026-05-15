import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AdminSchedulePage } from '../../admin/AdminSchedulePage';
import { AccountCustomerCMSPage } from '../account-customer/AccountCustomerCMSPage';
import { CmsTabErrorBoundary } from '../core/CmsTabErrorBoundary';
import { useCmsAccess } from '../core/CmsAccessContext';
import { InvoicesCMSPage } from '../invoices/InvoicesCMSPage';
import { OrdersCMSPage } from '../orders/OrdersCMSPage';
import { RescueCMSPage } from '../rescue/RescueCMSPage';
import { RimsCMSPage } from '../rims/RimsCMSPage';
import { TiresCMSPage } from '../tires/TiresCMSPage';
import { supabase } from '../../../utils/supabase/client';
import { useLanguage } from '../../../i18n/LanguageContext';

export type CmsTab = 'rescue' | 'schedule' | 'catalog' | 'orders' | 'invoices' | 'account-customer' | 'future';
type CatalogCmsTab = 'tires-finalize' | 'rims-refactor';
type CatalogProductType = 'tire' | 'rim';

type CatalogSyncRun = {
  status: string | null;
  total_items: number | null;
  processed_items: number | null;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
};

type CatalogProductSummary = {
  total: number;
  ready: number;
  notReady: number;
  rdRawLatest: string | null;
  vtRawLatest: string | null;
  selectedLatest: string | null;
  webshopLatest: string | null;
  runningJobs: number;
  stuckJobs: number;
  publicRpcLatencyMs: number | null;
  latestRun: CatalogSyncRun | null;
};

type CatalogHealthSummary = Record<CatalogProductType, CatalogProductSummary>;

const BOOKING_STATUS_HANDOFF = 'handoff';
const CATALOG_TIRE_SYNC_BATCH_SIZE = 500;
const CATALOG_RIM_SYNC_BATCH_SIZE = 150;
const CATALOG_LOCALE_BY_LANGUAGE: Record<string, string> = {
  fi: 'fi-FI',
  en: 'en-US',
};

function normalizeAppPath(path: string): string {
  if (!path) {
    return '/';
  }

  if (path.length > 1 && path.endsWith('/')) {
    return path.replace(/\/+$/, '') || '/';
  }

  return path;
}

function CmsTabContent({ tab }: { tab: CmsTab }) {
  const { t } = useLanguage();

  if (tab === 'rescue') {
    return <RescueCMSPage />;
  }

  if (tab === 'schedule') {
    return <AdminSchedulePage />;
  }

  if (tab === 'catalog') {
    return <CatalogCMSPage />;
  }

  if (tab === 'orders') {
    return <OrdersCMSPage />;
  }

  if (tab === 'invoices') {
    return <InvoicesCMSPage documentScope="receipt" title="Receipt" />;
  }

  if (tab === 'account-customer') {
    return <AccountCustomerCMSPage />;
  }

  return (
    <div className="space-y-2 p-8 text-muted-foreground">
      <h2 className="text-xl font-semibold text-foreground">{t('cmsControl.comingSoon')}</h2>
      <p>{t('cmsControl.reservedModules')}</p>
    </div>
  );
}

function getCatalogLocale(language: string): string {
  return CATALOG_LOCALE_BY_LANGUAGE[language] ?? 'en-US';
}

function formatCatalogNumber(value: number, language: string): string {
  return new Intl.NumberFormat(getCatalogLocale(language)).format(value);
}

function formatCatalogDate(value: string | null | undefined, language: string): string {
  if (!value) return '-';

  return new Intl.DateTimeFormat(getCatalogLocale(language), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getSyncStatusClass(status: string | null | undefined): string {
  const normalized = (status ?? '').toLowerCase();

  if (normalized === 'completed' || normalized === 'success' || normalized === 'succeeded') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (normalized === 'running' || normalized === 'processing' || normalized === 'started') {
    return 'border-blue-200 bg-blue-50 text-blue-700';
  }

  if (normalized === 'failed' || normalized === 'error') {
    return 'border-red-200 bg-red-50 text-red-700';
  }

  return 'border-border bg-muted text-muted-foreground';
}

function getCatalogHealthStatus(item: CatalogProductSummary | null): 'healthy' | 'stale' | 'warning' | 'failed' | 'running' {
  if (!item) return 'warning';
  const latestStatus = (item.latestRun?.status ?? '').toLowerCase();
  const latestFinishedAt = item.latestRun?.finished_at ? new Date(item.latestRun.finished_at).getTime() : 0;
  const staleCutoff = Date.now() - 36 * 60 * 60 * 1000;

  if (latestStatus === 'failed' || latestStatus === 'error' || item.stuckJobs > 0) return 'failed';
  if (item.runningJobs > 0) return 'running';
  if (!item.rdRawLatest || !item.vtRawLatest || !item.selectedLatest || !item.webshopLatest || !latestFinishedAt || latestFinishedAt < staleCutoff) {
    return 'stale';
  }
  if ((item.publicRpcLatencyMs ?? 0) > 1500 || item.ready === 0) return 'warning';
  return 'healthy';
}

function getCatalogHealthStatusClass(status: ReturnType<typeof getCatalogHealthStatus>): string {
  if (status === 'healthy') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'running') return 'border-blue-200 bg-blue-50 text-blue-700';
  if (status === 'failed') return 'border-red-200 bg-red-50 text-red-700';
  if (status === 'stale') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-orange-200 bg-orange-50 text-orange-700';
}

function getCatalogHealthStatusLabel(status: ReturnType<typeof getCatalogHealthStatus>, t: (key: string) => string): string {
  if (status === 'healthy') return t('cmsControl.catalogStatusHealthy');
  if (status === 'running') return t('cmsControl.catalogStatusRunning');
  if (status === 'failed') return t('cmsControl.catalogStatusFailed');
  if (status === 'stale') return t('cmsControl.catalogStatusStale');
  return t('cmsControl.catalogStatusWarning');
}

async function measureCatalogPublicRpcLatency(productType: CatalogProductType): Promise<number | null> {
  const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const result = productType === 'tire'
    ? await supabase.rpc('catalog_list_tires_v1', {
        p_limit: 1,
        p_offset: 0,
      })
    : await supabase.rpc('catalog_list_rims_v1', {
        p_limit: 1,
        p_offset: 0,
      });

  if (result.error) throw result.error;
  const finishedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
  return Math.round(finishedAt - startedAt);
}

async function fetchCatalogProductSummary(productType: CatalogProductType): Promise<CatalogProductSummary> {
  const syncTable = productType === 'tire' ? 'webshop_tire_sync_runs' : 'webshop_rim_sync_runs';
  const rdRawTable = productType === 'tire' ? 'supplier_raw_rd_tires' : 'supplier_raw_rd_rims';
  const vtRawTable = productType === 'tire' ? 'supplier_raw_vt_tires' : 'supplier_raw_vt_rims';
  const webshopTimestampColumn = productType === 'tire' ? 'last_synced_at' : 'last_rim_synced_at';

  const [
    totalResult,
    readyResult,
    latestRunResult,
    rdRawResult,
    vtRawResult,
    selectedResult,
    webshopResult,
    runningJobsResult,
    stuckJobsResult,
    publicRpcLatencyMs,
  ] = await Promise.all([
    supabase
      .from('webshop_items')
      .select('*', { count: 'exact', head: true })
      .eq('product_type', productType),
    supabase
      .from('webshop_items')
      .select('*', { count: 'exact', head: true })
      .eq('product_type', productType)
      .eq('product_ready', true),
    supabase
      .from(syncTable)
      .select('status,total_items,processed_items,error_message,started_at,finished_at')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from(rdRawTable)
      .select('fetched_at')
      .order('fetched_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from(vtRawTable)
      .select('fetched_at')
      .order('fetched_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('catalog_selected_items')
      .select('last_selected_at,updated_at')
      .eq('product_type', productType)
      .order('last_selected_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('webshop_items')
      .select(webshopTimestampColumn)
      .eq('product_type', productType)
      .order(webshopTimestampColumn, { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from(syncTable)
      .select('*', { count: 'exact', head: true })
      .in('status', ['running', 'processing', 'started']),
    supabase
      .from(syncTable)
      .select('*', { count: 'exact', head: true })
      .in('status', ['running', 'processing', 'started'])
      .eq('processed_items', 0)
      .lt('started_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()),
    measureCatalogPublicRpcLatency(productType),
  ]);

  if (totalResult.error) throw totalResult.error;
  if (readyResult.error) throw readyResult.error;
  if (latestRunResult.error) throw latestRunResult.error;
  if (rdRawResult.error) throw rdRawResult.error;
  if (vtRawResult.error) throw vtRawResult.error;
  if (selectedResult.error) throw selectedResult.error;
  if (webshopResult.error) throw webshopResult.error;
  if (runningJobsResult.error) throw runningJobsResult.error;
  if (stuckJobsResult.error) throw stuckJobsResult.error;

  const total = totalResult.count ?? 0;
  const ready = readyResult.count ?? 0;
  const selectedRow = selectedResult.data as { last_selected_at?: string | null; updated_at?: string | null } | null;
  const webshopRow = webshopResult.data as Record<string, string | null> | null;

  return {
    total,
    ready,
    notReady: Math.max(total - ready, 0),
    rdRawLatest: ((rdRawResult.data as { fetched_at?: string | null } | null)?.fetched_at) ?? null,
    vtRawLatest: ((vtRawResult.data as { fetched_at?: string | null } | null)?.fetched_at) ?? null,
    selectedLatest: selectedRow?.last_selected_at ?? selectedRow?.updated_at ?? null,
    webshopLatest: webshopRow?.[webshopTimestampColumn] ?? null,
    runningJobs: runningJobsResult.count ?? 0,
    stuckJobs: stuckJobsResult.count ?? 0,
    publicRpcLatencyMs,
    latestRun: latestRunResult.data as CatalogSyncRun | null,
  };
}

function CatalogHealthPanel({
  activeTab,
  summary,
  loading,
  error,
  tireAction,
  rimAction,
  maintenanceAction,
  onApplyTirePublish,
  onApplyRimPublish,
  onRebuildSelectedTires,
  onRebuildSelectedRims,
  onCloseStaleRuns,
  onRefresh,
}: {
  activeTab: CatalogCmsTab;
  summary: CatalogHealthSummary | null;
  loading: boolean;
  error: string | null;
  tireAction: 'publish' | 'rebuild' | null;
  rimAction: 'publish' | 'rebuild' | null;
  maintenanceAction: CatalogProductType | 'all' | null;
  onApplyTirePublish: () => void;
  onApplyRimPublish: () => void;
  onRebuildSelectedTires: () => void;
  onRebuildSelectedRims: () => void;
  onCloseStaleRuns: (productType: CatalogProductType) => void;
  onRefresh: () => void;
}) {
  const { language, t } = useLanguage();
  const products: Array<{ type: CatalogProductType; label: string; active: boolean }> = [
    { type: 'tire', label: t('cmsControl.catalogTiresLabel'), active: activeTab === 'tires-finalize' },
    { type: 'rim', label: t('cmsControl.catalogRimsLabel'), active: activeTab === 'rims-refactor' },
  ];

  return (
    <section className="border-b bg-background px-6 py-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t('cmsControl.catalogHealthTitle')}</h3>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t('cmsControl.catalogHealthDescription')}</p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="min-h-9 rounded-md border bg-card px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? t('cmsControl.catalogRefreshing') : t('cmsControl.catalogRefresh')}
          </button>
        </div>

        {error ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">{t('cmsControl.catalogHealthUnavailable')}</p>
            <p className="mt-1 break-words text-xs">{error}</p>
          </div>
        ) : null}

        <div className="grid gap-3 lg:grid-cols-2">
          {products.map((product) => {
            const item = summary?.[product.type] ?? null;
            const percent = item && item.total > 0 ? Math.round((item.ready / item.total) * 100) : 0;
            const latestRun = item?.latestRun ?? null;
            const syncStatus = latestRun?.status ?? t('cmsControl.catalogSyncUnknown');
            const healthStatus = getCatalogHealthStatus(item);
            const productAction = product.type === 'tire' ? tireAction : rimAction;

            return (
              <div
                key={product.type}
                className={`rounded-lg border bg-card p-4 transition-colors ${
                  product.active ? 'border-primary/35 shadow-sm' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{product.label}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.08em] text-muted-foreground">
                      {t('cmsControl.catalogReadiness')}
                    </p>
                  </div>
                  <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${getSyncStatusClass(latestRun?.status)}`}>
                    {syncStatus}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${getCatalogHealthStatusClass(healthStatus)}`}>
                    {getCatalogHealthStatusLabel(healthStatus, t)}
                  </span>
                  {item?.publicRpcLatencyMs !== null && item?.publicRpcLatencyMs !== undefined ? (
                    <span className="rounded-full border bg-background px-2 py-1 text-xs font-semibold text-muted-foreground">
                      {t('cmsControl.catalogPublicRpcLatency')}: {item.publicRpcLatencyMs}ms
                    </span>
                  ) : null}
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-2xl font-semibold text-foreground">
                      {loading && !item ? '-' : `${percent}%`}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t('cmsControl.catalogReady')}: {item ? formatCatalogNumber(item.ready, language) : '-'} /{' '}
                      {item ? formatCatalogNumber(item.total, language) : '-'}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">{t('cmsControl.catalogTotal')}</p>
                      <p className="mt-1 font-semibold text-foreground">{item ? formatCatalogNumber(item.total, language) : '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('cmsControl.catalogReady')}</p>
                      <p className="mt-1 font-semibold text-foreground">{item ? formatCatalogNumber(item.ready, language) : '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('cmsControl.catalogNotReady')}</p>
                      <p className="mt-1 font-semibold text-foreground">{item ? formatCatalogNumber(item.notReady, language) : '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t pt-3 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-foreground">{t('cmsControl.catalogLatestSync')}</span>
                    <span className="text-muted-foreground">
                      {t('cmsControl.catalogProcessed')}: {latestRun ? formatCatalogNumber(latestRun.processed_items ?? 0, language) : '-'} /{' '}
                      {latestRun ? formatCatalogNumber(latestRun.total_items ?? 0, language) : '-'}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <p className="text-muted-foreground">
                      {t('cmsControl.catalogStarted')}: {formatCatalogDate(latestRun?.started_at, language)}
                    </p>
                    <p className="text-muted-foreground">
                      {t('cmsControl.catalogFinished')}: {formatCatalogDate(latestRun?.finished_at, language)}
                    </p>
                  </div>
                  {latestRun?.error_message ? (
                    <p className="mt-2 break-words text-red-600">{latestRun.error_message}</p>
                  ) : null}
                  <div className="mt-3 grid gap-2 border-t pt-3 sm:grid-cols-2">
                    <p className="text-muted-foreground">
                      {t('cmsControl.catalogRdRaw')}: {formatCatalogDate(item?.rdRawLatest, language)}
                    </p>
                    <p className="text-muted-foreground">
                      {t('cmsControl.catalogVtRaw')}: {formatCatalogDate(item?.vtRawLatest, language)}
                    </p>
                    <p className="text-muted-foreground">
                      {t('cmsControl.catalogSelectedLayer')}: {formatCatalogDate(item?.selectedLatest, language)}
                    </p>
                    <p className="text-muted-foreground">
                      {t('cmsControl.catalogWebshopLayer')}: {formatCatalogDate(item?.webshopLatest, language)}
                    </p>
                    <p className="text-muted-foreground">
                      {t('cmsControl.catalogRunningJobs')}: {item ? formatCatalogNumber(item.runningJobs, language) : '-'}
                    </p>
                    <p className="text-muted-foreground">
                      {t('cmsControl.catalogStuckJobs')}: {item ? formatCatalogNumber(item.stuckJobs, language) : '-'}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 border-t pt-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={product.type === 'tire' ? onRebuildSelectedTires : onRebuildSelectedRims}
                      disabled={loading || productAction !== null}
                      className="min-h-9 flex-1 rounded-md border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {productAction === 'rebuild'
                        ? t('cmsControl.catalogRebuildingSelected')
                        : product.type === 'tire'
                          ? t('cmsControl.catalogRebuildSelectedTires')
                          : t('cmsControl.catalogRebuildSelectedRims')}
                    </button>
                    <button
                      type="button"
                      onClick={product.type === 'tire' ? onApplyTirePublish : onApplyRimPublish}
                      disabled={loading || productAction !== null}
                      className="min-h-9 flex-1 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {productAction === 'publish'
                        ? t('cmsControl.catalogPublishing')
                        : product.type === 'tire'
                          ? t('cmsControl.catalogApplyTirePublish')
                          : t('cmsControl.catalogApplyRimPublish')}
                    </button>
                  </div>
                  {item?.stuckJobs ? (
                    <div className="mt-3 flex flex-col gap-2 border-t pt-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => onCloseStaleRuns(product.type)}
                        disabled={loading || maintenanceAction !== null}
                        className="min-h-9 flex-1 rounded-md border border-amber-300 bg-amber-50 px-3 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {maintenanceAction === product.type ? t('cmsControl.catalogClosingStaleRuns') : t('cmsControl.catalogCloseStaleRuns')}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {loading && !summary ? (
          <p className="text-sm text-muted-foreground">{t('cmsControl.catalogHealthLoading')}</p>
        ) : null}
      </div>
    </section>
  );
}

function CatalogCMSPage() {
  const { t } = useLanguage();
  const access = useCmsAccess();
  const [catalogHealth, setCatalogHealth] = useState<CatalogHealthSummary | null>(null);
  const [catalogHealthLoading, setCatalogHealthLoading] = useState(true);
  const [catalogHealthError, setCatalogHealthError] = useState<string | null>(null);
  const [tireAction, setTireAction] = useState<'publish' | 'rebuild' | null>(null);
  const [rimAction, setRimAction] = useState<'publish' | 'rebuild' | null>(null);
  const [maintenanceAction, setMaintenanceAction] = useState<CatalogProductType | 'all' | null>(null);
  const canReadModule = (module: string) => {
    if (access?.isSuperAdmin) return true;
    const permission = access?.permissions?.[module];
    return permission === 'read' || permission === 'read_write';
  };
  const catalogTabs = [
    {
      id: 'tires-finalize' as const,
      label: t('cmsControl.catalogTiresLabel'),
      description: t('cmsControl.catalogTiresDescription'),
      module: 'catalog_tires',
    },
    {
      id: 'rims-refactor' as const,
      label: t('cmsControl.catalogRimsLabel'),
      description: t('cmsControl.catalogRimsDescription'),
      module: 'catalog_rims',
    },
  ];
  const visibleCatalogTabs = catalogTabs.filter((tab) => canReadModule(tab.module));
  const initialTab = (() => {
    if (typeof window === 'undefined') return 'tires-finalize' as CatalogCmsTab;
    const hash = window.location.hash.replace('#', '').toLowerCase();
    return hash === 'catalog-rims' || hash === 'catalog/rims' ? 'rims-refactor' : 'tires-finalize';
  })();
  const [activeTab, setActiveTab] = useState<CatalogCmsTab>(initialTab);
  const resolvedActiveTab = visibleCatalogTabs.some((tab) => tab.id === activeTab)
    ? activeTab
    : visibleCatalogTabs[0]?.id;
  const activeCatalogTab = visibleCatalogTabs.find((tab) => tab.id === resolvedActiveTab);
  const handleCatalogTabChange = (tab: CatalogCmsTab) => {
    setActiveTab(tab);
    if (typeof window === 'undefined') return;

    const normalizedPath = normalizeAppPath(window.location.pathname);
    const nextHash = tab === 'rims-refactor' ? '#catalog/rims' : '#catalog/tires';
    window.history.replaceState(window.history.state, '', `${normalizedPath}${nextHash}`);
  };
  const loadCatalogHealth = useCallback(async () => {
    setCatalogHealthLoading(true);
    setCatalogHealthError(null);

    try {
      const [tireSummary, rimSummary] = await Promise.all([
        fetchCatalogProductSummary('tire'),
        fetchCatalogProductSummary('rim'),
      ]);

      setCatalogHealth({
        tire: tireSummary,
        rim: rimSummary,
      });
    } catch (error) {
      console.error('❌ Fetch catalog health error:', error);
      setCatalogHealthError(error instanceof Error ? error.message : String(error));
    } finally {
      setCatalogHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalogHealth();
  }, [loadCatalogHealth]);
  const handleRebuildSelectedTires = useCallback(async () => {
    if (tireAction !== null) return;
    if (typeof window !== 'undefined' && !window.confirm(t('cmsControl.catalogConfirmRebuildTires'))) return;

    setTireAction('rebuild');
    try {
      const { error } = await supabase.rpc('catalog_rebuild_selected_tires_admin_v1');
      if (error) throw error;
      toast.success(t('cmsControl.catalogSelectedTiresRebuilt'));
      await loadCatalogHealth();
    } catch (error) {
      console.error('❌ Rebuild selected tires error:', error);
      toast.error(error instanceof Error ? error.message : t('cmsControl.catalogOperationFailed'));
    } finally {
      setTireAction(null);
    }
  }, [loadCatalogHealth, t, tireAction]);
  const handleRebuildSelectedRims = useCallback(async () => {
    if (rimAction !== null) return;
    if (typeof window !== 'undefined' && !window.confirm(t('cmsControl.catalogConfirmRebuildRims'))) return;

    setRimAction('rebuild');
    try {
      const { error } = await supabase.rpc('catalog_rebuild_selected_rims_admin_v1');
      if (error) throw error;
      toast.success(t('cmsControl.catalogSelectedRimsRebuilt'));
      await loadCatalogHealth();
    } catch (error) {
      console.error('❌ Rebuild selected rims error:', error);
      toast.error(error instanceof Error ? error.message : t('cmsControl.catalogOperationFailed'));
    } finally {
      setRimAction(null);
    }
  }, [loadCatalogHealth, rimAction, t]);
  const handleApplyTirePublish = useCallback(async () => {
    if (tireAction !== null) return;
    if (typeof window !== 'undefined' && !window.confirm(t('cmsControl.catalogConfirmPublishTires'))) return;

    setTireAction('publish');
    try {
      const { error: externalStockError } = await supabase.rpc('catalog_apply_rd_external_stock_v1');
      if (externalStockError) throw externalStockError;

      const { data: startData, error: startError } = await supabase.rpc('start_webshop_tire_items_sync_v1');
      if (startError) throw startError;

      const runId = String((startData as any)?.run_id ?? '');
      if (!runId) throw new Error(t('tiresCatalogSync.missingRunId'));

      let hasMore = Boolean((startData as any)?.has_more);
      while (hasMore) {
        const { data: batchData, error: batchError } = await supabase.rpc('refresh_webshop_tire_items_batch_v1', {
          p_run_id: runId,
          p_batch_size: CATALOG_TIRE_SYNC_BATCH_SIZE,
        });
        if (batchError) throw batchError;
        hasMore = Boolean((batchData as any)?.has_more);
      }

      const { error: finalizeError } = await supabase.rpc('finalize_webshop_tire_items_sync_v1', {
        p_run_id: runId,
      });
      if (finalizeError) throw finalizeError;

      toast.success(t('cmsControl.catalogTirePublishApplied'));
      await loadCatalogHealth();
    } catch (error) {
      console.error('❌ Apply tire publish error:', error);
      toast.error(error instanceof Error ? error.message : t('cmsControl.catalogOperationFailed'));
    } finally {
      setTireAction(null);
    }
  }, [loadCatalogHealth, t, tireAction]);
  const handleApplyRimPublish = useCallback(async () => {
    if (rimAction !== null) return;
    if (typeof window !== 'undefined' && !window.confirm(t('cmsControl.catalogConfirmPublishRims'))) return;

    setRimAction('publish');
    try {
      const { data: startData, error: startError } = await supabase.rpc('start_webshop_rim_items_sync_v1');
      if (startError) throw startError;

      const runId = String((startData as any)?.run_id ?? startData ?? '');
      if (!runId) throw new Error(t('rimsMutations.webshopSyncMissingRunId'));

      let processed = Number((startData as any)?.processed ?? 0);
      let hasMore = Boolean((startData as any)?.has_more ?? true);
      let batchSize = CATALOG_RIM_SYNC_BATCH_SIZE;
      for (let guard = 0; guard < 2500 && hasMore; guard += 1) {
        const { data: batchData, error: batchError } = await supabase.rpc('refresh_webshop_rim_items_batch_v1', {
          p_run_id: runId,
          p_batch_size: batchSize,
        });

        if (batchError) {
          if ((batchError as any)?.code === '57014' && batchSize > 25) {
            batchSize = Math.max(25, Math.floor(batchSize / 2));
            guard -= 1;
            continue;
          }
          throw batchError;
        }

        const batchProcessed = Number((batchData as any)?.batch_processed ?? (batchData as any)?.processed_count ?? 0);
        processed = Number((batchData as any)?.processed ?? processed + batchProcessed);
        hasMore = Boolean((batchData as any)?.has_more);
        if (batchProcessed === 0 && !hasMore) break;
      }

      const { error: finalizeError } = await supabase.rpc('finalize_webshop_rim_items_sync_v1', {
        p_run_id: runId,
      });
      if (finalizeError) throw finalizeError;

      toast.success(t('cmsControl.catalogRimPublishApplied', { processed }));
      await loadCatalogHealth();
    } catch (error) {
      console.error('❌ Apply rim publish error:', error);
      toast.error(error instanceof Error ? error.message : t('cmsControl.catalogOperationFailed'));
    } finally {
      setRimAction(null);
    }
  }, [loadCatalogHealth, rimAction, t]);
  const handleCloseStaleRuns = useCallback(async (productType: CatalogProductType) => {
    if (maintenanceAction !== null) return;
    if (typeof window !== 'undefined' && !window.confirm(t('cmsControl.catalogConfirmCloseStaleRuns'))) return;

    setMaintenanceAction(productType);
    try {
      const { data, error } = await supabase.rpc('catalog_close_stale_zero_progress_sync_runs_admin_v1', {
        p_product_type: productType,
        p_stale_after_minutes: 30,
      });
      if (error) throw error;
      const closed = productType === 'tire'
        ? Number((data as any)?.tires_closed ?? 0)
        : Number((data as any)?.rims_closed ?? 0);
      toast.success(t('cmsControl.catalogStaleRunsClosed', { count: closed }));
      await loadCatalogHealth();
    } catch (error) {
      console.error('❌ Close stale catalog runs error:', error);
      toast.error(error instanceof Error ? error.message : t('cmsControl.catalogOperationFailed'));
    } finally {
      setMaintenanceAction(null);
    }
  }, [loadCatalogHealth, maintenanceAction, t]);

  if (!resolvedActiveTab) {
    return (
      <div className="space-y-2 p-8 text-muted-foreground">
        <h2 className="text-xl font-semibold text-foreground">{t('cmsControl.catalogAccessUnavailable')}</h2>
        <p>{t('cmsControl.catalogAccessUnavailableDescription')}</p>
      </div>
    );
  }

  return (
    <div className="bg-card">
      <div className="flex flex-col gap-4 border-b bg-card px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            {t('cmsControl.catalogTitle', { label: activeCatalogTab?.label ?? t('cmsControl.catalogFallbackLabel') })}
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {activeCatalogTab?.description ?? t('cmsControl.catalogFallbackDescription')}
          </p>
        </div>

        <div className="inline-flex rounded-lg border bg-muted/40 p-1">
          {visibleCatalogTabs.map((tab) => {
            const isActive = resolvedActiveTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleCatalogTabChange(tab.id)}
                className={`min-h-9 min-w-[72px] rounded-md px-3 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <CatalogHealthPanel
        activeTab={resolvedActiveTab}
        summary={catalogHealth}
        loading={catalogHealthLoading}
        error={catalogHealthError}
        tireAction={tireAction}
        rimAction={rimAction}
        maintenanceAction={maintenanceAction}
        onApplyTirePublish={handleApplyTirePublish}
        onApplyRimPublish={handleApplyRimPublish}
        onRebuildSelectedTires={handleRebuildSelectedTires}
        onRebuildSelectedRims={handleRebuildSelectedRims}
        onCloseStaleRuns={handleCloseStaleRuns}
        onRefresh={loadCatalogHealth}
      />

      <div className="bg-background">
        {resolvedActiveTab === 'tires-finalize' ? <TiresCMSPage embedded /> : <RimsCMSPage embedded />}
      </div>
    </div>
  );
}

export function CmsControlCenter({
  cmsTab,
  cmsTabs,
  onTabChange,
}: {
  cmsTab: CmsTab;
  cmsTabs: Array<{ id: CmsTab; label: string; description: string }>;
  onTabChange: (tab: CmsTab) => void;
}) {
  const { t } = useLanguage();
  const access = useCmsAccess();
  const tabModuleMap: Partial<Record<CmsTab, string>> = {
    rescue: 'rescue',
    schedule: 'schedule',
    orders: 'orders',
    invoices: 'invoices',
    'account-customer': access?.canManageAccounts ? 'accounts' : 'customers',
  };
  const canReadTab = (tab: CmsTab) => {
    if (access?.isSuperAdmin) return true;
    if (tab === 'future') return false;
    if (tab === 'catalog') {
      const tirePermission = access?.permissions?.catalog_tires;
      const rimPermission = access?.permissions?.catalog_rims;
      return (
        tirePermission === 'read' ||
        tirePermission === 'read_write' ||
        rimPermission === 'read' ||
        rimPermission === 'read_write'
      );
    }
    const module = tabModuleMap[tab];
    if (!module) return false;
    const permission = access?.permissions?.[module];
    return permission === 'read' || permission === 'read_write';
  };
  const visibleTabs = cmsTabs.filter((tab) => {
    return canReadTab(tab.id);
  });
  const activeTab = visibleTabs.some((tab) => tab.id === cmsTab)
    ? cmsTab
    : visibleTabs[0]?.id ?? 'account-customer';

  return (
    <div className="bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.08em] text-muted-foreground">{t('cmsControl.beta')}</p>
              <h1 className="text-3xl font-semibold text-foreground">{t('cmsControl.controlCenter')}</h1>
            </div>
            {access?.canManageAccounts ? <CmsBetaHandoffControl /> : null}
          </div>
          <p className="text-muted-foreground max-w-3xl">
            {access?.canManageAccounts
              ? t('cmsControl.adminDescription')
              : t('cmsControl.customerWorkspaceDescription')}
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border bg-card p-1 shadow-sm">
          <div
            className={`grid gap-1 ${visibleTabs.length === 1 ? 'grid-cols-1' : 'min-w-[960px]'}`}
            style={visibleTabs.length > 1 ? { gridTemplateColumns: `repeat(${visibleTabs.length}, minmax(0, 1fr))` } : undefined}
          >
            {visibleTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const tabLabel = !access?.canManageAccounts && tab.id === 'account-customer'
                ? t('cmsControl.customerTab')
                : tab.label;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex min-h-[58px] min-w-0 items-center justify-center rounded-md px-3 py-2 text-center transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      {tabLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <CmsTabErrorBoundary resetKey={activeTab}>
            <CmsTabContent tab={activeTab} />
          </CmsTabErrorBoundary>
        </div>
      </div>
    </div>
  );
}

function CmsBetaHandoffControl() {
  const { t } = useLanguage();
  const [handoffCount, setHandoffCount] = useState(0);
  const [forceClearCount, setForceClearCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadCounts = useCallback(async () => {
    const [{ count: handoff }, forceClearQuery] = await Promise.all([
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('status', BOOKING_STATUS_HANDOFF),
      supabase
        .from('bookings')
        .select('id, status')
        .neq('status', 'cancelled'),
    ]);

    setHandoffCount(handoff ?? 0);
    setForceClearCount(
      (forceClearQuery.data ?? []).filter((booking) => (booking.status || 'confirmed').toLowerCase() !== 'confirmed').length,
    );
  }, []);

  useEffect(() => {
    void loadCounts();
    const intervalId = window.setInterval(() => {
      void loadCounts();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [loadCounts]);

  const handleFinishHandoff = async () => {
    if (loading || handoffCount === 0) return;
    setLoading(true);

    try {
      const { data, error: queryError } = await supabase
        .from('bookings')
        .select('id')
        .eq('status', BOOKING_STATUS_HANDOFF);

      if (queryError) {
        throw queryError;
      }

      const ids = (data ?? []).map((booking) => booking.id).filter(Boolean);
      if (ids.length === 0) {
        setHandoffCount(0);
        return;
      }

      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .in('id', ids);

      if (updateError) {
        throw updateError;
      }

      toast.success('Booking handoff cleared');
      await loadCounts();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to clear booking handoff');
    } finally {
      setLoading(false);
    }
  };

  const handleForceClearAll = async () => {
    if (loading || forceClearCount === 0) return;
    setLoading(true);

    try {
      const { data, error: queryError } = await supabase
        .from('bookings')
        .select('id, status')
        .neq('status', 'cancelled');

      if (queryError) {
        throw queryError;
      }

      const ids = (data ?? [])
        .filter((booking) => (booking.status || 'confirmed').toLowerCase() !== 'confirmed')
        .map((booking) => booking.id)
        .filter(Boolean);

      if (ids.length === 0) {
        setForceClearCount(0);
        return;
      }

      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .in('id', ids);

      if (updateError) {
        throw updateError;
      }

      toast.success(t('cmsControl.allBookingStatusesCleared'));
      await loadCounts();
    } catch (error: any) {
      toast.error(error?.message || t('cmsControl.forceClearStatusesFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (handoffCount > 0 || forceClearCount > 0) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {handoffCount > 0 ? (
          <button
            type="button"
            onClick={handleFinishHandoff}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:text-emerald-300"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            {loading ? t('cmsControl.clearingHandoff') : t('cmsControl.clearHandoff', { count: handoffCount })}
          </button>
        ) : null}
        {forceClearCount > 0 ? (
          <button
            type="button"
            onClick={handleForceClearAll}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:text-amber-300"
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
            {loading ? t('cmsControl.forceClearing') : t('cmsControl.forceClear', { count: forceClearCount })}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
      <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
      {t('cmsControl.switchTabsHint')}
    </span>
  );
}
