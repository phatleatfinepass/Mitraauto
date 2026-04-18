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
  const [catalogSyncProgress, setCatalogSyncProgress] = useState<{
    processed: number;
    total: number;
  } | null>(null);

  const handleApplyCatalogSync = async () => {
    if (syncingCatalog) return;

    setSyncingCatalog(true);
    setCatalogSyncMessage(null);
    setCatalogSyncProgress({ processed: 0, total: 2 });

    try {
      // Tires CMS changes are now read live from product_cms in both the catalog fetch path
      // and the CMS list overlay path. Apply Sync only needs to clear local stale caches and
      // reload the current page view instead of rebuilding the full catalog search surface.
      invalidateCache();
      setCatalogSyncProgress({ processed: 1, total: 2 });

      await fetchTires({ force: true });
      setCatalogSyncProgress({ processed: 2, total: 2 });
      setHasPendingCatalogSync(false);
      setCatalogSyncMessage(
        language === 'fi'
          ? 'Renkaiden muutokset synkronoitu paikalliseen näkymään.'
          : 'Tires changes synced to the local view.'
      );
    } catch (err: any) {
      console.error('Catalog sync error:', err);
      setCatalogSyncMessage(err?.message || 'Catalog sync failed');
    } finally {
      setSyncingCatalog(false);
      setCatalogSyncProgress(null);
    }
  };

  return {
    catalogSyncMessage,
    catalogSyncProgress,
    handleApplyCatalogSync,
    hasPendingCatalogSync,
    setCatalogSyncMessage,
    setHasPendingCatalogSync,
    syncingCatalog,
  };
}
