import type { AccountStatus, CmsPermissionValue, StaffRole } from './types';

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
