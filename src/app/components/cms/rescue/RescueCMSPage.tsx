import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CarFront,
  CheckCircle2,
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
import { useLanguage } from '../../LanguageContext';
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

type RescueStatus = 'received' | 'processing' | 'on_the_way' | 'picking' | 'at_garage';
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
const STATUS_ORDER: RescueStatus[] = ['received', 'processing', 'on_the_way', 'picking', 'at_garage'];
const STATUS_LABELS: Record<RescueStatus, string> = {
  received: 'Received',
  processing: 'Processing',
  on_the_way: 'On the way to pickup the car',
  picking: 'Picking',
  at_garage: 'At the garage',
};

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
      return 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300';
    case 'processing':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300';
    case 'on_the_way':
      return 'border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300';
    case 'picking':
      return 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300';
    case 'at_garage':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
    default:
      return 'border-border bg-muted text-foreground';
  }
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
  const currentIndex = STATUS_ORDER.indexOf(status);

  return (
    <div className="grid gap-2 md:grid-cols-5">
      {STATUS_ORDER.map((step, index) => {
        const complete = index < currentIndex;
        const current = index === currentIndex;
        return (
          <div
            key={step}
            className={`rounded-lg border px-3 py-3 ${
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
    <section className="rounded-lg border bg-card">
      <div className="border-b px-5 py-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

export function RescueCMSPage() {
  const { language } = useLanguage();
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
    });
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
        processing: 0,
        on_the_way: 0,
        picking: 0,
        at_garage: 0,
      },
    );

    requests.forEach((request) => {
      counts[normalizeStatus(request.status)] += 1;
    });

    return counts;
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
        assigned_to: editor.assignedTo.trim() || null,
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

      setSaveMessage(language === 'fi' ? 'Pelastustapaus tallennettu.' : 'Rescue case saved.');
      await loadEvents(selectedRequest.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to save rescue request.');
    } finally {
      setSaving(false);
    }
  }, [currentUserEmail, editor.assignedTo, editor.internalNotes, editor.priority, editor.status, language, loadEvents, logEvent, selectedRequest]);

  const selectedStatus = normalizeStatus(selectedRequest?.status);
  const selectedStatusIndex = STATUS_ORDER.indexOf(selectedStatus);
  const nextStatus = selectedStatusIndex < STATUS_ORDER.length - 1 ? STATUS_ORDER[selectedStatusIndex + 1] : null;
  const mapsHref = selectedRequest
    ? selectedRequest.lat !== null && selectedRequest.lng !== null
      ? `https://www.google.com/maps?q=${selectedRequest.lat},${selectedRequest.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatLocation(selectedRequest))}`
    : null;
  const phoneHref = selectedRequest ? `tel:${selectedRequest.phone.replace(/\s+/g, '')}` : null;

  return (
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="right">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Rescue 24/7</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Dispatch board for emergency intake, pickup progress, and arrival at the garage.
            </p>
          </div>
          <Button variant="outline" onClick={() => void loadRequests('refresh')} disabled={refreshing}>
            {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            Refresh queue
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {STATUS_ORDER.map((status) => (
            <Card key={status} className="overflow-hidden">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{STATUS_LABELS[status]}</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{summary[status]}</p>
                </div>
                <div className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusTone(status)}`}>
                  {status.replace(/_/g, ' ')}
                </div>
              </CardContent>
            </Card>
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

        <Card className="overflow-hidden">
          <CardHeader className="gap-4 border-b bg-muted/20">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Emergency queue</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Open a case in the drawer to dispatch the next action and update the rescue timeline.
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                {filteredRequests.length} case{filteredRequests.length === 1 ? '' : 's'} visible
              </div>
            </div>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr),220px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search name, plate, phone, or address"
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RescueStatusFilter)}>
                <SelectTrigger>
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
              <div className="flex items-center gap-2 px-6 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading rescue queue...
              </div>
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
                  return (
                    <button
                      key={request.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(request.id);
                        setDrawerOpen(true);
                      }}
                      className={`w-full px-6 py-4 text-left transition ${
                        active ? 'bg-primary/5' : 'hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-semibold text-foreground">
                              {request.customer_name?.trim() || 'Unnamed customer'}
                            </span>
                            <span className="rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                              #{request.id}
                            </span>
                            <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusTone(request.status)}`}>
                              {STATUS_LABELS[normalizeStatus(request.status)]}
                            </span>
                          </div>
                          <div className="mt-2 grid gap-2 text-sm text-muted-foreground lg:grid-cols-2 2xl:grid-cols-4">
                            <p><span className="font-medium text-foreground">Plate:</span> {request.license_plate?.trim() || 'Missing'}</p>
                            <p><span className="font-medium text-foreground">Phone:</span> {request.phone}</p>
                            <p className="truncate"><span className="font-medium text-foreground">Location:</span> {formatLocation(request)}</p>
                            <p><span className="font-medium text-foreground">Created:</span> {formatRelative(request.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 xl:justify-end">
                          <div className="text-sm text-muted-foreground">
                            {formatSourceLabel(request.source)}
                          </div>
                          <span
                            className={`inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium ${
                              active
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-background text-foreground'
                            }`}
                          >
                            Open case
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
                    Vehicle arrived at the garage
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
                          : 'This emergency case has reached the garage. Later service management can continue from here.'}
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

                  <SectionBlock title="Status actions" description="Use quick progression or set a specific stage manually.">
                    <div className="space-y-2">
                      {STATUS_ORDER.map((status) => {
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
                        <Label htmlFor="rescue-assigned-to">Assigned to</Label>
                        <Input
                          id="rescue-assigned-to"
                          placeholder="Operator or driver"
                          value={editor.assignedTo}
                          onChange={(event) => setEditor((current) => ({ ...current, assignedTo: event.target.value }))}
                        />
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
