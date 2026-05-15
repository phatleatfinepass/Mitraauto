create or replace function public.refresh_webshop_rim_search_index_v1()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  perform set_config('statement_timeout', '180000ms', true);

  delete from public.webshop_rim_search_index;

  insert into public.webshop_rim_search_index (
    variant_id, product_type, brand, brand_display_name, brand_logo_url, model,
    size_string, season, studded, runflat, xl_reinforced, load_index,
    speed_rating, speed_index, ev_ready, sound_absorber, threepmsf,
    winter_approved, ice_approved, width_mm, aspect_ratio, diameter_in,
    width_in, rim_diameter_in, et_offset_mm, bolt_pattern, pcd_normalized,
    center_bore_mm, cb_mm, color, finish, material, bolts_included,
    wheel_load_kg, price, final_price_eur, currency, in_stock, stock_qty,
    delivery_days_min, delivery_days_max, supplier_code_best,
    supplier_external_id_best, best_image_url, hero_image_url, gallery,
    best_image_alt, card_title, title, subtitle, short_description,
    long_description, generated_tags, tags, seo_slug, seo_title,
    seo_description, eu_label_json, eu_fuel, eu_wet, eu_noise, ean,
    derived_ean, manufacture_year, pricing_rules, spec_overrides, is_visible,
    publish_status, publish_block_reason, product_ready, readiness_reasons,
    primary_readiness_reason, search_text, brand_sort, model_sort, price_sort,
    image_ready, stock_ready, seo_ready, source_updated_at, indexed_at
  )
  select
    w.variant_id,
    w.product_type,
    w.brand,
    coalesce(nullif(w.brand_display_name, ''), w.brand),
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
    public.catalog_normalize_rim_pcd(w.bolt_pattern),
    coalesce(w.center_bore_mm, w.cb_mm),
    coalesce(w.cb_mm, w.center_bore_mm),
    w.color,
    w.finish,
    coalesce(nullif(w.material, ''), nullif(w.finish, '')),
    w.bolts_included,
    w.wheel_load_kg,
    w.price,
    coalesce(w.final_price_eur, w.price),
    w.currency,
    coalesce(w.in_stock, false),
    w.stock_qty,
    w.delivery_days_min,
    w.delivery_days_max,
    w.supplier_code_best,
    w.supplier_external_id_best,
    coalesce(nullif(w.best_image_url, ''), nullif(w.hero_image_url, '')),
    coalesce(nullif(w.hero_image_url, ''), nullif(w.best_image_url, '')),
    case
      when jsonb_typeof(coalesce(w.gallery, '[]'::jsonb)) = 'array' then coalesce(w.gallery, '[]'::jsonb)
      when nullif(w.hero_image_url, '') is not null then jsonb_build_array(w.hero_image_url)
      when nullif(w.best_image_url, '') is not null then jsonb_build_array(w.best_image_url)
      else '[]'::jsonb
    end,
    w.best_image_alt,
    w.card_title,
    w.card_title,
    w.subtitle,
    w.short_description,
    w.long_description,
    gt.generated_tags,
    public.catalog_merge_jsonb_text_tags(gt.generated_tags, coalesce(w.tags, '[]'::jsonb)),
    w.seo_slug,
    w.seo_title,
    w.seo_description,
    w.eu_label_json,
    null::text,
    w.eu_wet,
    w.eu_noise,
    w.ean,
    w.derived_ean,
    w.manufacture_year,
    w.pricing_rules,
    coalesce(w.spec_overrides, '{}'::jsonb),
    coalesce(w.is_visible, false),
    w.publish_status,
    w.publish_block_reason,
    coalesce(w.product_ready, false),
    coalesce(w.readiness_reasons, '{}'::text[]),
    w.primary_readiness_reason,
    lower(concat_ws(' ', w.brand, w.brand_display_name, w.model, w.size_string, w.card_title, w.color, w.finish, w.material, w.ean, w.derived_ean, w.bolt_pattern, public.catalog_normalize_rim_pcd(w.bolt_pattern), coalesce(w.tags, '[]'::jsonb)::text)),
    lower(coalesce(nullif(w.brand_display_name, ''), w.brand, '')),
    lower(coalesce(w.model, '')),
    coalesce(w.final_price_eur, w.price),
    nullif(coalesce(w.best_image_url, w.hero_image_url, ''), '') is not null,
    coalesce(w.in_stock, false) and coalesce(w.stock_qty, 0) > 0,
    nullif(coalesce(w.seo_slug, w.seo_title, w.seo_description, ''), '') is not null,
    w.updated_at,
    now()
  from public.webshop_items w
  cross join lateral (
    select public.catalog_build_rim_generated_tags(
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
    ) as generated_tags
  ) gt
  where w.product_type = 'rim'
    and w.publish_status = 'published';

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

comment on function public.refresh_webshop_rim_search_index_v1() is
  'Set-based full rebuild for the published rim storefront search index. Used after batched rim webshop publish skips per-row trigger refresh.';

revoke all on function public.refresh_webshop_rim_search_index_v1() from public;
grant execute on function public.refresh_webshop_rim_search_index_v1() to authenticated, service_role;
