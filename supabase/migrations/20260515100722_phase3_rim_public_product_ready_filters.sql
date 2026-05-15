set lock_timeout = '5s';
set statement_timeout = '120s';

create index if not exists webshop_items_rim_public_ready_price_idx
  on public.webshop_items (final_price_eur, price, variant_id)
  where product_type = 'rim'
    and is_visible
    and publish_status = 'published'
    and product_ready;

create index if not exists webshop_items_rim_public_ready_brand_idx
  on public.webshop_items (coalesce(nullif(btrim(brand_display_name), ''), brand), model, variant_id)
  where product_type = 'rim'
    and is_visible
    and publish_status = 'published'
    and product_ready;

create index if not exists webshop_items_rim_public_ready_fitment_idx
  on public.webshop_items (rim_diameter_in, width_in, bolt_pattern, et_offset_mm, center_bore_mm, cb_mm, variant_id)
  where product_type = 'rim'
    and is_visible
    and publish_status = 'published'
    and product_ready;

create or replace function public.catalog_list_rim_filter_options_v1()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with base as (
    select *
    from public.webshop_items
    where product_type = 'rim'
      and is_visible
      and publish_status = 'published'
      and product_ready
  ),
  diameters as (
    select jsonb_agg(value order by value) as items
    from (
      select distinct rim_diameter_in as value
      from base
      where rim_diameter_in is not null
    ) rows
  ),
  widths as (
    select jsonb_agg(value order by value) as items
    from (
      select distinct width_in as value
      from base
      where width_in is not null
    ) rows
  ),
  pcds as (
    select jsonb_agg(jsonb_build_object('value', value, 'label', label, 'count', row_count) order by holes, pitch, value) as items
    from (
      select
        public.catalog_format_rim_pcd_for_display(bolt_pattern) as value,
        public.catalog_format_rim_pcd_for_display(bolt_pattern) as label,
        nullif(split_part(public.catalog_normalize_rim_pcd(bolt_pattern), 'x', 1), '')::numeric as holes,
        nullif(split_part(public.catalog_normalize_rim_pcd(bolt_pattern), 'x', 2), '')::numeric as pitch,
        count(*) as row_count
      from base
      where public.catalog_normalize_rim_pcd(bolt_pattern) is not null
      group by value, label, holes, pitch
    ) rows
  ),
  et_offsets as (
    select jsonb_agg(value order by value) as items
    from (
      select distinct et_offset_mm as value
      from base
      where et_offset_mm is not null
    ) rows
  ),
  center_bores as (
    select jsonb_agg(value order by value) as items
    from (
      select distinct center_bore_mm as value
      from base
      where center_bore_mm is not null
    ) rows
  ),
  brands as (
    select jsonb_agg(value order by lower(value), value) as items
    from (
      select distinct coalesce(nullif(btrim(brand_display_name), ''), brand) as value
      from base
      where nullif(btrim(coalesce(brand_display_name, brand)), '') is not null
    ) rows
  )
  select jsonb_build_object(
    'diameters', coalesce((select items from diameters), '[]'::jsonb),
    'widths', coalesce((select items from widths), '[]'::jsonb),
    'pcds', coalesce((select items from pcds), '[]'::jsonb),
    'et_offsets', coalesce((select items from et_offsets), '[]'::jsonb),
    'center_bores', coalesce((select items from center_bores), '[]'::jsonb),
    'brands', coalesce((select items from brands), '[]'::jsonb)
  );
$$;

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
set search_path to 'public'
as $function$
  select count(*)::bigint
  from public.webshop_items w
  where w.product_type = 'rim'
    and w.is_visible
    and w.publish_status = 'published'
    and w.product_ready
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
$function$;

revoke all on function public.catalog_list_rim_filter_options_v1() from public;
grant execute on function public.catalog_list_rim_filter_options_v1() to anon, authenticated, service_role;

revoke all on function public.catalog_count_rims_v1(text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean) from public;
grant execute on function public.catalog_count_rims_v1(text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean) to anon, authenticated, service_role;
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
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_order_sql text;
  v_sql text;
