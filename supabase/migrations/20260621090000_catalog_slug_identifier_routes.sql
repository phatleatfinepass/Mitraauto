set lock_timeout = '5s';
set statement_timeout = '60s';

create or replace function public.catalog_slugify_public_path_segment(p_value text)
returns text
language sql
immutable
set search_path = public
as $function$
  select nullif(
    regexp_replace(
      regexp_replace(
        replace(
          replace(
            replace(
              replace(
                replace(
                  replace(lower(coalesce(p_value, '')), 'ä', 'a'),
                  'ö', 'o'
                ),
                'å', 'a'
              ),
              'ü', 'u'
            ),
            'é', 'e'
          ),
          '&', ' and '
        ),
        '[^a-z0-9]+',
        '-',
        'g'
      ),
      '(^-+|-+$)',
      '',
      'g'
    ),
    ''
  );
$function$;

create or replace function public.catalog_public_product_slug(
  p_product_type text,
  p_brand text,
  p_model text,
  p_size_string text,
  p_season text default null,
  p_width_in numeric default null,
  p_rim_diameter_in numeric default null,
  p_bolt_pattern text default null,
  p_et_offset_mm numeric default null,
  p_center_bore_mm numeric default null,
  p_color text default null
)
returns text
language sql
immutable
set search_path = public
as $function$
  select public.catalog_slugify_public_path_segment(
    case
      when lower(coalesce(p_product_type, '')) = 'rim' then concat_ws(
        ' ',
        nullif(btrim(coalesce(p_brand, '')), ''),
        nullif(btrim(coalesce(p_model, '')), ''),
        coalesce(
          nullif(btrim(coalesce(p_size_string, '')), ''),
          nullif(concat_ws(
            'x',
            nullif(p_width_in::text, ''),
            case when p_rim_diameter_in is not null then p_rim_diameter_in::text || 'in' end
          ), '')
        ),
        nullif(btrim(coalesce(p_bolt_pattern, '')), ''),
        case when p_et_offset_mm is not null then 'et-' || p_et_offset_mm::text end,
        case when p_center_bore_mm is not null then 'cb-' || p_center_bore_mm::text end,
        nullif(btrim(coalesce(p_color, '')), '')
      )
      else concat_ws(
        ' ',
        nullif(btrim(coalesce(p_brand, '')), ''),
        nullif(btrim(coalesce(p_model, '')), ''),
        nullif(btrim(coalesce(p_size_string, '')), ''),
        case
          when nullif(btrim(coalesce(p_season, '')), '') is not null
            and lower(btrim(coalesce(p_season, ''))) <> 'all_season'
            then btrim(p_season)
        end
      )
    end
  );
$function$;

create index if not exists webshop_tire_search_index_public_ready_seo_slug_idx
  on public.webshop_tire_search_index (seo_slug)
  where is_visible
    and publish_status = 'published'
    and product_ready
    and seo_slug is not null;

create index if not exists webshop_tire_search_index_public_ready_ean_idx
  on public.webshop_tire_search_index (ean)
  where is_visible
    and publish_status = 'published'
    and product_ready
    and ean is not null;

create index if not exists webshop_tire_search_index_public_ready_derived_ean_idx
  on public.webshop_tire_search_index (derived_ean)
  where is_visible
    and publish_status = 'published'
    and product_ready
    and derived_ean is not null;

create index if not exists webshop_tire_search_index_public_ready_supplier_code_idx
  on public.webshop_tire_search_index (supplier_code_best)
  where is_visible
    and publish_status = 'published'
    and product_ready
    and supplier_code_best is not null;

create index if not exists webshop_tire_search_index_public_ready_generated_slug_idx
  on public.webshop_tire_search_index (
    public.catalog_public_product_slug(
      product_type,
      coalesce(nullif(brand_display_name, ''), brand),
      model,
      size_string,
      season,
      width_in,
      rim_diameter_in,
      bolt_pattern,
      et_offset_mm,
      null::numeric,
      color
    )
  )
  where is_visible
    and publish_status = 'published'
    and product_ready;

