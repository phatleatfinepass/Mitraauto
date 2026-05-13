import React, { useMemo, useState } from 'react';
import { Settings, ShieldCheck, UserCog, Users, X } from 'lucide-react';
import { useLanguage } from '../../LanguageContext';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { useCmsAccess } from '../core/CmsAccessContext';
import { CustomerPanel } from './CustomerPanel';
import { StaffPanel } from './StaffPanel';
import { changeCmsAccountPassword, requestCmsAccountRecovery } from './api';
import type { AccountCustomerView } from './types';

export function AccountCustomerCMSPage() {
  const { language } = useLanguage();
  const access = useCmsAccess();
  const canManageAccounts = Boolean(access?.canManageAccounts || access?.isSuperAdmin);
  const canManageCustomers = Boolean(access?.canManageCustomers || canManageAccounts);
  const canWriteAccounts = Boolean(access?.isSuperAdmin || access?.permissions?.accounts === 'read_write');
  const canEditStaffPermissions = Boolean(access?.isSuperAdmin && access?.role === 'super_admin' && access?.accountStatus === 'active');
  const [activeView, setActiveView] = useState<AccountCustomerView>('customers');
  const [resetSending, setResetSending] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  const visibleViews = useMemo(() => {
    if (canManageAccounts) return ['customers', 'staff'] as AccountCustomerView[];
    return ['customers'] as AccountCustomerView[];
  }, [canManageAccounts]);

  const selectedView = visibleViews.includes(activeView) ? activeView : visibleViews[0];

  const sendPasswordReset = async () => {
    if (!access?.email || resetSending) return;
    setResetSending(true);
    setResetMessage('');

    try {
      await requestCmsAccountRecovery(access.email);
      setResetMessage(language === 'fi' ? 'Salasanan vaihtolinkki lähetetty.' : 'Password reset link sent.');
    } catch (error) {
      console.error('CMS password reset request failed:', error);
      setResetMessage(language === 'fi' ? 'Salasanan vaihtolinkin lähetys epäonnistui.' : 'Failed to send password reset link.');
    } finally {
      setResetSending(false);
    }
  };

  const updateOwnPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwordSaving) return;
    setResetMessage('');

    if (newPassword.length < 8) {
      setResetMessage(language === 'fi' ? 'Salasanan täytyy olla vähintään 8 merkkiä.' : 'Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetMessage(language === 'fi' ? 'Salasanat eivät täsmää.' : 'Passwords do not match.');
      return;
    }

    setPasswordSaving(true);

    try {
      await changeCmsAccountPassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      setResetMessage(language === 'fi' ? 'Salasana vaihdettu.' : 'Password changed.');
    } catch (error) {
      console.error('CMS direct password update failed:', error);
      setResetMessage(language === 'fi' ? 'Salasanan vaihto epäonnistui.' : 'Failed to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

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
          <h2 className="mt-1 text-2xl font-semibold text-foreground">
            {canManageAccounts ? 'Account' : 'Customer'}
          </h2>
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
          <Button
            type="button"
            size="icon"
            variant={showAccountSettings ? 'default' : 'outline'}
            onClick={() => setShowAccountSettings((current) => !current)}
            aria-label="Account settings"
            title="Account settings"
            className="h-10 w-10"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showAccountSettings ? (
        <div className="rounded-lg border bg-background p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Signed in as {access?.email || 'CMS user'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Role: {access?.role ?? 'unknown'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowPasswordForm((current) => !current)}>
                Change password
              </Button>
              <Button size="sm" variant="ghost" onClick={sendPasswordReset} disabled={resetSending || !access?.email}>
                {resetSending ? 'Sending...' : 'Email reset link'}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowAccountSettings(false)}
                aria-label="Close account settings"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {showPasswordForm ? (
            <form onSubmit={updateOwnPassword} className="mt-4 grid gap-3 rounded-md border bg-muted/20 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
              <div className="space-y-2">
                <Label>New password</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm password</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
              <Button type="submit" disabled={passwordSaving}>
                {passwordSaving ? 'Saving...' : 'Save password'}
              </Button>
            </form>
          ) : null}
          {resetMessage ? <p className="mt-3 text-sm text-muted-foreground">{resetMessage}</p> : null}
        </div>
      ) : null}

      {selectedView === 'customers' ? (
        <CustomerPanel />
      ) : null}

      {selectedView === 'staff' && canManageAccounts ? (
        <StaffPanel
          currentUserId={access?.userId ?? null}
          canWriteAccounts={canWriteAccounts}
          canEditPermissions={canEditStaffPermissions}
        />
      ) : null}
    </div>
  );
}
