import React, { useState } from 'react';
import { useTheme } from '../ThemeContext';
import { useLanguage } from '../LanguageContext';
import { supabase } from '../../utils/supabase/client';
import { X, Save, AlertCircle, Upload, GripVertical, RotateCcw } from 'lucide-react';
import { TiresCmsToolbar } from './tires/TiresCmsToolbar';
import { TiresImagesSection } from './tires/TiresImagesSection';
import { TiresBadgesSection } from './tires/TiresBadgesSection';
import { TiresCmsTableSection } from './tires/TiresCmsTableSection';
import { TiresContentSection } from './tires/TiresContentSection';
import { TiresEuLabelSection } from './tires/TiresEuLabelSection';
import { TiresIdentitySection } from './tires/TiresIdentitySection';
import { TiresPricingSection } from './tires/TiresPricingSection';
import { TiresSeoSection } from './tires/TiresSeoSection';
import { TiresVisibilitySection } from './tires/TiresVisibilitySection';
import { TiresWarningTooltip } from './tires/TiresWarningTooltip';
import { useTiresCmsList } from './tires/useTiresCmsList';
import type { ProductCMS, TireRow, TiresWarningTooltipState } from './tires/types';
import {
  calculateLinePricing,
  getPricingRulesFromSpecOverrides,
  isFixedBundleTotalCompatible,
  setPricingRulesToSpecOverrides,
  type BundlePricingMode,
  type ProductPricingRules,
} from '../../utils/pricing';

const EU_FUEL_WET_OPTIONS = ['A', 'B', 'C', 'D', 'E'];
const EU_NOISE_CLASS_OPTIONS = ['A', 'B', 'C'];
const VAT_RATE = 0.255;
const VAT_MULTIPLIER = 1 + VAT_RATE;

const SUPPLIER_OPTIONS = [
  { code: 'RD', label: 'Rengasduo' },
  { code: 'VT', label: 'Vannetukku' },
];

function getSupplierLabel(code: string | null | undefined) {
  const normalized = String(code ?? '').trim().toUpperCase();
  const known = SUPPLIER_OPTIONS.find((option) => option.code === normalized);
  return known?.label ?? (normalized || 'Unknown supplier');
}

