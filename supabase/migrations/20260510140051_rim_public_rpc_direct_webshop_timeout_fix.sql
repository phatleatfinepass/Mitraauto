-- Avoid storefront rim timeouts by listing/counting directly from webshop_items.

set lock_timeout = '5s';
set statement_timeout = '120s';

drop function if exists public.catalog_list_rims_v1(text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean, text, integer, integer);

create or replace function public.catalog_count_rims_v1(
  p_search text default null,
  p_brands text[] default null,
  p_diameter numeric default null,
  p_width numeric default null,
  p_widths numeric[] default null,
  p_pcd text default null,
  p_et_offset numeric default null,
  p_center_bore_min numeric default null,
  p_color text default null,
  p_material text default null,
  p_bolts_included boolean default null,
  p_in_stock boolean default false
)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.webshop_items w
  where w.product_type = 'rim'
    and w.is_visible
    and w.publish_status = 'published'
    and (
      nullif(btrim(coalesce(p_search, '')), '') is null
      or w.brand ilike '%' || btrim(p_search) || '%'
      or coalesce(w.brand_display_name, '') ilike '%' || btrim(p_search) || '%'
      or w.model ilike '%' || btrim(p_search) || '%'
      or coalesce(w.size_string, '') ilike '%' || btrim(p_search) || '%'
      or coalesce(w.card_title, '') ilike '%' || btrim(p_search) || '%'
      or coalesce(w.color, '') ilike '%' || btrim(p_search) || '%'
      or coalesce(w.ean, '') ilike '%' || btrim(p_search) || '%'
      or coalesce(w.derived_ean, '') ilike '%' || btrim(p_search) || '%'
      or public.catalog_normalize_rim_pcd(w.bolt_pattern) ilike '%' || public.catalog_normalize_rim_pcd(p_search) || '%'
      or coalesce(w.tags, '[]'::jsonb)::text ilike '%' || btrim(p_search) || '%'
    )
    and (
      coalesce(array_length(p_brands, 1), 0) = 0
      or exists (
        select 1
        from unnest(p_brands) as selected_brand(brand_name)
        where lower(coalesce(nullif(btrim(w.brand_display_name), ''), w.brand)) = lower(btrim(selected_brand.brand_name))
      )
    )
    and (p_diameter is null or w.rim_diameter_in = p_diameter)
    and (p_width is null or w.width_in = p_width)
    and (coalesce(array_length(p_widths, 1), 0) = 0 or w.width_in = any(p_widths))
    and (
      public.catalog_normalize_rim_pcd(p_pcd) is null
      or public.catalog_normalize_rim_pcd(p_pcd) = 'all'
      or public.catalog_normalize_rim_pcd(w.bolt_pattern) = public.catalog_normalize_rim_pcd(p_pcd)
    )
    and (p_et_offset is null or w.et_offset_mm = p_et_offset)
    and (p_center_bore_min is null or coalesce(w.center_bore_mm, w.cb_mm) >= p_center_bore_min)
    and (
      nullif(btrim(coalesce(p_color, '')), '') is null
      or lower(btrim(p_color)) = 'all'
      or coalesce(w.color, '') ilike btrim(p_color)
      or coalesce(w.finish, '') ilike btrim(p_color)
    )
    and (
      nullif(btrim(coalesce(p_material, '')), '') is null
      or lower(btrim(p_material)) = 'all'
      or coalesce(w.material, '') ilike btrim(p_material)
      or coalesce(w.finish, '') ilike btrim(p_material)
    )
    and (p_bolts_included is null or w.bolts_included is not distinct from p_bolts_included)
    and (coalesce(p_in_stock, false) = false or w.in_stock = true);
$$;

