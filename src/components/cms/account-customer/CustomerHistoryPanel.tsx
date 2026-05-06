import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarClock, FileText, History, Package, ReceiptText, RefreshCcw, Unlink } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { getCustomerHistory, unlinkCustomerActivity } from './api';
import { formatDate, formatMoney } from './safe';
import type { CustomerActivityType, CustomerHistory } from './types';

type HistoryTab = 'bookings' | 'orders' | 'invoices' | 'rescue' | 'audit';

type CustomerHistoryPanelProps = {
  customerId: string;
};

const emptyHistory: CustomerHistory = {
  bookings: [],
  orders: [],
  invoices: [],
  rescue: [],
  events: [],
};

function cmsHref(path: string) {
  return path;
}

export function CustomerHistoryPanel({ customerId }: CustomerHistoryPanelProps) {
  const [history, setHistory] = useState<CustomerHistory>(emptyHistory);
  const [activeTab, setActiveTab] = useState<HistoryTab>('bookings');
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlinkingKey, setUnlinkingKey] = useState<string | null>(null);

  const counts = useMemo(() => ({
    bookings: history.bookings.length,
    orders: history.orders.length,
    invoices: history.invoices.length,
    rescue: history.rescue.length,
    audit: history.events.length,
  }), [history]);

  const loadHistory = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const nextHistory = await getCustomerHistory(customerId);
      setHistory(nextHistory);
      setLoaded(true);
    } catch (err: any) {
      setHistory(emptyHistory);
      setLoaded(true);
      setError(err.message ?? 'Failed to load customer history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setHistory(emptyHistory);
    setLoaded(false);
    setActiveTab('bookings');
    void loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const renderEmpty = (label: string) => (
    <p className="px-3 py-4 text-sm text-muted-foreground">
      {loaded ? `No ${label} found.` : 'Loading history...'}
    </p>
  );

  const unlinkActivity = async (activityType: CustomerActivityType, activityId: string) => {
    const key = `${activityType}-${activityId}`;
    if (unlinkingKey) return;
    setUnlinkingKey(key);
    setError(null);

    try {
      await unlinkCustomerActivity(activityType, activityId);
      await loadHistory();
    } catch (err: any) {
      setError(err.message ?? 'Failed to unlink activity.');
    } finally {
      setUnlinkingKey(null);
    }
  };

  const renderLinkBadges = (activityType: CustomerActivityType, activityId: string, customerId: string | null, matchSource: string, linkedAt: string | null) => {
    if (!customerId) return null;
    const key = `${activityType}-${activityId}`;
    return (
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{matchSource || 'linked'}</Badge>
        {linkedAt ? <span className="text-xs text-muted-foreground">Linked {formatDate(linkedAt)}</span> : null}
        <Button size="sm" variant="ghost" onClick={() => unlinkActivity(activityType, activityId)} disabled={Boolean(unlinkingKey)}>
          <Unlink className="mr-2 h-4 w-4" />
          {unlinkingKey === key ? 'Unlinking...' : 'Unlink'}
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-3 border-t pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-foreground">History</h4>
        </div>
        <Button size="sm" variant="outline" onClick={loadHistory} disabled={loading}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'bookings' as const, label: 'Bookings', icon: CalendarClock },
          { id: 'orders' as const, label: 'Orders', icon: Package },
          { id: 'invoices' as const, label: 'Receipts', icon: ReceiptText },
          { id: 'rescue' as const, label: 'Rescue', icon: AlertCircle },
          { id: 'audit' as const, label: 'Audit log', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm ${
                activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              <span className="text-xs opacity-80">{counts[tab.id]}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border">
        {activeTab === 'bookings' ? (
          history.bookings.length === 0 ? renderEmpty('bookings') : history.bookings.map((booking) => (
            <div key={booking.id} className="border-b px-3 py-3 text-sm last:border-b-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{booking.serviceName || 'Booking'}</span>
                <Badge variant="outline">{booking.status || 'unknown'}</Badge>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {booking.bookingDate || '-'} {booking.bookingTime || ''} · {booking.licensePlate || 'No plate'}
              </div>
              <div className="mt-2">
                <a className="text-xs font-medium text-primary hover:underline" href={cmsHref('/cms')}>
                  Open schedule
                </a>
              </div>
              {renderLinkBadges('booking', booking.id, booking.customerId, booking.customerMatchSource, booking.customerLinkedAt)}
            </div>
          ))
        ) : null}

        {activeTab === 'orders' ? (
          history.orders.length === 0 ? renderEmpty('orders') : history.orders.map((order) => (
            <div key={order.id} className="border-b px-3 py-3 text-sm last:border-b-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{order.itemLabel || `Order ${order.id.slice(0, 8)}`}</span>
                <Badge variant="outline">{order.status || order.paytrailStatus || 'unknown'}</Badge>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {formatDate(order.createdAt)} · {formatMoney(order.totalCents)}
              </div>
              <div className="mt-2">
                <a className="text-xs font-medium text-primary hover:underline" href={cmsHref('/cms/orders')}>
                  Open orders
                </a>
              </div>
              {renderLinkBadges('order', order.id, order.customerId, order.customerMatchSource, order.customerLinkedAt)}
            </div>
          ))
        ) : null}

        {activeTab === 'invoices' ? (
          history.invoices.length === 0 ? renderEmpty('receipts') : history.invoices.map((invoice) => (
            <div key={invoice.id} className="border-b px-3 py-3 text-sm last:border-b-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{invoice.documentNumber || `Receipt ${invoice.id.slice(0, 8)}`}</span>
                <Badge variant="outline">{invoice.status || invoice.paymentStatus || 'unknown'}</Badge>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {formatDate(invoice.createdAt)} · {formatMoney(invoice.totalCents)}
              </div>
              <div className="mt-2">
                <a className="text-xs font-medium text-primary hover:underline" href={cmsHref('/cms/invoices')}>
                  Open receipts
                </a>
              </div>
              {renderLinkBadges('invoice', invoice.id, invoice.customerId, invoice.customerMatchSource, invoice.customerLinkedAt)}
            </div>
          ))
        ) : null}

        {activeTab === 'rescue' ? (
          history.rescue.length === 0 ? renderEmpty('rescue requests') : history.rescue.map((request) => (
            <div key={request.id} className="border-b px-3 py-3 text-sm last:border-b-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{request.customerName || `Rescue ${request.id}`}</span>
                <Badge variant="outline">{request.status || 'unknown'}</Badge>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {formatDate(request.createdAt)} · {request.licensePlate || 'No plate'} · {request.city || request.phone || '-'}
              </div>
              <div className="mt-2">
                <a className="text-xs font-medium text-primary hover:underline" href={cmsHref('/cms/rescue')}>
                  Open rescue
                </a>
              </div>
              {renderLinkBadges('rescue', request.id, request.customerId, request.customerMatchSource, request.customerLinkedAt)}
            </div>
          ))
        ) : null}

        {activeTab === 'audit' ? (
          history.events.length === 0 ? renderEmpty('audit events') : history.events.map((event) => (
            <div key={event.id} className="border-b px-3 py-3 text-sm last:border-b-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{event.eventType}</span>
                <span className="text-xs text-muted-foreground">{formatDate(event.createdAt)}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Actor: {event.actorEmail || event.actorId || 'system'}
              </div>
              {Object.keys(event.details).length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.entries(event.details).slice(0, 6).map(([key, value]) => (
                    <Badge key={`${event.id}-${key}`} variant="outline">{key}: {String(value)}</Badge>
                  ))}
                </div>
              ) : null}
            </div>
          ))
        ) : null}
      </div>
    </div>
  );
}