create index if not exists webshop_items_rim_public_ready_supplier_code_idx
  on public.webshop_items (supplier_code_best)
  where product_type = 'rim'
    and is_visible = true
    and publish_status = 'published'
    and product_ready = true
    and supplier_code_best is not null;

create index if not exists webshop_items_rim_public_ready_generated_slug_idx
  on public.webshop_items (
    public.catalog_public_product_slug(
      product_type,
      coalesce(nullif(brand_display_name, ''), brand),
      model,
      size_string,
      season,
      width_in,
      rim_diameter_in,
      bolt_pattern,
      et_offset_mm,
      coalesce(center_bore_mm, cb_mm),
      color
    )
  )
  where product_type = 'rim'
    and is_visible = true
    and publish_status = 'published'
    and product_ready = true;

create or replace function public.catalog_get_tire_by_identifier_v1(p_identifier text)
returns table (
  variant_id uuid, product_type text, tire_segment text, brand text, brand_display_name text,
  brand_logo_url text, model text, size_string text, season text, studded boolean,
  runflat boolean, xl_reinforced boolean, load_index text, speed_rating text,
  speed_index text, ev_ready boolean, sound_absorber boolean, threepmsf boolean,
  winter_approved boolean, ice_approved boolean, width_mm numeric, aspect_ratio numeric,
  diameter_in numeric, width_in numeric, rim_diameter_in numeric, et_offset_mm numeric,
  bolt_pattern text, color text, finish text, price numeric, final_price_eur numeric,
  currency text, in_stock boolean, stock_qty integer, delivery_days_min integer,
  delivery_days_max integer, supplier_code_best text, best_image_url text,
  hero_image_url text, gallery jsonb, best_image_alt text, card_title text,
  subtitle text, short_description text, long_description text, tags jsonb,
  seo_slug text, ean text, derived_ean text, eu_label_json jsonb, eu_wet text,
  eu_noise numeric, manufacture_year integer
)
language sql
stable
security definer
set search_path = public
as $function$
  with input as (
    select
      nullif(btrim(coalesce(p_identifier, '')), '') as identifier,
      public.catalog_slugify_public_path_segment(p_identifier) as identifier_slug,
      case
        when nullif(btrim(coalesce(p_identifier, '')), '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then nullif(btrim(coalesce(p_identifier, '')), '')::uuid
        else null
      end as identifier_uuid
  ),
  candidate as (
    select picked.variant_id
    from (
      select i.variant_id, 0 as match_rank
      from input input_row
      join public.webshop_tire_search_index i
        on i.variant_id = input_row.identifier_uuid
      where input_row.identifier is not null
        and i.is_visible
        and i.publish_status = 'published'
        and i.product_ready

      union all

      select i.variant_id, 1 as match_rank
      from input input_row
      join public.webshop_tire_search_index i
        on public.catalog_slugify_public_path_segment(i.seo_slug) = input_row.identifier_slug
      where input_row.identifier_slug is not null
        and i.is_visible
        and i.publish_status = 'published'
        and i.product_ready

      union all

      select i.variant_id, 2 as match_rank
      from input input_row
      join public.webshop_tire_search_index i
        on public.catalog_public_product_slug(
          i.product_type,
          coalesce(nullif(i.brand_display_name, ''), i.brand),
          i.model,
          i.size_string,
          i.season,
          i.width_in,
          i.rim_diameter_in,
          i.bolt_pattern,
          i.et_offset_mm,
          null::numeric,
          i.color
        ) = input_row.identifier_slug
      where input_row.identifier_slug is not null
        and i.is_visible
        and i.publish_status = 'published'
        and i.product_ready

      union all

      select i.variant_id, 3 as match_rank
      from input input_row
      join public.webshop_tire_search_index i
        on i.ean = input_row.identifier
      where input_row.identifier is not null
        and i.is_visible
        and i.publish_status = 'published'
        and i.product_ready

      union all

      select i.variant_id, 4 as match_rank
      from input input_row
      join public.webshop_tire_search_index i
        on i.derived_ean = input_row.identifier
      where input_row.identifier is not null
        and i.is_visible
        and i.publish_status = 'published'
        and i.product_ready

      union all

      select i.variant_id, 5 as match_rank
      from input input_row
      join public.webshop_tire_search_index i
        on i.supplier_code_best = input_row.identifier
      where input_row.identifier is not null
        and i.is_visible
        and i.publish_status = 'published'
        and i.product_ready
    ) picked
    order by picked.match_rank, picked.variant_id
    limit 1
  )
  select
    i.variant_id, i.product_type, i.tire_segment, i.brand, i.brand_display_name,
    i.brand_logo_url, i.model, i.size_string, i.season, i.studded,
    i.runflat, i.xl_reinforced, i.load_index, i.speed_rating,
    i.speed_index, i.ev_ready, i.sound_absorber, i.threepmsf,
    i.winter_approved, i.ice_approved, i.width_mm, i.aspect_ratio,
    i.diameter_in, i.width_in, i.rim_diameter_in, i.et_offset_mm,
    i.bolt_pattern, i.color, i.finish, i.price, i.final_price_eur,
    i.currency, i.in_stock, i.stock_qty, i.delivery_days_min,
    i.delivery_days_max, i.supplier_code_best, i.best_image_url,
    i.hero_image_url, coalesce(i.gallery, '[]'::jsonb) as gallery, i.best_image_alt, i.card_title,
    i.subtitle, i.short_description, i.long_description, coalesce(i.tags, '[]'::jsonb) as tags,
    i.seo_slug, i.ean, i.derived_ean, i.eu_label_json, i.eu_wet,
    i.eu_noise, i.manufacture_year
  from candidate c
  join public.webshop_tire_search_index i on i.variant_id = c.variant_id;
$function$;

create or replace function public.catalog_get_rim_by_identifier_v1(p_identifier text)
returns setof public.catalog_rims_public_v1
language sql
stable
security definer
set search_path = public
as $function$
  with input as (
    select
      nullif(btrim(coalesce(p_identifier, '')), '') as identifier,
      public.catalog_slugify_public_path_segment(p_identifier) as identifier_slug,
      case
        when nullif(btrim(coalesce(p_identifier, '')), '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then nullif(btrim(coalesce(p_identifier, '')), '')::uuid
        else null
      end as identifier_uuid
  ),
  candidate as (
    select picked.variant_id
    from (
      select w.variant_id, 0 as match_rank
      from input input_row
      join public.webshop_items w
        on w.variant_id = input_row.identifier_uuid
      where input_row.identifier is not null
        and w.product_type = 'rim'
        and w.is_visible = true
        and w.publish_status = 'published'
        and w.product_ready = true

      union all

      select w.variant_id, 1 as match_rank
      from input input_row
      join public.webshop_items w
        on public.catalog_slugify_public_path_segment(w.seo_slug) = input_row.identifier_slug
      where input_row.identifier_slug is not null
        and w.product_type = 'rim'
        and w.is_visible = true
        and w.publish_status = 'published'
        and w.product_ready = true

      union all

      select w.variant_id, 2 as match_rank
      from input input_row
      join public.webshop_items w
        on public.catalog_public_product_slug(
          w.product_type,
          coalesce(nullif(w.brand_display_name, ''), w.brand),
          w.model,
          w.size_string,
          w.season,
          w.width_in,
          w.rim_diameter_in,
          w.bolt_pattern,
          w.et_offset_mm,
          coalesce(w.center_bore_mm, w.cb_mm),
          w.color
        ) = input_row.identifier_slug
      where input_row.identifier_slug is not null
        and w.product_type = 'rim'
        and w.is_visible = true
        and w.publish_status = 'published'
        and w.product_ready = true

      union all

      select w.variant_id, 3 as match_rank
      from input input_row
      join public.webshop_items w
        on w.ean = input_row.identifier
      where input_row.identifier is not null
        and w.product_type = 'rim'
        and w.is_visible = true
        and w.publish_status = 'published'
        and w.product_ready = true

      union all

      select w.variant_id, 4 as match_rank
      from input input_row
      join public.webshop_items w
        on w.derived_ean = input_row.identifier
      where input_row.identifier is not null
        and w.product_type = 'rim'
        and w.is_visible = true
        and w.publish_status = 'published'
        and w.product_ready = true

      union all

      select w.variant_id, 5 as match_rank
      from input input_row
      join public.webshop_items w
        on w.supplier_code_best = input_row.identifier
      where input_row.identifier is not null
        and w.product_type = 'rim'
        and w.is_visible = true
        and w.publish_status = 'published'
        and w.product_ready = true
    ) picked
    order by picked.match_rank, picked.variant_id
    limit 1
  )
  select
    w.variant_id,
    w.product_type,
    w.brand,
    coalesce(nullif(w.brand_display_name, ''), w.brand) as brand_display_name,
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
    coalesce(nullif(w.material, ''), nullif(w.finish, '')) as material,
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
    coalesce(nullif(w.best_image_url, ''), nullif(w.hero_image_url, '')) as best_image_url,
    coalesce(nullif(w.hero_image_url, ''), nullif(w.best_image_url, '')) as hero_image_url,
    case
      when jsonb_typeof(coalesce(w.gallery, '[]'::jsonb)) = 'array' then coalesce(w.gallery, '[]'::jsonb)
      when nullif(w.hero_image_url, '') is not null then jsonb_build_array(w.hero_image_url)
      when nullif(w.best_image_url, '') is not null then jsonb_build_array(w.best_image_url)
      else '[]'::jsonb
    end as gallery,
    w.best_image_alt,
    w.card_title,
    w.card_title as title,
    w.subtitle,
    w.short_description,
    w.long_description,
    catalog_build_rim_generated_tags(
      w.width_in,
      w.rim_diameter_in,
      w.bolt_pattern,
      w.et_offset_mm,
      coalesce(w.center_bore_mm, w.cb_mm),
      w.in_stock,
      coalesce(nullif(w.material, ''), nullif(w.finish, '')),
      w.bolts_included,
      w.winter_approved,
      w.wheel_load_kg,
      w.color,
      w.finish
    ) as generated_tags,
    catalog_merge_jsonb_text_tags(
      catalog_build_rim_generated_tags(
        w.width_in,
        w.rim_diameter_in,
        w.bolt_pattern,
        w.et_offset_mm,
        coalesce(w.center_bore_mm, w.cb_mm),
        w.in_stock,
        coalesce(nullif(w.material, ''), nullif(w.finish, '')),
        w.bolts_included,
        w.winter_approved,
        w.wheel_load_kg,
        w.color,
        w.finish
      ),
      coalesce(cms.badges, '[]'::jsonb)
    ) as tags,
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
    coalesce(w.spec_overrides, '{}'::jsonb) as spec_overrides
  from candidate c
  join public.webshop_items w on w.variant_id = c.variant_id
  left join public.product_cms cms on cms.variant_id = w.variant_id;
$function$;

revoke all on function public.catalog_slugify_public_path_segment(text) from public;
revoke all on function public.catalog_public_product_slug(text, text, text, text, text, numeric, numeric, text, numeric, numeric, text) from public;
revoke all on function public.catalog_get_tire_by_identifier_v1(text) from public;
revoke all on function public.catalog_get_rim_by_identifier_v1(text) from public;

grant execute on function public.catalog_slugify_public_path_segment(text) to anon, authenticated, service_role;
grant execute on function public.catalog_public_product_slug(text, text, text, text, text, numeric, numeric, text, numeric, numeric, text) to anon, authenticated, service_role;
grant execute on function public.catalog_get_tire_by_identifier_v1(text) to anon, authenticated, service_role;
grant execute on function public.catalog_get_rim_by_identifier_v1(text) to anon, authenticated, service_role;
