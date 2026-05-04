import React, { useMemo, useState } from 'react';
import { ShieldCheck, UserCog, Users } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { useCmsAccess } from './CmsAccessContext';
import { CustomerPanel } from './account-customer/CustomerPanel';
import { StaffPanel } from './account-customer/StaffPanel';
import type { AccountCustomerView } from './account-customer/types';

export function AccountCustomerCMSPage() {
  const { language } = useLanguage();
  const access = useCmsAccess();
  const canManageAccounts = Boolean(access?.canManageAccounts || access?.isSuperAdmin);
  const canManageCustomers = Boolean(access?.canManageCustomers || canManageAccounts);
  const [activeView, setActiveView] = useState<AccountCustomerView>('customers');

  const visibleViews = useMemo(() => {
    if (canManageAccounts) return ['customers', 'staff'] as AccountCustomerView[];
    return ['customers'] as AccountCustomerView[];
  }, [canManageAccounts]);

  const selectedView = visibleViews.includes(activeView) ? activeView : visibleViews[0];

  if (!canManageCustomers) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {language === 'fi' ? 'Ei asiakasoikeuksia.' : 'No customer permissions.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium uppercase tracking-[0.08em] text-muted-foreground">CMS</p>
          <h2 className="mt-1 text-2xl font-semibold text-foreground">
            {canManageAccounts ? 'Account & Customer' : 'Customer'}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {canManageAccounts
              ? 'Customer records and CMS account permissions. Data loads manually so the workspace opens safely.'
              : 'Customer workspace for supervisors. Account controls are hidden for this role.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveView('customers')}
            className={`inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium ${
              selectedView === 'customers'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-foreground hover:bg-muted'
            }`}
          >
            <Users className="h-4 w-4" />
            Customer
          </button>
          {canManageAccounts ? (
            <button
              type="button"
              onClick={() => setActiveView('staff')}
              className={`inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium ${
                selectedView === 'staff'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-foreground hover:bg-muted'
              }`}
            >
              <UserCog className="h-4 w-4" />
              Staff
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border bg-background p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">
              Signed in as {access?.email || 'CMS user'}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Role: {access?.role ?? 'unknown'}
          </p>
        </div>
      </div>

      {selectedView === 'customers' ? (
        <CustomerPanel />
      ) : null}

      {selectedView === 'staff' && canManageAccounts ? (
        <StaffPanel currentUserId={access?.userId ?? null} />
      ) : null}
    </div>
  );
}
