import type { AccountStatus, CmsPermissionValue, CustomerNotificationChannel, CustomerNotificationStatus, CustomerStatus, CustomerType, MaintenanceReminderStatus, ServiceBookEntryType, StaffRole } from './types';

export const STAFF_ROLES: StaffRole[] = [
  'super_admin',
  'admin',
  'supervisor',
  'staff',
  'customer',
  'user',
  'disabled',
];

export const ACCOUNT_STATUSES: AccountStatus[] = ['active', 'hidden', 'suspended', 'deleted'];
export const CUSTOMER_STATUSES: CustomerStatus[] = ['active', 'hidden', 'blocked', 'merged', 'deleted'];
export const CUSTOMER_TYPES: CustomerType[] = ['personal', 'business', 'fleet'];
export const SERVICE_BOOK_ENTRY_TYPES: ServiceBookEntryType[] = ['maintenance', 'service', 'inspection', 'estimate', 'repair', 'tire', 'cleaning', 'note'];
export const MAINTENANCE_REMINDER_STATUSES: MaintenanceReminderStatus[] = ['active', 'paused', 'sent', 'completed', 'cancelled'];
export const CUSTOMER_NOTIFICATION_STATUSES: CustomerNotificationStatus[] = ['queued', 'sent', 'failed', 'cancelled'];
export const CUSTOMER_NOTIFICATION_CHANNELS: CustomerNotificationChannel[] = ['email', 'sms', 'push', 'phone', 'internal'];
export const PERMISSION_VALUES: CmsPermissionValue[] = ['none', 'read', 'read_write'];

export const CMS_MODULES = [
  { id: 'rescue', label: 'Rescue' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'catalog_tires', label: 'Tires' },
  { id: 'catalog_rims', label: 'Rims' },
  { id: 'orders', label: 'Orders' },
  { id: 'invoices', label: 'Receipts' },
  { id: 'customers', label: 'Customers' },
  { id: 'accounts', label: 'Accounts' },
];
