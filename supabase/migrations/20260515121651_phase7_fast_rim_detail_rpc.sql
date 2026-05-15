create index if not exists webshop_items_rim_public_ready_seo_slug_idx
  on public.webshop_items (seo_slug)
  where product_type = 'rim'
    and is_visible = true
    and publish_status = 'published'
    and product_ready = true
    and seo_slug is not null;

create index if not exists webshop_items_rim_public_ready_ean_idx
  on public.webshop_items (ean)
  where product_type = 'rim'
    and is_visible = true
    and publish_status = 'published'
    and product_ready = true
    and ean is not null;

create index if not exists webshop_items_rim_public_ready_derived_ean_idx
  on public.webshop_items (derived_ean)
  where product_type = 'rim'
    and is_visible = true
    and publish_status = 'published'
    and product_ready = true
    and derived_ean is not null;

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
      from input i
      join public.webshop_items w
        on w.variant_id = i.identifier_uuid
      where i.identifier is not null
        and w.product_type = 'rim'
        and w.is_visible = true
        and w.publish_status = 'published'
        and w.product_ready = true

      union all

      select w.variant_id, 1 as match_rank
      from input i
      join public.webshop_items w
        on w.seo_slug = i.identifier
      where i.identifier is not null
        and w.product_type = 'rim'
        and w.is_visible = true
        and w.publish_status = 'published'
        and w.product_ready = true

      union all

      select w.variant_id, 2 as match_rank
      from input i
      join public.webshop_items w
        on w.ean = i.identifier
      where i.identifier is not null
        and w.product_type = 'rim'
        and w.is_visible = true
        and w.publish_status = 'published'
        and w.product_ready = true

      union all

      select w.variant_id, 3 as match_rank
      from input i
      join public.webshop_items w
        on w.derived_ean = i.identifier
      where i.identifier is not null
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

grant execute on function public.catalog_get_rim_by_identifier_v1(text) to anon, authenticated, service_role;
