-- Phase 10 final DB cleanup: drop legacy catalog objects.
--
-- Preconditions verified live before this migration:
-- - No public functions reference these objects.
-- - No views/materialized views reference these objects.
-- - No triggers reference these objects.
-- - Current storefront/CMS tire and rim catalog paths were smoke-tested.
-- - Fresh backup created outside the repo:
--   /Users/chandler/code/mitraauto-db-snapshots/phase10-pre-legacy-drop-20260516T095857Z
--
-- These objects belonged to the pre-selected-layer catalog pipeline and have
-- been replaced by supplier_raw_* -> catalog_selected_items -> webshop_items
-- -> public/CMS catalog RPCs.

drop view if exists public.products_search;

drop table if exists public.supplier_products_raw;

alter table if exists public.cms_product_overrides
  drop constraint if exists cms_product_overrides_variant_id_fkey;

alter table if exists public.cms_product_images
  drop constraint if exists cms_product_images_variant_id_fkey;

alter table if exists public.cms_tire_images
  drop constraint if exists cms_tire_images_variant_id_fkey;

alter table if exists public.cms_tire_eprel_matches
  drop constraint if exists cms_tire_eprel_matches_variant_id_fkey;

alter table if exists public.cms_tire_eprel_field_reviews
  drop constraint if exists cms_tire_eprel_field_reviews_variant_id_fkey;

alter table if exists public.cms_rim_images
  drop constraint if exists cms_rim_images_variant_id_fkey;

alter table if exists public.cms_tire_listings
  drop constraint if exists cms_tire_listings_tire_variant_id_fkey;

alter table if exists public.cms_rim_listings
  drop constraint if exists cms_rim_listings_rim_variant_id_fkey;

alter table if exists public.raw_product_links
  drop constraint if exists raw_product_links_variant_tire_id_fkey;

alter table if exists public.raw_product_links
  drop constraint if exists raw_product_links_variant_rim_id_fkey;

alter table if exists public.supplier_offers
  drop constraint if exists supplier_offers_variant_tire_id_fkey;

alter table if exists public.supplier_offers
  drop constraint if exists supplier_offers_variant_rim_id_fkey;

drop table if exists public.catalog_tire_variants;

drop table if exists public.catalog_rim_variants;

drop table if exists public.tires_variants;

drop table if exists public.rims_variants;
