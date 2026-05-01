create or replace function public.catalog_normalize_tire_manufacture_year(
  p_supplier_metadata_json jsonb
)
returns integer
language sql
immutable
set search_path = public
as $$
  with raw_value as (
    select nullif(
      regexp_replace(
        coalesce(
          p_supplier_metadata_json->>'manufacture_year',
          p_supplier_metadata_json->>'dot_year',
          p_supplier_metadata_json->>'dot',
          ''
        ),
        '\D',
        '',
        'g'
      ),
      ''
    ) as digits
  ),
  normalized as (
    select
      case
        when digits ~ '^\d{4}$' then digits::integer
        when digits ~ '^\d{2}$' and digits::integer >= 80 then 1900 + digits::integer
        when digits ~ '^\d{2}$' then 2000 + digits::integer
        else null
      end as year_value
    from raw_value
  )
  select case
    when year_value between 1900 and 2099 then year_value
    else null
  end
  from normalized;
$$;

alter table public.catalog_selected_items
  add column if not exists manufacture_year integer;

alter table public.webshop_items
  add column if not exists manufacture_year integer;

alter table public.catalog_selected_items
  drop constraint if exists catalog_selected_items_manufacture_year_check;

alter table public.catalog_selected_items
  add constraint catalog_selected_items_manufacture_year_check
  check (manufacture_year is null or manufacture_year between 1900 and 2099);

alter table public.webshop_items
  drop constraint if exists webshop_items_manufacture_year_check;

alter table public.webshop_items
  add constraint webshop_items_manufacture_year_check
  check (manufacture_year is null or manufacture_year between 1900 and 2099);

create or replace function public.catalog_selected_items_set_manufacture_year()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.product_type = 'tire' then
    new.manufacture_year := public.catalog_normalize_tire_manufacture_year(new.supplier_metadata_json);
  else
    new.manufacture_year := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_catalog_selected_items_manufacture_year on public.catalog_selected_items;
create trigger trg_catalog_selected_items_manufacture_year
before insert or update of product_type, supplier_metadata_json on public.catalog_selected_items
for each row
execute function public.catalog_selected_items_set_manufacture_year();

create or replace function public.webshop_items_set_tire_manufacture_year()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.product_type = 'tire' then
    select s.manufacture_year
    into new.manufacture_year
    from public.catalog_selected_items s
    where s.id = new.variant_id;
  else
    new.manufacture_year := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_webshop_items_tire_manufacture_year on public.webshop_items;
create trigger trg_webshop_items_tire_manufacture_year
before insert or update on public.webshop_items
for each row
execute function public.webshop_items_set_tire_manufacture_year();

update public.catalog_selected_items
set manufacture_year = public.catalog_normalize_tire_manufacture_year(supplier_metadata_json)
where product_type = 'tire'
  and manufacture_year is distinct from public.catalog_normalize_tire_manufacture_year(supplier_metadata_json);

update public.webshop_items w
set manufacture_year = s.manufacture_year
from public.catalog_selected_items s
where s.id = w.variant_id
  and w.product_type = 'tire';

