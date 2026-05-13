import React, { useEffect, useState } from 'react';
import { MailCheck, RefreshCw } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { listCustomerNotificationHistory } from './api';
import { formatDate } from './safe';
import type { CustomerNotificationHistoryRow, CustomerVehicleRow } from './types';

type CustomerNotificationHistoryPanelProps = {
  customerId: string;
  vehicles: CustomerVehicleRow[];
};

function statusVariant(status: CustomerNotificationHistoryRow['status']): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'sent') return 'default';
  if (status === 'failed') return 'destructive';
  if (status === 'cancelled') return 'secondary';
  return 'outline';
}

function summarizeDetails(details: Record<string, unknown>) {
  const keys = Object.keys(details).filter((key) => details[key] !== null && details[key] !== undefined);
  if (keys.length === 0) return '';

  return keys
    .slice(0, 4)
    .map((key) => {
      const value = details[key];
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return `${key}: ${String(value)}`;
      }
      return `${key}: ${JSON.stringify(value)}`;
    })
    .join(' | ');
}

export function CustomerNotificationHistoryPanel({ customerId, vehicles }: CustomerNotificationHistoryPanelProps) {
  const [rows, setRows] = useState<CustomerNotificationHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadRows = async () => {
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      setRows(await listCustomerNotificationHistory(customerId));
    } catch (err: any) {
      setError(err.message ?? 'Failed to load notification history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRows();
    // customerId intentionally drives reload; loadRows captures current state only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  return (
    <div className="space-y-3 border-t pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MailCheck className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-foreground">Notification history</h4>
        </div>
        <Button variant="outline" size="sm" onClick={loadRows} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notification history saved.</p>
      ) : rows.map((row) => {
        const vehicle = vehicles.find((item) => item.id === row.customerVehicleId);
        const details = summarizeDetails(row.details);

        return (
          <div key={row.id} className="rounded-md border px-3 py-3 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{row.subject || row.notificationType || 'Notification'}</span>
                  <Badge variant={statusVariant(row.status)} className="capitalize">{row.status}</Badge>
                  <Badge variant="outline" className="capitalize">{row.channel}</Badge>
                  {vehicle ? <Badge variant="secondary">{vehicle.licensePlate}</Badge> : null}
                </div>
                <p className="mt-1 break-all text-xs text-muted-foreground">
                  {row.recipient || 'No recipient'} {row.providerMessageId ? `- Provider ID ${row.providerMessageId}` : ''}
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>Created {formatDate(row.createdAt)}</p>
                <p>Sent {formatDate(row.sentAt)}</p>
              </div>
            </div>
            {row.notificationType ? <p className="mt-2 text-xs text-muted-foreground">Type: {row.notificationType}</p> : null}
            {details ? <p className="mt-2 break-words text-xs text-muted-foreground">Details: {details}</p> : null}
            {row.reminderId ? <p className="mt-2 break-all text-xs text-muted-foreground">Reminder ID: {row.reminderId}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
