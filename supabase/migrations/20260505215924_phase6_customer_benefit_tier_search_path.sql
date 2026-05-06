create or replace function public.customer_benefit_tier_for_points(p_points integer)
returns table (tier text, discount_percent numeric)
language sql
immutable
set search_path = public
as $$
  select
    case
      when coalesce(p_points, 0) >= 2000 then 'platinum'
      when coalesce(p_points, 0) >= 1000 then 'gold'
      when coalesce(p_points, 0) >= 500 then 'silver'
      else 'bronze'
    end::text,
    case
      when coalesce(p_points, 0) >= 2000 then 15
      when coalesce(p_points, 0) >= 1000 then 10
      when coalesce(p_points, 0) >= 500 then 5
      else 0
    end::numeric;
$$;

grant execute on function public.customer_benefit_tier_for_points(integer) to authenticated;
