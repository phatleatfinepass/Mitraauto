-- Clean, isolated raw tire tables for the catalog rebuild.
-- These tables are ingestion targets only. They must not drive CMS or webshop
-- publishing until a later selected/publish layer explicitly reads from them.

create table if not exists public.supplier_raw_tire_sync_runs (
  id uuid primary key default gen_random_uuid(),
  supplier_code text not null check (supplier_code in ('RD', 'VT')),
  product_type text not null default 'tire' check (product_type = 'tire'),
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

create index if not exists supplier_raw_tire_sync_runs_supplier_started_idx
  on public.supplier_raw_tire_sync_runs (supplier_code, started_at desc);

create index if not exists supplier_raw_tire_sync_runs_status_idx
  on public.supplier_raw_tire_sync_runs (status, started_at desc);

create table if not exists public.supplier_raw_rd_tires (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  source_sku text,
  ean text,
  brand text,
  model text,
  size_text text,
  season text,
  width_mm numeric(8,2),
  aspect_ratio numeric(8,2),
  diameter_in numeric(8,2),
  load_index text,
  speed_index text,
  stock_qty integer,
  wholesale_price_eur numeric(12,2),
  consumer_price_eur numeric(12,2),
  label_json jsonb not null default '{}'::jsonb,
  image_url text,
  raw_payload jsonb not null,
  raw_checksum text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  fetched_at timestamptz not null default now(),
  last_run_id uuid references public.supplier_raw_tire_sync_runs(id) on delete set null,
  is_available boolean not null default true,
  unavailable_since timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supplier_raw_rd_tires_stock_nonnegative check (stock_qty is null or stock_qty >= 0),
  constraint supplier_raw_rd_tires_price_nonnegative check (
    (wholesale_price_eur is null or wholesale_price_eur >= 0)
    and (consumer_price_eur is null or consumer_price_eur >= 0)
  ),
  constraint supplier_raw_rd_tires_unavailable_since_check check (
    is_available or unavailable_since is not null
  )
);

create index if not exists supplier_raw_rd_tires_seen_idx
  on public.supplier_raw_rd_tires (last_seen_at desc);

create index if not exists supplier_raw_rd_tires_available_idx
  on public.supplier_raw_rd_tires (is_available, last_seen_at desc);

create index if not exists supplier_raw_rd_tires_ean_idx
  on public.supplier_raw_rd_tires (ean)
  where ean is not null and ean <> '';

create index if not exists supplier_raw_rd_tires_brand_size_idx
  on public.supplier_raw_rd_tires (brand, size_text);

create table if not exists public.supplier_raw_vt_tires (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  source_sku text,
  ean text,
  brand text,
  model text,
  size_text text,
  season text,
  width_mm numeric(8,2),
  aspect_ratio numeric(8,2),
  diameter_in numeric(8,2),
  load_index text,
  speed_index text,
  stock_qty integer,
  wholesale_price_eur numeric(12,2),
  consumer_price_eur numeric(12,2),
  eprel_code text,
  label_json jsonb not null default '{}'::jsonb,
  image_url text,
  raw_payload jsonb not null,
  raw_checksum text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  fetched_at timestamptz not null default now(),
  last_run_id uuid references public.supplier_raw_tire_sync_runs(id) on delete set null,
  is_available boolean not null default true,
  unavailable_since timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supplier_raw_vt_tires_stock_nonnegative check (stock_qty is null or stock_qty >= 0),
  constraint supplier_raw_vt_tires_price_nonnegative check (
    (wholesale_price_eur is null or wholesale_price_eur >= 0)
    and (consumer_price_eur is null or consumer_price_eur >= 0)
  ),
  constraint supplier_raw_vt_tires_unavailable_since_check check (
    is_available or unavailable_since is not null
  )
);

create index if not exists supplier_raw_vt_tires_seen_idx
  on public.supplier_raw_vt_tires (last_seen_at desc);

create index if not exists supplier_raw_vt_tires_available_idx
  on public.supplier_raw_vt_tires (is_available, last_seen_at desc);

create index if not exists supplier_raw_vt_tires_ean_idx
  on public.supplier_raw_vt_tires (ean)
  where ean is not null and ean <> '';

create index if not exists supplier_raw_vt_tires_brand_size_idx
  on public.supplier_raw_vt_tires (brand, size_text);

create index if not exists supplier_raw_vt_tires_eprel_idx
  on public.supplier_raw_vt_tires (eprel_code)
  where eprel_code is not null and eprel_code <> '';

alter table public.supplier_raw_tire_sync_runs enable row level security;
alter table public.supplier_raw_rd_tires enable row level security;
alter table public.supplier_raw_vt_tires enable row level security;

comment on table public.supplier_raw_tire_sync_runs is
  'Run log for clean supplier tire raw ingestion. Used to verify full-run completeness before marking stale rows unavailable.';

comment on table public.supplier_raw_rd_tires is
  'Clean RD tire raw table. Ingestion-only source for rebuild; does not publish directly to CMS or webshop.';

comment on table public.supplier_raw_vt_tires is
  'Clean VT tire raw table. Ingestion-only source for rebuild; does not publish directly to CMS or webshop.';
