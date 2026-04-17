import { useState } from 'react';
import {
  getPricingRulesFromSpecOverrides,
  setPricingRulesToSpecOverrides,
  type BundlePricingMode,
  type ProductPricingRules,
} from '../../../utils/pricing';
import type { ProductCMS, TireRow } from './types';

interface SizeParts {
  width: string;
  aspect: string;
  rim: string;
  load_index: string;
  speed_rating: string;
}

const EMPTY_SIZE_PARTS: SizeParts = {
  width: '',
  aspect: '',
  rim: '',
  load_index: '',
  speed_rating: '',
};

function parseTireSize(size?: string | null): SizeParts {
  const cleaned = size?.trim() ?? '';
  const baseMatch = cleaned.match(/(\d{3})\s*\/\s*(\d{2})\s*R?\s*(\d{2})/i);

  if (!baseMatch) {
    return { ...EMPTY_SIZE_PARTS };
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
}

function formatTireSize(parts: SizeParts) {
  if (!parts.width && !parts.aspect && !parts.rim && !parts.load_index && !parts.speed_rating) {
    return '';
  }

  if (!parts.width || !parts.aspect || !parts.rim) {
    return '';
  }

  const li = (parts.load_index || '').trim();
  const sr = (parts.speed_rating || '').trim().toUpperCase();
  return `${parts.width} / ${parts.aspect} R${parts.rim}${li ? ` ${li}` : ''}${sr ? ` ${sr}` : ''}`.trim();
}

export function getManualNonPassengerFlag(specOverrides: any) {
  return Boolean(specOverrides?.classification?.non_passenger_manual);
}

export function useTiresCmsEditor({
  mustHideFromStore,
}: {
  mustHideFromStore: (tire: TireRow | null) => boolean;
}) {
  const [selectedTire, setSelectedTire] = useState<TireRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<ProductCMS>>({});
  const [sizeParts, setSizeParts] = useState<SizeParts>({ ...EMPTY_SIZE_PARTS });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [supplierMarkupSupplier, setSupplierMarkupSupplier] = useState('RD');
  const [supplierMarkupAmount, setSupplierMarkupAmount] = useState('20');

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

  const openEditor = (tire: TireRow) => {
    setSelectedTire(tire);
    setSupplierMarkupSupplier(String(tire.supplier_code_best ?? 'RD').trim().toUpperCase() || 'RD');
    setSupplierMarkupAmount('20');

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
  };

  const closeEditor = () => {
    setDrawerOpen(false);
    setSelectedTire(null);
    setEditData({});
    setSizeParts({ ...EMPTY_SIZE_PARTS });
    setDraggedIndex(null);
  };

  const handleImageReorder = (newGallery: string[]) => {
    setEditData((prev) => ({
      ...prev,
      gallery: newGallery,
      hero_image_url: newGallery[0] || prev.hero_image_url,
    }));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (index: number) => {
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

  const getEUOverride = () => editData.spec_overrides?.eu || null;

  const setEUField = (field: string, value: any) => {
    const currentOverrides = editData.spec_overrides || {};
    const currentEU = currentOverrides.eu || {};
    const updatedEU = { ...currentEU, [field]: value };

    setEditData((prev) => ({
      ...prev,
      spec_overrides: {
        ...currentOverrides,
        eu: updatedEU,
      },
    }));
  };

  const clearEUOverrides = () => {
    const currentOverrides = editData.spec_overrides || {};
    const { eu, ...restOverrides } = currentOverrides;

    setEditData((prev) => ({
      ...prev,
      spec_overrides: Object.keys(restOverrides).length > 0 ? restOverrides : null,
    }));
  };

  const hasEUOverride = () => {
    const override = getEUOverride();
    return !!(override && Object.keys(override).length > 0);
  };

  const getIdentityOverride = () => editData.spec_overrides?.identity || null;

  const setIdentityField = (
    field: 'brand' | 'model' | 'ean' | 'size_string' | 'season' | 'load_index' | 'speed_rating',
    value?: string
  ) => {
    setEditData((prev) => {
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
        ...(Object.keys(updatedIdentity).length > 0 ? { identity: updatedIdentity } : {}),
      };

      return {
        ...prev,
        spec_overrides: Object.keys(nextOverrides).length > 0 ? nextOverrides : null,
      };
    });
  };

  const clearIdentityOverrides = () => {
    setEditData((prev) => {
      const currentOverrides = prev.spec_overrides || {};
      const { identity, ...restOverrides } = currentOverrides;

      return {
        ...prev,
        spec_overrides: Object.keys(restOverrides).length > 0 ? restOverrides : null,
      };
    });
    setSizeParts(parseTireSize(selectedTire?.size_string ?? ''));
  };

  const updateSizePart = (field: keyof SizeParts, value: string) => {
    setSizeParts((prev) => {
      const next = { ...prev, [field]: value };
      setIdentityField('size_string', formatTireSize(next));
      setIdentityField('load_index', next.load_index || undefined);
      setIdentityField('speed_rating', next.speed_rating?.toUpperCase() || undefined);
      return next;
    });
  };

  const getFeatureOverrides = () => editData.spec_overrides?.features || null;

  const getBaseFeatureValue = (
    field: 'ev_ready' | 'runflat' | 'xl' | 'studded' | 'threepmsf' | 'winter_approved' | 'ice_approved'
  ) => {
    if (!selectedTire) return false;
    switch (field) {
      case 'ev_ready':
        return Boolean((selectedTire as any).ev_ready);
      case 'runflat':
        return Boolean(selectedTire.runflat);
      case 'xl':
        return Boolean(selectedTire.xl_reinforced);
      case 'studded':
        return Boolean((selectedTire as any).studded);
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

  const getEffectiveFeatureValue = (
    field: 'ev_ready' | 'runflat' | 'xl' | 'studded' | 'threepmsf' | 'winter_approved' | 'ice_approved'
  ) => {
    const overrides = getFeatureOverrides();
    if (overrides && Object.prototype.hasOwnProperty.call(overrides, field)) {
      return Boolean((overrides as Record<string, unknown>)[field]);
    }
    return getBaseFeatureValue(field);
  };

  const setFeatureField = (
    field: 'ev_ready' | 'runflat' | 'xl' | 'studded' | 'threepmsf' | 'winter_approved' | 'ice_approved',
    value: boolean
  ) => {
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

  const setBundleTier = (
    qty: 2 | 4,
    tier: { mode?: BundlePricingMode; percent_off?: number | null; fixed_total_eur?: number | null }
  ) => {
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

  return {
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
    selectedTire,
    setBundleTier,
    setDragIndex: setDraggedIndex,
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
  };
}
