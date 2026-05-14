-- Keep customer portal account uniqueness for live customer records only.
-- Deleted and merged customers are archived history and must not block relinking
-- the same auth account to the surviving/current customer profile.

drop index if exists public.customers_account_id_unique_idx;

create unique index customers_account_id_unique_idx
  on public.customers(account_id)
  where account_id is not null
    and status not in ('deleted', 'merged');
