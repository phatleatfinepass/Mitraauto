import { ACCOUNT_STATUSES, CMS_MODULES, CUSTOMER_STATUSES, CUSTOMER_TYPES, PERMISSION_VALUES, STAFF_ROLES } from './constants';
import type {
  AccountStatus,
  CmsPermissionValue,
  CustomerDetail,
  CustomerDraft,
  CustomerNoteRow,
  CustomerNoteVisibility,
  CustomerOverviewRow,
  CustomerStatus,
  CustomerType,
  CustomerVehicleDraft,
  CustomerVehicleRow,
  AccountEventRow,
  CustomerHistory,
  CustomerHistoryBooking,
  CustomerHistoryEvent,
  CustomerHistoryInvoice,
  CustomerHistoryOrder,
  StaffAccountRow,
  StaffDraft,
  StaffPresetId,
  StaffRole,
  LicensePlateConflict,
  LicensePlateConflictOwner,
  LicensePlateImportResult,
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

function normalizeNoteVisibility(value: unknown): CustomerNoteVisibility {
  const candidate = text(value) as CustomerNoteVisibility;
  return candidate === 'super_admin' ? 'super_admin' : 'internal';
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

export function buildStaffDraftForPreset(presetId: StaffPresetId, current?: StaffDraft | null): StaffDraft {
  const baseDisplayName = current?.displayName ?? '';

  if (presetId === 'super_admin') {
    return {
      displayName: baseDisplayName,
      role: 'super_admin',
      accountStatus: 'active',
      hidden: false,
      permissions: buildDefaultStaffPermissions('super_admin'),
    };
  }

  if (presetId === 'admin') {
    return {
      displayName: baseDisplayName,
      role: 'admin',
      accountStatus: 'active',
      hidden: false,
      permissions: buildDefaultStaffPermissions('admin'),
    };
  }

  if (presetId === 'supervisor') {
    return {
      displayName: baseDisplayName,
      role: 'supervisor',
      accountStatus: 'active',
      hidden: false,
      permissions: buildDefaultStaffPermissions('supervisor'),
    };
  }

  if (presetId === 'staff_limited') {
    const permissions = buildDefaultStaffPermissions('staff');
    permissions.rescue = 'read';
    permissions.schedule = 'read';
    permissions.orders = 'read';
    permissions.invoices = 'read';
    permissions.customers = 'read';
    return {
      displayName: baseDisplayName,
      role: 'staff',
      accountStatus: 'active',
      hidden: false,
      permissions,
    };
  }

  return {
    displayName: baseDisplayName,
    role: 'disabled',
    accountStatus: 'deleted',
    hidden: true,
    permissions: buildDefaultStaffPermissions('disabled'),
  };
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

export function normalizeCustomerDetail(value: unknown): CustomerDetail | null {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const id = text(source.id);
  if (!id) return null;

  return {
    id,
    customerType: normalizeCustomerType(source.customer_type),
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
    events: normalizeArrayRows(source.events, normalizeHistoryEvent),
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

  return {
    licensePlate,
    customerCount: finiteCount(source.customer_count),
    customers: normalizeArrayRows(source.customers, normalizeConflictOwner),
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
