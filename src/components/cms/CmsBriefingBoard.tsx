import React from 'react';
import { CalendarDays, Package2, RefreshCcw, Siren, TriangleAlert } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { getSupabaseClient } from '../../utils/supabase/client';
import { useLanguage } from '../LanguageContext';
import { CmsBriefingCard } from './CmsBriefingCard';

interface BriefingBooking {
  id: string;
  license_plate: string;
  booking_date: string;
  booking_time: string;
  service_name?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  notes?: string | null;
  status?: string | null;
  created_at: string;
}

interface BriefingOrder {
  id: string;
  created_at: string | null;
  status: string | null;
  paytrail_status: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_first_name: string | null;
  customer_last_name: string | null;
  grand_total_cents: number | null;
  cart_snapshot: any;
}

function formatOrderCustomer(order: BriefingOrder) {
  const snapshot = order.cart_snapshot && typeof order.cart_snapshot === 'object' ? order.cart_snapshot : {};
  const customer = snapshot?.customer ?? snapshot?.customerInfo ?? snapshot?.billing_address ?? snapshot?.order?.customer ?? {};
  const firstName = order.customer_first_name ?? customer.firstName ?? customer.firstname ?? customer.first_name ?? null;
  const lastName = order.customer_last_name ?? customer.lastName ?? customer.lastname ?? customer.last_name ?? null;
  const email = order.customer_email ?? customer.email ?? null;
  const phone = order.customer_phone ?? customer.phone ?? customer.telephone ?? null;

  const name = [firstName, lastName].filter(Boolean).join(' ').trim();

  return {
    name: name || null,
    email,
    phone,
  };
}

