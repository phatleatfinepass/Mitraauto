import { useState } from 'react';
import { supabase } from '../../../utils/supabase/client';

export function useTiresCmsCatalogSync({
  fetchTires,
  invalidateCache,
  language,
}: {
  fetchTires: (options?: { force?: boolean }) => Promise<any>;
  invalidateCache: () => void;
  language: string;
}) {
  const [syncingCatalog, setSyncingCatalog] = useState(false);
  const [hasPendingCatalogSync, setHasPendingCatalogSync] = useState(false);
  const [catalogSyncMessage, setCatalogSyncMessage] = useState<string | null>(null);

  const handleApplyCatalogSync = async () => {
    if (syncingCatalog) return;

    setSyncingCatalog(true);
    setCatalogSyncMessage(null);

    try {
      // Tires CMS changes currently mutate product_cms / CMS-facing overrides.
      // They do not require the full supplier catalog rebuild chain on every sync.
      // Keep this path limited to republishing the search surface and CMS snapshot.
      const { error: refreshError } = await supabase.rpc('catalog_refresh_products_search_v3');
      if (refreshError) throw refreshError;

      const { error: cmsRefreshError } = await supabase.rpc('refresh_cms_tires_admin_mv');
      if (cmsRefreshError) throw cmsRefreshError;

      setHasPendingCatalogSync(false);
      setCatalogSyncMessage(language === 'fi' ? 'Catalog sync valmis.' : 'Catalog sync completed.');
      invalidateCache();
      await fetchTires({ force: true });
    } catch (err: any) {
      console.error('Catalog sync error:', err);
      setCatalogSyncMessage(err?.message || 'Catalog sync failed');
    } finally {
      setSyncingCatalog(false);
    }
  };

  return {
    catalogSyncMessage,
    handleApplyCatalogSync,
    hasPendingCatalogSync,
    setCatalogSyncMessage,
    setHasPendingCatalogSync,
    syncingCatalog,
  };
}
