import type { BriefingItem } from './CmsPwaBriefingCard';
import type { CmsPwaTab } from './CmsPwaTabBar';
import type { BookingRow, CmsPwaRoute, OrderRow, TabSection } from './types';
import { detectStoredServiceLanguage, localizeStoredServiceName } from '../../utils/serviceCatalog';
import { isInstalledPwaDisplay, isStandalonePwaDeploy, pwaPath } from '../../config/runtime';

export const REFRESH_INTERVAL_MS = 30_000;
export const BOOKING_STATUS_HANDOFF = 'handoff';

const BOOKING_CARD_COPY = {
  fi: {
    newBookingsTitle: 'Uudet varaukset',
    newBookingsCaption: 'Ei vielä siirretty desktop-CMS:ään',
    upcomingTitle: 'Tulevat',
    upcomingCaption: 'Seuraavat varatut ajat',
    bookingFallback: 'Varaus',
    upcomingFallback: 'Tuleva varaus',
    customerBookingRequest: 'Asiakkaan varaustieto',
    noNotes: 'Ei varausmuistiinpanoja.',
    notHandedOff: 'Ei siirretty',
    handoffActive: 'Siirto aktiivinen',
    confirmed: 'Vahvistettu',
    scheduled: 'Ajastettu',
    handoffLabel: 'Siirretty',
    createdLabel: 'Luotu',
    confirmedLabel: 'Vahvistettu',
    noteLabel: 'Varausmuistiinpano',
    callCustomer: 'Soita asiakkaalle',
    emailCustomer: 'Lähetä sähköposti',
    finnish: 'Suomi',
    english: 'Englanti',
    newBookingsZeroTitle: 'Uudet varaukset: 0',
  },
  en: {
    newBookingsTitle: 'New bookings',
    newBookingsCaption: 'Not yet handed off to desktop CMS',
    upcomingTitle: 'Upcoming',
    upcomingCaption: 'Next scheduled bookings',
    bookingFallback: 'Booking',
    upcomingFallback: 'Upcoming booking',
    customerBookingRequest: 'Customer booking request',
    noNotes: 'No booking notes added yet.',
    notHandedOff: 'Not handed off',
    handoffActive: 'Handoff active',
    confirmed: 'Confirmed',
    scheduled: 'Scheduled',
    handoffLabel: 'Handoff',
    createdLabel: 'Created',
    confirmedLabel: 'Confirmed',
    noteLabel: 'Booking note',
    callCustomer: 'Call customer',
    emailCustomer: 'Email customer',
    finnish: 'Finnish',
    english: 'English',
    newBookingsZeroTitle: 'New bookings: 0',
  },
} as const;

function buildTelHref(phone?: string | null) {
  if (!phone) {
    return undefined;
  }

  const normalized = phone.replace(/[^\d+]/g, '');
  return normalized ? `tel:${normalized}` : undefined;
}

export const tabPathMap: Record<CmsPwaTab, string> = {
  rescue: pwaPath('/'),
  booking: pwaPath('/booking'),
  order: pwaPath('/order'),
  tools: pwaPath('/tools'),
};

export const toolSections: Array<{
  title: string;
  note: string;
  status: string;
}> = [
  { title: 'Rescue 24/7 escalation board', note: 'Planned dedicated queue and escalation routing.', status: 'Planned' },
  { title: 'Push notification controls', note: 'Permission setup, device registration, and quiet hours.', status: 'Planned' },
  { title: 'Driver assignment board', note: 'Dispatch view for rescue and urgent bookings.', status: 'Future' },
  { title: 'Shift briefing shortcuts', note: 'Pinned actions for opening schedule, order, or rescue context.', status: 'Future' },
];

