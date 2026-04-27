import { useState } from 'react';
import { supabase } from '../../../utils/supabase/client';
import { getPricingRulesFromSpecOverrides, isFixedBundleTotalCompatible } from '../../../utils/pricing';
import { buildTyreLabelSectionData } from '../../../utils/tyreLabel';
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

function buildCmsImageUrls(source: Partial<ProductCMS> | null | undefined): string[] {
  const seen = new Set<string>();
  const images: string[] = [];
  const add = (value: any) => {
    const url = normalizeTextOrNull(value);
    if (!url || seen.has(url)) return;
    seen.add(url);
    images.push(url);
  };

  add(source?.hero_image_url);
  for (const url of normalizeGallery(source?.gallery)) add(url);
  return images;
}

function hasOwn(obj: any, key: string) {
  return Boolean(obj) && Object.prototype.hasOwnProperty.call(obj, key);
}

function getTyreLabelIdentity(specOverrides: any) {
  return specOverrides?.tyre_label_section?.identity ?? {};
}

function getTyreLabelBadges(specOverrides: any) {
  return specOverrides?.tyre_label_section?.badges ?? {};
}

function getTyreLabelEu(specOverrides: any) {
  return specOverrides?.tyre_label_section?.eu_label ?? {};
}

function resolveEffectiveIdentity(specOverrides: any, tire: TireRow) {
  const identity = specOverrides?.identity ?? {};
  const tyreLabelIdentity = getTyreLabelIdentity(specOverrides);

  const brand = hasOwn(tyreLabelIdentity, 'supplier_trademark')
    ? String(tyreLabelIdentity.supplier_trademark ?? '').trim()
    : hasOwn(tyreLabelIdentity, 'supplier_name')
      ? String(tyreLabelIdentity.supplier_name ?? '').trim()
      : hasOwn(identity, 'brand')
        ? String(identity.brand ?? '').trim()
        : String(tire.brand ?? '').trim();

  const model = hasOwn(tyreLabelIdentity, 'commercial_name')
    ? String(tyreLabelIdentity.commercial_name ?? '').trim()
    : hasOwn(tyreLabelIdentity, 'model')
      ? String(tyreLabelIdentity.model ?? '').trim()
      : hasOwn(identity, 'model')
        ? String(identity.model ?? '').trim()
        : String(tire.model ?? '').trim();

  const sizeString = hasOwn(tyreLabelIdentity, 'size_designation')
    ? String(tyreLabelIdentity.size_designation ?? '').trim()
    : hasOwn(identity, 'size_string')
      ? String(identity.size_string ?? '').trim()
      : String(tire.size_string ?? '').trim();

  const season = hasOwn(tyreLabelIdentity, 'season')
    ? String(tyreLabelIdentity.season ?? '').trim()
    : hasOwn(identity, 'season')
      ? String(identity.season ?? '').trim()
      : String(tire.season ?? '').trim();

  const loadIndex = hasOwn(tyreLabelIdentity, 'load_index')
    ? String(tyreLabelIdentity.load_index ?? '').trim()
    : hasOwn(identity, 'load_index')
      ? String(identity.load_index ?? '').trim()
      : String(tire.load_index ?? '').trim();

  const speedRating = hasOwn(tyreLabelIdentity, 'speed_symbol')
    ? String(tyreLabelIdentity.speed_symbol ?? '').trim().toUpperCase()
    : hasOwn(identity, 'speed_rating')
      ? String(identity.speed_rating ?? '').trim().toUpperCase()
      : String(tire.speed_rating ?? tire.speed_index ?? '').trim().toUpperCase();

  const ean = hasOwn(tyreLabelIdentity, 'ean')
    ? String(tyreLabelIdentity.ean ?? '').replace(/\D/g, '')
    : hasOwn(identity, 'ean')
      ? String(identity.ean ?? '').replace(/\D/g, '')
      : String(tire.ean ?? tire.derived_ean ?? '').replace(/\D/g, '');

  return {
    brand,
    model,
    size_string: sizeString,
    season,
    load_index: loadIndex,
    speed_rating: speedRating,
    ean,
  };
}

