alter table public.blocked_slots
  add column if not exists reason_fi text,
  add column if not exists reason_en text;

update public.blocked_slots
set
  reason_fi = coalesce(reason_fi, reason),
  reason_en = coalesce(reason_en, reason)
where reason is not null
  and (reason_fi is null or reason_en is null);
