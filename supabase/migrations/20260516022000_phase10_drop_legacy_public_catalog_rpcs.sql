-- Phase 10 cleanup: drop old public catalog RPCs after canary.
--
-- Prior canaries removed PUBLIC/anon and authenticated execute grants from
-- these functions. Current storefront/CMS paths use `catalog_*_v1` and
-- `cms_*_admin_v1` RPCs and were verified after the canary. This migration
-- removes only the old function entry points. It does not drop legacy tables,
-- views, or data.

drop function if exists public.storefront_search(
  text,
  public.product_category,
  boolean,
  integer,
  integer,
  integer,
  integer
);

drop function if exists public.storefront_suggest(
  text,
  integer
);

drop function if exists public.storefront_product_detail(
  public.product_category,
  uuid
);

drop function if exists public.tires_browse_ui(
  integer,
  integer,
  integer,
  integer,
  integer
);

drop function if exists public.tires_search_ui(
  integer,
  integer,
  integer
);

drop function if exists public.rims_browse_ui(
  numeric,
  numeric,
  text,
  integer,
  integer
);

drop function if exists public.rims_search_ui(
  numeric,
  integer,
  text
);