function resolveEffectiveFeatures(specOverrides: any, tire: TireRow) {
  const features = specOverrides?.features ?? {};
  const badges = getTyreLabelBadges(specOverrides);
  const euLabel = getTyreLabelEu(specOverrides);

  return {
    ev_ready: hasOwn(badges, 'ev_ready')
      ? Boolean(badges.ev_ready)
      : hasOwn(features, 'ev_ready')
        ? Boolean(features.ev_ready)
        : Boolean(tire.ev_ready),
    runflat: hasOwn(badges, 'runflat')
      ? Boolean(badges.runflat)
      : hasOwn(features, 'runflat')
        ? Boolean(features.runflat)
        : Boolean(tire.runflat),
    xl: hasOwn(badges, 'extra_load')
      ? Boolean(badges.extra_load)
      : hasOwn(features, 'xl')
        ? Boolean(features.xl)
        : Boolean(tire.xl_reinforced),
    studded: hasOwn(badges, 'studded')
      ? Boolean(badges.studded)
      : hasOwn(features, 'studded')
        ? Boolean(features.studded)
        : Boolean(tire.studded),
    threepmsf: hasOwn(badges, 'threepmsf')
      ? Boolean(badges.threepmsf)
      : hasOwn(euLabel, 'severe_snow')
        ? Boolean(euLabel.severe_snow)
        : hasOwn(features, 'threepmsf')
          ? Boolean(features.threepmsf)
          : Boolean(tire.threepmsf),
    winter_approved: hasOwn(badges, 'winter_approved')
      ? Boolean(badges.winter_approved)
      : hasOwn(features, 'winter_approved')
        ? Boolean(features.winter_approved)
        : Boolean(tire.winter_approved),
    ice_approved: hasOwn(euLabel, 'severe_ice')
      ? Boolean(euLabel.severe_ice)
      : hasOwn(features, 'ice_approved')
        ? Boolean(features.ice_approved)
        : Boolean(tire.ice_approved),
  };
}

