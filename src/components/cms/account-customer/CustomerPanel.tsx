import React, { useState } from 'react';
import { AlertCircle, RefreshCcw, Search } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { listCustomerOverview } from './api';
import { formatDate } from './safe';
import type { CustomerOverviewRow } from './types';

export function CustomerPanel() {
  const [rows, setRows] = useState<CustomerOverviewRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRows = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const nextRows = await listCustomerOverview(search);
      setRows(nextRows);
      setLoaded(true);
    } catch (err: any) {
      setRows([]);
      setLoaded(true);
      setError(err.message ?? 'Failed to load customer records.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Customer</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Read-only customer overview. Data is loaded manually so the tab always opens safely.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
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
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border">
        <div className="grid min-w-[860px] grid-cols-[minmax(180px,1.4fr)_minmax(180px,1fr)_minmax(140px,.8fr)_minmax(170px,.9fr)_120px] border-b bg-muted/40 px-4 py-3 text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
          <span>Customer</span>
          <span>Contact</span>
          <span>Vehicle</span>
          <span>Activity</span>
          <span>Status</span>
        </div>
        <div className="max-h-[620px] min-w-[860px] overflow-y-auto">
          {rows.length === 0 ? (
            <div className="px-4 py-8 text-sm text-muted-foreground">
              {loaded ? 'No customer records found.' : 'Click Load customers to fetch records.'}
            </div>
          ) : rows.map((row) => (
            <div key={row.key} className="grid grid-cols-[minmax(180px,1.4fr)_minmax(180px,1fr)_minmax(140px,.8fr)_minmax(170px,.9fr)_120px] items-center border-b px-4 py-3 text-sm last:border-b-0">
              <div className="min-w-0">
                <div className="truncate font-medium">{row.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{row.source === 'customer_record' ? 'Saved profile' : 'From activity'}</div>
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
              <Badge variant={row.status === 'blocked' ? 'destructive' : 'secondary'}>{row.status}</Badge>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
