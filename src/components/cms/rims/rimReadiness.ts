import type { RimRow } from './types';

export type RimReadinessState = 'ready' | 'missing_required' | 'blocked' | 'hidden' | 'conflict';

export type RimWarningKey =
  | 'mounting_specs'
  | 'image'
  | 'price'
  | 'stock'
  | 'pcd'
  | 'et_cb'
  | 'ean'
  | 'material_finish';

function reasonSet(rim: RimRow) {
  return new Set((rim.readiness_reasons ?? []).filter(Boolean));
}

function hasReason(rim: RimRow, reason: string) {
  return rim.primary_readiness_reason === reason || reasonSet(rim).has(reason);
}

function hasPrice(rim: RimRow) {
  const price = rim.price_eur ?? rim.final_price_eur ?? rim.price;
  return typeof price === 'number' && Number.isFinite(price) && price > 0;
}

function hasStock(rim: RimRow) {
  const stock = rim.stock_qty;
  return rim.in_stock === true && typeof stock === 'number' && Number.isFinite(stock) && stock > 0;
}

function normalizedPcd(value: string | null | undefined) {
  return String(value ?? '')
    .trim()
    .replace(/[×*]/g, 'x')
    .replace(/\s+/g, '')
    .toLowerCase();
}

function hasValidPcd(value: string | null | undefined) {
  const pcd = normalizedPcd(value);
  return /^\d+x\d+(?:\.\d+)?$/.test(pcd);
}

function hasSuspectOffsetOrBore(rim: RimRow) {
  const et = rim.et_offset_mm;
  const cb = rim.center_bore_mm ?? rim.cb_mm;
  const hasSuspectEt = typeof et === 'number' && Number.isFinite(et) && (et < -100 || et > 100);
  const hasSuspectCb = typeof cb === 'number' && Number.isFinite(cb) && (cb <= 0 || cb > 200);
  return hasSuspectEt || hasSuspectCb;
}

export function getRimReadinessState(rim: RimRow): RimReadinessState {
  if (rim.cms_data?.is_hidden || rim.is_visible === false || hasReason(rim, 'cms_hidden')) return 'hidden';
  if (hasReason(rim, 'manual_not_sellable') || rim.publish_block_reason === 'manual_not_sellable' || rim.publish_status === 'blocked') {
    return 'blocked';
  }
  if (rim.conflict_status && rim.conflict_status !== 'resolved') return 'conflict';
  if (rim.product_ready === true) return 'ready';
  return 'missing_required';
}

export function getRimWarningKeys(rim: RimRow): RimWarningKey[] {
  const reasons = reasonSet(rim);
  const warnings: RimWarningKey[] = [];

  const missingMountingSpecs =
    reasons.has('missing_mounting_specs') ||
    rim.width_in === null ||
    rim.rim_diameter_in === null ||
    !rim.bolt_pattern ||
    rim.et_offset_mm === null ||
    (rim.center_bore_mm === null && rim.cb_mm === null);

  if (missingMountingSpecs) warnings.push('mounting_specs');
  if (rim.missing_supplier_image || reasons.has('missing_image')) warnings.push('image');
  if (rim.missing_supplier_price || reasons.has('missing_price') || !hasPrice(rim)) warnings.push('price');
  if (reasons.has('missing_stock') || !hasStock(rim)) warnings.push('stock');
  if (rim.bolt_pattern && !hasValidPcd(rim.bolt_pattern)) warnings.push('pcd');
  if (hasSuspectOffsetOrBore(rim)) warnings.push('et_cb');
  if (reasons.has('missing_ean') || !rim.ean) warnings.push('ean');
  if (!rim.material && !rim.finish) warnings.push('material_finish');

  return warnings;
}
