-- Phase 9: harden rim CMS audit filters against non-numeric CMS spec text.

set lock_timeout = '5s';
set statement_timeout = '60s';

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
  with normalized as (
    select
      nullif(btrim(p_row.cms_data->'spec_overrides'->'rim'->>'et_offset_mm'), '') as et_text,
      nullif(btrim(p_row.cms_data->'spec_overrides'->'rim'->>'center_bore_mm'), '') as cb_text
  ),
  casted as (
    select
      case when et_text ~ '^-?[0-9]+(\.[0-9]+)?$' then et_text::numeric else null end as et_override,
      case when cb_text ~ '^[0-9]+(\.[0-9]+)?$' then cb_text::numeric else null end as cb_override
    from normalized
  )
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
      or coalesce((select et_override from casted), p_row.et_offset_mm) is null
      or coalesce((select cb_override from casted), p_row.center_bore_mm, p_row.cb_mm) is null
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

revoke all on function public.cms_rim_admin_matches_filters(public.catalog_selected_rims_cms_admin_v1, text, boolean, boolean, boolean, boolean, text) from public;
grant execute on function public.cms_rim_admin_matches_filters(public.catalog_selected_rims_cms_admin_v1, text, boolean, boolean, boolean, boolean, text) to authenticated, service_role;
