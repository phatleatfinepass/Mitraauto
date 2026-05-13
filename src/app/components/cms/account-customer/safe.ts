import { ACCOUNT_STATUSES, CMS_MODULES, CUSTOMER_NOTIFICATION_CHANNELS, CUSTOMER_NOTIFICATION_STATUSES, CUSTOMER_STATUSES, CUSTOMER_TYPES, MAINTENANCE_REMINDER_STATUSES, PERMISSION_VALUES, STAFF_ROLES } from './constants';
import type {
  AccountStatus,
  CmsPermissionValue,
  AccountEventRow,
  CustomerDetail,
  CustomerAutoLinkResult,
  CustomerDraft,
  CustomerHistory,
  CustomerHistoryBooking,
  CustomerHistoryEvent,
  CustomerHistoryInvoice,
  CustomerHistoryOrder,
  CustomerHistoryRescue,
  CustomerLinkSuggestion,
  CustomerMaintenanceReminder,
  CustomerMaintenanceReminderDraft,
  CustomerNotificationHistoryRow,
  CustomerNoteRow,
  CustomerNoteVisibility,
  CustomerOverviewRow,
  CustomerServiceBookDraft,
  CustomerServiceBookEntry,
  CustomerStatus,
  CustomerType,
  CustomerVehiclePlateLookupRow,
  CustomerVehicleDraft,
  CustomerVehicleRow,
  LicensePlateConflict,
  LicensePlateConflictOwner,
  LicensePlateImportResult,
  StaffAccountRow,
  StaffDraft,
  StaffRole,
} from './types';

function text(value: unknown, fallback = '') {
  return String(value ?? fallback).trim();
}

function nullableText(value: unknown) {
  const next = text(value);
  return next || null;
}

function finiteCount(value: unknown) {
  const next = Number(value ?? 0);
  return Number.isFinite(next) && next > 0 ? Math.floor(next) : 0;
}

function nullableNumber(value: unknown) {
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
}

