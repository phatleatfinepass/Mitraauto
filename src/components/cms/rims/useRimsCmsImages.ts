import type { Dispatch, SetStateAction } from 'react';

import type { ProductCMS, RimRow } from './types';

function normalizeUrl(value: any) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

export function useRimsCmsImages({
  selectedRim,
  editData,
  onEditDataChange,
}: {
  selectedRim: RimRow | null;
  editData: Partial<ProductCMS>;
  onEditDataChange: Dispatch<SetStateAction<Partial<ProductCMS>>>;
}) {
  const gallery = Array.isArray(editData.gallery) ? editData.gallery : [];
  const supplierFallbackUrl = normalizeUrl(selectedRim?.supplier_image_url);
  const heroImageUrl = normalizeUrl(editData.hero_image_url) ?? gallery[0] ?? supplierFallbackUrl;

  const setGallery = (images: string[]) => {
    onEditDataChange((prev) => ({
      ...prev,
      gallery: images,
      hero_image_url: images[0] || null,
    }));
  };

  return {
    gallery,
    heroImageUrl,
    supplierFallbackUrl,
    setGallery,
  };
}