create or replace view public.catalog_selected_tires_cms_admin_v1 as
with selected as (
  select *
  from public.catalog_selected_items
  where product_type = 'tire'
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
     and ps.product_type = 'tire'
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
  season,
  studded,
  runflat,
  xl_reinforced,
  load_index,
  speed_rating,
  speed_rating as speed_index,
  ev_ready,
  threepmsf,
  winter_approved,
  ice_approved,
  eu_wet_grip_class as eu_wet,
  eu_noise_db::numeric as eu_noise,
  eu_label_json,
  fair_cost_ex_vat as final_price_eur,
  fair_cost_ex_vat as price,
  conflict_status <> 'resolved' as ean_conflict_open,
  width_mm,
  aspect_ratio,
  diameter_in,
  ean,
  false as has_ean_multi_spec_conflict,
  conflict_status <> 'resolved' as has_mandatory_conflict,
  fair_cost_ex_vat is null as missing_supplier_price,
  false as is_non_passenger_auto,
  coalesce((cms_spec_overrides->'classification'->>'non_passenger_manual')::boolean, false) as is_non_passenger_manual,
  coalesce((cms_spec_overrides->'classification'->>'non_passenger_manual')::boolean, false) as is_non_passenger,
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
      'gallery', coalesce(cms_gallery, '[]'::jsonb),
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
  end as cms_data,
  manufacture_year
from rows;

drop function if exists public.cms_list_tires_admin_v1(text, boolean, boolean, text, text[], boolean, boolean, text[], integer, integer);

create or replace function public.cms_list_tires_admin_v1(
  p_search text default null,
  p_missing_ean_only boolean default false,
  p_exclude_non_passenger boolean default true,
  p_supplier_code text default null,
  p_missing_metadata_fields text[] default null,
  p_missing_image_only boolean default false,
  p_has_eprel_only boolean default false,
  p_missing_seo_fields text[] default null,
  p_limit integer default 26,
  p_offset integer default 0
)
returns table (
  variant_id uuid,
  product_type text,
  derived_ean text,
  supplier_code_best text,
  supplier_external_id_best text,
  brand text,
  model text,
  size_string text,
  season text,
  studded boolean,
  runflat boolean,
  xl_reinforced boolean,
  load_index text,
  speed_rating text,
  speed_index text,
  ev_ready boolean,
  threepmsf boolean,
  winter_approved boolean,
  ice_approved boolean,
  eu_wet text,
  eu_noise numeric,
  eu_label_json jsonb,
  final_price_eur numeric,
  price numeric,
  ean_conflict_open boolean,
  width_mm numeric,
  aspect_ratio numeric,
  diameter_in numeric,
  ean text,
  has_ean_multi_spec_conflict boolean,
  has_mandatory_conflict boolean,
  missing_supplier_price boolean,
  is_non_passenger_auto boolean,
  is_non_passenger_manual boolean,
  is_non_passenger boolean,
  cms_data jsonb,
  manufacture_year integer
)
language sql
security definer
set search_path = public
as $$
  select
    mv.variant_id,
    mv.product_type,
    mv.derived_ean,
    mv.supplier_code_best,
    mv.supplier_external_id_best,
    mv.brand,
    mv.model,
    mv.size_string,
    mv.season,
    mv.studded,
    mv.runflat,
    mv.xl_reinforced,
    mv.load_index,
    mv.speed_rating,
    mv.speed_index,
    mv.ev_ready,
    mv.threepmsf,
    mv.winter_approved,
    mv.ice_approved,
    mv.eu_wet,
    mv.eu_noise,
    mv.eu_label_json,
    mv.final_price_eur,
    mv.price,
    mv.ean_conflict_open,
    mv.width_mm,
    mv.aspect_ratio,
    mv.diameter_in,
    mv.ean,
    mv.has_ean_multi_spec_conflict,
    mv.has_mandatory_conflict,
    mv.missing_supplier_price,
    mv.is_non_passenger_auto,
    mv.is_non_passenger_manual,
    mv.is_non_passenger,
    mv.cms_data,
    mv.manufacture_year
  from public.catalog_selected_tires_cms_admin_v1 mv
  where public.catalog_selected_tire_cms_matches_search(mv, p_search)
    and (not p_exclude_non_passenger or coalesce(mv.is_non_passenger, false) = false)
    and (p_supplier_code is null or btrim(p_supplier_code) = '' or upper(coalesce(mv.supplier_code_best, '')) = upper(btrim(p_supplier_code)))
    and (not p_missing_ean_only or coalesce(mv.derived_ean, mv.ean) is null)
    and (
      not p_has_eprel_only
      or nullif(
        btrim(
          coalesce(
            mv.cms_data->'spec_overrides'->'tyre_label_section'->'eu_label'->>'eprel_registration_number',
            mv.cms_data->'spec_overrides'->'tyre_label_section'->'eu_label'->>'eprel_qr_url',
            mv.cms_data->'spec_overrides'->'tyre_label_section'->'eu_label'->>'eprel_sheet_url',
            mv.eu_label_json->>'eprel_registration_number',
            mv.eu_label_json->>'eprel_code',
            mv.eu_label_json->>'eprel_id',
            mv.eu_label_json->>'eprel',
            mv.eu_label_json->>'register_code',
            mv.eu_label_json->>'eprel_qr_url',
            mv.eu_label_json->>'qr_url',
            mv.eu_label_json->>'eprel_sheet_url',
            mv.eu_label_json->>'eprel_fiche_url',
            ''
          )
        ),
        ''
      ) is not null
    )
    and public.catalog_selected_tire_cms_matches_filters(mv, p_missing_metadata_fields, p_missing_image_only, p_missing_seo_fields)
  order by mv.brand asc, mv.model asc, mv.size_string asc, mv.variant_id asc
  limit greatest(coalesce(p_limit, 26), 1)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.cms_list_tires_admin_v1(text, boolean, boolean, text, text[], boolean, boolean, text[], integer, integer) from public;
grant execute on function public.cms_list_tires_admin_v1(text, boolean, boolean, text, text[], boolean, boolean, text[], integer, integer) to authenticated;

drop function if exists public.catalog_list_tires_v1(text, text[], numeric, numeric, numeric, text, text, boolean, boolean, boolean, boolean, boolean, text, integer, integer);

create or replace function public.catalog_list_tires_v1(
  p_search text default null,
  p_brands text[] default null,
  p_width numeric default null,
  p_aspect_ratio numeric default null,
  p_diameter numeric default null,
  p_season text default null,
  p_ean text default null,
  p_runflat boolean default false,
  p_xl boolean default false,
  p_studded boolean default false,
  p_in_stock boolean default false,
  p_include_retreaded boolean default false,
  p_sort_by text default 'brand_asc',
  p_limit integer default 24,
  p_offset integer default 0
)
returns table (
  variant_id uuid,
  product_type text,
  brand text,
  brand_display_name text,
  brand_logo_url text,
  model text,
  size_string text,
  season text,
  studded boolean,
  runflat boolean,
  xl_reinforced boolean,
  load_index text,
  speed_rating text,
  speed_index text,
  ev_ready boolean,
  threepmsf boolean,
  winter_approved boolean,
  ice_approved boolean,
  width_mm numeric,
  aspect_ratio numeric,
  diameter_in numeric,
  width_in numeric,
  rim_diameter_in numeric,
  et_offset_mm numeric,
  bolt_pattern text,
  color text,
  finish text,
  price numeric,
  final_price_eur numeric,
  currency text,
  in_stock boolean,
  stock_qty integer,
  delivery_days_min integer,
  delivery_days_max integer,
  supplier_code_best text,
  best_image_url text,
  hero_image_url text,
  gallery jsonb,
  best_image_alt text,
  card_title text,
  subtitle text,
  short_description text,
  long_description text,
  tags jsonb,
  seo_slug text,
  ean text,
  derived_ean text,
  eu_label_json jsonb,
  eu_wet text,
  eu_noise numeric,
  manufacture_year integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    w.variant_id,
    w.product_type,
    w.brand,
    w.brand_display_name,
    w.brand_logo_url,
    w.model,
    w.size_string,
    w.season,
    w.studded,
    w.runflat,
    w.xl_reinforced,
    w.load_index,
    w.speed_rating,
    w.speed_index,
    w.ev_ready,
    w.threepmsf,
    w.winter_approved,
    w.ice_approved,
    w.width_mm,
    w.aspect_ratio,
    w.diameter_in,
    w.width_in,
    w.rim_diameter_in,
    w.et_offset_mm,
    w.bolt_pattern,
    w.color,
    w.finish,
    w.price,
    w.final_price_eur,
    w.currency,
    w.in_stock,
    w.stock_qty,
    w.delivery_days_min,
    w.delivery_days_max,
    w.supplier_code_best,
    w.best_image_url,
    w.hero_image_url,
    w.gallery,
    w.best_image_alt,
    w.card_title,
    w.subtitle,
    w.short_description,
    w.long_description,
    w.tags,
    w.seo_slug,
    w.ean,
    w.derived_ean,
    w.eu_label_json,
    w.eu_wet,
    w.eu_noise,
    w.manufacture_year
  from public.webshop_items w
  where public.webshop_tire_matches_filters(
    w,
    p_search,
    p_brands,
    p_width,
    p_aspect_ratio,
    p_diameter,
    p_season,
    p_ean,
    p_runflat,
    p_xl,
    p_studded,
    p_in_stock,
    p_include_retreaded
  )
  order by
    case when coalesce(p_sort_by, 'brand_asc') = 'price_desc' then w.final_price_eur end desc nulls last,
    case when coalesce(p_sort_by, 'brand_asc') = 'price_desc' then w.price end desc nulls last,
    case when coalesce(p_sort_by, 'brand_asc') = 'price_asc' then w.final_price_eur end asc nulls last,
    case when coalesce(p_sort_by, 'brand_asc') = 'price_asc' then w.price end asc nulls last,
    case when coalesce(p_sort_by, 'brand_asc') = 'wet_grip' then w.eu_wet end asc nulls last,
    case when coalesce(p_sort_by, 'brand_asc') = 'noise' then w.eu_noise end asc nulls last,
    w.brand_display_name asc,
    w.model asc,
    w.variant_id asc
  limit greatest(coalesce(p_limit, 24), 1)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

grant execute on function public.catalog_list_tires_v1(text, text[], numeric, numeric, numeric, text, text, boolean, boolean, boolean, boolean, boolean, text, integer, integer) to anon, authenticated;
