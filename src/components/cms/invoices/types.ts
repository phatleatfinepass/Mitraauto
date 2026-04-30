export type SourceType = 'order' | 'booking' | 'manual';
export type DocumentType = 'receipt' | 'invoice';
export type SourceTab = 'all' | 'orders' | 'bookings' | 'drafts' | 'sent';

export type OrderRow = {
  id: string;
  created_at: string | null;
  status: string | null;
  paytrail_status: string | null;
  paytrail_transaction_id: string | null;
  paytrail_reference: string | null;
  email: string | null;
  phone: string | null;
  grand_total_cents: number | null;
  cart_snapshot: any;
};

export type BookingRow = {
  id: string;
  created_at: string | null;
  status: string | null;
  booking_date: string | null;
  booking_time: string | null;
  booking_language: string | null;
  license_plate: string | null;
  service_name: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  notes: string | null;
};

export type InvoiceSummaryRow = {
  id: string;
  document_number: string;
  document_type: DocumentType | 'credit_note' | 'refund_receipt' | 'proforma';
  source_type: SourceType;
  order_id: string | null;
  booking_id: string | null;
  status: 'draft' | 'issued' | 'sent' | 'paid' | 'partially_paid' | 'credited' | 'void' | 'cancelled';
  language: 'fi' | 'en';
  currency: string;
  issue_date: string | null;
  due_date: string | null;
  supply_date?: string | null;
  sent_at: string | null;
  paid_at: string | null;
  issued_at?: string | null;
  subtotal_cents: number | null;
  shipping_cents: number | null;
  vat_cents: number | null;
  total_cents: number | null;
  paid_cents: number | null;
  balance_cents: number | null;
  validation_tier?: string | null;
  validation_errors?: unknown;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  payment_status: string | null;
  payment_provider: string | null;
  transaction_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type SourceRecord = {
  key: string;
  sourceType: SourceType;
  sourceId: string | null;
  createdAt: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  title: string;
  amountCents: number;
  status: string;
  document?: InvoiceSummaryRow;
  raw: OrderRow | BookingRow | InvoiceSummaryRow;
};

export type DraftLine = {
  id: string;
  description: string;
  quantity: string;
  unitGross: string;
  vatRate: string;
};

export type DocumentDraft = {
  documentType: DocumentType;
  sourceType: SourceType;
  sourceId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerBusinessId: string;
  customerVatId: string;
  customerAddressLine1: string;
  customerAddressLine2: string;
  customerPostalCode: string;
  customerCity: string;
  language: 'fi' | 'en';
  supplyDate: string;
  paymentProvider: string;
  transactionId: string;
  lines: DraftLine[];
  notes: string;
  importSource: string;
};

export type InvoiceTemplateRow = {
  id: string;
  template_key: string;
  display_name: string;
  company_name: string;
  business_id: string;
  vat_id: string;
  address_line1: string;
  address_line2: string;
  country_code: string;
  email: string;
  phone: string;
  iban: string | null;
  bic: string | null;
  payment_terms: string | null;
  footer_text: string | null;
  is_default: boolean;
};

export type TemplateDraft = {
  id: string | null;
  displayName: string;
  companyName: string;
  businessId: string;
  vatId: string;
  addressLine1: string;
  addressLine2: string;
  countryCode: string;
  email: string;
  phone: string;
  iban: string;
  bic: string;
  paymentTerms: string;
  footerText: string;
};
