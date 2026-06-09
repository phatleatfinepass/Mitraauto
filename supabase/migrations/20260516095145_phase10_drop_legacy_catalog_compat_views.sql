-- Phase 10 cleanup: drop old catalog compatibility views.
--
-- These views belong to the pre-selected-layer catalog UI/search pipeline and
-- have no active frontend/source references. Current CMS tire/rim list RPCs
-- still use catalog_selected_*_cms_admin_v1, so those selected CMS views are
-- intentionally not touched here.

drop view if exists public.catalog_tires_final_for_ui;

drop view if exists public.catalog_tires_for_ui;

drop view if exists public.catalog_rims_for_ui;

drop view if exists public.catalog_best_tire_offers;

drop view if exists public.catalog_best_rim_offers;

drop view if exists public.catalog_tire_variants_safe;

drop view if exists public.products_final;

drop view if exists public.products_eu_flat;

drop view if exists public.products_search_old_final;

drop view if exists public.products_search_base_old_20251217_080121;

drop view if exists public.products_search_old_backup;

drop view if exists public.products_search_passenger_only_old cascade;

drop view if exists public.products_search_unfiltered_backup;

drop view if exists public.rd_articles_classified;
