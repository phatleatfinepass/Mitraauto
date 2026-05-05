export type AccountCustomerView = 'customers' | 'staff';

export type CmsPermissionValue = 'none' | 'read' | 'read_write';
export type StaffRole = 'super_admin' | 'admin' | 'supervisor' | 'staff' | 'customer' | 'user' | 'disabled';
export type AccountStatus = 'active' | 'hidden' | 'suspended' | 'deleted';
export type CustomerStatus = 'active' | 'hidden' | 'blocked' | 'merged' | 'deleted';
export type CustomerType = 'personal' | 'business' | 'fleet';
export type CustomerNoteVisibility = 'internal' | 'super_admin';

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
  hidden: boolean;
  tags: string[];
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

export type StaffPresetId = 'super_admin' | 'admin' | 'supervisor' | 'staff_limited' | 'disabled';

export interface AccountEventRow {
  id: string;
  targetProfileId: string | null;
  targetEmail: string;
  actorId: string | null;
  actorEmail: string;
  eventType: string;
  details: Record<string, unknown>;
  createdAt: string | null;
}

export interface CustomerVehicleRow {
  id: string;
  licensePlate: string;
  vehicleName: string;
  vin: string;
  notes: string;
  hidden: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CustomerNoteRow {
  id: string;
  body: string;
  visibility: CustomerNoteVisibility;
  createdBy: string | null;
  createdAt: string | null;
}

export interface CustomerDetail {
  id: string;
  customerType: CustomerType;
  primaryEmail: string;
  primaryPhone: string;
  fullName: string;
  language: string;
  businessId: string;
  vatId: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  countryCode: string;
  status: CustomerStatus;
  tags: string[];
  marketingConsent: boolean | null;
  contactConsent: boolean | null;
  hidden: boolean;
  source: string;
  createdAt: string | null;
  updatedAt: string | null;
  vehicles: CustomerVehicleRow[];
  notes: CustomerNoteRow[];
}

export interface CustomerDraft {
  id: string | null;
  customerType: CustomerType;
  fullName: string;
  primaryEmail: string;
  primaryPhone: string;
  language: string;
  businessId: string;
  vatId: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  countryCode: string;
  status: CustomerStatus;
  tagsText: string;
  marketingConsent: boolean | null;
  contactConsent: boolean | null;
  hidden: boolean;
}

export interface CustomerVehicleDraft {
  id: string | null;
  customerId: string;
  licensePlate: string;
  vehicleName: string;
  vin: string;
  notes: string;
  hidden: boolean;
}

export interface CustomerOverviewFilters {
  search: string;
  status: 'all' | CustomerStatus;
  tag: string;
  includeHidden: boolean;
}

export interface LicensePlateImportResult {
  licensePlate: string;
  vehicleId: string;
  action: string;
  conflictCustomerCount: number;
}

export interface LicensePlateConflictOwner {
  customerId: string;
  fullName: string;
  email: string;
  phone: string;
  customerType: CustomerType;
}

export interface LicensePlateConflict {
  licensePlate: string;
  customerCount: number;
  customers: LicensePlateConflictOwner[];
}

export interface CustomerHistoryBooking {
  id: string;
  createdAt: string | null;
  status: string;
  bookingDate: string | null;
  bookingTime: string | null;
  bookingLanguage: string;
  licensePlate: string;
  serviceName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
  customerId: string | null;
  customerVehicleId: string | null;
  customerMatchSource: string;
  customerLinkedAt: string | null;
}

export interface CustomerHistoryOrder {
  id: string;
  createdAt: string | null;
  status: string;
  paytrailStatus: string;
  paytrailTransactionId: string;
  paytrailReference: string;
  email: string;
  phone: string;
  totalCents: number | null;
  itemLabel: string;
  customerId: string | null;
  customerVehicleId: string | null;
  customerMatchSource: string;
  customerLinkedAt: string | null;
}

export interface CustomerHistoryInvoice {
  id: string;
  documentNumber: string;
  documentType: string;
  sourceType: string;
  orderId: string | null;
  bookingId: string | null;
  status: string;
  issueDate: string | null;
  dueDate: string | null;
  sentAt: string | null;
  paidAt: string | null;
  totalCents: number | null;
  balanceCents: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentStatus: string;
  createdAt: string | null;
  updatedAt: string | null;
  customerId: string | null;
  customerVehicleId: string | null;
  customerMatchSource: string;
  customerLinkedAt: string | null;
}

export interface CustomerHistoryRescue {
  id: string;
  createdAt: string | null;
  status: string;
  customerName: string;
  phone: string;
  licensePlate: string;
  city: string;
  customerId: string | null;
  customerVehicleId: string | null;
  customerMatchSource: string;
  customerLinkedAt: string | null;
}

export interface CustomerHistoryEvent {
  id: string;
  actorId: string | null;
  actorEmail: string;
  eventType: string;
  details: Record<string, unknown>;
  createdAt: string | null;
}

export interface CustomerHistory {
  bookings: CustomerHistoryBooking[];
  orders: CustomerHistoryOrder[];
  invoices: CustomerHistoryInvoice[];
  rescue: CustomerHistoryRescue[];
  events: CustomerHistoryEvent[];
}

export type CustomerActivityType = 'booking' | 'order' | 'invoice' | 'rescue';

export interface CustomerLinkSuggestion {
  activityType: CustomerActivityType;
  activityId: string;
  title: string;
  subtitle: string;
  matchSource: string;
  confidence: number;
  occurredAt: string | null;
  customerId: string;
  customerVehicleId: string | null;
}

export interface CustomerAutoLinkResult {
  activityType: string;
  linkedCount: number;
}
