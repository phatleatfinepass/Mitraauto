import { useState } from 'react';
import { useLanguage } from '../../../i18n/LanguageContext';
import { supabase } from '../../../utils/supabase/client';

const WEBSHOP_TIRE_SYNC_BATCH_SIZE = 150;

export function useTiresCmsCatalogSync({
  fetchTires,
  invalidateCache,
}: {
  fetchTires: (options?: { force?: boolean }) => Promise<any>;
  invalidateCache: () => void;
}) {
  const { t } = useLanguage();
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
      const { error: externalStockError } = await supabase.rpc('catalog_apply_rd_external_stock_v1');
      if (externalStockError) {
        throw externalStockError;
      }

      const { data: startData, error: startError } = await supabase.rpc('start_webshop_tire_items_sync_v1');

      if (startError) {
        throw startError;
      }

      const runId = String((startData as any)?.run_id ?? '');
      if (!runId) {
        throw new Error(t('tiresCatalogSync.missingRunId'));
      }

      let processed = Number((startData as any)?.processed ?? 0);
      let total = Math.max(Number((startData as any)?.total ?? 0), 0);
      let hasMore = Boolean((startData as any)?.has_more);
      let batchSize = WEBSHOP_TIRE_SYNC_BATCH_SIZE;
      setCatalogSyncProgress({ processed, total: Math.max(total, 1) });

      for (let guard = 0; guard < 2500 && hasMore; guard += 1) {
        const { data: batchData, error: batchError } = await supabase.rpc('refresh_webshop_tire_items_batch_v1', {
          p_run_id: runId,
          p_batch_size: batchSize,
        });

        if (batchError) {
          if (String((batchError as any)?.code ?? '') === '57014' && batchSize > 25) {
            batchSize = Math.max(25, Math.floor(batchSize / 2));
            guard -= 1;
            continue;
          }
          throw batchError;
        }

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
      setCatalogSyncMessage(t('tiresCatalogSync.published'));
    } catch (err: any) {
      console.error('Catalog sync error:', err);
      setCatalogSyncMessage(err?.message || t('tiresCatalogSync.failed'));
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
