-- Phase 1 Account & Customer QA alignment.
-- The designated full-access CMS owner must be visible in account management
-- lists so manual account QA can verify and maintain the account.

update public.profiles p
set account_hidden = false,
    account_status = 'active',
    updated_at = now()
from auth.users u
where u.id = p.id
  and lower(u.email) = 'phat.le@finepass.fi'
  and p.role = 'super_admin';
