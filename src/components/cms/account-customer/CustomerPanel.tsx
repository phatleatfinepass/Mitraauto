import React, { useMemo, useState } from 'react';
import { AlertCircle, BadgePercent, Filter, GitMerge, Link2, Plus, RefreshCcw, Search, TriangleAlert } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { useCmsAccess } from '../core/CmsAccessContext';
import { CUSTOMER_STATUSES } from './constants';
import { autoLinkCustomerActivities, listCustomerOverview, listLicensePlateConflicts, mergeCustomers, resolveLicensePlateConflict } from './api';
import { CustomerEditorPanel } from './CustomerEditorPanel';
import { formatDate } from './safe';
import type { CustomerOverviewFilters, CustomerOverviewRow, CustomerStatus, LicensePlateConflict } from './types';

type MergeFieldKey = 'name' | 'email' | 'phone';
type MergeFieldSources = Record<MergeFieldKey, 'primary' | 'duplicate'>;

const mergeFields: Array<{ key: MergeFieldKey; label: string; rpcKey: string }> = [
  { key: 'name', label: 'Name', rpcKey: 'full_name' },
  { key: 'email', label: 'Email', rpcKey: 'primary_email' },
  { key: 'phone', label: 'Phone', rpcKey: 'primary_phone' },
];

