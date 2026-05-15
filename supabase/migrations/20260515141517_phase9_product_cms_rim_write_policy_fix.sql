create or replace function public.catalog_product_cms_variant_matches_type(
  p_variant_id uuid,
  p_product_type text
)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists (
    select 1
    from public.catalog_selected_items csi
    where csi.id = p_variant_id
      and csi.product_type = p_product_type
  )
  or exists (
    select 1
    from public.products_search ps
    where ps.variant_id = p_variant_id
      and ps.product_type = p_product_type
  )
  or exists (
    select 1
    from public.webshop_items wi
    where wi.variant_id = p_variant_id
      and wi.product_type = p_product_type
  );
$function$;

grant execute on function public.catalog_product_cms_variant_matches_type(uuid, text) to authenticated, service_role;

drop policy if exists product_cms_catalog_tires_write_permission on public.product_cms;
create policy product_cms_catalog_tires_write_permission
  on public.product_cms
  for all
  to authenticated
  using (
    public.cms_has_permission('catalog_tires', 'write')
    and public.catalog_product_cms_variant_matches_type(variant_id, 'tire')
  )
  with check (
    public.cms_has_permission('catalog_tires', 'write')
    and public.catalog_product_cms_variant_matches_type(variant_id, 'tire')
  );

drop policy if exists product_cms_catalog_rims_write_permission on public.product_cms;
create policy product_cms_catalog_rims_write_permission
  on public.product_cms
  for all
  to authenticated
  using (
    public.cms_has_permission('catalog_rims', 'write')
    and public.catalog_product_cms_variant_matches_type(variant_id, 'rim')
  )
  with check (
    public.cms_has_permission('catalog_rims', 'write')
    and public.catalog_product_cms_variant_matches_type(variant_id, 'rim')
  );

comment on function public.catalog_product_cms_variant_matches_type(uuid, text) is
  'Security-definer helper for product_cms RLS. Resolves tire/rim identity across selected, legacy search, and published layers without depending on caller-visible rows.';