function normalizeArray(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => text(item)).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .replace(/^\{|\}$/g, '')
      .split(',')
      .map((item) => item.replace(/^"|"$/g, '').trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeRole(value: unknown): StaffRole {
  const candidate = text(value) as StaffRole;
  return STAFF_ROLES.includes(candidate) ? candidate : 'user';
}

function normalizeStatus(value: unknown): AccountStatus {
  const candidate = text(value) as AccountStatus;
  return ACCOUNT_STATUSES.includes(candidate) ? candidate : 'active';
}

function normalizeCustomerStatus(value: unknown): CustomerStatus {
  const candidate = text(value) as CustomerStatus;
  return CUSTOMER_STATUSES.includes(candidate) ? candidate : 'active';
}

function normalizeCustomerType(value: unknown): CustomerType {
  const candidate = text(value) as CustomerType;
  return CUSTOMER_TYPES.includes(candidate) ? candidate : 'personal';
}

function normalizeActivityType(value: unknown): CustomerLinkSuggestion['activityType'] {
  const candidate = text(value) as CustomerLinkSuggestion['activityType'];
  return candidate === 'order' || candidate === 'invoice' || candidate === 'rescue' ? candidate : 'booking';
}

export function normalizeCustomerAutoLinkResult(row: unknown): CustomerAutoLinkResult | null {
  const source = row && typeof row === 'object' ? row as Record<string, unknown> : {};
  const activityType = text(source.activity_type);
  if (!activityType) return null;

  return {
    activityType,
    linkedCount: finiteCount(source.linked_count),
  };
}

function normalizeNoteVisibility(value: unknown): CustomerNoteVisibility {
  const candidate = text(value) as CustomerNoteVisibility;
  return candidate === 'super_admin' ? 'super_admin' : 'internal';
}

function normalizeServiceBookEntryType(value: unknown): CustomerServiceBookEntry['entryType'] {
  const candidate = text(value) as CustomerServiceBookEntry['entryType'];
  return ['maintenance', 'service', 'inspection', 'estimate', 'repair', 'tire', 'cleaning', 'note'].includes(candidate)
    ? candidate
    : 'maintenance';
}

function normalizeMaintenanceReminderStatus(value: unknown): CustomerMaintenanceReminder['status'] {
  const candidate = text(value) as CustomerMaintenanceReminder['status'];
  return MAINTENANCE_REMINDER_STATUSES.includes(candidate) ? candidate : 'active';
}

function normalizeNotificationStatus(value: unknown): CustomerNotificationHistoryRow['status'] {
  const candidate = text(value) as CustomerNotificationHistoryRow['status'];
  return CUSTOMER_NOTIFICATION_STATUSES.includes(candidate) ? candidate : 'queued';
}

function normalizeNotificationChannel(value: unknown): CustomerNotificationHistoryRow['channel'] {
  const candidate = text(value) as CustomerNotificationHistoryRow['channel'];
  return CUSTOMER_NOTIFICATION_CHANNELS.includes(candidate) ? candidate : 'email';
}

function normalizePermission(value: unknown): CmsPermissionValue {
  const candidate = text(value) as CmsPermissionValue;
  return PERMISSION_VALUES.includes(candidate) ? candidate : 'none';
}

export function normalizePermissions(value: unknown) {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return CMS_MODULES.reduce<Record<string, CmsPermissionValue>>((permissions, module) => {
    permissions[module.id] = normalizePermission(source[module.id]);
    return permissions;
  }, {});
}

export function normalizeCustomerRow(row: unknown, index: number): CustomerOverviewRow {
  const source = row && typeof row === 'object' ? row as Record<string, unknown> : {};
  const fallbackKey = `customer-${index}`;

  return {
    key: text(source.customer_key ?? source.customer_id ?? source.email ?? source.phone, fallbackKey) || fallbackKey,
    customerId: nullableText(source.customer_id),
    name: text(source.full_name, 'Customer') || 'Customer',
    email: text(source.email),
    phone: text(source.phone),
    licensePlates: normalizeArray(source.license_plates),
    bookingCount: finiteCount(source.booking_count),
    orderCount: finiteCount(source.order_count),
    invoiceCount: finiteCount(source.invoice_count),
    lastActivityAt: nullableText(source.last_activity_at),
    status: text(source.status, 'active') || 'active',
    source: text(source.source, 'activity') || 'activity',
    hidden: Boolean(source.hidden),
    tags: normalizeArray(source.tags),
    accountId: nullableText(source.account_id),
    accountEmail: text(source.account_email),
    portalEnabled: Boolean(source.portal_enabled),
    benefitPoints: finiteCount(source.benefit_points),
    benefitTier: text(source.benefit_tier, 'bronze') || 'bronze',
    benefitDiscountPercent: Number(source.benefit_discount_percent ?? 0) || 0,
  };
}

export function normalizeStaffRow(row: unknown): StaffAccountRow | null {
  const source = row && typeof row === 'object' ? row as Record<string, unknown> : {};
  const id = text(source.id);
  if (!id) return null;

  return {
    id,
    email: text(source.email),
    displayName: text(source.display_name),
    role: normalizeRole(source.role),
    accountStatus: normalizeStatus(source.account_status),
    hidden: Boolean(source.account_hidden),
    permissions: normalizePermissions(source.cms_permissions),
    createdAt: nullableText(source.created_at),
    updatedAt: nullableText(source.updated_at),
  };
}

export function buildStaffDraft(row: StaffAccountRow): StaffDraft {
  return {
    displayName: row.displayName,
    role: row.role,
    accountStatus: row.accountStatus,
    hidden: row.hidden,
    permissions: { ...row.permissions },
  };
}

export function buildDefaultStaffPermissions(role: StaffRole) {
  const permissions = normalizePermissions({});
  if (role === 'super_admin' || role === 'admin') {
    CMS_MODULES.forEach((module) => {
      permissions[module.id] = 'read_write';
    });
    return permissions;
  }

  if (role === 'supervisor' || role === 'staff') {
    permissions.customers = 'read_write';
  }

  return permissions;
}

export function normalizeAccountEventRow(row: unknown): AccountEventRow | null {
  const source = row && typeof row === 'object' ? row as Record<string, unknown> : {};
  const id = text(source.id);
  if (!id) return null;

  const details = source.details && typeof source.details === 'object'
    ? source.details as Record<string, unknown>
    : {};

  return {
    id,
    targetProfileId: nullableText(source.target_profile_id),
    targetEmail: text(source.target_email),
    actorId: nullableText(source.actor_id),
    actorEmail: text(source.actor_email),
    eventType: text(source.event_type),
    details,
    createdAt: nullableText(source.created_at),
  };
}

function normalizeVehicleRow(row: unknown): CustomerVehicleRow | null {
  const source = row && typeof row === 'object' ? row as Record<string, unknown> : {};
  const id = text(source.id);
  if (!id) return null;

  return {
    id,
    licensePlate: text(source.license_plate).toUpperCase(),
    vehicleName: text(source.vehicle_name),
    vin: text(source.vin),
    notes: text(source.notes),
    hidden: Boolean(source.hidden),
    createdAt: nullableText(source.created_at),
    updatedAt: nullableText(source.updated_at),
  };
}

export function normalizeCustomerVehiclePlateLookup(row: unknown): CustomerVehiclePlateLookupRow | null {
  const source = row && typeof row === 'object' ? row as Record<string, unknown> : {};
  const vehicleId = text(source.vehicle_id);
  const customerId = text(source.customer_id);
  const licensePlate = text(source.license_plate).toUpperCase();
  if (!vehicleId || !customerId || !licensePlate) return null;

  return {
    vehicleId,
    customerId,
    licensePlate,
    vehicleName: text(source.vehicle_name),
    vin: text(source.vin),
    notes: text(source.notes),
    hidden: Boolean(source.hidden),
    customerName: text(source.customer_name),
    customerEmail: text(source.customer_email),
    customerPhone: text(source.customer_phone),
    customerStatus: text(source.customer_status),
    updatedAt: nullableText(source.updated_at),
  };
}

function normalizeNoteRow(row: unknown): CustomerNoteRow | null {
  const source = row && typeof row === 'object' ? row as Record<string, unknown> : {};
  const id = text(source.id);
  if (!id) return null;

  return {
    id,
    body: text(source.body),
    visibility: normalizeNoteVisibility(source.visibility),
    createdBy: nullableText(source.created_by),
    createdAt: nullableText(source.created_at),
  };
}

export function normalizeServiceBookEntry(row: unknown): CustomerServiceBookEntry | null {
  const source = row && typeof row === 'object' ? row as Record<string, unknown> : {};
  const id = text(source.id);
  const customerId = text(source.customer_id);
  if (!id || !customerId) return null;

  const parts = Array.isArray(source.parts) ? source.parts : [];

  return {
    id,
    customerId,
    customerVehicleId: nullableText(source.customer_vehicle_id),
    entryType: normalizeServiceBookEntryType(source.entry_type),
    title: text(source.title),
    description: text(source.description),
    workDate: nullableText(source.work_date),
    mileageKm: nullableNumber(source.mileage_km),
    parts,
    sourceType: text(source.source_type),
    sourceId: nullableText(source.source_id),
    invoiceId: nullableText(source.invoice_id),
    bookingId: nullableText(source.booking_id),
    staffNotes: text(source.staff_notes),
    visibleToCustomer: source.visible_to_customer !== false,
    createdAt: nullableText(source.created_at),
    updatedAt: nullableText(source.updated_at),
  };
}

export function buildServiceBookDraft(customerId: string, entry?: CustomerServiceBookEntry | null): CustomerServiceBookDraft {
  return {
    id: entry?.id ?? null,
    customerId,
    customerVehicleId: entry?.customerVehicleId ?? null,
    entryType: entry?.entryType ?? 'maintenance',
    title: entry?.title ?? '',
    description: entry?.description ?? '',
    workDate: entry?.workDate ?? new Date().toISOString().slice(0, 10),
    mileageKm: entry?.mileageKm === null || entry?.mileageKm === undefined ? '' : String(entry.mileageKm),
    partsText: (entry?.parts ?? []).map((part) => {
      if (typeof part === 'string') return part;
      if (part && typeof part === 'object' && 'label' in part) return text((part as any).label);
      return text(part);
    }).filter(Boolean).join('\n'),
    staffNotes: entry?.staffNotes ?? '',
    visibleToCustomer: entry?.visibleToCustomer ?? true,
  };
}

export function normalizeMaintenanceReminder(row: unknown): CustomerMaintenanceReminder | null {
  const source = row && typeof row === 'object' ? row as Record<string, unknown> : {};
  const id = text(source.id);
  const customerId = text(source.customer_id);
  if (!id || !customerId) return null;

  return {
    id,
    customerId,
    customerVehicleId: nullableText(source.customer_vehicle_id),
    reminderType: text(source.reminder_type, 'maintenance') || 'maintenance',
    title: text(source.title),
    description: text(source.description),
    dueDate: nullableText(source.due_date),
    dueMileageKm: nullableNumber(source.due_mileage_km),
    lastKnownMileageKm: nullableNumber(source.last_known_mileage_km),
    status: normalizeMaintenanceReminderStatus(source.status),
    serviceCritical: source.service_critical !== false,
    nextEmailAt: nullableText(source.next_email_at),
    lastEmailAt: nullableText(source.last_email_at),
    createdAt: nullableText(source.created_at),
    updatedAt: nullableText(source.updated_at),
  };
}

export function buildMaintenanceReminderDraft(customerId: string, reminder?: CustomerMaintenanceReminder | null): CustomerMaintenanceReminderDraft {
  return {
    id: reminder?.id ?? null,
    customerId,
    customerVehicleId: reminder?.customerVehicleId ?? null,
    reminderType: reminder?.reminderType ?? 'maintenance',
    title: reminder?.title ?? '',
    description: reminder?.description ?? '',
    dueDate: reminder?.dueDate ?? '',
    dueMileageKm: reminder?.dueMileageKm === null || reminder?.dueMileageKm === undefined ? '' : String(reminder.dueMileageKm),
    lastKnownMileageKm: reminder?.lastKnownMileageKm === null || reminder?.lastKnownMileageKm === undefined ? '' : String(reminder.lastKnownMileageKm),
    status: reminder?.status ?? 'active',
    serviceCritical: reminder?.serviceCritical ?? true,
    nextEmailAt: reminder?.nextEmailAt ? reminder.nextEmailAt.slice(0, 16) : '',
  };
}

export function normalizeNotificationHistoryRow(row: unknown): CustomerNotificationHistoryRow | null {
  const source = row && typeof row === 'object' ? row as Record<string, unknown> : {};
  const id = text(source.id);
  if (!id) return null;

  const details = source.details && typeof source.details === 'object'
    ? source.details as Record<string, unknown>
    : {};

  return {
    id,
    customerId: nullableText(source.customer_id),
    customerVehicleId: nullableText(source.customer_vehicle_id),
    reminderId: nullableText(source.reminder_id),
    notificationType: text(source.notification_type),
    channel: normalizeNotificationChannel(source.channel),
    recipient: text(source.recipient),
    subject: text(source.subject),
    status: normalizeNotificationStatus(source.status),
    providerMessageId: text(source.provider_message_id),
    sentAt: nullableText(source.sent_at),
    details,
    createdAt: nullableText(source.created_at),
  };
}

export function normalizeCustomerDetail(value: unknown): CustomerDetail | null {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const id = text(source.id);
  if (!id) return null;
  const benefits = source.benefits && typeof source.benefits === 'object'
    ? source.benefits as Record<string, unknown>
    : {};

  return {
    id,
    customerType: normalizeCustomerType(source.customer_type),
    accountId: nullableText(source.account_id),
    accountEmail: text(source.account_email),
    portalEnabled: Boolean(source.portal_enabled),
    portalInvitedAt: nullableText(source.portal_invited_at),
    benefits: {
      pointsBalance: finiteCount(benefits.points_balance),
      lifetimePoints: finiteCount(benefits.lifetime_points),
      tier: text(benefits.tier, 'bronze') || 'bronze',
      discountPercent: Number(benefits.discount_percent ?? 0) || 0,
      updatedAt: nullableText(benefits.updated_at),
    },
    primaryEmail: text(source.primary_email),
    primaryPhone: text(source.primary_phone),
    fullName: text(source.full_name),
    language: text(source.language),
    businessId: text(source.business_id),
    vatId: text(source.vat_id),
    addressLine1: text(source.address_line1),
    addressLine2: text(source.address_line2),
    postalCode: text(source.postal_code),
    city: text(source.city),
    countryCode: text(source.country_code, 'FI') || 'FI',
    status: normalizeCustomerStatus(source.status),
    tags: normalizeArray(source.tags),
    marketingConsent: typeof source.marketing_consent === 'boolean' ? source.marketing_consent : null,
    contactConsent: typeof source.contact_consent === 'boolean' ? source.contact_consent : null,
    hidden: Boolean(source.hidden),
    source: text(source.source, 'cms') || 'cms',
    createdAt: nullableText(source.created_at),
    updatedAt: nullableText(source.updated_at),
    vehicles: normalizeArrayRows(source.vehicles, normalizeVehicleRow),
    notes: normalizeArrayRows(source.notes, normalizeNoteRow),
  };
}

function normalizeHistoryBooking(row: unknown): CustomerHistoryBooking | null {
  const source = row && typeof row === 'object' ? row as Record<string, unknown> : {};
  const id = text(source.id);
  if (!id) return null;

  return {
    id,
    createdAt: nullableText(source.created_at),
    status: text(source.status),
    bookingDate: nullableText(source.booking_date),
    bookingTime: nullableText(source.booking_time),
    bookingLanguage: text(source.booking_language),
    licensePlate: text(source.license_plate),
    serviceName: text(source.service_name),
    customerName: text(source.customer_name),
    customerEmail: text(source.customer_email),
    customerPhone: text(source.customer_phone),
    notes: text(source.notes),
    customerId: nullableText(source.customer_id),
    customerVehicleId: nullableText(source.customer_vehicle_id),
    customerMatchSource: text(source.customer_match_source),
    customerLinkedAt: nullableText(source.customer_linked_at),
  };
}

function summarizeOrderItem(snapshot: unknown) {
  if (!snapshot || typeof snapshot !== 'object') return '';
  const source = snapshot as Record<string, unknown>;
  const directName = text(source.itemName ?? source.name ?? source.title);
  if (directName) return directName;
  const items = Array.isArray(source.items) ? source.items : Array.isArray(source.cartItems) ? source.cartItems : [];
  const firstItem = items[0] && typeof items[0] === 'object' ? items[0] as Record<string, unknown> : null;
  return firstItem ? text(firstItem.name ?? firstItem.title ?? firstItem.label) : '';
}

function normalizeHistoryOrder(row: unknown): CustomerHistoryOrder | null {
  const source = row && typeof row === 'object' ? row as Record<string, unknown> : {};
  const id = text(source.id);
  if (!id) return null;

  return {
    id,
    createdAt: nullableText(source.created_at),
    status: text(source.status),
    paytrailStatus: text(source.paytrail_status),
    paytrailTransactionId: text(source.paytrail_transaction_id),
    paytrailReference: text(source.paytrail_reference),
    email: text(source.email),
    phone: text(source.phone),
    totalCents: nullableNumber(source.grand_total_cents),
    itemLabel: summarizeOrderItem(source.cart_snapshot),
    customerId: nullableText(source.customer_id),
    customerVehicleId: nullableText(source.customer_vehicle_id),
    customerMatchSource: text(source.customer_match_source),
    customerLinkedAt: nullableText(source.customer_linked_at),
  };
}

function normalizeHistoryInvoice(row: unknown): CustomerHistoryInvoice | null {
  const source = row && typeof row === 'object' ? row as Record<string, unknown> : {};
  const id = text(source.id);
  if (!id) return null;

  return {
    id,
    documentNumber: text(source.document_number),
    documentType: text(source.document_type),
    sourceType: text(source.source_type),
    orderId: nullableText(source.order_id),
    bookingId: nullableText(source.booking_id),
    status: text(source.status),
    issueDate: nullableText(source.issue_date),
    dueDate: nullableText(source.due_date),
    sentAt: nullableText(source.sent_at),
    paidAt: nullableText(source.paid_at),
    totalCents: nullableNumber(source.total_cents),
    balanceCents: nullableNumber(source.balance_cents),
    customerName: text(source.customer_name),
    customerEmail: text(source.customer_email),
    customerPhone: text(source.customer_phone),
    paymentStatus: text(source.payment_status),
    createdAt: nullableText(source.created_at),
    updatedAt: nullableText(source.updated_at),
    customerId: nullableText(source.customer_id),
    customerVehicleId: nullableText(source.customer_vehicle_id),
    customerMatchSource: text(source.customer_match_source),
    customerLinkedAt: nullableText(source.customer_linked_at),
  };
}

function normalizeHistoryRescue(row: unknown): CustomerHistoryRescue | null {
  const source = row && typeof row === 'object' ? row as Record<string, unknown> : {};
  const id = text(source.id);
  if (!id) return null;

  return {
    id,
    createdAt: nullableText(source.created_at),
    status: text(source.status),
    customerName: text(source.customer_name),
    phone: text(source.phone),
    licensePlate: text(source.license_plate),
    city: text(source.city),
    customerId: nullableText(source.customer_id),
    customerVehicleId: nullableText(source.customer_vehicle_id),
    customerMatchSource: text(source.customer_match_source),
    customerLinkedAt: nullableText(source.customer_linked_at),
  };
}

function normalizeHistoryEvent(row: unknown): CustomerHistoryEvent | null {
  const source = row && typeof row === 'object' ? row as Record<string, unknown> : {};
  const id = text(source.id);
  if (!id) return null;

  return {
    id,
    actorId: nullableText(source.actor_id),
    actorEmail: text(source.actor_email),
    eventType: text(source.event_type),
    details: source.details && typeof source.details === 'object' ? source.details as Record<string, unknown> : {},
    createdAt: nullableText(source.created_at),
  };
}

export function normalizeCustomerHistory(value: unknown): CustomerHistory {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    bookings: normalizeArrayRows(source.bookings, normalizeHistoryBooking),
    orders: normalizeArrayRows(source.orders, normalizeHistoryOrder),
    invoices: normalizeArrayRows(source.invoices, normalizeHistoryInvoice),
    rescue: normalizeArrayRows(source.rescue, normalizeHistoryRescue),
    events: normalizeArrayRows(source.events, normalizeHistoryEvent),
  };
}

