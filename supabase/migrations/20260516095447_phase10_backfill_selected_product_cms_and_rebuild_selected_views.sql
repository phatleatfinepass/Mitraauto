-- Phase 10 cleanup: remove products_search dependency from active selected CMS views.
--
-- The selected CMS views only used products_search to map older product_cms
-- rows by EAN. First copy those CMS rows onto the selected-layer variant IDs,
-- then rebuild the views to use direct product_cms joins only.

create temp table phase10_product_cms_backfill as
with selected as (
  select
    id as selected_variant_id,
    product_type,
    nullif(regexp_replace(coalesce(ean, ''), '\D', '', 'g'), '') as ean_digits
  from public.catalog_selected_items
  where is_available
    and product_type in ('tire', 'rim')
),
legacy_source as (
  select distinct on (ps.product_type, nullif(regexp_replace(coalesce(ps.ean, ps.derived_ean, ''), '\D', '', 'g'), ''))
    ps.product_type,
    nullif(regexp_replace(coalesce(ps.ean, ps.derived_ean, ''), '\D', '', 'g'), '') as ean_digits,
    pc.*
  from public.product_cms pc
  join public.products_search ps
    on ps.variant_id = pc.variant_id
   and ps.product_type in ('tire', 'rim')
  where nullif(regexp_replace(coalesce(ps.ean, ps.derived_ean, ''), '\D', '', 'g'), '') is not null
  order by
    ps.product_type,
    nullif(regexp_replace(coalesce(ps.ean, ps.derived_ean, ''), '\D', '', 'g'), ''),
    pc.updated_at desc nulls last,
    pc.created_at desc nulls last,
    pc.variant_id
)
select
  s.selected_variant_id,
  l.variant_id as legacy_variant_id,
  l.title,
  l.subtitle,
  l.short_description,
  l.long_description,
  l.hero_image_url,
  l.gallery,
  l.badges,
  l.seo_slug,
  l.is_hidden,
  l.seo_title,
  l.seo_description,
  l.spec_overrides,
  l.price_override,
  l.promo_price_override,
  l.promo_active,
  l.stock_override,
  l.force_out_of_stock,
  l.is_hostile,
  l.freeze_auto_updates,
  l.promo_enabled,
  l.promo_starts_at,
  l.promo_ends_at,
  l.price_override_eur,
  l.promo_price_eur,
  l.promo_start,
  l.promo_end,
  l.freeze_reason,
  l.freeze_until
from selected s
join legacy_source l
  on l.product_type = s.product_type
 and l.ean_digits = s.ean_digits
left join public.product_cms direct
  on direct.variant_id = s.selected_variant_id
where s.ean_digits is not null
  and direct.variant_id is null;

update public.product_cms pc
set seo_slug = null,
    updated_at = now()
from phase10_product_cms_backfill b
where pc.variant_id = b.legacy_variant_id
  and b.seo_slug is not null
  and pc.seo_slug = b.seo_slug;

insert into public.product_cms (
  variant_id,
  title,
  subtitle,
  short_description,
  long_description,
  hero_image_url,
  gallery,
  badges,
  seo_slug,
  is_hidden,
  seo_title,
  seo_description,
  spec_overrides,
  price_override,
  promo_price_override,
  promo_active,
  stock_override,
  force_out_of_stock,
  is_hostile,
  freeze_auto_updates,
  promo_enabled,
  promo_starts_at,
  promo_ends_at,
  price_override_eur,
  promo_price_eur,
  promo_start,
  promo_end,
  freeze_reason,
  freeze_until
)
select
  b.selected_variant_id,
  b.title,
  b.subtitle,
  b.short_description,
  b.long_description,
  b.hero_image_url,
  b.gallery,
  b.badges,
  case
    when b.seo_slug is null then null
    when exists (
      select 1
      from public.product_cms existing
      where existing.seo_slug = b.seo_slug
    ) then null
    else b.seo_slug
  end as seo_slug,
  coalesce(b.is_hidden, false),
  b.seo_title,
  b.seo_description,
  coalesce(b.spec_overrides, '{}'::jsonb),
  b.price_override,
  b.promo_price_override,
  coalesce(b.promo_active, false),
  b.stock_override,
  coalesce(b.force_out_of_stock, false),
  coalesce(b.is_hostile, false),
  coalesce(b.freeze_auto_updates, false),
  coalesce(b.promo_enabled, false),
  b.promo_starts_at,
  b.promo_ends_at,
  b.price_override_eur,
  b.promo_price_eur,
  b.promo_start,
  b.promo_end,
  b.freeze_reason,
  b.freeze_until
from phase10_product_cms_backfill b
on conflict (variant_id) do nothing;

