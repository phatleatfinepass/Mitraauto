-- Phase 10 hardening: remove anonymous/public execute from current helpers
-- that still depend on products_search.
--
-- These functions are intentionally not dropped in this phase:
-- - catalog_patch_offer_ean_v3 is still called by Tire CMS mutation code.
-- - catalog_product_cms_variant_matches_type is used by CMS product row
--   policies.
--
-- They should remain available to authenticated CMS users and service_role,
-- but not to PUBLIC/anon.

revoke execute on function public.catalog_patch_offer_ean_v3(
  text,
  text,
  text,
  text,
  boolean
) from public, anon;

revoke execute on function public.catalog_product_cms_variant_matches_type(
  uuid,
  text
) from public, anon;
