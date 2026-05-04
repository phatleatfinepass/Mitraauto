set lock_timeout = '5s';
set statement_timeout = '60s';

alter table public.webshop_items
  add column if not exists sound_absorber boolean;

alter table public.catalog_selected_items
  add column if not exists sound_absorber boolean;

do $$
declare
  v_def text;
  v_next text;
begin
  select pg_get_functiondef('public.refresh_webshop_tire_items_batch_v1(uuid, integer)'::regprocedure)
  into v_def;

  if v_def is null then
    raise exception 'refresh_webshop_tire_items_batch_v1(uuid, integer) was not found';
  end if;

  if v_def not like '%sound_absorber%' then
    v_next := replace(
      v_def,
      'coalesce(nullif(spec_overrides->''features''->>''ev_ready'', '''')::boolean, ev_ready) as ev_ready,',
      'coalesce(nullif(spec_overrides->''features''->>''ev_ready'', '''')::boolean, ev_ready) as ev_ready,
    coalesce(
      nullif(spec_overrides->''tyre_label_section''->''badges''->>''sound_absorber'', '''')::boolean,
      nullif(spec_overrides->''features''->>''sound_absorber'', '''')::boolean,
      sound_absorber
    ) as sound_absorber,'
    );
    if v_next = v_def then
      raise exception 'Could not patch sound_absorber select expression in refresh_webshop_tire_items_batch_v1';
    end if;
    v_def := v_next;

    v_next := replace(
      v_def,
      'case when coalesce(nullif(spec_overrides->''features''->>''ev_ready'', '''')::boolean, ev_ready, false) then ''ev'' end,
      case when coalesce(nullif(spec_overrides->''features''->>''threepmsf'', '''')::boolean, threepmsf, false) then ''3pmsf'' end',
      'case when coalesce(nullif(spec_overrides->''features''->>''ev_ready'', '''')::boolean, ev_ready, false) then ''ev'' end,
      case when coalesce(
        nullif(spec_overrides->''tyre_label_section''->''badges''->>''sound_absorber'', '''')::boolean,
        nullif(spec_overrides->''features''->>''sound_absorber'', '''')::boolean,
        sound_absorber,
        false
      ) then ''sound_absorber'' end,
      case when coalesce(nullif(spec_overrides->''features''->>''threepmsf'', '''')::boolean, threepmsf, false) then ''3pmsf'' end'
    );
    if v_next = v_def then
      raise exception 'Could not patch sound_absorber tag expression in refresh_webshop_tire_items_batch_v1';
    end if;
    v_def := v_next;

    v_next := replace(
      v_def,
      'speed_rating, speed_index, ev_ready, threepmsf, winter_approved, ice_approved,',
      'speed_rating, speed_index, ev_ready, sound_absorber, threepmsf, winter_approved, ice_approved,'
    );
    if v_next = v_def then
      raise exception 'Could not patch sound_absorber insert/select column lists in refresh_webshop_tire_items_batch_v1';
    end if;
    v_def := v_next;

    v_next := replace(
      v_def,
      'ev_ready = excluded.ev_ready,
    threepmsf = excluded.threepmsf,',
      'ev_ready = excluded.ev_ready,
    sound_absorber = excluded.sound_absorber,
    threepmsf = excluded.threepmsf,'
    );
    if v_next = v_def then
      raise exception 'Could not patch sound_absorber conflict update in refresh_webshop_tire_items_batch_v1';
    end if;
    v_def := v_next;

    execute v_def;
  end if;
end $$;

with source_flags as (
  select
    c.id as variant_id,
    coalesce(
      nullif(pc.spec_overrides->'tyre_label_section'->'badges'->>'sound_absorber', '')::boolean,
      nullif(pc.spec_overrides->'features'->>'sound_absorber', '')::boolean,
      c.sound_absorber,
      false
    ) as sound_absorber
  from public.catalog_selected_items c
  left join public.product_cms pc on pc.variant_id = c.id
  where c.product_type = 'tire'
)
update public.webshop_items w
set
  sound_absorber = source_flags.sound_absorber,
  tags = case
    when source_flags.sound_absorber then (
      select to_jsonb(array_agg(distinct tag order by tag))
      from (
        select value as tag
        from jsonb_array_elements_text(coalesce(w.tags, '[]'::jsonb))
        union all
        select 'sound_absorber'
      ) tags
    )
    else coalesce(w.tags, '[]'::jsonb) - 'sound_absorber'
  end,
  updated_at = now()
from source_flags
where w.variant_id = source_flags.variant_id
  and w.product_type = 'tire'
  and (
    w.sound_absorber is distinct from source_flags.sound_absorber
    or (
      source_flags.sound_absorber
      and not coalesce(w.tags, '[]'::jsonb) ? 'sound_absorber'
    )
    or (
      not source_flags.sound_absorber
      and coalesce(w.tags, '[]'::jsonb) ? 'sound_absorber'
    )
  );
