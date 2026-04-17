import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Loader2,
  Mail,
  MapPin,
  Navigation,
  Phone,
  PlusCircle,
  RefreshCcw,
  Save,
  ShieldAlert,
  User,
  Wrench,
} from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeContext';
import { BookingCommunicationModal } from '../admin/communication/BookingCommunicationModal';
import { useBookingConversation } from '../admin/communication/useBookingConversation';
import type { ScheduleBooking } from '../../utils/schedule';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
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

type RescueEventRow = {
  id: number;
  request_id: number;
  event_type: string;
  meta: Record<string, unknown>;
  created_at: string;
};

type RescueCreateServiceForm = {
  licensePlate: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  notes: string;
};

type WorkflowStep = {
  id: string;
  label: string;
  complete: boolean;
  current: boolean;
};

const REFRESH_INTERVAL_MS = 30_000;
const BOOKING_MARKER_PATTERN = /\[booking:([0-9a-f-]{36})\]/i;
const DEFAULT_STATUS_PRESETS = [
  'new',
  'assigned',
  'vehicle_received',
  'service_created',
  'customer_contacted',
  'in_service',
  'completed',
  'canceled',
] as const;
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
  return source
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function formatLocation(request: RescueRequestRow) {
  const parts = [request.street_address, request.postcode, request.city]
    .map((value) => value?.trim())
    .filter(Boolean);

  if (parts.length > 0) return parts.join(', ');
  if (request.lat !== null && request.lng !== null) return `${request.lat}, ${request.lng}`;
  return 'Location missing';
}

function extractLinkedBookingId(notes: string | null | undefined) {
  const match = (notes ?? '').match(BOOKING_MARKER_PATTERN);
  return match?.[1] ?? null;
}

function replaceLinkedBookingId(notes: string | null | undefined, bookingId: string) {
  const cleaned = (notes ?? '').replace(BOOKING_MARKER_PATTERN, '').trim();
  return cleaned ? `[booking:${bookingId}]\n${cleaned}` : `[booking:${bookingId}]`;
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

function getStatusTone(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes('cancel')) return 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300';
  if (normalized.includes('complete') || normalized.includes('done') || normalized.includes('resolve')) {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
  }
  if (
    normalized.includes('assign') ||
    normalized.includes('progress') ||
    normalized.includes('receive') ||
    normalized.includes('service') ||
    normalized.includes('contact')
  ) {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300';
  }

  return 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300';
}

function formatLocalDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getNextBookingSlot() {
  const now = new Date();
  const rounded = new Date(now);
  rounded.setSeconds(0, 0);
  const minutes = rounded.getMinutes();

  if (minutes === 0 || minutes === 30) {
    rounded.setMinutes(minutes);
  } else if (minutes < 30) {
    rounded.setMinutes(30);
  } else {
    rounded.setHours(rounded.getHours() + 1, 0, 0, 0);
  }

  return {
    date: formatLocalDateInput(rounded),
    time: `${String(rounded.getHours()).padStart(2, '0')}:${String(rounded.getMinutes()).padStart(2, '0')}`,
  };
}

function buildWorkflowSteps(request: RescueRequestRow | null, linkedBooking: ScheduleBooking | null): WorkflowStep[] {
  if (!request) return [];

  const status = request.status.toLowerCase();
  const hasReceived = status.includes('receive');
  const hasService = Boolean(linkedBooking) || status.includes('service');
  const hasContact = status.includes('contact') || Boolean(linkedBooking?.customer_email);
  const isClosed = isClosedStatus(status);

  return [
    {
      id: 'intake',
      label: 'Request received',
      complete: true,
      current: !hasReceived,
    },
    {
      id: 'received',
      label: 'Vehicle received',
      complete: hasReceived,
      current: hasReceived && !hasService,
    },
    {
      id: 'service',
      label: 'Service draft created',
      complete: hasService,
      current: hasService && !hasContact,
    },
    {
      id: 'contact',
      label: 'Customer communication',
      complete: hasContact,
      current: hasContact && !isClosed,
    },
    {
      id: 'closed',
      label: 'Case closed',
      complete: isClosed,
      current: isClosed,
    },
  ];
}