export function normalizeCustomerLinkSuggestion(row: unknown): CustomerLinkSuggestion | null {
  const source = row && typeof row === 'object' ? row as Record<string, unknown> : {};
  const activityId = text(source.activity_id);
  const customerId = text(source.customer_id);
  if (!activityId || !customerId) return null;

  return {
    activityType: normalizeActivityType(source.activity_type),
    activityId,
    title: text(source.title, 'Activity') || 'Activity',
    subtitle: text(source.subtitle),
    matchSource: text(source.match_source, 'manual') || 'manual',
    confidence: finiteCount(source.confidence),
    occurredAt: nullableText(source.occurred_at),
    customerId,
    customerVehicleId: nullableText(source.customer_vehicle_id),
  };
}

function normalizeArrayRows<T>(value: unknown, normalize: (row: unknown) => T | null) {
  if (!Array.isArray(value)) return [];
  return value.map(normalize).filter((row): row is T => row !== null);
}

export function buildCustomerDraft(detail: CustomerDetail): CustomerDraft {
  return {
    id: detail.id,
    customerType: detail.customerType,
    fullName: detail.fullName,
    primaryEmail: detail.primaryEmail,
    primaryPhone: detail.primaryPhone,
    language: detail.language,
    businessId: detail.businessId,
    vatId: detail.vatId,
    addressLine1: detail.addressLine1,
    addressLine2: detail.addressLine2,
    postalCode: detail.postalCode,
    city: detail.city,
    countryCode: detail.countryCode || 'FI',
    status: detail.status,
    tagsText: detail.tags.join(', '),
    marketingConsent: detail.marketingConsent,
    contactConsent: detail.contactConsent,
    hidden: detail.hidden,
  };
}

