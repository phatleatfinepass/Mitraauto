create or replace function public.enforce_paytrail_forward_only()
returns trigger
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
declare
  old_status text;
  new_status text;
  old_rank integer;
  new_rank integer;
begin
  if TG_OP = 'UPDATE' and NEW.paytrail_status is distinct from OLD.paytrail_status then
    old_status := lower(coalesce(OLD.paytrail_status::text, ''));
    new_status := lower(coalesce(NEW.paytrail_status::text, ''));

    old_rank := case
      when old_status in ('new') then 10
      when old_status in ('pending', 'delayed') then 20
      when old_status in ('ok', 'paid', 'success', 'purchased') then 30
      when old_status in ('refunded', 'partially_refunded') then 40
      when old_status in ('fail', 'failed', 'canceled', 'cancelled', 'expired', 'create_failed', 'rejected', 'error') then 90
      else 0
    end;

    new_rank := case
      when new_status in ('new') then 10
      when new_status in ('pending', 'delayed') then 20
      when new_status in ('ok', 'paid', 'success', 'purchased') then 30
      when new_status in ('refunded', 'partially_refunded') then 40
      when new_status in ('fail', 'failed', 'canceled', 'cancelled', 'expired', 'create_failed', 'rejected', 'error') then 90
      else 0
    end;

    if old_rank >= 30 and new_rank < old_rank then
      raise exception 'Illegal paytrail_status transition: % -> %', OLD.paytrail_status, NEW.paytrail_status
        using errcode = 'check_violation';
    end if;

    if old_rank = 90 and new_rank <> 90 then
      raise exception 'Illegal paytrail_status transition: % -> %', OLD.paytrail_status, NEW.paytrail_status
        using errcode = 'check_violation';
    end if;

    if old_rank = 0 or new_rank = 0 then
      raise exception 'Illegal paytrail_status transition: % -> %', OLD.paytrail_status, NEW.paytrail_status
        using errcode = 'check_violation';
    end if;
  end if;

  return NEW;
end;
$function$;
