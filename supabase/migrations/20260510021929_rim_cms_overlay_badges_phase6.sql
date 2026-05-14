-- Phase 6: include product_cms.badges in the selected rim CMS overlay JSON.

set lock_timeout = '5s';
set statement_timeout = '60s';

create or replace view public.catalog_selected_rims_cms_admin_v1 as
with selected as (
  select *
  from public.catalog_selected_items
  where product_type = 'rim'
    and is_available
),
legacy_cms_by_ean as (
  select distinct on (legacy_source.legacy_ean)
    legacy_source.*
  from (
    select
      nullif(regexp_replace(coalesce(ps.ean, ps.derived_ean, ''), '\D', '', 'g'), '') as legacy_ean,
      pc.*
    from public.product_cms pc
    join public.products_search ps
      on ps.variant_id = pc.variant_id
     and ps.product_type = 'rim'
  ) legacy_source
  where legacy_ean is not null
  order by legacy_ean, variant_id
),
rows as (
  select
    s.*,
    coalesce(pc_direct.title, pc_legacy.title) as cms_title,
    coalesce(pc_direct.subtitle, pc_legacy.subtitle) as cms_subtitle,
    coalesce(pc_direct.short_description, pc_legacy.short_description) as cms_short_description,
    coalesce(pc_direct.long_description, pc_legacy.long_description) as cms_long_description,
    coalesce(pc_direct.hero_image_url, pc_legacy.hero_image_url) as cms_hero_image_url,
    coalesce(pc_direct.gallery, pc_legacy.gallery) as cms_gallery,
    coalesce(pc_direct.badges, pc_legacy.badges) as cms_badges,
    coalesce(pc_direct.seo_slug, pc_legacy.seo_slug) as cms_seo_slug,
    coalesce(pc_direct.seo_title, pc_legacy.seo_title) as cms_seo_title,
    coalesce(pc_direct.seo_description, pc_legacy.seo_description) as cms_seo_description,
    coalesce(pc_direct.is_hidden, pc_legacy.is_hidden) as cms_is_hidden,
    coalesce(pc_direct.spec_overrides, pc_legacy.spec_overrides) as cms_spec_overrides,
    coalesce(pc_direct.price_override_eur, pc_legacy.price_override_eur) as cms_price_override_eur,
    coalesce(pc_direct.promo_enabled, pc_legacy.promo_enabled) as cms_promo_enabled,
    coalesce(pc_direct.promo_price_eur, pc_legacy.promo_price_eur) as cms_promo_price_eur,
    coalesce(pc_direct.promo_start, pc_legacy.promo_start) as cms_promo_start,
    coalesce(pc_direct.promo_end, pc_legacy.promo_end) as cms_promo_end,
    coalesce(pc_direct.variant_id, pc_legacy.variant_id) as cms_source_variant_id
  from selected s
  left join public.product_cms pc_direct
    on pc_direct.variant_id = s.id
  left join legacy_cms_by_ean pc_legacy
    on pc_direct.variant_id is null
   and s.ean is not null
   and pc_legacy.legacy_ean = s.ean
)
select
  id as variant_id,
  product_type,
  ean as derived_ean,
  selected_supplier as supplier_code_best,
  selected_external_id as supplier_external_id_best,
  brand,
  model,
  size_string,
  width_in,
  rim_diameter_in,
  et_offset_mm,
  bolt_pattern,
  center_bore_mm,
  cb_mm,
  color,
  finish,
  material,
  bolts_included,
  winter_approved,
  wheel_load_kg,
  final_base_price_eur as final_price_eur,
  final_base_price_eur as price,
  stock_qty,
  in_stock,
  delivery_days_min,
  delivery_days_max,
  supplier_image_url,
  ean,
  final_base_price_eur is null as missing_supplier_price,
  supplier_image_url is null as missing_supplier_image,
  case
    when cms_source_variant_id is null then null
    else jsonb_build_object(
      'variant_id', id,
      'legacy_variant_id', cms_source_variant_id,
      'title', cms_title,
      'subtitle', cms_subtitle,
      'short_description', cms_short_description,
      'long_description', cms_long_description,
      'hero_image_url', cms_hero_image_url,
      'gallery', case when jsonb_typeof(coalesce(cms_gallery, '[]'::jsonb)) = 'array' then coalesce(cms_gallery, '[]'::jsonb) else '[]'::jsonb end,
      'badges', case when jsonb_typeof(coalesce(cms_badges, '[]'::jsonb)) = 'array' then coalesce(cms_badges, '[]'::jsonb) else '[]'::jsonb end,
      'seo_slug', cms_seo_slug,
      'seo_title', cms_seo_title,
      'seo_description', cms_seo_description,
      'is_hidden', coalesce(cms_is_hidden, false),
      'spec_overrides', coalesce(cms_spec_overrides, '{}'::jsonb),
      'price_override_eur', cms_price_override_eur,
      'promo_enabled', coalesce(cms_promo_enabled, false),
      'promo_price_eur', cms_promo_price_eur,
      'promo_start', cms_promo_start,
      'promo_end', cms_promo_end
    )
  end as cms_data
from rows;

revoke all on public.catalog_selected_rims_cms_admin_v1 from public;
grant select on public.catalog_selected_rims_cms_admin_v1 to service_role;
