create or replace function public.cms_tire_admin_matches_audit_filters(
  p_row public.cms_tires_admin_mv,
  p_missing_metadata_fields text[] default null,
  p_missing_image_only boolean default false,
  p_missing_seo_fields text[] default null
)
returns boolean
language sql
stable
set search_path = public
as $$
  with effective_cms as (
    select coalesce(
      (
        select jsonb_build_object(
          'title', pc.title,
          'subtitle', pc.subtitle,
          'short_description', pc.short_description,
          'long_description', pc.long_description,
          'hero_image_url', pc.hero_image_url,
          'gallery', pc.gallery,
          'seo_slug', pc.seo_slug,
          'seo_title', pc.seo_title,
          'seo_description', pc.seo_description,
          'is_hidden', pc.is_hidden,
          'spec_overrides', pc.spec_overrides,
          'price_override_eur', pc.price_override_eur,
          'promo_enabled', pc.promo_enabled,
          'promo_price_eur', pc.promo_price_eur,
          'promo_start', pc.promo_start,
          'promo_end', pc.promo_end
        )
        from public.product_cms pc
        where pc.variant_id = p_row.variant_id
        limit 1
      ),
      p_row.cms_data,
      '{}'::jsonb
    ) as cms_data
  )
  select
    (
      coalesce(array_length(p_missing_metadata_fields, 1), 0) = 0
      or exists (
        select 1
        from effective_cms ec
        cross join unnest(p_missing_metadata_fields) as selected_field(field_name)
        where case selected_field.field_name
          when 'brand' then nullif(
            btrim(
              coalesce(
                ec.cms_data->'spec_overrides'->'tyre_label_section'->'identity'->>'supplier_trademark',
                ec.cms_data->'spec_overrides'->'tyre_label_section'->'identity'->>'supplier_name',
                ec.cms_data->'spec_overrides'->'identity'->>'brand',
                p_row.brand
              )
            ),
            ''
          ) is null
          when 'model' then nullif(
            btrim(
              coalesce(
                ec.cms_data->'spec_overrides'->'tyre_label_section'->'identity'->>'commercial_name',
                ec.cms_data->'spec_overrides'->'tyre_label_section'->'identity'->>'model',
                ec.cms_data->'spec_overrides'->'identity'->>'model',
                p_row.model
              )
            ),
            ''
          ) is null
          when 'ean' then
            coalesce(
              nullif(regexp_replace(coalesce(
                ec.cms_data->'spec_overrides'->'tyre_label_section'->'identity'->>'ean',
                ec.cms_data->'spec_overrides'->'identity'->>'ean',
                ''
              ), '\D', '', 'g'), ''),
              nullif(btrim(coalesce(p_row.derived_ean, p_row.ean)), '')
            ) is null
            or coalesce(
              nullif(regexp_replace(coalesce(
                ec.cms_data->'spec_overrides'->'tyre_label_section'->'identity'->>'ean',
                ec.cms_data->'spec_overrides'->'identity'->>'ean',
                ''
              ), '\D', '', 'g'), ''),
              nullif(btrim(coalesce(p_row.derived_ean, p_row.ean)), '')
            ) like 'EANMISSING_%'
          when 'size' then nullif(
            btrim(
              coalesce(
                ec.cms_data->'spec_overrides'->'tyre_label_section'->'identity'->>'size_designation',
                ec.cms_data->'spec_overrides'->'identity'->>'size_string',
                p_row.size_string
              )
            ),
            ''
          ) is null
          when 'season' then nullif(
            btrim(
              coalesce(
                ec.cms_data->'spec_overrides'->'tyre_label_section'->'identity'->>'season',
                ec.cms_data->'spec_overrides'->'identity'->>'season',
                p_row.season
              )
            ),
            ''
          ) is null
          when 'ev_ready' then coalesce(
            (ec.cms_data->'spec_overrides'->'tyre_label_section'->'badges'->>'ev_ready')::boolean,
            (ec.cms_data->'spec_overrides'->'features'->>'ev_ready')::boolean,
            p_row.ev_ready,
            false
          ) = false
          when 'runflat' then coalesce(
            (ec.cms_data->'spec_overrides'->'tyre_label_section'->'badges'->>'runflat')::boolean,
            (ec.cms_data->'spec_overrides'->'features'->>'runflat')::boolean,
            p_row.runflat,
            false
          ) = false
          when 'xl' then coalesce(
            (ec.cms_data->'spec_overrides'->'tyre_label_section'->'badges'->>'extra_load')::boolean,
            (ec.cms_data->'spec_overrides'->'features'->>'xl')::boolean,
            p_row.xl_reinforced,
            false
          ) = false
          when 'studded' then coalesce(
            (ec.cms_data->'spec_overrides'->'tyre_label_section'->'badges'->>'studded')::boolean,
            (ec.cms_data->'spec_overrides'->'features'->>'studded')::boolean,
            p_row.studded,
            false
          ) = false
          when 'threepmsf' then coalesce(
            (ec.cms_data->'spec_overrides'->'tyre_label_section'->'badges'->>'threepmsf')::boolean,
            (ec.cms_data->'spec_overrides'->'tyre_label_section'->'eu_label'->>'severe_snow')::boolean,
            (ec.cms_data->'spec_overrides'->'features'->>'threepmsf')::boolean,
            p_row.threepmsf,
            false
          ) = false
          when 'winter_approved' then coalesce(
            (ec.cms_data->'spec_overrides'->'tyre_label_section'->'badges'->>'winter_approved')::boolean,
            (ec.cms_data->'spec_overrides'->'features'->>'winter_approved')::boolean,
            p_row.winter_approved,
            false
          ) = false
          when 'ice_approved' then coalesce(
            (ec.cms_data->'spec_overrides'->'tyre_label_section'->'eu_label'->>'severe_ice')::boolean,
            (ec.cms_data->'spec_overrides'->'features'->>'ice_approved')::boolean,
            p_row.ice_approved,
            false
          ) = false
          when 'eu_fuel_class' then nullif(
            btrim(
              coalesce(
                ec.cms_data->'spec_overrides'->'tyre_label_section'->'eu_label'->>'fuel_efficiency_class',
                ec.cms_data->'spec_overrides'->'eu'->>'fuel_class',
                upper(coalesce(
                  p_row.eu_label_json->>'fuel',
                  p_row.eu_label_json->>'fuel_class',
                  p_row.eu_label_json->>'fuelclass',
                  p_row.eu_label_json->>'fuelefficiency',
                  p_row.eu_label_json->>'fuel_efficiency',
                  p_row.eu_label_json->>'rrc',
                  p_row.eu_label_json->>'rolling_resistance',
                  p_row.eu_label_json->>'energy'
                ))
              )
            ),
            ''
          ) is null
          when 'eu_wet_grip_class' then nullif(
            btrim(
              coalesce(
                ec.cms_data->'spec_overrides'->'tyre_label_section'->'eu_label'->>'wet_grip_class',
                ec.cms_data->'spec_overrides'->'eu'->>'wet_grip_class',
                p_row.eu_wet
              )
            ),
            ''
          ) is null
          when 'eu_noise_db' then coalesce(
            nullif(ec.cms_data->'spec_overrides'->'tyre_label_section'->'eu_label'->>'external_noise_db', '')::numeric,
            (ec.cms_data->'spec_overrides'->'eu'->>'noise_db')::numeric,
            p_row.eu_noise
          ) is null
          when 'eu_noise_class' then nullif(
            btrim(
              coalesce(
                ec.cms_data->'spec_overrides'->'tyre_label_section'->'eu_label'->>'external_noise_class',
                ec.cms_data->'spec_overrides'->'eu'->>'noise_class',
                p_row.eu_label_json->>'noise_class',
                p_row.eu_label_json->>'noiseClass',
                p_row.eu_label_json->>'external_noise_class',
                p_row.eu_label_json->>'externalNoiseClass'
              )
            ),
            ''
          ) is null
          else false
        end
      )
    )
    and (
      not p_missing_image_only
      or exists (
        select 1
        from effective_cms ec
        where
          nullif(btrim(coalesce(ec.cms_data->>'hero_image_url', '')), '') is null
          and case
            when jsonb_typeof(coalesce(ec.cms_data->'gallery', '[]'::jsonb)) = 'array'
              then jsonb_array_length(coalesce(ec.cms_data->'gallery', '[]'::jsonb)) = 0
            else true
          end
      )
    )
    and (
      coalesce(array_length(p_missing_seo_fields, 1), 0) = 0
      or exists (
        select 1
        from effective_cms ec
        cross join unnest(p_missing_seo_fields) as selected_field(field_name)
        where case selected_field.field_name
          when 'title' then nullif(btrim(coalesce(ec.cms_data->>'title', '')), '') is null
          when 'subtitle' then nullif(btrim(coalesce(ec.cms_data->>'subtitle', '')), '') is null
          when 'short_description' then nullif(btrim(coalesce(ec.cms_data->>'short_description', '')), '') is null
          when 'long_description' then nullif(btrim(coalesce(ec.cms_data->>'long_description', '')), '') is null
          when 'seo_slug' then nullif(btrim(coalesce(ec.cms_data->>'seo_slug', '')), '') is null
          when 'seo_title' then nullif(btrim(coalesce(ec.cms_data->>'seo_title', '')), '') is null
          when 'seo_description' then nullif(btrim(coalesce(ec.cms_data->>'seo_description', '')), '') is null
          else false
        end
      )
    );
$$;
