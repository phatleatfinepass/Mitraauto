import React, { useEffect, useState } from 'react';
import { useTheme } from '../ThemeContext';
import { useLanguage } from '../LanguageContext';
import { supabase } from '../../utils/supabase/client';
import { X, Save, AlertCircle, Upload, GripVertical, RotateCcw } from 'lucide-react';
import { TiresCmsToolbar } from './tires/TiresCmsToolbar';
import { TiresImagesSection } from './tires/TiresImagesSection';
import { TiresBadgesSection } from './tires/TiresBadgesSection';
import { TiresBundlePricingSection } from './tires/TiresBundlePricingSection';
import { TiresCmsTableSection } from './tires/TiresCmsTableSection';
import { TiresContentSection } from './tires/TiresContentSection';
import { TiresEuLabelSection } from './tires/TiresEuLabelSection';
import { TiresIdentitySection } from './tires/TiresIdentitySection';
import { TiresPricingSection } from './tires/TiresPricingSection';
import { TiresSeoSection } from './tires/TiresSeoSection';
import { TiresVisibilitySection } from './tires/TiresVisibilitySection';
import { TiresWarningTooltip } from './tires/TiresWarningTooltip';
import {
  TIRES_CONTENT_AI_FIELDS,
  TIRES_SEO_AI_FIELDS,
  type TiresAiCopyField,
} from './tires/aiCopy';
import {
  useTiresCmsEditor,
  getManualNonPassengerFlag,
  TIRES_CMS_EDITOR_STATE_KEY,
} from './tires/useTiresCmsEditor';
import { useTiresCmsCatalogSync } from './tires/useTiresCmsCatalogSync';
import { useTiresCmsImages } from './tires/useTiresCmsImages';
import { useTiresCmsList } from './tires/useTiresCmsList';
import { useTiresCmsMutations } from './tires/useTiresCmsMutations';
import { useTiresCmsSupplierMarkup } from './tires/useTiresCmsSupplierMarkup';
import { useTiresCmsWarnings } from './tires/useTiresCmsWarnings';
import type { TireAdminPricingDetails, TireRow } from './tires/types';

const EU_FUEL_WET_OPTIONS = ['A', 'B', 'C', 'D', 'E'];
const EU_NOISE_CLASS_OPTIONS = ['A', 'B', 'C'];
const VAT_RATE = 0.255;
const VAT_MULTIPLIER = 1 + VAT_RATE;
const RD_SHIPPING_COST_EX_VAT = 12;

const SUPPLIER_OPTIONS = [
  { code: 'RD', label: 'Rengasduo' },
  { code: 'VT', label: 'Vannetukku' },
];