export const rescueSections: TabSection[] = [
  {
    title: 'New',
    caption: 'Needs immediate response',
    items: [
      {
        id: 'rescue-1',
        title: 'BMW 320D stalled near Pasila',
        subtitle: 'Customer reports engine cutout and cannot restart.',
        status: 'Urgent rescue',
        time: 'Created 04:18',
        tone: 'critical',
        location: 'Pasila station',
        phone: '+358 40 555 2481',
        owner: 'Unassigned',
        details: [
          'Vehicle blocks a loading lane and customer needs callback immediately.',
          'Tow assistance not yet assigned. Customer waiting on site.',
          'Priority should stay at the top until acknowledged.',
        ],
        actions: [
          { label: 'Call now', kind: 'primary' },
          { label: 'Assign' },
          { label: 'Mark in progress' },
        ],
      },
      {
        id: 'rescue-2',
        title: 'Tesla Model 3 low-voltage support request',
        subtitle: 'Phone briefing only. No tow booked yet.',
        status: 'Needs triage',
        time: 'Created 03:52',
        tone: 'warning',
        location: 'Kalasatama',
        phone: '+358 50 221 9173',
        owner: 'Night shift',
        details: [
          'Customer needs advice on whether roadside support or workshop visit is required.',
          'Battery warning visible. Car still movable.',
        ],
        actions: [
          { label: 'Open briefing', kind: 'primary' },
          { label: 'Call' },
        ],
      },
    ],
  },
  {
    title: 'In progress',
    caption: 'Already acknowledged',
    items: [
      {
        id: 'rescue-3',
        title: 'Mercedes GLC tire damage',
        subtitle: 'Replacement wheel arranged and technician on route.',
        status: 'Technician assigned',
        time: 'Updated 03:40',
        tone: 'normal',
        location: 'Espoo center',
        owner: 'Ari K.',
        details: [
          'Customer has been contacted and ETA confirmed.',
          'Keep visible until technician closes the case.',
        ],
        actions: [
          { label: 'Open detail', kind: 'primary' },
          { label: 'Message customer' },
        ],
      },
    ],
  },
  {
    title: 'Done today',
    caption: 'Completed rescue work',
    items: [
      {
        id: 'rescue-4',
        title: 'Volvo XC60 jump-start complete',
        subtitle: 'Customer released and case closed.',
        status: 'Completed',
        time: 'Closed 02:48',
        tone: 'done',
        owner: 'Mika L.',
        details: [
          'Resolved on site. Workshop follow-up recommended for battery replacement.',
        ],
        actions: [
          { label: 'Open log' },
        ],
      },
    ],
  },
];

export function resolveCmsPwaRoute(pathname: string): CmsPwaRoute {
  const normalized = pathname.replace(/\/+$/, '') || '/';

  if (isStandalonePwaDeploy || isInstalledPwaDisplay()) {
    if (normalized === '/cms' || normalized === '/cms/rescue') {
      return { kind: 'cms', tab: 'rescue' };
    }
    if (normalized === '/cms/booking') {
      return { kind: 'cms', tab: 'booking' };
    }
    if (normalized === '/cms/order') {
      return { kind: 'cms', tab: 'order' };
    }
    if (normalized === '/cms/tools') {
      return { kind: 'cms', tab: 'tools' };
    }
  }

  if (normalized === '/pwa/cms' || normalized === '/pwa/cms/rescue') {
    return { kind: 'cms', tab: 'rescue' };
  }
  if (normalized === '/pwa/cms/booking') {
    return { kind: 'cms', tab: 'booking' };
  }
  if (normalized === '/pwa/cms/order') {
    return { kind: 'cms', tab: 'order' };
  }
  if (normalized === '/pwa/cms/tools') {
    return { kind: 'cms', tab: 'tools' };
  }
  return { kind: 'not-found' };
}

