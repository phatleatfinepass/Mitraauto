import { useState } from 'react';
import { supabase } from '../../../utils/supabase/client';
import { getPricingRulesFromSpecOverrides, isFixedBundleTotalCompatible } from '../../../utils/pricing';
import type { ProductCMS, TireRow } from './types';
import { getManualNonPassengerFlag } from './useTiresCmsEditor';

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

function normalizeGallery(value: any): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => normalizeTextOrNull(item))
    .filter((item): item is string => Boolean(item));
}

function normalizeSpecOverrides(value: any): any {
  const normalizeNode = (node: any): any => {
    if (node === undefined || node === null) return null;
    if (Array.isArray(node)) {
      const normalizedArray = node
        .map((item) => normalizeNode(item))
        .filter((item) => item !== null);
      return normalizedArray.length > 0 ? normalizedArray : null;
    }
    if (typeof node === 'object') {
      const normalizedEntries = Object.entries(node)
        .map(([key, item]) => [key, normalizeNode(item)] as const)
        .filter(([, item]) => item !== null);
      if (normalizedEntries.length === 0) return null;

      normalizedEntries.sort(([a], [b]) => a.localeCompare(b));
      return normalizedEntries.reduce((acc, [key, item]) => {
        acc[key] = item;
        return acc;
      }, {} as Record<string, any>);
    }
    if (typeof node === 'string') {
      const text = node.trim();
      return text.length > 0 ? text : null;
    }
    return node;
  };

  return normalizeNode(value);
}

