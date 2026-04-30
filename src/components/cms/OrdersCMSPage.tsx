import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../ThemeContext';
import { useLanguage } from '../LanguageContext';
import { supabase } from '../../utils/supabase/client';
import { AlertCircle, Banknote, CheckCircle2, ChevronRight, CreditCard, Globe, Mail, Package, Phone, RefreshCcw, RotateCcw, Search, Send, Truck, XCircle } from 'lucide-react';
import { calculateLinePricing, getPricingRulesFromSpecOverrides, type ProductPricingRules } from '../../utils/pricing';

interface OrderRow {
  id: string;
  created_at: string | null;
  status: string | null;
  paytrail_status: string | null;
  paytrail_transaction_id: string | null;
  paytrail_reference: string | null;
  email?: string | null;
  phone?: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_first_name: string | null;
  customer_last_name: string | null;
  grand_total_cents: number | null;
  cart_snapshot: any;
}

type StatusFilter = 'all' | 'receive' | 'sent' | 'ready' | 'delivered' | 'cancelled' | 'returned' | 'done';

const PAGE_SIZE = 50;
const ORDER_MARK_STATUSES = [
  'receive',
  'sent',
  'ready',
  'delivered',
  'cancelled',
  'returned',
  'done',
] as const;
type OrderMarkStatus = (typeof ORDER_MARK_STATUSES)[number];
type PaymentMethod = 'card' | 'cash' | 'paytrail';
type PaymentResult = 'purchased' | 'pending' | 'fail';
type PaymentInfo = { method: PaymentMethod; result: PaymentResult };
type OrderCreateForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  itemName: string;
  itemEan: string;
  variantId: string | null;
  qty: string;
  unitPriceEur: string;
  baseUnitPriceEur: number | null;
  pricingRules: ProductPricingRules | null;
  unitPriceManuallyEdited: boolean;
  vatPercent: string;
  paymentMethod: PaymentMethod;
  status: OrderMarkStatus;
};

const DB_STATUS_CANDIDATES: Record<OrderMarkStatus, string[]> = {
  receive: ['pending', 'received'],
  sent: ['shipped', 'in_transit', 'processing'],
  ready: ['ready_for_pickup', 'arrived', 'processing'],
  delivered: ['delivered'],
  cancelled: ['cancelled', 'canceled'],
  returned: ['returned'],
  done: ['done', 'completed'],
};

interface SelectedOrderModalProps {
  formatCustomerName: (order: OrderRow) => string;
  formatDate: (value: string | null) => string;
  formatMoney: (cents: number | null) => string;
  formatStatusLabel: (value: string | null | undefined) => string;
  getCustomerEmail: (order: OrderRow) => string;
  getCustomerPhone: (order: OrderRow) => string;
  getDisplayStatus: (order: OrderRow) => OrderMarkStatus;
  getItemEan: (item: any) => string | null;
  getItemSku: (item: any) => string | null;
  getItemTitle: (item: any) => string;
  getPaymentInfo: (order: OrderRow) => PaymentInfo;
  getStatusBadgeClass: (status: string) => string;
  getStatusMeta: (status: string) => { icon: React.ComponentType<{ className?: string }>; tone: 'gray' | 'purple' | 'green' | 'blue' | 'red' | 'orange' };
  isDark: boolean;
  language: string;
  markOrderStatus: (orderId: string, nextStatus: OrderMarkStatus) => void;
  order: OrderRow | null;
  orderMarkStatuses: readonly OrderMarkStatus[];
  orderTotals: { subtotalCents: number | null; vatCents: number | null; totalCents: number | null; vatPercent: number | null } | null;
  selectedItems: any[];
  updatingStatusId: string | null;
  onClose: () => void;
}