export function buildCustomerDraftFromOverview(row?: CustomerOverviewRow | null): CustomerDraft {
  return {
    id: row?.customerId ?? null,
    customerType: 'personal',
    fullName: row?.name === 'Customer' ? '' : row?.name ?? '',
    primaryEmail: row?.email ?? '',
    primaryPhone: row?.phone ?? '',
    language: '',
    businessId: '',
    vatId: '',
    addressLine1: '',
    addressLine2: '',
    postalCode: '',
    city: '',
    countryCode: 'FI',
    status: normalizeCustomerStatus(row?.status),
    tagsText: '',
    marketingConsent: null,
    contactConsent: null,
    hidden: row?.status === 'hidden' || row?.status === 'deleted',
  };
}

export function normalizeLicensePlateImportResult(row: unknown): LicensePlateImportResult | null {
  const source = row && typeof row === 'object' ? row as Record<string, unknown> : {};
  const licensePlate = text(source.license_plate).toUpperCase();
  if (!licensePlate) return null;

  return {
    licensePlate,
    vehicleId: text(source.vehicle_id),
    action: text(source.action),
    conflictCustomerCount: finiteCount(source.conflict_customer_count),
  };
}

function normalizeConflictOwner(row: unknown): LicensePlateConflictOwner | null {
  const source = row && typeof row === 'object' ? row as Record<string, unknown> : {};
  const customerId = text(source.customer_id);
  if (!customerId) return null;

  return {
    customerId,
    fullName: text(source.full_name, 'Customer') || 'Customer',
    email: text(source.email),
    phone: text(source.phone),
    customerType: normalizeCustomerType(source.customer_type),
  };
}

