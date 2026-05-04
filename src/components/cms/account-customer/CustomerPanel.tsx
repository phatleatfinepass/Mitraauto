import React, { useMemo, useState } from 'react';
import { AlertCircle, Filter, GitMerge, Plus, RefreshCcw, Search } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { useCmsAccess } from '../CmsAccessContext';
import { CUSTOMER_STATUSES } from './constants';
import { listCustomerOverview, mergeCustomers } from './api';
import { CustomerEditorPanel } from './CustomerEditorPanel';
import { formatDate } from './safe';
import type { CustomerOverviewFilters, CustomerOverviewRow, CustomerStatus } from './types';

export function CustomerPanel() {
  const access = useCmsAccess();
  const [rows, setRows] = useState<CustomerOverviewRow[]>([]);
  const [filters, setFilters] = useState<CustomerOverviewFilters>({
    search: '',
    status: 'all',
    tag: '',
    includeHidden: false,
  });
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

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

  const loadRows = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const nextRows = await listCustomerOverview(filters);
      setRows(nextRows);
      setSelectedKey((current) => current && nextRows.some((row) => row.key === current) ? current : nextRows[0]?.key ?? null);
      setLoaded(true);
    } catch (err: any) {
      setRows([]);
      setSelectedKey(null);
      setLoaded(true);
      setError(err.message ?? 'Failed to load customer records.');
    } finally {
      setLoading(false);
    }
  };

  const refreshAfterSave = async () => {
    await loadRows();
    setCreating(false);
  };

  const mergeIntoSelected = async (duplicateCustomerId: string) => {
    if (!selectedRow?.customerId || merging) return;
    setMerging(true);
    setError(null);

    try {
      await mergeCustomers(selectedRow.customerId, duplicateCustomerId);
      await loadRows();
    } catch (err: any) {
      setError(err.message ?? 'Failed to merge customers.');
    } finally {
      setMerging(false);
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
        >
          <Plus className="mr-2 h-4 w-4" />
          New customer
        </Button>
      </div>

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

      <div className="grid gap-6 2xl:grid-cols-[minmax(620px,1fr)_minmax(460px,640px)]">
        <div className="space-y-4">
        <div className="overflow-hidden rounded-lg border">
          <div className="grid min-w-[860px] grid-cols-[minmax(180px,1.4fr)_minmax(180px,1fr)_minmax(140px,.8fr)_minmax(170px,.9fr)_120px] border-b bg-muted/40 px-4 py-3 text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
            <span>Customer</span>
            <span>Contact</span>
            <span>Vehicle</span>
            <span>Activity</span>
            <span>Status</span>
          </div>
          <div className="max-h-[720px] min-w-[860px] overflow-y-auto">
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
                className={`grid w-full grid-cols-[minmax(180px,1.4fr)_minmax(180px,1fr)_minmax(140px,.8fr)_minmax(170px,.9fr)_120px] items-center border-b px-4 py-3 text-left text-sm last:border-b-0 ${
                  !creating && selectedRow?.key === row.key ? 'bg-primary/10' : 'hover:bg-muted/60'
                }`}
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{row.name}</div>
                  <div className="mt-1 flex flex-wrap gap-1 text-xs text-muted-foreground">
                    <span>{row.source === 'customer_record' ? 'Saved profile' : 'From activity'}</span>
                    {row.hidden ? <span>Hidden</span> : null}
                  </div>
                </div>
                <div className="min-w-0 text-muted-foreground">
                  <div className="truncate">{row.email || '-'}</div>
                  <div className="truncate">{row.phone || '-'}</div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {row.licensePlates.slice(0, 3).map((plate) => (
                    <Badge key={`${row.key}-${plate}`} variant="outline">{plate}</Badge>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  <div>{row.bookingCount} bookings / {row.orderCount} orders</div>
                  <div>{row.invoiceCount} receipts</div>
                  <div>{formatDate(row.lastActivityAt)}</div>
                </div>
                <div className="flex flex-col items-start gap-1">
                  <Badge variant={row.status === 'blocked' || row.status === 'deleted' ? 'destructive' : 'secondary'}>{row.status}</Badge>
                  {row.tags.slice(0, 2).map((tag) => <Badge key={`${row.key}-${tag}`} variant="outline">{tag}</Badge>)}
                </div>
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
                  <Button size="sm" variant="outline" onClick={() => candidate.customerId && mergeIntoSelected(candidate.customerId)} disabled={merging}>
                    Merge into selected
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        </div>

        {creating || selectedRow ? (
          <CustomerEditorPanel overviewRow={creating ? null : selectedRow} onSaved={refreshAfterSave} />
        ) : (
          <div className="rounded-lg border bg-background p-5">
            <div className="text-sm text-muted-foreground">
              Load customers, select a row, or create a new saved profile.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