create or replace view public.catalog_selected_tires_cms_admin_v1 as
with selected as (
  select *
  from public.catalog_selected_items
  where product_type = 'tire'
    and is_available
)
select
  s.id as variant_id,
  s.product_type,
  s.ean as derived_ean,
  s.selected_supplier as supplier_code_best,
  s.selected_external_id as supplier_external_id_best,
  s.brand,
  s.model,
  s.size_string,
  s.season,
  s.studded,
  s.runflat,
  s.xl_reinforced,
  s.load_index,
  s.speed_rating,
  s.speed_rating as speed_index,
  s.ev_ready,
  s.threepmsf,
  s.winter_approved,
  s.ice_approved,
  s.eu_wet_grip_class as eu_wet,
  s.eu_noise_db::numeric as eu_noise,
  s.eu_label_json,
  s.fair_cost_ex_vat as final_price_eur,
  s.fair_cost_ex_vat as price,
  (s.conflict_status <> 'resolved') as ean_conflict_open,
  s.width_mm,
  s.aspect_ratio,
  s.diameter_in,
  s.ean,
  false as has_ean_multi_spec_conflict,
  (s.conflict_status <> 'resolved') as has_mandatory_conflict,
  (s.fair_cost_ex_vat is null) as missing_supplier_price,
  false as is_non_passenger_auto,
  coalesce((pc.spec_overrides->'classification'->>'non_passenger_manual')::boolean, false) as is_non_passenger_manual,
  coalesce((pc.spec_overrides->'classification'->>'non_passenger_manual')::boolean, false) as is_non_passenger,
  case
    when pc.variant_id is null then null::jsonb
    else jsonb_build_object(
      'variant_id', s.id,
      'title', pc.title,
      'subtitle', pc.subtitle,
      'short_description', pc.short_description,
      'long_description', pc.long_description,
      'hero_image_url', pc.hero_image_url,
      'gallery', coalesce(pc.gallery, '[]'::jsonb),
      'seo_slug', pc.seo_slug,
      'seo_title', pc.seo_title,
      'seo_description', pc.seo_description,
      'is_hidden', coalesce(pc.is_hidden, false),
      'spec_overrides', coalesce(pc.spec_overrides, '{}'::jsonb),
      'price_override_eur', pc.price_override_eur,
      'promo_enabled', coalesce(pc.promo_enabled, false),
      'promo_price_eur', pc.promo_price_eur,
      'promo_start', pc.promo_start,
      'promo_end', pc.promo_end
    )
  end as cms_data
from selected s
left join public.product_cms pc
  on pc.variant_id = s.id;

create or replace view public.catalog_selected_rims_cms_admin_v1 as
with selected as (
  select *
  from public.catalog_selected_items
  where product_type = 'rim'
    and is_available
)
select
  s.id as variant_id,
  s.product_type,
  s.ean as derived_ean,
  s.selected_supplier as supplier_code_best,
  s.selected_external_id as supplier_external_id_best,
  s.brand,
  s.model,
  s.size_string,
  s.width_in,
  s.rim_diameter_in,
  s.et_offset_mm,
  s.bolt_pattern,
  s.center_bore_mm,
  s.cb_mm,
  s.color,
  s.finish,
  s.material,
  s.bolts_included,
  s.winter_approved,
  s.wheel_load_kg,
  s.final_base_price_eur as final_price_eur,
  s.final_base_price_eur as price,
  s.stock_qty,
  s.in_stock,
  s.delivery_days_min,
  s.delivery_days_max,
  s.supplier_image_url,
  s.ean,
  (s.final_base_price_eur is null) as missing_supplier_price,
  (s.supplier_image_url is null) as missing_supplier_image,
  case
    when pc.variant_id is null then null::jsonb
    else jsonb_build_object(
      'variant_id', s.id,
      'title', pc.title,
      'subtitle', pc.subtitle,
      'short_description', pc.short_description,
      'long_description', pc.long_description,
      'hero_image_url', pc.hero_image_url,
      'gallery',
        case
          when jsonb_typeof(coalesce(pc.gallery, '[]'::jsonb)) = 'array' then coalesce(pc.gallery, '[]'::jsonb)
          else '[]'::jsonb
        end,
      'badges',
        case
          when jsonb_typeof(coalesce(pc.badges, '[]'::jsonb)) = 'array' then coalesce(pc.badges, '[]'::jsonb)
          else '[]'::jsonb
        end,
      'seo_slug', pc.seo_slug,
      'seo_title', pc.seo_title,
      'seo_description', pc.seo_description,
      'is_hidden', coalesce(pc.is_hidden, false),
      'spec_overrides', coalesce(pc.spec_overrides, '{}'::jsonb),
      'price_override_eur', pc.price_override_eur,
      'promo_enabled', coalesce(pc.promo_enabled, false),
      'promo_price_eur', pc.promo_price_eur,
      'promo_start', pc.promo_start,
      'promo_end', pc.promo_end
    )
  end as cms_data
from selected s
left join public.product_cms pc
  on pc.variant_id = s.id;

revoke all on public.catalog_selected_tires_cms_admin_v1 from public;
revoke all on public.catalog_selected_rims_cms_admin_v1 from public;
grant select on public.catalog_selected_tires_cms_admin_v1 to service_role;
grant select on public.catalog_selected_rims_cms_admin_v1 to service_role;