export function TiresCMSPage() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isDark = theme === 'dark';
  const [selectedTire, setSelectedTire] = useState<TireRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [syncingCatalog, setSyncingCatalog] = useState(false);
  const [hasPendingCatalogSync, setHasPendingCatalogSync] = useState(false);
  const [catalogSyncMessage, setCatalogSyncMessage] = useState<string | null>(null);
  const [sizeParts, setSizeParts] = useState({ width: '', aspect: '', rim: '', load_index: '', speed_rating: '' });
  const [warningTooltip, setWarningTooltip] = useState<TiresWarningTooltipState | null>(null);

  // Edit state
  const [editData, setEditData] = useState<Partial<ProductCMS>>({});

  // Image upload state
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [supplierMarkupSupplier, setSupplierMarkupSupplier] = useState('RD');
  const [supplierMarkupAmount, setSupplierMarkupAmount] = useState('20');

  const {
    currentPage,
    endItem,
    error,
    fetchTires,
    loading,
    paginationItems,
    patchLocalCmsData,
    patchLocalIdentityData,
    searchTerm,
    setCurrentPage,
    setSearchTerm,
    setShowMissingEanOnly,
    showMissingEanOnly,
    startItem,
    tires,
    totalCount,
    totalPages,
  } = useTiresCmsList(25);

  const toNumberOrNull = (value: any) => {
    if (value === null || value === undefined || value === '') return null;
    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const toPriceWithVat = (priceWithoutVat: number | null | undefined) => {
    const numeric = toNumberOrNull(priceWithoutVat);
    if (numeric === null) return null;
    return numeric * VAT_MULTIPLIER;
  };

  const normalizeTextOrNull = (value: any) => {
    if (value === null || value === undefined) return null;
    const text = String(value).trim();
    return text.length > 0 ? text : null;
  };

  const normalizeGallery = (value: any): string[] => {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => normalizeTextOrNull(item))
      .filter((item): item is string => Boolean(item));
  };

  const normalizeSpecOverrides = (value: any): any => {
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
  };

  const stableSerialize = (value: any): string => {
    if (Array.isArray(value)) {
      return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
    }
    if (value && typeof value === 'object') {
      const keys = Object.keys(value).sort((a, b) => a.localeCompare(b));
      const serialized = keys.map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`);
      return `{${serialized.join(',')}}`;
    }
    return JSON.stringify(value);
  };

  const buildComparableCmsData = (
    variantId: string,
    source: Partial<ProductCMS> | null | undefined
  ) => {
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
  };

  const isValidEan13 = (ean: string) => {
    if (!/^\d{13}$/.test(ean)) return false;
    const digits = ean.split('').map((d) => Number(d));
    const check = digits[12];
    const sum = digits
      .slice(0, 12)
      .reduce((acc, digit, idx) => acc + digit * (idx % 2 === 0 ? 1 : 3), 0);
    const expected = (10 - (sum % 10)) % 10;
    return check === expected;
  };

  const getManualNonPassengerFlag = (specOverrides: any) =>
    Boolean(specOverrides?.classification?.non_passenger_manual);

    const parseTireSize = (size?: string | null) => {
    const cleaned = size?.trim() ?? '';
    const baseMatch = cleaned.match(/(\d{3})\s*\/\s*(\d{2})\s*R?\s*(\d{2})/i);

    if (!baseMatch) {
      return { width: '', aspect: '', rim: '', load_index: '', speed_rating: '' };
    }

    const tail = cleaned.slice((baseMatch.index ?? 0) + baseMatch[0].length).trim();
    const liSrMatch = tail.match(/^(\d{2,3})\s*([A-Z]{1,2})/i);

    return {
      width: baseMatch[1],
      aspect: baseMatch[2],
      rim: baseMatch[3],
      load_index: liSrMatch?.[1] || '',
      speed_rating: (liSrMatch?.[2] || '').toUpperCase(),
    };
  };

  const formatTireSize = (parts: { width: string; aspect: string; rim: string; load_index?: string; speed_rating?: string }) => {
    if (!parts.width && !parts.aspect && !parts.rim && !parts.load_index && !parts.speed_rating) {
      return '';
    }

    if (!parts.width || !parts.aspect || !parts.rim) {
      return '';
    }

    const li = (parts.load_index || '').trim();
    const sr = (parts.speed_rating || '').trim().toUpperCase();
    return `${parts.width} / ${parts.aspect} R${parts.rim}${li ? ` ${li}` : ''}${sr ? ` ${sr}` : ''}`.trim();
  };

  const hasMissingSupplierPrice = (tire: TireRow | null) =>
    !tire || tire.final_price_eur === null || tire.final_price_eur === undefined;

  const mustHideFromStore = (tire: TireRow | null) =>
    hasMissingSupplierPrice(tire) || Boolean(tire?.is_non_passenger);

  const getWarningReasons = (tire: TireRow) => {
    const reasons: string[] = [];

    if (tire.has_duplicate_ean_conflict) {
      reasons.push(language === 'fi' ? 'Sama EAN löytyy useasta eri tuotteesta/specistä' : 'Same EAN appears on multiple different variants/specs');
    }
    if (tire.has_mandatory_field_conflict) {
      reasons.push(language === 'fi' ? 'Pakollisia kenttiä puuttuu' : 'Mandatory fields are missing');
    }
    if (tire.has_missing_ean) {
      reasons.push(language === 'fi' ? 'EAN puuttuu tai on väliaikainen' : 'EAN is missing or still a placeholder');
    }
    if (Boolean(tire.ean_conflict_open) && reasons.length === 0) {
      reasons.push(language === 'fi' ? 'Katalogissa on avoin konflikti tälle tuotteelle' : 'There is an open catalog conflict for this item');
    }

    return reasons;
  };

  const getWarningTooltip = (tire: TireRow) => {
    const reasons = getWarningReasons(tire);
    if (reasons.length === 0) {
      return language === 'fi' ? 'Varoitus' : 'Warning';
    }
    const prefix = language === 'fi' ? 'Varoitus:' : 'Warning:';
    return `${prefix} ${reasons.join(' | ')}`;
  };

  const showWarningTooltip = (text: string, x: number, y: number) => {
    setWarningTooltip({ text, x: x + 12, y: y + 12 });
  };

  const hideWarningTooltip = () => {
    setWarningTooltip(null);
  };

  const getEffectiveIdentity = (tire: TireRow | null) => {
    const identity = (tire?.cms_data?.spec_overrides as any)?.identity ?? {};
    const baseSize = (identity.size_string?.trim() || tire?.size_string || '').trim();
    const loadIndex = String(identity.load_index ?? tire?.load_index ?? '').trim();
    const speedRaw = String(identity.speed_rating ?? tire?.speed_rating ?? tire?.speed_index ?? '').trim();
    const speedIndex = speedRaw.toUpperCase();
    const hasLiSiInSize = /\s\d{2,3}\s?[A-Z]{1,2}$/.test(baseSize.toUpperCase());
    const liSiSuffix = `${loadIndex}${speedIndex ? ` ${speedIndex}` : ''}`.trim();
    const sizeWithLiSi = baseSize && !hasLiSiInSize && liSiSuffix
      ? `${baseSize} ${liSiSuffix}`.trim()
      : baseSize;

    return {
      brand: identity.brand?.trim() || tire?.brand || '',
      model: identity.model?.trim() || tire?.model || '',
      size_string: sizeWithLiSi,
    };
  };

  const handleEdit = (tire: TireRow) => {
    setSelectedTire(tire);
    setSupplierMarkupSupplier(String(tire.supplier_code_best ?? 'RD').trim().toUpperCase() || 'RD');
    setSupplierMarkupAmount('20');
    
    // Initialize edit data
    const cms = tire.cms_data;
    setEditData({
      variant_id: tire.variant_id,
      title: cms?.title ?? '',
      subtitle: cms?.subtitle ?? '',
      short_description: cms?.short_description ?? '',
      long_description: cms?.long_description ?? '',
      hero_image_url: cms?.hero_image_url ?? null,
      gallery: cms?.gallery ?? [],
      seo_slug: cms?.seo_slug ?? '',
      seo_title: cms?.seo_title ?? '',
      seo_description: cms?.seo_description ?? '',
      is_hidden: cms?.is_hidden ?? mustHideFromStore(tire),
      spec_overrides: cms?.spec_overrides ?? {},
      price_override_eur: cms?.price_override_eur ?? null,
      promo_enabled: cms?.promo_enabled ?? false,
      promo_price_eur: cms?.promo_price_eur ?? null,
      promo_start: cms?.promo_start ?? null,
      promo_end: cms?.promo_end ?? null,
    });

    const sizeSource =
      (cms?.spec_overrides as any)?.identity?.size_string ??
      tire.size_string ??
      '';
    const parsedSize = parseTireSize(sizeSource);
    setSizeParts({
      ...parsedSize,
      load_index: String((cms?.spec_overrides as any)?.identity?.load_index ?? tire.load_index ?? parsedSize.load_index ?? ''),
      speed_rating: String((cms?.spec_overrides as any)?.identity?.speed_rating ?? tire.speed_rating ?? tire.speed_index ?? parsedSize.speed_rating ?? '').toUpperCase(),
    });
    
    setDrawerOpen(true);
    setUploadError(null);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedTire(null);
    setEditData({});
    setSaveError(null);
    setUploadError(null);
    setSizeParts({ width: '', aspect: '', rim: '', load_index: '', speed_rating: '' });
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
          language === 'fi'
            ? 'Ei uusia muutoksia synkronoitavaksi.'
            : 'No new changes to sync.'
        );
        handleCloseDrawer();
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

      // Upsert to product_cms
      const { error } = await supabase
        .from('product_cms')
        .upsert(payload, { onConflict: 'variant_id' });

      if (error) throw error;
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
        await supabase
          .from('product_cms')
          .delete()
          .eq('variant_id', selectedTire.variant_id);

        await fetchTires();
      } else {
        patchLocalCmsData(targetVariantId, payload);
        patchLocalIdentityData(targetVariantId, specOverrides);
      }
      handleCloseDrawer();
    } catch (err: any) {
      console.error('Save error:', err);
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleApplyCatalogSync = async () => {
    if (syncingCatalog) return;
    setSyncingCatalog(true);
    setSaveError(null);
    setCatalogSyncMessage(null);

    try {
      const { data: offersRun, error: offersError } = await supabase.rpc('catalog_build_offers_v3', { p_limit: 200000 });
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
    } catch (err: any) {
      console.error('Toggle visibility error:', err);
      setCatalogSyncMessage(err.message);
    }
  };

  // Image upload functions
  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedTire) return;

    setUploadingImages(true);
    setUploadError(null);

    try {
      const currentGallery = (editData.gallery as string[]) || [];
      if (currentGallery.length + files.length > 10) {
        throw new Error('Maximum 10 images allowed');
      }

      const newImages: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image`);
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} exceeds 5MB limit`);
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const ext = file.name.split('.').pop();
        const filename = `${timestamp}_${randomStr}.${ext}`;
        const path = `tires/${selectedTire.variant_id}/${filename}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(path);

        newImages.push(publicUrl);
      }

      // Add new images to gallery
      const updatedGallery = [...currentGallery, ...newImages];
      setEditData(prev => ({
        ...prev,
        gallery: updatedGallery,
        hero_image_url: updatedGallery[0] || prev.hero_image_url
      }));

    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = async (index: number) => {
    const gallery = (editData.gallery as string[]) || [];
    const imageUrl = gallery[index];
    
    // Try to delete from storage
    try {
      const urlPath = new URL(imageUrl).pathname;
      const pathParts = urlPath.split('/product-images/');
      if (pathParts.length > 1) {
        const storagePath = pathParts[1];
        await supabase.storage.from('product-images').remove([storagePath]);
      }
    } catch (error) {
      console.warn('Could not delete from storage:', error);
    }

    // Remove from gallery
    const updatedGallery = gallery.filter((_, i) => i !== index);
    setEditData(prev => ({
      ...prev,
      gallery: updatedGallery,
      hero_image_url: updatedGallery[0] || null
    }));
  };

  const handleImageReorder = (newGallery: string[]) => {
    setEditData(prev => ({
      ...prev,
      gallery: newGallery,
      hero_image_url: newGallery[0] || prev.hero_image_url
    }));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const gallery = (editData.gallery as string[]) || [];
    const newGallery = [...gallery];
    const draggedItem = newGallery[draggedIndex];
    newGallery.splice(draggedIndex, 1);
    newGallery.splice(index, 0, draggedItem);
    
    handleImageReorder(newGallery);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // EU override helpers
  const getEUOverride = () => {
    return editData.spec_overrides?.eu || null;
  };

  const setEUField = (field: string, value: any) => {
    const currentOverrides = editData.spec_overrides || {};
    const currentEU = currentOverrides.eu || {};
    
    const updatedEU = { ...currentEU, [field]: value };
    
    setEditData(prev => ({
      ...prev,
      spec_overrides: {
        ...currentOverrides,
        eu: updatedEU
      }
    }));
  };

  const clearEUOverrides = () => {
    const currentOverrides = editData.spec_overrides || {};
    const { eu, ...restOverrides } = currentOverrides;
    
    setEditData(prev => ({
      ...prev,
      spec_overrides: Object.keys(restOverrides).length > 0 ? restOverrides : null
    }));
  };

  const hasEUOverride = () => {
    const override = getEUOverride();
    return override && Object.keys(override).length > 0;
  };

  const getIdentityOverride = () => {
    return editData.spec_overrides?.identity || null;
  };

  const setIdentityField = (field: 'brand' | 'model' | 'ean' | 'size_string' | 'season' | 'load_index' | 'speed_rating', value?: string) => {
    setEditData(prev => {
      const currentOverrides = prev.spec_overrides || {};
      const currentIdentity = currentOverrides.identity || {};

      const updatedIdentity = { ...currentIdentity } as Record<string, string>;
      if (value === undefined) {
        delete updatedIdentity[field];
      } else {
        updatedIdentity[field] = value;
      }

      const { identity, ...restOverrides } = currentOverrides;
      const nextOverrides = {
        ...restOverrides,
        ...(Object.keys(updatedIdentity).length > 0 ? { identity: updatedIdentity } : {})
      };

      return {
        ...prev,
        spec_overrides: Object.keys(nextOverrides).length > 0 ? nextOverrides : null
      };
    });
  };

  const clearIdentityOverrides = () => {
    setEditData(prev => {
      const currentOverrides = prev.spec_overrides || {};
      const { identity, ...restOverrides } = currentOverrides;

      return {
        ...prev,
        spec_overrides: Object.keys(restOverrides).length > 0 ? restOverrides : null
      };
    });
    setSizeParts(parseTireSize(selectedTire?.size_string ?? ''));
  };

  const updateSizePart = (field: 'width' | 'aspect' | 'rim' | 'load_index' | 'speed_rating', value: string) => {
    setSizeParts(prev => {
      const next = { ...prev, [field]: value };
      setIdentityField('size_string', formatTireSize(next));
      setIdentityField('load_index', next.load_index || undefined);
      setIdentityField('speed_rating', next.speed_rating?.toUpperCase() || undefined);
      return next;
    });
  };

  const getFeatureOverrides = () => editData.spec_overrides?.features || null;

  const getBaseFeatureValue = (field: 'ev_ready' | 'runflat' | 'xl' | 'studded' | 'threepmsf' | 'winter_approved' | 'ice_approved') => {
    if (!selectedTire) return false;
    switch (field) {
      case 'ev_ready':
        return Boolean((selectedTire as any).ev_ready);
      case 'runflat':
        return Boolean(selectedTire.runflat);
      case 'xl':
        return Boolean(selectedTire.xl_reinforced);
      case 'studded':
        return Boolean(selectedTire.studded);
      case 'threepmsf':
        return Boolean((selectedTire as any).threepmsf);
      case 'winter_approved':
        return Boolean((selectedTire as any).winter_approved) || selectedTire.season === 'winter' || selectedTire.season === 'all_season';
      case 'ice_approved':
        return Boolean((selectedTire as any).ice_approved);
      default:
        return false;
    }
  };

  const getEffectiveFeatureValue = (field: 'ev_ready' | 'runflat' | 'xl' | 'studded' | 'threepmsf' | 'winter_approved' | 'ice_approved') => {
    const overrides = getFeatureOverrides();
    if (overrides && Object.prototype.hasOwnProperty.call(overrides, field)) {
      return Boolean(overrides[field]);
    }
    return getBaseFeatureValue(field);
  };

  const setFeatureField = (field: 'ev_ready' | 'runflat' | 'xl' | 'studded' | 'threepmsf' | 'winter_approved' | 'ice_approved', value: boolean) => {
    setEditData((prev) => {
      const currentOverrides = prev.spec_overrides || {};
      const currentFeatures = { ...(currentOverrides.features || {}) };
      currentFeatures[field] = value;
      return {
        ...prev,
        spec_overrides: {
          ...currentOverrides,
          features: currentFeatures,
        },
      };
    });
  };

  const clearFeatureOverrides = () => {
    setEditData((prev) => {
      const currentOverrides = prev.spec_overrides || {};
      const { features, ...rest } = currentOverrides;
      return {
        ...prev,
        spec_overrides: Object.keys(rest).length > 0 ? rest : null,
      };
    });
  };

  const getBundlePricing = (): ProductPricingRules | null =>
    getPricingRulesFromSpecOverrides(editData.spec_overrides);

  const getBundleTier = (qty: 2 | 4) =>
    qty === 2 ? (getBundlePricing()?.qty2 ?? null) : (getBundlePricing()?.qty4 ?? null);

  const setBundleTier = (qty: 2 | 4, tier: { mode?: BundlePricingMode; percent_off?: number | null; fixed_total_eur?: number | null }) => {
    setEditData((prev) => {
      const currentPricing = getPricingRulesFromSpecOverrides(prev.spec_overrides) ?? { qty2: null, qty4: null };
      const key = qty === 2 ? 'qty2' : 'qty4';
      const existingTier = currentPricing[key] ?? { mode: 'none' as BundlePricingMode, percent_off: null, fixed_total_eur: null };
      const mergedTier = {
        ...existingTier,
        ...tier,
      };
      const nextPricing: ProductPricingRules = {
        qty2: key === 'qty2' ? mergedTier : currentPricing.qty2,
        qty4: key === 'qty4' ? mergedTier : currentPricing.qty4,
      };

      return {
        ...prev,
        spec_overrides: setPricingRulesToSpecOverrides(prev.spec_overrides, nextPricing),
      };
    });
  };

  const clearBundlePricing = () => {
    setEditData((prev) => ({
      ...prev,
      spec_overrides: setPricingRulesToSpecOverrides(prev.spec_overrides, null),
    }));
  };

  const handleResetCms = async () => {
    if (!selectedTire) return;
    if (!selectedTire.cms_data) {
      setCatalogSyncMessage(language === 'fi' ? 'Ei uusia muutoksia synkronoitavaksi.' : 'No new changes to sync.');
      handleCloseDrawer();
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

      patchLocalCmsData(selectedTire.variant_id, null);
      setHasPendingCatalogSync(true);
      setCatalogSyncMessage(
        language === 'fi'
          ? 'CMS-ohitukset poistettu. Suorita "Apply Sync" julkaistaksesi muutokset katalogiin.'
          : 'CMS overrides cleared. Run "Apply Sync" to publish changes to catalog.'
      );
      handleCloseDrawer();
    } catch (err: any) {
      console.error('Reset error:', err);
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredTires = tires;

  const applySupplierMarkup = () => {
    if (!selectedTire) return;

    const selectedSupplier = String(supplierMarkupSupplier ?? '').trim().toUpperCase();
    const tireSupplier = String(selectedTire.supplier_code_best ?? '').trim().toUpperCase();
    const baseApiPrice =
      selectedTire.price !== null && selectedTire.price !== undefined
        ? Number(selectedTire.price)
        : null;
    const markupAmount = Number(supplierMarkupAmount);

    if (!baseApiPrice || !Number.isFinite(baseApiPrice)) {
      setSaveError(language === 'fi' ? 'API-hintaa ei löytynyt tälle tuotteelle.' : 'No API price was found for this tire.');
      return;
    }

    if (!Number.isFinite(markupAmount)) {
      setSaveError(language === 'fi' ? 'Lisähinnan pitää olla numero.' : 'Markup amount must be a number.');
      return;
    }

    if (selectedSupplier !== tireSupplier) {
      setSaveError(
        language === 'fi'
          ? `Valittu toimittaja (${getSupplierLabel(selectedSupplier)}) ei vastaa renkaan toimittajaa (${getSupplierLabel(tireSupplier)}).`
          : `Selected supplier (${getSupplierLabel(selectedSupplier)}) does not match this tire's supplier (${getSupplierLabel(tireSupplier)}).`
      );
      return;
    }

    setSaveError(null);
    setEditData((prev) => ({
      ...prev,
      price_override_eur: Math.round((baseApiPrice + markupAmount) * 100) / 100,
    }));
  };

  const originalApiPrice =
    selectedTire?.price !== null && selectedTire?.price !== undefined
      ? Number(selectedTire.price)
      : null;
  const effectiveDraftPrice =
    editData.promo_enabled && editData.promo_price_eur !== null && editData.promo_price_eur !== undefined
      ? Number(editData.promo_price_eur)
      : editData.price_override_eur !== null && editData.price_override_eur !== undefined
        ? Number(editData.price_override_eur)
        : originalApiPrice;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0B0D10]' : 'bg-gray-50'}`}>
      <TiresWarningTooltip isDark={isDark} warningTooltip={warningTooltip} />
      <TiresCmsToolbar
        isDark={isDark}
        language={language}
        searchTerm={searchTerm}
        showMissingEanOnly={showMissingEanOnly}
        syncingCatalog={syncingCatalog}
        hasPendingCatalogSync={hasPendingCatalogSync}
        catalogSyncMessage={catalogSyncMessage}
        onSearchTermChange={setSearchTerm}
        onShowMissingEanOnlyChange={setShowMissingEanOnly}
        onApplyCatalogSync={handleApplyCatalogSync}
      />

      {/* Main Content */}
      <div className="px-8 py-6">
        <TiresCmsTableSection
          currentPage={currentPage}
          endItem={endItem}
          error={error}
          filteredTires={filteredTires}
          getEffectiveIdentity={getEffectiveIdentity}
          getWarningTooltip={getWarningTooltip}
          handleEdit={handleEdit}
          handleToggleVisibility={handleToggleVisibility}
          hasMissingSupplierPrice={hasMissingSupplierPrice}
          hideWarningTooltip={hideWarningTooltip}
          isDark={isDark}
          language={language}
          loading={loading}
          mustHideFromStore={mustHideFromStore}
          onPageChange={setCurrentPage}
          paginationItems={paginationItems}
          showWarningTooltip={showWarningTooltip}
          startItem={startItem}
          totalCount={totalCount}
          totalPages={totalPages}
        />
      </div>

      {/* Edit Drawer */}
      {drawerOpen && selectedTire && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseDrawer}
          />

          {/* Drawer */}
          <div className={`absolute right-0 top-0 bottom-0 w-full max-w-3xl ${
            isDark ? 'bg-[#0B0D10]' : 'bg-white'
          } shadow-2xl overflow-y-auto`}>
            {/* Drawer Header */}
            <div className={`sticky top-0 z-10 border-b ${
              isDark ? 'bg-[#161A22] border-white/10' : 'bg-white border-gray-200'
            } px-6 py-4 flex items-center justify-between`}>
              <div>
                <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fi' ? 'Muokkaa rengasta' : 'Edit Tire'}
                </h2>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {getEffectiveIdentity(selectedTire).brand} {getEffectiveIdentity(selectedTire).model} — {getEffectiveIdentity(selectedTire).size_string || '—'}
                </p>
              </div>
              <button
                onClick={handleCloseDrawer}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                }`}
              >
                <X className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="px-6 py-6 space-y-8">
              
              <TiresIdentitySection
                baseBrand={selectedTire.brand}
                baseDerivedEan={selectedTire.derived_ean}
                baseEan={selectedTire.ean}
                baseModel={selectedTire.model}
                baseSeason={selectedTire.season}
                clearIdentityOverrides={clearIdentityOverrides}
                getIdentityOverride={getIdentityOverride}
                isDark={isDark}
                language={language}
                setIdentityField={setIdentityField}
                sizeParts={sizeParts}
                updateSizePart={updateSizePart}
              />

              <TiresBadgesSection
                clearFeatureOverrides={clearFeatureOverrides}
                getEffectiveFeatureValue={getEffectiveFeatureValue}
                isDark={isDark}
                language={language}
                setFeatureField={setFeatureField}
              />

              <TiresEuLabelSection
                euFuelWetOptions={EU_FUEL_WET_OPTIONS}
                euNoiseClassOptions={EU_NOISE_CLASS_OPTIONS}
                getEuOverride={getEUOverride}
                hasEuOverride={hasEUOverride()}
                isDark={isDark}
                language={language}
                onClearEuOverrides={clearEUOverrides}
                onSetEuField={setEUField}
                selectedTire={selectedTire}
              />

              {/* Section C: Pricing */}
              <TiresPricingSection
                editData={editData}
                effectiveDraftPrice={effectiveDraftPrice}
                getSupplierLabel={getSupplierLabel}
                isDark={isDark}
                language={language}
                onApplySupplierMarkup={applySupplierMarkup}
                onEditDataChange={(updater) => setEditData((prev) => updater(prev))}
                originalApiPrice={originalApiPrice}
                selectedTire={selectedTire}
                setSupplierMarkupAmount={setSupplierMarkupAmount}
                setSupplierMarkupSupplier={setSupplierMarkupSupplier}
                supplierMarkupAmount={supplierMarkupAmount}
                supplierMarkupSupplier={supplierMarkupSupplier}
                supplierOptions={SUPPLIER_OPTIONS}
                toPriceWithVat={toPriceWithVat}
              >
                <div className="border-t pt-4 border-white/10 space-y-4">
                  {(() => {
                    const bundlePricing = getBundlePricing();
                    const tier2 = bundlePricing?.qty2 ?? { mode: 'none' as BundlePricingMode, percent_off: null, fixed_total_eur: null };
                    const tier4 = bundlePricing?.qty4 ?? { mode: 'none' as BundlePricingMode, percent_off: null, fixed_total_eur: null };
                    const basePrice = Number(selectedTire.final_price_eur ?? selectedTire.price ?? 0);
                    const preview2 = calculateLinePricing(basePrice, 2, bundlePricing);
                    const preview4 = calculateLinePricing(basePrice, 4, bundlePricing);
                    const invalidFixed2 = tier2.mode === 'fixed_total' && tier2.fixed_total_eur !== null && !isFixedBundleTotalCompatible(tier2.fixed_total_eur, 2);
                    const invalidFixed4 = tier4.mode === 'fixed_total' && tier4.fixed_total_eur !== null && !isFixedBundleTotalCompatible(tier4.fixed_total_eur, 4);

                    return (
                      <>
                        <div>
                          <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {language === 'fi' ? 'Pakettihinnoittelu (2 / 4 kpl)' : 'Bundle pricing (2 / 4 items)'}
                          </h4>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {language === 'fi'
                              ? 'Valitse alennusprosentti tai kiinteä kokonaishinta 2 tai 4 kappaleelle.'
                              : 'Choose percentage discount or fixed total for bundles of 2 or 4 units.'}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className={`rounded-lg border p-3 space-y-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>2 {language === 'fi' ? 'kpl' : 'items'}</p>
                            <select
                              value={tier2.mode}
                              onChange={(e) => setBundleTier(2, {
                                mode: e.target.value as BundlePricingMode,
                                percent_off: null,
                                fixed_total_eur: null,
                              })}
                              className={`w-full px-3 py-2 rounded-lg border ${
                                isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            >
                              <option value="none">{language === 'fi' ? 'Ei alennusta' : 'No bundle discount'}</option>
                              <option value="percent">{language === 'fi' ? 'Alennus %' : 'Discount %'}</option>
                              <option value="fixed_total">{language === 'fi' ? 'Kiinteä kokonaishinta' : 'Fixed total price'}</option>
                            </select>
                            {tier2.mode === 'percent' && (
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={tier2.percent_off ?? ''}
                                onChange={(e) => setBundleTier(2, { percent_off: e.target.value ? Number(e.target.value) : null })}
                                placeholder={language === 'fi' ? 'Esim. 5' : 'e.g. 5'}
                                className={`w-full px-3 py-2 rounded-lg border ${
                                  isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              />
                            )}
                            {tier2.mode === 'fixed_total' && (
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={tier2.fixed_total_eur ?? ''}
                                onChange={(e) => setBundleTier(2, { fixed_total_eur: e.target.value ? Number(e.target.value) : null })}
                                placeholder={language === 'fi' ? 'Esim. 220.00' : 'e.g. 220.00'}
                                className={`w-full px-3 py-2 rounded-lg border ${
                                  isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              />
                            )}
                            {invalidFixed2 && (
                              <p className={`text-xs ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                                {language === 'fi'
                                  ? 'Kiinteä hinta ei jakaudu tasan 2 kappaleelle senttitasolla.'
                                  : 'Fixed total does not divide evenly across 2 units in cents.'}
                              </p>
                            )}
                            <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {language === 'fi' ? 'Esikatselu:' : 'Preview:'} €{preview2.lineTotalEur.toFixed(2)}
                              {preview2.savingsEur > 0 ? ` (${language === 'fi' ? 'säästö' : 'saving'} €${preview2.savingsEur.toFixed(2)})` : ''}
                            </p>
                          </div>

                          <div className={`rounded-lg border p-3 space-y-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>4 {language === 'fi' ? 'kpl' : 'items'}</p>
                            <select
                              value={tier4.mode}
                              onChange={(e) => setBundleTier(4, {
                                mode: e.target.value as BundlePricingMode,
                                percent_off: null,
                                fixed_total_eur: null,
                              })}
                              className={`w-full px-3 py-2 rounded-lg border ${
                                isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            >
                              <option value="none">{language === 'fi' ? 'Ei alennusta' : 'No bundle discount'}</option>
                              <option value="percent">{language === 'fi' ? 'Alennus %' : 'Discount %'}</option>
                              <option value="fixed_total">{language === 'fi' ? 'Kiinteä kokonaishinta' : 'Fixed total price'}</option>
                            </select>
                            {tier4.mode === 'percent' && (
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={tier4.percent_off ?? ''}
                                onChange={(e) => setBundleTier(4, { percent_off: e.target.value ? Number(e.target.value) : null })}
                                placeholder={language === 'fi' ? 'Esim. 10' : 'e.g. 10'}
                                className={`w-full px-3 py-2 rounded-lg border ${
                                  isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              />
                            )}
                            {tier4.mode === 'fixed_total' && (
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={tier4.fixed_total_eur ?? ''}
                                onChange={(e) => setBundleTier(4, { fixed_total_eur: e.target.value ? Number(e.target.value) : null })}
                                placeholder={language === 'fi' ? 'Esim. 420.00' : 'e.g. 420.00'}
                                className={`w-full px-3 py-2 rounded-lg border ${
                                  isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              />
                            )}
                            {invalidFixed4 && (
                              <p className={`text-xs ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                                {language === 'fi'
                                  ? 'Kiinteä hinta ei jakaudu tasan 4 kappaleelle senttitasolla.'
                                  : 'Fixed total does not divide evenly across 4 units in cents.'}
                              </p>
                            )}
                            <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {language === 'fi' ? 'Esikatselu:' : 'Preview:'} €{preview4.lineTotalEur.toFixed(2)}
                              {preview4.savingsEur > 0 ? ` (${language === 'fi' ? 'säästö' : 'saving'} €${preview4.savingsEur.toFixed(2)})` : ''}
                            </p>
                          </div>
                        </div>

                        {(bundlePricing?.qty2 || bundlePricing?.qty4) && (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={clearBundlePricing}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                                isDark
                                  ? 'border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400'
                                  : 'border-red-300 bg-red-50 hover:bg-red-100 text-red-700'
                              }`}
                            >
                              <RotateCcw className="w-4 h-4" />
                              {language === 'fi' ? 'Tyhjennä pakettihinnoittelu' : 'Clear bundle pricing'}
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </TiresPricingSection>

              <TiresImagesSection
                draggedIndex={draggedIndex}
                editGallery={(editData.gallery as string[]) ?? []}
                handleDragEnd={handleDragEnd}
                handleDragOver={handleDragOver}
                handleDragStart={handleDragStart}
                handleImageUpload={handleImageUpload}
                handleRemoveImage={handleRemoveImage}
                isDark={isDark}
                language={language}
                uploadError={uploadError}
                uploadingImages={uploadingImages}
              />

              <TiresContentSection
                editData={editData}
                identityBrand={getEffectiveIdentity(selectedTire).brand}
                identityModel={getEffectiveIdentity(selectedTire).model}
                identitySizeString={getEffectiveIdentity(selectedTire).size_string}
                isDark={isDark}
                language={language}
                onEditDataChange={(updater) => setEditData((prev) => updater(prev))}
              />

              <TiresSeoSection
                editData={editData}
                isDark={isDark}
                language={language}
                onEditDataChange={(updater) => setEditData((prev) => updater(prev))}
              />

              <TiresVisibilitySection
                editData={editData}
                hasMissingSupplierPrice={hasMissingSupplierPrice}
                isDark={isDark}
                isManualNonPassenger={getManualNonPassengerFlag(editData.spec_overrides)}
                language={language}
                mustHideFromStore={mustHideFromStore}
                onHiddenChange={(hidden) => setEditData((prev) => ({ ...prev, is_hidden: hidden }))}
                onManualNonPassengerChange={(checked) =>
                  setEditData((prev) => {
                    const currentOverrides = prev.spec_overrides || {};
                    const currentClassification = (currentOverrides.classification || {}) as Record<string, any>;
                    const nextClassification = { ...currentClassification };

                    if (checked) {
                      nextClassification.non_passenger_manual = true;
                    } else {
                      delete nextClassification.non_passenger_manual;
                    }

                    const { classification, ...restOverrides } = currentOverrides;
                    const nextOverrides = {
                      ...restOverrides,
                      ...(Object.keys(nextClassification).length > 0 ? { classification: nextClassification } : {}),
                    };

                    return {
                      ...prev,
                      spec_overrides: Object.keys(nextOverrides).length > 0 ? nextOverrides : null,
                    };
                  })
                }
                selectedTire={selectedTire}
              />

              {/* Save Error */}
              {saveError && (
                <div className={`flex gap-3 p-4 rounded-lg ${
                  isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'
                }`}>
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{saveError}</p>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className={`sticky bottom-0 border-t ${
              isDark ? 'bg-[#161A22] border-white/10' : 'bg-white border-gray-200'
            } px-6 py-4 flex items-center justify-between gap-3`}>
              <button
                onClick={handleResetCms}
                disabled={saving}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark
                    ? 'border border-red-500/40 text-red-300 hover:bg-red-500/20'
                    : 'border border-red-300 text-red-600 hover:bg-red-50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <RotateCcw className="w-4 h-4" />
                {language === 'fi' ? 'Tyhjennä CMS' : 'Reset CMS'}
              </button>
              <button
                onClick={handleCloseDrawer}
                disabled={saving}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark 
                    ? 'bg-white/10 text-white hover:bg-white/20' 
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {language === 'fi' ? 'Peruuta' : 'Cancel'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Save className="w-4 h-4" />
                {saving ? (language === 'fi' ? 'Tallennetaan...' : 'Saving...') : (language === 'fi' ? 'Tallenna' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
