-- Normalize all-season tires that supplier feeds classify as summer.
-- RD commonly carries models such as Vector 4Seasons and AllSeasonContact
-- under summer groups; model/title should win for these explicit names.

create or replace function public.catalog_tire_text_implies_all_season(
  p_model text,
  p_title text default null,
  p_card_title text default null
)
returns boolean
language sql
immutable
as $$
  select lower(concat_ws(' ', p_model, p_title, p_card_title)) ~
    '(^|[^a-z0-9])(all[[:space:]_-]*season|allseason|4[[:space:]_-]*season|4seasons|multi[[:space:]_-]*season|multiseason)([^a-z0-9]|$)';
$$;

create or replace function public.catalog_normalize_tire_season(
  p_current_season text,
  p_model text,
  p_title text default null,
  p_card_title text default null
)
returns text
language sql
immutable
as $$
  select case
    when public.catalog_tire_text_implies_all_season(p_model, p_title, p_card_title) then 'all_season'
    when lower(nullif(btrim(coalesce(p_current_season, '')), '')) in ('all season', 'all-season', 'allseason') then 'all_season'
    when lower(nullif(btrim(coalesce(p_current_season, '')), '')) in ('summer', 'winter', 'all_season') then lower(btrim(p_current_season))
    else nullif(btrim(p_current_season), '')
  end;
$$;

create or replace function public.catalog_selected_items_normalize_tire_season()
returns trigger
language plpgsql
as $$
begin
  if new.product_type = 'tire' then
    new.season := public.catalog_normalize_tire_season(new.season, new.model, new.supplier_title, null);
    if new.season = 'all_season' then
      new.winter_approved := true;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_catalog_selected_items_normalize_tire_season on public.catalog_selected_items;
create trigger trg_catalog_selected_items_normalize_tire_season
before insert or update of product_type, season, model, supplier_title on public.catalog_selected_items
for each row
execute function public.catalog_selected_items_normalize_tire_season();

create or replace function public.webshop_items_normalize_tire_season()
returns trigger
language plpgsql
as $$
begin
  if new.product_type = 'tire' then
    new.season := public.catalog_normalize_tire_season(new.season, new.model, null, new.card_title);
    if new.season = 'all_season' then
      new.winter_approved := true;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_webshop_items_normalize_tire_season on public.webshop_items;
create trigger trg_webshop_items_normalize_tire_season
before insert or update of product_type, season, model, card_title on public.webshop_items
for each row
execute function public.webshop_items_normalize_tire_season();

update public.catalog_selected_items
set
  season = 'all_season',
  winter_approved = true,
  updated_at = now()
where product_type = 'tire'
  and season is distinct from 'all_season'
  and public.catalog_tire_text_implies_all_season(model, supplier_title, null);

update public.webshop_items
set
  season = 'all_season',
  winter_approved = true,
  updated_at = now()
where product_type = 'tire'
  and season is distinct from 'all_season'
  and public.catalog_tire_text_implies_all_season(model, null, card_title);

grant execute on function public.catalog_tire_text_implies_all_season(text, text, text) to anon, authenticated, service_role;
grant execute on function public.catalog_normalize_tire_season(text, text, text, text) to anon, authenticated, service_role;