export function CustomerPanel() {
  const access = useCmsAccess();
  const canWriteCustomers = Boolean(access?.isSuperAdmin || access?.permissions?.customers === 'read_write');
  const [rows, setRows] = useState<CustomerOverviewRow[]>([]);
  const [filters, setFilters] = useState<CustomerOverviewFilters>({
    search: '',
    status: 'all',
    tag: '',
    includeHidden: false,
  });
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState(false);
  const [autoLinking, setAutoLinking] = useState(false);
  const [resolvingPlate, setResolvingPlate] = useState('');
  const [autoLinkResult, setAutoLinkResult] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [plateConflicts, setPlateConflicts] = useState<LicensePlateConflict[]>([]);
  const [mergePair, setMergePair] = useState<{ firstKey: string; secondKey: string; keepKey: string } | null>(null);
  const [mergeFieldSources, setMergeFieldSources] = useState<MergeFieldSources>({
    name: 'primary',
    email: 'primary',
    phone: 'primary',
  });

  const selectedRow = creating
    ? null
    : rows.find((row) => row.key === selectedKey) ?? rows[0] ?? null;

  const knownTags = useMemo(() => {
    return Array.from(new Set(rows.flatMap((row) => row.tags))).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const duplicateCandidates = useMemo(() => {
    if (!selectedRow?.customerId) return [];
    const selectedSignals = new Set([
      selectedRow.email ? `email:${selectedRow.email.toLowerCase()}` : '',
      selectedRow.phone ? `phone:${selectedRow.phone.replace(/\s+/g, '')}` : '',
      ...selectedRow.licensePlates.map((plate) => `plate:${plate.toUpperCase()}`),
    ].filter(Boolean));

    if (selectedSignals.size === 0) return [];

    return rows.filter((row) => {
      if (!row.customerId || row.customerId === selectedRow.customerId) return false;
      const rowSignals = [
        row.email ? `email:${row.email.toLowerCase()}` : '',
        row.phone ? `phone:${row.phone.replace(/\s+/g, '')}` : '',
        ...row.licensePlates.map((plate) => `plate:${plate.toUpperCase()}`),
      ].filter(Boolean);
      return rowSignals.some((signal) => selectedSignals.has(signal));
    });
  }, [rows, selectedRow]);

  const loadRows = async (preferredCustomerId?: string | null) => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const nextRows = await listCustomerOverview(filters);
      setRows(nextRows);
      if (access?.isSuperAdmin) {
        setPlateConflicts(await listLicensePlateConflicts());
      }
      setSelectedKey((current) => {
        if (preferredCustomerId) {
          const preferred = nextRows.find((row) => row.customerId === preferredCustomerId);
          if (preferred) return preferred.key;
        }
        return current && nextRows.some((row) => row.key === current) ? current : nextRows[0]?.key ?? null;
      });
      setLoaded(true);
    } catch (err: any) {
      setRows([]);
      setPlateConflicts([]);
      setSelectedKey(null);
      setLoaded(true);
      setError(err.message ?? 'Failed to load customer records.');
    } finally {
      setLoading(false);
    }
  };

  const refreshAfterSave = async (customerId?: string | null) => {
    await loadRows(customerId);
    setCreating(false);
  };

  const startMergeReview = (row: CustomerOverviewRow) => {
    if (!selectedRow?.customerId || !row.customerId || selectedRow.key === row.key || !canWriteCustomers) return;
    setMergePair({ firstKey: selectedRow.key, secondKey: row.key, keepKey: selectedRow.key });
    setMergeFieldSources({ name: 'primary', email: 'primary', phone: 'primary' });
  };

  const mergeReviewRows = useMemo(() => {
    if (!mergePair) return null;
    const first = rows.find((row) => row.key === mergePair.firstKey) ?? null;
    const second = rows.find((row) => row.key === mergePair.secondKey) ?? null;
    const keep = rows.find((row) => row.key === mergePair.keepKey) ?? null;
    const remove = keep?.key === first?.key ? second : first;
    if (!first?.customerId || !second?.customerId || !keep?.customerId || !remove?.customerId) return null;
    return { first, second, keep, remove };
  }, [mergePair, rows]);

  const mergeCustomerPair = async () => {
    if (!mergeReviewRows || merging || !canWriteCustomers) return;
    const rpcFieldSources = mergeFields.reduce<Record<string, 'primary' | 'duplicate'>>((sources, field) => {
      sources[field.rpcKey] = mergeFieldSources[field.key];
      return sources;
    }, {});

    setMerging(true);
    setError(null);

    try {
      await mergeCustomers(mergeReviewRows.keep.customerId, mergeReviewRows.remove.customerId, rpcFieldSources);
      setMergePair(null);
      await loadRows(mergeReviewRows.keep.customerId);
    } catch (err: any) {
      setError(err.message ?? 'Failed to merge customers.');
    } finally {
      setMerging(false);
    }
  };

  const runAutoLink = async () => {
    if (autoLinking || !canWriteCustomers) return;
    setAutoLinking(true);
    setAutoLinkResult('');
    setError(null);

    try {
      const result = await autoLinkCustomerActivities();
      const total = result.reduce((sum, row) => sum + row.linkedCount, 0);
      setAutoLinkResult(total ? result.map((row) => `${row.linkedCount} ${row.activityType}`).join(', ') : 'No high-confidence matches linked.');
      await loadRows();
    } catch (err: any) {
      setError(err.message ?? 'Failed to auto-link customer activity.');
    } finally {
      setAutoLinking(false);
    }
  };

  const resolveSharedPlate = async (licensePlate: string) => {
    if (!canWriteCustomers || resolvingPlate) return;
    setResolvingPlate(licensePlate);
    setError(null);

    try {
      await resolveLicensePlateConflict(licensePlate, 'shared');
      setPlateConflicts(await listLicensePlateConflicts());
    } catch (err: any) {
      setError(err.message ?? 'Failed to mark license plate as shared.');
    } finally {
      setResolvingPlate('');
    }
  };

  const movePlateToCustomer = async (licensePlate: string, customerId: string) => {
    if (!canWriteCustomers || resolvingPlate) return;
    const confirmed = window.confirm(`Move ${licensePlate} activity and ownership to this customer? Other active copies of this plate will be hidden.`);
    if (!confirmed) return;

    setResolvingPlate(licensePlate);
    setError(null);

    try {
      await resolveLicensePlateConflict(licensePlate, 'moved_to_customer', customerId);
      await loadRows(customerId);
      if (access?.isSuperAdmin) {
        setPlateConflicts(await listLicensePlateConflicts());
      }
    } catch (err: any) {
      setError(err.message ?? 'Failed to move license plate to customer.');
    } finally {
      setResolvingPlate('');
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Customer</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Customer overview and saved profile controls. Data is loaded manually so the tab always opens safely.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void loadRows();
            }}
            placeholder="Search name, email, phone, or plate"
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={loadRows} disabled={loading}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          {loading ? 'Loading...' : 'Load customers'}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setCreating(true);
            setSelectedKey(null);
          }}
          disabled={!canWriteCustomers}
        >
          <Plus className="mr-2 h-4 w-4" />
          New customer
        </Button>
        {access?.isSuperAdmin ? (
          <Button variant="outline" onClick={runAutoLink} disabled={autoLinking || loading || !canWriteCustomers}>
            <Link2 className="mr-2 h-4 w-4" />
            {autoLinking ? 'Linking...' : 'Auto-link'}
          </Button>
        ) : null}
      </div>

      {autoLinkResult ? (
        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          {autoLinkResult}
        </div>
      ) : null}

      <div className="rounded-lg border bg-background p-4">
        <div className="grid gap-3 lg:grid-cols-[160px_minmax(180px,1fr)_auto] lg:items-center">
          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as 'all' | CustomerStatus }))}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="all">All statuses</option>
            {CUSTOMER_STATUSES.map((status) => <option key={`customer-status-${status}`} value={status}>{status}</option>)}
          </select>
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.tag}
              onChange={(event) => setFilters((current) => ({ ...current, tag: event.target.value }))}
              placeholder={knownTags.length ? `Filter tag, e.g. ${knownTags[0]}` : 'Filter tag'}
              className="pl-9"
            />
          </div>
          {access?.isSuperAdmin ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.includeHidden}
                onChange={(event) => setFilters((current) => ({ ...current, includeHidden: event.target.checked }))}
              />
              Include hidden/deleted
            </label>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      ) : null}

      {mergeReviewRows ? (
        <div className="rounded-lg border bg-background p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <GitMerge className="h-4 w-4 text-primary" />
            Review customer merge
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {[mergeReviewRows.first, mergeReviewRows.second].map((row) => {
              const keep = mergePair?.keepKey === row.key;
              return (
                <label key={`merge-review-${row.key}`} className={`block rounded-md border p-3 ${keep ? 'border-primary bg-primary/5' : 'bg-muted/20'}`}>
                  <div className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="customer-merge-keep"
                      checked={keep}
                      onChange={() => setMergePair((current) => current ? { ...current, keepKey: row.key } : current)}
                      className="mt-1"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground">
                        {keep ? 'Keep this customer' : 'Merge this customer away'}
                      </div>
                      <div className="mt-1 truncate text-sm text-foreground">{row.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{row.email || 'No email'} / {row.phone || 'No phone'}</div>
                      <div className="mt-2 flex flex-wrap gap-1 text-xs">
                        <Badge variant="outline">{row.source === 'customer_record' ? 'Saved profile' : 'Activity only'}</Badge>
                        {row.accountId ? <Badge variant="outline">{row.portalEnabled ? 'Portal on' : 'Account linked'}</Badge> : null}
                        <Badge variant="outline">{row.bookingCount} bookings</Badge>
                        <Badge variant="outline">{row.orderCount} orders</Badge>
                        <Badge variant="outline">{row.invoiceCount} receipts</Badge>
                        <Badge variant="outline">{row.licensePlates.length} plates</Badge>
                        <Badge variant="outline">{row.benefitPoints} pts</Badge>
                      </div>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
          <div className="mt-4 rounded-md border bg-muted/20 p-3">
            <div className="mb-3 text-sm font-medium text-foreground">Information to use on the kept customer</div>
            <div className="grid gap-2">
              {mergeFields.map((field) => {
                const primaryValue = field.key === 'name'
                  ? mergeReviewRows.keep.name
                  : field.key === 'email'
                    ? mergeReviewRows.keep.email
                    : mergeReviewRows.keep.phone;
                const duplicateValue = field.key === 'name'
                  ? mergeReviewRows.remove.name
                  : field.key === 'email'
                    ? mergeReviewRows.remove.email
                    : mergeReviewRows.remove.phone;

                return (
                  <div key={`merge-field-${field.key}`} className="grid gap-2 rounded-md border bg-background p-2 md:grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)] md:items-center">
                    <div className="text-sm font-medium text-foreground">{field.label}</div>
                    <label className="flex min-w-0 items-start gap-2 text-sm">
                      <input
                        type="radio"
                        name={`merge-${field.key}`}
                        checked={mergeFieldSources[field.key] === 'primary'}
                        onChange={() => setMergeFieldSources((current) => ({ ...current, [field.key]: 'primary' }))}
                        className="mt-1"
                      />
                      <span className="min-w-0">
                        <span className="block text-xs text-muted-foreground">From kept customer</span>
                        <span className="block truncate">{primaryValue || '-'}</span>
                      </span>
                    </label>
                    <label className="flex min-w-0 items-start gap-2 text-sm">
                      <input
                        type="radio"
                        name={`merge-${field.key}`}
                        checked={mergeFieldSources[field.key] === 'duplicate'}
                        onChange={() => setMergeFieldSources((current) => ({ ...current, [field.key]: 'duplicate' }))}
                        className="mt-1"
                      />
                      <span className="min-w-0">
                        <span className="block text-xs text-muted-foreground">From merged customer</span>
                        <span className="block truncate">{duplicateValue || '-'}</span>
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            The kept customer remains active. The other customer is marked merged/hidden. Selected information above is written to the kept customer; notes, vehicles without duplicate plates, tags, and audit history are moved.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={mergeCustomerPair} disabled={merging || !canWriteCustomers}>
              {merging ? 'Merging...' : 'Confirm merge'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setMergePair(null)} disabled={merging}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(360px,440px)_minmax(0,1fr)]">
        <div className="space-y-4 xl:sticky xl:top-4 xl:self-start">
        {access?.isSuperAdmin && plateConflicts.length ? (
          <div className="rounded-lg border border-amber-300/60 bg-amber-50 p-4 text-amber-950">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <TriangleAlert className="h-4 w-4" />
              License plate conflicts
            </div>
            <div className="grid gap-2">
              {plateConflicts.slice(0, 6).map((conflict) => (
                <div key={conflict.licensePlate} className="rounded-md border border-amber-200 bg-white/70 px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium">{conflict.licensePlate} is linked to {conflict.customerCount} active customers</div>
                    {conflict.resolution === 'shared' ? <Badge variant="outline">Shared allowed</Badge> : null}
                  </div>
                  <div className="mt-1 text-xs">
                    {conflict.customers.map((customer) => customer.fullName || customer.email || customer.phone || customer.customerId).join(' / ')}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => resolveSharedPlate(conflict.licensePlate)}
                      disabled={!canWriteCustomers || resolvingPlate === conflict.licensePlate}
                    >
                      Allow shared
                    </Button>
                    {conflict.customers.map((customer) => (
                      <Button
                        key={`${conflict.licensePlate}-${customer.customerId}`}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => movePlateToCustomer(conflict.licensePlate, customer.customerId)}
                        disabled={!canWriteCustomers || resolvingPlate === conflict.licensePlate}
                      >
                        Move to {customer.fullName || customer.email || customer.phone || customer.customerId.slice(0, 8)}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-lg border bg-background">
          <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
            <div>
              <h4 className="text-sm font-semibold text-foreground">Customer list</h4>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {loaded ? `${rows.length} records loaded` : 'Load records to begin'}
              </p>
            </div>
            {loading ? <Badge variant="outline">Loading</Badge> : null}
          </div>
          <div className="max-h-[760px] overflow-y-auto">
            {rows.length === 0 ? (
              <div className="px-4 py-8 text-sm text-muted-foreground">
                {loaded ? 'No customer records found.' : 'Click Load customers to fetch records.'}
              </div>
            ) : rows.map((row) => (
              <button
                key={row.key}
                type="button"
                onClick={() => {
                  setSelectedKey(row.key);
                  setCreating(false);
                }}
                className={`block w-full border-b px-4 py-3 text-left text-sm last:border-b-0 ${
                  !creating && selectedRow?.key === row.key ? 'bg-primary/10 ring-1 ring-inset ring-primary/30' : 'hover:bg-muted/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-foreground">{row.name}</div>
                    <div className="mt-1 flex flex-wrap gap-1 text-xs text-muted-foreground">
                      <span>{row.source === 'customer_record' ? 'Saved profile' : 'From activity'}</span>
                      {row.hidden ? <span>Hidden</span> : null}
                      {row.accountId ? <span>{row.portalEnabled ? 'Portal on' : 'Account linked'}</span> : null}
                    </div>
                  </div>
                  <Badge variant={row.status === 'blocked' || row.status === 'deleted' ? 'destructive' : 'secondary'}>{row.status}</Badge>
                </div>

                <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                  <div className="min-w-0">
                    <div className="truncate">{row.email || 'No email'}</div>
                    <div className="truncate">{row.phone || 'No phone'}</div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {row.licensePlates.slice(0, 3).map((plate) => (
                      <Badge key={`${row.key}-${plate}`} variant="outline">{plate}</Badge>
                    ))}
                    {row.licensePlates.length > 3 ? <Badge variant="outline">+{row.licensePlates.length - 3}</Badge> : null}
                    {row.licensePlates.length === 0 ? <span>No plates</span> : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <Badge variant="outline" className="gap-1">
                      <BadgePercent className="h-3 w-3" />
                      {row.benefitPoints} pts
                    </Badge>
                    {row.benefitTier ? <Badge variant="outline" className="capitalize">{row.benefitTier}</Badge> : null}
                    {row.tags.slice(0, 2).map((tag) => <Badge key={`${row.key}-${tag}`} variant="outline">{tag}</Badge>)}
                  </div>
                  <div>{row.bookingCount} bookings / {row.orderCount} orders / {row.invoiceCount} receipts</div>
                  <div>Last activity: {formatDate(row.lastActivityAt)}</div>
                </div>
                {canWriteCustomers && selectedRow?.customerId && row.customerId && row.customerId !== selectedRow.customerId ? (
                  <div className="mt-3 border-t pt-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={(event) => {
                        event.stopPropagation();
                        startMergeReview(row);
                      }}
                      disabled={merging}
                    >
                      Review merge
                    </Button>
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {selectedRow?.customerId && duplicateCandidates.length ? (
          <div className="rounded-lg border bg-background p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <GitMerge className="h-4 w-4 text-primary" />
              Possible duplicates
            </div>
            <div className="grid gap-2">
              {duplicateCandidates.map((candidate) => (
                <div key={`duplicate-${candidate.key}`} className="flex flex-col gap-2 rounded-md border px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{candidate.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{candidate.email || candidate.phone || candidate.licensePlates[0] || 'Saved customer'}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => startMergeReview(candidate)} disabled={merging || !canWriteCustomers}>
                    Review merge
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        </div>

        <div className="min-w-0">
          {creating || selectedRow ? (
            <CustomerEditorPanel
              overviewRow={creating ? null : selectedRow}
              onSaved={refreshAfterSave}
              canWriteCustomers={canWriteCustomers}
            />
          ) : (
          <div className="rounded-lg border bg-background p-5">
            <div className="text-sm text-muted-foreground">
              Load customers, select a row, or create a new saved profile.
            </div>
          </div>
          )}
        </div>
      </div>
    </section>
  );
}
