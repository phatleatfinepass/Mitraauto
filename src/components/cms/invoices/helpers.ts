import type {
  DocumentDraft,
  DraftLine,
  InvoiceSummaryRow,
  InvoiceTemplateRow,
  OrderRow,
  SourceRecord,
  SourceType,
  TemplateDraft,
} from './types';

export const emptyLine = (): DraftLine => ({
  id: crypto.randomUUID(),
  description: '',
  quantity: '1',
  unitGross: '0.00',
  vatRate: '25.5',
});

export const initialDraft = (): DocumentDraft => ({
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

export const initialTemplateDraft = (): TemplateDraft => ({
  id: null,
  displayName: 'Default',
  companyName: 'Mitra Auto Oy',
  businessId: '3408833-8',
  vatId: 'FI34088338',
  addressLine1: 'Hankasuontie 5',
  addressLine2: '00390 HELSINKI',
  countryCode: 'FI',
  email: 'contact@mitra-auto.fi',
  phone: '0407777163',
  iban: '',
  bic: '',
  paymentTerms: '',
  footerText: '',
});

export function templateDraftFromRow(row: InvoiceTemplateRow | null | undefined): TemplateDraft {
  if (!row) return initialTemplateDraft();

  return {
    id: row.id,
    displayName: row.display_name ?? 'Default',
    companyName: row.company_name ?? 'Mitra Auto Oy',
    businessId: row.business_id ?? '3408833-8',
    vatId: row.vat_id ?? 'FI34088338',
    addressLine1: row.address_line1 ?? 'Hankasuontie 5',
    addressLine2: row.address_line2 ?? '00390 HELSINKI',
    countryCode: row.country_code ?? 'FI',
    email: row.email ?? 'contact@mitra-auto.fi',
    phone: row.phone ?? '0407777163',
    iban: row.iban ?? '',
    bic: row.bic ?? '',
    paymentTerms: row.payment_terms ?? '',
    footerText: row.footer_text ?? '',
  };
}

export function centsToMoney(cents: number | null | undefined) {
  return `€${((cents ?? 0) / 100).toFixed(2)}`;
}

export function moneyToCents(value: string) {
  const normalized = value.replace(',', '.').replace(/[^\d.-]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

export function formatDate(value: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('fi-FI', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getOrderCustomerName(order: OrderRow) {
  const snapshot = order.cart_snapshot ?? {};
  const fromSnapshot = [snapshot.customer?.firstName, snapshot.customer?.lastName].filter(Boolean).join(' ').trim();
  return fromSnapshot || snapshot.customer?.name || snapshot.billing?.name || snapshot.shipping?.name || 'Customer';
}

export function getOrderItems(order: OrderRow) {
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

export function getOrderTitle(order: OrderRow) {
  const items = getOrderItems(order);
  const first = items[0] ?? {};
  const product = first.product ?? first;
  const title = [product.brand, product.model].filter(Boolean).join(' ').trim() || product.name || product.title;
  if (title && items.length > 1) return `${title} + ${items.length - 1} more`;
  return title || 'Webshop order';
}

export function sourceKey(type: SourceType, id: string | null) {
  return `${type}:${id ?? 'new'}`;
}

export function documentSourceKey(document: InvoiceSummaryRow) {
  if (document.source_type === 'order') return sourceKey('order', document.order_id);
  if (document.source_type === 'booking') return sourceKey('booking', document.booking_id);
  return `document:${document.id}`;
}

export function calculateDraftTotals(lines: DraftLine[]) {
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

export function calculateDraftLine(line: DraftLine) {
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

export function documentStatus(source: SourceRecord) {
  return source.document?.status ?? null;
}

export function documentNumber(source: SourceRecord) {
  return source.document?.document_number ?? null;
}

export function documentTone(status: string | null) {
  if (status === 'sent' || status === 'paid' || status === 'issued') return 'success';
  if (status === 'draft' || status === 'partially_paid') return 'warning';
  return 'gray';
}

export function invoiceRequiresFullDetails(draft: DocumentDraft) {
  return draft.documentType === 'invoice' || Boolean(draft.customerBusinessId || draft.customerVatId);
}

export function validateInvoiceDraft(draft: DocumentDraft, totals: ReturnType<typeof calculateDraftTotals>) {
  const errors: string[] = [];
  const fullRequired = invoiceRequiresFullDetails(draft);
  if (fullRequired && !draft.customerName.trim()) errors.push('Customer name is required for full invoice.');
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

export function parsePastedInvoiceText(text: string) {
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
