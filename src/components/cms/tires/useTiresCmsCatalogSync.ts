import { useState } from 'react';
import { supabase } from '../../../utils/supabase/client';

const WEBSHOP_TIRE_SYNC_BATCH_SIZE = 500;

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
    setCatalogSyncProgress({ processed: 0, total: 1 });

    try {
      const { data: startData, error: startError } = await supabase.rpc('start_webshop_tire_items_sync_v1');

      if (startError) {
        throw startError;
      }

      const runId = String((startData as any)?.run_id ?? '');
      if (!runId) {
        throw new Error('Webshop tire sync did not return a run id.');
      }

      let processed = Number((startData as any)?.processed ?? 0);
      let total = Math.max(Number((startData as any)?.total ?? 0), 0);
      let hasMore = Boolean((startData as any)?.has_more);
      setCatalogSyncProgress({ processed, total: Math.max(total, 1) });

      while (hasMore) {
        const { data: batchData, error: batchError } = await supabase.rpc('refresh_webshop_tire_items_batch_v1', {
          p_run_id: runId,
          p_batch_size: WEBSHOP_TIRE_SYNC_BATCH_SIZE,
        });

        if (batchError) throw batchError;

        processed = Number((batchData as any)?.processed ?? processed);
        total = Math.max(Number((batchData as any)?.total ?? total), 0);
        hasMore = Boolean((batchData as any)?.has_more);
        setCatalogSyncProgress({ processed, total: Math.max(total, 1) });
      }

      const { data: finalizeData, error: finalizeError } = await supabase.rpc('finalize_webshop_tire_items_sync_v1', {
        p_run_id: runId,
      });

      if (finalizeError) throw finalizeError;

      processed = Number((finalizeData as any)?.processed ?? processed);
      total = Math.max(Number((finalizeData as any)?.total ?? total), 0);
      setCatalogSyncProgress({ processed, total: Math.max(total, 1) });

      invalidateCache();
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
