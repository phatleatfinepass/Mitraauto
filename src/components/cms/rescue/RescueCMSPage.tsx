import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CarFront,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  RefreshCcw,
  Save,
  Search,
  ShieldAlert,
  User,
  X,
} from 'lucide-react';
import { supabase } from '../../../utils/supabase/client';
import { useLanguage } from '../../../i18n/LanguageContext';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '../../ui/drawer';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';

type RescueStatus = 'received' | 'assigned' | 'resolved' | 'canceled';
type RescueStatusFilter = 'all' | RescueStatus;

type RescueRequestRow = {
  id: number;
  user_id: string | null;
  customer_name?: string | null;
  license_plate?: string | null;
  lat: string | number | null;
  lng: string | number | null;
  street_address: string | null;
  postcode: string | null;
  city: string | null;
  phone: string;
  source: string | null;
  status: string;
  assigned_to: string | null;
  priority: number;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
};

type RescueEventRow = {
  id: number;
  request_id: number;
  event_type: string;
  meta: Record<string, unknown> | null;
  created_at: string;
};

const REFRESH_INTERVAL_MS = 30_000;
const STATUS_ORDER: RescueStatus[] = ['received', 'assigned', 'resolved', 'canceled'];
const RESCUE_PROGRESS_ORDER: RescueStatus[] = ['received', 'assigned', 'resolved'];
const STATUS_LABELS: Record<RescueStatus, string> = {
  received: 'Received',
  assigned: 'Assigned',
  resolved: 'Resolved',
  canceled: 'Canceled',
};

const RESCUE_SKELETON_ROWS = 6;
const PRESSABLE_CARD_CLASS = 'transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.99]';