begin
  v_order_sql := case coalesce(p_sort_by, 'price_asc')
    when 'price_desc' then 'w.final_price_eur desc nulls last, w.price desc nulls last, w.variant_id asc'
    when 'brand_desc' then 'coalesce(w.brand_display_name, w.brand) desc, w.model desc, w.variant_id asc'
    when 'brand_asc' then 'coalesce(w.brand_display_name, w.brand) asc, w.model asc, w.variant_id asc'
    else 'w.final_price_eur asc nulls last, w.price asc nulls last, w.variant_id asc'
  end;

  v_sql := '
    select
      w.variant_id,
      w.product_type,
      w.brand,
      coalesce(nullif(w.brand_display_name, ''''), w.brand) as brand_display_name,
      w.brand_logo_url,
      w.model,
      w.size_string,
      w.season,
      w.studded,
      w.runflat,
      w.xl_reinforced,
      w.load_index::text,
      w.speed_rating,
      w.speed_index,
      w.ev_ready,
      w.sound_absorber,
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
      coalesce(w.center_bore_mm, w.cb_mm) as center_bore_mm,
      coalesce(w.cb_mm, w.center_bore_mm) as cb_mm,
      w.color,
      w.finish,
      coalesce(nullif(w.material, ''''), nullif(w.finish, '''')) as material,
      w.bolts_included,
      w.wheel_load_kg,
      w.price,
      coalesce(w.final_price_eur, w.price) as final_price_eur,
      w.currency,
      coalesce(w.in_stock, false) as in_stock,
      w.stock_qty,
      w.delivery_days_min,
      w.delivery_days_max,
      w.supplier_code_best,
      w.supplier_external_id_best,
      coalesce(nullif(w.best_image_url, ''''), nullif(w.hero_image_url, '''')) as best_image_url,
      coalesce(nullif(w.hero_image_url, ''''), nullif(w.best_image_url, '''')) as hero_image_url,
      case
        when jsonb_typeof(coalesce(w.gallery, ''[]''::jsonb)) = ''array'' then coalesce(w.gallery, ''[]''::jsonb)
        when nullif(w.hero_image_url, '''') is not null then jsonb_build_array(w.hero_image_url)
        when nullif(w.best_image_url, '''') is not null then jsonb_build_array(w.best_image_url)
        else ''[]''::jsonb
      end as gallery,
      w.best_image_alt,
      w.card_title,
      w.card_title as title,
      w.subtitle,
      w.short_description,
      w.long_description,
      gt.generated_tags,
      public.catalog_merge_jsonb_text_tags(gt.generated_tags, coalesce(w.tags, ''[]''::jsonb)) as tags,
      w.seo_slug,
      w.seo_title,
      w.seo_description,
      w.eu_label_json,
      null::text as eu_fuel,
      w.eu_wet,
      w.eu_noise,
      false as final_is_hidden,
      w.ean,
      w.derived_ean,
      w.manufacture_year,
      w.pricing_rules,
      coalesce(w.spec_overrides, ''{}''::jsonb) as spec_overrides
    from public.webshop_items w
    cross join lateral (
      select public.catalog_build_rim_generated_tags(
        w.width_in,
        w.rim_diameter_in,
        w.bolt_pattern,
        w.et_offset_mm,
        coalesce(w.center_bore_mm, w.cb_mm),
        w.in_stock,
        coalesce(nullif(w.material, ''''), nullif(w.finish, '''')),
        w.bolts_included,
        w.winter_approved,
        w.wheel_load_kg,
        w.color,
        w.finish
      ) as generated_tags
    ) gt
    where w.product_type = ''rim''
      and w.is_visible
      and w.publish_status = ''published''
      and w.product_ready
      and (
        nullif(btrim(coalesce($1, '''')), '''') is null
        or w.brand ilike ''%'' || btrim($1) || ''%''
        or coalesce(w.brand_display_name, '''') ilike ''%'' || btrim($1) || ''%''
        or w.model ilike ''%'' || btrim($1) || ''%''
        or coalesce(w.size_string, '''') ilike ''%'' || btrim($1) || ''%''
        or coalesce(w.card_title, '''') ilike ''%'' || btrim($1) || ''%''
        or coalesce(w.color, '''') ilike ''%'' || btrim($1) || ''%''
        or coalesce(w.ean, '''') ilike ''%'' || btrim($1) || ''%''
        or coalesce(w.derived_ean, '''') ilike ''%'' || btrim($1) || ''%''
        or public.catalog_normalize_rim_pcd(w.bolt_pattern) ilike ''%'' || public.catalog_normalize_rim_pcd($1) || ''%''
        or coalesce(w.tags, ''[]''::jsonb)::text ilike ''%'' || btrim($1) || ''%''
      )
      and (
        coalesce(array_length($2, 1), 0) = 0
        or exists (
          select 1
          from unnest($2) as selected_brand(brand_name)
          where lower(coalesce(nullif(btrim(w.brand_display_name), ''''), w.brand)) = lower(btrim(selected_brand.brand_name))
        )
      )
      and ($3 is null or w.rim_diameter_in = $3)
      and ($4 is null or w.width_in = $4)
      and (coalesce(array_length($5, 1), 0) = 0 or w.width_in = any($5))
      and (
        public.catalog_normalize_rim_pcd($6) is null
        or public.catalog_normalize_rim_pcd($6) = ''all''
        or public.catalog_normalize_rim_pcd(w.bolt_pattern) = public.catalog_normalize_rim_pcd($6)
      )
      and ($7 is null or w.et_offset_mm = $7)
      and ($8 is null or coalesce(w.center_bore_mm, w.cb_mm) >= $8)
      and (
        nullif(btrim(coalesce($9, '''')), '''') is null
        or lower(btrim($9)) = ''all''
        or coalesce(w.color, '''') ilike btrim($9)
        or coalesce(w.finish, '''') ilike btrim($9)
      )
      and (
        nullif(btrim(coalesce($10, '''')), '''') is null
        or lower(btrim($10)) = ''all''
        or coalesce(w.material, '''') ilike btrim($10)
        or coalesce(w.finish, '''') ilike btrim($10)
      )
      and ($11 is null or w.bolts_included is not distinct from $11)
      and (coalesce($12, false) = false or w.in_stock = true)
    order by ' || v_order_sql || '
    limit least(greatest(coalesce($13, 24), 1), 100)
    offset greatest(coalesce($14, 0), 0)';

  return query execute v_sql
    using p_search, p_brands, p_diameter, p_width, p_widths, p_pcd, p_et_offset,
      p_center_bore_min, p_color, p_material, p_bolts_included, p_in_stock, p_limit, p_offset;
end;
$$;

revoke all on function public.catalog_list_rims_v1(text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean, text, integer, integer) from public;
grant execute on function public.catalog_list_rims_v1(text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean, text, integer, integer) to anon, authenticated, service_role;
