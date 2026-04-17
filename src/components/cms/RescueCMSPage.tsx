import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  MapPin,
  Navigation,
  Phone,
  RefreshCcw,
  Save,
  ShieldAlert,
  User,
} from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

type RescueStatusFilter = 'all' | 'active' | 'closed';

type RescueRequestRow = {
  id: number;
  user_id: string | null;
  lat: string | number | null;
  lng: string | number | null;
  street_address: string | null;
  postcode: string | null;
  city: string | null;
  phone: string;
  source: string;
  status: string;
  assigned_to: string | null;
  priority: number;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
};

const REFRESH_INTERVAL_MS = 30_000;
const DEFAULT_STATUS_PRESETS = ['new', 'assigned', 'in_progress', 'completed', 'canceled'] as const;
const CLOSED_STATUS_KEYWORDS = ['completed', 'done', 'closed', 'cancel', 'resolved'];

function isClosedStatus(status: string | null | undefined) {
  const normalized = (status ?? '').toLowerCase();
  return CLOSED_STATUS_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

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

function formatRelativeMinutes(value: string | null | undefined) {
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

function formatLocation(request: RescueRequestRow) {
  const parts = [request.street_address, request.postcode, request.city]
    .map((value) => value?.trim())
    .filter(Boolean);

  if (parts.length > 0) {
    return parts.join(', ');
  }

  if (request.lat !== null && request.lng !== null) {
    return `${request.lat}, ${request.lng}`;
  }

  return 'Location missing';
}

function formatSourceLabel(source: string | null | undefined) {
  if (!source) return 'Unknown';
  return source
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function getStatusTone(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes('cancel')) return 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300';
  if (normalized.includes('complete') || normalized.includes('done') || normalized.includes('resolve')) {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
  }
  if (normalized.includes('assign') || normalized.includes('progress')) {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300';
  }

  return 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300';
}

export function RescueCMSPage() {
  const [requests, setRequests] = useState<RescueRequestRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<RescueStatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [editor, setEditor] = useState({
    status: '',
    priority: '0',
    internalNotes: '',
    assignedTo: '',
  });

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
        supabase
          .from('emergency_requests')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      if (queryError) {
        throw queryError;
      }

      setCurrentUserId(authData.user?.id ?? null);
      setCurrentUserEmail(authData.user?.email ?? '');
      const nextRows = (data ?? []) as RescueRequestRow[];
      setRequests(nextRows);

      setSelectedId((currentSelected) => {
        if (currentSelected && nextRows.some((row) => row.id === currentSelected)) {
          return currentSelected;
        }
        return nextRows[0]?.id ?? null;
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
    if (statusFilter === 'all') return requests;
    if (statusFilter === 'active') return requests.filter((request) => !isClosedStatus(request.status));
    return requests.filter((request) => isClosedStatus(request.status));
  }, [requests, statusFilter]);

  const selectedRequest = useMemo(
    () => requests.find((request) => request.id === selectedId) ?? null,
    [requests, selectedId],
  );

  const statusOptions = useMemo(() => {
    const dynamicStatuses = requests
      .map((request) => request.status)
      .filter(Boolean);

    return Array.from(new Set([...DEFAULT_STATUS_PRESETS, ...dynamicStatuses]));
  }, [requests]);

  const summary = useMemo(() => {
    const active = requests.filter((request) => !isClosedStatus(request.status)).length;
    const closed = requests.filter((request) => isClosedStatus(request.status)).length;
    const unassigned = requests.filter((request) => !request.assigned_to && !isClosedStatus(request.status)).length;

    return {
      total: requests.length,
      active,
      closed,
      unassigned,
    };
  }, [requests]);

  useEffect(() => {
    if (!selectedRequest) {
      setEditor({
        status: '',
        priority: '0',
        internalNotes: '',
        assignedTo: '',
      });
      return;
    }

    setEditor({
      status: selectedRequest.status,
      priority: String(selectedRequest.priority ?? 0),
      internalNotes: selectedRequest.internal_notes ?? '',
      assignedTo: selectedRequest.assigned_to ?? '',
    });
    setSaveMessage('');
  }, [selectedRequest]);

  const handleSave = useCallback(async () => {
    if (!selectedRequest) return;

    setSaving(true);
    setError('');
    setSaveMessage('');

    try {
      const parsedPriority = Number.parseInt(editor.priority, 10);
      const payload = {
        status: editor.status,
        priority: Number.isFinite(parsedPriority) ? parsedPriority : selectedRequest.priority,
        internal_notes: editor.internalNotes.trim() || null,
        assigned_to: editor.assignedTo || null,
      };

      const { error: updateError } = await supabase
        .from('emergency_requests')
        .update(payload)
        .eq('id', selectedRequest.id);

      if (updateError) {
        throw updateError;
      }

      setSaveMessage('Rescue request updated.');
      await loadRequests('refresh');
    } catch (err: any) {
      setError(err?.message || 'Failed to save rescue request.');
    } finally {
      setSaving(false);
    }
  }, [editor, loadRequests, selectedRequest]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.08em] text-muted-foreground">CMS Module</p>
          <h1 className="text-3xl font-semibold text-foreground">Rescue 24/7</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Incoming rescue requests from the public emergency form. Use this queue to triage, assign, and track response progress before the PWA reuses the same workflow.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[180px]">
            <Label htmlFor="rescue-filter">Queue filter</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RescueStatusFilter)}>
              <SelectTrigger id="rescue-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All requests</SelectItem>
                <SelectItem value="active">Active only</SelectItem>
                <SelectItem value="closed">Closed only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={() => void loadRequests('refresh')}
            disabled={refreshing || loading}
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total requests</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-3xl font-semibold">{summary.total}</span>
            <ShieldAlert className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-3xl font-semibold">{summary.active}</span>
            <Clock3 className="h-5 w-5 text-amber-500" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unassigned</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-3xl font-semibold">{summary.unassigned}</span>
            <User className="h-5 w-5 text-blue-500" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Closed</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-3xl font-semibold">{summary.closed}</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </CardContent>
        </Card>
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {saveMessage ? (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{saveMessage}</span>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <Card className="min-h-[520px]">
          <CardHeader>
            <CardTitle>Incoming queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="rounded-xl border border-dashed px-4 py-12 text-center text-muted-foreground">
                Loading rescue requests...
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="rounded-xl border border-dashed px-4 py-12 text-center text-muted-foreground">
                No rescue requests in this filter.
              </div>
            ) : (
              filteredRequests.map((request) => {
                const isSelected = request.id === selectedId;
                const assignedToCurrentUser = currentUserId && request.assigned_to === currentUserId;

                return (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => setSelectedId(request.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/40 hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-semibold text-foreground">Request #{request.id}</span>
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusTone(request.status)}`}>
                            {request.status}
                          </span>
                          <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                            P{request.priority}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {request.phone}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            {request.lat !== null && request.lng !== null ? (
                              <Navigation className="h-4 w-4" />
                            ) : (
                              <MapPin className="h-4 w-4" />
                            )}
                            {formatLocation(request)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right text-xs text-muted-foreground">
                        <div>{formatRelativeMinutes(request.created_at)}</div>
                        <div className="mt-1">{formatSourceLabel(request.source)}</div>
                        <div className="mt-1">
                          {request.assigned_to
                            ? assignedToCurrentUser
                              ? 'Assigned to you'
                              : 'Assigned'
                            : 'Unassigned'}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="min-h-[520px]">
          <CardHeader>
            <CardTitle>Request detail</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedRequest ? (
              <div className="rounded-xl border border-dashed px-4 py-12 text-center text-muted-foreground">
                Select a rescue request to inspect and update it.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3 rounded-2xl border bg-muted/30 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">Request #{selectedRequest.id}</h2>
                      <p className="text-sm text-muted-foreground">
                        Created {formatDateTime(selectedRequest.created_at)}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusTone(selectedRequest.status)}`}>
                      {selectedRequest.status}
                    </span>
                  </div>

                  <div className="grid gap-3 text-sm md:grid-cols-2">
                    <div className="rounded-xl border bg-background p-3">
                      <p className="font-medium text-foreground">Caller</p>
                      <p className="mt-2 flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${selectedRequest.phone}`} className="hover:text-foreground">
                          {selectedRequest.phone}
                        </a>
                      </p>
                    </div>
                    <div className="rounded-xl border bg-background p-3">
                      <p className="font-medium text-foreground">Source</p>
                      <p className="mt-2 text-muted-foreground">{formatSourceLabel(selectedRequest.source)}</p>
                    </div>
                    <div className="rounded-xl border bg-background p-3 md:col-span-2">
                      <p className="font-medium text-foreground">Location</p>
                      <p className="mt-2 text-muted-foreground">{formatLocation(selectedRequest)}</p>
                      {selectedRequest.lat !== null && selectedRequest.lng !== null ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          GPS: {selectedRequest.lat}, {selectedRequest.lng}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="rescue-status">Status</Label>
                    <Select
                      value={editor.status}
                      onValueChange={(value) => setEditor((current) => ({ ...current, status: value }))}
                    >
                      <SelectTrigger id="rescue-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
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
                      value={editor.priority}
                      onChange={(event) => setEditor((current) => ({ ...current, priority: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rescue-assignee">Assigned user id</Label>
                  <Input
                    id="rescue-assignee"
                    value={editor.assignedTo}
                    onChange={(event) => setEditor((current) => ({ ...current, assignedTo: event.target.value }))}
                    placeholder="UUID of assigned admin"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditor((current) => ({ ...current, assignedTo: currentUserId ?? current.assignedTo }))}
                      disabled={!currentUserId}
                    >
                      Assign to me
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditor((current) => ({ ...current, assignedTo: '' }))}
                    >
                      Clear assignment
                    </Button>
                  </div>
                  {currentUserEmail ? (
                    <p className="text-xs text-muted-foreground">Current admin: {currentUserEmail}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rescue-notes">Internal notes</Label>
                  <Textarea
                    id="rescue-notes"
                    value={editor.internalNotes}
                    onChange={(event) => setEditor((current) => ({ ...current, internalNotes: event.target.value }))}
                    rows={8}
                    placeholder="Dispatch updates, ETA, towing details, customer follow-up..."
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                  <div className="text-xs text-muted-foreground">
                    Last updated {formatDateTime(selectedRequest.updated_at)}
                  </div>
                  <Button onClick={() => void handleSave()} disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save changes'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
