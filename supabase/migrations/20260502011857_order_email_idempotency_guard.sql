-- Prevent duplicate order confirmation emails when Paytrail calls the backend
-- callback and the browser success page also finalizes the same payment.

with ranked as (
  select
    id,
    row_number() over (partition by order_id order by created_at asc, id asc) as rn
  from public.order_email_threads
  where status in ('active', 'sending')
)
update public.order_email_threads t
set status = 'superseded'
from ranked r
where t.id = r.id
  and r.rn > 1;

create unique index if not exists idx_order_email_threads_one_active_per_order
  on public.order_email_threads (order_id)
  where status in ('active', 'sending');
