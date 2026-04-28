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
      const { error: refreshError } = await supabase.rpc('refresh_webshop_tire_items_v1');
      if (refreshError) throw refreshError;
      setCatalogSyncProgress({ processed: 1, total: 2 });

      invalidateCache();

      await fetchTires({ force: true });
      setCatalogSyncProgress({ processed: 2, total: 2 });
      setHasPendingCatalogSync(false);
      setCatalogSyncMessage(
        language === 'fi'
          ? 'Renkaiden muutokset julkaistu webshoppiin.'
          : 'Tire changes published to the webshop.'
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