function formatDateTime(value: string | null | undefined) {
  if (!value) return 'Unknown';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

function formatRelative(value: string | null | undefined) {
  if (!value) return 'Unknown';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const diffMs = Date.now() - parsed.getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} h ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} d ago`;
}

function formatRefreshStamp(value: Date | null) {
  if (!value) return 'Not refreshed yet';
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(value);
}

function getCaseAgeMinutes(value: string | null | undefined) {
  if (!value) return 0;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 0;
  return Math.max(0, Math.round((Date.now() - parsed.getTime()) / 60000));
}

function formatPriorityLabel(priority: number | null | undefined) {
  const value = Number(priority ?? 0);
  if (value >= 5) return 'Critical';
  if (value >= 4) return 'High';
  if (value >= 2) return 'Watch';
  return 'Routine';
}

function formatSourceLabel(source: string | null | undefined) {
  if (!source) return 'Unknown';
  if (source === 'gps') return 'GPS';
  if (source === 'manual') return 'Manual address';
  return source;
}

function formatLocation(request: RescueRequestRow) {
  const parts = [request.street_address, request.postcode, request.city]
    .map((value) => value?.trim())
    .filter(Boolean);

  if (parts.length > 0) return parts.join(', ');
  if (request.lat !== null && request.lng !== null) return `${request.lat}, ${request.lng}`;
  return 'Location missing';
}

function appendActionNote(notes: string | null | undefined, text: string) {
  const stamp = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
  const line = `[${stamp}] ${text}`;
  const existing = (notes ?? '').trim();
  return existing ? `${existing}\n${line}` : line;
}

function normalizeStatus(value: string | null | undefined): RescueStatus {
  const candidate = (value ?? '').toLowerCase() as RescueStatus;
  return STATUS_ORDER.includes(candidate) ? candidate : 'received';
}

function getStatusTone(status: string | null | undefined) {
  switch (normalizeStatus(status)) {
    case 'received':
      return 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300';
    case 'assigned':
      return 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300';
    case 'resolved':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
    case 'canceled':
      return 'border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300';
    default:
      return 'border-border bg-muted text-foreground';
  }
}

function getPriorityTone(priority: number | null | undefined) {
  const value = Number(priority ?? 0);
  if (value >= 5) return 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300';
  if (value >= 4) return 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300';
  if (value >= 2) return 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300';
  return 'border-border bg-muted text-muted-foreground';
}

function getStatusDotTone(status: string | null | undefined) {
  switch (normalizeStatus(status)) {
    case 'received':
      return 'bg-red-500';
    case 'assigned':
      return 'bg-blue-500';
    case 'resolved':
      return 'bg-emerald-500';
    case 'canceled':
      return 'bg-zinc-500';
    default:
      return 'bg-muted-foreground';
  }
}

function getQueuePriorityScore(request: RescueRequestRow) {
  const statusWeight = normalizeStatus(request.status) === 'received'
    ? 100
    : normalizeStatus(request.status) === 'assigned'
      ? 50
      : 0;
  return statusWeight + Number(request.priority ?? 0) * 10 + Math.max(0, 60 - Math.round((Date.now() - new Date(request.created_at).getTime()) / 60000));
}

function QueueSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: RESCUE_SKELETON_ROWS }).map((_, index) => (
        <div key={index} className="px-4 py-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.85fr)_140px] xl:items-center">
            <div className="min-w-0 space-y-3">
              <div className="h-4 w-44 animate-pulse rounded bg-muted" />
              <div className="flex gap-2">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-3 w-28 animate-pulse rounded bg-muted" />
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="min-w-0 space-y-3">
              <div className="h-4 w-full max-w-[360px] animate-pulse rounded bg-muted" />
              <div className="flex gap-2">
                <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
                <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
              </div>
            </div>
            <div className="h-10 w-28 animate-pulse rounded-md bg-muted xl:ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EventMeta({ meta }: { meta: Record<string, unknown> | null }) {
  if (!meta || Object.keys(meta).length === 0) {
    return <p className="mt-1 text-sm text-muted-foreground">No additional details.</p>;
  }

  return (
    <div className="mt-2 space-y-1">
      {Object.entries(meta).map(([key, value]) => (
        <p key={key} className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{key.replace(/_/g, ' ')}:</span>{' '}
          {typeof value === 'string' || typeof value === 'number' ? String(value) : JSON.stringify(value)}
        </p>
      ))}
    </div>
  );
}

function WorkflowRail({ status }: { status: RescueStatus }) {
  if (status === 'canceled') {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
        This case is canceled. Keep notes complete, but do not move it through the normal rescue flow.
      </div>
    );
  }

  const currentIndex = RESCUE_PROGRESS_ORDER.indexOf(status);

  return (
    <div className="grid gap-2 md:grid-cols-3">
      {RESCUE_PROGRESS_ORDER.map((step, index) => {
        const complete = index < currentIndex;
        const current = index === currentIndex;
        return (
          <div
            key={step}
            className={`rounded-xl border px-3 py-3 transition-[background-color,border-color] duration-150 ease-out ${
              complete
                ? 'border-border bg-muted/40'
                : current
                  ? 'border-foreground/20 bg-background'
                  : 'border-border bg-background'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[11px] font-semibold ${
                  complete
                    ? 'border-border bg-card text-foreground'
                    : current
                      ? 'border-foreground/20 bg-foreground text-background'
                      : 'border-border bg-muted text-muted-foreground'
                }`}
              >
                {complete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
              </div>
              <span className="text-[13px] font-medium leading-5 text-foreground">{STATUS_LABELS[step]}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InfoGrid({
  items,
}: {
  items: Array<{ label: string; value: React.ReactNode }>;
}) {
  return (
    <dl className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd className="text-sm font-medium leading-5 text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SectionBlock({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b px-5 py-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

export function RescueCMSPage() {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<RescueRequestRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<RescueStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [events, setEvents] = useState<RescueEventRow[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsAvailable, setEventsAvailable] = useState(true);
  const [lastLoadedAt, setLastLoadedAt] = useState<Date | null>(null);
  const [editor, setEditor] = useState({
    status: 'received',
    priority: '0',
    internalNotes: '',
    assignedTo: '',
  });

  const statusOptions = useMemo(() => STATUS_ORDER, []);

  const loadRequests = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError('');

    try {
      const [{ data: authData }, { data, error: queryError }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('emergency_requests').select('*').order('created_at', { ascending: false }),
      ]);

      if (queryError) throw queryError;

      setCurrentUserEmail(authData.user?.email ?? '');
      const nextRows = (data ?? []) as RescueRequestRow[];
      setRequests(nextRows);
      setLastLoadedAt(new Date());
      setSelectedId((currentSelected) => {
        if (currentSelected && nextRows.some((row) => row.id === currentSelected)) return currentSelected;
        return null;
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to load rescue requests.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests('initial');
    const intervalId = window.setInterval(() => {
      void loadRequests('refresh');
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [loadRequests]);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return requests.filter((request) => {
      const statusMatches = statusFilter === 'all' || normalizeStatus(request.status) === statusFilter;
      if (!statusMatches) return false;
      if (!normalizedQuery) return true;

      const haystack = [
        request.customer_name,
        request.license_plate,
        request.phone,
        request.street_address,
        request.postcode,
        request.city,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    }).sort((a, b) => getQueuePriorityScore(b) - getQueuePriorityScore(a));
  }, [requests, searchQuery, statusFilter]);

  const selectedRequest = useMemo(
    () => requests.find((request) => request.id === selectedId) ?? null,
    [requests, selectedId],
  );

  useEffect(() => {
    if (!selectedRequest) {
      setEditor({
        status: 'received',
        priority: '0',
        internalNotes: '',
        assignedTo: '',
      });
      return;
    }

    setEditor({
      status: normalizeStatus(selectedRequest.status),
      priority: String(selectedRequest.priority ?? 0),
      internalNotes: selectedRequest.internal_notes ?? '',
      assignedTo: selectedRequest.assigned_to ?? '',
    });
  }, [selectedRequest]);

  const loadEvents = useCallback(async (requestId: number) => {
    setEventsLoading(true);

    try {
      const { data, error: queryError } = await supabase
        .from('emergency_request_events')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      setEvents((data ?? []) as RescueEventRow[]);
      setEventsAvailable(true);
    } catch (err) {
      console.error(err);
      setEvents([]);
      setEventsAvailable(false);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedRequest) {
      setEvents([]);
      return;
    }

    void loadEvents(selectedRequest.id);
  }, [loadEvents, selectedRequest]);

  const summary = useMemo(() => {
    const counts = STATUS_ORDER.reduce<Record<RescueStatus, number>>(
      (acc, status) => ({ ...acc, [status]: 0 }),
      {
        received: 0,
        assigned: 0,
        resolved: 0,
        canceled: 0,
      },
    );

    requests.forEach((request) => {
      counts[normalizeStatus(request.status)] += 1;
    });

    return counts;
  }, [requests]);

  const activeQueueCount = summary.received + summary.assigned;
  const highestPriorityRequest = useMemo(() => {
    return [...requests]
      .filter((request) => normalizeStatus(request.status) === 'received' || normalizeStatus(request.status) === 'assigned')
      .sort((a, b) => getQueuePriorityScore(b) - getQueuePriorityScore(a))[0] ?? null;
  }, [requests]);

  const logEvent = useCallback(async (requestId: number, eventType: string, meta: Record<string, unknown>) => {
    try {
      const { error: insertError } = await supabase.from('emergency_request_events').insert({
        request_id: requestId,
        event_type: eventType,
        meta,
      });

      if (insertError) throw insertError;
    } catch (err) {
      console.error('Failed to log rescue event', err);
    }
  }, []);

  const persistRequest = useCallback(async (nextStatus?: RescueStatus) => {
    if (!selectedRequest) return;

    setSaving(true);
    setSaveMessage('');
    setError('');

    const status = nextStatus ?? (editor.status as RescueStatus);
    const notes =
      nextStatus && nextStatus !== normalizeStatus(selectedRequest.status)
        ? appendActionNote(editor.internalNotes, `Status changed to ${STATUS_LABELS[nextStatus]}.`)
        : editor.internalNotes;

    try {
      const updatePayload = {
        status,
        priority: Number(editor.priority) || 0,
        internal_notes: notes.trim() || null,
        assigned_to: selectedRequest.assigned_to ?? null,
      };

      const { data, error: updateError } = await supabase
        .from('emergency_requests')
        .update(updatePayload)
        .eq('id', selectedRequest.id)
        .select('*')
        .single();

      if (updateError) throw updateError;

      setRequests((current) => current.map((request) => (
        request.id === selectedRequest.id ? { ...(data as RescueRequestRow) } : request
      )));
      setEditor((current) => ({
        ...current,
        status,
        internalNotes: notes,
      }));

      const previousStatus = normalizeStatus(selectedRequest.status);
      if (status !== previousStatus) {
        await logEvent(selectedRequest.id, status, {
          previous_status: previousStatus,
          updated_by: currentUserEmail || 'admin',
        });
      } else {
        await logEvent(selectedRequest.id, 'case_updated', {
          updated_by: currentUserEmail || 'admin',
        });
      }

      setSaveMessage(t('rescueCms.caseSaved'));
      await loadEvents(selectedRequest.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to save rescue request.');
    } finally {
      setSaving(false);
    }
  }, [currentUserEmail, editor.assignedTo, editor.internalNotes, editor.priority, editor.status, loadEvents, logEvent, selectedRequest, t]);

  const selectedStatus = normalizeStatus(selectedRequest?.status);
  const selectedStatusIndex = RESCUE_PROGRESS_ORDER.indexOf(selectedStatus);
  const nextStatus = selectedStatusIndex >= 0 && selectedStatusIndex < RESCUE_PROGRESS_ORDER.length - 1
    ? RESCUE_PROGRESS_ORDER[selectedStatusIndex + 1]
    : null;
  const selectedCompletionText = selectedStatus === 'canceled'
    ? 'This emergency case was canceled.'
    : 'This emergency case has reached the garage. Later service management can continue from here.';
  const mapsHref = selectedRequest
    ? selectedRequest.lat !== null && selectedRequest.lng !== null
      ? `https://www.google.com/maps?q=${selectedRequest.lat},${selectedRequest.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatLocation(selectedRequest))}`
    : null;
  const phoneHref = selectedRequest ? `tel:${selectedRequest.phone.replace(/\s+/g, '')}` : null;

  return (
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="right">
      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="h-1 bg-red-500" />
          <div className="p-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-stretch">
              <div className="flex min-w-0 flex-col justify-between gap-5">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-700 dark:text-red-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Live dispatch
                  </div>
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Rescue 24/7</h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                    Triage emergency intake, assign response, call the customer, open pickup location, and close the case from one queue.
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Last refreshed {formatRefreshStamp(lastLoadedAt)}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_0.85fr_0.85fr]">
                  <div className="rounded-xl border bg-muted/20 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Active queue</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{activeQueueCount}</p>
                  </div>
                  <div className="rounded-xl border bg-muted/20 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Highest priority</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{highestPriorityRequest?.priority ?? '-'}</p>
                  </div>
                  <div className="rounded-xl border bg-muted/20 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Visible cases</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{filteredRequests.length}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-background p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Next case to watch</p>
                {highestPriorityRequest ? (
                  <div className="mt-3 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-foreground">
                          {highestPriorityRequest.customer_name?.trim() || 'Unnamed customer'}
                        </p>
                        <p className="mt-1 font-mono text-sm text-muted-foreground">
                          {highestPriorityRequest.license_plate?.trim() || 'Plate missing'}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${getPriorityTone(highestPriorityRequest.priority)}`}>
                        {formatPriorityLabel(highestPriorityRequest.priority)}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{formatLocation(highestPriorityRequest)}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      Waiting {formatRelative(highestPriorityRequest.created_at)}
                    </div>
                    <Button
                      type="button"
                      className="h-11 w-full justify-center active:scale-[0.98]"
                      onClick={() => {
                        setSelectedId(highestPriorityRequest.id);
                        setDrawerOpen(true);
                      }}
                    >
                      Open priority case
                    </Button>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">No active rescue case needs attention.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.15fr_1fr_0.9fr_0.9fr]">
          {STATUS_ORDER.map((status) => (
            <button
              key={status}
              type="button"
              aria-pressed={statusFilter === status}
              onClick={() => setStatusFilter((current) => current === status ? 'all' : status)}
              className={`rounded-2xl border bg-card p-4 text-left shadow-sm hover:-translate-y-0.5 hover:bg-muted/30 ${PRESSABLE_CARD_CLASS} ${
                statusFilter === status ? 'ring-2 ring-primary/40' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{STATUS_LABELS[status]}</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{summary[status]}</p>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusTone(status)}`}>
                  {status}
                </span>
              </div>
            </button>
          ))}
        </div>

        {error ? (
          <div className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : null}

        {saveMessage ? (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            {saveMessage}
          </div>
        ) : null}

        <Card className="overflow-hidden rounded-2xl shadow-sm">
          <CardHeader className="gap-4 border-b bg-muted/20 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Emergency queue</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sorted by urgency, priority, and age. Open a case to dispatch the next action.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
                  {filteredRequests.length} visible
                </div>
                <Button variant="outline" onClick={() => void loadRequests('refresh')} disabled={refreshing} className="active:scale-[0.98]">
                  {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                  Refresh
                </Button>
              </div>
            </div>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search name, plate, phone, or address"
                  className="h-11 pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RescueStatusFilter)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <QueueSkeleton />
            ) : filteredRequests.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-4 text-lg font-semibold text-foreground">No emergency requests found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try another filter or wait for a new public rescue request.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredRequests.map((request) => {
                  const active = request.id === selectedId && drawerOpen;
                  const priorityTone = getPriorityTone(request.priority);
                  return (
                    <button
                      key={request.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(request.id);
                        setDrawerOpen(true);
                      }}
                      className={`w-full px-4 py-4 text-left transition-[background-color,box-shadow] duration-150 ease-out ${
                        active ? 'bg-primary/5 shadow-[inset_3px_0_0_hsl(var(--primary))]' : 'hover:bg-muted/40'
                      }`}
                    >
                      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.85fr)_140px] xl:items-center">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`h-2 w-2 shrink-0 rounded-full ${getStatusDotTone(request.status)}`} />
                            <span className="text-base font-semibold text-foreground">
                              {request.customer_name?.trim() || 'Unnamed customer'}
                            </span>
                            <span className="rounded-md border px-2 py-1 text-xs font-medium text-muted-foreground">
                              #{request.id}
                            </span>
                            <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${priorityTone}`}>
                              {formatPriorityLabel(request.priority)} P{request.priority}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <p className="font-mono"><span className="font-sans font-medium text-foreground">Plate:</span> {request.license_plate?.trim() || 'Missing'}</p>
                            <p><span className="font-medium text-foreground">Phone:</span> {request.phone}</p>
                            <p><span className="font-medium text-foreground">Age:</span> {getCaseAgeMinutes(request.created_at)} min</p>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{formatLocation(request)}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusTone(request.status)}`}>
                              {STATUS_LABELS[normalizeStatus(request.status)]}
                            </span>
                            <span className="rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                              {formatSourceLabel(request.source)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 xl:justify-end">
                          <span
                            className={`inline-flex h-10 items-center rounded-md border px-3 text-sm font-medium ${
                              active
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-background text-foreground'
                            }`}
                          >
                            Open
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DrawerContent className="data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-[920px]">
        {!selectedRequest ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
            <ShieldAlert className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="text-lg font-semibold text-foreground">Select a rescue request</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose a case from the queue to open the dispatch drawer.
              </p>
            </div>
          </div>
        ) : (
          <>
            <DrawerHeader className="border-b bg-background">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <DrawerTitle className="text-xl">Rescue case #{selectedRequest.id}</DrawerTitle>
                    <div className="text-sm text-muted-foreground">{STATUS_LABELS[selectedStatus]}</div>
                  </div>
                  <DrawerDescription className="text-sm">
                    Created {formatDateTime(selectedRequest.created_at)}. Source: {formatSourceLabel(selectedRequest.source)}.
                  </DrawerDescription>
                  <InfoGrid
                    items={[
                      { label: 'Customer', value: selectedRequest.customer_name?.trim() || 'Unnamed customer' },
                      { label: 'License plate', value: selectedRequest.license_plate?.trim() || 'Missing' },
                      { label: 'Phone', value: selectedRequest.phone },
                      { label: 'Pickup', value: formatLocation(selectedRequest) },
                    ]}
                  />
                </div>
                <DrawerClose asChild>
                  <Button variant="ghost" size="icon" aria-label="Close drawer">
                    <X className="h-4 w-4" />
                  </Button>
                </DrawerClose>
              </div>
              <div className="flex flex-wrap gap-2">
                {phoneHref ? (
                  <Button asChild size="sm" variant="outline">
                    <a href={phoneHref}>
                      <Phone className="mr-2 h-4 w-4" />
                      Call customer
                    </a>
                  </Button>
                ) : null}
                {mapsHref ? (
                  <Button asChild size="sm" variant="outline">
                    <a href={mapsHref} target="_blank" rel="noreferrer">
                      <MapPin className="mr-2 h-4 w-4" />
                      Open map
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                ) : null}
                {nextStatus ? (
                  <Button size="sm" onClick={() => void persistRequest(nextStatus)} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CarFront className="mr-2 h-4 w-4" />}
                    Move to {STATUS_LABELS[nextStatus]}
                  </Button>
                ) : (
                  <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                    {selectedCompletionText}
                  </div>
                )}
              </div>
            </DrawerHeader>

            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),300px]">
                <div className="space-y-6">
                  <SectionBlock title="Progress">
                    <div className="space-y-4">
                      <WorkflowRail status={selectedStatus} />
                      <div className="text-sm text-muted-foreground">
                        {nextStatus
                          ? <>Next recommended step: <span className="font-medium text-foreground">{STATUS_LABELS[nextStatus]}</span></>
                          : selectedCompletionText}
                      </div>
                    </div>
                  </SectionBlock>

                  <SectionBlock title="Pickup details">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 text-sm text-muted-foreground">
                        <MapPin className="mt-0.5 h-4 w-4 text-foreground" />
                        <div>
                          <p className="font-medium text-foreground">{formatLocation(selectedRequest)}</p>
                          {selectedRequest.lat !== null && selectedRequest.lng !== null ? (
                            <p className="mt-1">{selectedRequest.lat}, {selectedRequest.lng}</p>
                          ) : null}
                        </div>
                      </div>
                      <InfoGrid
                        items={[
                          { label: 'Source', value: formatSourceLabel(selectedRequest.source) },
                          { label: 'Priority', value: editor.priority },
                          { label: 'Assigned to', value: editor.assignedTo || 'Unassigned' },
                          { label: 'Last updated', value: formatDateTime(selectedRequest.updated_at) },
                        ]}
                      />
                    </div>
                  </SectionBlock>

                  <SectionBlock title="Internal notes">
                    <div className="space-y-2">
                      <Label htmlFor="rescue-notes">Notes</Label>
                      <Textarea
                        id="rescue-notes"
                        rows={10}
                        placeholder="Arrival notes, access details, towing instructions..."
                        value={editor.internalNotes}
                        onChange={(event) => setEditor((current) => ({ ...current, internalNotes: event.target.value }))}
                      />
                    </div>
                  </SectionBlock>

                  <SectionBlock title="Timeline">
                    <div className="space-y-3">
                      {eventsLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading timeline...
                        </div>
                      ) : !eventsAvailable ? (
                        <div className="rounded-md border border-dashed px-4 py-4 text-sm text-muted-foreground">
                          Timeline events are not available in this session.
                        </div>
                      ) : null}

                      <div className="border-l pl-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">Request created</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Public emergency request received through {formatSourceLabel(selectedRequest.source)}.
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">{formatDateTime(selectedRequest.created_at)}</p>
                        </div>
                      </div>

                      {events.map((event) => (
                        <div key={event.id} className="border-l pl-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {STATUS_LABELS[event.event_type as RescueStatus] ?? event.event_type.replace(/_/g, ' ')}
                              </p>
                              <EventMeta meta={event.meta} />
                            </div>
                            <p className="text-xs text-muted-foreground">{formatDateTime(event.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionBlock>
                </div>

                <div className="space-y-6">
                  <SectionBlock title="Customer">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 text-sm text-muted-foreground">
                        <User className="mt-0.5 h-4 w-4 text-foreground" />
                        <div>
                          <p className="font-medium text-foreground">{selectedRequest.customer_name?.trim() || 'Unnamed customer'}</p>
                          <p className="mt-1">{selectedRequest.license_plate?.trim() || 'License plate missing'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-muted-foreground">
                        <Phone className="mt-0.5 h-4 w-4 text-foreground" />
                        <p className="font-medium text-foreground">{selectedRequest.phone}</p>
                      </div>
                    </div>
                  </SectionBlock>

                  <SectionBlock title="Status actions" description="Use quick progression or set a specific stage manually. Cancellation stays available but separate from normal progress.">
                    <div className="space-y-2">
                      {STATUS_ORDER.filter((status) => status !== 'canceled').map((status) => {
                        const active = status === selectedStatus;
                        return (
                          <Button
                            key={status}
                            type="button"
                            variant={active ? 'default' : 'outline'}
                            disabled={saving || active}
                            onClick={() => void persistRequest(status)}
                            className="w-full justify-start"
                          >
                            {active ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <CarFront className="mr-2 h-4 w-4" />}
                            {STATUS_LABELS[status]}
                          </Button>
                        );
                      })}
                      <Button
                        type="button"
                        variant={selectedStatus === 'canceled' ? 'default' : 'outline'}
                        disabled={saving || selectedStatus === 'canceled'}
                        onClick={() => void persistRequest('canceled')}
                        className="w-full justify-start border-red-500/30 text-red-700 hover:bg-red-500/10 dark:text-red-300"
                      >
                        {selectedStatus === 'canceled' ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <X className="mr-2 h-4 w-4" />}
                        {STATUS_LABELS.canceled}
                      </Button>
                    </div>
                  </SectionBlock>

                  <SectionBlock title="Case fields">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="rescue-status">Status</Label>
                        <Select value={editor.status} onValueChange={(value) => setEditor((current) => ({ ...current, status: value }))}>
                          <SelectTrigger id="rescue-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status} value={status}>
                                {STATUS_LABELS[status]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="rescue-priority">Priority</Label>
                        <Input
                          id="rescue-priority"
                          type="number"
                          min="0"
                          max="5"
                          value={editor.priority}
                          onChange={(event) => setEditor((current) => ({ ...current, priority: event.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="rescue-assigned-to">Assigned user id</Label>
                        <Input
                          id="rescue-assigned-to"
                          readOnly
                          placeholder="Not assigned"
                          value={editor.assignedTo}
                        />
                        <p className="text-xs text-muted-foreground">
                          Driver/operator names should stay in internal notes until the assignment model is refactored.
                        </p>
                      </div>
                    </div>
                  </SectionBlock>
                </div>
              </div>
            </div>

            <DrawerFooter className="border-t bg-background">
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <DrawerClose asChild>
                  <Button variant="outline">Close</Button>
                </DrawerClose>
                <Button onClick={() => void persistRequest()} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save case
                </Button>
              </div>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