function resolveEffectiveEu(specOverrides: any, tire: TireRow) {
  const eu = specOverrides?.eu ?? {};
  const tyreLabelEu = getTyreLabelEu(specOverrides);

  return {
    fuel_class: hasOwn(tyreLabelEu, 'fuel_efficiency_class')
      ? normalizeTextOrNull(tyreLabelEu.fuel_efficiency_class)
      : normalizeTextOrNull(eu.fuel_class) ?? tire.eu_fuel_class ?? tire.eu_fuel ?? null,
    wet_grip_class: hasOwn(tyreLabelEu, 'wet_grip_class')
      ? normalizeTextOrNull(tyreLabelEu.wet_grip_class)
      : normalizeTextOrNull(eu.wet_grip_class) ?? tire.eu_wet_grip_class ?? tire.eu_wet ?? null,
    noise_db: hasOwn(tyreLabelEu, 'external_noise_db')
      ? toNumberOrNull(tyreLabelEu.external_noise_db)
      : toNumberOrNull(eu.noise_db) ?? tire.eu_noise_db ?? tire.eu_noise ?? null,
    noise_class: hasOwn(tyreLabelEu, 'external_noise_class')
      ? normalizeTextOrNull(tyreLabelEu.external_noise_class)
      : normalizeTextOrNull(eu.noise_class) ?? tire.eu_noise_class ?? null,
  };
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
  eprelMatchId,
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
  eprelMatchId?: string | null;
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

    if (adminRefresh.error && adminRefresh.error.code !== '57014') {
      console.warn('Refresh tires CMS snapshot error:', adminRefresh.error);
    }

    if (publicRefresh.error && publicRefresh.error.code !== '57014') {
      console.warn('Refresh public tire catalog snapshot error:', publicRefresh.error);
    }
  };

  const handleSave = async () => {
    if (!selectedTire) return;

    setSaving(true);
    setSaveError(null);

    try {
      const specOverrides = { ...(editData.spec_overrides ?? {}) } as Record<string, any>;
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
      const tyreLabelIdentity = getTyreLabelIdentity(specOverrides);
      const hasEanOverride =
        (hasOwn(tyreLabelIdentity, 'ean') || hasOwn(identityOverride, 'ean')) &&
        selectedTire.supplier_code_best &&
        selectedTire.supplier_external_id_best;
      const eanDigits = resolveEffectiveIdentity(specOverrides, selectedTire).ean;
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
      const effectiveIdentity = resolveEffectiveIdentity(specOverrides, selectedTire);
      const effectiveFeatures = resolveEffectiveFeatures(specOverrides, selectedTire);
      const effectiveEu = resolveEffectiveEu(specOverrides, selectedTire);
      const currentTyreLabelSection = (specOverrides.tyre_label_section ?? {}) as Record<string, any>;
      const currentTyreLabelIdentity = (currentTyreLabelSection.identity ?? {}) as Record<string, any>;
      const currentTyreLabelCompliance = (currentTyreLabelSection.compliance ?? {}) as Record<string, any>;
      specOverrides.tyre_label_section = buildTyreLabelSectionData({
        existing: specOverrides.tyre_label_section,
        brand: effectiveIdentity.brand,
        model: effectiveIdentity.model,
        tyreTypeIdentifier: currentTyreLabelIdentity.tyre_type_identifier ?? null,
        sizeString: effectiveIdentity.size_string,
        season: effectiveIdentity.season,
        loadIndex: effectiveIdentity.load_index,
        speedRating: effectiveIdentity.speed_rating,
        ean: effectiveIdentity.ean,
        supplierCodeBest: selectedTire.supplier_code_best,
        runflat: effectiveFeatures.runflat,
        xlReinforced: effectiveFeatures.xl,
        evReady: effectiveFeatures.ev_ready,
        studded: effectiveFeatures.studded,
        threepmsf: effectiveFeatures.threepmsf,
        winterApproved: effectiveFeatures.winter_approved,
        iceApproved: effectiveFeatures.ice_approved,
        euFuelClass: effectiveEu.fuel_class,
        euWetGripClass: effectiveEu.wet_grip_class,
        euNoiseDb: effectiveEu.noise_db,
        euNoiseClass: effectiveEu.noise_class,
        eprelRegistrationNumber: selectedTire.eprel_registration_number ?? selectedTire.eprel_code ?? null,
        eprelQrUrl: selectedTire.eprel_qr_url ?? null,
        eprelSheetUrl: selectedTire.eprel_sheet_url ?? null,
        productionStart: currentTyreLabelCompliance.production_start ?? null,
        productionEnd: currentTyreLabelCompliance.production_end ?? null,
        marketStart: currentTyreLabelCompliance.market_start ?? null,
        supplierWebsite: currentTyreLabelCompliance.supplier_website ?? null,
        supplierContactName: currentTyreLabelCompliance.supplier_contact_name ?? null,
        supplierContactEmail: currentTyreLabelCompliance.supplier_contact_email ?? null,
        supplierContactPhone: currentTyreLabelCompliance.supplier_contact_phone ?? null,
        dataSource: currentTyreLabelCompliance.data_source ?? selectedTire.eprel_source ?? null,
        dataSourceUrl: currentTyreLabelCompliance.data_source_url ?? selectedTire.eprel_source_url ?? null,
        lastVerifiedAt: currentTyreLabelCompliance.last_verified_at ?? null,
      });
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

      const { error: imageSyncError } = await supabase.rpc('catalog_sync_cms_item_images_v1', {
        p_selected_item_id: targetVariantId,
        p_image_urls: buildCmsImageUrls(payload),
      });

      if (imageSyncError) throw imageSyncError;

      if (eprelMatchId) {
        const { error: eprelApplyError } = await supabase
          .from('cms_tire_eprel_field_reviews')
          .update({ applied_to_product: true })
          .eq('eprel_match_id', eprelMatchId)
          .eq('review_status', 'accepted');

      if (eprelApplyError) {
          console.error('Mark EPREL review rows applied error:', eprelApplyError);
        }
      }
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

      void refreshAdminSnapshot();

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

      void refreshAdminSnapshot();
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

      const { error: imageSyncError } = await supabase.rpc('catalog_sync_cms_item_images_v1', {
        p_selected_item_id: selectedTire.variant_id,
        p_image_urls: [],
      });

      if (imageSyncError) throw imageSyncError;

      patchLocalCmsData(selectedTire.variant_id, null);
      setHasPendingCatalogSync(true);
      setCatalogSyncMessage(
        language === 'fi'
          ? 'CMS-ohitukset poistettu. Suorita "Apply Sync" julkaistaksesi muutokset katalogiin.'
          : 'CMS overrides cleared. Run "Apply Sync" to publish changes to catalog.'
      );
      void refreshAdminSnapshot();
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