create or replace function public.catalog_list_rims_v1(
  p_search text default null,
  p_brands text[] default null,
  p_diameter numeric default null,
  p_width numeric default null,
  p_widths numeric[] default null,
  p_pcd text default null,
  p_et_offset numeric default null,
  p_center_bore_min numeric default null,
  p_color text default null,
  p_material text default null,
  p_bolts_included boolean default null,
  p_in_stock boolean default false,
  p_sort_by text default 'price_asc',
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
  sound_absorber boolean,
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
  center_bore_mm numeric,
  cb_mm numeric,
  color text,
  finish text,
  material text,
  bolts_included boolean,
  wheel_load_kg numeric,
  price numeric,
  final_price_eur numeric,
  currency text,
  in_stock boolean,
  stock_qty integer,
  delivery_days_min integer,
  delivery_days_max integer,
  supplier_code_best text,
  supplier_external_id_best text,
  best_image_url text,
  hero_image_url text,
  gallery jsonb,
  best_image_alt text,
  card_title text,
  title text,
  subtitle text,
  short_description text,
  long_description text,
  generated_tags jsonb,
  tags jsonb,
  seo_slug text,
  seo_title text,
  seo_description text,
  eu_label_json jsonb,
  eu_fuel text,
  eu_wet text,
  eu_noise numeric,
  final_is_hidden boolean,
  ean text,
  derived_ean text,
  manufacture_year integer,
  pricing_rules jsonb,
  spec_overrides jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  with filtered as (
    select w.*
    from public.webshop_items w
    where w.product_type = 'rim'
      and w.is_visible
      and w.publish_status = 'published'
      and (
        nullif(btrim(coalesce(p_search, '')), '') is null
        or w.brand ilike '%' || btrim(p_search) || '%'
        or coalesce(w.brand_display_name, '') ilike '%' || btrim(p_search) || '%'
        or w.model ilike '%' || btrim(p_search) || '%'
        or coalesce(w.size_string, '') ilike '%' || btrim(p_search) || '%'
        or coalesce(w.card_title, '') ilike '%' || btrim(p_search) || '%'
        or coalesce(w.color, '') ilike '%' || btrim(p_search) || '%'
        or coalesce(w.ean, '') ilike '%' || btrim(p_search) || '%'
        or coalesce(w.derived_ean, '') ilike '%' || btrim(p_search) || '%'
        or public.catalog_normalize_rim_pcd(w.bolt_pattern) ilike '%' || public.catalog_normalize_rim_pcd(p_search) || '%'
        or coalesce(w.tags, '[]'::jsonb)::text ilike '%' || btrim(p_search) || '%'
      )
      and (
        coalesce(array_length(p_brands, 1), 0) = 0
        or exists (
          select 1
          from unnest(p_brands) as selected_brand(brand_name)
          where lower(coalesce(nullif(btrim(w.brand_display_name), ''), w.brand)) = lower(btrim(selected_brand.brand_name))
        )
      )
      and (p_diameter is null or w.rim_diameter_in = p_diameter)
      and (p_width is null or w.width_in = p_width)
      and (coalesce(array_length(p_widths, 1), 0) = 0 or w.width_in = any(p_widths))
      and (
        public.catalog_normalize_rim_pcd(p_pcd) is null
        or public.catalog_normalize_rim_pcd(p_pcd) = 'all'
        or public.catalog_normalize_rim_pcd(w.bolt_pattern) = public.catalog_normalize_rim_pcd(p_pcd)
      )
      and (p_et_offset is null or w.et_offset_mm = p_et_offset)
      and (p_center_bore_min is null or coalesce(w.center_bore_mm, w.cb_mm) >= p_center_bore_min)
      and (
        nullif(btrim(coalesce(p_color, '')), '') is null
        or lower(btrim(p_color)) = 'all'
        or coalesce(w.color, '') ilike btrim(p_color)
        or coalesce(w.finish, '') ilike btrim(p_color)
      )
      and (
        nullif(btrim(coalesce(p_material, '')), '') is null
        or lower(btrim(p_material)) = 'all'
        or coalesce(w.material, '') ilike btrim(p_material)
        or coalesce(w.finish, '') ilike btrim(p_material)
      )
      and (p_bolts_included is null or w.bolts_included is not distinct from p_bolts_included)
      and (coalesce(p_in_stock, false) = false or w.in_stock = true)
    order by
      case when coalesce(p_sort_by, 'price_asc') = 'price_desc' then w.final_price_eur end desc nulls last,
      case when coalesce(p_sort_by, 'price_asc') = 'price_asc' then w.final_price_eur end asc nulls last,
      case when p_sort_by = 'brand_desc' then coalesce(w.brand_display_name, w.brand) end desc,
      case when p_sort_by in ('brand_asc', 'default') then coalesce(w.brand_display_name, w.brand) end asc,
      coalesce(w.brand_display_name, w.brand) asc,
      w.model asc,
      w.rim_diameter_in asc nulls last,
      w.width_in asc nulls last,
      w.variant_id asc
    limit least(greatest(coalesce(p_limit, 24), 1), 100)
    offset greatest(coalesce(p_offset, 0), 0)
  )
  select
    f.variant_id,
    f.product_type,
    f.brand,
    coalesce(nullif(f.brand_display_name, ''), f.brand) as brand_display_name,
    f.brand_logo_url,
    f.model,
    f.size_string,
    f.season,
    f.studded,
    f.runflat,
    f.xl_reinforced,
    f.load_index::text,
    f.speed_rating,
    f.speed_index,
    f.ev_ready,
    f.sound_absorber,
    f.threepmsf,
    f.winter_approved,
    f.ice_approved,
    f.width_mm,
    f.aspect_ratio,
    f.diameter_in,
    f.width_in,
    f.rim_diameter_in,
    f.et_offset_mm,
    f.bolt_pattern,
    coalesce(f.center_bore_mm, f.cb_mm) as center_bore_mm,
    coalesce(f.cb_mm, f.center_bore_mm) as cb_mm,
    f.color,
    f.finish,
    coalesce(nullif(f.material, ''), nullif(f.finish, '')) as material,
    f.bolts_included,
    f.wheel_load_kg,
    f.price,
    coalesce(f.final_price_eur, f.price) as final_price_eur,
    f.currency,
    coalesce(f.in_stock, false) as in_stock,
    f.stock_qty,
    f.delivery_days_min,
    f.delivery_days_max,
    f.supplier_code_best,
    f.supplier_external_id_best,
    coalesce(nullif(f.best_image_url, ''), nullif(f.hero_image_url, '')) as best_image_url,
    coalesce(nullif(f.hero_image_url, ''), nullif(f.best_image_url, '')) as hero_image_url,
    case
      when jsonb_typeof(coalesce(f.gallery, '[]'::jsonb)) = 'array' then coalesce(f.gallery, '[]'::jsonb)
      when nullif(f.hero_image_url, '') is not null then jsonb_build_array(f.hero_image_url)
      when nullif(f.best_image_url, '') is not null then jsonb_build_array(f.best_image_url)
      else '[]'::jsonb
    end as gallery,
    f.best_image_alt,
    f.card_title,
    f.card_title as title,
    f.subtitle,
    f.short_description,
    f.long_description,
    gt.generated_tags,
    public.catalog_merge_jsonb_text_tags(gt.generated_tags, coalesce(f.tags, '[]'::jsonb)) as tags,
    f.seo_slug,
    f.seo_title,
    f.seo_description,
    f.eu_label_json,
    null::text as eu_fuel,
    f.eu_wet,
    f.eu_noise,
    false as final_is_hidden,
    f.ean,
    f.derived_ean,
    f.manufacture_year,
    f.pricing_rules,
    coalesce(f.spec_overrides, '{}'::jsonb) as spec_overrides
  from filtered f
  cross join lateral (
    select public.catalog_build_rim_generated_tags(
      f.width_in,
      f.rim_diameter_in,
      f.bolt_pattern,
      f.et_offset_mm,
      coalesce(f.center_bore_mm, f.cb_mm),
      f.in_stock,
      coalesce(nullif(f.material, ''), nullif(f.finish, '')),
      f.bolts_included,
      f.winter_approved,
      f.wheel_load_kg,
      f.color,
      f.finish
    ) as generated_tags
  ) gt;
$$;

revoke all on function public.catalog_count_rims_v1(text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean) from public;
grant execute on function public.catalog_count_rims_v1(text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean) to anon, authenticated;

revoke all on function public.catalog_list_rims_v1(text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean, text, integer, integer) from public;
grant execute on function public.catalog_list_rims_v1(text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean, text, integer, integer) to anon, authenticated;
