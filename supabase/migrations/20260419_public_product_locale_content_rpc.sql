drop function if exists public.catalog_get_product_locale_content_v1(text);
drop function if exists public.catalog_get_product_locale_content_v1(uuid);

create or replace function public.catalog_get_product_locale_content_v1(
  p_variant_id uuid
)
returns table (
  title_fi text,
  subtitle_fi text,
  short_description_fi text,
  long_description_fi text,
  seo_slug_fi text,
  seo_title_fi text,
  seo_description_fi text,
  title_en text,
  subtitle_en text,
  short_description_en text,
  long_description_en text,
  seo_slug_en text,
  seo_title_en text,
  seo_description_en text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    pc.title as title_fi,
    pc.subtitle as subtitle_fi,
    pc.short_description as short_description_fi,
    pc.long_description as long_description_fi,
    pc.seo_slug as seo_slug_fi,
    pc.seo_title as seo_title_fi,
    pc.seo_description as seo_description_fi,
    nullif(btrim(coalesce(pc.spec_overrides->'i18n'->'en'->>'title', '')), '') as title_en,
    nullif(btrim(coalesce(pc.spec_overrides->'i18n'->'en'->>'subtitle', '')), '') as subtitle_en,
    nullif(btrim(coalesce(pc.spec_overrides->'i18n'->'en'->>'short_description', '')), '') as short_description_en,
    nullif(btrim(coalesce(pc.spec_overrides->'i18n'->'en'->>'long_description', '')), '') as long_description_en,
    nullif(btrim(coalesce(pc.spec_overrides->'i18n'->'en'->>'seo_slug', '')), '') as seo_slug_en,
    nullif(btrim(coalesce(pc.spec_overrides->'i18n'->'en'->>'seo_title', '')), '') as seo_title_en,
    nullif(btrim(coalesce(pc.spec_overrides->'i18n'->'en'->>'seo_description', '')), '') as seo_description_en
  from public.product_cms pc
  where pc.variant_id = p_variant_id
  limit 1;
$$;

grant execute on function public.catalog_get_product_locale_content_v1(uuid) to anon, authenticated;
