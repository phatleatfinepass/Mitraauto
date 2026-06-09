-- Phase 10 cleanup: drop old tire CMS compatibility overloads.
--
-- The active CMS tire list uses:
--   cms_list_tires_admin_v1(text, boolean, boolean, text, text, text[], boolean, boolean, text[], integer, integer)
--   cms_count_tires_admin_v1(text, boolean, boolean, text, text, text[], boolean, boolean, text[])
--
-- The older overloads below read `products_search` and `catalog_tire_variants`
-- and are not called by current app source.

drop function if exists public.cms_list_tires_admin_v1(
  text,
  boolean,
  boolean,
  integer,
  integer
);

drop function if exists public.cms_list_tires_admin_v1(
  text,
  boolean,
  integer,
  integer
);

drop function if exists public.cms_resolve_tire_supplier_pricing_v1(
  text,
  text
);
