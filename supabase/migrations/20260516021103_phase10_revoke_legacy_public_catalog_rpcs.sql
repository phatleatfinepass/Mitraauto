-- Phase 10 canary: retire public access to legacy catalog RPCs.
--
-- These RPCs read legacy objects (`products_search`, `tires_variants`,
-- `rims_variants`) and are no longer used by the current storefront/CMS
-- catalog paths. This migration does not drop functions or data. It removes
-- public/anon execution first so production can be observed before physical
-- backend cleanup.

revoke execute on function public.storefront_search(
  text,
  public.product_category,
  boolean,
  integer,
  integer,
  integer,
  integer
) from public, anon;

revoke execute on function public.storefront_suggest(
  text,
  integer
) from public, anon;

revoke execute on function public.storefront_product_detail(
  public.product_category,
  uuid
) from public, anon;

revoke execute on function public.tires_browse_ui(
  integer,
  integer,
  integer,
  integer,
  integer
) from public, anon;

revoke execute on function public.tires_search_ui(
  integer,
  integer,
  integer
) from public, anon;

revoke execute on function public.rims_browse_ui(
  numeric,
  numeric,
  text,
  integer,
  integer
) from public, anon;

revoke execute on function public.rims_search_ui(
  numeric,
  integer,
  text
) from public, anon;