function stableSerialize(value: any): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort((a, b) => a.localeCompare(b));
    const serialized = keys.map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`);
    return `{${serialized.join(',')}}`;
  }
  return JSON.stringify(value);
}

function buildComparableCmsData(
  variantId: string,
  source: Partial<ProductCMS> | null | undefined
) {
  const gallery = normalizeGallery(source?.gallery);
  return {
    variant_id: variantId,
    title: normalizeTextOrNull(source?.title),
    subtitle: normalizeTextOrNull(source?.subtitle),
    short_description: normalizeTextOrNull(source?.short_description),
    long_description: normalizeTextOrNull(source?.long_description),
    gallery,
    hero_image_url: normalizeTextOrNull(source?.hero_image_url) || gallery[0] || null,
    seo_slug: normalizeTextOrNull(source?.seo_slug),
    seo_title: normalizeTextOrNull(source?.seo_title),
    seo_description: normalizeTextOrNull(source?.seo_description),
    is_hidden: Boolean(source?.is_hidden),
    spec_overrides: normalizeSpecOverrides(source?.spec_overrides),
    price_override_eur: toNumberOrNull(source?.price_override_eur),
    promo_enabled: Boolean(source?.promo_enabled),
    promo_price_eur: toNumberOrNull(source?.promo_price_eur),
    promo_start: normalizeTextOrNull(source?.promo_start),
    promo_end: normalizeTextOrNull(source?.promo_end),
  };
}

function isValidEan13(ean: string) {
  if (!/^\d{13}$/.test(ean)) return false;
  const digits = ean.split('').map((d) => Number(d));
  const check = digits[12];
  const sum = digits
    .slice(0, 12)
    .reduce((acc, digit, idx) => acc + digit * (idx % 2 === 0 ? 1 : 3), 0);
  const expected = (10 - (sum % 10)) % 10;
  return check === expected;
}

export function useTiresCmsMutations({
  editData,
  fetchTires,
  invalidateCache,
  hasMissingSupplierPrice,
  language,
  onCloseEditor,
  patchLocalCmsData,
  patchLocalIdentityData,
  selectedTire,
  setCatalogSyncMessage,
  setHasPendingCatalogSync,
}: {
  editData: Partial<ProductCMS>;
  fetchTires: (options?: { force?: boolean }) => Promise<any>;
  invalidateCache: () => void;
  hasMissingSupplierPrice: (tire: TireRow | null) => boolean;
  language: string;
  onCloseEditor: () => void;
  patchLocalCmsData: (variantId: string, cmsData: Partial<ProductCMS> | null) => void;
  patchLocalIdentityData: (variantId: string, specOverrides: any) => void;
  selectedTire: TireRow | null;
  setCatalogSyncMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setHasPendingCatalogSync: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const refreshAdminSnapshot = async () => {
    const [adminRefresh, publicRefresh] = await Promise.all([
      supabase.rpc('refresh_cms_tires_admin_mv'),
      supabase.rpc('refresh_catalog_tires_public_mv'),
    ]);

    if (adminRefresh.error) {
      console.warn('Refresh tires CMS snapshot error:', adminRefresh.error);
    }

    if (publicRefresh.error) {
      console.warn('Refresh public tire catalog snapshot error:', publicRefresh.error);
    }
  };

  const handleSave = async () => {
    if (!selectedTire) return;

    setSaving(true);
    setSaveError(null);

    try {
      const specOverrides = editData.spec_overrides ?? {};
      const pricingRules = getPricingRulesFromSpecOverrides(specOverrides);
      if (
        pricingRules?.qty2?.mode === 'fixed_total' &&
        !isFixedBundleTotalCompatible(pricingRules.qty2.fixed_total_eur, 2)
      ) {
        throw new Error(
          language === 'fi'
            ? '2 kpl kiinteä pakettihinta pitää jakautua tasan kahdelle tuotteelle (sentteihin asti).'
            : 'Fixed total for 2 items must be divisible evenly across 2 units (in cents).'
        );
      }
      if (
        pricingRules?.qty4?.mode === 'fixed_total' &&
        !isFixedBundleTotalCompatible(pricingRules.qty4.fixed_total_eur, 4)
      ) {
        throw new Error(
          language === 'fi'
            ? '4 kpl kiinteä pakettihinta pitää jakautua tasan neljälle tuotteelle (sentteihin asti).'
            : 'Fixed total for 4 items must be divisible evenly across 4 units (in cents).'
        );
      }

      const identityOverride = (specOverrides as any)?.identity ?? {};
      let targetVariantId = selectedTire.variant_id;
      const hasEanOverride =
        Object.prototype.hasOwnProperty.call(identityOverride, 'ean') &&
        selectedTire.supplier_code_best &&
        selectedTire.supplier_external_id_best;
      const eanDigits = String(identityOverride.ean ?? '').replace(/\D/g, '');
      const currentEanDigits = String(selectedTire.derived_ean ?? '').replace(/\D/g, '');
      const shouldPatchEan = Boolean(hasEanOverride) && eanDigits !== currentEanDigits;

      if (shouldPatchEan && eanDigits.length > 0 && !isValidEan13(eanDigits)) {
        throw new Error(
          language === 'fi'
            ? 'EAN ei ole kelvollinen EAN-13 (tarkistusnumero virheellinen).'
            : 'EAN is not a valid EAN-13 (check digit mismatch).'
        );
      }

      const draftManualNonPassenger = getManualNonPassengerFlag(specOverrides);
      const draftNonPassenger = Boolean(selectedTire.is_non_passenger_auto) || draftManualNonPassenger;
      const mustBeHidden = hasMissingSupplierPrice(selectedTire) || draftNonPassenger;
      const payload: any = {
        variant_id: targetVariantId,
        title: editData.title?.trim() || null,
        subtitle: editData.subtitle?.trim() || null,
        short_description: editData.short_description?.trim() || null,
        long_description: editData.long_description?.trim() || null,
        gallery: Array.isArray(editData.gallery) ? editData.gallery.filter(Boolean) : [],
        seo_slug: editData.seo_slug?.trim() || null,
        seo_title: editData.seo_title?.trim() || null,
        seo_description: editData.seo_description?.trim() || null,
        is_hidden: mustBeHidden ? true : (editData.is_hidden ?? false),
        spec_overrides: specOverrides,
        price_override_eur: editData.price_override_eur ?? null,
        promo_enabled: editData.promo_enabled ?? false,
        promo_price_eur: editData.promo_price_eur ?? null,
        promo_start: editData.promo_start || null,
        promo_end: editData.promo_end || null,
      };

      payload.hero_image_url = editData.hero_image_url || payload.gallery[0] || null;
      const hasCmsChanges =
        stableSerialize(buildComparableCmsData(targetVariantId, payload)) !==
        stableSerialize(buildComparableCmsData(selectedTire.variant_id, selectedTire.cms_data ?? null));

      if (!shouldPatchEan && !hasCmsChanges) {
        setCatalogSyncMessage(
          language === 'fi' ? 'Ei uusia muutoksia synkronoitavaksi.' : 'No new changes to sync.'
        );
        onCloseEditor();
        return;
      }

      if (shouldPatchEan) {
        const { data: eanPatchResult, error: eanPatchError } = await supabase.rpc('catalog_patch_offer_ean_v3', {
          p_supplier_code: selectedTire.supplier_code_best,
          p_product_type: selectedTire.product_type,
          p_external_id: selectedTire.supplier_external_id_best,
          p_ean: eanDigits || null,
          p_run_rebuild: false,
        });

        if (eanPatchError) throw eanPatchError;

        const remappedVariantId = (eanPatchResult as any)?.new_variant_id;
        if (typeof remappedVariantId === 'string' && remappedVariantId.trim().length > 0) {
          targetVariantId = remappedVariantId;
        }
      }

      payload.variant_id = targetVariantId;

      const { error } = await supabase
        .from('product_cms')
        .upsert(payload, { onConflict: 'variant_id' });

      if (error) throw error;
      await refreshAdminSnapshot();
      setHasPendingCatalogSync(true);
      setCatalogSyncMessage(
        shouldPatchEan
          ? (language === 'fi'
            ? 'EAN-muutos tallennettu välimuistiin. Suorita "Apply Sync" julkaistaksesi muutokset katalogiin.'
            : 'EAN change cached. Run "Apply Sync" to publish changes to catalog.')
          : (language === 'fi'
            ? 'Muutokset tallennettu. Suorita "Apply Sync" julkaistaksesi muutokset katalogiin.'
            : 'Changes saved. Run "Apply Sync" to publish changes to catalog.')
      );

      if (targetVariantId !== selectedTire.variant_id) {
        invalidateCache();
        await supabase
          .from('product_cms')
          .delete()
          .eq('variant_id', selectedTire.variant_id);
        await fetchTires({ force: true });
      } else {
        patchLocalCmsData(targetVariantId, payload);
        patchLocalIdentityData(targetVariantId, specOverrides);
      }

      onCloseEditor();
    } catch (err: any) {
      console.error('Save error:', err);
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async (tire: TireRow) => {
    const missingSupplierPrice = hasMissingSupplierPrice(tire);
    const nonPassenger = Boolean(tire.is_non_passenger);
    const forceHidden = missingSupplierPrice || nonPassenger;
    const previousHiddenState = Boolean(tire.cms_data?.is_hidden);
    const currentlyHidden = Boolean(tire.cms_data?.is_hidden) || forceHidden;
    const newHiddenState = forceHidden ? true : !currentlyHidden;

    try {
      if (forceHidden) {
        setCatalogSyncMessage(
          language === 'fi'
            ? (missingSupplierPrice
              ? 'Tuote on piilotettu, koska toimittajahinta puuttuu.'
              : 'Tuote on piilotettu, koska se ei ole henkilöauton rengas.')
            : (missingSupplierPrice
              ? 'Item is hidden because supplier price is missing.'
              : 'Item is hidden because it is not a passenger-car tire.')
        );
      }

      const { error } = await supabase
        .from('product_cms')
        .upsert({
          variant_id: tire.variant_id,
          is_hidden: newHiddenState,
          spec_overrides: tire.cms_data?.spec_overrides ?? {},
        }, { onConflict: 'variant_id' });

      if (error) throw error;
      await refreshAdminSnapshot();

      patchLocalCmsData(tire.variant_id, {
        variant_id: tire.variant_id,
        is_hidden: newHiddenState,
        spec_overrides: tire.cms_data?.spec_overrides ?? {},
      });

      if (newHiddenState !== previousHiddenState) {
        setHasPendingCatalogSync(true);
        setCatalogSyncMessage(
          language === 'fi'
            ? 'Näkyvyysmuutos tallennettu. Suorita "Apply Sync" julkaistaksesi muutokset katalogiin.'
            : 'Visibility change saved. Run "Apply Sync" to publish changes to catalog.'
        );
      }
    } catch (err: any) {
      console.error('Toggle visibility error:', err);
      setCatalogSyncMessage(err.message);
    }
  };

  const handleResetCms = async () => {
    if (!selectedTire) return;
    if (!selectedTire.cms_data) {
      setCatalogSyncMessage(language === 'fi' ? 'Ei uusia muutoksia synkronoitavaksi.' : 'No new changes to sync.');
      onCloseEditor();
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const { error } = await supabase
        .from('product_cms')
        .delete()
        .eq('variant_id', selectedTire.variant_id);

      if (error) throw error;
      await refreshAdminSnapshot();

      patchLocalCmsData(selectedTire.variant_id, null);
      setHasPendingCatalogSync(true);
      setCatalogSyncMessage(
        language === 'fi'
          ? 'CMS-ohitukset poistettu. Suorita "Apply Sync" julkaistaksesi muutokset katalogiin.'
          : 'CMS overrides cleared. Run "Apply Sync" to publish changes to catalog.'
      );
      onCloseEditor();
    } catch (err: any) {
      console.error('Reset error:', err);
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return {
    handleResetCms,
    handleSave,
    handleToggleVisibility,
    saveError,
    saving,
    setSaveError,
  };
}
