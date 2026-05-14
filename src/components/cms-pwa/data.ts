import type { BriefingItem } from './CmsPwaBriefingCard';
import type { CmsPwaTab } from './CmsPwaTabBar';
import type { BookingRow, CmsPwaRoute, OrderRow, TabSection } from './types';
import type { Language } from '../../i18n/types';
import { detectStoredServiceLanguage, localizeStoredServiceName } from '../../utils/serviceCatalog';
import { isInstalledPwaDisplay, isStandalonePwaDeploy, pwaPath } from '../../config/runtime';

export const REFRESH_INTERVAL_MS = 30_000;
export const BOOKING_STATUS_HANDOFF = 'handoff';

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

function buildBookingCardCopy(t: TranslateFn) {
  return {
    newBookingsTitle: t('cmsPwa.booking.newBookingsTitle'),
    newBookingsCaption: t('cmsPwa.booking.newBookingsCaption'),
    upcomingTitle: t('cmsPwa.booking.upcomingTitle'),
    upcomingCaption: t('cmsPwa.booking.upcomingCaption'),
    bookingFallback: t('cmsPwa.booking.bookingFallback'),
    upcomingFallback: t('cmsPwa.booking.upcomingFallback'),
    customerBookingRequest: t('cmsPwa.booking.customerBookingRequest'),
    noNotes: t('cmsPwa.booking.noNotes'),
    notHandedOff: t('cmsPwa.booking.notHandedOff'),
    handoffActive: t('cmsPwa.booking.handoffActive'),
    confirmed: t('cmsPwa.booking.confirmed'),
    scheduled: t('cmsPwa.booking.scheduled'),
    handoffLabel: t('cmsPwa.booking.handoffLabel'),
    createdLabel: t('cmsPwa.booking.createdLabel'),
    confirmedLabel: t('cmsPwa.booking.confirmedLabel'),
    noteLabel: t('cmsPwa.booking.noteLabel'),
    callCustomer: t('cmsPwa.booking.callCustomer'),
    emailCustomer: t('cmsPwa.booking.emailCustomer'),
    finnish: t('cmsPwa.booking.finnish'),
    english: t('cmsPwa.booking.english'),
    newBookingsZeroTitle: t('cmsPwa.booking.newBookingsZeroTitle'),
    scheduledFallback: t('cmsPwa.booking.scheduledFallback'),
  };
}

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

export function buildToolSections(t: TranslateFn): Array<{
  title: string;
  note: string;
  status: string;
}> {
  return [
    {
      title: t('cmsPwa.tools.rescueBoard.title'),
      note: t('cmsPwa.tools.rescueBoard.note'),
      status: t('cmsPwa.tools.planned'),
    },
    {
      title: t('cmsPwa.tools.pushControls.title'),
      note: t('cmsPwa.tools.pushControls.note'),
      status: t('cmsPwa.tools.planned'),
    },
    {
      title: t('cmsPwa.tools.driverBoard.title'),
      note: t('cmsPwa.tools.driverBoard.note'),
      status: t('cmsPwa.tools.future'),
    },
    {
      title: t('cmsPwa.tools.shiftShortcuts.title'),
      note: t('cmsPwa.tools.shiftShortcuts.note'),
      status: t('cmsPwa.tools.future'),
    },
  ];
}