export function formatShortDateTime(value: string | null | undefined) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function normalizeBookingTimeValue(value: string) {
  const trimmed = value.trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00`;
  }
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed;
}

function formatBookingSlot(date: string, time: string) {
  const parsed = new Date(`${date}T${normalizeBookingTimeValue(time)}`);
  if (Number.isNaN(parsed.getTime())) return `${date} ${time}`;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

function formatCalendarDateTimeLabel(date: string, time: string) {
  const parsed = new Date(`${date}T${normalizeBookingTimeValue(time)}`);
  if (Number.isNaN(parsed.getTime())) return `${date} ${time}`;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

function normalizeOrderSnapshot(snapshot: unknown) {
  if (!snapshot) return {};
  if (typeof snapshot === 'string') {
    try {
      return JSON.parse(snapshot);
    } catch {
      return {};
    }
  }
  if (typeof snapshot === 'object') {
    return snapshot as Record<string, any>;
  }
  return {};
}

function canonicalOrderStatus(value: string | null | undefined) {
  const normalized = (value ?? '').trim().toLowerCase();
  if (!normalized) return 'receive';
  if (normalized === 'ready_for_pickup' || normalized === 'arrived') return 'ready';
  if (normalized === 'pending' || normalized === 'received') return 'receive';
  if (normalized === 'processing' || normalized === 'in_transit' || normalized === 'shipped') return 'sent';
  if (normalized === 'completed') return 'done';
  if (normalized === 'canceled') return 'cancelled';
  return normalized;
}

function orderTone(status: string): BriefingItem['tone'] {
  if (status === 'receive') return 'warning';
  if (status === 'cancelled' || status === 'returned') return 'warning';
  if (status === 'ready' || status === 'delivered' || status === 'done') return 'done';
  return 'normal';
}

function orderStatusLabel(status: string) {
  if (status === 'receive') return 'New order';
  if (status === 'sent') return 'Processing';
  if (status === 'ready') return 'Ready';
  if (status === 'delivered') return 'Delivered';
  if (status === 'done') return 'Done';
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'returned') return 'Returned';
  return status.replace(/_/g, ' ');
}

function formatMoney(cents: number | null | undefined) {
  if (typeof cents !== 'number') return null;
  return new Intl.NumberFormat('fi-FI', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export function isMissingColumnError(error: any, column: string) {
  const text = `${error?.message ?? ''} ${error?.details ?? ''}`.toLowerCase();
  return text.includes('column') && text.includes(column.toLowerCase());
}

export function isBookingAcknowledged(booking: BookingRow) {
  if (!booking.created_at || !booking.updated_at) {
    return false;
  }

  const createdAt = new Date(booking.created_at).getTime();
  const updatedAt = new Date(booking.updated_at).getTime();

  if (!Number.isFinite(createdAt) || !Number.isFinite(updatedAt)) {
    return false;
  }

  return updatedAt - createdAt > 1000;
}

export function isBookingAttentionItem(booking: BookingRow) {
  const normalizedStatus = (booking.status ?? 'confirmed').toLowerCase();
  if (normalizedStatus === 'cancelled' || normalizedStatus === BOOKING_STATUS_HANDOFF || isBookingAcknowledged(booking)) {
    return false;
  }
  return true;
}

function normalizeBookingLanguage(value: string | null | undefined): 'fi' | 'en' | null {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'en' || normalized === 'english') return 'en';
  if (normalized === 'fi' || normalized === 'finnish' || normalized === 'suomi') return 'fi';
  return null;
}

export function buildBookingSections(rows: BookingRow[], opsLanguage: 'fi' | 'en'): TabSection[] {
  const copy = BOOKING_CARD_COPY[opsLanguage];
  const activeRows = rows.filter((booking) => (booking.status ?? 'confirmed').toLowerCase() !== 'cancelled');
  const now = Date.now();

  const newItems = activeRows
    .filter((booking) => isBookingAttentionItem(booking))
    .slice(0, 8)
    .map<BriefingItem>((booking) => {
      const bookingMoment = new Date(`${booking.booking_date}T${booking.booking_time}:00`).getTime();
      const soon = Number.isFinite(bookingMoment) && bookingMoment - now <= 24 * 60 * 60 * 1000;
      const detectedLanguage = detectStoredServiceLanguage(booking.service_name);
      const explicitBookingLanguage = normalizeBookingLanguage(booking.booking_language);
      const bookingLanguage = explicitBookingLanguage
        ?? detectedLanguage
        ?? 'fi';
      const localizedServiceName = localizeStoredServiceName(booking.service_name, opsLanguage);
      return {
        id: booking.id,
        title: localizedServiceName || booking.service_name || copy.bookingFallback,
        subtitle: copy.customerBookingRequest,
        status: copy.notHandedOff,
        time: formatBookingSlot(booking.booking_date, booking.booking_time),
        tone: soon ? 'warning' : 'normal',
        licensePlate: booking.license_plate || undefined,
        phone: booking.customer_phone || undefined,
        owner: booking.customer_name || undefined,
        email: booking.customer_email || undefined,
        bookingLanguageFlag: bookingLanguage === 'en' ? '🇬🇧' : '🇫🇮',
        bookingLanguageLabel: bookingLanguage === 'en' ? copy.english : copy.finnish,
        createdAtLabel: booking.created_at ? `${copy.createdLabel} ${formatShortDateTime(booking.created_at)}` : undefined,
        noteLabel: copy.noteLabel,
        details: [
          booking.notes?.trim() ? booking.notes.trim() : copy.noNotes,
        ],
        actions: [
          ...(buildTelHref(booking.customer_phone)
            ? [{ label: copy.callCustomer, kind: 'primary' as const, href: buildTelHref(booking.customer_phone) }]
            : []),
          {
            label: copy.emailCustomer,
            href: booking.customer_email ? `mailto:${booking.customer_email}` : '#',
            disabled: !booking.customer_email,
          },
        ],
      };
    });

  const upcomingItems = activeRows
    .slice(0, 10)
    .map<BriefingItem>((booking) => {
      const normalizedStatus = (booking.status ?? 'confirmed').toLowerCase();
      const handoffActive = normalizedStatus === BOOKING_STATUS_HANDOFF;
      const acknowledged = isBookingAcknowledged(booking);
      const detectedLanguage = detectStoredServiceLanguage(booking.service_name);
      const explicitBookingLanguage = normalizeBookingLanguage(booking.booking_language);
      const bookingLanguage = explicitBookingLanguage
        ?? detectedLanguage
        ?? 'fi';
      const localizedServiceName = localizeStoredServiceName(booking.service_name, opsLanguage);
      const handoffTimestamp = handoffActive ? booking.updated_at ?? null : null;

      return {
        id: `${booking.id}-upcoming`,
        title: localizedServiceName || booking.service_name || copy.upcomingFallback,
        subtitle: booking.customer_name || booking.customer_email || 'Booking scheduled',
        status: handoffActive ? copy.handoffActive : acknowledged ? copy.confirmed : copy.scheduled,
        secondaryStatus: handoffTimestamp ? `${copy.handoffLabel} ${formatShortDateTime(handoffTimestamp)}` : undefined,
        time: formatCalendarDateTimeLabel(booking.booking_date, booking.booking_time),
        tone: handoffActive ? 'warning' : acknowledged ? 'done' : 'done',
        licensePlate: booking.license_plate || undefined,
        phone: booking.customer_phone || undefined,
        owner: booking.customer_name || undefined,
        email: booking.customer_email || undefined,
        bookingLanguageFlag: bookingLanguage === 'en' ? '🇬🇧' : '🇫🇮',
        bookingLanguageLabel: bookingLanguage === 'en' ? copy.english : copy.finnish,
        createdAtLabel: booking.created_at ? `${copy.createdLabel} ${formatShortDateTime(booking.created_at)}` : undefined,
        confirmedAtLabel: acknowledged && booking.updated_at ? `${copy.confirmedLabel} ${formatShortDateTime(booking.updated_at)}` : undefined,
        noteLabel: copy.noteLabel,
        details: [
          booking.notes?.trim() ? booking.notes.trim() : copy.noNotes,
        ],
        actions: [
          ...(buildTelHref(booking.customer_phone)
            ? [{ label: copy.callCustomer, kind: 'primary' as const, href: buildTelHref(booking.customer_phone) }]
            : []),
          {
            label: copy.emailCustomer,
            href: booking.customer_email ? `mailto:${booking.customer_email}` : '#',
            disabled: !booking.customer_email,
          },
        ],
      };
    });

  return [
    {
      title: newItems.length === 0 ? copy.newBookingsZeroTitle : copy.newBookingsTitle,
      caption: newItems.length === 0 ? '' : copy.newBookingsCaption,
      items: newItems,
      hideEmptyState: true,
    },
    { title: copy.upcomingTitle, caption: copy.upcomingCaption, items: upcomingItems },
  ];
}

export function buildOrderSections(rows: OrderRow[]): TabSection[] {
  const mapped = rows.map((order) => {
    const snapshot = normalizeOrderSnapshot(order.cart_snapshot);
    const derivedStatus = canonicalOrderStatus(
      snapshot.fulfillment_status ??
      snapshot.fulfilment_status ??
      snapshot.workflow?.status ??
      snapshot.admin_status ??
      order.status,
    );
    const items = Array.isArray(snapshot.items) ? snapshot.items : [];
    const firstItem = items[0] ?? null;
    const customerName = [order.customer_first_name, order.customer_last_name].filter(Boolean).join(' ').trim();
    const totalLabel = formatMoney(order.grand_total_cents);

    return {
      id: order.id,
      status: derivedStatus,
      item: {
        id: order.id,
        title: `Order #${order.id.slice(0, 8)}`,
        subtitle: firstItem?.name || snapshot.item_name || 'Order requires review',
        status: orderStatusLabel(derivedStatus),
        time: order.created_at ? `Created ${formatShortDateTime(order.created_at)}` : 'Created recently',
        tone: orderTone(derivedStatus),
        phone: order.customer_phone || undefined,
        owner: customerName || undefined,
        details: [
          customerName ? `Customer: ${customerName}` : 'Customer name not available.',
          order.customer_email ? `Email: ${order.customer_email}` : 'No customer email on file.',
          totalLabel ? `Total: ${totalLabel}` : 'Total not available.',
        ],
        actions: [
          { label: 'Open order', kind: 'primary', href: '/cms' },
          ...(buildTelHref(order.customer_phone)
            ? [{ label: 'Call', href: buildTelHref(order.customer_phone) }]
            : []),
        ],
      } satisfies BriefingItem,
    };
  });

  return [
    {
      title: 'New orders',
      caption: 'Needs operator review',
      items: mapped.filter((entry) => !['ready', 'delivered', 'done'].includes(entry.status)).slice(0, 10).map((entry) => entry.item),
    },
    {
      title: 'Processed',
      caption: 'Already handled',
      items: mapped.filter((entry) => ['ready', 'delivered', 'done'].includes(entry.status)).slice(0, 10).map((entry) => entry.item),
    },
  ];
}