export function normalizeLicensePlateConflict(row: unknown): LicensePlateConflict | null {
  const source = row && typeof row === 'object' ? row as Record<string, unknown> : {};
  const licensePlate = text(source.license_plate).toUpperCase();
  if (!licensePlate) return null;
  const resolutionDetails = source.resolution_details && typeof source.resolution_details === 'object'
    ? source.resolution_details as Record<string, unknown>
    : {};

  return {
    licensePlate,
    customerCount: finiteCount(source.customer_count),
    customers: normalizeArrayRows(source.customers, normalizeConflictOwner),
    resolution: text(source.resolution),
    primaryCustomerId: nullableText(source.primary_customer_id),
    resolutionDetails,
  };
}

export function buildVehicleDraft(customerId: string, row?: CustomerVehicleRow | null): CustomerVehicleDraft {
  return {
    id: row?.id ?? null,
    customerId,
    licensePlate: row?.licensePlate ?? '',
    vehicleName: row?.vehicleName ?? '',
    vin: row?.vin ?? '',
    notes: row?.notes ?? '',
    hidden: row?.hidden ?? false,
  };
}

export function tagsFromText(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export function formatDate(value: string | null) {
  if (!value || value === '-infinity' || value === 'infinity') return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('fi-FI', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatMoney(cents: number | null) {
  if (!Number.isFinite(Number(cents))) return '-';
  return new Intl.NumberFormat('fi-FI', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(cents) / 100);
}
