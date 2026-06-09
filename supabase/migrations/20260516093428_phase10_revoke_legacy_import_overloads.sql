-- Phase 10 follow-up: revoke client execution from old two-argument import
-- overloads that forward into the deprecated supplier_products_raw pipeline.

revoke execute on function public.catalog_import_rims_from_supplier(text, integer)
  from public, anon, authenticated;

revoke execute on function public.catalog_import_tires_from_supplier(text, integer)
  from public, anon, authenticated;
