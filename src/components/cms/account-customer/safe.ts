import { ACCOUNT_STATUSES, CMS_MODULES, PERMISSION_VALUES, STAFF_ROLES } from './constants';
import type { AccountStatus, CmsPermissionValue, CustomerOverviewRow, StaffAccountRow, StaffDraft, StaffRole } from './types';

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
