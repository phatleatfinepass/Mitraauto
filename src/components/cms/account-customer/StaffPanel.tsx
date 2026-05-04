import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, EyeOff, RefreshCcw, Save, ShieldCheck } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { CMS_MODULES, PERMISSION_VALUES, STAFF_ROLES, ACCOUNT_STATUSES } from './constants';
import { listStaffAccounts, updateStaffAccount } from './api';
import { buildStaffDraft } from './safe';
import type { StaffAccountRow, StaffDraft, AccountStatus, CmsPermissionValue, StaffRole } from './types';

export function StaffPanel({ currentUserId }: { currentUserId: string | null }) {
  const [rows, setRows] = useState<StaffAccountRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<StaffDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? rows[0] ?? null,
    [rows, selectedId],
  );

  useEffect(() => {
    setDraft(selectedRow ? buildStaffDraft(selectedRow) : null);
  }, [selectedRow]);

  const loadRows = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const nextRows = await listStaffAccounts();
      setRows(nextRows);
      setSelectedId((current) => current ?? nextRows[0]?.id ?? null);
      setLoaded(true);
    } catch (err: any) {
      setRows([]);
      setLoaded(true);
      setError(err.message ?? 'Failed to load staff accounts.');
    } finally {
      setLoading(false);
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
      const nextRows = await listStaffAccounts();
      setRows(nextRows);
    } catch (err: any) {
      setError(err.message ?? 'Failed to save staff account.');
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
        <Button variant="outline" onClick={loadRows} disabled={loading}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          {loading ? 'Loading...' : 'Load staff'}
        </Button>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(260px,400px)_1fr]">
        <div className="overflow-hidden rounded-lg border">
          {rows.length === 0 ? (
            <div className="px-4 py-8 text-sm text-muted-foreground">
              {loaded ? 'No staff accounts found.' : 'Click Load staff to fetch accounts.'}
            </div>
          ) : rows.map((row) => (
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

              <Button onClick={saveDraft} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save staff permissions'}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Load and select a staff account to edit permissions.</p>
          )}
        </div>
      </div>
    </section>
  );
}
