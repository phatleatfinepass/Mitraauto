import type { TyreLabelSectionData } from '../../../utils/tyreLabel';

export interface ProductSearchTire {
  variant_id: string;
  product_type: 'tire';
  ean?: string | null;
  derived_ean: string | null;
  supplier_code_best?: string | null;
  supplier_external_id_best?: string | null;
  brand: string;
  model: string;
  size_string: string | null;
  season: string | null;
  studded?: boolean | null;
  runflat?: boolean | null;
  xl_reinforced?: boolean | null;
  load_index?: string | number | null;
  speed_rating?: string | null;
  speed_index?: string | null;
  ev_ready?: boolean | null;
  threepmsf?: boolean | null;
  winter_approved?: boolean | null;
  ice_approved?: boolean | null;
  eu_fuel?: string | null;
  eu_wet?: string | null;
  eu_noise?: number | null;
  eu_label_json?: any;
  eprel_code?: string | null;
  eprel_registration_number?: string | null;
  eprel_qr_url?: string | null;
  eprel_sheet_url?: string | null;
  eprel_source?: string | null;
  eprel_source_url?: string | null;
  eu_fuel_class: string | null;
  eu_wet_grip_class: string | null;
  eu_noise_db: number | null;
  eu_noise_class: string | null;
  final_title: string | null;
  final_price_eur: number | null;
  final_is_hidden: boolean;
  price?: number | null;
  wholesale_price_ex_vat?: number | null;
  recycling_fee_ex_vat?: number | null;
  rd_effective_price_ex_vat?: number | null;
  ean_conflict_open?: boolean | null;
  has_duplicate_ean_conflict?: boolean;
  has_mandatory_field_conflict?: boolean;
  has_missing_ean?: boolean;
  is_non_passenger_auto?: boolean;
  is_non_passenger_manual?: boolean;
  is_non_passenger?: boolean;
}

export interface ProductCMS {
  variant_id: string;
  title: string | null;
  subtitle: string | null;
  short_description: string | null;
  long_description: string | null;
  hero_image_url: string | null;
  gallery: string[] | null;
  seo_slug: string | null;
  seo_title: string | null;
  seo_description: string | null;
  is_hidden: boolean;
  spec_overrides: {
    i18n?: {
      en?: {
        title?: string | null;
        subtitle?: string | null;
        short_description?: string | null;
        long_description?: string | null;
        seo_slug?: string | null;
        seo_title?: string | null;
        seo_description?: string | null;
      };
    };
    eu?: {
      fuel_class?: string;
      wet_grip_class?: string;
      noise_db?: number;
      noise_class?: string;
    };
    identity?: {
      brand?: string | null;
      model?: string | null;
      ean?: string | null;
      size_string?: string | null;
      season?: string | null;
      load_index?: string | null;
      speed_rating?: string | null;
    };
    features?: {
      ev_ready?: boolean;
      runflat?: boolean;
      xl?: boolean;
      studded?: boolean;
      threepmsf?: boolean;
      winter_approved?: boolean;
      ice_approved?: boolean;
    };
    tyre_label_section?: TyreLabelSectionData;
    [key: string]: any;
  } | null;
  price_override_eur: number | null;
  promo_enabled: boolean;
  promo_price_eur: number | null;
  promo_start: string | null;
  promo_end: string | null;
}

export interface TireRow extends ProductSearchTire {
  cms_data?: ProductCMS | null;
}

export interface TireAdminPricingDetails {
  variant_id: string;
  supplier_code_best: string | null;
  supplier_external_id_best: string | null;
  catalog_price_ex_vat: number | null;
  current_catalog_effective_price_ex_vat: number | null;
  wholesale_price_ex_vat: number | null;
  consumer_price_ex_vat: number | null;
  raw_net_price_ex_vat: number | null;
  raw_price_ex_vat: number | null;
  raw_retail_price_inc_vat: number | null;
  recycling_fee_ex_vat: number | null;
  shipping_fee_ex_vat?: number | null;
}

export interface TiresWarningTooltipState {
  text: string;
  x: number;
  y: number;
}
