-- Align legacy public brand helpers with the active product-ready storefront read model.

create or replace function public.catalog_list_tire_brands_v1()
returns table (
  brand text
)
language sql
stable
security definer
set search_path = public
as $$
  select distinct coalesce(nullif(btrim(w.brand_display_name), ''), w.brand) as brand
  from public.webshop_items w
  where w.product_type = 'tire'
    and w.is_visible = true
    and w.publish_status = 'published'
    and coalesce(w.product_ready, false) = true
    and nullif(btrim(coalesce(w.brand_display_name, w.brand)), '') is not null
  order by 1 asc;
$$;

create or replace function public.catalog_list_rim_brands_v1()
returns table (
  brand text
)
language sql
stable
security definer
set search_path = public
as $$
  select distinct coalesce(nullif(btrim(w.brand_display_name), ''), w.brand) as brand
  from public.webshop_items w
  where w.product_type = 'rim'
    and w.is_visible = true
    and w.publish_status = 'published'
    and coalesce(w.product_ready, false) = true
    and nullif(btrim(coalesce(w.brand_display_name, w.brand)), '') is not null
  order by 1 asc;
$$;

revoke all on function public.catalog_list_tire_brands_v1() from public;
revoke all on function public.catalog_list_rim_brands_v1() from public;

grant execute on function public.catalog_list_tire_brands_v1() to anon, authenticated, service_role;
grant execute on function public.catalog_list_rim_brands_v1() to anon, authenticated, service_role;
