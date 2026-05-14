-- Phase 9: authenticated rim CMS admin listing over the selected winner layer.

set lock_timeout = '5s';
set statement_timeout = '60s';

drop function if exists public.cms_count_rims_admin_v1(text, text, boolean, boolean, boolean, boolean, text);
drop function if exists public.cms_list_rims_admin_v1(text, text, boolean, boolean, boolean, boolean, text, integer, integer);

create or replace function public.cms_rim_admin_matches_filters(
  p_row public.catalog_selected_rims_cms_admin_v1,
  p_supplier_code text default null,
  p_missing_price_only boolean default false,
  p_missing_image_only boolean default false,
  p_missing_seo_only boolean default false,
  p_missing_specs_only boolean default false,
  p_status text default 'all'
)
returns boolean
language sql
stable
set search_path = public
as $$
  select
    (
      nullif(btrim(coalesce(p_supplier_code, '')), '') is null
      or upper(coalesce(p_row.supplier_code_best, '')) = upper(nullif(btrim(p_supplier_code), ''))
    )
    and (
      not coalesce(p_missing_price_only, false)
      or coalesce(p_row.missing_supplier_price, false)
      or p_row.final_price_eur is null
    )
    and (
      not coalesce(p_missing_image_only, false)
      or (
        coalesce(p_row.missing_supplier_image, false)
        and nullif(p_row.cms_data->>'hero_image_url', '') is null
        and jsonb_array_length(
          case
            when jsonb_typeof(coalesce(p_row.cms_data->'gallery', '[]'::jsonb)) = 'array'
              then coalesce(p_row.cms_data->'gallery', '[]'::jsonb)
            else '[]'::jsonb
          end
        ) = 0
      )
    )
    and (
      not coalesce(p_missing_seo_only, false)
      or nullif(p_row.cms_data->>'seo_slug', '') is null
      or nullif(p_row.cms_data->>'seo_title', '') is null
      or nullif(p_row.cms_data->>'seo_description', '') is null
    )
    and (
      not coalesce(p_missing_specs_only, false)
      or nullif(coalesce(p_row.cms_data->'spec_overrides'->'identity'->>'brand', p_row.brand), '') is null
      or nullif(coalesce(p_row.cms_data->'spec_overrides'->'identity'->>'model', p_row.model), '') is null
      or p_row.width_in is null
      or p_row.rim_diameter_in is null
      or nullif(coalesce(p_row.cms_data->'spec_overrides'->'rim'->>'bolt_pattern', p_row.bolt_pattern), '') is null
      or coalesce(nullif(p_row.cms_data->'spec_overrides'->'rim'->>'et_offset_mm', '')::numeric, p_row.et_offset_mm) is null
      or coalesce(nullif(p_row.cms_data->'spec_overrides'->'rim'->>'center_bore_mm', '')::numeric, p_row.center_bore_mm, p_row.cb_mm) is null
    )
    and (
      coalesce(nullif(btrim(p_status), ''), 'all') = 'all'
      or (
        p_status = 'hidden'
        and coalesce(nullif(p_row.cms_data->>'is_hidden', '')::boolean, false)
      )
      or (
        p_status = 'visible'
        and not coalesce(nullif(p_row.cms_data->>'is_hidden', '')::boolean, false)
      )
      or (
        p_status = 'missing_price'
        and (coalesce(p_row.missing_supplier_price, false) or p_row.final_price_eur is null)
      )
      or (
        p_status = 'missing_image'
        and coalesce(p_row.missing_supplier_image, false)
      )
      or (
        p_status = 'manual_not_sellable'
        and public.catalog_is_rim_manual_not_sellable(coalesce(p_row.cms_data->'spec_overrides', '{}'::jsonb))
      )
    );
$$;

create or replace function public.cms_rim_admin_matches_search(
  p_row public.catalog_selected_rims_cms_admin_v1,
  p_search text default null
)
returns boolean
language sql
stable
set search_path = public
as $$
  select
    nullif(btrim(coalesce(p_search, '')), '') is null
    or concat_ws(
      ' ',
      p_row.brand,
      p_row.model,
      p_row.size_string,
      p_row.derived_ean,
      p_row.ean,
      p_row.supplier_code_best,
      p_row.supplier_external_id_best,
      p_row.bolt_pattern,
      p_row.color,
      p_row.finish,
      p_row.material
    ) ilike '%' || btrim(p_search) || '%';
$$;

create or replace function public.cms_count_rims_admin_v1(
  p_search text default null,
  p_supplier_code text default null,
  p_missing_price_only boolean default false,
  p_missing_image_only boolean default false,
  p_missing_seo_only boolean default false,
  p_missing_specs_only boolean default false,
  p_status text default 'all'
)
returns bigint
language sql
security definer
set search_path = public
stable
as $$
  select case
    when not public.cms_has_permission('catalog_rims', 'read') then 0::bigint
    else (
      select count(*)::bigint
      from public.catalog_selected_rims_cms_admin_v1 mv
      where public.cms_rim_admin_matches_search(mv, p_search)
        and public.cms_rim_admin_matches_filters(
          mv,
          p_supplier_code,
          p_missing_price_only,
          p_missing_image_only,
          p_missing_seo_only,
          p_missing_specs_only,
          p_status
        )
    )
  end;
$$;

create or replace function public.cms_list_rims_admin_v1(
  p_search text default null,
  p_supplier_code text default null,
  p_missing_price_only boolean default false,
  p_missing_image_only boolean default false,
  p_missing_seo_only boolean default false,
  p_missing_specs_only boolean default false,
  p_status text default 'all',
  p_limit integer default 100,
  p_offset integer default 0
)
returns setof public.catalog_selected_rims_cms_admin_v1
language sql
security definer
set search_path = public
stable
as $$
  select mv.*
  from public.catalog_selected_rims_cms_admin_v1 mv
  where public.cms_has_permission('catalog_rims', 'read')
    and public.cms_rim_admin_matches_search(mv, p_search)
    and public.cms_rim_admin_matches_filters(
      mv,
      p_supplier_code,
      p_missing_price_only,
      p_missing_image_only,
      p_missing_seo_only,
      p_missing_specs_only,
      p_status
    )
  order by lower(coalesce(mv.brand, '')), lower(coalesce(mv.model, '')), mv.variant_id
  limit greatest(1, least(coalesce(p_limit, 100), 250))
  offset greatest(0, coalesce(p_offset, 0));
$$;

revoke all on function public.cms_rim_admin_matches_filters(public.catalog_selected_rims_cms_admin_v1, text, boolean, boolean, boolean, boolean, text) from public;
grant execute on function public.cms_rim_admin_matches_filters(public.catalog_selected_rims_cms_admin_v1, text, boolean, boolean, boolean, boolean, text) to authenticated, service_role;

revoke all on function public.cms_rim_admin_matches_search(public.catalog_selected_rims_cms_admin_v1, text) from public;
grant execute on function public.cms_rim_admin_matches_search(public.catalog_selected_rims_cms_admin_v1, text) to authenticated, service_role;

revoke all on function public.cms_count_rims_admin_v1(text, text, boolean, boolean, boolean, boolean, text) from public;
grant execute on function public.cms_count_rims_admin_v1(text, text, boolean, boolean, boolean, boolean, text) to authenticated;

revoke all on function public.cms_list_rims_admin_v1(text, text, boolean, boolean, boolean, boolean, text, integer, integer) from public;
grant execute on function public.cms_list_rims_admin_v1(text, text, boolean, boolean, boolean, boolean, text, integer, integer) to authenticated;
