create or replace function public.catalog_selected_tire_cms_matches_search(
  p_row public.catalog_selected_tires_cms_admin_v1,
  p_search text default null
)
returns boolean
language sql
stable
set search_path = public
as $$
  with normalized as (
    select
      lower(btrim(coalesce(p_search, ''))) as raw_search,
      lower(concat_ws(
        ' ',
        p_row.brand,
        p_row.model,
        p_row.size_string,
        p_row.derived_ean,
        p_row.ean,
        p_row.cms_data->>'title',
        p_row.cms_data->>'subtitle'
      )) as searchable_text,
      regexp_replace(
        lower(concat_ws(
          '',
          p_row.brand,
          p_row.model,
          p_row.size_string,
          p_row.derived_ean,
          p_row.ean,
          p_row.cms_data->>'title',
          p_row.cms_data->>'subtitle'
        )),
        '[^a-z0-9]',
        '',
        'g'
      ) as searchable_compact
  ),
  tokens as (
    select
      lower(btrim(token)) as token,
      regexp_replace(lower(btrim(token)), '[^a-z0-9]', '', 'g') as compact_token
    from normalized n,
      regexp_split_to_table(n.raw_search, '\s+') as token
    where btrim(token) <> ''
  )
  select
    (select raw_search = '' from normalized)
    or not exists (
      select 1
      from tokens t
      cross join normalized n
      where not (
        n.searchable_text like '%' || t.token || '%'
        or (
          t.compact_token <> ''
          and n.searchable_compact like '%' || t.compact_token || '%'
        )
      )
    );
$$;

create or replace function public.cms_count_tires_admin_v1(
  p_search text default null,
  p_missing_ean_only boolean default false,
  p_exclude_non_passenger boolean default true,
  p_supplier_code text default null,
  p_missing_metadata_fields text[] default null,
  p_missing_image_only boolean default false,
  p_has_eprel_only boolean default false,
  p_missing_seo_fields text[] default null
)
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*)
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
    and public.catalog_selected_tire_cms_matches_filters(mv, p_missing_metadata_fields, p_missing_image_only, p_missing_seo_fields);
$$;

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
  cms_data jsonb
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
    mv.cms_data
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

revoke all on function public.catalog_selected_tire_cms_matches_search(public.catalog_selected_tires_cms_admin_v1, text) from public;
grant execute on function public.catalog_selected_tire_cms_matches_search(public.catalog_selected_tires_cms_admin_v1, text) to authenticated, service_role;

revoke all on function public.cms_count_tires_admin_v1(text, boolean, boolean, text, text[], boolean, boolean, text[]) from public;
grant execute on function public.cms_count_tires_admin_v1(text, boolean, boolean, text, text[], boolean, boolean, text[]) to authenticated;

revoke all on function public.cms_list_tires_admin_v1(text, boolean, boolean, text, text[], boolean, boolean, text[], integer, integer) from public;
grant execute on function public.cms_list_tires_admin_v1(text, boolean, boolean, text, text[], boolean, boolean, text[], integer, integer) to authenticated;
