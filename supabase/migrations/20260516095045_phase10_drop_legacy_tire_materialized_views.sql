-- Phase 10 cleanup: drop old tire materialized-view read models.
--
-- Current storefront tire reads use catalog_*_v1 RPCs / webshop_items-backed
-- helpers. Current CMS tire reads use catalog_selected_tires_cms_admin_v1 via
-- cms_list_tires_admin_v1/cms_count_tires_admin_v1. The frontend no longer
-- calls the legacy refresh RPCs below.

drop function if exists public.refresh_catalog_tires_public_mv();

drop function if exists public.refresh_cms_tires_admin_mv();

drop function if exists public.cms_tire_admin_matches_audit_filters(
  public.cms_tires_admin_mv,
  text[],
  boolean,
  text[]
);

drop materialized view if exists public.catalog_tires_public_mv;

drop materialized view if exists public.cms_tires_admin_mv;
