import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../ThemeContext';
import { useLanguage } from '../LanguageContext';
import { supabase } from '../../utils/supabase/client';
import { AlertCircle, CheckCircle2, CreditCard, Mail, Package, Phone, RefreshCcw, Search, XCircle } from 'lucide-react';

interface OrderRow {
  id: string;
  created_at: string | null;
  status: string | null;
  paytrail_status: string | null;
  paytrail_transaction_id: string | null;
  paytrail_reference: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_first_name: string | null;
  customer_last_name: string | null;
  grand_total_cents: number | null;
  cart_snapshot: any;
}

type StatusFilter = 'all' | 'paid' | 'pending' | 'cancelled';

const PAGE_SIZE = 50;

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

  useEffect(() => {
    fetchOrders();
  }, [searchTerm, statusFilter, purchasedOnly, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, purchasedOnly]);

  const isPurchased = (order: OrderRow) => {
    const payment = (order.paytrail_status ?? '').toLowerCase();
    const status = (order.status ?? '').toLowerCase();
    return payment === 'paid' || status === 'paid' || status === 'completed' || status === 'delivered';
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
      order.customer_email ??
      customer.email ??
      billing.email ??
      shipping.email ??
      null;
    const phone =
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

      const applyCommonFilters = (query: any) => {
        if (statusFilter === 'paid') {
          query = query.or('status.eq.paid,status.eq.completed,status.eq.delivered,paytrail_status.eq.paid');
        } else if (statusFilter === 'pending') {
          query = query.or('status.eq.pending,paytrail_status.eq.pending');
        } else if (statusFilter === 'cancelled') {
          query = query.or('status.eq.cancelled,status.eq.canceled,paytrail_status.eq.cancelled,paytrail_status.eq.canceled');
        }
        return query;
      };

      const fullSelect =
        'id, created_at, status, paytrail_status, paytrail_transaction_id, paytrail_reference, customer_email, customer_phone, customer_first_name, customer_last_name, grand_total_cents, cart_snapshot';
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
              `customer_email.ilike.%${trimmedSearch}%`,
              `customer_phone.ilike.%${trimmedSearch}%`,
              `customer_first_name.ilike.%${trimmedSearch}%`,
              `customer_last_name.ilike.%${trimmedSearch}%`,
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

      const filteredRows = purchasedOnly ? rows.filter(isPurchased) : rows;

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

      <div className={`border-b ${isDark ? 'bg-[#161A22] border-white/10' : 'bg-white border-gray-200'} px-8 py-4`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder={language === 'fi' ? 'Hae tilausta, sähköpostia tai puhelinta...' : 'Search order, email, or phone...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className={`px-3 py-2 rounded-lg border text-sm ${
                isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">{language === 'fi' ? 'Kaikki tilat' : 'All statuses'}</option>
              <option value="paid">{language === 'fi' ? 'Maksettu' : 'Paid'}</option>
              <option value="pending">{language === 'fi' ? 'Odottaa' : 'Pending'}</option>
              <option value="cancelled">{language === 'fi' ? 'Peruttu' : 'Cancelled'}</option>
            </select>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={purchasedOnly}
                onChange={(e) => setPurchasedOnly(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {language === 'fi' ? 'Näytä vain ostetut' : 'Show purchased only'}
              </span>
            </label>

            <button
              onClick={fetchOrders}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-300 text-gray-900 hover:bg-gray-100'
              }`}
            >
              <RefreshCcw className="w-4 h-4" />
              {language === 'fi' ? 'Päivitä' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        {error && (
          <div className={`mb-4 flex gap-3 p-4 rounded-lg ${isDark ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-700'}`}>
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-medium">{language === 'fi' ? 'Virhe tilausten haussa' : 'Error loading orders'}</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center">
            <div className={`mx-auto h-12 w-12 animate-spin rounded-full border-b-2 ${isDark ? 'border-white' : 'border-gray-900'}`} />
            <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'fi' ? 'Ladataan tilauksia...' : 'Loading orders...'}
            </p>
          </div>
        ) : (
          <>
            <div className={`rounded-lg border overflow-hidden ${isDark ? 'border-white/10 bg-[#161A22]' : 'border-gray-200 bg-white'}`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {language === 'fi' ? 'Päivä' : 'Date'}
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {language === 'fi' ? 'Tilaus' : 'Order'}
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {language === 'fi' ? 'Asiakas' : 'Customer'}
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {language === 'fi' ? 'Tuotteet' : 'Items'}
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {language === 'fi' ? 'Yhteensä' : 'Total'}
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {language === 'fi' ? 'Maksu' : 'Payment'}
                      </th>
                      <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {language === 'fi' ? 'Toiminto' : 'Action'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {orders.map((order) => {
                      const purchased = isPurchased(order);
                      return (
                        <tr key={order.id} className={isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                          <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{formatDate(order.created_at)}</td>
                          <td className={`px-4 py-3 text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{order.id}</td>
                          <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            <div className="flex flex-col gap-1">
                              <span>{formatCustomerName(order)}</span>
                              <span className={`inline-flex items-center gap-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                <Mail className="w-3 h-3" />
                                {getCustomerEmail(order)}
                              </span>
                              <span className={`inline-flex items-center gap-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                <Phone className="w-3 h-3" />
                                {getCustomerPhone(order)}
                              </span>
                            </div>
                          </td>
                          <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            <span className="inline-flex items-center gap-1 text-sm">
                              <Package className="w-4 h-4" />
                              {getItemCount(order)}
                            </span>
                          </td>
                          <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatMoney(order.grand_total_cents)}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex items-center gap-1 text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                <CreditCard className="w-3 h-3" />
                                {order.paytrail_status || order.status || '-'}
                              </span>
                              <span className={`inline-flex items-center gap-1 text-xs ${
                                purchased
                                  ? (isDark ? 'text-green-300' : 'text-green-700')
                                  : (isDark ? 'text-amber-300' : 'text-amber-700')
                              }`}>
                                {purchased ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                {purchased
                                  ? (language === 'fi' ? 'Ostettu' : 'Purchased')
                                  : (language === 'fi' ? 'Ei ostettu' : 'Not purchased')}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className={`px-3 py-1.5 rounded-lg text-sm ${
                                isDark ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                            >
                              {language === 'fi' ? 'Avaa' : 'Open'}
                            </button>
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
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {language === 'fi'
                    ? `Näytetään ${startItem}-${endItem} / ${totalCount}`
                    : `Showing ${startItem}-${endItem} of ${totalCount}`}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1}
                    className={`px-3 py-1.5 rounded-lg text-sm border disabled:opacity-50 ${
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
                    className={`px-3 py-1.5 rounded-lg text-sm border disabled:opacity-50 ${
                      isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-300 text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {language === 'fi' ? 'Seuraava' : 'Next'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {selectedOrder && (
          <div className={`mt-6 rounded-lg border p-5 ${isDark ? 'border-white/10 bg-[#161A22]' : 'border-gray-200 bg-white'}`}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className={`text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {language === 'fi' ? 'Tilauksen tiedot' : 'Order details'}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className={`px-3 py-1.5 rounded-lg text-sm border ${
                  isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-300 text-gray-900 hover:bg-gray-100'
                }`}
              >
                {language === 'fi' ? 'Sulje' : 'Close'}
              </button>
            </div>

            <div className={`mb-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <p><strong>ID:</strong> {selectedOrder.id}</p>
              <p><strong>{language === 'fi' ? 'Päivä' : 'Date'}:</strong> {formatDate(selectedOrder.created_at)}</p>
              <p><strong>{language === 'fi' ? 'Asiakas' : 'Customer'}:</strong> {formatCustomerName(selectedOrder)} ({getCustomerEmail(selectedOrder)})</p>
              <p><strong>{language === 'fi' ? 'Puhelin' : 'Phone'}:</strong> {getCustomerPhone(selectedOrder)}</p>
              <p><strong>{language === 'fi' ? 'Maksun tila' : 'Payment status'}:</strong> {selectedOrder.paytrail_status || selectedOrder.status || '-'}</p>
              <p><strong>{language === 'fi' ? 'Yhteensä' : 'Total'}:</strong> {formatMoney(selectedOrder.grand_total_cents)}</p>
            </div>

            <div>
              <h3 className={`mb-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {language === 'fi' ? 'Tuotteet' : 'Items'}
              </h3>
              {selectedItems.length === 0 ? (
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>-</p>
              ) : (
                <div className="space-y-2">
                  {selectedItems.map((item: any, index: number) => {
                    const qty = Number(item?.qty ?? item?.quantity ?? 1);
                    const unitCents = Number(item?.client_unit_price_cents ?? Math.round(Number(item?.price ?? 0) * 100));
                    const lineTotal = (unitCents * qty) / 100;
                    const sku = item?.sku ?? item?.ean ?? item?.id ?? '-';
                    const size = item?.size ?? item?.size_string ?? item?.dimension ?? '';
                    const title = item?.name || `${item?.brand || ''} ${item?.model || ''}`.trim() || '-';

                    return (
                      <div
                        key={`${selectedOrder.id}-item-${index}`}
                        className={`rounded-lg border p-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}
                      >
                        <p className={isDark ? 'text-white' : 'text-gray-900'}>
                          {title}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          SKU/EAN: {sku}{size ? ` · ${language === 'fi' ? 'Koko' : 'Size'}: ${size}` : ''}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {qty} x EUR {(unitCents / 100).toFixed(2)} = EUR {lineTotal.toFixed(2)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
