import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, EyeOff, Filter, History, MailPlus, Plus, RefreshCcw, Save, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { CMS_MODULES, PERMISSION_VALUES, STAFF_ROLES, ACCOUNT_STATUSES, STAFF_PRESETS } from './constants';
import { addStaffAccountByEmail, inviteStaffAccount, listAccountEvents, listStaffAccounts, updateStaffAccount } from './api';
import { buildDefaultStaffPermissions, buildStaffDraft, buildStaffDraftForPreset, formatDate } from './safe';
import type { AccountEventRow, StaffAccountRow, StaffDraft, AccountStatus, CmsPermissionValue, StaffPresetId, StaffRole } from './types';

export function StaffPanel({ currentUserId }: { currentUserId: string | null }) {
  const [rows, setRows] = useState<StaffAccountRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<StaffDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createMode, setCreateMode] = useState<'existing' | 'invite'>('existing');
  const [newEmail, setNewEmail] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<StaffRole>('supervisor');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | StaffRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all');
  const [showHidden, setShowHidden] = useState(true);
  const [events, setEvents] = useState<AccountEventRow[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? rows[0] ?? null,
    [rows, selectedId],
  );

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (!showHidden && row.hidden) return false;
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
    if (!selectedRow) {
      setEvents([]);
      return;
    }

    let active = true;
    setEventsLoading(true);
    listAccountEvents(selectedRow.id)
      .then((nextEvents) => {
        if (active) setEvents(nextEvents);
      })
      .catch(() => {
        if (active) setEvents([]);
      })
      .finally(() => {
        if (active) setEventsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedRow]);

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
      const profileId = createMode === 'invite'
        ? await inviteStaffAccount(newEmail, newRole, newDisplayName, permissions)
        : await addStaffAccountByEmail(newEmail, newRole, newDisplayName, permissions);
      await refreshRows(profileId);
      setCreating(false);
      setNewEmail('');
      setNewDisplayName('');
      setNewRole('supervisor');
    } catch (err: any) {
      setError(err.message ?? (createMode === 'invite' ? 'Failed to invite account.' : 'Failed to add account.'));
    } finally {
      setSaving(false);
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
      setEvents(await listAccountEvents(selectedRow.id));
    } catch (err: any) {
      setError(err.message ?? 'Failed to save staff account.');
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (presetId: StaffPresetId) => {
    if (selectedRow?.id === currentUserId && presetId === 'disabled') {
      setError('You cannot disable your own account.');
      return;
    }
    setDraft((current) => buildStaffDraftForPreset(presetId, current));
  };

  const softDeleteSelected = async () => {
    if (!selectedRow || saving) return;
    if (selectedRow.id === currentUserId) {
      setError('You cannot delete your own account.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updateStaffAccount(selectedRow.id, {
        displayName: draft?.displayName ?? selectedRow.displayName,
        role: 'disabled',
        accountStatus: 'deleted',
        hidden: true,
        permissions: buildDefaultStaffPermissions('disabled'),
      });
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

      {creating ? (
        <div className="rounded-lg border bg-background p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            <Button size="sm" variant={createMode === 'existing' ? 'default' : 'outline'} onClick={() => setCreateMode('existing')}>
              Existing user
            </Button>
            <Button size="sm" variant={createMode === 'invite' ? 'default' : 'outline'} onClick={() => setCreateMode('invite')}>
              <MailPlus className="mr-2 h-4 w-4" />
              Invite new user
            </Button>
          </div>
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
              {saving ? 'Saving...' : createMode === 'invite' ? 'Send invite' : 'Create'}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {createMode === 'invite'
              ? 'Invites are sent through a secure Edge Function using server-side Auth Admin access.'
              : 'Existing-user mode requires the email to already exist as a signed-up auth user.'}
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

      <div className="grid gap-6 xl:grid-cols-[minmax(260px,400px)_1fr]">
        <div className="overflow-hidden rounded-lg border">
          {filteredRows.length === 0 ? (
            <div className="px-4 py-8 text-sm text-muted-foreground">
              {loaded ? 'No staff accounts match the filters.' : 'Click Load staff to fetch accounts.'}
            </div>
          ) : filteredRows.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => setSelectedId(row.id)}
              className={`flex w-full items-center justify-between gap-3 border-b px-4 py-3 text-left last:border-b-0 ${
                selectedRow?.id === row.id ? 'bg-primary/10' : 'hover:bg-muted/60'
              }`}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{row.displayName || row.email || row.id}</span>
                <span className="block truncate text-xs text-muted-foreground">{row.email || '-'}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {row.hidden ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : null}
                {row.accountStatus !== 'active' ? <Badge variant="secondary">{row.accountStatus}</Badge> : null}
                <Badge variant={row.role === 'super_admin' ? 'default' : 'outline'}>{row.role}</Badge>
              </span>
            </button>
          ))}
        </div>

        <div className="rounded-lg border bg-background p-5">
          {selectedRow && draft ? (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-foreground">Permissions</h4>
              </div>

              <div className="rounded-lg border p-3">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <Filter className="h-4 w-4 text-primary" />
                  Permission presets
                </div>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {STAFF_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset.id)}
                      className="rounded-md border px-3 py-2 text-left hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={selectedRow.id === currentUserId && preset.id === 'disabled'}
                    >
                      <span className="block text-sm font-medium">{preset.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">{preset.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={selectedRow.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Display name</Label>
                  <Input value={draft.displayName} onChange={(event) => setDraft((current) => current ? { ...current, displayName: event.target.value } : current)} />
                </div>
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

              <div className="overflow-hidden rounded-lg border">
                {CMS_MODULES.map((module) => (
                  <div key={module.id} className="grid grid-cols-[minmax(120px,1fr)_180px] items-center gap-3 border-b px-4 py-3 last:border-b-0">
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
                      className="h-9 rounded-md border bg-background px-2 text-sm"
                    >
                      {PERMISSION_VALUES.map((value) => <option key={`${module.id}-${value}`} value={value}>{value}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
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

              <div className="rounded-lg border">
                <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <History className="h-4 w-4 text-primary" />
                    Account audit
                  </div>
                  <Button size="sm" variant="ghost" onClick={async () => selectedRow && setEvents(await listAccountEvents(selectedRow.id))} disabled={eventsLoading}>
                    Refresh
                  </Button>
                </div>
                <div className="max-h-[280px] overflow-y-auto">
                  {eventsLoading ? (
                    <div className="px-4 py-4 text-sm text-muted-foreground">Loading audit events...</div>
                  ) : events.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-muted-foreground">No account audit events found.</div>
                  ) : events.map((event) => (
                    <div key={event.id} className="border-b px-4 py-3 text-sm last:border-b-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">{event.eventType}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(event.createdAt)}</span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Actor: {event.actorEmail || event.actorId || 'system'}
                      </div>
                      {Object.keys(event.details).length ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {Object.entries(event.details).slice(0, 5).map(([key, value]) => (
                            <Badge key={`${event.id}-${key}`} variant="outline">{key}: {String(value)}</Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
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
