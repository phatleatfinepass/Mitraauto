export type AccountCustomerView = 'customers' | 'staff';

export type CmsPermissionValue = 'none' | 'read' | 'read_write';
export type StaffRole = 'super_admin' | 'admin' | 'supervisor' | 'staff' | 'customer' | 'user' | 'disabled';
export type AccountStatus = 'active' | 'hidden' | 'suspended' | 'deleted';

export interface CustomerOverviewRow {
  key: string;
  customerId: string | null;
  name: string;
  email: string;
  phone: string;
  licensePlates: string[];
  bookingCount: number;
  orderCount: number;
  invoiceCount: number;
  lastActivityAt: string | null;
  status: string;
  source: string;
}

export interface StaffAccountRow {
  id: string;
  email: string;
  displayName: string;
  role: StaffRole;
  accountStatus: AccountStatus;
  hidden: boolean;
  permissions: Record<string, CmsPermissionValue>;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface StaffDraft {
  displayName: string;
  role: StaffRole;
  accountStatus: AccountStatus;
  hidden: boolean;
  permissions: Record<string, CmsPermissionValue>;
}
