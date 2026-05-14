-- Phase 9: allow rim CMS writes against selected winner layer IDs.

set lock_timeout = '5s';
set statement_timeout = '60s';

drop policy if exists product_cms_catalog_rims_write_permission on public.product_cms;

create policy product_cms_catalog_rims_write_permission
on public.product_cms
for all
to authenticated
using (
  public.cms_has_permission('catalog_rims', 'write')
  and (
    exists (
      select 1
      from public.catalog_selected_items csi
      where csi.id = product_cms.variant_id
        and csi.product_type = 'rim'
    )
    or exists (
      select 1
      from public.products_search ps
      where ps.variant_id = product_cms.variant_id
        and ps.product_type = 'rim'
    )
  )
)
with check (
  public.cms_has_permission('catalog_rims', 'write')
  and (
    exists (
      select 1
      from public.catalog_selected_items csi
      where csi.id = product_cms.variant_id
        and csi.product_type = 'rim'
    )
    or exists (
      select 1
      from public.products_search ps
      where ps.variant_id = product_cms.variant_id
        and ps.product_type = 'rim'
    )
  )
);
