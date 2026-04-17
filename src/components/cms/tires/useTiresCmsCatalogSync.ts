import { useState } from 'react';
import { supabase } from '../../../utils/supabase/client';

export function useTiresCmsCatalogSync({
  fetchTires,
  language,
}: {
  fetchTires: () => Promise<any>;
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
      const { data: offersRun, error: offersError } = await supabase.rpc('catalog_build_offers_v3', {
        p_limit: 200000,
      });
      if (offersError) throw offersError;
      if ((offersRun as any)?.errors && Number((offersRun as any).errors) > 0) {
        throw new Error((offersRun as any)?.error || 'catalog_build_offers_v3 failed');
      }

      const { error: prefilterError } = await supabase.rpc('catalog_build_offer_prefilter_v3');
      if (prefilterError) throw prefilterError;

      const { error: variantsError } = await supabase.rpc('catalog_build_variants_v3');
      if (variantsError) throw variantsError;

      const { error: conflictsError } = await supabase.rpc('catalog_refresh_conflicts_v3');
      if (conflictsError) throw conflictsError;

      const { error: refreshError } = await supabase.rpc('catalog_refresh_products_search_v3');
      if (refreshError) throw refreshError;

      const { error: cmsRefreshError } = await supabase.rpc('refresh_cms_tires_admin_mv');
      if (cmsRefreshError) throw cmsRefreshError;

      setHasPendingCatalogSync(false);
      setCatalogSyncMessage(language === 'fi' ? 'Catalog sync valmis.' : 'Catalog sync completed.');
      await fetchTires();
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