function WorkflowRail({ steps }: { steps: WorkflowStep[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-5">
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={`rounded-2xl border p-3 ${
            step.complete
              ? 'border-emerald-500/30 bg-emerald-500/10'
              : step.current
                ? 'border-amber-500/30 bg-amber-500/10'
                : 'border-border bg-background'
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                step.complete
                  ? 'bg-emerald-500 text-white'
                  : step.current
                    ? 'bg-amber-500 text-white'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {step.complete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
            </div>
            <span className="text-sm font-medium text-foreground">{step.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelineCard({
  request,
  events,
  eventsLoading,
  eventsAvailable,
  linkedBooking,
}: {
  request: RescueRequestRow;
  events: RescueEventRow[];
  eventsLoading: boolean;
  eventsAvailable: boolean;
  linkedBooking: ScheduleBooking | null;
}) {
  const timeline = useMemo(() => {
    const items = [
      {
        id: `request-${request.id}-created`,
        title: 'Request received',
        detail: `Created from ${formatSourceLabel(request.source)}`,
        at: request.created_at,
      },
      ...events.map((event) => ({
        id: `event-${event.id}`,
        title: event.event_type.replace(/_/g, ' '),
        detail: Object.keys(event.meta || {}).length > 0 ? JSON.stringify(event.meta) : 'No additional metadata',
        at: event.created_at,
      })),
    ];

    if (linkedBooking) {
      items.push({
        id: `booking-${linkedBooking.id}`,
        title: 'Service draft linked',
        detail: `${linkedBooking.service_name || 'Service'} · ${linkedBooking.booking_date} ${linkedBooking.booking_time}`,
        at: linkedBooking.created_at,
      });
    }

    return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [events, linkedBooking, request]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Case timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {eventsLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading timeline...
          </div>
        ) : !eventsAvailable ? (
          <div className="rounded-xl border border-dashed px-4 py-4 text-sm text-muted-foreground">
            Timeline events are not available in this session. The page can still run from the rescue request itself.
          </div>
        ) : null}

        {timeline.map((item) => (
          <div key={item.id} className="rounded-xl border px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
              </div>
              <p className="text-xs text-muted-foreground">{formatDateTime(item.at)}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function RescueCMSPage() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [requests, setRequests] = useState<RescueRequestRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<RescueStatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creatingService, setCreatingService] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [communicationOpen, setCommunicationOpen] = useState(false);
  const [createServiceOpen, setCreateServiceOpen] = useState(false);
  const [linkedBooking, setLinkedBooking] = useState<ScheduleBooking | null>(null);
  const [loadingLinkedBooking, setLoadingLinkedBooking] = useState(false);
  const [events, setEvents] = useState<RescueEventRow[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsAvailable, setEventsAvailable] = useState(true);
  const [editor, setEditor] = useState({
    status: '',
    priority: '0',
    internalNotes: '',
    assignedTo: '',
  });
  const [createServiceForm, setCreateServiceForm] = useState<RescueCreateServiceForm>(() => {
    const slot = getNextBookingSlot();
    return {
      licensePlate: '',
      customerName: '',
      customerEmail: '',
      serviceName: 'Rescue 24/7 intake',
      bookingDate: slot.date,
      bookingTime: slot.time,
      notes: '',
    };
  });

  const cmsStrings = useMemo(() => ({
    conversationLoadFailed: language === 'fi' ? 'Keskustelua ei voitu ladata.' : 'Failed to load conversation.',
    noEmailNoSend: language === 'fi' ? 'Sähköpostiosoite puuttuu.' : 'No customer email available.',
    messageRequired: language === 'fi' ? 'Viestin aihe ja sisältö vaaditaan.' : 'Subject and message are required.',
    adminMessageSent: language === 'fi' ? 'Viesti lähetetty.' : 'Message sent.',
    adminMessageFailed: language === 'fi' ? 'Viestin lähetys epäonnistui.' : 'Failed to send message.',
    conversationHistory: language === 'fi' ? 'Varausketjun viestihistoria.' : 'Conversation history for this booking thread.',
    syncingConversation: language === 'fi' ? 'Synkronoidaan...' : 'Syncing...',
    syncConversation: language === 'fi' ? 'Synkronoi' : 'Sync',
    conversationLoading: language === 'fi' ? 'Ladataan keskustelua...' : 'Loading conversation...',
    conversationEmpty: language === 'fi' ? 'Tälle varaukselle ei ole vielä viestejä.' : 'No messages for this booking yet.',
    receivedLabel: language === 'fi' ? 'Saapunut' : 'Received',
    sentLabel: language === 'fi' ? 'Lähetetty' : 'Sent',
    replyToMessage: language === 'fi' ? 'Vastaa' : 'Reply',
    sendMessage: language === 'fi' ? 'Lähetä viesti' : 'Send message',
    messageSubject: language === 'fi' ? 'Aihe' : 'Subject',
    messageSubjectPlaceholder: language === 'fi' ? 'Kirjoita aiherivi' : 'Write a subject line',
    messageBody: language === 'fi' ? 'Viesti' : 'Message',
    messageBodyPlaceholder: language === 'fi' ? 'Kirjoita viesti asiakkaalle' : 'Write a message to the customer',
    sendingMessage: language === 'fi' ? 'Lähetetään...' : 'Sending...',
    threadConnected: language === 'fi' ? 'Ketju yhdistetty' : 'Thread connected',
    noThreadYet: language === 'fi' ? 'Ei ketjua vielä' : 'No thread yet',
  }), [language]);

  const bookingConversation = useBookingConversation({
    buildCustomerCompletionDraft: (booking) => ({
      subject: language === 'fi' ? 'Täydennä varauksesi tiedot' : 'Complete your booking details',
      message: language === 'fi'
        ? `Hei ${booking.customer_name || ''},\n\nTäydennä varauksesi tiedot vastaamalla tähän viestiin.`
        : `Hi ${booking.customer_name || ''},\n\nPlease complete your booking details by replying to this message.`,
    }),
    getBookingLanguage: (booking) => booking.booking_language === 'en' ? 'en' : 'fi',
    language,
    setBookingExpanded: () => undefined,
    t: (key) => cmsStrings[key as keyof typeof cmsStrings] || key,
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
        supabase.from('emergency_requests').select('*').order('created_at', { ascending: false }),
      ]);

      if (queryError) throw queryError;

      setCurrentUserId(authData.user?.id ?? null);
      setCurrentUserEmail(authData.user?.email ?? '');

      const nextRows = (data ?? []) as RescueRequestRow[];
      setRequests(nextRows);
      setSelectedId((currentSelected) => {
        if (currentSelected && nextRows.some((row) => row.id === currentSelected)) return currentSelected;
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

  const linkedBookingId = useMemo(
    () => extractLinkedBookingId(selectedRequest?.internal_notes),
    [selectedRequest?.internal_notes],
  );

  const statusOptions = useMemo(() => {
    const dynamicStatuses = requests.map((request) => request.status).filter(Boolean);
    return Array.from(new Set([...DEFAULT_STATUS_PRESETS, ...dynamicStatuses]));
  }, [requests]);

  const summary = useMemo(() => {
    const active = requests.filter((request) => !isClosedStatus(request.status)).length;
    const closed = requests.filter((request) => isClosedStatus(request.status)).length;
    const unassigned = requests.filter((request) => !request.assigned_to && !isClosedStatus(request.status)).length;
    return { total: requests.length, active, closed, unassigned };
  }, [requests]);

  const workflowSteps = useMemo(
    () => buildWorkflowSteps(selectedRequest, linkedBooking),
    [linkedBooking, selectedRequest],
  );

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

  useEffect(() => {
    if (!linkedBookingId) {
      setLinkedBooking(null);
      return;
    }

    let active = true;
    const run = async () => {
      setLoadingLinkedBooking(true);
      try {
        const { data, error: queryError } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', linkedBookingId)
          .single();

        if (queryError) throw queryError;
        if (active) setLinkedBooking(data as ScheduleBooking);
      } catch {
        if (active) setLinkedBooking(null);
      } finally {
        if (active) setLoadingLinkedBooking(false);
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [linkedBookingId]);

  useEffect(() => {
    if (!selectedRequest) {
      setEvents([]);
      return;
    }

    let active = true;
    const run = async () => {
      setEventsLoading(true);
      try {
        const { data, error: queryError } = await supabase
          .from('emergency_request_events')
          .select('*')
          .eq('request_id', selectedRequest.id)
          .order('created_at', { ascending: false });

        if (queryError) throw queryError;
        if (active) {
          setEvents((data ?? []) as RescueEventRow[]);
          setEventsAvailable(true);
        }
      } catch {
        if (active) {
          setEvents([]);
          setEventsAvailable(false);
        }
      } finally {
        if (active) setEventsLoading(false);
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [selectedRequest]);

  useEffect(() => {
    if (!createServiceOpen || !selectedRequest) return;

    const slot = getNextBookingSlot();
    setCreateServiceForm({
      licensePlate: '',
      customerName: '',
      customerEmail: '',
      serviceName: language === 'fi' ? 'Rescue 24/7 vastaanotto' : 'Rescue 24/7 intake',
      bookingDate: slot.date,
      bookingTime: slot.time,
      notes: `${language === 'fi' ? 'Lähde' : 'Source'}: Rescue request #${selectedRequest.id}\n${language === 'fi' ? 'Puhelin' : 'Phone'}: ${selectedRequest.phone}\n${language === 'fi' ? 'Sijainti' : 'Location'}: ${formatLocation(selectedRequest)}`,
    });
  }, [createServiceOpen, language, selectedRequest]);

  const recordEvent = useCallback(async (requestId: number, eventType: string, meta: Record<string, unknown>) => {
    try {
      await supabase.from('emergency_request_events').insert([
        {
          request_id: requestId,
          event_type: eventType,
          meta,
        },
      ]);
    } catch {
      // Best effort only. Rescue page should still operate even when event logging is blocked.
    }
  }, []);

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

      if (updateError) throw updateError;

      await recordEvent(selectedRequest.id, 'case_saved', {
        status: payload.status,
        priority: payload.priority,
        assigned_to: payload.assigned_to,
      });

      setSaveMessage(language === 'fi' ? 'Pelastuspyyntö päivitetty.' : 'Rescue request updated.');
      await loadRequests('refresh');
    } catch (err: any) {
      setError(err?.message || 'Failed to save rescue request.');
    } finally {
      setSaving(false);
    }
  }, [editor, language, loadRequests, recordEvent, selectedRequest]);

  const handleQuickAction = useCallback(async (status: string, note: string, eventType: string) => {
    if (!selectedRequest) return;

    setSaving(true);
    setError('');
    setSaveMessage('');

    try {
      const nextNotes = appendActionNote(selectedRequest.internal_notes, note);
      const { error: updateError } = await supabase
        .from('emergency_requests')
        .update({
          status,
          internal_notes: nextNotes,
        })
        .eq('id', selectedRequest.id);

      if (updateError) throw updateError;

      await recordEvent(selectedRequest.id, eventType, { status, note });
      setSaveMessage(language === 'fi' ? 'Toiminto tallennettu.' : 'Action saved.');
      await loadRequests('refresh');
    } catch (err: any) {
      setError(err?.message || 'Failed to update rescue request.');
    } finally {
      setSaving(false);
    }
  }, [language, loadRequests, recordEvent, selectedRequest]);

  const handleCreateServiceDraft = useCallback(async () => {
    if (!selectedRequest) return;
    if (!createServiceForm.licensePlate.trim() || !createServiceForm.customerName.trim() || !createServiceForm.serviceName.trim()) {
      setError(language === 'fi'
        ? 'Rekisterinumero, asiakasnimi ja palvelu ovat pakollisia.'
        : 'License plate, customer name, and service are required.');
      return;
    }

    setCreatingService(true);
    setError('');
    setSaveMessage('');

    try {
      const bookingPayload = {
        license_plate: createServiceForm.licensePlate.trim().toUpperCase(),
        booking_date: createServiceForm.bookingDate,
        booking_time: createServiceForm.bookingTime,
        service_name: createServiceForm.serviceName.trim(),
        customer_name: createServiceForm.customerName.trim(),
        customer_phone: selectedRequest.phone,
        customer_email: createServiceForm.customerEmail.trim() || null,
        notes: createServiceForm.notes.trim() || null,
        status: 'confirmed',
        booking_language: language === 'fi' ? 'fi' : 'en',
      };

      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert([bookingPayload])
        .select('*')
        .single();

      if (bookingError || !bookingData) {
        throw bookingError || new Error('Failed to create booking');
      }

      const nextNotes = appendActionNote(
        replaceLinkedBookingId(selectedRequest.internal_notes, bookingData.id),
        `Service draft created for booking ${bookingData.id}`,
      );

      const { error: rescueUpdateError } = await supabase
        .from('emergency_requests')
        .update({
          status: 'service_created',
          internal_notes: nextNotes,
        })
        .eq('id', selectedRequest.id);

      if (rescueUpdateError) throw rescueUpdateError;

      await recordEvent(selectedRequest.id, 'service_created', { booking_id: bookingData.id });

      setLinkedBooking(bookingData as ScheduleBooking);
      setCreateServiceOpen(false);
      setSaveMessage(language === 'fi' ? 'Palveluluonnos luotu ja linkitetty.' : 'Service draft created and linked.');
      await loadRequests('refresh');
    } catch (err: any) {
      setError(err?.message || 'Failed to create service draft.');
    } finally {
      setCreatingService(false);
    }
  }, [createServiceForm, language, loadRequests, recordEvent, selectedRequest]);

  const openCommunicationHub = useCallback((compose = false) => {
    if (!linkedBooking) return;
    setCommunicationOpen(true);
    if (compose) {
      bookingConversation.handleOpenMessageComposer(linkedBooking);
      void recordEvent(selectedRequest?.id ?? 0, 'customer_contacted', {
        booking_id: linkedBooking.id,
        mode: 'compose_opened',
      });
    } else {
      void bookingConversation.loadBookingConversation(linkedBooking.id, true);
    }
  }, [bookingConversation, linkedBooking, recordEvent, selectedRequest?.id]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.08em] text-muted-foreground">CMS Module</p>
          <h1 className="text-3xl font-semibold text-foreground">Rescue 24/7</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Rebuilt around the current backend: intake first, then case workflow, then service handoff. Use booking communication only after a real service draft exists.
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

          <Button variant="outline" onClick={() => void loadRequests('refresh')} disabled={refreshing || loading}>
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(480px,0.95fr)]">
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
                const linkedBookingIdForRow = extractLinkedBookingId(request.internal_notes);

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
                      <div className="min-w-0">
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
                        <div>{formatRelative(request.created_at)}</div>
                        <div className="mt-1">{formatSourceLabel(request.source)}</div>
                        <div className="mt-1">
                          {request.assigned_to
                            ? assignedToCurrentUser
                              ? 'Assigned to you'
                              : 'Assigned'
                            : 'Unassigned'}
                        </div>
                        {linkedBookingIdForRow ? (
                          <div className="mt-1 inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <ChevronRight className="h-3.5 w-3.5" />
                            Service linked
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {!selectedRequest ? (
            <Card>
              <CardContent className="rounded-xl border border-dashed px-4 py-12 text-center text-muted-foreground">
                Select a rescue request to inspect and manage it.
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Case overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">Request #{selectedRequest.id}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Created {formatDateTime(selectedRequest.created_at)} · {formatRelative(selectedRequest.created_at)}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusTone(selectedRequest.status)}`}>
                      {selectedRequest.status}
                    </span>
                  </div>

                  <WorkflowRail steps={workflowSteps} />

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border bg-background p-3">
                      <p className="font-medium text-foreground">Caller</p>
                      <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${selectedRequest.phone}`} className="hover:text-foreground">
                          {selectedRequest.phone}
                        </a>
                      </p>
                    </div>
                    <div className="rounded-xl border bg-background p-3">
                      <p className="font-medium text-foreground">Source</p>
                      <p className="mt-2 text-sm text-muted-foreground">{formatSourceLabel(selectedRequest.source)}</p>
                    </div>
                    <div className="rounded-xl border bg-background p-3 md:col-span-2">
                      <p className="font-medium text-foreground">Location</p>
                      <p className="mt-2 text-sm text-muted-foreground">{formatLocation(selectedRequest)}</p>
                      {selectedRequest.lat !== null && selectedRequest.lng !== null ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          GPS: {selectedRequest.lat}, {selectedRequest.lng}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Workflow actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleQuickAction('assigned', 'Case assigned to operator.', 'assigned')}
                      disabled={saving}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Assign case
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleQuickAction('vehicle_received', 'Vehicle received on site.', 'vehicle_received')}
                      disabled={saving}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Receive car
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateServiceOpen(true)}
                      disabled={saving || Boolean(linkedBooking)}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create service
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => openCommunicationHub(true)}
                      disabled={!linkedBooking || !linkedBooking.customer_email}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Send email
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => openCommunicationHub(false)}
                      disabled={!linkedBooking}
                    >
                      <Wrench className="mr-2 h-4 w-4" />
                      Communication hub
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleQuickAction('completed', 'Case closed.', 'completed')}
                      disabled={saving}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Close case
                    </Button>
                  </div>

                  <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                    Booking communication is intentionally a second step. Rescue intake stays compact until a service draft exists.
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Service handoff</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingLinkedBooking ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading linked booking...
                    </div>
                  ) : linkedBooking ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border bg-muted/30 p-3">
                        <p className="font-medium text-foreground">Booking</p>
                        <p className="mt-2 text-sm text-muted-foreground">{linkedBooking.id}</p>
                      </div>
                      <div className="rounded-xl border bg-muted/30 p-3">
                        <p className="font-medium text-foreground">Customer</p>
                        <p className="mt-2 text-sm text-muted-foreground">{linkedBooking.customer_name || '—'}</p>
                      </div>
                      <div className="rounded-xl border bg-muted/30 p-3">
                        <p className="font-medium text-foreground">Service</p>
                        <p className="mt-2 text-sm text-muted-foreground">{linkedBooking.service_name || '—'}</p>
                      </div>
                      <div className="rounded-xl border bg-muted/30 p-3">
                        <p className="font-medium text-foreground">Schedule</p>
                        <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarDays className="h-4 w-4" />
                          {linkedBooking.booking_date} · {linkedBooking.booking_time}
                        </p>
                      </div>
                      <div className="rounded-xl border bg-muted/30 p-3">
                        <p className="font-medium text-foreground">Plate</p>
                        <p className="mt-2 text-sm text-muted-foreground">{linkedBooking.license_plate || '—'}</p>
                      </div>
                      <div className="rounded-xl border bg-muted/30 p-3">
                        <p className="font-medium text-foreground">Email</p>
                        <p className="mt-2 text-sm text-muted-foreground">{linkedBooking.customer_email || '—'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                      No linked service draft yet. Create one from this rescue case when the car is received and the workshop needs a formal service record.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Case editor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
              </Card>

              <TimelineCard
                request={selectedRequest}
                events={events}
                eventsLoading={eventsLoading}
                eventsAvailable={eventsAvailable}
                linkedBooking={linkedBooking}
              />
            </>
          )}
        </div>
      </div>

      <Dialog open={createServiceOpen} onOpenChange={setCreateServiceOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Create service draft</DialogTitle>
            <DialogDescription>
              Convert this rescue intake into a booking/service record so schedule, workshop handling, and communication can continue in the existing booking system.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rescue-service-license-plate">License plate</Label>
              <Input
                id="rescue-service-license-plate"
                value={createServiceForm.licensePlate}
                onChange={(event) => setCreateServiceForm((current) => ({ ...current, licensePlate: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rescue-service-customer-name">Customer name</Label>
              <Input
                id="rescue-service-customer-name"
                value={createServiceForm.customerName}
                onChange={(event) => setCreateServiceForm((current) => ({ ...current, customerName: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rescue-service-email">Customer email</Label>
              <Input
                id="rescue-service-email"
                type="email"
                value={createServiceForm.customerEmail}
                onChange={(event) => setCreateServiceForm((current) => ({ ...current, customerEmail: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rescue-service-name">Service</Label>
              <Input
                id="rescue-service-name"
                value={createServiceForm.serviceName}
                onChange={(event) => setCreateServiceForm((current) => ({ ...current, serviceName: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rescue-service-date">Booking date</Label>
              <Input
                id="rescue-service-date"
                type="date"
                value={createServiceForm.bookingDate}
                onChange={(event) => setCreateServiceForm((current) => ({ ...current, bookingDate: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rescue-service-time">Booking time</Label>
              <Input
                id="rescue-service-time"
                type="time"
                value={createServiceForm.bookingTime}
                onChange={(event) => setCreateServiceForm((current) => ({ ...current, bookingTime: event.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rescue-service-notes">Booking notes</Label>
            <Textarea
              id="rescue-service-notes"
              rows={8}
              value={createServiceForm.notes}
              onChange={(event) => setCreateServiceForm((current) => ({ ...current, notes: event.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCreateServiceOpen(false)} disabled={creatingService}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleCreateServiceDraft()} disabled={creatingService}>
              {creatingService ? 'Creating...' : 'Create service draft'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BookingCommunicationModal
        booking={linkedBooking}
        conversation={linkedBooking ? bookingConversation.bookingConversations[linkedBooking.id] : undefined}
        isLoadingConversation={linkedBooking ? bookingConversation.loadingConversationBookingId === linkedBooking.id : false}
        language={language}
        messageDraft={linkedBooking ? bookingConversation.messageDrafts[linkedBooking.id] : undefined}
        open={communicationOpen}
        sending={linkedBooking ? bookingConversation.sendingMessageBookingId === linkedBooking.id : false}
        theme={theme}
        t={(key) => cmsStrings[key as keyof typeof cmsStrings] || key}
        onDraftChange={bookingConversation.handleBookingMessageDraftChange}
        onOpenChange={setCommunicationOpen}
        onReply={(booking, message) => bookingConversation.handleOpenMessageComposer(booking, message)}
        onSend={(booking) => void bookingConversation.handleSendBookingMessage(booking)}
        onSync={(bookingId) => void bookingConversation.handleSyncBookingConversation(bookingId)}
      />
    </div>
  );
}
