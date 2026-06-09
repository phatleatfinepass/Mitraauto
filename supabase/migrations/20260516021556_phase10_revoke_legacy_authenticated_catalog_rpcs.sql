-- Phase 10 second canary: remove authenticated access to legacy catalog RPCs.
--
-- The first canary removed PUBLIC/anon access. Browser smoke verified that the
-- current public catalog still works through `catalog_*_v1` RPCs. The app source
-- no longer references the legacy RPCs below, so this step narrows access to
-- owner/service-role only before any future function or table drops.

revoke execute on function public.storefront_search(
  text,
  public.product_category,
  boolean,
  integer,
  integer,
  integer,
  integer
) from authenticated;

revoke execute on function public.storefront_suggest(
  text,
  integer
) from authenticated;

revoke execute on function public.storefront_product_detail(
  public.product_category,
  uuid
) from authenticated;

revoke execute on function public.tires_browse_ui(
  integer,
  integer,
  integer,
  integer,
  integer
) from authenticated;

revoke execute on function public.tires_search_ui(
  integer,
  integer,
  integer
) from authenticated;

revoke execute on function public.rims_browse_ui(
  numeric,
  numeric,
  text,
  integer,
  integer
) from authenticated;

revoke execute on function public.rims_search_ui(
  numeric,
  integer,
  text
) from authenticated;
