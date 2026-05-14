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

const BOOKING_STATUS_HANDOFF = 'handoff';

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

function CatalogCMSPage() {
  const { t } = useLanguage();
  const access = useCmsAccess();
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
