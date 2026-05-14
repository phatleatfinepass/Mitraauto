-- Clean, isolated raw rim tables for the catalog rebuild.
-- These are ingestion targets only. Rims should publish only after a selected
-- winner layer explicitly reads from these tables and then writes webshop_items.

create table if not exists public.supplier_raw_rim_sync_runs (
  id uuid primary key default gen_random_uuid(),
  supplier_code text not null check (supplier_code in ('RD', 'VT')),
  product_type text not null default 'rim' check (product_type = 'rim'),
  run_kind text not null default 'full' check (run_kind in ('full', 'page', 'probe')),
  status text not null default 'running' check (status in ('running', 'success', 'partial', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  requested_pages integer,
  completed_pages integer not null default 0,
  expected_total integer,
  fetched_total integer not null default 0,
  upserted_total integer not null default 0,
  unchanged_total integer not null default 0,
  marked_unavailable_total integer not null default 0,
  error_count integer not null default 0,
  stats jsonb not null default '{}'::jsonb,
  error jsonb,
  created_at timestamptz not null default now()
);

create index if not exists supplier_raw_rim_sync_runs_supplier_started_idx
  on public.supplier_raw_rim_sync_runs (supplier_code, started_at desc);

create index if not exists supplier_raw_rim_sync_runs_status_idx
  on public.supplier_raw_rim_sync_runs (status, started_at desc);

create table if not exists public.supplier_raw_rd_rims (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  source_sku text,
  ean text,
  brand text,
  model text,
  article_text text,
  size_text text,
  width_in numeric(8,2),
  rim_diameter_in numeric(8,2),
  bolt_count integer,
  bolt_circle numeric(8,2),
  bolt_pattern text,
  et_offset_mm numeric(8,2),
  center_bore_mm numeric(8,2),
  color text,
  finish text,
  material text,
  seat_type text,
  wheel_load_kg numeric(8,2),
  stock_qty integer,
  external_stock_qty integer,
  wholesale_price_eur numeric(12,2),
  consumer_price_eur numeric(12,2),
  retail_price_eur numeric(12,2),
  delivery_days_min integer,
  delivery_days_max integer,
  image_id text,
  image_url text,
  supplier_metadata_json jsonb not null default '{}'::jsonb,
  raw_payload jsonb not null,
  raw_checksum text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  fetched_at timestamptz not null default now(),
  last_run_id uuid references public.supplier_raw_rim_sync_runs(id) on delete set null,
  is_available boolean not null default true,
  unavailable_since timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supplier_raw_rd_rims_stock_nonnegative check (
    (stock_qty is null or stock_qty >= 0)
    and (external_stock_qty is null or external_stock_qty >= 0)
  ),
  constraint supplier_raw_rd_rims_price_nonnegative check (
    (wholesale_price_eur is null or wholesale_price_eur >= 0)
    and (consumer_price_eur is null or consumer_price_eur >= 0)
    and (retail_price_eur is null or retail_price_eur >= 0)
  ),
  constraint supplier_raw_rd_rims_unavailable_since_check check (
    is_available or unavailable_since is not null
  )
);

create index if not exists supplier_raw_rd_rims_seen_idx
  on public.supplier_raw_rd_rims (last_seen_at desc);

create index if not exists supplier_raw_rd_rims_available_idx
  on public.supplier_raw_rd_rims (is_available, last_seen_at desc);

create index if not exists supplier_raw_rd_rims_ean_idx
  on public.supplier_raw_rd_rims (ean)
  where ean is not null and ean <> '';

create index if not exists supplier_raw_rd_rims_brand_model_idx
  on public.supplier_raw_rd_rims (brand, model);

create index if not exists supplier_raw_rd_rims_specs_idx
  on public.supplier_raw_rd_rims (
    rim_diameter_in,
    width_in,
    bolt_pattern,
    et_offset_mm,
    center_bore_mm
  );

create table if not exists public.supplier_raw_vt_rims (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  source_sku text,
  ean text,
  brand text,
  model text,
  description text,
  size_text text,
  width_in numeric(8,2),
  rim_diameter_in numeric(8,2),
  bolt_count integer,
  bolt_circle numeric(8,2),
  bolt_pattern text,
  et_offset_mm numeric(8,2),
  center_bore_mm numeric(8,2),
  color text,
  finish text,
  material text,
  bolts_included boolean,
  winter_approved boolean,
  wheel_load_kg numeric(8,2),
  stock_qty integer,
  wholesale_price_eur numeric(12,2),
  consumer_price_eur numeric(12,2),
  freight_class text,
  image_name text,
  image_url text,
  gallery jsonb not null default '[]'::jsonb,
  supplier_metadata_json jsonb not null default '{}'::jsonb,
  raw_payload jsonb not null,
  raw_checksum text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  fetched_at timestamptz not null default now(),
  last_run_id uuid references public.supplier_raw_rim_sync_runs(id) on delete set null,
  is_available boolean not null default true,
  unavailable_since timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supplier_raw_vt_rims_stock_nonnegative check (stock_qty is null or stock_qty >= 0),
  constraint supplier_raw_vt_rims_price_nonnegative check (
    (wholesale_price_eur is null or wholesale_price_eur >= 0)
    and (consumer_price_eur is null or consumer_price_eur >= 0)
  ),
  constraint supplier_raw_vt_rims_unavailable_since_check check (
    is_available or unavailable_since is not null
  )
);

create index if not exists supplier_raw_vt_rims_seen_idx
  on public.supplier_raw_vt_rims (last_seen_at desc);

create index if not exists supplier_raw_vt_rims_available_idx
  on public.supplier_raw_vt_rims (is_available, last_seen_at desc);

create index if not exists supplier_raw_vt_rims_ean_idx
  on public.supplier_raw_vt_rims (ean)
  where ean is not null and ean <> '';

create index if not exists supplier_raw_vt_rims_brand_model_idx
  on public.supplier_raw_vt_rims (brand, model);

create index if not exists supplier_raw_vt_rims_specs_idx
  on public.supplier_raw_vt_rims (
    rim_diameter_in,
    width_in,
    bolt_pattern,
    et_offset_mm,
    center_bore_mm
  );

alter table public.supplier_raw_rim_sync_runs enable row level security;
alter table public.supplier_raw_rd_rims enable row level security;
alter table public.supplier_raw_vt_rims enable row level security;

grant select on public.supplier_raw_rim_sync_runs to authenticated;
grant select on public.supplier_raw_rd_rims to authenticated;
grant select on public.supplier_raw_vt_rims to authenticated;

drop policy if exists "Admin read rim raw sync runs" on public.supplier_raw_rim_sync_runs;
create policy "Admin read rim raw sync runs"
  on public.supplier_raw_rim_sync_runs
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
    )
  );

drop policy if exists "Admin read RD rim raw rows" on public.supplier_raw_rd_rims;
create policy "Admin read RD rim raw rows"
  on public.supplier_raw_rd_rims
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
    )
  );

drop policy if exists "Admin read VT rim raw rows" on public.supplier_raw_vt_rims;
create policy "Admin read VT rim raw rows"
  on public.supplier_raw_vt_rims
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
    )
  );

comment on table public.supplier_raw_rim_sync_runs is
  'Run log for clean supplier rim raw ingestion. Used to verify full-run completeness before marking stale rows unavailable.';

comment on table public.supplier_raw_rd_rims is
  'Clean RD rim raw table. Ingestion-only source for rim rebuild; does not publish directly to CMS or webshop.';

comment on table public.supplier_raw_vt_rims is
  'Clean VT rim raw table. Ingestion-only source for rim rebuild; does not publish directly to CMS or webshop.';