export function TiresCMSPage() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isDark = theme === 'dark';
  const [bulkMarkupAmount, setBulkMarkupAmount] = useState('20');
  const [bulkMarkupPercent, setBulkMarkupPercent] = useState('');
  const [bulkMarkupSupplier, setBulkMarkupSupplier] = useState('');
  const [bulkMarkupMatchCount, setBulkMarkupMatchCount] = useState<number | null>(null);
  const [loadingBulkMarkupCount, setLoadingBulkMarkupCount] = useState(false);
  const [applyingBulkMarkup, setApplyingBulkMarkup] = useState(false);
  const [revertingBulkMarkup, setRevertingBulkMarkup] = useState(false);
  const [bulkMarkupProgress, setBulkMarkupProgress] = useState<{
    mode: 'apply' | 'revert';
    processed: number;
    total: number;
  } | null>(null);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [supplierDraft, setSupplierDraft] = useState('all');
  const [showNonPassengerDraft, setShowNonPassengerDraft] = useState(false);
  const [missingMetadataFieldsDraft, setMissingMetadataFieldsDraft] = useState<string[]>([]);
  const [showMissingImagesOnlyDraft, setShowMissingImagesOnlyDraft] = useState(false);
  const [missingSeoFieldsDraft, setMissingSeoFieldsDraft] = useState<string[]>([]);
  const [pricingDetails, setPricingDetails] = useState<TireAdminPricingDetails | null>(null);
  const [aiGeneratingField, setAiGeneratingField] = useState<TiresAiCopyField | null>(null);
  const [aiGenerationError, setAiGenerationError] = useState<string | null>(null);
  const [aiGenerationErrorField, setAiGenerationErrorField] = useState<TiresAiCopyField | null>(null);

  const {
    currentPage,
    endItem,
    error,
    fetchTires,
    invalidateCache,
    loading,
    patchLocalCmsData,
    patchLocalIdentityData,
    refreshing,
    searchTerm,
    setCurrentPage,
    setHideNonPassenger,
    setMissingMetadataFields,
    setMissingSeoFields,
    setSearchTerm,
    setShowMissingImagesOnly,
    setSupplierFilter,
    hideNonPassenger,
    missingMetadataFields,
    missingSeoFields,
    showMissingImagesOnly,
    startItem,
    supplierFilter,
    tires,
    totalCount,
    totalPages,
  } = useTiresCmsList(25);

  useEffect(() => {
    setSupplierDraft(supplierFilter);
    setShowNonPassengerDraft(!hideNonPassenger);
    setMissingMetadataFieldsDraft(missingMetadataFields);
    setShowMissingImagesOnlyDraft(showMissingImagesOnly);
    setMissingSeoFieldsDraft(missingSeoFields);
  }, [
    supplierFilter,
    hideNonPassenger,
    missingMetadataFields,
    showMissingImagesOnly,
    missingSeoFields,
  ]);

  const {
    catalogSyncMessage,
    catalogSyncProgress,
    handleApplyCatalogSync,
    hasPendingCatalogSync,
    setCatalogSyncMessage,
    setHasPendingCatalogSync,
    syncingCatalog,
  } = useTiresCmsCatalogSync({
    fetchTires,
    invalidateCache,
    language,
  });

  useEffect(() => {
    if (!settingsDrawerOpen) return;
    if (!bulkMarkupSupplier) {
      setBulkMarkupMatchCount(null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoadingBulkMarkupCount(true);
      try {
        const { data, error } = await supabase.rpc('cms_count_tires_admin_v1', {
          p_search: searchTerm.trim() || null,
          p_missing_ean_only: false,
          p_exclude_non_passenger: hideNonPassenger,
          p_supplier_code: bulkMarkupSupplier,
          p_missing_metadata_fields: missingMetadataFields.length > 0 ? missingMetadataFields : null,
          p_missing_image_only: showMissingImagesOnly,
          p_missing_seo_fields: missingSeoFields.length > 0 ? missingSeoFields : null,
        });
        if (error) throw error;
        if (!cancelled) {
          setBulkMarkupMatchCount(Number(data ?? 0));
        }
      } catch (error) {
        console.error('Bulk markup count error:', error);
        if (!cancelled) {
          setBulkMarkupMatchCount(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingBulkMarkupCount(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    bulkMarkupSupplier,
    hideNonPassenger,
    missingMetadataFields,
    missingSeoFields,
    searchTerm,
    settingsDrawerOpen,
    showMissingImagesOnly,
  ]);

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

  const hasMissingSupplierPrice = (tire: TireRow | null) =>
    !tire || tire.final_price_eur === null || tire.final_price_eur === undefined;

  const mustHideFromStore = (tire: TireRow | null) =>
    hasMissingSupplierPrice(tire) || Boolean(tire?.is_non_passenger);

  const {
    clearBundlePricing,
    clearEUOverrides,
    clearFeatureOverrides,
    clearIdentityOverrides,
    closeEditor,
    draggedIndex,
    drawerOpen,
    editData,
    getBundlePricing,
    getEUOverride,
    getEffectiveFeatureValue,
    getEffectiveIdentity,
    getIdentityOverride,
    handleDragEnd,
    handleDragOver,
    handleDragStart,
    handleImageReorder,
    hasEUOverride,
    openEditor,
    restoreEditor,
    selectedTire,
    setBundleTier,
    setEditData,
    setEUField,
    setFeatureField,
    setIdentityField,
    setSupplierMarkupAmount,
    setSupplierMarkupSupplier,
    sizeParts,
    supplierMarkupAmount,
    supplierMarkupSupplier,
    updateSizePart,
  } = useTiresCmsEditor({ mustHideFromStore });

  useEffect(() => {
    if (typeof window === 'undefined' || drawerOpen) {
      return;
    }

    const rawState = window.sessionStorage.getItem(TIRES_CMS_EDITOR_STATE_KEY);
    if (!rawState) {
      return;
    }

    try {
      const parsedState = JSON.parse(rawState) as {
        selectedTire?: TireRow;
        editData?: Partial<any>;
        sizeParts?: {
          width?: string;
          aspect?: string;
          rim?: string;
          load_index?: string;
          speed_rating?: string;
        };
        supplierMarkupSupplier?: string;
        supplierMarkupAmount?: string;
      };

      if (!parsedState?.selectedTire?.variant_id) {
        window.sessionStorage.removeItem(TIRES_CMS_EDITOR_STATE_KEY);
        return;
      }

      const matchedTire =
        tires.find((tire) => tire.variant_id === parsedState.selectedTire?.variant_id) ??
        parsedState.selectedTire;

      restoreEditor(matchedTire, {
        selectedTire: matchedTire,
        editData: parsedState.editData ?? {},
        sizeParts: {
          width: parsedState.sizeParts?.width ?? '',
          aspect: parsedState.sizeParts?.aspect ?? '',
          rim: parsedState.sizeParts?.rim ?? '',
          load_index: parsedState.sizeParts?.load_index ?? '',
          speed_rating: parsedState.sizeParts?.speed_rating ?? '',
        },
        supplierMarkupSupplier: parsedState.supplierMarkupSupplier ?? 'RD',
        supplierMarkupAmount: parsedState.supplierMarkupAmount ?? '20',
      });
    } catch (error) {
      console.error('Restore tire editor state error:', error);
      window.sessionStorage.removeItem(TIRES_CMS_EDITOR_STATE_KEY);
    }
  }, [drawerOpen, restoreEditor, tires]);

  useEffect(() => {
    if (!selectedTire?.variant_id) {
      setPricingDetails(null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const { data, error } = await supabase.rpc('cms_get_tire_admin_pricing_v1', {
          p_variant_id: selectedTire.variant_id,
        });

        if (error) throw error;

        const row = Array.isArray(data) ? data[0] : data;
        if (!cancelled) {
          setPricingDetails((row as TireAdminPricingDetails | null) ?? null);
        }
      } catch (error) {
        console.error('Fetch tire pricing details error:', error);
        if (!cancelled) {
          setPricingDetails(null);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [selectedTire?.variant_id]);

  const {
    clearImageFeedback,
    handleClipboardImagePaste,
    handleImageUpload,
    handleRemoveImage,
    uploadError,
    uploadingImages,
  } = useTiresCmsImages({
    editData,
    selectedTire,
    setEditData,
  });

  useEffect(() => {
    if (!drawerOpen || !selectedTire) {
      return;
    }

    const handlePaste = (event: ClipboardEvent) => {
      if (!event.clipboardData) {
        return;
      }

      const containsClipboardImage = Array.from(event.clipboardData.items).some(
        (item) => item.kind === 'file' && item.type.startsWith('image/'),
      );

      if (!containsClipboardImage) {
        return;
      }

      event.preventDefault();
      void handleClipboardImagePaste(event.clipboardData);
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [drawerOpen, handleClipboardImagePaste, selectedTire]);

  const {
    handleResetCms,
    handleSave,
    handleToggleVisibility,
    saveError,
    saving,
    setSaveError,
  } = useTiresCmsMutations({
    editData,
    fetchTires,
    invalidateCache,
    hasMissingSupplierPrice,
    language,
    onCloseEditor: closeEditor,
    patchLocalCmsData,
    patchLocalIdentityData,
    selectedTire,
    setCatalogSyncMessage,
    setHasPendingCatalogSync,
  });

  const { getWarningTooltip, hideWarningTooltip, showWarningTooltip, warningTooltip } =
    useTiresCmsWarnings(language);

  const handleImageDragOver = (event: React.DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
    handleDragOver(index);
  };

  const handleEdit = (tire: TireRow) => {
    openEditor(tire);
    clearImageFeedback();
  };

  const handleCloseDrawer = () => {
    closeEditor();
    setSaveError(null);
    setAiGenerationError(null);
    setAiGenerationErrorField(null);
    setAiGeneratingField(null);
    clearImageFeedback();
  };

  const handleGenerateAiField = async (field: TiresAiCopyField) => {
    if (!selectedTire) {
      return;
    }

    setAiGeneratingField(field);
    setAiGenerationError(null);
    setAiGenerationErrorField(null);

    try {
      const effectiveIdentity = getEffectiveIdentity(selectedTire);
      const { data, error } = await supabase.functions.invoke('generate_tire_cms_copy', {
        body: {
          field,
          language,
          tire: {
            variant_id: selectedTire.variant_id,
            brand: effectiveIdentity.brand,
            model: effectiveIdentity.model,
            size_string: effectiveIdentity.size_string,
            season: selectedTire.season,
            supplier_code_best: selectedTire.supplier_code_best,
            studded: selectedTire.studded,
            runflat: selectedTire.runflat,
            xl_reinforced: selectedTire.xl_reinforced,
            ev_ready: selectedTire.ev_ready,
            threepmsf: selectedTire.threepmsf,
            winter_approved: selectedTire.winter_approved,
            ice_approved: selectedTire.ice_approved,
            eu_fuel: selectedTire.eu_fuel_class ?? selectedTire.eu_fuel ?? null,
            eu_wet: selectedTire.eu_wet_grip_class ?? selectedTire.eu_wet ?? null,
            eu_noise: selectedTire.eu_noise_db ?? selectedTire.eu_noise ?? null,
          },
          cms: {
            title: editData.title ?? null,
            subtitle: editData.subtitle ?? null,
            short_description: editData.short_description ?? null,
            long_description: editData.long_description ?? null,
            seo_slug: editData.seo_slug ?? null,
            seo_title: editData.seo_title ?? null,
            seo_description: editData.seo_description ?? null,
          },
        },
      });

      if (error) {
        throw error;
      }

      const value = String((data as { value?: string } | null)?.value ?? '').trim();
      if (!value) {
        throw new Error(language === 'fi' ? 'AI ei palauttanut sisältöä.' : 'AI did not return content.');
      }

      setEditData((prev) => ({
        ...prev,
        [field]: value,
      }));
      setAiGenerationErrorField(null);
    } catch (error: any) {
      console.error('AI tire copy generation failed:', error);
      let detailedMessage: string | null = null;

      const responseContext = error?.context;
      if (responseContext && typeof responseContext.clone === 'function') {
        try {
          const body = await responseContext.clone().json();
          detailedMessage = body?.error ?? body?.message ?? null;
        } catch {
          try {
            detailedMessage = await responseContext.clone().text();
          } catch {
            detailedMessage = null;
          }
        }
      }

      setAiGenerationError(
        detailedMessage ||
          error?.message ||
          (language === 'fi' ? 'AI-sisällön luonti epäonnistui.' : 'AI content generation failed.')
      );
      setAiGenerationErrorField(field);
    } finally {
      setAiGeneratingField(null);
    }
  };

  const filteredTires = tires;
  const supplierCodeForPricing = String(
    pricingDetails?.supplier_code_best ?? selectedTire?.supplier_code_best ?? '',
  )
    .trim()
    .toUpperCase();
  const isRengasDuoTire = supplierCodeForPricing === 'RD';

  const originalApiPrice = (() => {
    if (isRengasDuoTire) {
      const preferred =
        pricingDetails?.raw_net_price_ex_vat ??
        pricingDetails?.wholesale_price_ex_vat ??
        null;
      if (preferred !== null && preferred !== undefined && Number.isFinite(Number(preferred))) {
        return Number(preferred);
      }
    }
    return selectedTire?.price !== null && selectedTire?.price !== undefined
      ? Number(selectedTire.price)
      : null;
  })();
  const recyclingFeeExVat =
    isRengasDuoTire &&
    pricingDetails?.recycling_fee_ex_vat !== null &&
    pricingDetails?.recycling_fee_ex_vat !== undefined
      ? Number(pricingDetails.recycling_fee_ex_vat)
      : null;
  const shippingFeeExVat = isRengasDuoTire ? RD_SHIPPING_COST_EX_VAT : null;
  const costAfterFeesExVat =
    originalApiPrice !== null && recyclingFeeExVat !== null && shippingFeeExVat !== null
      ? Number(
          (
            originalApiPrice +
            recyclingFeeExVat +
            shippingFeeExVat
          ).toFixed(2)
        )
      : null;
  const effectiveDraftPrice =
    editData.promo_enabled && editData.promo_price_eur !== null && editData.promo_price_eur !== undefined
      ? Number(editData.promo_price_eur)
      : editData.price_override_eur !== null && editData.price_override_eur !== undefined
        ? Number(editData.price_override_eur)
        : costAfterFeesExVat ?? originalApiPrice;
  const { applySupplierMarkup: applySupplierMarkupWithBase, getSupplierLabel: getSupplierLabelWithBase } =
    useTiresCmsSupplierMarkup({
      baseApiPrice: costAfterFeesExVat ?? originalApiPrice,
      language,
      selectedTire,
      setEditData,
      setSaveError,
      supplierMarkupAmount,
      supplierMarkupSupplier,
      supplierOptions: SUPPLIER_OPTIONS,
    });

  const fetchSupplierBulkPage = async (supplierCode: string, offset: number, pageSize: number) => {
    const { data, error } = await supabase.rpc('cms_list_tires_admin_v1', {
      p_search: searchTerm.trim() || null,
      p_missing_ean_only: false,
      p_exclude_non_passenger: hideNonPassenger,
      p_supplier_code: supplierCode,
      p_missing_metadata_fields: missingMetadataFields.length > 0 ? missingMetadataFields : null,
      p_missing_image_only: showMissingImagesOnly,
      p_missing_seo_fields: missingSeoFields.length > 0 ? missingSeoFields : null,
      p_limit: pageSize,
      p_offset: offset,
    });
    if (error) throw error;

    return (data ?? [])
      .filter((row: any) => typeof row.variant_id === 'string' && Number.isFinite(Number(row.price)))
      .map((row: any) => ({
        variant_id: row.variant_id,
        price: Number(row.price),
      }));
  };

  const handleApplyBulkSupplierMarkup = async () => {
    const supplierCode = String(bulkMarkupSupplier).trim().toUpperCase();
    const hasAmountInput = bulkMarkupAmount.trim() !== '';
    const hasPercentInput = bulkMarkupPercent.trim() !== '';
    const amountAdjustment = Number(bulkMarkupAmount);
    const percentAdjustment = Number(bulkMarkupPercent);

    if (!supplierCode || supplierCode === 'ALL') {
      setCatalogSyncMessage(language === 'fi' ? 'Valitse toimittaja.' : 'Choose a supplier.');
      return;
    }

    if (!hasAmountInput && !hasPercentInput) {
      setCatalogSyncMessage(
        language === 'fi'
          ? 'Anna muutos joko euroina tai prosentteina.'
          : 'Enter an adjustment in either euros or percent.'
      );
      return;
    }

    if (hasAmountInput && !Number.isFinite(amountAdjustment)) {
      setCatalogSyncMessage(
        language === 'fi' ? 'Euromäärän pitää olla numero.' : 'Euro adjustment must be a number.'
      );
      return;
    }

    if (hasPercentInput && !Number.isFinite(percentAdjustment)) {
      setCatalogSyncMessage(
        language === 'fi' ? 'Prosentin pitää olla numero.' : 'Percent adjustment must be a number.'
      );
      return;
    }

    setApplyingBulkMarkup(true);
    setCatalogSyncMessage(null);

    try {
      const totalItems = bulkMarkupMatchCount ?? 0;

      if (totalItems === 0) {
        setCatalogSyncMessage(
          language === 'fi'
            ? 'Yhtään sopivaa rengasta ei löytynyt nykyisestä näkymästä.'
            : 'No matching tires were found in the current view.'
        );
        return;
      }
      const pageSize = 500;
      let offset = 0;
      let processed = 0;
      setBulkMarkupProgress({ mode: 'apply', processed: 0, total: totalItems });

      while (offset < totalItems) {
        const rows = await fetchSupplierBulkPage(supplierCode, offset, pageSize);
        if (rows.length === 0) break;

        const payload = rows.map((row) => ({
          variant_id: row.variant_id,
          price_override_eur: Math.round(
            (hasPercentInput
              ? row.price * (1 + percentAdjustment / 100)
              : row.price + amountAdjustment) * 100
          ) / 100,
        }));

        const { error } = await supabase.from('product_cms').upsert(payload, { onConflict: 'variant_id' });
        if (error) throw error;

        processed += rows.length;
        offset += pageSize;
        setBulkMarkupProgress({ mode: 'apply', processed, total: totalItems });
      }

      filteredTires
        .filter((tire) => String(tire.supplier_code_best ?? '').toUpperCase() === supplierCode)
        .forEach((tire) => {
          const nextOverride = Math.round(
            ((hasPercentInput
              ? Number(tire.price ?? 0) * (1 + percentAdjustment / 100)
              : Number(tire.price ?? 0) + amountAdjustment) || 0) * 100
          ) / 100;

          patchLocalCmsData(tire.variant_id, {
            price_override_eur: nextOverride,
          });
        });

      setHasPendingCatalogSync(true);
      setCatalogSyncMessage(
        language === 'fi'
          ? `${hasPercentInput ? 'Prosenttimuutos' : 'Hintaero'} asetettu ${processed} renkaalle toimittajalta ${supplierCode}. Suorita "Apply Sync".`
          : `${hasPercentInput ? 'Percent adjustment' : 'Markup or discount'} applied to ${processed} tires from supplier ${supplierCode}. Run "Apply Sync".`
      );
    } catch (error: any) {
      console.error('Bulk supplier markup error:', error);
      setCatalogSyncMessage(error?.message || (language === 'fi' ? 'Massahinnoittelu epäonnistui.' : 'Bulk markup failed.'));
    } finally {
      setApplyingBulkMarkup(false);
      setBulkMarkupProgress(null);
    }
  };

  const handleRevertBulkSupplierMarkup = async () => {
    const supplierCode = String(bulkMarkupSupplier).trim().toUpperCase();

    if (!supplierCode || supplierCode === 'ALL') {
      setCatalogSyncMessage(language === 'fi' ? 'Valitse toimittaja.' : 'Choose a supplier.');
      return;
    }

    setRevertingBulkMarkup(true);
    setCatalogSyncMessage(null);

    try {
      const totalItems = bulkMarkupMatchCount ?? 0;

      if (totalItems === 0) {
        setCatalogSyncMessage(
          language === 'fi'
            ? 'Yhtään sopivaa rengasta ei löytynyt nykyisestä näkymästä.'
            : 'No matching tires were found in the current view.'
        );
        return;
      }
      const pageSize = 500;
      let offset = 0;
      let processed = 0;
      setBulkMarkupProgress({ mode: 'revert', processed: 0, total: totalItems });

      while (offset < totalItems) {
        const rows = await fetchSupplierBulkPage(supplierCode, offset, pageSize);
        if (rows.length === 0) break;

        const payload = rows.map((row) => ({
          variant_id: row.variant_id,
          price_override_eur: null,
        }));

        const { error } = await supabase.from('product_cms').upsert(payload, { onConflict: 'variant_id' });
        if (error) throw error;

        processed += rows.length;
        offset += pageSize;
        setBulkMarkupProgress({ mode: 'revert', processed, total: totalItems });
      }

      filteredTires
        .filter((tire) => String(tire.supplier_code_best ?? '').toUpperCase() === supplierCode)
        .forEach((tire) => {
          patchLocalCmsData(tire.variant_id, {
            price_override_eur: null,
          });
        });

      setHasPendingCatalogSync(true);
      setCatalogSyncMessage(
        language === 'fi'
          ? `API-hinta palautettu ${processed} renkaalle toimittajalta ${supplierCode}. Suorita "Apply Sync".`
          : `Reverted ${processed} tires from supplier ${supplierCode} back to API price. Run "Apply Sync".`
      );
    } catch (error: any) {
      console.error('Bulk supplier markup revert error:', error);
      setCatalogSyncMessage(
        error?.message || (language === 'fi' ? 'API-hintaan palautus epäonnistui.' : 'Failed to revert to API price.')
      );
    } finally {
      setRevertingBulkMarkup(false);
      setBulkMarkupProgress(null);
    }
  };

  const handleApplySupplierFilter = () => {
    const nextHideNonPassenger = !showNonPassengerDraft;
    const hasChanges =
      supplierDraft !== supplierFilter ||
      nextHideNonPassenger !== hideNonPassenger ||
      showMissingImagesOnlyDraft !== showMissingImagesOnly ||
      missingMetadataFieldsDraft.join('|') !== missingMetadataFields.join('|') ||
      missingSeoFieldsDraft.join('|') !== missingSeoFields.join('|');

    if (!hasChanges) {
      setSettingsDrawerOpen(false);
      return;
    }

    setCurrentPage(1);
    setSupplierFilter(supplierDraft);
    setHideNonPassenger(nextHideNonPassenger);
    setMissingMetadataFields(missingMetadataFieldsDraft);
    setShowMissingImagesOnly(showMissingImagesOnlyDraft);
    setMissingSeoFields(missingSeoFieldsDraft);
    setSettingsDrawerOpen(false);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0B0D10]' : 'bg-gray-50'}`}>
      <TiresWarningTooltip isDark={isDark} warningTooltip={warningTooltip} />
      <TiresCmsToolbar
        isDark={isDark}
        language={language}
        searchTerm={searchTerm}
        showNonPassengerDraft={showNonPassengerDraft}
        missingMetadataFieldsDraft={missingMetadataFieldsDraft}
        showMissingImagesOnlyDraft={showMissingImagesOnlyDraft}
        missingSeoFieldsDraft={missingSeoFieldsDraft}
        supplierFilter={supplierFilter}
        supplierDraft={supplierDraft}
        supplierOptions={SUPPLIER_OPTIONS}
        syncingCatalog={syncingCatalog}
        hasPendingCatalogSync={hasPendingCatalogSync}
        catalogSyncMessage={catalogSyncMessage}
        catalogSyncProgress={catalogSyncProgress}
        bulkMarkupAmount={bulkMarkupAmount}
        bulkMarkupPercent={bulkMarkupPercent}
        bulkMarkupSupplier={bulkMarkupSupplier}
        bulkMarkupMatchCount={bulkMarkupMatchCount}
        loadingBulkMarkupCount={loadingBulkMarkupCount}
        applyingBulkMarkup={applyingBulkMarkup}
        revertingBulkMarkup={revertingBulkMarkup}
        bulkMarkupProgress={bulkMarkupProgress}
        settingsDrawerOpen={settingsDrawerOpen}
        supplierFilterDirty={
          supplierDraft !== supplierFilter ||
          (!showNonPassengerDraft) !== hideNonPassenger ||
          showMissingImagesOnlyDraft !== showMissingImagesOnly ||
          missingMetadataFieldsDraft.join('|') !== missingMetadataFields.join('|') ||
          missingSeoFieldsDraft.join('|') !== missingSeoFields.join('|')
        }
        onSearchTermChange={setSearchTerm}
        onShowNonPassengerDraftChange={setShowNonPassengerDraft}
        onMissingMetadataFieldsDraftChange={setMissingMetadataFieldsDraft}
        onShowMissingImagesOnlyDraftChange={setShowMissingImagesOnlyDraft}
        onMissingSeoFieldsDraftChange={setMissingSeoFieldsDraft}
        onSupplierDraftChange={setSupplierDraft}
        onBulkMarkupSupplierChange={setBulkMarkupSupplier}
        onSettingsDrawerOpenChange={setSettingsDrawerOpen}
        onApplySupplierFilter={handleApplySupplierFilter}
        onBulkMarkupAmountChange={(value) => {
          setBulkMarkupAmount(value);
          if (value.trim() !== '') {
            setBulkMarkupPercent('');
          }
        }}
        onBulkMarkupPercentChange={(value) => {
          setBulkMarkupPercent(value);
          if (value.trim() !== '') {
            setBulkMarkupAmount('');
          }
        }}
        onApplyBulkSupplierMarkup={handleApplyBulkSupplierMarkup}
        onRevertBulkSupplierMarkup={handleRevertBulkSupplierMarkup}
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
          refreshing={refreshing}
          mustHideFromStore={mustHideFromStore}
          onPageChange={setCurrentPage}
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
                costAfterFeesExVat={costAfterFeesExVat}
                editData={editData}
                effectiveDraftPrice={effectiveDraftPrice}
                getSupplierLabel={getSupplierLabelWithBase}
                isDark={isDark}
                language={language}
                onApplySupplierMarkup={applySupplierMarkupWithBase}
                onEditDataChange={(updater) => setEditData((prev) => updater(prev))}
                originalApiPrice={originalApiPrice}
                recyclingFeeExVat={recyclingFeeExVat}
                selectedTire={selectedTire}
                shippingFeeExVat={shippingFeeExVat}
                setSupplierMarkupAmount={setSupplierMarkupAmount}
                setSupplierMarkupSupplier={setSupplierMarkupSupplier}
                supplierMarkupAmount={supplierMarkupAmount}
                supplierMarkupSupplier={supplierMarkupSupplier}
                supplierOptions={SUPPLIER_OPTIONS}
                toPriceWithVat={toPriceWithVat}
              >
                <TiresBundlePricingSection
                  clearBundlePricing={clearBundlePricing}
                  getBundlePricing={getBundlePricing}
                  isDark={isDark}
                  language={language}
                  selectedTireFinalPriceEur={effectiveDraftPrice}
                  selectedTirePrice={originalApiPrice}
                  setBundleTier={setBundleTier}
                />
              </TiresPricingSection>

              <TiresImagesSection
                draggedIndex={draggedIndex}
                editGallery={(editData.gallery as string[]) ?? []}
                handleDragEnd={handleDragEnd}
                handleDragOver={handleImageDragOver}
                handleDragStart={handleDragStart}
                handleImageUpload={handleImageUpload}
                handleRemoveImage={handleRemoveImage}
                isDark={isDark}
                language={language}
                uploadError={uploadError}
                uploadingImages={uploadingImages}
              />

              <TiresContentSection
                aiError={
                  aiGenerationError && aiGenerationErrorField && TIRES_CONTENT_AI_FIELDS.includes(aiGenerationErrorField)
                    ? aiGenerationError
                    : null
                }
                aiGeneratingField={aiGeneratingField}
                editData={editData}
                identityBrand={getEffectiveIdentity(selectedTire).brand}
                identityModel={getEffectiveIdentity(selectedTire).model}
                identitySizeString={getEffectiveIdentity(selectedTire).size_string}
                isDark={isDark}
                language={language}
                onEditDataChange={(updater) => setEditData((prev) => updater(prev))}
                onGenerateField={handleGenerateAiField}
              />

              <TiresSeoSection
                aiError={
                  aiGenerationError && aiGenerationErrorField && TIRES_SEO_AI_FIELDS.includes(aiGenerationErrorField)
                    ? aiGenerationError
                    : null
                }
                aiGeneratingField={aiGeneratingField}
                editData={editData}
                isDark={isDark}
                language={language}
                onEditDataChange={(updater) => setEditData((prev) => updater(prev))}
                onGenerateField={handleGenerateAiField}
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
