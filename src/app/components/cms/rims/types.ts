export interface ProductCMS {
  variant_id: string;
  legacy_variant_id?: string | null;
  title: string | null;
  subtitle: string | null;
  short_description: string | null;
  long_description: string | null;
  hero_image_url: string | null;
  gallery: string[] | null;
  badges?: string[] | null;
  seo_slug: string | null;
  seo_title: string | null;
  seo_description: string | null;
  is_hidden: boolean;
  spec_overrides: Record<string, any> | null;
  price_override_eur?: number | null;
  promo_enabled?: boolean;
  promo_price_eur?: number | null;
  promo_start?: string | null;
  promo_end?: string | null;
  stock_override?: number | null;
  force_out_of_stock?: boolean;
}

export interface RimRow {
  variant_id: string;
  id: string;
  product_type: 'rim';
  ean: string | null;
  derived_ean: string | null;
  supplier_code_best: string | null;
  supplier_external_id_best: string | null;
  brand: string;
  model: string;
  size_string: string | null;
  width_in: number | null;
  rim_diameter_in: number | null;
  et_offset_mm: number | null;
  bolt_pattern: string | null;
  center_bore_mm: number | null;
  cb_mm: number | null;
  color: string | null;
  finish: string | null;
  material: string | null;
  bolts_included: boolean | null;
  winter_approved: boolean | null;
  wheel_load_kg: number | null;
  final_price_eur: number | null;
  price: number | null;
  price_eur: number | null;
  stock_qty: number | null;
  in_stock: boolean | null;
  delivery_days_min: number | null;
  delivery_days_max: number | null;
  supplier_image_url: string | null;
  missing_supplier_price: boolean;
  missing_supplier_image: boolean;
  cms_data?: ProductCMS | null;
}

export interface RimsCmsFilters {
  supplierFilter: string;
  showMissingPriceOnly: boolean;
  showMissingImagesOnly: boolean;
  showMissingSeoOnly: boolean;
  showMissingSpecsOnly: boolean;
  statusFilter: string;
}

export type RimsCmsStatusFilter =
  | 'all'
  | 'visible'
  | 'hidden'
  | 'missing_price'
  | 'missing_image'
  | 'manual_not_sellable';