function extractOrderItems(order: BriefingOrder): any[] {
  const snapshot = order.cart_snapshot && typeof order.cart_snapshot === 'object' ? order.cart_snapshot : {};
  const candidates = [
    snapshot?.items,
    snapshot?.order?.items,
    snapshot?.payload?.items,
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
}

function formatMoney(totalCents: number | null, language: 'fi' | 'en') {
  if (typeof totalCents !== 'number') {
    return '—';
  }

  return new Intl.NumberFormat(language === 'fi' ? 'fi-FI' : 'en-FI', {
    style: 'currency',
    currency: 'EUR',
  }).format(totalCents / 100);
}

function formatDateTime(value: string, language: 'fi' | 'en') {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(language === 'fi' ? 'fi-FI' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

function formatBookingDate(date: string, time: string, language: 'fi' | 'en') {
  const parsed = new Date(`${date}T${time}:00`);
  if (Number.isNaN(parsed.getTime())) {
    return `${date} ${time}`;
  }

  return new Intl.DateTimeFormat(language === 'fi' ? 'fi-FI' : 'en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

type MobileCmsTab = 'rescue' | 'booking' | 'order' | 'future';

function BookingSection({
  bookings,
  language,
  loading,
}: {
  bookings: BriefingBooking[];
  language: 'fi' | 'en';
  loading: boolean;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-[#FF6B35]" />
        <h2 className="text-base font-semibold text-white">{language === 'fi' ? 'Booking' : 'Booking'}</h2>
      </div>

      {loading ? (
        <div className="rounded-md border border-white/10 bg-[#15181F] px-4 py-5 text-sm text-gray-400">
          {language === 'fi' ? 'Ladataan varauksia...' : 'Loading bookings...'}
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-md border border-white/10 bg-[#15181F] px-4 py-5 text-sm text-gray-400">
          {language === 'fi' ? 'Ei uusia varauksia juuri nyt.' : 'No new bookings right now.'}
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.map((booking, index) => (
            <CmsBriefingCard
              key={booking.id}
              accent="orange"
              defaultOpen={index === 0}
              eyebrow={booking.service_name || (language === 'fi' ? 'Varaus' : 'Booking')}
              title={`${booking.license_plate} · ${booking.customer_name || (language === 'fi' ? 'Asiakas puuttuu' : 'Customer missing')}`}
              subtitle={formatBookingDate(booking.booking_date, booking.booking_time, language)}
              meta={formatDateTime(booking.created_at, language)}
            >
              <dl className="grid gap-3 text-sm text-gray-300">
                <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3">
                  <dt className="text-gray-500">{language === 'fi' ? 'Palvelu' : 'Service'}</dt>
                  <dd>{booking.service_name || '—'}</dd>
                </div>
                <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3">
                  <dt className="text-gray-500">{language === 'fi' ? 'Asiakas' : 'Customer'}</dt>
                  <dd>{booking.customer_name || '—'}</dd>
                </div>
                <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3">
                  <dt className="text-gray-500">{language === 'fi' ? 'Puhelin' : 'Phone'}</dt>
                  <dd>{booking.customer_phone || '—'}</dd>
                </div>
                <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3">
                  <dt className="text-gray-500">{language === 'fi' ? 'Sähköposti' : 'Email'}</dt>
                  <dd className="break-all">{booking.customer_email || '—'}</dd>
                </div>
                <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3">
                  <dt className="text-gray-500">{language === 'fi' ? 'Huomiot' : 'Notes'}</dt>
                  <dd>{booking.notes || '—'}</dd>
                </div>
              </dl>
            </CmsBriefingCard>
          ))}
        </div>
      )}
    </section>
  );
}

function OrderSection({
  orders,
  language,
  loading,
}: {
  orders: BriefingOrder[];
  language: 'fi' | 'en';
  loading: boolean;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Package2 className="h-4 w-4 text-emerald-400" />
        <h2 className="text-base font-semibold text-white">{language === 'fi' ? 'Order' : 'Order'}</h2>
      </div>

      {loading ? (
        <div className="rounded-md border border-white/10 bg-[#15181F] px-4 py-5 text-sm text-gray-400">
          {language === 'fi' ? 'Ladataan tilauksia...' : 'Loading orders...'}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-md border border-white/10 bg-[#15181F] px-4 py-5 text-sm text-gray-400">
          {language === 'fi' ? 'Ei uusia tilauksia juuri nyt.' : 'No new orders right now.'}
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order, index) => {
            const customer = formatOrderCustomer(order);
            const items = extractOrderItems(order);
            const itemSummary = items
              .slice(0, 3)
              .map((item: any) => item?.name || item?.title || item?.product_name || item?.sku)
              .filter(Boolean)
              .join(', ');

            return (
              <CmsBriefingCard
                key={order.id}
                accent="green"
                defaultOpen={index === 0}
                eyebrow={formatMoney(order.grand_total_cents, language)}
                title={`${order.id.slice(0, 8)} · ${customer.name || customer.email || (language === 'fi' ? 'Asiakastiedot puuttuvat' : 'Customer missing')}`}
                subtitle={itemSummary || (language === 'fi' ? 'Tilauksen rivit näkyvät avattuna' : 'Order lines shown when expanded')}
                meta={order.created_at ? formatDateTime(order.created_at, language) : '—'}
              >
                <dl className="grid gap-3 text-sm text-gray-300">
                  <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3">
                    <dt className="text-gray-500">{language === 'fi' ? 'Tila' : 'Status'}</dt>
                    <dd>{order.status || order.paytrail_status || '—'}</dd>
                  </div>
                  <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3">
                    <dt className="text-gray-500">{language === 'fi' ? 'Asiakas' : 'Customer'}</dt>
                    <dd>{customer.name || '—'}</dd>
                  </div>
                  <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3">
                    <dt className="text-gray-500">{language === 'fi' ? 'Puhelin' : 'Phone'}</dt>
                    <dd>{customer.phone || '—'}</dd>
                  </div>
                  <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3">
                    <dt className="text-gray-500">{language === 'fi' ? 'Sähköposti' : 'Email'}</dt>
                    <dd className="break-all">{customer.email || '—'}</dd>
                  </div>
                  <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3">
                    <dt className="text-gray-500">{language === 'fi' ? 'Rivit' : 'Items'}</dt>
                    <dd>{items.length > 0 ? items.map((item: any) => item?.name || item?.title || item?.product_name || item?.sku || '—').filter(Boolean).join(', ') : '—'}</dd>
                  </div>
                </dl>
              </CmsBriefingCard>
            );
          })}
        </div>
      )}
    </section>
  );
}

function RescueSection({ language }: { language: 'fi' | 'en' }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Siren className="h-4 w-4 text-[#FF6B35]" />
        <h2 className="text-base font-semibold text-white">Rescue 24/7</h2>
      </div>

      <div className="rounded-md border border-dashed border-white/10 bg-[#15181F] px-4 py-4 text-sm text-gray-400">
        <div className="mb-2 flex items-center gap-2 text-gray-300">
          <TriangleAlert className="h-4 w-4 text-[#FF6B35]" />
          <span>{language === 'fi' ? 'Tämä näkymä varataan pelastuspyynnöille.' : 'This view is reserved for rescue requests.'}</span>
        </div>
        <p>
          {language === 'fi'
            ? 'Kun Rescue 24/7 lisätään, tähän tabiin tulee vain pelastustehtävät, niiden hälytykset ja avattavat tiedot.'
            : 'When Rescue 24/7 is added, this tab will hold rescue tasks only, with alerts and expandable details.'}
        </p>
      </div>
    </section>
  );
}

function FutureSection({ language }: { language: 'fi' | 'en' }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <TriangleAlert className="h-4 w-4 text-gray-400" />
        <h2 className="text-base font-semibold text-white">{language === 'fi' ? 'Future Tools' : 'Future Tools'}</h2>
      </div>

      <div className="rounded-md border border-white/10 bg-[#15181F] px-4 py-4 text-sm text-gray-400">
        {language === 'fi'
          ? 'Tähän tabiin voidaan lisätä myöhemmin muita puhelimelle tarkoitettuja toimintoja ilman, että desktop-CMS muuttuu.'
          : 'Additional phone-first tools can be added here later without changing the desktop CMS.'}
      </div>
    </section>
  );
}

export function CmsBriefingBoard() {
  const { language } = useLanguage();
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [bookings, setBookings] = React.useState<BriefingBooking[]>([]);
  const [orders, setOrders] = React.useState<BriefingOrder[]>([]);
  const [activeTab, setActiveTab] = React.useState<MobileCmsTab>('booking');

  const loadBriefing = React.useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const supabase = getSupabaseClient();
      const today = new Date();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const bookingsQuery = supabase
        .from('bookings')
        .select('id, license_plate, booking_date, booking_time, service_name, customer_name, customer_phone, customer_email, notes, status, created_at')
        .gte('booking_date', todayKey)
        .order('created_at', { ascending: false })
        .limit(8);

      const ordersFullSelect = 'id, created_at, status, paytrail_status, customer_email, customer_phone, customer_first_name, customer_last_name, grand_total_cents, cart_snapshot';
      const ordersFallbackSelect = 'id, created_at, status, paytrail_status, grand_total_cents, cart_snapshot';

      const [bookingsResult, ordersResult] = await Promise.all([
        bookingsQuery,
        supabase.from('orders').select(ordersFullSelect).order('created_at', { ascending: false }).limit(8),
      ]);

      if (bookingsResult.error) {
        throw bookingsResult.error;
      }

      let ordersData = ordersResult.data as BriefingOrder[] | null;
      if (ordersResult.error) {
        const errorText = `${ordersResult.error.message ?? ''} ${ordersResult.error.details ?? ''}`.toLowerCase();
        if (!errorText.includes('column') || !errorText.includes('customer_')) {
          throw ordersResult.error;
        }

        const fallback = await supabase
          .from('orders')
          .select(ordersFallbackSelect)
          .order('created_at', { ascending: false })
          .limit(8);

        if (fallback.error) {
          throw fallback.error;
        }

        ordersData = fallback.data as BriefingOrder[] | null;
      }

      setBookings((bookingsResult.data ?? []).filter((booking) => (booking.status || 'confirmed').toLowerCase() !== 'cancelled'));
      setOrders(ordersData ?? []);
    } catch (err: any) {
      console.error('Error loading CMS mobile ops board:', err);
      setError(err?.message ?? 'Unknown error');
      setBookings([]);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadBriefing();

    const interval = window.setInterval(() => {
      loadBriefing(true);
    }, 30000);

    return () => window.clearInterval(interval);
  }, [loadBriefing]);

  const summaryLine = [
    bookings.length > 0
      ? `${bookings.length} ${language === 'fi' ? 'uutta varausta' : 'new bookings'}`
      : language === 'fi'
        ? 'Ei uusia varauksia'
        : 'No new bookings',
    orders.length > 0
      ? `${orders.length} ${language === 'fi' ? 'uutta tilausta' : 'new orders'}`
      : language === 'fi'
        ? 'Ei uusia tilauksia'
        : 'No new orders',
  ].join(' · ');

  return (
    <div className="min-h-[100dvh] bg-[#11141A] text-white">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-5 sm:max-w-2xl">
        <header className="space-y-3 border-b border-white/10 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <Badge className="bg-white/10 text-white hover:bg-white/10">CMS PWA</Badge>
              <h1 className="text-2xl font-semibold tracking-[-0.02em] text-white">
                {language === 'fi' ? 'Mobile Ops' : 'Mobile Ops'}
              </h1>
              <p className="text-sm text-gray-400">{summaryLine}</p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadBriefing(true)}
              disabled={refreshing}
              className="border-white/10 bg-transparent text-white hover:bg-white/5 hover:text-white"
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {language === 'fi' ? 'Päivitä' : 'Refresh'}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge className="border-transparent bg-[#FF6B35] text-white hover:bg-[#FF6B35]">
              {language === 'fi' ? 'Mobiili' : 'Mobile'}
            </Badge>
            <Badge variant="outline" className="border-white/10 bg-transparent text-gray-300">
              {new Intl.DateTimeFormat(language === 'fi' ? 'fi-FI' : 'en-GB', {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit',
              }).format(new Date())}
            </Badge>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as MobileCmsTab)} className="gap-4">
          <TabsList className="grid h-auto grid-cols-4 rounded-md bg-[#15181F] p-1">
            <TabsTrigger value="rescue" className="rounded-sm px-1 py-2 text-[12px]">
              Rescue
            </TabsTrigger>
            <TabsTrigger value="booking" className="rounded-sm px-1 py-2 text-[12px]">
              Booking
            </TabsTrigger>
            <TabsTrigger value="order" className="rounded-sm px-1 py-2 text-[12px]">
              Order
            </TabsTrigger>
            <TabsTrigger value="future" className="rounded-sm px-1 py-2 text-[12px]">
              Future Tools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rescue">
            <RescueSection language={language} />
          </TabsContent>

          <TabsContent value="booking">
            <BookingSection bookings={bookings} language={language} loading={loading} />
          </TabsContent>

          <TabsContent value="order">
            <OrderSection orders={orders} language={language} loading={loading} />
          </TabsContent>

          <TabsContent value="future">
            <FutureSection language={language} />
          </TabsContent>
        </Tabs>

        {error ? (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