function SelectedOrderModal({
  formatCustomerName,
  formatDate,
  formatMoney,
  formatStatusLabel,
  getCustomerEmail,
  getCustomerPhone,
  getDisplayStatus,
  getItemEan,
  getItemSku,
  getItemTitle,
  getPaymentInfo,
  getStatusBadgeClass,
  getStatusMeta,
  isDark,
  language,
  markOrderStatus,
  order,
  orderMarkStatuses,
  orderTotals,
  selectedItems,
  updatingStatusId,
  onClose,
}: SelectedOrderModalProps) {
  if (!order) return null;

  const payment = getPaymentInfo(order);
  const paymentBadgeClass =
    payment.result === 'purchased'
      ? isDark ? 'border-green-500/30 bg-green-500/20 text-green-300' : 'border-green-300 bg-green-100 text-green-700'
      : payment.result === 'pending'
        ? isDark ? 'border-amber-500/30 bg-amber-500/20 text-amber-300' : 'border-amber-300 bg-amber-100 text-amber-700'
        : isDark ? 'border-red-500/30 bg-red-500/20 text-red-300' : 'border-red-300 bg-red-100 text-red-700';
  const paymentMethodLabel = payment.method === 'paytrail' ? 'Paytrail' : payment.method === 'card' ? 'Card' : 'Cash';
  const paymentResultLabel =
    payment.result === 'purchased'
      ? language === 'fi' ? 'Maksettu' : 'Purchased'
      : payment.result === 'pending'
        ? language === 'fi' ? 'Odottaa' : 'Pending'
        : language === 'fi' ? 'Epäonnistui' : 'Fail';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        aria-label="Close modal overlay"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />
      <div className={`relative z-[101] max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border p-5 ${
        isDark ? 'border-white/10 bg-[#161A22]' : 'border-gray-200 bg-white'
      }`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className={`text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fi' ? 'Tilauksen tiedot' : 'Order details'}
          </h2>
          <button
            onClick={onClose}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-300 text-gray-900 hover:bg-gray-100'
            }`}
          >
            {language === 'fi' ? 'Sulje' : 'Close'}
          </button>
        </div>

        <div className={`mb-5 grid grid-cols-1 gap-3 text-sm md:grid-cols-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          <div className={`rounded-lg border p-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
            <p><strong>ID:</strong> {order.id}</p>
            <p><strong>{language === 'fi' ? 'Päivä' : 'Date'}:</strong> {formatDate(order.created_at)}</p>
            <p className="mt-1">
              <strong>{language === 'fi' ? 'Maksun tila' : 'Payment status'}:</strong>{' '}
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${paymentBadgeClass}`}>
                {paymentMethodLabel} · {paymentResultLabel}
              </span>
            </p>
            <p><strong>{language === 'fi' ? 'Välisumma' : 'Subtotal'}:</strong> {formatMoney(orderTotals?.subtotalCents ?? null)}</p>
            <p>
              <strong>{language === 'fi' ? 'ALV' : 'VAT'} ({orderTotals?.vatPercent !== null && orderTotals?.vatPercent !== undefined ? orderTotals.vatPercent.toFixed(1) : '-' }%):</strong>{' '}
              {formatMoney(orderTotals?.vatCents ?? null)}
            </p>
            <p><strong>{language === 'fi' ? 'Yhteensä' : 'Total'}:</strong> {formatMoney(orderTotals?.totalCents ?? order.grand_total_cents)}</p>
          </div>
          <div className={`rounded-lg border p-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
            <p><strong>{language === 'fi' ? 'Asiakas' : 'Customer'}:</strong> {formatCustomerName(order)}</p>
            <p><strong>Email:</strong> {getCustomerEmail(order)}</p>
            <p><strong>{language === 'fi' ? 'Puhelin' : 'Phone'}:</strong> {getCustomerPhone(order)}</p>
          </div>
        </div>

        <div className={`mb-5 rounded-lg border p-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
          <p className={`mb-2 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fi' ? 'Päivitä toimituksen tila' : 'Update fulfillment status'}
          </p>
          <div className="flex flex-wrap gap-2">
            {orderMarkStatuses.map((status) => {
              const active = getDisplayStatus(order) === status;
              return (
                <button
                  key={`modal-${order.id}-${status}`}
                  onClick={() => markOrderStatus(order.id, status)}
                  disabled={updatingStatusId === order.id}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${
                    active
                      ? getStatusBadgeClass(status)
                      : (isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-300 text-gray-900 hover:bg-gray-100')
                  }`}
                >
                  {formatStatusLabel(status)}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className={`mb-3 text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fi' ? 'Tilatut tuotteet' : 'Ordered items'}
          </h3>
          {selectedItems.length === 0 ? (
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>-</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {selectedItems.map((item: any, index: number) => {
                const qty = Number(item?.qty ?? item?.quantity ?? 1);
                const unitCents = Number(item?.client_unit_price_cents ?? Math.round(Number(item?.price ?? 0) * 100));
                const lineTotal = (unitCents * qty) / 100;
                const ean = getItemEan(item);
                const sku = getItemSku(item);
                const size = item?.size ?? item?.size_string ?? item?.dimension ?? item?.product?.size_string ?? '';
                const title = getItemTitle(item);

                return (
                  <div
                    key={`${order.id}-item-${index}`}
                    className={`rounded-lg border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}
                  >
                    <p className={`mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</p>
                    <div className={`space-y-1 text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <p><strong>EAN:</strong> {ean || '-'}</p>
                      <p><strong>SKU:</strong> {sku || '-'}</p>
                      <p><strong>{language === 'fi' ? 'Koko' : 'Size'}:</strong> {size || '-'}</p>
                      <p><strong>{language === 'fi' ? 'Määrä' : 'Qty'}:</strong> {qty}</p>
                      <p><strong>{language === 'fi' ? 'Yksikköhinta' : 'Unit price'}:</strong> EUR {(unitCents / 100).toFixed(2)}</p>
                      <p><strong>{language === 'fi' ? 'Rivin summa' : 'Line total'}:</strong> EUR {lineTotal.toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface CreateOrderModalProps {
  createForm: OrderCreateForm;
  createOrderError: string | null;
  creatingOrder: boolean;
  eanLookupLoading: boolean;
  eanLookupMessage: string | null;
  handleCreateOrder: () => void;
  isDark: boolean;
  language: string;
  lookupItemByEan: (eanRaw: string) => Promise<void>;
  open: boolean;
  setCreateForm: React.Dispatch<React.SetStateAction<OrderCreateForm>>;
  setCreateOrderOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEanLookupMessage: React.Dispatch<React.SetStateAction<string | null>>;
}

function CreateOrderModal({
  createForm,
  createOrderError,
  creatingOrder,
  eanLookupLoading,
  eanLookupMessage,
  handleCreateOrder,
  isDark,
  language,
  lookupItemByEan,
  open,
  setCreateForm,
  setCreateOrderOpen,
  setEanLookupMessage,
}: CreateOrderModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        aria-label="Close create order modal"
        onClick={() => setCreateOrderOpen(false)}
        className="absolute inset-0 bg-black/60"
      />
      <div className={`relative z-[111] w-full max-w-2xl rounded-2xl border p-5 ${
        isDark ? 'border-white/10 bg-[#161A22]' : 'border-gray-200 bg-white'
      }`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className={`text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fi' ? 'Luo tilaus' : 'Create order'}
          </h2>
          <button
            onClick={() => setCreateOrderOpen(false)}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-300 text-gray-900 hover:bg-gray-100'
            }`}
          >
            {language === 'fi' ? 'Sulje' : 'Close'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            type="text"
            placeholder={language === 'fi' ? 'Etunimi' : 'First name'}
            value={createForm.firstName}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, firstName: e.target.value }))}
            className={`rounded-lg border px-3 py-2 ${isDark ? 'border-white/20 bg-[#1C1C1E] text-white' : 'border-gray-300 bg-white text-gray-900'}`}
          />
          <input
            type="text"
            placeholder={language === 'fi' ? 'Sukunimi' : 'Last name'}
            value={createForm.lastName}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, lastName: e.target.value }))}
            className={`rounded-lg border px-3 py-2 ${isDark ? 'border-white/20 bg-[#1C1C1E] text-white' : 'border-gray-300 bg-white text-gray-900'}`}
          />
          <input
            type="email"
            placeholder="Email"
            value={createForm.email}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
            className={`rounded-lg border px-3 py-2 ${isDark ? 'border-white/20 bg-[#1C1C1E] text-white' : 'border-gray-300 bg-white text-gray-900'}`}
          />
          <input
            type="text"
            placeholder={language === 'fi' ? 'Puhelin' : 'Phone'}
            value={createForm.phone}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, phone: e.target.value }))}
            className={`rounded-lg border px-3 py-2 ${isDark ? 'border-white/20 bg-[#1C1C1E] text-white' : 'border-gray-300 bg-white text-gray-900'}`}
          />
          <input
            type="text"
            placeholder={language === 'fi' ? 'Tuotteen nimi' : 'Item name'}
            value={createForm.itemName}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, itemName: e.target.value }))}
            className={`rounded-lg border px-3 py-2 ${isDark ? 'border-white/20 bg-[#1C1C1E] text-white' : 'border-gray-300 bg-white text-gray-900'}`}
          />
          <input
            type="text"
            placeholder="EAN"
            value={createForm.itemEan}
            onChange={(e) => {
              const value = e.target.value;
              setCreateForm((prev) => ({
                ...prev,
                itemEan: value,
                variantId: null,
                baseUnitPriceEur: null,
                pricingRules: null,
              }));
              if (eanLookupMessage) setEanLookupMessage(null);
            }}
            onBlur={() => void lookupItemByEan(createForm.itemEan)}
            className={`rounded-lg border px-3 py-2 ${isDark ? 'border-white/20 bg-[#1C1C1E] text-white' : 'border-gray-300 bg-white text-gray-900'}`}
          />
          <input
            type="number"
            min={1}
            placeholder={language === 'fi' ? 'Määrä' : 'Qty'}
            value={createForm.qty}
            onChange={(e) => {
              const value = e.target.value;
              setCreateForm((prev) => {
                const nextQty = Math.max(1, Number.parseInt(value, 10) || 1);
                const next: OrderCreateForm = { ...prev, qty: value };

                if (!prev.unitPriceManuallyEdited && prev.baseUnitPriceEur !== null) {
                  const autoPricing = calculateLinePricing(
                    prev.baseUnitPriceEur,
                    nextQty,
                    prev.pricingRules,
                  );
                  next.unitPriceEur = autoPricing.effectiveUnitPriceEur.toFixed(2);
                }

                return next;
              });
            }}
            className={`rounded-lg border px-3 py-2 ${isDark ? 'border-white/20 bg-[#1C1C1E] text-white' : 'border-gray-300 bg-white text-gray-900'}`}
          />
          <input
            type="number"
            min={0}
            step="0.01"
            placeholder={language === 'fi' ? 'Yksikköhinta EUR' : 'Unit price EUR'}
            value={createForm.unitPriceEur}
            onChange={(e) => setCreateForm((prev) => ({
              ...prev,
              unitPriceEur: e.target.value,
              unitPriceManuallyEdited: true,
            }))}
            className={`rounded-lg border px-3 py-2 ${isDark ? 'border-white/20 bg-[#1C1C1E] text-white' : 'border-gray-300 bg-white text-gray-900'}`}
          />
          <input
            type="number"
            min={0}
            max={100}
            step="0.1"
            placeholder={language === 'fi' ? 'ALV %' : 'VAT %'}
            value={createForm.vatPercent}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, vatPercent: e.target.value }))}
            className={`rounded-lg border px-3 py-2 ${isDark ? 'border-white/20 bg-[#1C1C1E] text-white' : 'border-gray-300 bg-white text-gray-900'}`}
          />
          <select
            value={createForm.paymentMethod}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, paymentMethod: e.target.value as PaymentMethod }))}
            className={`rounded-lg border px-3 py-2 ${isDark ? 'border-white/20 bg-[#1C1C1E] text-white' : 'border-gray-300 bg-white text-gray-900'}`}
          >
            <option value="cash">{language === 'fi' ? 'Käteinen' : 'Cash'}</option>
            <option value="card">{language === 'fi' ? 'Kortti' : 'Card'}</option>
          </select>
          <select
            value={createForm.status}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, status: e.target.value as OrderMarkStatus }))}
            className={`rounded-lg border px-3 py-2 md:col-span-2 ${isDark ? 'border-white/20 bg-[#1C1C1E] text-white' : 'border-gray-300 bg-white text-gray-900'}`}
          >
            {ORDER_MARK_STATUSES.map((status) => (
              <option key={`create-${status}`} value={status}>{status.charAt(0).toUpperCase() + status.slice(1).replaceAll('_', ' ')}</option>
            ))}
          </select>
        </div>

        <div className={`mt-3 rounded-lg border p-3 text-sm ${isDark ? 'border-white/10 bg-white/5 text-gray-200' : 'border-gray-200 bg-gray-50 text-gray-700'}`}>
          {(() => {
            const qty = Math.max(1, Number.parseInt(createForm.qty, 10) || 1);
            const unit = Number.parseFloat(createForm.unitPriceEur || '0');
            const vatPercent = Number.parseFloat(createForm.vatPercent || '0');
            const baseUnit = createForm.baseUnitPriceEur ?? (Number.isFinite(unit) ? unit : 0);
            const autoPricing = calculateLinePricing(baseUnit, qty, createForm.pricingRules);
            const usingAutoPricing = !createForm.unitPriceManuallyEdited && createForm.baseUnitPriceEur !== null;
            const subtotal = Number.isFinite(unit) ? unit * qty : 0;
            const vat = Number.isFinite(vatPercent) ? subtotal * (vatPercent / 100) : 0;
            const total = subtotal + vat;

            return (
              <>
                {usingAutoPricing && autoPricing.savingsEur > 0 && (
                  <p>
                    <strong>{language === 'fi' ? 'Pakettialennus' : 'Bundle discount'}:</strong>{' '}
                    EUR {autoPricing.savingsEur.toFixed(2)}
                  </p>
                )}
                <p><strong>{language === 'fi' ? 'Välisumma' : 'Subtotal'}:</strong> EUR {subtotal.toFixed(2)}</p>
                <p><strong>{language === 'fi' ? 'ALV' : 'VAT'} ({Number.isFinite(vatPercent) ? vatPercent.toFixed(1) : '0.0'}%):</strong> EUR {vat.toFixed(2)}</p>
                <p><strong>{language === 'fi' ? 'Kokonaissumma' : 'Total'}:</strong> EUR {total.toFixed(2)}</p>
              </>
            );
          })()}
          {eanLookupLoading && (
            <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'fi' ? 'Haetaan EAN-tuotetta...' : 'Looking up EAN item...'}
            </p>
          )}
          {eanLookupMessage && (
            <p className={`mt-1 text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{eanLookupMessage}</p>
          )}
        </div>

        {createOrderError && (
          <p className={`mt-3 text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>{createOrderError}</p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => setCreateOrderOpen(false)}
            disabled={creatingOrder}
            className={`rounded-lg border px-4 py-2 text-sm ${
              isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-300 text-gray-900 hover:bg-gray-100'
            }`}
          >
            {language === 'fi' ? 'Peruuta' : 'Cancel'}
          </button>
          <button
            onClick={handleCreateOrder}
            disabled={creatingOrder}
            className={`rounded-lg px-4 py-2 text-sm ${
              isDark ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {creatingOrder
              ? (language === 'fi' ? 'Luodaan...' : 'Creating...')
              : (language === 'fi' ? 'Luo tilaus' : 'Create order')}
          </button>
        </div>
      </div>
    </div>
  );
}

interface OrdersToolbarProps {
  fetchOrders: () => void;
  isDark: boolean;
  language: string;
  purchasedOnly: boolean;
  resetCreateForm: () => void;
  searchTerm: string;
  setCreateOrderOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setPurchasedOnly: React.Dispatch<React.SetStateAction<boolean>>;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  setStatusFilter: React.Dispatch<React.SetStateAction<StatusFilter>>;
  statusFilter: StatusFilter;
}

function OrdersToolbar({
  fetchOrders,
  isDark,
  language,
  purchasedOnly,
  resetCreateForm,
  searchTerm,
  setCreateOrderOpen,
  setPurchasedOnly,
  setSearchTerm,
  setStatusFilter,
  statusFilter,
}: OrdersToolbarProps) {
  return (
    <div className={`border-b ${isDark ? 'bg-[#161A22] border-white/10' : 'bg-white border-gray-200'} px-8 py-4`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="text"
            placeholder={language === 'fi' ? 'Hae tilausta, sähköpostia tai puhelinta...' : 'Search order, email, or phone...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full rounded-lg border py-2 pl-10 pr-4 ${
              isDark
                ? 'border-white/20 bg-[#1C1C1E] text-white placeholder-gray-500'
                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className={`rounded-lg border px-3 py-2 text-sm ${
              isDark ? 'border-white/20 bg-[#1C1C1E] text-white' : 'border-gray-300 bg-white text-gray-900'
            }`}
          >
            <option value="all">{language === 'fi' ? 'Kaikki tilat' : 'All statuses'}</option>
            <option value="receive">{language === 'fi' ? 'Vastaanotettu' : 'Receive'}</option>
            <option value="sent">{language === 'fi' ? 'Lähetetty' : 'Sent'}</option>
            <option value="ready">{language === 'fi' ? 'Valmis noudettavaksi' : 'Ready'}</option>
            <option value="delivered">{language === 'fi' ? 'Toimitettu' : 'Delivered'}</option>
            <option value="cancelled">{language === 'fi' ? 'Peruttu' : 'Cancelled'}</option>
            <option value="returned">{language === 'fi' ? 'Palautettu' : 'Returned'}</option>
            <option value="done">{language === 'fi' ? 'Valmis' : 'Done'}</option>
          </select>

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={purchasedOnly}
              onChange={(e) => setPurchasedOnly(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {language === 'fi' ? 'Näytä vain ostetut' : 'Show purchased only'}
            </span>
          </label>

          <button
            onClick={fetchOrders}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-300 text-gray-900 hover:bg-gray-100'
            }`}
          >
            <RefreshCcw className="h-4 w-4" />
            {language === 'fi' ? 'Päivitä' : 'Refresh'}
          </button>
          <button
            onClick={() => {
              resetCreateForm();
              setCreateOrderOpen(true);
            }}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              isDark ? 'border-green-500/40 text-green-300 hover:bg-green-500/15' : 'border-green-300 text-green-700 hover:bg-green-50'
            }`}
          >
            <Package className="h-4 w-4" />
            {language === 'fi' ? 'Luo tilaus' : 'Create order'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface OrdersTableSectionProps {
  endItem: number;
  formatCustomerName: (order: OrderRow) => string;
  formatDate: (value: string | null) => string;
  formatMoney: (cents: number | null) => string;
  formatStatusLabel: (value: string | null | undefined) => string;
  getCustomerEmail: (order: OrderRow) => string;
  getCustomerPhone: (order: OrderRow) => string;
  getDisplayStatus: (order: OrderRow) => OrderMarkStatus;
  getItemCount: (order: OrderRow) => number;
  getNextStatus: (status: OrderMarkStatus) => OrderMarkStatus;
  getPaymentInfo: (order: OrderRow) => { method: PaymentMethod; result: PaymentResult };
  getRowStatusClass: (status: string) => string;
  getScheduledDeletionInfo: (order: OrderRow) => { isExpired: boolean; daysLeft: number } | null;
  getStatusBadgeClass: (status: string) => string;
  getStatusMeta: (status: string) => { icon: React.ComponentType<{ className?: string }>; tone: 'gray' | 'purple' | 'green' | 'blue' | 'red' | 'orange' };
  isDark: boolean;
  language: string;
  loading: boolean;
  markOrderStatus: (orderId: string, nextStatus: OrderMarkStatus) => void;
  orders: OrderRow[];
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setSelectedOrder: React.Dispatch<React.SetStateAction<OrderRow | null>>;
  startItem: number;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  updatingStatusId: string | null;
}

function OrdersTableSection({
  currentPage,
  endItem,
  formatCustomerName,
  formatDate,
  formatMoney,
  formatStatusLabel,
  getCustomerEmail,
  getCustomerPhone,
  getDisplayStatus,
  getItemCount,
  getNextStatus,
  getPaymentInfo,
  getRowStatusClass,
  getScheduledDeletionInfo,
  getStatusBadgeClass,
  getStatusMeta,
  isDark,
  language,
  loading,
  markOrderStatus,
  orders,
  setCurrentPage,
  setSelectedOrder,
  startItem,
  totalCount,
  totalPages,
  updatingStatusId,
}: OrdersTableSectionProps) {
  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className={`mx-auto h-12 w-12 animate-spin rounded-full border-b-2 ${isDark ? 'border-white' : 'border-gray-900'}`} />
        <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {language === 'fi' ? 'Ladataan tilauksia...' : 'Loading orders...'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={`overflow-hidden rounded-lg border ${isDark ? 'border-white/10 bg-[#161A22]' : 'border-gray-200 bg-white'}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{language === 'fi' ? 'Päivä' : 'Date'}</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{language === 'fi' ? 'Tilaus' : 'Order'}</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{language === 'fi' ? 'Asiakas' : 'Customer'}</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{language === 'fi' ? 'Tuotteet' : 'Items'}</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{language === 'fi' ? 'Yhteensä' : 'Total'}</th>
                <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{language === 'fi' ? 'Toiminto' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {orders.map((order) => {
                const displayStatus = getDisplayStatus(order);
                const statusMeta = getStatusMeta(displayStatus);
                const StatusIcon = statusMeta.icon;
                const payment = getPaymentInfo(order);
                const deletionInfo = getScheduledDeletionInfo(order);
                const PaymentIcon = payment.method === 'cash' ? Banknote : payment.method === 'paytrail' ? Globe : CreditCard;
                const methodLabel = payment.method === 'paytrail' ? 'Paytrail' : payment.method === 'card' ? 'Card' : 'Cash';
                const paymentResultLabel =
                  payment.result === 'purchased'
                    ? 'Purchased'
                    : payment.result === 'pending'
                      ? 'Pending'
                      : 'Fail';

                return (
                  <tr key={order.id} className={`${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} ${getRowStatusClass(displayStatus)}`}>
                    <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{formatDate(order.created_at)}</td>
                    <td className={`px-4 py-3 text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{order.id}</td>
                    <td className={`${isDark ? 'text-white' : 'text-gray-900'} px-4 py-3`}>
                      <div className="flex flex-col gap-1">
                        <span>{formatCustomerName(order)}</span>
                        <span className={`inline-flex items-center gap-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Mail className="h-3 w-3" />
                          {getCustomerEmail(order)}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Phone className="h-3 w-3" />
                          {getCustomerPhone(order)}
                        </span>
                      </div>
                    </td>
                    <td className={`${isDark ? 'text-gray-300' : 'text-gray-700'} px-4 py-3`}>
                      <span className="inline-flex items-center gap-1 text-sm">
                        <Package className="h-4 w-4" />
                        {getItemCount(order)}
                      </span>
                    </td>
                    <td className={`${isDark ? 'text-white' : 'text-gray-900'} px-4 py-3`}>
                      <p>{formatMoney(order.grand_total_cents)}</p>
                      <span
                        className={`mt-1 inline-flex items-center gap-1 text-xs ${
                          payment.result === 'purchased'
                            ? (isDark ? 'text-green-300' : 'text-green-700')
                            : payment.result === 'pending'
                              ? (isDark ? 'text-amber-300' : 'text-amber-700')
                            : (isDark ? 'text-red-300' : 'text-red-700')
                        } ${deletionInfo ? 'line-through' : ''}`}
                      >
                        <PaymentIcon className="h-3 w-3" />
                        {methodLabel} · {paymentResultLabel}
                      </span>
                      {deletionInfo && (
                        <p className={`mt-1 text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                          {deletionInfo.isExpired
                            ? (language === 'fi' ? 'Poistettavissa nyt' : 'Scheduled for deletion now')
                            : (language === 'fi'
                                ? `Poistuu ${deletionInfo.daysLeft} päivän kuluttua`
                                : `Scheduled deletion in ${deletionInfo.daysLeft} day(s)`)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => markOrderStatus(order.id, getNextStatus(displayStatus))}
                          disabled={updatingStatusId === order.id}
                          title={language === 'fi' ? 'Päivitä seuraavaan tilaan' : 'Move to next status'}
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${getStatusBadgeClass(displayStatus)} ${
                            isDark ? 'hover:bg-white/10' : 'hover:opacity-90'
                          }`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {formatStatusLabel(displayStatus)}
                        </button>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm ${
                            isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-300 text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {orders.length === 0 && (
        <div className="py-10 text-center">
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            {language === 'fi' ? 'Tilauksia ei löytynyt' : 'No orders found'}
          </p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {language === 'fi'
              ? `Näytetään ${startItem}-${endItem} / ${totalCount}`
              : `Showing ${startItem}-${endItem} of ${totalCount}`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
              className={`rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50 ${
                isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-300 text-gray-900 hover:bg-gray-100'
              }`}
            >
              {language === 'fi' ? 'Edellinen' : 'Previous'}
            </button>
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              className={`rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50 ${
                isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-300 text-gray-900 hover:bg-gray-100'
              }`}
            >
              {language === 'fi' ? 'Seuraava' : 'Next'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function OrdersCMSPage() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isDark = theme === 'dark';

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [purchasedOnly, setPurchasedOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [createOrderError, setCreateOrderError] = useState<string | null>(null);
  const [eanLookupLoading, setEanLookupLoading] = useState(false);
  const [eanLookupMessage, setEanLookupMessage] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<OrderCreateForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    itemName: '',
    itemEan: '',
    variantId: null,
    qty: '1',
    unitPriceEur: '',
    baseUnitPriceEur: null,
    pricingRules: null,
    unitPriceManuallyEdited: false,
    vatPercent: '25.5',
    paymentMethod: 'cash',
    status: 'receive',
  });

  useEffect(() => {
    fetchOrders();
  }, [searchTerm, statusFilter, purchasedOnly, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, purchasedOnly]);

  const isPurchased = (order: OrderRow) => {
    const status = getDisplayStatus(order);
    return status === 'done' || status === 'delivered';
  };

  const normalizeStatus = (value: string | null | undefined) => (value ?? '').trim().toLowerCase();

  const canonicalStatus = (value: string | null | undefined): OrderMarkStatus | null => {
    const normalized = normalizeStatus(value);
    if (!normalized) return null;

    if (normalized === 'ready_for_pickup' || normalized === 'arrived') return 'ready';
    if (normalized === 'pending' || normalized === 'received') return 'receive';
    if (normalized === 'processing' || normalized === 'in_transit' || normalized === 'shipped') return 'sent';
    if (normalized === 'completed') return 'done';
    if (normalized === 'canceled') return 'cancelled';

    if ((ORDER_MARK_STATUSES as readonly string[]).includes(normalized)) {
      return normalized as OrderMarkStatus;
    }

    return null;
  };

  const formatStatusLabel = (value: string | null | undefined) => {
    const normalized = normalizeStatus(value);
    if (!normalized) return '-';
    return normalized
      .split('_')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const getDisplayStatus = (order: OrderRow): OrderMarkStatus => (
    canonicalStatus(getSnapshot(order)?.fulfillment_status) ??
    canonicalStatus(getSnapshot(order)?.fulfilment_status) ??
    canonicalStatus(getSnapshot(order)?.workflow?.status) ??
    canonicalStatus(getSnapshot(order)?.admin_status) ??
    canonicalStatus(order.status) ??
    'receive'
  );

  const getStatusMeta = (status: string) => {
    switch (normalizeStatus(status)) {
      case 'receive':
        return { icon: Package, tone: 'gray' as const };
      case 'sent':
        return { icon: Send, tone: 'purple' as const };
      case 'ready':
        return { icon: Package, tone: 'green' as const };
      case 'delivered':
        return { icon: Truck, tone: 'blue' as const };
      case 'done':
        return { icon: CheckCircle2, tone: 'purple' as const };
      case 'cancelled':
      case 'canceled':
        return { icon: XCircle, tone: 'red' as const };
      case 'returned':
        return { icon: RotateCcw, tone: 'orange' as const };
      default:
        return { icon: AlertCircle, tone: 'gray' as const };
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const tone = getStatusMeta(status).tone;
    if (tone === 'green') return isDark ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-green-100 text-green-700 border-green-300';
    if (tone === 'red') return isDark ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-red-100 text-red-700 border-red-300';
    if (tone === 'orange') return isDark ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' : 'bg-orange-100 text-orange-700 border-orange-300';
    if (tone === 'blue') return isDark ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-blue-100 text-blue-700 border-blue-300';
    if (tone === 'purple') return isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-700 border-purple-300';
    return isDark ? 'bg-white/10 text-gray-300 border-white/20' : 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getRowStatusClass = (status: string) => {
    const tone = getStatusMeta(status).tone;
    if (tone === 'green') return isDark ? 'border-l-2 border-l-green-500/40' : 'border-l-2 border-l-green-400';
    if (tone === 'red') return isDark ? 'border-l-2 border-l-red-500/50' : 'border-l-2 border-l-red-400';
    if (tone === 'orange') return isDark ? 'border-l-2 border-l-orange-500/50' : 'border-l-2 border-l-orange-400';
    if (tone === 'blue') return isDark ? 'border-l-2 border-l-blue-500/50' : 'border-l-2 border-l-blue-400';
    if (tone === 'purple') return isDark ? 'border-l-2 border-l-purple-500/50' : 'border-l-2 border-l-purple-400';
    return '';
  };

  const getNextStatus = (status: OrderMarkStatus): OrderMarkStatus => {
    const flow: OrderMarkStatus[] = ['receive', 'sent', 'ready', 'delivered', 'done'];
    const index = flow.indexOf(status);
    if (index === -1) return 'receive';
    if (index === flow.length - 1) return flow[index];
    return flow[index + 1];
  };

  const isOrderStatusEnumError = (error: any) => {
    const text = `${error?.message ?? ''} ${error?.details ?? ''}`.toLowerCase();
    return text.includes('enum') && text.includes('order_status');
  };

  const isMissingColumnError = (error: any, column: string) => {
    const text = `${error?.message ?? ''} ${error?.details ?? ''}`.toLowerCase();
    return text.includes('column') && text.includes(column.toLowerCase());
  };

  const updateOrderStatusWithFallback = async (
    orderId: string,
    uiStatus: OrderMarkStatus,
    extraPayload: Record<string, any> = {},
    knownSnapshot?: any,
  ) => {
    const candidates = DB_STATUS_CANDIDATES[uiStatus] ?? [uiStatus];
    let lastError: any = null;

    for (let i = 0; i < candidates.length; i += 1) {
      const dbStatus = candidates[i];
      const { error } = await supabase
        .from('orders')
        .update({ ...extraPayload, status: dbStatus })
        .eq('id', orderId);

      if (!error) {
        return { dbStatus, error: null };
      }

      lastError = error;
      if (!isOrderStatusEnumError(error)) {
        break;
      }
    }

    // Fallback for strict enums: persist fulfillment status in cart_snapshot without touching orders.status.
    if (isOrderStatusEnumError(lastError)) {
      let baseSnapshot: any = knownSnapshot ?? null;
      if (!baseSnapshot) {
        const { data: snapshotRow } = await supabase
          .from('orders')
          .select('cart_snapshot')
          .eq('id', orderId)
          .maybeSingle();
        if (snapshotRow?.cart_snapshot) {
          baseSnapshot = typeof snapshotRow.cart_snapshot === 'string'
            ? (() => {
                try {
                  return JSON.parse(snapshotRow.cart_snapshot);
                } catch {
                  return {};
                }
              })()
            : snapshotRow.cart_snapshot;
        }
      }

      const snapshotFromPayload = extraPayload.cart_snapshot
        ? (typeof extraPayload.cart_snapshot === 'string'
          ? (() => {
              try {
                return JSON.parse(extraPayload.cart_snapshot);
              } catch {
                return {};
              }
            })()
          : extraPayload.cart_snapshot)
        : null;

      const mergedSnapshot = {
        ...(baseSnapshot ?? {}),
        ...(snapshotFromPayload ?? {}),
        fulfillment_status: uiStatus,
        fulfillment_status_updated_at: new Date().toISOString(),
      };

      const safePayload = {
        ...extraPayload,
        cart_snapshot: mergedSnapshot,
      };

      const { error: fallbackError } = await supabase
        .from('orders')
        .update(safePayload)
        .eq('id', orderId);

      if (!fallbackError) {
        return { dbStatus: null, error: null, usedSnapshotFallback: true, snapshot: mergedSnapshot };
      }

      lastError = fallbackError;
    }

    return { dbStatus: null, error: lastError, usedSnapshotFallback: false, snapshot: null };
  };

  const getPaymentInfo = (order: OrderRow): PaymentInfo => {
    const snapshot = getSnapshot(order);
    const paymentMethodRaw = String(snapshot?.payment_method ?? '').toLowerCase();
    const hasPaytrail = Boolean(order.paytrail_transaction_id || order.paytrail_reference || normalizeStatus(order.paytrail_status));
    let method: PaymentMethod = 'cash';
    if (paymentMethodRaw.includes('cash')) {
      method = 'cash';
    } else if (paymentMethodRaw.includes('paytrail') || hasPaytrail) {
      method = 'paytrail';
    } else if (paymentMethodRaw.includes('card')) {
      method = 'card';
    }

    const paytrail = normalizeStatus(order.paytrail_status);
    const snapshotResult = normalizeStatus(snapshot?.payment_status);
    const snapshotPaytrail = normalizeStatus(snapshot?.paytrail?.status);
    const orderStatus = normalizeStatus(order.status);
    const successSignals = new Set(['purchased', 'paid', 'ok', 'success']);
    const failureSignals = new Set(['fail', 'failed', 'cancelled', 'canceled', 'create_failed', 'rejected', 'error']);
    const pendingSignals = new Set(['pending', 'pending_payment', 'new', 'delayed', 'unknown']);
    const signals = [snapshotResult, paytrail, snapshotPaytrail, orderStatus].filter(Boolean);
    const result: PaymentResult = (() => {
      if (signals.some((signal) => successSignals.has(signal))) return 'purchased';
      if (signals.some((signal) => failureSignals.has(signal))) return 'fail';
      if (method === 'cash') return 'purchased';
      if (signals.some((signal) => pendingSignals.has(signal))) return 'pending';
      return 'pending';
    })();

    return { method, result };
  };

  const getScheduledDeletionInfo = (order: OrderRow) => {
    const snapshot = getSnapshot(order);
    const rawDeleteAt = snapshot?.cleanup?.delete_at;
    if (!rawDeleteAt) return null;

    const deleteAt = new Date(rawDeleteAt);
    if (Number.isNaN(deleteAt.getTime())) return null;

    const now = new Date();
    const ms = deleteAt.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));

    return {
      deleteAt,
      daysLeft,
      isExpired: ms <= 0,
    };
  };

  const resetCreateForm = () => {
    setCreateForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      itemName: '',
      itemEan: '',
      variantId: null,
      qty: '1',
      unitPriceEur: '',
      baseUnitPriceEur: null,
      pricingRules: null,
      unitPriceManuallyEdited: false,
      vatPercent: '25.5',
      paymentMethod: 'cash',
      status: 'receive',
    });
    setCreateOrderError(null);
    setEanLookupMessage(null);
  };

  const lookupItemByEan = async (eanRaw: string) => {
    const ean = eanRaw.trim();
    if (!ean) return;
    setEanLookupLoading(true);
    setEanLookupMessage(null);

    try {
      const searchSelect = 'variant_id, brand, model, size_string, price';
      const isMissingColumn = (error: any, column: string) => {
        const text = `${error?.message ?? ''} ${error?.details ?? ''}`.toLowerCase();
        return text.includes('column') && text.includes(column.toLowerCase());
      };

      let data: any = null;

      // 1) Direct lookup by `ean` when column exists.
      {
        const byEan = await supabase
          .from('products_search')
          .select(searchSelect)
          .eq('ean', ean)
          .limit(1)
          .maybeSingle();

        if (!byEan.error) {
          data = byEan.data;
        } else if (!isMissingColumn(byEan.error, 'ean')) {
          throw byEan.error;
        }
      }

      // 2) Fallback lookup by `derived_ean` when column exists.
      if (!data) {
        const byDerivedEan = await supabase
          .from('products_search')
          .select(searchSelect)
          .eq('derived_ean', ean)
          .limit(1)
          .maybeSingle();

        if (!byDerivedEan.error) {
          data = byDerivedEan.data;
        } else if (!isMissingColumn(byDerivedEan.error, 'derived_ean')) {
          throw byDerivedEan.error;
        }
      }

      // 3) CMS-style robust fallback: map EAN -> variant_id from catalog tables, then resolve via products_search.
      if (!data) {
        const [{ data: tireHits, error: tireError }, { data: rimHits, error: rimError }] = await Promise.all([
          supabase.from('catalog_tire_variants').select('id').eq('ean', ean).limit(1),
          supabase.from('catalog_rim_variants').select('id').eq('ean', ean).limit(1),
        ]);

        if (tireError) {
          console.warn('EAN lookup tire fallback error:', tireError);
        }
        if (rimError) {
          console.warn('EAN lookup rim fallback error:', rimError);
        }

        const variantIds = [
          ...(tireHits ?? []).map((row: any) => row.id),
          ...(rimHits ?? []).map((row: any) => row.id),
        ].filter(Boolean);

        if (variantIds.length > 0) {
          const byVariant = await supabase
            .from('products_search')
            .select(searchSelect)
            .in('variant_id', variantIds)
            .limit(1)
            .maybeSingle();

          if (byVariant.error) throw byVariant.error;
          data = byVariant.data;
        }
      }

      if (!data) {
        setEanLookupMessage(language === 'fi' ? 'EAN ei löytynyt tuotteista.' : 'EAN not found in products.');
        return;
      }

      const resolvedTitle = `${data.brand ?? ''} ${data.model ?? ''}`.trim();
      const titled = data.size_string ? `${resolvedTitle} ${data.size_string}`.trim() : resolvedTitle;
      const resolvedPrice = data.price ?? null;
      const resolvedVariantId = data.variant_id ?? null;

      let pricingRules: ProductPricingRules | null = null;
      if (resolvedVariantId) {
        const { data: cmsRow, error: cmsLookupError } = await supabase
          .from('product_cms')
          .select('spec_overrides')
          .eq('variant_id', resolvedVariantId)
          .maybeSingle();

        if (!cmsLookupError && cmsRow) {
          pricingRules = getPricingRulesFromSpecOverrides(cmsRow.spec_overrides);
        }
      }

      setCreateForm((prev) => {
        const qty = Math.max(1, Number.parseInt(prev.qty, 10) || 1);
        const baseUnitPriceEur = resolvedPrice !== null && resolvedPrice !== undefined
          ? Number(resolvedPrice)
          : prev.baseUnitPriceEur;
        const autoPricing = calculateLinePricing(baseUnitPriceEur, qty, pricingRules);

        return {
          ...prev,
          itemName: titled || prev.itemName,
          variantId: resolvedVariantId || prev.variantId,
          baseUnitPriceEur,
          pricingRules: pricingRules ?? null,
          unitPriceManuallyEdited: false,
          unitPriceEur:
            baseUnitPriceEur !== null && baseUnitPriceEur !== undefined
              ? autoPricing.effectiveUnitPriceEur.toFixed(2)
              : prev.unitPriceEur,
        };
      });

      setEanLookupMessage(language === 'fi' ? 'Tuote löytyi ja hinta täytettiin.' : 'Item found and price auto-filled.');
    } catch (err: any) {
      console.error('EAN lookup error:', err);
      setEanLookupMessage(err.message ?? 'EAN lookup failed');
    } finally {
      setEanLookupLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    setCreateOrderError(null);

    const qty = Math.max(1, Number.parseInt(createForm.qty, 10) || 1);
    const unitPriceValue = Number.parseFloat(createForm.unitPriceEur);
    const vatPercentValue = Number.parseFloat(createForm.vatPercent);
    if (!Number.isFinite(unitPriceValue) || unitPriceValue <= 0) {
      setCreateOrderError(language === 'fi' ? 'Anna kelvollinen yksikköhinta.' : 'Provide a valid unit price.');
      return;
    }
    if (!Number.isFinite(vatPercentValue) || vatPercentValue < 0 || vatPercentValue > 100) {
      setCreateOrderError(language === 'fi' ? 'Anna kelvollinen ALV-prosentti (0-100).' : 'Provide a valid VAT % (0-100).');
      return;
    }

    setCreatingOrder(true);
    try {
      const unitCents = Math.round(unitPriceValue * 100);
      const subtotalCents = unitCents * qty;
      const vatCents = Math.round(subtotalCents * (vatPercentValue / 100));
      const totalCents = subtotalCents + vatCents;
      const baseUnitPriceCents = createForm.baseUnitPriceEur !== null && createForm.baseUnitPriceEur !== undefined
        ? Math.round(createForm.baseUnitPriceEur * 100)
        : null;
      const discountCents = baseUnitPriceCents !== null
        ? Math.max(0, (baseUnitPriceCents * qty) - subtotalCents)
        : 0;
      const nowIso = new Date().toISOString();
      const rowId = crypto.randomUUID();

      const paytrailStatus = null;
      const snapshot = {
        created_by: 'cms',
        created_at: nowIso,
        fulfillment_status: createForm.status,
        fulfillment_status_updated_at: nowIso,
        subtotal_cents: subtotalCents,
        vat_cents: vatCents,
        shipping_cents: 0,
        total_cents: totalCents,
        vat_percent: vatPercentValue,
        customer: {
          firstName: createForm.firstName || null,
          lastName: createForm.lastName || null,
          email: createForm.email || null,
          phone: createForm.phone || null,
        },
        payment_method: createForm.paymentMethod,
        payment_status: 'purchased',
        items: [
          {
            name: createForm.itemName || 'Manual order',
            qty,
            ean: createForm.itemEan || null,
            variant_id: createForm.variantId || null,
            client_unit_price_cents: unitCents,
            base_unit_price_cents: baseUnitPriceCents,
            discount_cents: discountCents,
            pricing_source: createForm.unitPriceManuallyEdited ? 'manual' : 'auto',
            pricing_rules: createForm.pricingRules,
          },
        ],
      };

      const payloadFullBase: Record<string, any> = {
        id: rowId,
        paytrail_status: paytrailStatus,
        subtotal_cents: subtotalCents,
        vat_cents: vatCents,
        total_cents: totalCents,
        grand_total_cents: totalCents,
        email: createForm.email || null,
        phone: createForm.phone || null,
        cart_snapshot: snapshot,
      };

      const payloadFallbackBase: Record<string, any> = {
        id: rowId,
        paytrail_status: paytrailStatus,
        subtotal_cents: subtotalCents,
        vat_cents: vatCents,
        total_cents: totalCents,
        grand_total_cents: totalCents,
        cart_snapshot: snapshot,
      };

      let fullInsert = await supabase.from('orders').insert(payloadFullBase);
      if (fullInsert.error && isMissingColumnError(fullInsert.error, 'vat_cents')) {
        const { vat_cents, ...withoutVat } = payloadFullBase;
        fullInsert = await supabase.from('orders').insert(withoutVat);
      }

      if (fullInsert.error) {
        const message = `${fullInsert.error.message ?? ''} ${fullInsert.error.details ?? ''}`.toLowerCase();
        const schemaMismatch = message.includes('column') && (
          message.includes('customer_') || message.includes('paytrail_')
        );

        if (!schemaMismatch) throw fullInsert.error;

        let fallbackInsert = await supabase.from('orders').insert(payloadFallbackBase);
        if (fallbackInsert.error && isMissingColumnError(fallbackInsert.error, 'vat_cents')) {
          const { vat_cents, ...withoutVat } = payloadFallbackBase;
          fallbackInsert = await supabase.from('orders').insert(withoutVat);
        }
        if (fallbackInsert.error) throw fallbackInsert.error;
      }

      setCreateOrderOpen(false);
      resetCreateForm();
      setCurrentPage(1);
      fetchOrders();
    } catch (err: any) {
      console.error('Create order error:', err);
      const errorText = `${err?.message ?? ''} ${err?.details ?? ''}`.toLowerCase();
      if (errorText.includes('row-level security') || String(err?.code ?? '') === '42501') {
        setCreateOrderError(
          language === 'fi'
            ? 'Ei oikeutta kirjoittaa orders-tauluun (RLS). Aja ORDERS_CMS_SAFE_READ_POLICY.sql.'
            : 'No write permission for orders table (RLS). Run ORDERS_CMS_SAFE_READ_POLICY.sql.'
        );
      } else {
        setCreateOrderError(err.message ?? 'Failed to create order');
      }
    } finally {
      setCreatingOrder(false);
    }
  };

  const markOrderStatus = async (orderId: string, nextStatus: OrderMarkStatus) => {
    setUpdatingStatusId(orderId);
    setError(null);

    try {
      const targetOrder = orders.find((o) => o.id === orderId) ?? (selectedOrder?.id === orderId ? selectedOrder : null);
      const payment = targetOrder ? getPaymentInfo(targetOrder) : null;
      const shouldScheduleDeletion = Boolean(targetOrder) && payment?.result === 'fail' && nextStatus === 'done';

      const updatePayload: Record<string, any> = {};
      if (shouldScheduleDeletion && targetOrder) {
        const snapshot = getSnapshot(targetOrder);
        updatePayload.cart_snapshot = {
          ...snapshot,
          cleanup: {
            ...(snapshot?.cleanup ?? {}),
            scheduled: true,
            delete_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            reason: 'Failed payment marked done by admin',
          },
        };
      }

      const currentSnapshot = targetOrder ? getSnapshot(targetOrder) : {};
      const updateResult = await updateOrderStatusWithFallback(orderId, nextStatus, updatePayload, currentSnapshot);
      const { error: updateError } = updateResult;
      if (updateError) throw updateError;

      const mergedSnapshot = updateResult.snapshot
        ?? {
          ...(currentSnapshot ?? {}),
          ...(updatePayload.cart_snapshot ?? {}),
          fulfillment_status: nextStatus,
          fulfillment_status_updated_at: new Date().toISOString(),
        };

      setOrders((prev) => prev.map((row) => (
        row.id === orderId
          ? {
              ...row,
              ...(updateResult.dbStatus ? { status: updateResult.dbStatus } : {}),
              cart_snapshot: mergedSnapshot,
            }
          : row
      )));
      setSelectedOrder((prev) => (
        prev && prev.id === orderId
          ? {
              ...prev,
              ...(updateResult.dbStatus ? { status: updateResult.dbStatus } : {}),
              cart_snapshot: mergedSnapshot,
            }
          : prev
      ));
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setError(err.message ?? 'Failed to update order status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const getCustomerFromSnapshot = (order: OrderRow) => {
    const rawSnapshot = order.cart_snapshot;
    const snapshot = typeof rawSnapshot === 'string'
      ? (() => {
          try {
            return JSON.parse(rawSnapshot);
          } catch {
            return {};
          }
        })()
      : (rawSnapshot ?? {});
    const customer = snapshot.customer ?? {};
    const billing = snapshot.billing ?? {};
    const shipping = snapshot.shipping ?? {};

    const firstName =
      order.customer_first_name ??
      customer.firstName ??
      customer.first_name ??
      billing.firstName ??
      billing.first_name ??
      shipping.firstName ??
      shipping.first_name ??
      null;
    const lastName =
      order.customer_last_name ??
      customer.lastName ??
      customer.last_name ??
      billing.lastName ??
      billing.last_name ??
      shipping.lastName ??
      shipping.last_name ??
      null;
    const email =
      order.email ??
      order.customer_email ??
      customer.email ??
      billing.email ??
      shipping.email ??
      null;
    const phone =
      order.phone ??
      order.customer_phone ??
      customer.phone ??
      billing.phone ??
      shipping.phone ??
      null;

    return { firstName, lastName, email, phone };
  };

  const getSnapshot = (order: OrderRow) => {
    const rawSnapshot = order.cart_snapshot;
    if (typeof rawSnapshot === 'string') {
      try {
        return JSON.parse(rawSnapshot);
      } catch {
        return {};
      }
    }
    return rawSnapshot ?? {};
  };

  const extractOrderItems = (order: OrderRow): any[] => {
    const snapshot = getSnapshot(order);
    const candidates = [
      snapshot?.items,
      snapshot?.cart?.items,
      snapshot?.order?.items,
      snapshot?.payload?.items,
      snapshot?.products,
      snapshot?.line_items,
      snapshot?.lines,
      snapshot?.checkout?.items,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
      if (candidate && typeof candidate === 'object') {
        const values = Object.values(candidate);
        if (values.length > 0) {
          return values;
        }
      }
    }

    return [];
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const trimmedSearch = searchTerm.trim();
      const rangeStart = (currentPage - 1) * PAGE_SIZE;
      const rangeEnd = rangeStart + PAGE_SIZE - 1;

      const applyCommonFilters = (query: any) => query;

      const fullSelect =
        'id, created_at, status, paytrail_status, paytrail_transaction_id, paytrail_reference, email, phone, grand_total_cents, cart_snapshot';
      const fallbackSelect =
        'id, created_at, status, paytrail_status, paytrail_transaction_id, paytrail_reference, grand_total_cents, cart_snapshot';

      let usedFallback = false;
      let data: any[] | null = null;
      let count: number | null = 0;

      {
        let fullQuery = supabase
          .from('orders')
          .select(fullSelect, { count: 'exact' })
          .order('created_at', { ascending: false });
        fullQuery = applyCommonFilters(fullQuery);

        if (trimmedSearch) {
          fullQuery = fullQuery.or(
            [
              `id.ilike.%${trimmedSearch}%`,
              `email.ilike.%${trimmedSearch}%`,
              `phone.ilike.%${trimmedSearch}%`,
              `paytrail_reference.ilike.%${trimmedSearch}%`,
              `paytrail_transaction_id.ilike.%${trimmedSearch}%`,
            ].join(',')
          );
        }

        const fullResult = await fullQuery.range(rangeStart, rangeEnd);
        if (!fullResult.error) {
          data = fullResult.data;
          count = fullResult.count;
        } else {
          const errorText = `${fullResult.error.message ?? ''} ${fullResult.error.details ?? ''}`.toLowerCase();
          if (!errorText.includes('column') || !errorText.includes('customer_')) {
            throw fullResult.error;
          }
          usedFallback = true;
        }
      }

      if (usedFallback) {
        let fallbackQuery = supabase
          .from('orders')
          .select(fallbackSelect, { count: 'exact' })
          .order('created_at', { ascending: false });
        fallbackQuery = applyCommonFilters(fallbackQuery);

        if (trimmedSearch) {
          fallbackQuery = fallbackQuery.or(
            [
              `id.ilike.%${trimmedSearch}%`,
              `paytrail_reference.ilike.%${trimmedSearch}%`,
              `paytrail_transaction_id.ilike.%${trimmedSearch}%`,
            ].join(',')
          );
        }

        const fallbackResult = await fallbackQuery.range(rangeStart, rangeEnd);
        if (fallbackResult.error) throw fallbackResult.error;
        data = fallbackResult.data;
        count = fallbackResult.count;
      }

      let rows = (data ?? []) as OrderRow[];
      if (trimmedSearch && usedFallback) {
        const q = trimmedSearch.toLowerCase();
        rows = rows.filter((row) => {
          const customer = getCustomerFromSnapshot(row);
          const blob = [
            row.id,
            row.paytrail_reference,
            row.paytrail_transaction_id,
            customer.firstName,
            customer.lastName,
            customer.email,
            customer.phone,
          ].filter(Boolean).join(' ').toLowerCase();
          return blob.includes(q);
        });
      }

      const workflowFilteredRows = statusFilter === 'all'
        ? rows
        : rows.filter((row) => getDisplayStatus(row) === statusFilter);

      const filteredRows = purchasedOnly ? workflowFilteredRows.filter(isPurchased) : workflowFilteredRows;

      setOrders(filteredRows);
      setTotalCount(count ?? 0);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message ?? 'Unknown error');
      setOrders([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, totalCount);

  const selectedItems = useMemo(() => (
    selectedOrder ? extractOrderItems(selectedOrder) : []
  ), [selectedOrder]);

  const selectedOrderTotals = useMemo(() => {
    if (!selectedOrder) return null;

    const snapshot = getSnapshot(selectedOrder);
    const toNumber = (value: any): number | null => {
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    };

    const subtotalFromItemsCents = selectedItems.reduce((sum: number, item: any) => {
      const qty = Math.max(1, Number(item?.qty ?? item?.quantity ?? 1) || 1);
      const unitCents = toNumber(item?.client_unit_price_cents) ?? Math.round((toNumber(item?.price) ?? 0) * 100);
      return sum + (unitCents * qty);
    }, 0);

    let subtotalCents =
      toNumber(snapshot?.subtotal_cents) ??
      toNumber(snapshot?.subtotalCents);

    let vatCents =
      toNumber(snapshot?.vat_cents) ??
      toNumber(snapshot?.vatCents);

    let totalCents =
      toNumber(snapshot?.total_cents) ??
      toNumber(snapshot?.totalCents) ??
      toNumber(snapshot?.grand_total_cents) ??
      toNumber(snapshot?.grandTotalCents) ??
      selectedOrder.grand_total_cents;

    let vatPercent =
      toNumber(snapshot?.vat_percent) ??
      toNumber(snapshot?.vatPercent);

    if (subtotalCents === null && subtotalFromItemsCents > 0) {
      subtotalCents = subtotalFromItemsCents;
    }
    if (vatCents === null && subtotalCents !== null && totalCents !== null) {
      vatCents = totalCents - subtotalCents;
    }
    if (totalCents === null && subtotalCents !== null && vatCents !== null) {
      totalCents = subtotalCents + vatCents;
    }
    if (vatPercent === null && subtotalCents !== null && subtotalCents > 0 && vatCents !== null) {
      vatPercent = (vatCents / subtotalCents) * 100;
    }

    return {
      subtotalCents,
      vatCents,
      totalCents,
      vatPercent,
    };
  }, [selectedOrder, selectedItems]);

  const orderSummary = useMemo(() => {
    const summary = {
      total: orders.length,
      done: 0,
      transit: 0,
      alert: 0,
    };

    for (const order of orders) {
      const status = getDisplayStatus(order);
      if (status === 'delivered' || status === 'done') {
        summary.done += 1;
      } else if (status === 'sent' || status === 'ready' || status === 'receive') {
        summary.transit += 1;
      } else if (status === 'cancelled' || status === 'returned') {
        summary.alert += 1;
      }
    }

    return summary;
  }, [orders]);

  const formatCustomerName = (order: OrderRow) => {
    const customer = getCustomerFromSnapshot(order);
    const first = customer.firstName?.trim() ?? '';
    const last = customer.lastName?.trim() ?? '';
    return `${first} ${last}`.trim() || '-';
  };

  const getCustomerEmail = (order: OrderRow) => getCustomerFromSnapshot(order).email ?? '-';
  const getCustomerPhone = (order: OrderRow) => getCustomerFromSnapshot(order).phone ?? '-';

  const formatDate = (value: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat(language === 'fi' ? 'fi-FI' : 'en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatMoney = (cents: number | null) => {
    if (cents === null || cents === undefined) return '-';
    return `EUR ${(cents / 100).toFixed(2)}`;
  };

  const getItemCount = (order: OrderRow) => {
    const items = extractOrderItems(order);
    if (items.length === 0) return 0;
    return items.reduce((total: number, item: any) => total + Number(item?.qty ?? item?.quantity ?? 1), 0);
  };

  const getItemTitle = (item: any) =>
    item?.name ||
    item?.title ||
    item?.product_name ||
    `${item?.brand || ''} ${item?.model || ''}`.trim() ||
    '-';

  const getItemEan = (item: any) =>
    item?.ean ??
    item?.barcode ??
    item?.product_ean ??
    item?.product?.ean ??
    null;

  const getItemSku = (item: any) =>
    item?.sku ??
    item?.product_sku ??
    item?.id ??
    item?.product_id ??
    null;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0B0D10]' : 'bg-gray-50'}`}>
      <div className={`border-b ${isDark ? 'bg-[#161A22] border-white/10' : 'bg-white border-gray-200'}`}>
        <div className="px-8 py-6">
          <h1 className={`text-3xl mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fi' ? 'Tilaukset CMS' : 'Orders CMS'}
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {language === 'fi'
              ? 'Näe asiakkaiden tilaukset, maksun tila ja ostetut tuotteet'
              : 'Track customer orders, payment state, and purchased items'}
          </p>
        </div>
      </div>

      <OrdersToolbar
        fetchOrders={fetchOrders}
        isDark={isDark}
        language={language}
        purchasedOnly={purchasedOnly}
        resetCreateForm={resetCreateForm}
        searchTerm={searchTerm}
        setCreateOrderOpen={setCreateOrderOpen}
        setPurchasedOnly={setPurchasedOnly}
        setSearchTerm={setSearchTerm}
        setStatusFilter={setStatusFilter}
        statusFilter={statusFilter}
      />

      <div className="px-8 py-6">
        <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className={`rounded-lg border p-4 ${isDark ? 'border-white/10 bg-[#161A22]' : 'border-gray-200 bg-white'}`}>
            <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{language === 'fi' ? 'Näytetyt tilaukset' : 'Visible orders'}</p>
            <p className={`mt-1 text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{orderSummary.total}</p>
          </div>
          <div className={`rounded-lg border p-4 ${isDark ? 'border-green-500/30 bg-green-500/10' : 'border-green-200 bg-green-50'}`}>
            <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-green-300' : 'text-green-700'}`}>{language === 'fi' ? 'Valmis / Toimitettu' : 'Done / Delivered'}</p>
            <p className={`mt-1 text-2xl ${isDark ? 'text-green-300' : 'text-green-700'}`}>{orderSummary.done}</p>
          </div>
          <div className={`rounded-lg border p-4 ${isDark ? 'border-blue-500/30 bg-blue-500/10' : 'border-blue-200 bg-blue-50'}`}>
            <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>{language === 'fi' ? 'Käsittelyssä' : 'In progress'}</p>
            <p className={`mt-1 text-2xl ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>{orderSummary.transit}</p>
          </div>
          <div className={`rounded-lg border p-4 ${isDark ? 'border-red-500/30 bg-red-500/10' : 'border-red-200 bg-red-50'}`}>
            <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-red-300' : 'text-red-700'}`}>{language === 'fi' ? 'Poikkeus' : 'Exception'}</p>
            <p className={`mt-1 text-2xl ${isDark ? 'text-red-300' : 'text-red-700'}`}>{orderSummary.alert}</p>
          </div>
        </div>

        {error && (
          <div className={`mb-4 flex gap-3 p-4 rounded-lg ${isDark ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-700'}`}>
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-medium">{language === 'fi' ? 'Virhe tilausten haussa' : 'Error loading orders'}</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <OrdersTableSection
          currentPage={currentPage}
          endItem={endItem}
          formatCustomerName={formatCustomerName}
          formatDate={formatDate}
          formatMoney={formatMoney}
          formatStatusLabel={formatStatusLabel}
          getCustomerEmail={getCustomerEmail}
          getCustomerPhone={getCustomerPhone}
          getDisplayStatus={getDisplayStatus}
          getItemCount={getItemCount}
          getNextStatus={getNextStatus}
          getPaymentInfo={getPaymentInfo}
          getRowStatusClass={getRowStatusClass}
          getScheduledDeletionInfo={getScheduledDeletionInfo}
          getStatusBadgeClass={getStatusBadgeClass}
          getStatusMeta={getStatusMeta}
          isDark={isDark}
          language={language}
          loading={loading}
          markOrderStatus={markOrderStatus}
          orders={orders}
          setCurrentPage={setCurrentPage}
          setSelectedOrder={setSelectedOrder}
          startItem={startItem}
          totalCount={totalCount}
          totalPages={totalPages}
          updatingStatusId={updatingStatusId}
        />

        <SelectedOrderModal
          formatCustomerName={formatCustomerName}
          formatDate={formatDate}
          formatMoney={formatMoney}
          formatStatusLabel={formatStatusLabel}
          getCustomerEmail={getCustomerEmail}
          getCustomerPhone={getCustomerPhone}
          getDisplayStatus={getDisplayStatus}
          getItemEan={getItemEan}
          getItemSku={getItemSku}
          getItemTitle={getItemTitle}
          getPaymentInfo={getPaymentInfo}
          getStatusBadgeClass={getStatusBadgeClass}
          getStatusMeta={getStatusMeta}
          isDark={isDark}
          language={language}
          markOrderStatus={markOrderStatus}
          order={selectedOrder}
          orderMarkStatuses={ORDER_MARK_STATUSES}
          orderTotals={selectedOrderTotals}
          selectedItems={selectedItems}
          updatingStatusId={updatingStatusId}
          onClose={() => setSelectedOrder(null)}
        />

        <CreateOrderModal
          createForm={createForm}
          createOrderError={createOrderError}
          creatingOrder={creatingOrder}
          eanLookupLoading={eanLookupLoading}
          eanLookupMessage={eanLookupMessage}
          handleCreateOrder={handleCreateOrder}
          isDark={isDark}
          language={language}
          lookupItemByEan={lookupItemByEan}
          open={createOrderOpen}
          setCreateForm={setCreateForm}
          setCreateOrderOpen={setCreateOrderOpen}
          setEanLookupMessage={setEanLookupMessage}
        />
      </div>
    </div>
  );
}
