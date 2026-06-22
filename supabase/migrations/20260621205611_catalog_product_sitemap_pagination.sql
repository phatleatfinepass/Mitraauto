set lock_timeout = '5s';
set statement_timeout = '60s';

drop function if exists public.catalog_list_product_sitemap_rows_v1();

create or replace function public.catalog_list_product_sitemap_rows_v1(
  p_limit integer default 1000,
  p_offset integer default 0
)
returns table (
  variant_id uuid,
  product_type text,
  seo_slug_fi text,
  seo_slug_en text,
  generated_slug text,
  in_stock boolean,
  final_price_eur numeric
)
language sql
stable
security definer
set search_path = public
as $function$
  with sitemap_rows as (
    select
      i.variant_id,
      i.product_type,
      coalesce(nullif(btrim(cms.seo_slug), ''), nullif(btrim(i.seo_slug), '')) as seo_slug_fi,
      nullif(btrim(coalesce(cms.spec_overrides->'i18n'->'en'->>'seo_slug', '')), '') as seo_slug_en,
      public.catalog_public_product_slug(
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
      ) as generated_slug,
      coalesce(i.in_stock, false) as in_stock,
      coalesce(i.final_price_eur, i.price) as final_price_eur
    from public.webshop_tire_search_index i
    left join public.product_cms cms
      on cms.variant_id = i.variant_id
      and coalesce(cms.is_hidden, false) = false
    where i.is_visible
      and i.publish_status = 'published'
      and i.product_ready
      and coalesce(i.final_price_eur, i.price) > 0

    union all

    select
      w.variant_id,
      w.product_type,
      coalesce(nullif(btrim(cms.seo_slug), ''), nullif(btrim(w.seo_slug), '')) as seo_slug_fi,
      nullif(btrim(coalesce(cms.spec_overrides->'i18n'->'en'->>'seo_slug', '')), '') as seo_slug_en,
      public.catalog_public_product_slug(
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
      ) as generated_slug,
      coalesce(w.in_stock, false) as in_stock,
      coalesce(w.final_price_eur, w.price) as final_price_eur
    from public.webshop_items w
    left join public.product_cms cms
      on cms.variant_id = w.variant_id
      and coalesce(cms.is_hidden, false) = false
    where w.product_type = 'rim'
      and w.is_visible = true
      and w.publish_status = 'published'
      and w.product_ready = true
      and coalesce(w.final_price_eur, w.price) > 0
  )
  select *
  from sitemap_rows
  order by product_type asc, variant_id asc
  limit greatest(1, least(coalesce(p_limit, 1000), 5000))
  offset greatest(0, coalesce(p_offset, 0));
$function$;

revoke all on function public.catalog_list_product_sitemap_rows_v1(integer, integer) from public;
grant execute on function public.catalog_list_product_sitemap_rows_v1(integer, integer) to anon, authenticated, service_role;
