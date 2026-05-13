export type AccountCustomerView = 'customers' | 'staff';

export type CmsPermissionValue = 'none' | 'read' | 'read_write';
export type StaffRole = 'super_admin' | 'admin' | 'supervisor' | 'staff' | 'customer' | 'user' | 'disabled';
export type AccountStatus = 'active' | 'hidden' | 'suspended' | 'deleted';
export type CustomerStatus = 'active' | 'hidden' | 'blocked' | 'merged' | 'deleted';
export type CustomerType = 'personal' | 'business' | 'fleet';
export type CustomerNoteVisibility = 'internal' | 'super_admin';
export type ServiceBookEntryType = 'maintenance' | 'service' | 'inspection' | 'estimate' | 'repair' | 'tire' | 'cleaning' | 'note';
export type MaintenanceReminderStatus = 'active' | 'paused' | 'sent' | 'completed' | 'cancelled';
export type CustomerNotificationStatus = 'queued' | 'sent' | 'failed' | 'cancelled';
export type CustomerNotificationChannel = 'email' | 'sms' | 'push' | 'phone' | 'internal';

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
  accountId: string | null;
  accountEmail: string;
  portalEnabled: boolean;
  benefitPoints: number;
  benefitTier: string;
  benefitDiscountPercent: number;
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

export interface CustomerVehiclePlateLookupRow {
  vehicleId: string;
  customerId: string;
  licensePlate: string;
  vehicleName: string;
  vin: string;
  notes: string;
  hidden: boolean;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerStatus: string;
  updatedAt: string | null;
}

export interface CustomerNoteRow {
  id: string;
  body: string;
  visibility: CustomerNoteVisibility;
  createdBy: string | null;
  createdAt: string | null;
}

export interface CustomerBenefitSummary {
  pointsBalance: number;
  lifetimePoints: number;
  tier: string;
  discountPercent: number;
  updatedAt: string | null;
}

export interface CustomerDetail {
  id: string;
  customerType: CustomerType;
  accountId: string | null;
  accountEmail: string;
  portalEnabled: boolean;
  portalInvitedAt: string | null;
  benefits: CustomerBenefitSummary;
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

export interface CustomerServiceBookEntry {
  id: string;
  customerId: string;
  customerVehicleId: string | null;
  entryType: ServiceBookEntryType;
  title: string;
  description: string;
  workDate: string | null;
  mileageKm: number | null;
  parts: unknown[];
  sourceType: string;
  sourceId: string | null;
  invoiceId: string | null;
  bookingId: string | null;
  staffNotes: string;
  visibleToCustomer: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CustomerServiceBookDraft {
  id: string | null;
  customerId: string;
  customerVehicleId: string | null;
  entryType: ServiceBookEntryType;
  title: string;
  description: string;
  workDate: string;
  mileageKm: string;
  partsText: string;
  staffNotes: string;
  visibleToCustomer: boolean;
}

export interface CustomerMaintenanceReminder {
  id: string;
  customerId: string;
  customerVehicleId: string | null;
  reminderType: string;
  title: string;
  description: string;
  dueDate: string | null;
  dueMileageKm: number | null;
  lastKnownMileageKm: number | null;
  status: MaintenanceReminderStatus;
  serviceCritical: boolean;
  nextEmailAt: string | null;
  lastEmailAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CustomerMaintenanceReminderDraft {
  id: string | null;
  customerId: string;
  customerVehicleId: string | null;
  reminderType: string;
  title: string;
  description: string;
  dueDate: string;
  dueMileageKm: string;
  lastKnownMileageKm: string;
  status: MaintenanceReminderStatus;
  serviceCritical: boolean;
  nextEmailAt: string;
}

export interface CustomerNotificationHistoryRow {
  id: string;
  customerId: string | null;
  customerVehicleId: string | null;
  reminderId: string | null;
  notificationType: string;
  channel: CustomerNotificationChannel;
  recipient: string;
  subject: string;
  status: CustomerNotificationStatus;
  providerMessageId: string;
  sentAt: string | null;
  details: Record<string, unknown>;
  createdAt: string | null;
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
  resolution: string;
  primaryCustomerId: string | null;
  resolutionDetails: Record<string, unknown>;
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
