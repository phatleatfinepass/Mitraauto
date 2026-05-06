import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, EyeOff, KeyRound, MailPlus, Plus, RefreshCcw, Save, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { CMS_MODULES, PERMISSION_VALUES, STAFF_ROLES, ACCOUNT_STATUSES } from './constants';
import { deleteStaffAccount, getStaffMfaStatus, inviteStaffAccount, listStaffAccounts, resetStaffMfa, sendStaffAccountSetupLink, updateStaffAccount } from './api';
import { buildDefaultStaffPermissions, buildStaffDraft } from './safe';
import type { StaffAccountRow, StaffDraft, AccountStatus, CmsPermissionValue, StaffRole } from './types';
import type { StaffMfaStatus } from './api';

export function StaffPanel({ currentUserId }: { currentUserId: string | null }) {
  const [rows, setRows] = useState<StaffAccountRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<StaffDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<StaffRole>('supervisor');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | StaffRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all');
  const [showHidden, setShowHidden] = useState(true);
  const [setupLinkSending, setSetupLinkSending] = useState(false);
  const [setupLinkMessage, setSetupLinkMessage] = useState('');
  const [mfaStatus, setMfaStatus] = useState<StaffMfaStatus | null>(null);
  const [mfaStatusLoading, setMfaStatusLoading] = useState(false);
  const [mfaResetting, setMfaResetting] = useState(false);

  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? rows[0] ?? null,
    [rows, selectedId],
  );

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (!showHidden && (row.hidden || row.accountStatus !== 'active')) return false;
      if (roleFilter !== 'all' && row.role !== roleFilter) return false;
      if (statusFilter !== 'all' && row.accountStatus !== statusFilter) return false;
      if (!needle) return true;
      return (
        row.email.toLowerCase().includes(needle) ||
        row.displayName.toLowerCase().includes(needle) ||
        row.role.toLowerCase().includes(needle) ||
        row.accountStatus.toLowerCase().includes(needle)
      );
    });
  }, [roleFilter, rows, search, showHidden, statusFilter]);

  useEffect(() => {
    setDraft(selectedRow ? buildStaffDraft(selectedRow) : null);
  }, [selectedRow]);

  useEffect(() => {
    if (!selectedRow?.id) {
      setMfaStatus(null);
      return;
    }

    let active = true;
    setMfaStatusLoading(true);
    getStaffMfaStatus(selectedRow.id)
      .then((status) => {
        if (active) setMfaStatus(status);
      })
      .catch(() => {
        if (active) setMfaStatus(null);
      })
      .finally(() => {
        if (active) setMfaStatusLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedRow?.id]);

  const loadRows = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const nextRows = await listStaffAccounts();
      setRows(nextRows);
      setSelectedId((current) => current && nextRows.some((row) => row.id === current) ? current : nextRows[0]?.id ?? null);
      setLoaded(true);
    } catch (err: any) {
      setRows([]);
      setLoaded(true);
      setError(err.message ?? 'Failed to load staff accounts.');
    } finally {
      setLoading(false);
    }
  };

  const refreshRows = async (preferredId?: string | null) => {
    const nextRows = await listStaffAccounts();
    setRows(nextRows);
    setSelectedId(preferredId && nextRows.some((row) => row.id === preferredId) ? preferredId : nextRows[0]?.id ?? null);
    setLoaded(true);
  };

  const addAccount = async () => {
    if (saving) return;
    if (!newEmail.trim()) {
      setError('Email is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const permissions = buildDefaultStaffPermissions(newRole);
      const profileId = await inviteStaffAccount(newEmail, newRole, newDisplayName, permissions);
      await refreshRows(profileId);
      setCreating(false);
      setSetupLinkMessage('Account created. Select it and send the active link from Account access.');
      setNewEmail('');
      setNewDisplayName('');
      setNewRole('supervisor');
    } catch (err: any) {
      setError(err.message ?? 'Failed to add account.');
    } finally {
      setSaving(false);
    }
  };

  const sendSelectedSetupLink = async () => {
    if (!selectedRow?.email || setupLinkSending) return;
    setSetupLinkSending(true);
    setSetupLinkMessage('');
    setError(null);

    try {
      await sendStaffAccountSetupLink(selectedRow.email);
      setSetupLinkMessage(`Active link sent to ${selectedRow.email}.`);
    } catch (err: any) {
      setError(err.message ?? 'Failed to send active link.');
    } finally {
      setSetupLinkSending(false);
    }
  };

  const refreshSelectedMfaStatus = async () => {
    if (!selectedRow?.id || mfaStatusLoading) return;
    setMfaStatusLoading(true);
    setError(null);

    try {
      setMfaStatus(await getStaffMfaStatus(selectedRow.id));
    } catch (err: any) {
      setError(err.message ?? 'Failed to load MFA status.');
    } finally {
      setMfaStatusLoading(false);
    }
  };

  const resetSelectedMfa = async () => {
    if (!selectedRow?.id || mfaResetting) return;

    const confirmed = window.confirm(`Reset 2FA for ${selectedRow.email || selectedRow.displayName || 'this account'}? They will need to set up 2FA again before CMS write access.`);
    if (!confirmed) return;

    setMfaResetting(true);
    setError(null);

    try {
      setMfaStatus(await resetStaffMfa(selectedRow.id));
      setSetupLinkMessage(`2FA reset for ${selectedRow.email || 'selected account'}. They must set up 2FA again on next CMS login.`);
    } catch (err: any) {
      setError(err.message ?? 'Failed to reset 2FA.');
    } finally {
      setMfaResetting(false);
    }
  };

  const saveDraft = async () => {
    if (!selectedRow || !draft || saving) return;
    if (selectedRow.id === currentUserId && (draft.role !== 'super_admin' || draft.accountStatus !== 'active')) {
      setError('You cannot remove your own active super admin access.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updateStaffAccount(selectedRow.id, draft);
      await refreshRows(selectedRow.id);
    } catch (err: any) {
      setError(err.message ?? 'Failed to save staff account.');
    } finally {
      setSaving(false);
    }
  };

  const softDeleteSelected = async () => {
    if (!selectedRow || saving) return;
    if (selectedRow.id === currentUserId) {
      setError('You cannot delete your own account.');
      return;
    }

    const confirmed = window.confirm(`Delete ${selectedRow.email || selectedRow.displayName || 'this account'}? This removes CMS access and deletes the Supabase Auth user.`);
    if (!confirmed) return;

    setSaving(true);
    setError(null);

    try {
      await deleteStaffAccount(selectedRow.id);
      await refreshRows(null);
    } catch (err: any) {
      setError(err.message ?? 'Failed to delete account.');
    } finally {
      setSaving(false);
    }
  };

  const suspendSelected = async () => {
    if (!selectedRow || !draft || saving) return;
    if (selectedRow.id === currentUserId) {
      setError('You cannot suspend your own account.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updateStaffAccount(selectedRow.id, {
        ...draft,
        accountStatus: 'suspended',
        hidden: true,
      });
      await refreshRows(selectedRow.id);
    } catch (err: any) {
      setError(err.message ?? 'Failed to suspend account.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Staff</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Super admin workspace. Account changes are saved through the CMS staff RPC.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setCreating((value) => !value)}>
            <Plus className="mr-2 h-4 w-4" />
            Add account
          </Button>
          <Button variant="outline" onClick={loadRows} disabled={loading}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            {loading ? 'Loading...' : 'Load staff'}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      ) : null}

      {setupLinkMessage ? (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
          {setupLinkMessage}
        </div>
      ) : null}

      {creating ? (
        <div className="rounded-lg border bg-background p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_minmax(180px,.8fr)_180px_140px] lg:items-end">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={newEmail} onChange={(event) => setNewEmail(event.target.value)} placeholder="name@example.fi" />
            </div>
            <div className="space-y-2">
              <Label>Display name</Label>
              <Input value={newDisplayName} onChange={(event) => setNewDisplayName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select
                value={newRole}
                onChange={(event) => setNewRole(event.target.value as StaffRole)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                {STAFF_ROLES.map((role) => <option key={`new-${role}`} value={role}>{role}</option>)}
              </select>
            </div>
            <Button onClick={addAccount} disabled={saving}>
              {saving ? 'Saving...' : 'Add account'}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Creates or links the Auth user and CMS profile. Send the active link from Account access after the account is selected.
          </p>
        </div>
      ) : null}

      <div className="rounded-lg border bg-background p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_160px_160px_auto] lg:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search staff" className="pl-9" />
          </div>
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as 'all' | StaffRole)} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="all">All roles</option>
            {STAFF_ROLES.map((role) => <option key={`filter-${role}`} value={role}>{role}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | AccountStatus)} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="all">All statuses</option>
            {ACCOUNT_STATUSES.map((status) => <option key={`filter-${status}`} value={status}>{status}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showHidden} onChange={(event) => setShowHidden(event.target.checked)} />
            Show hidden
          </label>
        </div>
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(260px,400px)_1fr]">
        <div className="min-w-0 overflow-hidden rounded-lg border">
          {filteredRows.length === 0 ? (
            <div className="px-4 py-8 text-sm text-muted-foreground">
              {loaded ? 'No staff accounts match the filters.' : 'Click Load staff to fetch accounts.'}
            </div>
          ) : filteredRows.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => setSelectedId(row.id)}
              className={`flex w-full min-w-0 items-center justify-between gap-3 border-b px-4 py-3 text-left last:border-b-0 ${
                selectedRow?.id === row.id ? 'bg-primary/10' : 'hover:bg-muted/60'
              }`}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{row.displayName || row.email || row.id}</span>
                <span className="block truncate text-xs text-muted-foreground">{row.email || '-'}</span>
              </span>
              <span className="flex min-w-0 shrink-0 items-center gap-2">
                {row.hidden ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : null}
                {row.accountStatus !== 'active' ? <Badge variant="secondary">{row.accountStatus}</Badge> : null}
                <Badge variant={row.role === 'super_admin' ? 'default' : 'outline'}>{row.role}</Badge>
              </span>
            </button>
          ))}
        </div>

        <div className="min-w-0 rounded-lg border bg-background p-4 xl:p-5">
          {selectedRow && draft ? (
            <div className="space-y-4">
              <div className="grid gap-4 2xl:grid-cols-[minmax(260px,340px)_1fr]">
                <div className="space-y-4">
                  <div className="rounded-lg border p-3">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Account information
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={selectedRow.email} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>Display name</Label>
                        <Input value={draft.displayName} onChange={(event) => setDraft((current) => current ? { ...current, displayName: event.target.value } : current)} />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
                        <div className="space-y-2">
                          <Label>Role</Label>
                          <select
                            value={draft.role}
                            onChange={(event) => setDraft((current) => current ? { ...current, role: event.target.value as StaffRole } : current)}
                            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                          >
                            {STAFF_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <select
                            value={draft.accountStatus}
                            onChange={(event) => setDraft((current) => current ? { ...current, accountStatus: event.target.value as AccountStatus } : current)}
                            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                          >
                            {ACCOUNT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                          </select>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={draft.hidden}
                          onChange={(event) => setDraft((current) => current ? { ...current, hidden: event.target.checked } : current)}
                        />
                        Hide from normal account lists
                      </label>
                    </div>
                  </div>

                  <div className="rounded-lg border p-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <KeyRound className="h-4 w-4 text-primary" />
                        MFA status
                      </div>
                      <Button type="button" size="sm" variant="ghost" onClick={refreshSelectedMfaStatus} disabled={mfaStatusLoading}>
                        <RefreshCcw className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-2 text-sm sm:grid-cols-2 2xl:grid-cols-1">
                      <div className="rounded-md border bg-muted/20 px-3 py-2">
                        <span className="block text-xs text-muted-foreground">2FA status</span>
                        <span className="font-medium">
                          {mfaStatusLoading ? 'Checking...' : mfaStatus?.enabled ? 'Enabled' : 'Not set up'}
                        </span>
                      </div>
                      <div className="rounded-md border bg-muted/20 px-3 py-2">
                        <span className="block text-xs text-muted-foreground">TOTP factors</span>
                        <span className="font-medium">
                          {mfaStatus ? `${mfaStatus.verifiedTotpCount} verified, ${mfaStatus.pendingTotpCount} pending` : '-'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant={mfaStatus?.enabled ? 'default' : 'secondary'}>
                        {mfaStatus?.enabled ? '2FA active' : '2FA setup required'}
                      </Badge>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={resetSelectedMfa}
                        disabled={!selectedRow.id || mfaResetting || selectedRow.accountStatus === 'deleted'}
                      >
                        {mfaResetting ? 'Resetting...' : 'Reset 2FA setup'}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border p-3">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                      <MailPlus className="h-4 w-4 text-primary" />
                      Account access
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={selectedRow.accountStatus === 'active' ? 'default' : 'secondary'}>{selectedRow.accountStatus}</Badge>
                      {selectedRow.hidden ? <Badge variant="outline">hidden</Badge> : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={sendSelectedSetupLink}
                        disabled={!selectedRow.email || setupLinkSending || selectedRow.accountStatus === 'deleted'}
                      >
                        <MailPlus className="mr-2 h-4 w-4" />
                        {setupLinkSending ? 'Sending...' : 'Send active link'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="overflow-hidden rounded-lg border">
                    <div className="flex items-center gap-2 border-b px-3 py-2 text-sm font-medium sm:px-4">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Permissions
                    </div>
                    <div className="grid grid-cols-[minmax(90px,1fr)_minmax(112px,140px)] border-b bg-muted/30 px-3 py-2 text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground sm:grid-cols-[minmax(120px,1fr)_150px] sm:px-4">
                      <span>Module</span>
                      <span>Access</span>
                    </div>
                    {CMS_MODULES.map((module) => (
                      <div key={module.id} className="grid grid-cols-[minmax(90px,1fr)_minmax(112px,140px)] items-center gap-2 border-b px-3 py-2.5 last:border-b-0 sm:grid-cols-[minmax(120px,1fr)_150px] sm:gap-3 sm:px-4">
                        <span className="text-sm font-medium">{module.label}</span>
                        <select
                          value={draft.permissions[module.id] ?? 'none'}
                          onChange={(event) => setDraft((current) => current ? {
                            ...current,
                            permissions: {
                              ...current.permissions,
                              [module.id]: event.target.value as CmsPermissionValue,
                            },
                          } : current)}
                          className="h-9 min-w-0 rounded-md border bg-background px-2 text-sm"
                        >
                          {PERMISSION_VALUES.map((value) => <option key={`${module.id}-${value}`} value={value}>{value}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t pt-4">
                <Button onClick={saveDraft} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save staff permissions'}
                </Button>
                <Button variant="outline" onClick={suspendSelected} disabled={saving || selectedRow.id === currentUserId}>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Suspend
                </Button>
                <Button variant="destructive" onClick={softDeleteSelected} disabled={saving || selectedRow.id === currentUserId}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete account
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Load and select a staff account to edit permissions.</p>
          )}
        </div>
      </div>
    </section>
  );
}
