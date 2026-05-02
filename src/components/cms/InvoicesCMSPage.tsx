import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Ban, CheckCircle2, ChevronDown, Copy, FileText, Plus, RefreshCcw, Save, Search, Settings, Trash2, Upload } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeContext';
import { getLocalizedServiceCategories, getServiceIdsFromStoredServiceName } from '../../utils/serviceCatalog';
import {
  calculateDraftLine,
  calculateDraftTotals,
  centsToMoney,
  documentNumber,
  documentSourceKey,
  documentStatus,
  documentTone,
  emptyLine,
  formatDate,
  getOrderCustomerName,
  getOrderItems,
  getOrderTitle,
  initialDraft,
  initialTemplateDraft,
  sourceKey,
  templateDraftFromRow,
  validateInvoiceDraft,
} from './invoices/helpers';
import { InvoicePreviewModal } from './invoices/InvoicePreviewModal';
import { InvoiceTemplateModal } from './invoices/InvoiceTemplateModal';
import type {
  BookingRow,
  DocumentDraft,
  DraftLine,
  InvoiceSummaryRow,
  InvoicePaymentLinkRow,
  InvoiceTemplateRow,
  OrderRow,
  SourceRecord,
  SourceTab,
  SourceType,
  TemplateDraft,
} from './invoices/types';
import { Badge, Button, Input, Select, TextArea } from './invoices/ui';

type ImportedInvoiceLine = {
  description?: string;
  description_en?: string;
  quantity?: number;
  unit_label?: string;
  unit_label_en?: string;
  unit_gross_eur?: number;
  vat_rate?: number;
};

type ImportedInvoiceDocument = {
  document_type?: 'receipt' | 'invoice' | 'unknown';
  language?: 'fi' | 'en' | 'unknown';
  confidence?: 'low' | 'medium' | 'high';
  receipt?: {
    receipt_number?: string;
    work_order_number?: string;
    sale_date?: string;
  };
  vehicle?: {
    license_plate?: string;
    vehicle?: string;
    mileage_km?: string;
    vin?: string;
    engine_code?: string;
    first_registered?: string;
  };
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    business_id?: string;
    vat_id?: string;
    address_line1?: string;
    address_line2?: string;
    postal_code?: string;
    city?: string;
  };
  payment?: {
    provider?: string;
    transaction_id?: string;
  };
  supply_date?: string;
  work_summary?: string;
  work_summary_fi?: string;
  work_summary_en?: string;
  notes?: string;
  lines?: ImportedInvoiceLine[];
};

