import { useState } from 'react';

import type { ProductCMS, RimRow } from './types';

export function getRimManualNotSellableFlag(specOverrides: any) {
  return Boolean(specOverrides?.classification?.manual_not_sellable);
}

export function useRimsCmsEditor() {
  const [selectedRim, setSelectedRim] = useState<RimRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<ProductCMS>>({});

  const openEditor = (rim: RimRow) => {
    const cms = rim.cms_data;
    setSelectedRim(rim);
    setEditData({
      variant_id: rim.variant_id,
      title: cms?.title ?? '',
      subtitle: cms?.subtitle ?? '',
      short_description: cms?.short_description ?? '',
      long_description: cms?.long_description ?? '',
      hero_image_url: cms?.hero_image_url ?? null,
      gallery: cms?.gallery ?? [],
      badges: cms?.badges ?? [],
      seo_slug: cms?.seo_slug ?? '',
      seo_title: cms?.seo_title ?? '',
      seo_description: cms?.seo_description ?? '',
      is_hidden: cms?.is_hidden ?? false,
      spec_overrides: cms?.spec_overrides ?? {},
      price_override_eur: cms?.price_override_eur ?? null,
      promo_enabled: cms?.promo_enabled ?? false,
      promo_price_eur: cms?.promo_price_eur ?? null,
      promo_start: cms?.promo_start ?? null,
      promo_end: cms?.promo_end ?? null,
      stock_override: cms?.stock_override ?? null,
      force_out_of_stock: cms?.force_out_of_stock ?? false,
    });
    setDrawerOpen(true);
  };

  const closeEditor = () => {
    setDrawerOpen(false);
    setSelectedRim(null);
    setEditData({});
  };

  return {
    selectedRim,
    drawerOpen,
    editData,
    setEditData,
    openEditor,
    closeEditor,
  };
}
