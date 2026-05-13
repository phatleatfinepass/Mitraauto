import { useState } from 'react';

import { supabase } from '../../../utils/supabase/client';
import { getPricingRulesFromSpecOverrides, isFixedBundleTotalCompatible } from '../../../utils/pricing';
import type { ProductCMS, RimRow } from './types';

function toNumberOrNull(value: any) {
  if (value === null || value === undefined || value === '') return null;
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeTextOrNull(value: any) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function normalizeTextArray(value: any): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => normalizeTextOrNull(item))
    .filter((item): item is string => Boolean(item));
}

function isStatementTimeoutError(error: any) {
  return error?.code === '57014' || String(error?.message ?? '').toLowerCase().includes('statement timeout');
}

export function useRimsCmsMutations({
  language,
  selectedRim,
  editData,
  patchLocalCmsData,
  closeEditor,
  refreshRims,
  setError,
}: {
  language: string;
  selectedRim: RimRow | null;
  editData: Partial<ProductCMS>;
  patchLocalCmsData: (variantId: string, cmsPatch: Record<string, any> | null) => void;
  closeEditor: () => void;
  refreshRims: (options?: { force?: boolean }) => Promise<void>;
  setError: (message: string | null) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [catalogSyncMessage, setCatalogSyncMessage] = useState<string | null>(null);
  const [hasPendingCatalogSync, setHasPendingCatalogSync] = useState(false);

  const applyRimWebshopSync = async () => {
    setSyncing(true);
    setCatalogSyncMessage(null);

    try {
      const { data: startData, error: startError } = await supabase.rpc('start_webshop_rim_items_sync_v1');
      if (startError) throw startError;

      const runId = (startData as any)?.run_id ?? startData;
      if (!runId || typeof runId !== 'string') {
        throw new Error('Rim webshop sync did not return a run id.');
      }

      let processed = 0;
      let batchSize = 150;
      for (let guard = 0; guard < 2500; guard += 1) {
        const { data: batchData, error: batchError } = await supabase.rpc('refresh_webshop_rim_items_batch_v1', {
          p_run_id: runId,
          p_batch_size: batchSize,
        });
        if (batchError) {
          if (isStatementTimeoutError(batchError) && batchSize > 25) {
            batchSize = Math.max(25, Math.floor(batchSize / 2));
            guard -= 1;
            continue;
          }
          throw batchError;
        }

        const batchProcessed = Number(
          (batchData as any)?.batch_processed ?? (batchData as any)?.processed_count ?? 0,
        );
        processed += batchProcessed;
        if (batchProcessed === 0 || (batchData as any)?.has_more === false) break;
      }

      const { error: finalizeError } = await supabase.rpc('finalize_webshop_rim_items_sync_v1', {
        p_run_id: runId,
      });
      if (finalizeError) throw finalizeError;

      setHasPendingCatalogSync(false);
      setCatalogSyncMessage(
        language === 'fi'
          ? `Vannekatalogi julkaistu verkkokauppaan (${processed} käsitelty).`
          : `Rim catalog published to webshop (${processed} processed).`,
      );
      await refreshRims({ force: true });
    } catch (err: any) {
      console.error('Apply rim webshop sync error:', err);
      setCatalogSyncMessage(err.message ?? String(err));
    } finally {
      setSyncing(false);
    }
  };

  const handleSave = async () => {
    if (!selectedRim) return;

    setSaving(true);
    setSaveError(null);

    try {
      const specOverrides = { ...(editData.spec_overrides ?? selectedRim.cms_data?.spec_overrides ?? {}) };
      const pricingRules = getPricingRulesFromSpecOverrides(specOverrides);
      if (
        pricingRules?.qty2?.mode === 'fixed_total' &&
        !isFixedBundleTotalCompatible(pricingRules.qty2.fixed_total_eur, 2)
      ) {
        throw new Error(
          language === 'fi'
            ? '2 kpl kiinteä pakettihinta pitää jakautua tasan kahdelle tuotteelle (sentteihin asti).'
            : 'Fixed total for 2 items must be divisible evenly across 2 units (in cents).',
        );
      }
      if (
        pricingRules?.qty4?.mode === 'fixed_total' &&
        !isFixedBundleTotalCompatible(pricingRules.qty4.fixed_total_eur, 4)
      ) {
        throw new Error(
          language === 'fi'
            ? '4 kpl kiinteä pakettihinta pitää jakautua tasan neljälle tuotteelle (sentteihin asti).'
            : 'Fixed total for 4 items must be divisible evenly across 4 units (in cents).',
        );
      }

      const gallery = normalizeTextArray(editData.gallery);
      const payload: any = {
        variant_id: selectedRim.variant_id,
        title: normalizeTextOrNull(editData.title),
        subtitle: normalizeTextOrNull(editData.subtitle),
        short_description: normalizeTextOrNull(editData.short_description),
        long_description: normalizeTextOrNull(editData.long_description),
        hero_image_url: normalizeTextOrNull(editData.hero_image_url) ?? gallery[0] ?? null,
        gallery,
        badges: normalizeTextArray(editData.badges),
        seo_slug: normalizeTextOrNull(editData.seo_slug),
        seo_title: normalizeTextOrNull(editData.seo_title),
        seo_description: normalizeTextOrNull(editData.seo_description),
        is_hidden: Boolean(editData.is_hidden),
        spec_overrides: specOverrides,
        price_override_eur: toNumberOrNull(editData.price_override_eur),
        promo_enabled: Boolean(editData.promo_enabled),
        promo_price_eur: toNumberOrNull(editData.promo_price_eur),
        promo_start: normalizeTextOrNull(editData.promo_start),
        promo_end: normalizeTextOrNull(editData.promo_end),
        stock_override: toNumberOrNull(editData.stock_override),
        force_out_of_stock: Boolean(editData.force_out_of_stock),
      };

      const { error } = await supabase
        .from('product_cms')
        .upsert(payload, { onConflict: 'variant_id' });

      if (error) throw error;

      patchLocalCmsData(selectedRim.variant_id, payload);
      setHasPendingCatalogSync(true);
      setCatalogSyncMessage(
        language === 'fi'
          ? 'Muutokset tallennettu. Suorita Apply Sync julkaistaksesi verkkokauppaan.'
          : 'Changes saved. Run Apply Sync to publish them to the webshop.',
      );
      void refreshRims({ force: true });
      closeEditor();
    } catch (err: any) {
      console.error('Save rim CMS error:', err);
      setSaveError(err.message ?? String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async (rim: RimRow) => {
    const nextHidden = !rim.cms_data?.is_hidden;

    try {
      const payload = {
        variant_id: rim.variant_id,
        is_hidden: nextHidden,
        spec_overrides: rim.cms_data?.spec_overrides ?? {},
      };

      const { error } = await supabase
        .from('product_cms')
        .upsert(payload, { onConflict: 'variant_id' });

      if (error) throw error;

      patchLocalCmsData(rim.variant_id, payload);
      setHasPendingCatalogSync(true);
      setCatalogSyncMessage(
        language === 'fi'
          ? 'Näkyvyysmuutos tallennettu. Suorita Apply Sync julkaistaksesi verkkokauppaan.'
          : 'Visibility change saved. Run Apply Sync to publish it to the webshop.',
      );
    } catch (err: any) {
      console.error('Toggle rim visibility error:', err);
      setError(err.message ?? String(err));
    }
  };

  const handleResetCms = async () => {
    if (!selectedRim) return;

    setSaving(true);
    setSaveError(null);

    try {
      const { error } = await supabase
        .from('product_cms')
        .delete()
        .eq('variant_id', selectedRim.variant_id);

      if (error) throw error;

      patchLocalCmsData(selectedRim.variant_id, null);
      setHasPendingCatalogSync(true);
      setCatalogSyncMessage(
        language === 'fi'
          ? 'CMS-ohitukset poistettu. Suorita Apply Sync julkaistaksesi verkkokauppaan.'
          : 'CMS overrides cleared. Run Apply Sync to publish to the webshop.',
      );
      void refreshRims({ force: true });
      closeEditor();
    } catch (err: any) {
      console.error('Reset rim CMS error:', err);
      setSaveError(err.message ?? String(err));
    } finally {
      setSaving(false);
    }
  };

  return {
    applyRimWebshopSync,
    catalogSyncMessage,
    handleResetCms,
    handleSave,
    handleToggleVisibility,
    hasPendingCatalogSync,
    saveError,
    saving,
    setCatalogSyncMessage,
    setSaveError,
    syncing,
  };
}