function normalizePaymentProvider(value: unknown) {
  const normalized = String(value ?? '').trim().toLowerCase().replace(/\s+/g, '_');
  if (!normalized) return '';
  if (['card', 'cash', 'bank_transfer'].includes(normalized)) return normalized;
  if (normalized.includes('cash') || normalized.includes('käte') || normalized.includes('kate')) return 'cash';
  if (normalized.includes('card') || normalized.includes('kort') || normalized.includes('visa') || normalized.includes('mastercard')) return 'card';
  if (normalized.includes('bank') || normalized.includes('tilisiir') || normalized.includes('transfer')) return 'bank_transfer';
  return 'bank_transfer';
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function formatImportedNotes(imported: ImportedInvoiceDocument, fileName: string) {
  const receipt = imported.receipt ?? {};
  const vehicle = imported.vehicle ?? {};
  const customer = imported.customer ?? {};
  const blocks: string[] = [];

  const receiptLines = [
    receipt.receipt_number ? `Receipt number: ${receipt.receipt_number}` : '',
    receipt.work_order_number ? `Work order: ${receipt.work_order_number}` : '',
    firstText(imported.supply_date, receipt.sale_date) ? `Sale date: ${firstText(imported.supply_date, receipt.sale_date)}` : '',
    `Imported from: ${fileName}`,
  ].filter(Boolean);
  if (receiptLines.length > 0) blocks.push(['Receipt', ...receiptLines].join('\n'));

  const vehicleLines = [
    vehicle.license_plate ? `License plate: ${vehicle.license_plate}` : '',
    vehicle.vehicle ? `Vehicle: ${vehicle.vehicle}` : '',
    vehicle.mileage_km ? `Mileage: ${vehicle.mileage_km} km` : '',
    vehicle.vin ? `VIN: ${vehicle.vin}` : '',
    vehicle.engine_code ? `Engine code: ${vehicle.engine_code}` : '',
    vehicle.first_registered ? `First registered: ${vehicle.first_registered}` : '',
  ].filter(Boolean);
  if (vehicleLines.length > 0) blocks.push(['Vehicle', ...vehicleLines].join('\n'));

  const customerLines = [
    customer.name ? `Customer: ${customer.name}` : '',
    customer.phone ? `Phone: ${customer.phone}` : '',
    customer.email ? `Email: ${customer.email}` : '',
  ].filter(Boolean);
  if (customerLines.length > 0) blocks.push(['Customer', ...customerLines].join('\n'));

  const workSummaryFi = firstText(imported.work_summary_fi, imported.work_summary);
  const workSummaryEn = firstText(imported.work_summary_en);
  if (workSummaryFi || workSummaryEn) {
    const workLines = ['Work performed'];
    if (workSummaryFi) workLines.push(`FI: ${workSummaryFi}`);
    if (workSummaryEn) workLines.push(`EN: ${workSummaryEn}`);
    blocks.push(workLines.join('\n'));
  }

  if (imported.notes?.trim()) {
    blocks.push(['Additional notes', imported.notes.trim()].join('\n'));
  }

  return blocks.join('\n\n');
}

function getOrderPaymentProvider(order: OrderRow) {
  const snapshot = order.cart_snapshot ?? {};
  return firstText(
    snapshot.payment_provider,
    snapshot.payment?.provider,
    snapshot.paytrail?.provider,
    snapshot.paymentMethod,
    snapshot.payment_method
  );
}

function getOrderTransactionId(order: OrderRow) {
  const snapshot = order.cart_snapshot ?? {};
  return firstText(
    order.paytrail_transaction_id,
    order.paytrail_reference,
    snapshot.paytrail_transaction_id,
    snapshot.paytrail_reference,
    snapshot.transaction_id,
    snapshot.transactionId,
    snapshot.payment?.transaction_id,
    snapshot.payment?.transactionId,
    snapshot.payment?.reference,
    snapshot.paytrail?.transaction_id,
    snapshot.paytrail?.transactionId,
    snapshot.paytrail?.reference
  );
}

function canDeleteInvoiceSource(source: SourceRecord) {
  if (!source.document) return false;
  if (source.document.sent_at) return false;
  return !['sent', 'paid', 'partially_paid'].includes(source.document.status);
}

function getBookingAmountCents(booking: BookingRow) {
  const ids = getServiceIdsFromStoredServiceName(booking.service_name);
  if (ids.length === 0) return 0;

  const services = getLocalizedServiceCategories('en').flatMap((category) => category.services);
  const total = ids.reduce((sum, id) => {
    const service = services.find((item) => item.id === id);
    return sum + Math.round((service?.price ?? 0) * 100);
  }, 0);

  return total;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function isSupportedImportFile(file: File) {
  return file.type === 'application/pdf';
}

function normalizeImportedDate(value: unknown) {
  const text = String(value ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const match = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (!match) return '';

  const [, day, month, year] = match;
  const fullYear = year.length === 2 ? `20${year}` : year;
  return `${fullYear.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function translatedUnitLabel(value: unknown) {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'kpl') return 'pcs';
  if (normalized === 'l') return 'l';
  if (normalized === 'pari') return 'pair';
  if (normalized === 'sarja') return 'set';
  return normalized || 'pcs';
}

function randomHex(bytes = 32) {
  const buffer = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(buffer).map((item) => item.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((item) => item.toString(16).padStart(2, '0')).join('');
}

function invoicePaymentUrl(token: string) {
  return `https://${projectId}.functions.supabase.co/invoice_start_payment?token=${encodeURIComponent(token)}`;
}

function linesFromImportedDocument(imported: ImportedInvoiceDocument): DraftLine[] {
  const lines = Array.isArray(imported.lines) ? imported.lines : [];
  const draftLines = lines
    .filter((line) => String(line.description ?? '').trim())
    .map((line) => ({
      id: crypto.randomUUID(),
      description: String(line.description ?? '').trim(),
      descriptionFi: String(line.description ?? '').trim(),
      descriptionEn: String(line.description_en ?? '').trim(),
      quantity: String(Number.isFinite(line.quantity) && Number(line.quantity) > 0 ? line.quantity : 1),
      unitLabel: String(line.unit_label ?? 'kpl').trim() || 'kpl',
      unitLabelEn: String(line.unit_label_en ?? translatedUnitLabel(line.unit_label)).trim() || 'pcs',
      unitGross: (Number(line.unit_gross_eur ?? 0) || 0).toFixed(2),
      vatRate: String(Number.isFinite(line.vat_rate) ? line.vat_rate : 25.5),
    }));

  return draftLines.length > 0 ? draftLines : [emptyLine()];
}

function importedReceiptFromDraft(draft: DocumentDraft, imported: ImportedInvoiceDocument | null): ImportedInvoiceDocument | null {
  const hasImportedFields = Boolean(
    draft.receiptNumber
    || draft.workOrderNumber
    || draft.vehicleName
    || draft.vehicleMileageKm
    || draft.vehicleVin
    || draft.vehicleEngineCode
    || draft.vehicleFirstRegistered
    || draft.vehicleLicensePlate
    || draft.workSummaryFi
    || draft.workSummaryEn
    || imported
  );

  if (!hasImportedFields) return null;

  return {
    ...(imported ?? {}),
    document_type: draft.documentType,
    language: draft.language,
    receipt: {
      ...(imported?.receipt ?? {}),
      receipt_number: draft.receiptNumber || undefined,
      work_order_number: draft.workOrderNumber || undefined,
      sale_date: draft.supplyDate || imported?.receipt?.sale_date,
    },
    vehicle: {
      ...(imported?.vehicle ?? {}),
      license_plate: draft.vehicleLicensePlate || undefined,
      vehicle: draft.vehicleName || undefined,
      mileage_km: draft.vehicleMileageKm || undefined,
      vin: draft.vehicleVin || undefined,
      engine_code: draft.vehicleEngineCode || undefined,
      first_registered: draft.vehicleFirstRegistered || undefined,
    },
    customer: {
      ...(imported?.customer ?? {}),
      name: draft.customerName || undefined,
      email: draft.customerEmail || undefined,
      phone: draft.customerPhone || undefined,
      business_id: draft.customerBusinessId || undefined,
      vat_id: draft.customerVatId || undefined,
      address_line1: draft.customerAddressLine1 || undefined,
      address_line2: draft.customerAddressLine2 || undefined,
      postal_code: draft.customerPostalCode || undefined,
      city: draft.customerCity || undefined,
    },
    payment: {
      ...(imported?.payment ?? {}),
      provider: draft.paymentProvider || undefined,
      transaction_id: draft.transactionId || undefined,
    },
    supply_date: draft.supplyDate,
    work_summary: draft.workSummaryFi || imported?.work_summary,
    work_summary_fi: draft.workSummaryFi || undefined,
    work_summary_en: draft.workSummaryEn || undefined,
  };
}

function DraftReceiptDetailsPanel({
  imported,
  draft,
  isDark,
  mutedClass,
  onDraftChange,
}: {
  imported: ImportedInvoiceDocument | null;
  draft: DocumentDraft;
  isDark: boolean;
  mutedClass: string;
  onDraftChange: (patch: Partial<DocumentDraft>) => void;
}) {
  const confidence = imported?.confidence;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-3">
          <div className={`rounded-lg border p-3 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-[#E5E7EB] bg-white'}`}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">Receipt</h3>
              {confidence ? (
                <span className={`rounded border px-2 py-0.5 text-xs font-medium ${isDark ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                  {confidence}
                </span>
              ) : (
                <span className={`text-xs ${mutedClass}`}>Upload can fill these fields</span>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input isDark={isDark} label="Receipt no." value={draft.receiptNumber} onChange={(value) => onDraftChange({ receiptNumber: String(value) })} />
              <Input isDark={isDark} label="Work order" value={draft.workOrderNumber} onChange={(value) => onDraftChange({ workOrderNumber: String(value) })} />
              <Input isDark={isDark} label="Sale date" value={draft.supplyDate} onChange={(value) => onDraftChange({ supplyDate: String(value) })} />
              <Input isDark={isDark} label="Payment" value={draft.paymentProvider} onChange={(value) => onDraftChange({ paymentProvider: normalizePaymentProvider(value) })} />
              <Input isDark={isDark} label="Transaction" value={draft.transactionId} onChange={(value) => onDraftChange({ transactionId: String(value) })} className="sm:col-span-2" />
            </div>
          </div>

          <div className={`rounded-lg border p-3 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-[#E5E7EB] bg-white'}`}>
            <h3 className="mb-3 text-sm font-semibold">Customer</h3>
            <div className="grid gap-2">
              <Input isDark={isDark} label="Name" value={draft.customerName} onChange={(value) => onDraftChange({ customerName: String(value) })} />
              <Input isDark={isDark} label="Phone" value={draft.customerPhone} onChange={(value) => onDraftChange({ customerPhone: String(value) })} />
              <Input isDark={isDark} label="Email" value={draft.customerEmail} onChange={(value) => onDraftChange({ customerEmail: String(value) })} />
            </div>
          </div>
        </div>

        <div className={`rounded-lg border p-3 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-[#E5E7EB] bg-white'}`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">Vehicle</h3>
            <span className={`font-mono text-xl font-semibold leading-none ${isDark ? 'text-white' : 'text-[#111827]'}`}>
              {draft.vehicleLicensePlate || '-'}
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input isDark={isDark} label="Vehicle" value={draft.vehicleName} onChange={(value) => onDraftChange({ vehicleName: String(value) })} className="sm:col-span-2" />
            <Input isDark={isDark} label="Mileage" value={draft.vehicleMileageKm} onChange={(value) => onDraftChange({ vehicleMileageKm: String(value) })} />
            <Input isDark={isDark} label="VIN" value={draft.vehicleVin} onChange={(value) => onDraftChange({ vehicleVin: String(value) })} />
            <Input isDark={isDark} label="Engine" value={draft.vehicleEngineCode} onChange={(value) => onDraftChange({ vehicleEngineCode: String(value) })} />
            <Input isDark={isDark} label="Registered" value={draft.vehicleFirstRegistered} onChange={(value) => onDraftChange({ vehicleFirstRegistered: String(value) })} />
            <Input isDark={isDark} label="License plate" value={draft.vehicleLicensePlate} onChange={(value) => onDraftChange({ vehicleLicensePlate: String(value) })} />
          </div>
        </div>
      </div>

    </div>
  );
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
      paymentProvider: normalizePaymentProvider(document.payment_provider),
      payOnline: document.payment_provider === 'paytrail',
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
            descriptionFi: description || source.title,
            descriptionEn: '',
            quantity: String(quantity),
            unitLabel: 'kpl',
            unitLabelEn: 'pcs',
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
      paymentProvider: normalizePaymentProvider(getOrderPaymentProvider(order)),
      transactionId: getOrderTransactionId(order),
      lines,
    };
  }

  if (source.sourceType === 'booking') {
    const booking = source.raw as BookingRow;
    const amountCents = getBookingAmountCents(booking);
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
        unitGross: amountCents > 0 ? (amountCents / 100).toFixed(2) : '0.00',
      }],
      notes: booking.license_plate ? `Vehicle: ${booking.license_plate}` : '',
    };
  }

  return initialDraft();
}

type InvoiceCmsDocumentScope = 'all' | 'receipt' | 'invoice';

type InvoicesCMSPageProps = {
  documentScope?: InvoiceCmsDocumentScope;
  title?: string;
};

function defaultDocumentTypeForScope(scope: InvoiceCmsDocumentScope): DocumentType {
  return scope === 'invoice' ? 'invoice' : 'receipt';
}

export function InvoicesCMSPage({ documentScope = 'all', title }: InvoicesCMSPageProps = {}) {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const ti = useCallback((key: string) => t(`invoiceCms.${key}`), [t]);
  const isDark = theme === 'dark';
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [invoiceDocuments, setInvoiceDocuments] = useState<InvoiceSummaryRow[]>([]);
  const [invoicePaymentLinks, setInvoicePaymentLinks] = useState<InvoicePaymentLinkRow[]>([]);
  const [activeTab, setActiveTab] = useState<SourceTab>('all');
  const [selectedKey, setSelectedKey] = useState<string>('manual:new');
  const [searchTerm, setSearchTerm] = useState('');
  const [draft, setDraft] = useState<DocumentDraft>(() => ({
    ...initialDraft(),
    documentType: defaultDocumentTypeForScope(documentScope),
  }));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateDraft, setTemplateDraft] = useState<TemplateDraft>(() => initialTemplateDraft());
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCustomerInvoiceDetails, setShowCustomerInvoiceDetails] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);
  const [importingDocument, setImportingDocument] = useState(false);
  const [importDragActive, setImportDragActive] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importedReceiptData, setImportedReceiptData] = useState<ImportedInvoiceDocument | null>(null);
  const [copyingPaymentLinkId, setCopyingPaymentLinkId] = useState<string | null>(null);
  const [markingPaidDocumentId, setMarkingPaidDocumentId] = useState<string | null>(null);
  const [voidingDocumentId, setVoidingDocumentId] = useState<string | null>(null);
  const [sendingReminderDocumentId, setSendingReminderDocumentId] = useState<string | null>(null);
  const documentShellRef = useRef<HTMLElement | null>(null);
  const [documentShellHeight, setDocumentShellHeight] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [ordersResult, bookingsResult, invoiceDocumentsResult, paymentLinksResult] = await Promise.all([
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
        supabase
          .from('invoice_payment_links')
          .select('id, document_id, payment_status, payment_provider, payment_link_url, payment_link_created_at, payment_link_expires_at, paytrail_transaction_id, amount_cents, paid_at, reminder_count, last_reminder_sent_at, created_at, updated_at')
          .order('created_at', { ascending: false })
          .limit(500),
      ]);

      if (ordersResult.error) throw ordersResult.error;
      if (bookingsResult.error) throw bookingsResult.error;
      if (invoiceDocumentsResult.error) throw invoiceDocumentsResult.error;
      if (paymentLinksResult.error) throw paymentLinksResult.error;

      setOrders((ordersResult.data ?? []) as OrderRow[]);
      setBookings((bookingsResult.data ?? []) as BookingRow[]);
      setInvoiceDocuments((invoiceDocumentsResult.data ?? []) as InvoiceSummaryRow[]);
      setInvoicePaymentLinks((paymentLinksResult.data ?? []) as InvoicePaymentLinkRow[]);
    } catch (err: any) {
      setError(err.message ?? ti('failedLoadInvoiceData'));
    } finally {
      setLoading(false);
    }
  }, [ti]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useLayoutEffect(() => {
    const node = documentShellRef.current;
    if (!node) return undefined;

    const updateHeight = () => {
      setDocumentShellHeight(Math.ceil(node.getBoundingClientRect().height));
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, [draft, importedReceiptData, selectedKey, previewUrl, importMessage, documentScope]);

  useEffect(() => {
    if (documentScope === 'all') return;
    setDraft((current) => ({ ...current, documentType: defaultDocumentTypeForScope(documentScope) }));
  }, [documentScope]);

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

  const latestPaymentLinkByDocument = useMemo(() => {
    const map = new Map<string, InvoicePaymentLinkRow>();
    invoicePaymentLinks.forEach((link) => {
      const current = map.get(link.document_id);
      if (!current || (link.created_at ?? '') > (current.created_at ?? '')) {
        map.set(link.document_id, link);
      }
    });
    return map;
  }, [invoicePaymentLinks]);

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
      paymentLink: latestPaymentLinkByDocument.get(document.id) ?? null,
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
      paymentLink: documentBySource.get(sourceKey('order', order.id))?.id ? latestPaymentLinkByDocument.get(documentBySource.get(sourceKey('order', order.id))!.id) ?? null : null,
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
      paymentLink: documentBySource.get(sourceKey('booking', booking.id))?.id ? latestPaymentLinkByDocument.get(documentBySource.get(sourceKey('booking', booking.id))!.id) ?? null : null,
      raw: booking,
    })).filter((source) => !documentedSourceKeys.has(source.key));

    return [...documentSources, ...orderSources, ...bookingSources].sort((a, b) => {
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });
  }, [bookings, documentBySource, invoiceDocuments, latestPaymentLinkByDocument, orders]);

  const filteredSources = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return sources.filter((source) => {
      if (documentScope !== 'all' && source.document && source.document.document_type !== documentScope) return false;
      if (activeTab === 'orders' && source.sourceType !== 'order') return false;
      if (activeTab === 'bookings' && source.sourceType !== 'booking') return false;
      if (activeTab === 'drafts' && documentStatus(source) !== 'draft') return false;
      if (activeTab === 'sent' && !['sent', 'issued', 'paid'].includes(documentStatus(source) ?? '')) return false;
      if (activeTab === 'unpaid' && !(source.document?.document_type === 'invoice' && !['paid', 'credited', 'void', 'cancelled'].includes(source.document.status))) return false;
      if (activeTab === 'paid' && !(source.document?.document_type === 'invoice' && source.document.status === 'paid')) return false;

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

  const invoiceTrackingSummary = useMemo(() => {
    return sources.reduce(
      (summary, source) => {
        const document = source.document;
        if (!document || document.document_type !== 'invoice') return summary;
        const total = document.total_cents ?? source.amountCents ?? 0;
        if (document.status === 'paid') {
          summary.paidCount += 1;
          summary.paidCents += total;
        } else if (!['credited', 'void', 'cancelled'].includes(document.status)) {
          summary.openCount += 1;
          summary.openCents += Math.max(0, total - (document.paid_cents ?? 0));
        }
        return summary;
      },
      { openCount: 0, openCents: 0, paidCount: 0, paidCents: 0 }
    );
  }, [sources]);

  const selectedSource = sources.find((source) => source.key === selectedKey) ?? null;
  const selectedPaymentLink = selectedSource?.document?.id ? latestPaymentLinkByDocument.get(selectedSource.document.id) ?? null : null;
  const totals = useMemo(() => calculateDraftTotals(draft.lines), [draft.lines]);
  const draftValidation = useMemo(() => validateInvoiceDraft(draft, totals), [draft, totals]);

  const selectSource = async (source: SourceRecord) => {
    setSelectedKey(source.key);
    const nextDraft = buildDraftFromSource(source);
    setImportedReceiptData(null);

    if (source.document) {
      const [documentResult, linesResult, partiesResult, paymentResult] = await Promise.all([
        supabase
          .from('invoice_documents')
          .select('internal_notes, payload, supply_date')
          .eq('id', source.document.id)
          .maybeSingle(),
        supabase
          .from('invoice_lines')
          .select('line_number, title, quantity, unit_label, unit_price_incl_vat_cents, vat_rate, source_payload')
          .eq('document_id', source.document.id)
          .order('line_number', { ascending: true }),
        supabase
          .from('invoice_parties')
          .select('role, business_id, vat_id, address_line1, address_line2, postal_code, city, country_code')
          .eq('document_id', source.document.id),
        supabase
          .from('invoice_payment_details')
          .select('payment_provider, transaction_id, reference_number')
          .eq('document_id', source.document.id)
          .maybeSingle(),
      ]);

      if (!documentResult.error && documentResult.data) {
        const importedReceipt = (documentResult.data.payload?.imported_receipt ?? null) as ImportedInvoiceDocument | null;
        const receipt = importedReceipt?.receipt ?? {};
        const vehicle = importedReceipt?.vehicle ?? {};
        const workSummaryFi = firstText(importedReceipt?.work_summary_fi, importedReceipt?.work_summary);
        nextDraft.notes = documentResult.data.internal_notes ?? nextDraft.notes;
        nextDraft.importSource = documentResult.data.payload?.import_source ?? nextDraft.importSource;
        nextDraft.payOnline = Boolean(documentResult.data.payload?.pay_online);
        nextDraft.supplyDate = documentResult.data.supply_date ?? nextDraft.supplyDate;
        nextDraft.receiptNumber = receipt.receipt_number ?? nextDraft.receiptNumber;
        nextDraft.workOrderNumber = receipt.work_order_number ?? nextDraft.workOrderNumber;
        nextDraft.vehicleName = vehicle.vehicle ?? nextDraft.vehicleName;
        nextDraft.vehicleMileageKm = vehicle.mileage_km ?? nextDraft.vehicleMileageKm;
        nextDraft.vehicleVin = vehicle.vin ?? nextDraft.vehicleVin;
        nextDraft.vehicleEngineCode = vehicle.engine_code ?? nextDraft.vehicleEngineCode;
        nextDraft.vehicleFirstRegistered = vehicle.first_registered ?? nextDraft.vehicleFirstRegistered;
        nextDraft.vehicleLicensePlate = vehicle.license_plate ?? nextDraft.vehicleLicensePlate;
        nextDraft.workSummaryFi = workSummaryFi || nextDraft.workSummaryFi;
        nextDraft.workSummaryEn = importedReceipt?.work_summary_en ?? nextDraft.workSummaryEn;
        setImportedReceiptData(importedReceipt);
      }

      if (!linesResult.error && Array.isArray(linesResult.data) && linesResult.data.length > 0) {
        nextDraft.lines = linesResult.data.map((line: any) => ({
          id: crypto.randomUUID(),
          description: String(
            nextDraft.language === 'en' && line.source_payload?.description_en
              ? line.source_payload.description_en
              : (line.source_payload?.description_fi ?? line.title ?? '')
          ),
          descriptionFi: String(line.source_payload?.description_fi ?? line.title ?? ''),
          descriptionEn: String(line.source_payload?.description_en ?? ''),
          quantity: String(line.quantity ?? '1'),
          unitLabel: String(line.source_payload?.unit_label_fi ?? line.unit_label ?? 'kpl'),
          unitLabelEn: String(line.source_payload?.unit_label_en ?? translatedUnitLabel(line.unit_label)),
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

      if (!paymentResult.error && paymentResult.data) {
        nextDraft.paymentProvider = normalizePaymentProvider(paymentResult.data.payment_provider ?? nextDraft.paymentProvider);
        nextDraft.transactionId = firstText(paymentResult.data.transaction_id, paymentResult.data.reference_number, nextDraft.transactionId);
      }
    }

    setDraft(nextDraft);
    setShowCustomerInvoiceDetails(
      nextDraft.documentType === 'invoice'
      || Boolean(
        nextDraft.customerBusinessId
        || nextDraft.customerVatId
        || nextDraft.customerAddressLine1
        || nextDraft.customerAddressLine2
        || nextDraft.customerPostalCode
        || nextDraft.customerCity
      )
    );
  };

  const startManualDraft = () => {
    setSelectedKey('manual:new');
    setDraft({ ...initialDraft(), language, documentType: defaultDocumentTypeForScope(documentScope) });
    setShowCustomerInvoiceDetails(false);
    setImportedReceiptData(null);
  };

  const loadTemplateSettings = useCallback(async () => {
    setTemplateLoading(true);
    setError(null);

    try {
      const { data, error: templateError } = await supabase
        .from('invoice_templates')
        .select('id, template_key, display_name, company_name, business_id, vat_id, address_line1, address_line2, country_code, email, phone, iban, bic, payment_terms, footer_text, is_default')
        .eq('is_default', true)
        .maybeSingle();

      if (templateError) throw templateError;

      setTemplateDraft(templateDraftFromRow(data as InvoiceTemplateRow | null));
    } catch (err: any) {
      setError(err.message ?? ti('failedLoadTemplate'));
    } finally {
      setTemplateLoading(false);
    }
  }, [ti]);

  const openTemplateSettings = async () => {
    setTemplateOpen(true);
    await loadTemplateSettings();
  };

  const saveTemplateSettings = async () => {
    setTemplateSaving(true);
    setError(null);

    try {
      const row = {
        template_key: 'default',
        display_name: templateDraft.displayName.trim() || 'Default',
        company_name: templateDraft.companyName.trim() || 'Mitra Auto Oy',
        business_id: templateDraft.businessId.trim() || '3408833-8',
        vat_id: templateDraft.vatId.trim() || 'FI34088338',
        address_line1: templateDraft.addressLine1.trim(),
        address_line2: templateDraft.addressLine2.trim(),
        country_code: templateDraft.countryCode.trim() || 'FI',
        email: templateDraft.email.trim(),
        phone: templateDraft.phone.trim(),
        iban: templateDraft.iban.trim() || null,
        bic: templateDraft.bic.trim() || null,
        payment_terms: templateDraft.paymentTerms.trim() || null,
        footer_text: templateDraft.footerText.trim() || null,
        is_default: true,
      };

      const result = templateDraft.id
        ? await supabase.from('invoice_templates').update(row).eq('id', templateDraft.id).select('id').single()
        : await supabase.from('invoice_templates').upsert(row, { onConflict: 'template_key' }).select('id').single();

      if (result.error) throw result.error;

      setTemplateDraft((current) => ({ ...current, id: result.data.id }));
      setTemplateOpen(false);
    } catch (err: any) {
      setError(err.message ?? ti('failedSaveTemplate'));
    } finally {
      setTemplateSaving(false);
    }
  };

  const updateLine = (lineId: string, patch: Partial<DraftLine>) => {
    setDraft((current) => ({
      ...current,
      lines: current.lines.map((line) => {
        if (line.id !== lineId) return line;
        const nextLine = { ...line, ...patch };
        if ('description' in patch && !String(patch.description ?? '').trim()) {
          nextLine.descriptionFi = '';
          nextLine.descriptionEn = '';
        }
        return nextLine;
      }),
    }));
  };

  const removeLine = (lineId: string) => {
    setDraft((current) => ({
      ...current,
      lines: current.lines.length > 1
        ? current.lines.filter((line) => line.id !== lineId)
        : [emptyLine()],
    }));
  };

  const saveDraft = async () => {
    setSaving(true);
    setError(null);

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
        pay_online: draft.documentType === 'invoice' && draft.payOnline,
        notes: draft.notes,
        import_source: draft.importSource,
        imported_receipt: importedReceiptFromDraft(draft, importedReceiptData),
        validation: validateInvoiceDraft(draft, totals),
        original_source: existingFinalSource ? {
          source_type: selectedSource?.sourceType ?? draft.sourceType,
          source_id: selectedSource?.sourceId ?? draft.sourceId,
          document_number: selectedSource ? documentNumber(selectedSource) : null,
        } : null,
        lines: draftLines.map(({ line, calculated }) => ({
          description: line.description,
          description_fi: line.descriptionFi || line.description,
          description_en: line.descriptionEn || '',
          quantity: calculated.quantity,
          unit_label: line.unitLabel || 'kpl',
          unit_label_en: line.unitLabelEn || translatedUnitLabel(line.unitLabel),
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
          unit_label: line.unitLabel || 'kpl',
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
            description_fi: line.descriptionFi || line.description,
            description_en: line.descriptionEn || null,
            unit_label_fi: line.unitLabel || 'kpl',
            unit_label_en: line.unitLabelEn || translatedUnitLabel(line.unitLabel),
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
          payment_provider: draft.documentType === 'invoice' && draft.payOnline ? 'paytrail' : draft.paymentProvider || null,
          payment_method: draft.documentType === 'invoice' && draft.payOnline ? 'online' : null,
          transaction_id: draft.transactionId || null,
          payload: {
            source_type: draft.sourceType,
            source_id: draft.sourceId,
            pay_online: draft.documentType === 'invoice' && draft.payOnline,
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

      await loadData();
      setSelectedKey(`document:${documentId}`);
    } catch (err: any) {
      setError(err.message ?? ti('failedSaveDraft'));
    } finally {
      setSaving(false);
    }
  };

  const runDocumentAction = async (action: 'preview' | 'issue' | 'send') => {
    const documentId = selectedSource?.document?.id;
    if (!documentId) {
      setError(ti('saveBeforeAction'));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('invoice_document_issue', {
        method: 'POST',
        body: { documentId, action },
      });
      if (invokeError) throw invokeError;
      if (data?.url && action === 'preview') {
        setPreviewUrl(String(data.url).replace('download=1', 'download=0'));
      } else if (data?.url && action === 'issue') {
        window.open(data.url, '_blank', 'noopener,noreferrer');
      }
      await loadData();
    } catch (err: any) {
      setError(err.message ?? `${ti('failedDocumentAction')}: ${action}`);
    } finally {
      setSaving(false);
    }
  };

  const copyInvoicePaymentLink = async (source: SourceRecord | null = selectedSource) => {
    const document = source?.document;
    if (!document) {
      setError(ti('saveBeforeAction'));
      return;
    }
    if (document.document_type !== 'invoice') return;

    setCopyingPaymentLinkId(document.id);
    setError(null);
    setImportMessage(null);
    try {
      const token = randomHex(32);
      const tokenHash = await sha256Hex(token);
      const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
      const { error: tokenError } = await supabase.from('invoice_payment_access_tokens').insert({
        document_id: document.id,
        token_hash: tokenHash,
        status: 'active',
        expires_at: expiresAt,
      });
      if (tokenError) throw tokenError;

      await navigator.clipboard.writeText(invoicePaymentUrl(token));
      setImportMessage(ti('paymentLinkCopied'));
    } catch (err: any) {
      setError(`${ti('failedPaymentLink')}: ${err.message ?? String(err)}`);
    } finally {
      setCopyingPaymentLinkId(null);
    }
  };

  const markInvoicePaid = async (source: SourceRecord | null = selectedSource) => {
    const document = source?.document;
    if (!document || document.document_type !== 'invoice' || ['paid', 'credited', 'void', 'cancelled'].includes(document.status)) return;
    if (!window.confirm(ti('markPaidConfirm'))) return;

    const paidAt = new Date().toISOString();
    setMarkingPaidDocumentId(document.id);
    setError(null);
    setImportMessage(null);
    try {
      const { error: documentError } = await supabase
        .from('invoice_documents')
        .update({
          status: 'paid',
          paid_cents: document.total_cents ?? 0,
          paid_at: paidAt,
        })
        .eq('id', document.id);
      if (documentError) throw documentError;

      const { error: paymentError } = await supabase
        .from('invoice_payment_details')
        .upsert({
          document_id: document.id,
          payment_status: 'paid',
          payment_provider: draft.paymentProvider || document.payment_provider || 'manual',
          payment_method: 'manual',
          transaction_id: draft.transactionId || document.transaction_id || null,
          paid_at: paidAt,
          payload: {
            marked_paid_by: 'cms',
            marked_paid_at: paidAt,
          },
        }, { onConflict: 'document_id' });
      if (paymentError) throw paymentError;

      if (source?.paymentLink?.id) {
        const { error: linkError } = await supabase
          .from('invoice_payment_links')
          .update({
            payment_status: 'paid',
            paid_at: paidAt,
          })
          .eq('id', source.paymentLink.id);
        if (linkError) throw linkError;
      }

      const { error: eventError } = await supabase.from('invoice_events').insert({
        document_id: document.id,
        event_type: 'payment_marked_paid',
        actor: 'cms',
        payload: {
          amount_cents: document.total_cents ?? 0,
          source_type: source?.sourceType ?? null,
          source_id: source?.sourceId ?? null,
        },
      });
      if (eventError) throw eventError;

      setImportMessage(ti('invoiceMarkedPaid'));
      await loadData();
    } catch (err: any) {
      setError(`${ti('failedMarkPaid')}: ${err.message ?? String(err)}`);
    } finally {
      setMarkingPaidDocumentId(null);
    }
  };

  const voidInvoice = async (source: SourceRecord | null = selectedSource) => {
    const document = source?.document;
    if (!document || document.document_type !== 'invoice' || ['paid', 'credited', 'void', 'cancelled'].includes(document.status)) return;
    if (!window.confirm(ti('voidInvoiceConfirm'))) return;

    const voidedAt = new Date().toISOString();
    setVoidingDocumentId(document.id);
    setError(null);
    setImportMessage(null);
    try {
      const { error: documentError } = await supabase
        .from('invoice_documents')
        .update({ status: 'void' })
        .eq('id', document.id);
      if (documentError) throw documentError;

      const { error: paymentError } = await supabase
        .from('invoice_payment_details')
        .upsert({
          document_id: document.id,
          payment_status: 'cancelled',
          payment_provider: document.payment_provider || draft.paymentProvider || null,
          payment_method: 'manual',
          transaction_id: document.transaction_id || draft.transactionId || null,
          payload: {
            voided_by: 'cms',
            voided_at: voidedAt,
          },
        }, { onConflict: 'document_id' });
      if (paymentError) throw paymentError;

      const [{ error: linksError }, { error: tokensError }, { error: eventError }] = await Promise.all([
        supabase
          .from('invoice_payment_links')
          .update({ payment_status: 'cancelled' })
          .eq('document_id', document.id)
          .in('payment_status', ['created', 'pending', 'failed', 'expired']),
        supabase
          .from('invoice_payment_access_tokens')
          .update({ status: 'revoked' })
          .eq('document_id', document.id)
          .eq('status', 'active'),
        supabase.from('invoice_events').insert({
          document_id: document.id,
          event_type: 'invoice_voided',
          actor: 'cms',
          payload: {
            source_type: source?.sourceType ?? null,
            source_id: source?.sourceId ?? null,
          },
        }),
      ]);
      if (linksError) throw linksError;
      if (tokensError) throw tokensError;
      if (eventError) throw eventError;

      setImportMessage(ti('invoiceVoided'));
      await loadData();
    } catch (err: any) {
      setError(`${ti('failedVoidInvoice')}: ${err.message ?? String(err)}`);
    } finally {
      setVoidingDocumentId(null);
    }
  };

  const sendInvoiceReminder = async (source: SourceRecord | null = selectedSource) => {
    const document = source?.document;
    if (!document || document.document_type !== 'invoice' || ['paid', 'credited', 'void', 'cancelled'].includes(document.status)) return;

    const remindedAt = new Date().toISOString();
    setSendingReminderDocumentId(document.id);
    setError(null);
    setImportMessage(null);
    try {
      const { error: invokeError } = await supabase.functions.invoke('invoice_document_issue', {
        method: 'POST',
        body: { documentId: document.id, action: 'send' },
      });
      if (invokeError) throw invokeError;

      if (source?.paymentLink?.id) {
        const { error: linkError } = await supabase
          .from('invoice_payment_links')
          .update({
            reminder_count: (source.paymentLink.reminder_count ?? 0) + 1,
            last_reminder_sent_at: remindedAt,
          })
          .eq('id', source.paymentLink.id);
        if (linkError) throw linkError;
      }

      const { error: eventError } = await supabase.from('invoice_events').insert({
        document_id: document.id,
        event_type: 'payment_reminder_sent',
        actor: 'cms',
        payload: {
          payment_link_id: source?.paymentLink?.id ?? null,
          reminder_sent_at: remindedAt,
          source_type: source?.sourceType ?? null,
          source_id: source?.sourceId ?? null,
        },
      });
      if (eventError) throw eventError;

      setImportMessage(ti('reminderSent'));
      await loadData();
    } catch (err: any) {
      setError(`${ti('failedSendReminder')}: ${err.message ?? String(err)}`);
    } finally {
      setSendingReminderDocumentId(null);
    }
  };

  const deleteInvoiceDocument = async (source: SourceRecord) => {
    if (!source.document || !canDeleteInvoiceSource(source)) return;
    const confirmed = window.confirm(ti('deleteDocumentConfirm'));
    if (!confirmed) return;

    setDeletingDocumentId(source.document.id);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('invoice_documents')
        .delete()
        .eq('id', source.document.id);
      if (deleteError) throw deleteError;

      if (selectedKey === source.key || selectedKey === `document:${source.document.id}`) {
        setSelectedKey('manual:new');
        setDraft({ ...initialDraft(), documentType: defaultDocumentTypeForScope(documentScope) });
        setShowCustomerInvoiceDetails(false);
      }
      await loadData();
    } catch (err: any) {
      setError(err.message ?? ti('failedDeleteDocument'));
    } finally {
      setDeletingDocumentId(null);
    }
  };

  const applyImportedDocument = (imported: ImportedInvoiceDocument, fileName: string) => {
    const customer = imported.customer ?? {};
    const payment = imported.payment ?? {};
    const vehicle = imported.vehicle ?? {};
    const importedLanguage = imported.language === 'en' ? 'en' : 'fi';
    const nextLines = linesFromImportedDocument(imported).map((line) => ({
      ...line,
      description: importedLanguage === 'en' && line.descriptionEn ? line.descriptionEn : (line.descriptionFi || line.description),
    }));
    const importedNotes = formatImportedNotes(imported, fileName);
    setImportedReceiptData(imported);

    setDraft((current) => ({
      ...current,
      documentType: imported.document_type === 'invoice' ? 'invoice' : imported.document_type === 'receipt' ? 'receipt' : current.documentType,
      receiptNumber: firstText(imported.receipt?.receipt_number, current.receiptNumber),
      workOrderNumber: firstText(imported.receipt?.work_order_number, current.workOrderNumber),
      vehicleName: firstText(vehicle.vehicle, current.vehicleName),
      vehicleMileageKm: firstText(vehicle.mileage_km, current.vehicleMileageKm),
      vehicleVin: firstText(vehicle.vin, current.vehicleVin),
      vehicleEngineCode: firstText(vehicle.engine_code, current.vehicleEngineCode),
      vehicleFirstRegistered: firstText(vehicle.first_registered, current.vehicleFirstRegistered),
      vehicleLicensePlate: firstText(vehicle.license_plate, current.vehicleLicensePlate),
      workSummaryFi: firstText(imported.work_summary_fi, imported.work_summary, current.workSummaryFi),
      workSummaryEn: firstText(imported.work_summary_en, current.workSummaryEn),
      customerName: firstText(customer.name, vehicle.license_plate, current.customerName),
      customerEmail: firstText(customer.email, current.customerEmail),
      customerPhone: firstText(customer.phone, current.customerPhone),
      customerBusinessId: firstText(customer.business_id, current.customerBusinessId),
      customerVatId: firstText(customer.vat_id, current.customerVatId),
      customerAddressLine1: firstText(customer.address_line1, current.customerAddressLine1),
      customerAddressLine2: firstText(customer.address_line2, current.customerAddressLine2),
      customerPostalCode: firstText(customer.postal_code, current.customerPostalCode),
      customerCity: firstText(customer.city, current.customerCity),
      language: importedLanguage,
      supplyDate: firstText(normalizeImportedDate(imported.supply_date), current.supplyDate),
      paymentProvider: normalizePaymentProvider(firstText(payment.provider, current.paymentProvider)),
      transactionId: firstText(payment.transaction_id, current.transactionId),
      lines: nextLines,
      notes: current.notes ? `${current.notes}\n\n${importedNotes}` : importedNotes,
      importSource: `Imported from ${fileName}`,
    }));

    setShowCustomerInvoiceDetails(Boolean(
      customer.business_id
      || customer.vat_id
      || customer.address_line1
      || customer.address_line2
      || customer.postal_code
      || customer.city
      || imported.document_type === 'invoice'
    ));
    setImportMessage(`${ti('documentImported')} ${imported.confidence ? `(${ti('confidence')}: ${imported.confidence})` : ''}`);
  };

  const importDocumentFile = async (file: File) => {
    if (!isSupportedImportFile(file)) {
      setError(ti('unsupportedImportFile'));
      return;
    }

    setImportingDocument(true);
    setError(null);
    setImportMessage(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      const { data, error: invokeError } = await supabase.functions.invoke('invoice_import_document', {
        method: 'POST',
        body: {
          fileName: file.name,
          mimeType: file.type,
          dataUrl,
        },
      });
      if (invokeError) {
        const functionError = typeof data === 'object' && data && 'error' in data ? String((data as { error?: unknown }).error ?? '') : '';
        if (functionError) throw new Error(functionError);
        throw invokeError;
      }
      if (typeof data === 'object' && data && 'error' in data) {
        throw new Error(String((data as { error?: unknown }).error ?? ti('failedImportDocument')));
      }
      applyImportedDocument(data as ImportedInvoiceDocument, file.name);
    } catch (err: any) {
      let message = err.message ?? ti('failedImportDocument');
      const context = err?.context;
      if (context && typeof context.clone === 'function') {
        try {
          const response = context.clone();
          const contentType = response.headers?.get?.('content-type') ?? '';
          if (contentType.includes('application/json')) {
            const body = await response.json();
            message = String(body?.error ?? body?.message ?? message);
          } else {
            const bodyText = await response.text();
            if (bodyText.trim()) message = bodyText.trim();
          }
        } catch {
          // Keep the original Supabase error when the response body cannot be read.
        }
      }
      setError(message);
    } finally {
      setImportingDocument(false);
      setImportDragActive(false);
    }
  };

  const importDocumentFiles = async (files: FileList | File[]) => {
    const file = Array.from(files).find(isSupportedImportFile);
    if (!file) {
      setError(ti('unsupportedImportFile'));
      return;
    }
    await importDocumentFile(file);
  };

  const handleDocumentWorkspaceDrop = async (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setImportDragActive(false);
    if (event.dataTransfer.files.length > 0) {
      await importDocumentFiles(event.dataTransfer.files);
    }
  };

  const handleDocumentWorkspacePaste = async (event: React.ClipboardEvent<HTMLElement>) => {
    if (event.clipboardData.files.length > 0) {
      await importDocumentFiles(event.clipboardData.files);
    }
  };

  const panelClass = isDark ? 'border-white/10 bg-[#11141A] text-white' : 'border-[#D2D2D7] bg-white text-[#1D1D1F]';
  const mutedClass = isDark ? 'text-gray-400' : 'text-[#6E6E73]';
  const tabs: Array<{ id: SourceTab; label: string }> = [
    { id: 'all', label: ti('all') },
    { id: 'orders', label: ti('orders') },
    { id: 'bookings', label: ti('bookings') },
    { id: 'drafts', label: ti('drafts') },
    { id: 'sent', label: ti('sent') },
    { id: 'unpaid', label: ti('unpaid') },
    { id: 'paid', label: ti('paid') },
  ];
  const paymentProviderOptions = [
    { value: '', label: ti('selectPaymentProvider') },
    { value: 'card', label: ti('card') },
    { value: 'cash', label: ti('cash') },
    { value: 'bank_transfer', label: ti('bankTransfer') },
  ];
  const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label ?? ti('all');
  const customerInvoiceDetailsVisible = draft.documentType === 'invoice' || showCustomerInvoiceDetails;
  const paymentLinkStatus = selectedPaymentLink?.payment_status ?? null;
  const workspaceSourceLabel = selectedSource?.sourceType === 'booking'
    ? ti('service')
    : selectedSource?.sourceType === 'order'
      ? ti('order')
      : '';
  const workspaceDocumentLabel = workspaceSourceLabel ? `${workspaceSourceLabel} ${ti(draft.documentType)}` : ti(draft.documentType);

  return (
    <div className={`min-h-[760px] rounded-[16px] p-4 sm:p-6 ${isDark ? 'bg-[#0B0D12]' : 'bg-[#FAFAFA]'}`}>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#F97316]" />
          <h1 className="text-2xl font-semibold tracking-tight">{title ?? ti('title')}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button isDark={isDark} size="sm" color="secondary" iconLeading={<RefreshCcw className="h-4 w-4" />} onClick={() => void loadData()} isDisabled={loading}>
            {ti('refresh')}
          </Button>
          <Button isDark={isDark} size="sm" color="secondary" iconLeading={<Settings className="h-4 w-4" />} onClick={() => void openTemplateSettings()}>
            {ti('templateSettings')}
          </Button>
          {documentScope === 'all' && (
            <div
              role="radiogroup"
              aria-label={ti('documentType')}
              className={`grid h-9 grid-cols-2 rounded-md border p-1 ${
                isDark ? 'border-white/10 bg-white/5' : 'border-[#D2D2D7] bg-white'
              }`}
            >
              {(['receipt', 'invoice'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={draft.documentType === type}
                  onClick={() => setDraft((current) => ({ ...current, documentType: type }))}
                  className={`min-w-[82px] rounded px-3 text-sm font-medium transition-colors ${
                    draft.documentType === type
                      ? 'bg-[#F97316] text-white shadow-sm'
                      : isDark ? 'text-gray-300 hover:bg-white/10' : 'text-[#475569] hover:bg-[#F5F5F7]'
                  }`}
                >
                  {ti(type)}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={startManualDraft}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#F97316] bg-[#F97316] text-white transition-colors hover:bg-[#EA580C]"
            aria-label={ti('createDraft')}
            title={ti('createDraft')}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(340px,0.72fr)_minmax(620px,1.28fr)]">
        <section
          className={`flex min-h-[640px] flex-col overflow-hidden rounded-lg border ${panelClass}`}
          style={documentShellHeight ? { height: documentShellHeight } : undefined}
        >
          <div className="border-b border-inherit p-3">
            <div className="flex items-center gap-2">
              <div className="relative w-[132px] shrink-0">
                <select
                  aria-label={ti('source')}
                  value={activeTab}
                  onChange={(event) => setActiveTab(event.target.value as SourceTab)}
                  className={`h-10 w-full appearance-none rounded-md border px-3 pr-9 text-sm font-medium outline-none transition-colors ${
                    isDark
                      ? 'border-white/10 bg-[#11141A] text-white hover:bg-white/5'
                      : 'border-[#D2D2D7] bg-white text-[#1D1D1F] hover:bg-[#F5F5F7]'
                  }`}
                >
                  {tabs.map((tab) => (
                    <option key={tab.id} value={tab.id}>
                      {tab.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 ${mutedClass}`} />
                <span className="sr-only">{activeTabLabel}</span>
              </div>
              <div className="relative min-w-0 flex-1">
                <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${mutedClass}`} />
                <Input
                  isDark={isDark}
                  aria-label={ti('searchSources')}
                  placeholder={ti('searchSources')}
                  value={searchTerm}
                  onChange={(value) => setSearchTerm(String(value))}
                  size="sm"
                  inputClassName="pl-9"
                />
              </div>
            </div>
          </div>
          <div className={`border-b border-inherit px-3 py-2 ${isDark ? 'bg-white/[0.02]' : 'bg-[#F8FAFC]'}`}>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('unpaid')}
                className={`rounded-md border p-2 text-left transition-colors ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-[#E5E7EB] bg-white hover:bg-[#F5F5F7]'}`}
              >
                <div className={mutedClass}>{ti('openInvoices')}</div>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <span className="font-mono text-sm font-semibold">{centsToMoney(invoiceTrackingSummary.openCents)}</span>
                  <span className={mutedClass}>{invoiceTrackingSummary.openCount} {ti('invoiceCount')}</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('paid')}
                className={`rounded-md border p-2 text-left transition-colors ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-[#E5E7EB] bg-white hover:bg-[#F5F5F7]'}`}
              >
                <div className={mutedClass}>{ti('paidInvoices')}</div>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <span className="font-mono text-sm font-semibold">{centsToMoney(invoiceTrackingSummary.paidCents)}</span>
                  <span className={mutedClass}>{invoiceTrackingSummary.paidCount} {ti('invoiceCount')}</span>
                </div>
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className={`p-6 text-sm ${mutedClass}`}>{ti('loadingSources')}</div>
            ) : filteredSources.length === 0 ? (
              <div className={`p-6 text-sm ${mutedClass}`}>{ti('noSources')}</div>
            ) : (
              <div className="space-y-2">
                {filteredSources.map((source) => {
                  const selected = selectedKey === source.key;
                  const sourceLabel = `${source.sourceType.toUpperCase()} ${source.sourceId ?? documentNumber(source)}`;
                  const amount = centsToMoney(source.amountCents || source.document?.total_cents);
                  const deletable = canDeleteInvoiceSource(source);
                  const deleting = deletingDocumentId === source.document?.id;
                  const paymentLink = source.paymentLink;
                  const canCopyPaymentLink = source.document?.document_type === 'invoice' && !['paid', 'credited', 'void', 'cancelled'].includes(source.document.status);
                  const canMarkPaid = source.document?.document_type === 'invoice' && !['paid', 'credited', 'void', 'cancelled'].includes(source.document.status);
                  const canVoidInvoice = canMarkPaid;
                  const canSendReminder = canMarkPaid && Boolean(source.customerEmail);
                  return (
                    <div
                      key={source.key}
                      className={`rounded-md border text-sm transition-colors ${
                        selected
                          ? isDark ? 'border-orange-400/60 bg-orange-500/15' : 'border-orange-300 bg-orange-50'
                          : isDark ? 'border-white/10 bg-white/[0.03] hover:bg-white/5' : 'border-[#E5E7EB] bg-white hover:bg-[#FAFAFA]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => void selectSource(source)}
                        className="block w-full p-3 text-left"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-semibold">{source.title}</div>
                            <div className={`mt-1 font-mono text-[11px] uppercase ${mutedClass}`}>
                              {sourceLabel}
                            </div>
                          </div>
                          <div className="shrink-0 text-right font-mono text-sm font-semibold">
                            {amount}
                          </div>
                        </div>

                        <div className={`mt-3 grid gap-2 rounded-md p-2 ${isDark ? 'bg-black/20' : 'bg-[#F8FAFC]'}`}>
                          <div className="min-w-0">
                            <div className={`text-[11px] font-medium uppercase tracking-[0.08em] ${mutedClass}`}>
                              {ti('customer')}
                            </div>
                            <div className="mt-1 truncate font-medium">{source.customerName}</div>
                            <div className={`mt-0.5 truncate text-xs ${mutedClass}`}>
                              {source.customerEmail || source.customerPhone || '-'}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="flex min-w-0 flex-wrap gap-1">
                            <Badge isDark={isDark} size="sm" tone={documentTone(documentStatus(source))}>
                              {documentStatus(source) ?? ti('needsDocument')}
                            </Badge>
                            <Badge isDark={isDark} size="sm" tone="gray">{source.status}</Badge>
                            {source.document?.document_type === 'invoice' && (
                              <Badge isDark={isDark} size="sm" tone={paymentLink?.payment_status === 'paid' ? 'success' : paymentLink ? 'warning' : 'gray'}>
                                {paymentLink?.payment_status ? `${ti('paymentLink')}: ${paymentLink.payment_status}` : ti('noPaymentLink')}
                              </Badge>
                            )}
                          </div>
                          <div className={`shrink-0 text-right text-[11px] ${mutedClass}`}>
                            {formatDate(source.createdAt)}
                          </div>
                        </div>
                      </button>

                      {(deletable || canCopyPaymentLink || canMarkPaid || canVoidInvoice || canSendReminder) && (
                        <div className={`flex flex-wrap items-center gap-2 border-t px-3 py-2 ${isDark ? 'border-white/10' : 'border-[#E5E7EB]'}`}>
                          {canSendReminder && (
                            <button
                              type="button"
                              onClick={() => void sendInvoiceReminder(source)}
                              disabled={sendingReminderDocumentId === source.document?.id}
                              className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                                isDark ? 'text-orange-200 hover:bg-orange-500/10' : 'text-orange-700 hover:bg-orange-50'
                              }`}
                            >
                              <RefreshCcw className="h-3.5 w-3.5" />
                              {sendingReminderDocumentId === source.document?.id ? ti('sendingReminder') : ti('sendReminder')}
                            </button>
                          )}
                          {canCopyPaymentLink && (
                            <button
                              type="button"
                              onClick={() => void copyInvoicePaymentLink(source)}
                              disabled={copyingPaymentLinkId === source.document?.id}
                              className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                                isDark ? 'text-blue-200 hover:bg-blue-500/10' : 'text-blue-700 hover:bg-blue-50'
                              }`}
                            >
                              <Copy className="h-3.5 w-3.5" />
                              {ti('copyPaymentLink')}
                            </button>
                          )}
                          {canMarkPaid && (
                            <button
                              type="button"
                              onClick={() => void markInvoicePaid(source)}
                              disabled={markingPaidDocumentId === source.document?.id}
                              className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                                isDark ? 'text-emerald-200 hover:bg-emerald-500/10' : 'text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {markingPaidDocumentId === source.document?.id ? ti('markingPaid') : ti('markPaid')}
                            </button>
                          )}
                          {canVoidInvoice && (
                            <button
                              type="button"
                              onClick={() => void voidInvoice(source)}
                              disabled={voidingDocumentId === source.document?.id}
                              className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                                isDark ? 'text-red-300 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
                              }`}
                            >
                              <Ban className="h-3.5 w-3.5" />
                              {voidingDocumentId === source.document?.id ? ti('voidingInvoice') : ti('voidInvoice')}
                            </button>
                          )}
                          {deletable && (
                          <button
                            type="button"
                            onClick={() => void deleteInvoiceDocument(source)}
                            disabled={deleting}
                            className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                              isDark ? 'text-red-300 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
                            }`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {deleting ? ti('deleting') : ti('deleteDocument')}
                          </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section
          ref={documentShellRef}
          className={`rounded-lg border transition-colors ${
            importDragActive
              ? isDark ? 'border-blue-400 bg-blue-500/10 text-white' : 'border-blue-300 bg-blue-50 text-[#1D1D1F]'
              : panelClass
          } self-start`}
          onDragEnter={(event) => {
            event.preventDefault();
            setImportDragActive(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setImportDragActive(true);
          }}
          onDragLeave={(event) => {
            if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
            setImportDragActive(false);
          }}
          onDrop={(event) => void handleDocumentWorkspaceDrop(event)}
          onPaste={(event) => void handleDocumentWorkspacePaste(event)}
        >
          <div className="border-b border-inherit p-4">
            <div className="grid gap-2 lg:grid-cols-[auto_1fr_auto] lg:items-center">
              <div
                role="radiogroup"
                aria-label={ti('dominantLanguage')}
                className={`grid h-7 w-fit grid-cols-2 rounded-md border p-0.5 ${
                  isDark ? 'border-white/10 bg-transparent' : 'border-[#D2D2D7] bg-transparent'
                }`}
              >
                {(['fi', 'en'] as const).map((dominantLanguage) => (
                  <button
                    key={dominantLanguage}
                    type="button"
                    role="radio"
                    aria-checked={draft.language === dominantLanguage}
                    onClick={() => setDraft((current) => ({ ...current, language: dominantLanguage }))}
                    className={`min-w-[42px] rounded px-2 text-xs font-medium transition-colors ${
                      draft.language === dominantLanguage
                        ? isDark ? 'bg-white/12 text-white' : 'bg-[#1D1D1F] text-white'
                        : isDark ? 'text-gray-500 hover:text-gray-200' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                    }`}
                  >
                    {dominantLanguage.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="min-w-0 text-left lg:text-center">
                <h2 className="text-lg font-semibold">{workspaceDocumentLabel}</h2>
                {selectedSource?.sourceId ? (
                  <p className={`mt-1 truncate font-mono text-xs ${mutedClass}`}>{selectedSource.sourceId}</p>
                ) : null}
                {selectedSource?.document?.document_type === 'invoice' && (
                  <div className="mt-2 flex flex-wrap justify-start gap-1 lg:justify-center">
                    <Badge isDark={isDark} size="sm" tone={selectedSource.document.status === 'paid' ? 'success' : 'warning'}>
                      {selectedSource.document.status}
                    </Badge>
                    <Badge isDark={isDark} size="sm" tone={paymentLinkStatus === 'paid' ? 'success' : selectedPaymentLink ? 'warning' : 'gray'}>
                      {paymentLinkStatus ? `${ti('paymentLink')}: ${paymentLinkStatus}` : ti('noPaymentLink')}
                    </Badge>
                    {selectedPaymentLink?.payment_link_expires_at && (
                      <Badge isDark={isDark} size="sm" tone="gray">
                        {ti('expires')}: {formatDate(selectedPaymentLink.payment_link_expires_at)}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <div className="hidden h-7 w-[91px] lg:block" aria-hidden="true" />
            </div>
          </div>

          <div className="border-b border-inherit p-4">
            <DraftReceiptDetailsPanel
              imported={importedReceiptData}
              draft={draft}
              isDark={isDark}
              mutedClass={mutedClass}
              onDraftChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
            />
          </div>

          <div className="grid gap-4 p-4 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">{ti('customer')}</h3>
              {draft.documentType !== 'invoice' && (
                <button
                  type="button"
                  onClick={() => setShowCustomerInvoiceDetails((current) => !current)}
                  className={`inline-flex h-8 w-fit items-center rounded-md px-2 text-xs font-medium transition-colors ${
                    isDark ? 'text-gray-300 hover:bg-white/10' : 'text-[#475569] hover:bg-[#F5F5F7]'
                  }`}
                >
                  {customerInvoiceDetailsVisible ? ti('hideInvoiceDetails') : ti('addInvoiceDetails')}
                </button>
              )}

              {customerInvoiceDetailsVisible && (
                <div className={`space-y-3 rounded-md border p-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-[#D2D2D7] bg-[#F5F5F7]'}`}>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input isDark={isDark} label={ti('businessId')} value={draft.customerBusinessId} onChange={(value) => setDraft((current) => ({ ...current, customerBusinessId: String(value) }))} size="sm" />
                    <Input isDark={isDark} label={ti('vatId')} value={draft.customerVatId} onChange={(value) => setDraft((current) => ({ ...current, customerVatId: String(value) }))} size="sm" />
                  </div>
                  <Input isDark={isDark} label={ti('address')} value={draft.customerAddressLine1} onChange={(value) => setDraft((current) => ({ ...current, customerAddressLine1: String(value) }))} size="sm" />
                  <Input isDark={isDark} label={ti('address2')} value={draft.customerAddressLine2} onChange={(value) => setDraft((current) => ({ ...current, customerAddressLine2: String(value) }))} size="sm" />
                  <div className="grid gap-2 sm:grid-cols-[120px_1fr]">
                    <Input isDark={isDark} label={ti('postalCode')} value={draft.customerPostalCode} onChange={(value) => setDraft((current) => ({ ...current, customerPostalCode: String(value) }))} size="sm" />
                    <Input isDark={isDark} label={ti('city')} value={draft.customerCity} onChange={(value) => setDraft((current) => ({ ...current, customerCity: String(value) }))} size="sm" />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">{ti('paymentAndSource')}</h3>
              {draft.documentType === 'invoice' && (
                <label className={`flex items-start gap-3 rounded-md border px-3 py-2 text-sm ${isDark ? 'border-white/10 bg-white/5' : 'border-[#D2D2D7] bg-[#F5F5F7]'}`}>
                  <input
                    type="checkbox"
                    checked={draft.payOnline}
                    onChange={(event) => setDraft((current) => ({ ...current, payOnline: event.target.checked }))}
                    className="mt-1 h-4 w-4 accent-[#F97316]"
                  />
                  <span>
                    <span className="block font-medium">{ti('payOnline')}</span>
                    <span className={`mt-0.5 block text-xs ${mutedClass}`}>{ti('payOnlineHint')}</span>
                  </span>
                </label>
              )}
              <Select isDark={isDark} label={ti('paymentProvider')} value={draft.paymentProvider} onChange={(value) => setDraft((current) => ({ ...current, paymentProvider: String(value) }))}>
                {paymentProviderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="border-t border-inherit p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{ti('lineItems')}</h3>
              <Button isDark={isDark} size="sm" color="secondary" onClick={() => setDraft((current) => ({ ...current, lines: [...current.lines, emptyLine()] }))}>
                {ti('addLine')}
              </Button>
            </div>

            <div className="space-y-2">
              {draft.lines.map((line) => (
                <div key={line.id} className={`grid gap-2 rounded-md border p-2 lg:grid-cols-[minmax(260px,1fr)_76px_76px_110px_76px_36px] ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-[#E5E7EB] bg-white'}`}>
                  <TextArea
                    isDark={isDark}
                    aria-label={ti('description')}
                    value={line.description}
                    onChange={(value) => updateLine(line.id, {
                      description: String(value),
                      descriptionFi: draft.language === 'fi' ? String(value) : line.descriptionFi,
                      descriptionEn: draft.language === 'en' ? String(value) : line.descriptionEn,
                    })}
                    placeholder={ti('description')}
                    rows={2}
                    textAreaClassName="min-h-[68px] resize-y"
                  />
                  <Input isDark={isDark} aria-label={ti('quantity')} value={line.quantity} onChange={(value) => updateLine(line.id, { quantity: String(value) })} placeholder={ti('quantity')} size="sm" />
                  <Input isDark={isDark} aria-label={ti('unitLabel')} value={line.unitLabel} onChange={(value) => updateLine(line.id, { unitLabel: String(value), unitLabelEn: translatedUnitLabel(value) })} placeholder={ti('unitLabel')} size="sm" />
                  <Input isDark={isDark} aria-label={ti('unitGross')} value={line.unitGross} onChange={(value) => updateLine(line.id, { unitGross: String(value) })} placeholder={ti('unitGross')} size="sm" />
                  <Input isDark={isDark} aria-label={ti('vatRate')} value={line.vatRate} onChange={(value) => updateLine(line.id, { vatRate: String(value) })} placeholder={ti('vatRate')} size="sm" />
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    className={`flex h-10 w-9 items-center justify-center rounded-md transition-colors ${
                      isDark ? 'text-gray-400 hover:bg-white/10 hover:text-red-300' : 'text-[#6E6E73] hover:bg-red-50 hover:text-red-600'
                    }`}
                    aria-label={ti('remove')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className={`mt-4 rounded-md border p-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-[#D2D2D7] bg-[#F5F5F7]'}`}>
              <div className="grid gap-2 text-sm sm:grid-cols-3">
                <div>
                  <div className={mutedClass}>{ti('netSubtotal')}</div>
                  <div className="font-mono font-semibold">{centsToMoney(totals.subtotalCents)}</div>
                </div>
                <div>
                  <div className={mutedClass}>{ti('vat')}</div>
                  <div className="font-mono font-semibold">{centsToMoney(totals.vatCents)}</div>
                </div>
                <div>
                  <div className={mutedClass}>{ti('total')}</div>
                  <div className="font-mono text-lg font-semibold text-[#F97316]">{centsToMoney(totals.totalCents)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-inherit p-4">
            {importMessage && (
              <div className={`rounded-md border px-3 py-2 text-xs ${isDark ? 'border-blue-400/30 bg-blue-500/10 text-blue-100' : 'border-blue-200 bg-blue-50 text-blue-800'}`}>
                {importMessage}
              </div>
            )}
            <TextArea
              isDark={isDark}
              label={ti('internalNotes')}
              value={draft.notes}
              onChange={(value) => setDraft((current) => ({ ...current, notes: String(value) }))}
              rows={3}
              textAreaClassName="min-h-[76px]"
              placeholder={ti('internalNotesPlaceholder')}
            />
            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <label className={`inline-flex h-9 w-fit cursor-pointer items-center justify-center gap-2 rounded-md border border-blue-600 bg-blue-600 px-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 ${importingDocument ? 'cursor-not-allowed opacity-60' : ''}`}>
                <Upload className="h-4 w-4" />
                {importingDocument ? ti('importingDocument') : ti('uploadDoc')}
                <input
                  className="hidden"
                  type="file"
                  accept="application/pdf"
                  disabled={importingDocument}
                  onChange={(event) => {
                    const files = event.target.files;
                    if (files) void importDocumentFiles(files);
                    event.currentTarget.value = '';
                  }}
                />
              </label>

              <div className="flex flex-wrap justify-end gap-2">
                <Button isDark={isDark} size="sm" color="secondary" onClick={() => void runDocumentAction('preview')}>{ti('previewPdf')}</Button>
                {selectedSource?.document?.document_type === 'invoice' && !['paid', 'credited', 'void', 'cancelled'].includes(selectedSource.document.status) && (
                  <Button
                    isDark={isDark}
                    size="sm"
                    color="secondary"
                    iconLeading={<RefreshCcw className="h-4 w-4" />}
                    onClick={() => void sendInvoiceReminder()}
                    isLoading={sendingReminderDocumentId === selectedSource.document.id}
                    isDisabled={!selectedSource.customerEmail}
                  >
                    {ti('sendReminder')}
                  </Button>
                )}
                {selectedSource?.document?.document_type === 'invoice' && !['paid', 'credited', 'void', 'cancelled'].includes(selectedSource.document.status) && (
                  <Button
                    isDark={isDark}
                    size="sm"
                    color="secondary"
                    iconLeading={<Copy className="h-4 w-4" />}
                    onClick={() => void copyInvoicePaymentLink()}
                    isLoading={copyingPaymentLinkId === selectedSource.document.id}
                  >
                    {ti('copyPaymentLink')}
                  </Button>
                )}
                {selectedSource?.document?.document_type === 'invoice' && !['paid', 'credited', 'void', 'cancelled'].includes(selectedSource.document.status) && (
                  <Button
                    isDark={isDark}
                    size="sm"
                    color="secondary"
                    iconLeading={<CheckCircle2 className="h-4 w-4" />}
                    onClick={() => void markInvoicePaid()}
                    isLoading={markingPaidDocumentId === selectedSource.document.id}
                  >
                    {ti('markPaid')}
                  </Button>
                )}
                {selectedSource?.document?.document_type === 'invoice' && !['paid', 'credited', 'void', 'cancelled'].includes(selectedSource.document.status) && (
                  <Button
                    isDark={isDark}
                    size="sm"
                    color="secondary"
                    iconLeading={<Ban className="h-4 w-4" />}
                    onClick={() => void voidInvoice()}
                    isLoading={voidingDocumentId === selectedSource.document.id}
                  >
                    {ti('voidInvoice')}
                  </Button>
                )}
                <Button isDark={isDark} size="sm" color="secondary" onClick={() => void runDocumentAction('send')} isDisabled={draftValidation.errors.length > 0}>{ti('sendReceipt')}</Button>
                <Button isDark={isDark} size="sm" color="secondary" onClick={() => void runDocumentAction('issue')} isDisabled={draftValidation.errors.length > 0}>{ti('issuePdf')}</Button>
                <Button isDark={isDark} size="sm" color="primary" iconLeading={<Save className="h-4 w-4" />} onClick={() => void saveDraft()} isLoading={saving}>
                  {ti('saveDraft')}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {templateOpen && (
        <InvoiceTemplateModal
          isDark={isDark}
          mutedClass={mutedClass}
          panelClass={panelClass}
          templateDraft={templateDraft}
          templateLoading={templateLoading}
          templateSaving={templateSaving}
          t={ti}
          onClose={() => setTemplateOpen(false)}
          onSave={() => void saveTemplateSettings()}
          onTemplateDraftChange={setTemplateDraft}
        />
      )}

      {previewUrl && (
        <InvoicePreviewModal
          isDark={isDark}
          mutedClass={mutedClass}
          panelClass={panelClass}
          previewUrl={previewUrl}
          t={ti}
          onClose={() => setPreviewUrl(null)}
        />
      )}
    </div>
  );
}