export function buildRescueSections(t: TranslateFn): TabSection[] {
  return [
    {
      title: t('cmsPwa.rescue.new'),
      caption: t('cmsPwa.rescue.needsImmediateResponse'),
      items: [
        {
          id: 'rescue-1',
          title: t('cmsPwa.rescue.bmwTitle'),
          subtitle: t('cmsPwa.rescue.bmwSubtitle'),
          status: t('cmsPwa.rescue.urgentRescue'),
          time: t('cmsPwa.rescue.created0418'),
          tone: 'critical',
          location: t('cmsPwa.rescue.pasilaStation'),
          phone: '+358 40 555 2481',
          owner: t('cmsPwa.rescue.unassigned'),
          details: [
            t('cmsPwa.rescue.bmwDetail1'),
            t('cmsPwa.rescue.bmwDetail2'),
            t('cmsPwa.rescue.bmwDetail3'),
          ],
          actions: [
            { label: t('cmsPwa.rescue.callNow'), kind: 'primary', icon: 'phone' },
            { label: t('cmsPwa.rescue.assign') },
            { label: t('cmsPwa.rescue.markInProgress') },
          ],
        },
        {
          id: 'rescue-2',
          title: t('cmsPwa.rescue.teslaTitle'),
          subtitle: t('cmsPwa.rescue.teslaSubtitle'),
          status: t('cmsPwa.rescue.needsTriage'),
          time: t('cmsPwa.rescue.created0352'),
          tone: 'warning',
          location: 'Kalasatama',
          phone: '+358 50 221 9173',
          owner: t('cmsPwa.rescue.nightShift'),
          details: [
            t('cmsPwa.rescue.teslaDetail1'),
            t('cmsPwa.rescue.teslaDetail2'),
          ],
          actions: [
            { label: t('cmsPwa.rescue.openBriefing'), kind: 'primary' },
            { label: t('cmsPwa.rescue.call'), icon: 'phone' },
          ],
        },
      ],
    },
    {
      title: t('cmsPwa.rescue.inProgress'),
      caption: t('cmsPwa.rescue.alreadyAcknowledged'),
      items: [
        {
          id: 'rescue-3',
          title: t('cmsPwa.rescue.mercedesTitle'),
          subtitle: t('cmsPwa.rescue.mercedesSubtitle'),
          status: t('cmsPwa.rescue.technicianAssigned'),
          time: t('cmsPwa.rescue.updated0340'),
          tone: 'normal',
          location: t('cmsPwa.rescue.espooCenter'),
          owner: 'Ari K.',
          details: [
            t('cmsPwa.rescue.mercedesDetail1'),
            t('cmsPwa.rescue.mercedesDetail2'),
          ],
          actions: [
            { label: t('cmsPwa.rescue.openDetail'), kind: 'primary' },
            { label: t('cmsPwa.rescue.messageCustomer'), icon: 'mail' },
          ],
        },
      ],
    },
    {
      title: t('cmsPwa.rescue.doneToday'),
      caption: t('cmsPwa.rescue.completedWork'),
      items: [
        {
          id: 'rescue-4',
          title: t('cmsPwa.rescue.volvoTitle'),
          subtitle: t('cmsPwa.rescue.volvoSubtitle'),
          status: t('cmsPwa.rescue.completed'),
          time: t('cmsPwa.rescue.closed0248'),
          tone: 'done',
          owner: 'Mika L.',
          details: [
            t('cmsPwa.rescue.volvoDetail1'),
          ],
          actions: [
            { label: t('cmsPwa.rescue.openLog') },
          ],
        },
      ],
    },
  ];
}

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

function orderStatusLabel(status: string, t: TranslateFn) {
  if (status === 'receive') return t('cmsPwa.order.newOrder');
  if (status === 'sent') return t('cmsPwa.order.processing');
  if (status === 'ready') return t('cmsPwa.order.ready');
  if (status === 'delivered') return t('cmsPwa.order.delivered');
  if (status === 'done') return t('cmsPwa.order.done');
  if (status === 'cancelled') return t('cmsPwa.order.cancelled');
  if (status === 'returned') return t('cmsPwa.order.returned');
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

export function buildBookingSections(rows: BookingRow[], opsLanguage: Language, t: TranslateFn): TabSection[] {
  const copy = buildBookingCardCopy(t);
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
        subtitle: booking.customer_name || booking.customer_email || copy.scheduledFallback,
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

export function buildOrderSections(rows: OrderRow[], t: TranslateFn): TabSection[] {
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
        subtitle: firstItem?.name || snapshot.item_name || t('cmsPwa.order.requiresReview'),
        status: orderStatusLabel(derivedStatus, t),
        time: order.created_at ? `${t('cmsPwa.order.created')} ${formatShortDateTime(order.created_at)}` : t('cmsPwa.order.createdRecently'),
        tone: orderTone(derivedStatus),
        phone: order.customer_phone || undefined,
        owner: customerName || undefined,
        details: [
          customerName ? `${t('cmsPwa.order.customer')}: ${customerName}` : t('cmsPwa.order.customerNameMissing'),
          order.customer_email ? `${t('cmsPwa.order.email')}: ${order.customer_email}` : t('cmsPwa.order.noCustomerEmail'),
          totalLabel ? `${t('cmsPwa.order.total')}: ${totalLabel}` : t('cmsPwa.order.totalMissing'),
        ],
        actions: [
          { label: t('cmsPwa.order.openOrder'), kind: 'primary', href: '/cms' },
          ...(buildTelHref(order.customer_phone)
            ? [{ label: t('cmsPwa.order.call'), href: buildTelHref(order.customer_phone) }]
            : []),
        ],
      } satisfies BriefingItem,
    };
  });

  return [
    {
      title: t('cmsPwa.order.newOrders'),
      caption: t('cmsPwa.order.needsReview'),
      items: mapped.filter((entry) => !['ready', 'delivered', 'done'].includes(entry.status)).slice(0, 10).map((entry) => entry.item),
    },
    {
      title: t('cmsPwa.order.processed'),
      caption: t('cmsPwa.order.alreadyHandled'),
      items: mapped.filter((entry) => ['ready', 'delivered', 'done'].includes(entry.status)).slice(0, 10).map((entry) => entry.item),
    },
  ];
}
