import type { AccountStatus, CmsPermissionValue, CustomerStatus, StaffPresetId, StaffRole } from './types';

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

export const STAFF_PRESETS: Array<{ id: StaffPresetId; label: string; description: string }> = [
  { id: 'super_admin', label: 'Super Admin', description: 'Full CMS access and account control.' },
  { id: 'admin', label: 'Admin', description: 'Full operational CMS access without super-admin label.' },
  { id: 'supervisor', label: 'Supervisor', description: 'Customer workspace only.' },
  { id: 'staff_limited', label: 'Staff Limited', description: 'Read-only operational access.' },
  { id: 'disabled', label: 'Disabled', description: 'No CMS access.' },
];
