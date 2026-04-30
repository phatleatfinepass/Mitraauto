import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, RefreshCcw, Save, Search, Settings, Upload } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { useTheme } from '../ThemeContext';

type SourceType = 'order' | 'booking' | 'manual';
type DocumentType = 'receipt' | 'invoice';
type SourceTab = 'all' | 'orders' | 'bookings' | 'drafts' | 'sent';

type OrderRow = {
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

type BookingRow = {
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

type InvoiceSummaryRow = {
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

type SourceRecord = {
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

type DraftLine = {
  id: string;
  description: string;
  quantity: string;
  unitGross: string;
  vatRate: string;
};

type DocumentDraft = {
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

const emptyLine = (): DraftLine => ({
  id: crypto.randomUUID(),
  description: '',
  quantity: '1',
  unitGross: '0.00',
  vatRate: '25.5',
});

const initialDraft = (): DocumentDraft => ({
  documentType: 'receipt',
  sourceType: 'manual',
  sourceId: null,
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  customerBusinessId: '',
  customerVatId: '',
  customerAddressLine1: '',
  customerAddressLine2: '',
  customerPostalCode: '',
  customerCity: '',
  language: 'fi',
  supplyDate: new Date().toISOString().slice(0, 10),
  paymentProvider: '',
  transactionId: '',
  lines: [emptyLine()],
  notes: '',
  importSource: '',
});

function Button({
  children,
  color = 'secondary',
  iconLeading,
  isDisabled,
  isLoading,
  size: _size,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  color?: 'primary' | 'secondary';
  iconLeading?: React.ReactNode;
  isDisabled?: boolean;
  isLoading?: boolean;
  size?: 'sm';
}) {
  const colorClass = color === 'primary'
    ? 'border-[#F97316] bg-[#F97316] text-white hover:bg-[#EA580C]'
    : 'border-[#D2D2D7] bg-white text-[#1D1D1F] hover:bg-[#F5F5F7]';

  return (
    <button
      {...props}
      disabled={isDisabled || isLoading || props.disabled}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${colorClass} ${className}`}
    >
      {iconLeading}
      {isLoading ? 'Saving...' : children}
    </button>
  );
}

function Input({
  label,
  value,
  onChange,
  inputClassName = '',
  size: _size,
  className = '',
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> & {
  label?: string;
  inputClassName?: string;
  size?: 'sm';
  onChange?: (value: string) => void;
}) {
  return (
    <label className={`block ${className}`}>
      {label ? <span className="mb-1 block text-xs font-medium text-[#6E6E73]">{label}</span> : null}
      <input
        {...props}
        value={value ?? ''}
        onChange={(event) => onChange?.(event.target.value)}
        className={`h-10 w-full rounded-md border border-[#D2D2D7] bg-white px-3 text-sm text-[#1D1D1F] outline-none transition-colors placeholder:text-[#98989D] focus:border-[#F97316] ${inputClassName}`}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  textAreaClassName = '',
  className = '',
  ...props
}: Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> & {
  label?: string;
  textAreaClassName?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className={`block ${className}`}>
      {label ? <span className="mb-1 block text-xs font-medium text-[#6E6E73]">{label}</span> : null}
      <textarea
        {...props}
        value={value ?? ''}
        onChange={(event) => onChange?.(event.target.value)}
        className={`w-full rounded-md border border-[#D2D2D7] bg-white px-3 py-2 text-sm text-[#1D1D1F] outline-none transition-colors placeholder:text-[#98989D] focus:border-[#F97316] ${textAreaClassName}`}
      />
    </label>
  );
}

function Badge({
  children,
  tone = 'gray',
}: {
  children: React.ReactNode;
  tone?: 'gray' | 'success' | 'warning';
  size?: 'sm';
}) {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-gray-200 bg-gray-50 text-gray-700';

  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${toneClass}`}>
      {children}
    </span>
  );
}

function centsToMoney(cents: number | null | undefined) {
  return `€${((cents ?? 0) / 100).toFixed(2)}`;
}

function moneyToCents(value: string) {
  const normalized = value.replace(',', '.').replace(/[^\d.-]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('fi-FI', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getOrderCustomerName(order: OrderRow) {
  const snapshot = order.cart_snapshot ?? {};
  const fromSnapshot = [snapshot.customer?.firstName, snapshot.customer?.lastName].filter(Boolean).join(' ').trim();
  return fromSnapshot || snapshot.customer?.name || snapshot.billing?.name || snapshot.shipping?.name || 'Customer';
}

function getOrderItems(order: OrderRow) {
  const snapshot = order.cart_snapshot ?? {};
  const candidates = [
    snapshot.items,
    snapshot.cart_items,
    snapshot.cart?.items,
    snapshot.order?.items,
    snapshot.line_items,
  ];
  return candidates.find((value) => Array.isArray(value)) ?? [];
}

function getOrderTitle(order: OrderRow) {
  const items = getOrderItems(order);
  const first = items[0] ?? {};
  const product = first.product ?? first;
  const title = [product.brand, product.model].filter(Boolean).join(' ').trim() || product.name || product.title;
  if (title && items.length > 1) return `${title} + ${items.length - 1} more`;
  return title || 'Webshop order';
}

function sourceKey(type: SourceType, id: string | null) {
  return `${type}:${id ?? 'new'}`;
}

function documentSourceKey(document: InvoiceSummaryRow) {
  if (document.source_type === 'order') return sourceKey('order', document.order_id);
  if (document.source_type === 'booking') return sourceKey('booking', document.booking_id);
  return `document:${document.id}`;
}

function buildDraftFromSource(source: SourceRecord): DocumentDraft {
  if (source.document) {
    const document = source.document;
    return {
      ...initialDraft(),
      documentType: document.document_type === 'invoice' ? 'invoice' : 'receipt',
      sourceType: document.source_type,
      sourceId: document.source_type === 'order' ? document.order_id : document.source_type === 'booking' ? document.booking_id : null,
      customerName: document.customer_name ?? source.customerName,
      customerEmail: document.customer_email ?? source.customerEmail,
      customerPhone: document.customer_phone ?? source.customerPhone,
      language: document.language ?? 'fi',
      paymentProvider: document.payment_provider ?? '',
      transactionId: document.transaction_id ?? '',
      lines: [{
        ...emptyLine(),
        description: source.title,
        unitGross: ((document.total_cents ?? source.amountCents ?? 0) / 100).toFixed(2),
      }],
    };
  }

  if (source.sourceType === 'order') {
    const order = source.raw as OrderRow;
    const items = getOrderItems(order);
    const lines = items.length > 0
      ? items.map((item: any) => {
          const product = item.product ?? item;
          const description = [product.brand, product.model, product.size_text || product.size].filter(Boolean).join(' ');
          const quantity = Number(item.quantity ?? item.qty ?? 1) || 1;
          const lineCents = Number(item.line_total_cents ?? item.total_cents ?? item.lineTotalCents ?? 0) || 0;
          const unitCents = Number(item.unit_price_cents ?? item.price_cents ?? item.unitPriceCents ?? (lineCents ? Math.round(lineCents / quantity) : 0)) || 0;
          return {
            id: crypto.randomUUID(),
            description: description || source.title,
            quantity: String(quantity),
            unitGross: (unitCents / 100).toFixed(2),
            vatRate: '25.5',
          };
        })
      : [{
          ...emptyLine(),
          description: source.title,
          unitGross: (source.amountCents / 100).toFixed(2),
        }];

    return {
      ...initialDraft(),
      sourceType: 'order',
      sourceId: order.id,
      customerName: source.customerName,
      customerEmail: source.customerEmail,
      customerPhone: source.customerPhone,
      paymentProvider: order.cart_snapshot?.payment_provider ?? order.cart_snapshot?.payment?.provider ?? '',
      transactionId: order.paytrail_transaction_id ?? '',
      lines,
    };
  }

  if (source.sourceType === 'booking') {
    const booking = source.raw as BookingRow;
    return {
      ...initialDraft(),
      sourceType: 'booking',
      sourceId: booking.id,
      customerName: source.customerName,
      customerEmail: source.customerEmail,
      customerPhone: source.customerPhone,
      language: booking.booking_language === 'en' ? 'en' : 'fi',
      lines: [{
        ...emptyLine(),
        description: source.title,
      }],
      notes: booking.license_plate ? `Vehicle: ${booking.license_plate}` : '',
    };
  }

  return initialDraft();
}

function calculateDraftTotals(lines: DraftLine[]) {
  return lines.reduce(
    (acc, line) => {
      const quantity = Number.parseFloat(line.quantity.replace(',', '.')) || 0;
      const unitGrossCents = moneyToCents(line.unitGross);
      const vatRate = Number.parseFloat(line.vatRate.replace(',', '.')) || 0;
      const grossCents = Math.round(quantity * unitGrossCents);
      const netCents = vatRate > 0 ? Math.round(grossCents / (1 + vatRate / 100)) : grossCents;
      acc.subtotalCents += netCents;
      acc.vatCents += grossCents - netCents;
      acc.totalCents += grossCents;
      return acc;
    },
    { subtotalCents: 0, vatCents: 0, totalCents: 0 }
  );
}

function calculateDraftLine(line: DraftLine) {
  const quantity = Number.parseFloat(line.quantity.replace(',', '.')) || 0;
  const unitGrossCents = moneyToCents(line.unitGross);
  const vatRate = Number.parseFloat(line.vatRate.replace(',', '.')) || 0;
  const grossCents = Math.round(quantity * unitGrossCents);
  const netCents = vatRate > 0 ? Math.round(grossCents / (1 + vatRate / 100)) : grossCents;
  const unitNetCents = vatRate > 0 ? Math.round(unitGrossCents / (1 + vatRate / 100)) : unitGrossCents;

  return {
    quantity,
    unitGrossCents,
    unitNetCents,
    vatRate,
    netCents,
    vatCents: grossCents - netCents,
    grossCents,
  };
}

function documentStatus(source: SourceRecord) {
  return source.document?.status ?? null;
}

function documentNumber(source: SourceRecord) {
  return source.document?.document_number ?? null;
}

function documentTone(status: string | null) {
  if (status === 'sent' || status === 'paid' || status === 'issued') return 'success';
  if (status === 'draft' || status === 'partially_paid') return 'warning';
  return 'gray';
}

function invoiceRequiresFullDetails(draft: DocumentDraft, totalCents: number) {
  return draft.documentType === 'invoice' || totalCents > 40000 || Boolean(draft.customerBusinessId || draft.customerVatId);
}

function validateInvoiceDraft(draft: DocumentDraft, totals: ReturnType<typeof calculateDraftTotals>) {
  const errors: string[] = [];
  const fullRequired = invoiceRequiresFullDetails(draft, totals.totalCents);
  if (!draft.customerName.trim()) errors.push('Customer name is required.');
  if (fullRequired) {
    if (!draft.customerAddressLine1.trim()) errors.push('Customer address is required for full invoice.');
    if (!draft.customerPostalCode.trim()) errors.push('Customer postal code is required for full invoice.');
    if (!draft.customerCity.trim()) errors.push('Customer city is required for full invoice.');
    if (!draft.supplyDate.trim()) errors.push('Supply/service date is required for full invoice.');
  }
  draft.lines.forEach((line, index) => {
    if (!line.description.trim()) errors.push(`Line ${index + 1}: description is required.`);
  });

  const tier = errors.length > 0
    ? 'blocked'
    : fullRequired ? 'full_ok' : 'simplified_ok';

  return { fullRequired, tier, errors };
}

function parsePastedInvoiceText(text: string) {
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? '';
  const phone = text.match(/(?:\+358|0)\s?[\d\s-]{6,}/)?.[0]?.replace(/\s+/g, '') ?? '';
  const totalMatch = [...text.matchAll(/(?:total|yhteens[aä]|summa|maksettava)[^\d]*(\d+[,.]\d{2})/gi)].at(-1)?.[1] ?? '';
  const firstMeaningfulLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 2 && !line.includes('@') && !/^\d/.test(line));

  return {
    email,
    phone,
    total: totalMatch.replace(',', '.'),
    customerName: firstMeaningfulLine ?? '',
  };
}

export function InvoicesCMSPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [invoiceDocuments, setInvoiceDocuments] = useState<InvoiceSummaryRow[]>([]);
  const [activeTab, setActiveTab] = useState<SourceTab>('all');
  const [selectedKey, setSelectedKey] = useState<string>('manual:new');
  const [searchTerm, setSearchTerm] = useState('');
  const [draft, setDraft] = useState<DocumentDraft>(() => initialDraft());
  const [pasteText, setPasteText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [ordersResult, bookingsResult, invoiceDocumentsResult] = await Promise.all([
        supabase
          .from('orders')
          .select('id, created_at, status, paytrail_status, paytrail_transaction_id, paytrail_reference, email, phone, grand_total_cents, cart_snapshot')
          .order('created_at', { ascending: false })
          .limit(120),
        supabase
          .from('bookings')
          .select('id, created_at, status, booking_date, booking_time, booking_language, license_plate, service_name, customer_name, customer_phone, customer_email, notes')
          .order('created_at', { ascending: false })
          .limit(120),
        supabase
          .from('invoice_document_summaries')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(240),
      ]);

      if (ordersResult.error) throw ordersResult.error;
      if (bookingsResult.error) throw bookingsResult.error;
      if (invoiceDocumentsResult.error) throw invoiceDocumentsResult.error;

      setOrders((ordersResult.data ?? []) as OrderRow[]);
      setBookings((bookingsResult.data ?? []) as BookingRow[]);
      setInvoiceDocuments((invoiceDocumentsResult.data ?? []) as InvoiceSummaryRow[]);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load invoice data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const documentBySource = useMemo(() => {
    const map = new Map<string, InvoiceSummaryRow>();
    invoiceDocuments.forEach((document) => {
      if (document.source_type === 'order' || document.source_type === 'booking') {
        const key = documentSourceKey(document);
        const current = map.get(key);
        if (!current || (document.updated_at ?? document.created_at ?? '') > (current.updated_at ?? current.created_at ?? '')) {
          map.set(key, document);
        }
      }
    });
    return map;
  }, [invoiceDocuments]);

  const sources = useMemo<SourceRecord[]>(() => {
    const documentSources = invoiceDocuments.map((document) => ({
      key: `document:${document.id}`,
      sourceType: document.source_type === 'order' || document.source_type === 'booking' || document.source_type === 'manual'
        ? document.source_type
        : 'manual',
      sourceId: document.source_type === 'order' ? document.order_id : document.source_type === 'booking' ? document.booking_id : document.id,
      createdAt: document.created_at,
      customerName: document.customer_name ?? 'Customer',
      customerEmail: document.customer_email ?? '',
      customerPhone: document.customer_phone ?? '',
      title: `${document.document_type.replace('_', ' ')} ${document.document_number}`,
      amountCents: document.total_cents ?? 0,
      status: document.payment_status ?? document.status,
      document,
      raw: document,
    }));

    const documentedSourceKeys = new Set(
      invoiceDocuments
        .filter((document) => document.source_type === 'order' || document.source_type === 'booking')
        .map(documentSourceKey)
    );
    const orderSources = orders.map((order) => ({
      key: sourceKey('order', order.id),
      sourceType: 'order' as const,
      sourceId: order.id,
      createdAt: order.created_at,
      customerName: getOrderCustomerName(order),
      customerEmail: order.email ?? order.cart_snapshot?.customer?.email ?? order.cart_snapshot?.billing?.email ?? order.cart_snapshot?.shipping?.email ?? '',
      customerPhone: order.phone ?? order.cart_snapshot?.customer?.phone ?? order.cart_snapshot?.billing?.phone ?? order.cart_snapshot?.shipping?.phone ?? '',
      title: getOrderTitle(order),
      amountCents: order.grand_total_cents ?? 0,
      status: order.paytrail_status ?? order.status ?? 'order',
      document: documentBySource.get(sourceKey('order', order.id)),
      raw: order,
    })).filter((source) => !documentedSourceKeys.has(source.key));

    const bookingSources = bookings.map((booking) => ({
      key: sourceKey('booking', booking.id),
      sourceType: 'booking' as const,
      sourceId: booking.id,
      createdAt: booking.created_at,
      customerName: booking.customer_name ?? 'Customer',
      customerEmail: booking.customer_email ?? '',
      customerPhone: booking.customer_phone ?? '',
      title: booking.service_name ?? 'Service booking',
      amountCents: 0,
      status: booking.status ?? 'confirmed',
      document: documentBySource.get(sourceKey('booking', booking.id)),
      raw: booking,
    })).filter((source) => !documentedSourceKeys.has(source.key));

    return [...documentSources, ...orderSources, ...bookingSources].sort((a, b) => {
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });
  }, [bookings, documentBySource, invoiceDocuments, orders]);

  const filteredSources = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return sources.filter((source) => {
      if (activeTab === 'orders' && source.sourceType !== 'order') return false;
      if (activeTab === 'bookings' && source.sourceType !== 'booking') return false;
      if (activeTab === 'drafts' && documentStatus(source) !== 'draft') return false;
      if (activeTab === 'sent' && !['sent', 'issued', 'paid'].includes(documentStatus(source) ?? '')) return false;

      if (!normalized) return true;
      return [
        source.customerName,
        source.customerEmail,
        source.customerPhone,
        source.title,
        source.sourceId,
        documentNumber(source),
        source.document?.transaction_id,
      ].some((value) => String(value ?? '').toLowerCase().includes(normalized));
    });
  }, [activeTab, searchTerm, sources]);

  const selectedSource = sources.find((source) => source.key === selectedKey) ?? null;
  const totals = useMemo(() => calculateDraftTotals(draft.lines), [draft.lines]);
  const draftValidation = useMemo(() => validateInvoiceDraft(draft, totals), [draft, totals]);

  const selectSource = async (source: SourceRecord) => {
    setSelectedKey(source.key);
    const nextDraft = buildDraftFromSource(source);

    if (source.document) {
      const [documentResult, linesResult, partiesResult] = await Promise.all([
        supabase
          .from('invoice_documents')
          .select('internal_notes, payload, supply_date')
          .eq('id', source.document.id)
          .maybeSingle(),
        supabase
          .from('invoice_lines')
          .select('line_number, title, quantity, unit_price_incl_vat_cents, vat_rate')
          .eq('document_id', source.document.id)
          .order('line_number', { ascending: true }),
        supabase
          .from('invoice_parties')
          .select('role, business_id, vat_id, address_line1, address_line2, postal_code, city, country_code')
          .eq('document_id', source.document.id),
      ]);

      if (!documentResult.error && documentResult.data) {
        nextDraft.notes = documentResult.data.internal_notes ?? nextDraft.notes;
        nextDraft.importSource = documentResult.data.payload?.import_source ?? nextDraft.importSource;
        nextDraft.supplyDate = documentResult.data.supply_date ?? nextDraft.supplyDate;
      }

      if (!linesResult.error && Array.isArray(linesResult.data) && linesResult.data.length > 0) {
        nextDraft.lines = linesResult.data.map((line: any) => ({
          id: crypto.randomUUID(),
          description: String(line.title ?? ''),
          quantity: String(line.quantity ?? '1'),
          unitGross: ((Number(line.unit_price_incl_vat_cents ?? 0) || 0) / 100).toFixed(2),
          vatRate: String(line.vat_rate ?? 25.5),
        }));
      }

      if (!partiesResult.error && Array.isArray(partiesResult.data)) {
        const buyer = partiesResult.data.find((party: any) => party.role === 'buyer');
        if (buyer) {
          nextDraft.customerBusinessId = buyer.business_id ?? '';
          nextDraft.customerVatId = buyer.vat_id ?? '';
          nextDraft.customerAddressLine1 = buyer.address_line1 ?? '';
          nextDraft.customerAddressLine2 = buyer.address_line2 ?? '';
          nextDraft.customerPostalCode = buyer.postal_code ?? '';
          nextDraft.customerCity = buyer.city ?? '';
        }
      }
    }

    setDraft(nextDraft);
    setSavedMessage(null);
  };

  const startManualDraft = () => {
    setSelectedKey('manual:new');
    setDraft(initialDraft());
    setSavedMessage(null);
  };

  const updateLine = (lineId: string, patch: Partial<DraftLine>) => {
    setDraft((current) => ({
      ...current,
      lines: current.lines.map((line) => line.id === lineId ? { ...line, ...patch } : line),
    }));
  };

  const saveDraft = async () => {
    setSaving(true);
    setError(null);
    setSavedMessage(null);

    try {
      const now = new Date();
      const documentDraftNumber = `DRAFT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${now.getTime().toString().slice(-6)}`;
      const existingDraftDocument = selectedSource?.document?.status === 'draft'
        ? selectedSource.document
        : null;
      const existingFinalSource = Boolean(
        (selectedSource?.document && selectedSource.document.status !== 'draft')
      );
      const saveSourceType = existingDraftDocument
        ? existingDraftDocument.source_type
        : existingFinalSource ? 'manual' : draft.sourceType;
      const draftLines = draft.lines.map((line, index) => {
        const calculated = calculateDraftLine(line);
        return {
          line,
          calculated,
          lineNumber: index + 1,
        };
      });
      const vatBreakdowns = Array.from(
        draftLines.reduce((map, item) => {
          const vatRateKey = item.calculated.vatRate.toFixed(2);
          const current = map.get(vatRateKey) ?? {
            vatRate: item.calculated.vatRate,
            baseCents: 0,
            vatCents: 0,
            totalCents: 0,
          };
          current.baseCents += item.calculated.netCents;
          current.vatCents += item.calculated.vatCents;
          current.totalCents += item.calculated.grossCents;
          map.set(vatRateKey, current);
          return map;
        }, new Map<string, { vatRate: number; baseCents: number; vatCents: number; totalCents: number }>())
          .values()
      );
      const payload = {
        document_type: draft.documentType,
        notes: draft.notes,
        import_source: draft.importSource,
        validation: validateInvoiceDraft(draft, totals),
        original_source: existingFinalSource ? {
          source_type: selectedSource?.sourceType ?? draft.sourceType,
          source_id: selectedSource?.sourceId ?? draft.sourceId,
          document_number: selectedSource ? documentNumber(selectedSource) : null,
        } : null,
        lines: draftLines.map(({ line, calculated }) => ({
          description: line.description,
          quantity: calculated.quantity,
          unit_gross_cents: calculated.unitGrossCents,
          unit_net_cents: calculated.unitNetCents,
          vat_rate: calculated.vatRate,
          line_vat_excl_cents: calculated.netCents,
          line_vat_cents: calculated.vatCents,
          line_total_cents: calculated.grossCents,
        })),
      };

      const templateResult = await supabase
        .from('invoice_templates')
        .select('id, company_name, business_id, vat_id, email, phone, address_line1, address_line2, country_code')
        .eq('is_default', true)
        .maybeSingle();

      if (templateResult.error) throw templateResult.error;

      const sourceRow = {
        source_type: saveSourceType,
        order_id: saveSourceType === 'order' ? draft.sourceId : null,
        booking_id: saveSourceType === 'booking' ? draft.sourceId : null,
      };

      const documentRow = {
        document_number: existingDraftDocument?.document_number ?? documentDraftNumber,
        document_type: draft.documentType,
        ...sourceRow,
        status: 'draft',
        language: draft.language,
        currency: 'EUR',
        template_id: templateResult.data?.id ?? null,
        supply_date: draft.supplyDate || null,
        validation_tier: validateInvoiceDraft(draft, totals).tier,
        validation_errors: validateInvoiceDraft(draft, totals).errors,
        subtotal_cents: totals.subtotalCents,
        discount_cents: 0,
        shipping_cents: 0,
        vat_cents: totals.vatCents,
        total_cents: totals.totalCents,
        paid_cents: 0,
        notes: null,
        internal_notes: draft.notes || null,
        payload,
      };

      const result = existingDraftDocument
        ? await supabase.from('invoice_documents').update(documentRow).eq('id', existingDraftDocument.id).select('id, document_number').single()
        : await supabase.from('invoice_documents').insert(documentRow).select('id, document_number').single();

      if (result.error) throw result.error;

      const documentId = result.data.id;
      const template = templateResult.data;

      const sellerRow = {
        document_id: documentId,
        role: 'seller',
        name: template?.company_name ?? 'Mitra Auto Oy',
        business_id: template?.business_id ?? '3408833-8',
        vat_id: template?.vat_id ?? 'FI34088338',
        email: template?.email ?? 'contact@mitra-auto.fi',
        phone: template?.phone ?? '0407777163',
        address_line1: template?.address_line1 ?? 'Hankasuontie 5',
        address_line2: template?.address_line2 ?? '00390 HELSINKI',
        country_code: template?.country_code ?? 'FI',
      };
      const buyerRow = {
        document_id: documentId,
        role: 'buyer',
        name: draft.customerName || 'Customer',
        business_id: draft.customerBusinessId || null,
        vat_id: draft.customerVatId || null,
        email: draft.customerEmail || null,
        phone: draft.customerPhone || null,
        address_line1: draft.customerAddressLine1 || null,
        address_line2: draft.customerAddressLine2 || null,
        postal_code: draft.customerPostalCode || null,
        city: draft.customerCity || null,
        country_code: 'FI',
      };

      const partiesResult = await supabase
        .from('invoice_parties')
        .upsert([sellerRow, buyerRow], { onConflict: 'document_id,role' });
      if (partiesResult.error) throw partiesResult.error;

      const deleteLinesResult = await supabase.from('invoice_lines').delete().eq('document_id', documentId);
      if (deleteLinesResult.error) throw deleteLinesResult.error;

      if (draftLines.length > 0) {
        const linesResult = await supabase.from('invoice_lines').insert(draftLines.map(({ line, calculated, lineNumber }) => ({
          document_id: documentId,
          line_number: lineNumber,
          item_type: draft.sourceType === 'order' ? 'product' : 'service',
          title: line.description || 'Item',
          quantity: calculated.quantity,
          unit_label: 'kpl',
          unit_price_excl_vat_cents: calculated.unitNetCents,
          unit_price_incl_vat_cents: calculated.unitGrossCents,
          vat_rate: calculated.vatRate,
          vat_code: 'S',
          line_vat_excl_cents: calculated.netCents,
          line_vat_cents: calculated.vatCents,
          line_total_cents: calculated.grossCents,
          source_payload: {
            source_type: draft.sourceType,
            source_id: draft.sourceId,
          },
        })));
        if (linesResult.error) throw linesResult.error;
      }

      const deleteVatResult = await supabase.from('invoice_vat_breakdowns').delete().eq('document_id', documentId);
      if (deleteVatResult.error) throw deleteVatResult.error;

      if (vatBreakdowns.length > 0) {
        const vatResult = await supabase.from('invoice_vat_breakdowns').insert(vatBreakdowns.map((breakdown) => ({
          document_id: documentId,
          vat_rate: breakdown.vatRate,
          vat_code: 'S',
          base_cents: breakdown.baseCents,
          vat_cents: breakdown.vatCents,
          total_cents: breakdown.totalCents,
        })));
        if (vatResult.error) throw vatResult.error;
      }

      const paymentResult = await supabase
        .from('invoice_payment_details')
        .upsert({
          document_id: documentId,
          payment_status: 'unpaid',
          payment_provider: draft.paymentProvider || null,
          transaction_id: draft.transactionId || null,
          payload: {
            source_type: draft.sourceType,
            source_id: draft.sourceId,
          },
        }, { onConflict: 'document_id' });
      if (paymentResult.error) throw paymentResult.error;

      const eventResult = await supabase.from('invoice_events').insert({
        document_id: documentId,
        event_type: existingDraftDocument ? 'draft_updated' : 'draft_created',
        actor: 'cms',
        payload: {
          document_number: result.data.document_number,
          source_type: draft.sourceType,
          source_id: draft.sourceId,
        },
      });
      if (eventResult.error) throw eventResult.error;

      setSavedMessage(`Draft saved: ${result.data.document_number}`);
      await loadData();
      setSelectedKey(`document:${documentId}`);
    } catch (err: any) {
      setError(err.message ?? 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const applyPaste = () => {
    const parsed = parsePastedInvoiceText(pasteText);
    setDraft((current) => ({
      ...current,
      customerName: current.customerName || parsed.customerName,
      customerEmail: current.customerEmail || parsed.email,
      customerPhone: current.customerPhone || parsed.phone,
      importSource: pasteText,
      lines: current.lines.map((line, index) => index === 0 && parsed.total ? { ...line, unitGross: parsed.total } : line),
    }));
  };

  const handleFileUpload = async (file: File | null) => {
    if (!file) return;
    const importSource = file.type === 'text/plain' ? await file.text() : `Uploaded file: ${file.name}`;
    setDraft((current) => ({ ...current, importSource }));
  };

  const runDocumentAction = async (action: 'preview' | 'issue' | 'send') => {
    const documentId = selectedSource?.document?.id;
    if (!documentId) {
      setError('Save the draft before preview, issue, or send.');
      return;
    }

    setSaving(true);
    setError(null);
    setSavedMessage(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('invoice_document_issue', {
        method: 'POST',
        body: { documentId, action },
      });
      if (invokeError) throw invokeError;
      if (data?.url && (action === 'preview' || action === 'issue')) {
        window.open(data.url, '_blank', 'noopener,noreferrer');
      }
      setSavedMessage(action === 'send' ? 'Document sent.' : 'Document ready.');
      await loadData();
    } catch (err: any) {
      setError(err.message ?? `Failed to ${action} document`);
    } finally {
      setSaving(false);
    }
  };

  const panelClass = isDark ? 'border-white/10 bg-[#11141A] text-white' : 'border-[#D2D2D7] bg-white text-[#1D1D1F]';
  const mutedClass = isDark ? 'text-gray-400' : 'text-[#6E6E73]';
  const tabs: Array<{ id: SourceTab; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'orders', label: 'Orders' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'drafts', label: 'Drafts' },
    { id: 'sent', label: 'Sent' },
  ];

  return (
    <div className={`min-h-[760px] p-4 sm:p-6 ${isDark ? 'bg-[#0B0D12]' : 'bg-[#FAFAFA]'}`}>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#F97316]" />
            <h1 className="text-2xl font-semibold tracking-tight">Invoice</h1>
          </div>
          <p className={`mt-1 text-sm ${mutedClass}`}>
            Create receipts and invoices from orders, bookings, or manual drafts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" color="secondary" iconLeading={<RefreshCcw className="h-4 w-4" />} onClick={() => void loadData()} isDisabled={loading}>
            Refresh
          </Button>
          <Button size="sm" color="secondary" iconLeading={<Settings className="h-4 w-4" />}>
            Template settings
          </Button>
          <Button size="sm" color="primary" onClick={startManualDraft}>
            Create draft
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {savedMessage && (
        <div className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {savedMessage}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(420px,0.95fr)_minmax(560px,1.05fr)]">
        <section className={`rounded-lg border ${panelClass}`}>
          <div className="border-b border-inherit p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                      activeTab === tab.id
                        ? 'bg-[#F97316] text-white'
                        : isDark ? 'text-gray-300 hover:bg-white/10' : 'text-[#475569] hover:bg-[#F5F5F7]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="relative min-w-[240px]">
                <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${mutedClass}`} />
                <Input
                  aria-label="Search invoice sources"
                  placeholder="Search customer, ID, transaction"
                  value={searchTerm}
                  onChange={(value) => setSearchTerm(String(value))}
                  size="sm"
                  inputClassName="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="max-h-[640px] overflow-auto">
            {loading ? (
              <div className={`p-6 text-sm ${mutedClass}`}>Loading invoice sources...</div>
            ) : filteredSources.length === 0 ? (
              <div className={`p-6 text-sm ${mutedClass}`}>No sources found.</div>
            ) : (
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead className={isDark ? 'bg-white/5 text-gray-400' : 'bg-[#F5F5F7] text-[#6E6E73]'}>
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Source</th>
                    <th className="px-3 py-2 text-left font-medium">Customer</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSources.map((source) => (
                    <tr
                      key={source.key}
                      onClick={() => void selectSource(source)}
                      className={`cursor-pointer border-t border-inherit ${
                        selectedKey === source.key
                          ? isDark ? 'bg-orange-500/15' : 'bg-orange-50'
                          : isDark ? 'hover:bg-white/5' : 'hover:bg-[#FAFAFA]'
                      }`}
                    >
                      <td className="px-3 py-3 align-top">
                        <div className="font-medium">{source.title}</div>
                        <div className={`mt-1 font-mono text-xs ${mutedClass}`}>
                          {source.sourceType.toUpperCase()} {source.sourceId ?? documentNumber(source)}
                        </div>
                        <div className={`mt-1 text-xs ${mutedClass}`}>{formatDate(source.createdAt)}</div>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="font-medium">{source.customerName}</div>
                        <div className={`mt-1 text-xs ${mutedClass}`}>{source.customerEmail || source.customerPhone || '-'}</div>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="flex flex-wrap gap-1">
                          <Badge size="sm" tone={documentTone(documentStatus(source))}>
                            {documentStatus(source) ?? 'Needs document'}
                          </Badge>
                          <Badge size="sm" tone="gray">{source.status}</Badge>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right align-top font-mono font-semibold">
                        {centsToMoney(source.amountCents || source.document?.total_cents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className={`rounded-lg border ${panelClass}`}>
          <div className="border-b border-inherit p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Document workspace</h2>
                <p className={`mt-1 text-sm ${mutedClass}`}>
                  {selectedSource ? `${selectedSource.sourceType} source ${selectedSource.sourceId ?? ''}` : 'Manual draft'}
                </p>
              </div>
              <div className="flex gap-2">
                {(['receipt', 'invoice'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDraft((current) => ({ ...current, documentType: type }))}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize ${
                      draft.documentType === type ? 'bg-[#F97316] text-white' : isDark ? 'bg-white/5 text-gray-300' : 'bg-[#F5F5F7] text-[#475569]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-4 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Customer</h3>
              <Input label="Name" value={draft.customerName} onChange={(value) => setDraft((current) => ({ ...current, customerName: String(value) }))} size="sm" />
              <Input label="Email" value={draft.customerEmail} onChange={(value) => setDraft((current) => ({ ...current, customerEmail: String(value) }))} size="sm" />
              <Input label="Phone" value={draft.customerPhone} onChange={(value) => setDraft((current) => ({ ...current, customerPhone: String(value) }))} size="sm" />
              <div className="grid gap-2 sm:grid-cols-2">
                <Input label="Y-tunnus / Business ID" value={draft.customerBusinessId} onChange={(value) => setDraft((current) => ({ ...current, customerBusinessId: String(value) }))} size="sm" />
                <Input label="ALV / VAT ID" value={draft.customerVatId} onChange={(value) => setDraft((current) => ({ ...current, customerVatId: String(value) }))} size="sm" />
              </div>
              <Input label="Address" value={draft.customerAddressLine1} onChange={(value) => setDraft((current) => ({ ...current, customerAddressLine1: String(value) }))} size="sm" />
              <Input label="Address 2" value={draft.customerAddressLine2} onChange={(value) => setDraft((current) => ({ ...current, customerAddressLine2: String(value) }))} size="sm" />
              <div className="grid gap-2 sm:grid-cols-[120px_1fr]">
                <Input label="Postal code" value={draft.customerPostalCode} onChange={(value) => setDraft((current) => ({ ...current, customerPostalCode: String(value) }))} size="sm" />
                <Input label="City" value={draft.customerCity} onChange={(value) => setDraft((current) => ({ ...current, customerCity: String(value) }))} size="sm" />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Payment and source</h3>
              <Input label="Supply / service date" type="date" value={draft.supplyDate} onChange={(value) => setDraft((current) => ({ ...current, supplyDate: String(value) }))} size="sm" />
              <Input label="Payment provider" value={draft.paymentProvider} onChange={(value) => setDraft((current) => ({ ...current, paymentProvider: String(value) }))} size="sm" />
              <Input label="Transaction" value={draft.transactionId} onChange={(value) => setDraft((current) => ({ ...current, transactionId: String(value) }))} size="sm" />
              <div className={`rounded-md border p-3 text-xs ${isDark ? 'border-white/10 bg-white/5' : 'border-[#D2D2D7] bg-[#F5F5F7]'}`}>
                <div className={mutedClass}>Template</div>
                <div className="mt-1 font-medium">Mitra Auto Oy · Y-tunnus 3408833-8 · FI34088338</div>
                <div className={`mt-1 ${mutedClass}`}>Template settings will affect future documents only.</div>
              </div>
              <div className={`rounded-md border p-3 text-xs ${draftValidation.errors.length ? 'border-amber-300 bg-amber-50 text-amber-800' : isDark ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
                <div className="font-semibold">{draftValidation.fullRequired ? 'Full invoice validation' : 'Simplified receipt validation'}</div>
                {draftValidation.errors.length ? (
                  <ul className="mt-2 list-disc space-y-1 pl-4">
                    {draftValidation.errors.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                ) : (
                  <div className="mt-1">Ready to issue.</div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-inherit p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Line items</h3>
              <Button size="sm" color="secondary" onClick={() => setDraft((current) => ({ ...current, lines: [...current.lines, emptyLine()] }))}>
                Add line
              </Button>
            </div>

            <div className="space-y-2">
              {draft.lines.map((line) => (
                <div key={line.id} className="grid gap-2 lg:grid-cols-[1fr_90px_120px_90px]">
                  <Input aria-label="Description" value={line.description} onChange={(value) => updateLine(line.id, { description: String(value) })} placeholder="Description" size="sm" />
                  <Input aria-label="Quantity" value={line.quantity} onChange={(value) => updateLine(line.id, { quantity: String(value) })} placeholder="Qty" size="sm" />
                  <Input aria-label="Unit gross" value={line.unitGross} onChange={(value) => updateLine(line.id, { unitGross: String(value) })} placeholder="€/unit" size="sm" />
                  <Input aria-label="VAT rate" value={line.vatRate} onChange={(value) => updateLine(line.id, { vatRate: String(value) })} placeholder="VAT %" size="sm" />
                </div>
              ))}
            </div>

            <div className={`mt-4 rounded-md border p-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-[#D2D2D7] bg-[#F5F5F7]'}`}>
              <div className="grid gap-2 text-sm sm:grid-cols-3">
                <div>
                  <div className={mutedClass}>Net subtotal</div>
                  <div className="font-mono font-semibold">{centsToMoney(totals.subtotalCents)}</div>
                </div>
                <div>
                  <div className={mutedClass}>VAT</div>
                  <div className="font-mono font-semibold">{centsToMoney(totals.vatCents)}</div>
                </div>
                <div>
                  <div className={mutedClass}>Total</div>
                  <div className="font-mono text-lg font-semibold text-[#F97316]">{centsToMoney(totals.totalCents)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-t border-inherit p-4 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Import</h3>
              <TextArea
                label="Copy and paste source text"
                value={pasteText}
                onChange={(value) => setPasteText(String(value))}
                rows={5}
                textAreaClassName="min-h-[120px]"
                placeholder="Paste invoice or receipt text here..."
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" color="secondary" onClick={applyPaste}>Extract to draft</Button>
                <label className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-[#D2D2D7] hover:bg-[#F5F5F7]'}`}>
                  <Upload className="h-4 w-4" />
                  Upload PDF
                  <input className="hidden" type="file" accept="application/pdf,text/plain" onChange={(event) => void handleFileUpload(event.target.files?.[0] ?? null)} />
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <TextArea
                label="Internal notes"
                value={draft.notes}
                onChange={(value) => setDraft((current) => ({ ...current, notes: String(value) }))}
                rows={5}
                placeholder="Notes for admin only..."
              />
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button size="sm" color="secondary" onClick={() => void runDocumentAction('preview')}>Preview PDF</Button>
                <Button size="sm" color="secondary" onClick={() => void runDocumentAction('send')} isDisabled={draftValidation.errors.length > 0}>Send receipt</Button>
                <Button size="sm" color="secondary" onClick={() => void runDocumentAction('issue')} isDisabled={draftValidation.errors.length > 0}>Issue PDF</Button>
                <Button size="sm" color="primary" iconLeading={<Save className="h-4 w-4" />} onClick={() => void saveDraft()} isLoading={saving}>
                  Save draft
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
