import React, { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AlertCircle, Globe, LogOut, RefreshCcw } from 'lucide-react';
import { supabase, getSupabaseConfigError } from './utils/supabase/client';
import { CmsPwaTabBar, type CmsPwaTab } from './components/cms-pwa/CmsPwaTabBar';
import { CmsPwaNotFound } from './components/cms-pwa/CmsPwaNotFound';
import { CmsPwaSectionList } from './components/cms-pwa/CmsPwaSectionList';
import { CmsPwaToolsList } from './components/cms-pwa/CmsPwaToolsList';
import {
  BOOKING_STATUS_HANDOFF,
  buildBookingSections,
  buildOrderSections,
  formatShortDateTime,
  isMissingColumnError,
  REFRESH_INTERVAL_MS,
  rescueSections,
  resolveCmsPwaRoute,
  tabPathMap,
  toolSections,
} from './components/cms-pwa/data';
import { LanguageProvider, useLanguage } from './components/LanguageContext';
import type { AuthState, BookingRow, LiveSectionsState, LoginState, OrderRow } from './components/cms-pwa/types';

async function resolveAdminSession() {
  const withTimeout = async <T,>(promise: Promise<T>, timeoutMs = 10000): Promise<T> => {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        window.setTimeout(() => reject(new Error('Admin session check timed out.')), timeoutMs);
      }),
    ]);
  };

  const { data: { session }, error: sessionError } = await withTimeout(supabase.auth.getSession());

  if (sessionError || !session?.user) {
    return { state: 'unauthenticated' as const, email: '' };
  }

  let isAdmin = session.user.email === 'admin@mitra-auto.fi';

  if (!isAdmin) {
    try {
      const { data: profile } = await withTimeout(
        supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single(),
      );

      isAdmin = profile?.role === 'admin';
    } catch {
      return {
        state: 'unauthenticated' as const,
        email: '',
      };
    }
  }

  return {
    state: isAdmin ? ('authenticated' as const) : ('not-admin' as const),
    email: session.user.email ?? '',
  };
}

function CmsPwaHeader({
  headerMinimized,
  onLogout,
  language,
  setLanguage,
  diagnosticsStatus,
  onOpenDiagnostics,
}: {
  headerMinimized: boolean;
  onLogout: () => void;
  language: 'fi' | 'en';
  setLanguage: (language: 'fi' | 'en') => void;
  diagnosticsStatus: 'healthy' | 'attention';
  onOpenDiagnostics: () => void;
}) {
  return (
    <header
      className={`sticky top-0 z-20 -mx-4 border-b border-white/8 bg-[#0E1117]/92 px-4 backdrop-blur transition-all duration-200 ${
        headerMinimized ? 'pb-2 pt-0.5' : 'pb-4 pt-1'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`font-medium tracking-[0.04em] text-white/45 transition-all duration-200 ${headerMinimized ? 'text-[10px]' : 'text-[11px]'}`}>
            Mitra Auto mobile ops
          </p>
          <h1 className={`font-semibold tracking-tight transition-all duration-200 ${headerMinimized ? 'mt-0.5 text-lg' : 'mt-1 text-2xl'}`}>
            Briefing board
          </h1>
          <p
            className={`overflow-hidden text-white/55 transition-all duration-200 ${
              headerMinimized ? 'mt-0 max-h-0 opacity-0' : 'mt-1 max-h-12 text-sm opacity-100'
            }`}
          >
            Rescue, booking, and order items needing attention now.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenDiagnostics}
            className={`inline-flex items-center justify-center transition-all duration-200 ${
              diagnosticsStatus === 'healthy' ? 'text-emerald-300' : 'text-amber-300'
            } ${headerMinimized ? 'h-9 w-9' : 'h-10 w-10'}`}
            aria-label="Open diagnostics"
          >
            <Globe className={`transition-all duration-200 ${headerMinimized ? 'h-4 w-4' : 'h-[18px] w-[18px]'}`} />
          </button>
          <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
            {(['fi', 'en'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setLanguage(value)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold uppercase transition ${
                  language === value ? 'bg-[#FF6B35] text-[#11141A]' : 'text-white/60'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
          <button
            onClick={onLogout}
            className={`inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] transition-all duration-200 ${
              headerMinimized ? 'h-9 w-9' : 'h-10 w-10'
            }`}
            aria-label="Sign out"
          >
            <LogOut className={`transition-all duration-200 ${headerMinimized ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
          </button>
        </div>
      </div>
    </header>
  );
}

function CmsPwaSummary({
  counts,
  lastUpdatedAt,
  dataLoading,
  activeTab,
  onBookingHandoff,
  handoffLoading,
  activeBookingHandoffCount,
  onRefresh,
}: {
  counts: Record<CmsPwaTab, number>;
  lastUpdatedAt: string | null;
  dataLoading: boolean;
  activeTab: CmsPwaTab;
  onBookingHandoff: () => void;
  handoffLoading: boolean;
  activeBookingHandoffCount: number;
  onRefresh: () => void;
}) {
  const cards: Array<{ tab: 'rescue' | 'booking' | 'order'; label: string; count: number }> = [
    { tab: 'rescue', label: 'Rescue', count: counts.rescue },
    { tab: 'booking', label: 'Booking', count: counts.booking },
    { tab: 'order', label: 'Order', count: counts.order },
  ];

  return (
    <section className="mt-4 rounded-2xl border border-white/10 bg-[#141922] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">Operational summary</p>
          <p className="mt-1 text-xs text-white/55">
            Visible items that still need human follow-up.
            {lastUpdatedAt ? ` Updated ${formatShortDateTime(lastUpdatedAt)}.` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={dataLoading}
          className="inline-flex h-10 w-10 items-center justify-center text-[#FF6B35] disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Force refresh"
        >
          <RefreshCcw className={`h-5 w-5 ${dataLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {cards.map((card) => {
          const selected = activeTab === card.tab;
          return (
            <div
              key={card.tab}
              className={`rounded-xl border px-3 py-3 text-left transition ${
                selected
                  ? 'border-[#FF6B35]/50 bg-[#2A1B14] shadow-[0_12px_24px_rgba(255,107,53,0.12)]'
                  : 'border-white/8 bg-[#1B202A]'
              }`}
            >
              <p className={`text-[11px] ${selected ? 'text-[#FFD2C3]' : 'text-white/50'}`}>{card.label}</p>
              <p className="mt-1 font-mono text-xl font-semibold">{card.count}</p>
            </div>
          );
        })}
      </div>
      {activeTab === 'booking' ? (
        <div className="mt-3 space-y-2">
          {activeBookingHandoffCount > 0 ? (
            <div className="rounded-xl border border-[#FF6B35]/30 bg-[#2A1B14] px-3 py-2 text-xs text-[#FFD2C3]">
              {activeBookingHandoffCount} booking{activeBookingHandoffCount === 1 ? '' : 's'} waiting for desktop CMS to finish handoff.
            </div>
          ) : null}
          <button
            type="button"
            onClick={onBookingHandoff}
            disabled={handoffLoading || counts.booking === 0}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#FF6B35] px-4 py-3 text-sm font-semibold text-[#11141A] transition hover:bg-[#ff845a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {handoffLoading ? 'Handing off...' : counts.booking > 0 ? 'Handoff new bookings' : 'No new bookings to hand off'}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function CmsPwaScreenState({
  activeTab,
  dataError,
  userEmail,
}: {
  activeTab: CmsPwaTab;
  dataError: string;
  userEmail: string;
}) {
  return (
    <>
      <section className="mt-4">
        {dataError ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {dataError}
          </div>
        ) : null}
      </section>

      <section className="mt-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">
              {activeTab === 'rescue'
                ? 'Rescue queue'
                : activeTab === 'booking'
                  ? 'Booking queue'
                  : activeTab === 'order'
                    ? 'Order queue'
                    : 'Planned tools'}
            </h2>
          </div>
          {userEmail ? <p className="text-[11px] text-white/35">{userEmail}</p> : null}
        </div>
      </section>
    </>
  );
}

export function CmsPwaScreen() {
  const { language, setLanguage } = useLanguage();
  const route = resolveCmsPwaRoute(window.location.pathname);
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [userEmail, setUserEmail] = useState('');
  const [form, setForm] = useState<LoginState>({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<CmsPwaTab>(route.kind === 'cms' ? route.tab : 'rescue');
  const [routeState, setRouteState] = useState(route);
  const [liveSections, setLiveSections] = useState<LiveSectionsState>({
    booking: buildBookingSections([]),
    order: buildOrderSections([]),
  });
  const [bookingRows, setBookingRows] = useState<BookingRow[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [headerMinimized, setHeaderMinimized] = useState(false);
  const [handoffLoading, setHandoffLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported',
  );
  const [enablingNotifications, setEnablingNotifications] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [localSubscriptionReady, setLocalSubscriptionReady] = useState(false);
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);
  const [pushLastError, setPushLastError] = useState('');
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const loadRequestIdRef = useRef(0);
  const loadInFlightRef = useRef(false);

  const configError = useMemo(() => getSupabaseConfigError(), []);

  const counts = useMemo(() => ({
    rescue: rescueSections.reduce((sum, section) => sum + section.items.filter((item) => item.tone !== 'done').length, 0),
    booking: liveSections.booking.reduce((sum, section) => sum + section.items.filter((item) => item.tone !== 'done').length, 0),
    order: liveSections.order.reduce((sum, section) => sum + section.items.filter((item) => item.tone !== 'done').length, 0),
    tools: 0,
  }), [liveSections]);

  const activeBookingHandoffCount = useMemo(
    () => bookingRows.filter((booking) => (booking.status ?? '').toLowerCase() === BOOKING_STATUS_HANDOFF).length,
    [bookingRows],
  );
  const unhandedNewBookingRows = useMemo(() => {
    const now = Date.now();
    return bookingRows.filter((booking) => {
      const status = (booking.status ?? 'confirmed').toLowerCase();
      if (status === 'cancelled' || status === BOOKING_STATUS_HANDOFF) {
        return false;
      }
      if (!booking.created_at) {
        return false;
      }
      const createdAt = new Date(booking.created_at).getTime();
      return Number.isFinite(createdAt) && now - createdAt <= 24 * 60 * 60 * 1000;
    });
  }, [bookingRows]);

  const updateBookingBadge = useCallback((count: number) => {
    if (typeof navigator === 'undefined') {
      return;
    }

    const navWithBadge = navigator as Navigator & {
      setAppBadge?: (count?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };

    if (count > 0 && navWithBadge.setAppBadge) {
      void navWithBadge.setAppBadge(count).catch(() => undefined);
      return;
    }

    if (count === 0 && navWithBadge.clearAppBadge) {
      void navWithBadge.clearAppBadge().catch(() => undefined);
    }
  }, []);

  const diagnosticsStatus = useMemo<'healthy' | 'attention'>(() => {
    const permissionHealthy = notificationPermission === 'granted';
    const pushHealthy = typeof window !== 'undefined' ? 'PushManager' in window : false;
    return permissionHealthy && serviceWorkerReady && pushHealthy && localSubscriptionReady && pushSubscribed && !pushLastError
      ? 'healthy'
      : 'attention';
  }, [localSubscriptionReady, notificationPermission, pushLastError, pushSubscribed, serviceWorkerReady]);

  const registerPushSubscription = useCallback(async () => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window) ||
      Notification.permission !== 'granted'
    ) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    setServiceWorkerReady(true);
    const { data, error } = await supabase.functions.invoke('pwa_push', {
      method: 'POST',
      body: { action: 'public_key' },
    });

    if (error || !data?.publicKey) {
      throw error || new Error('Missing web push public key');
    }

    const base64ToUint8Array = (base64: string) => {
      const padding = '='.repeat((4 - (base64.length % 4)) % 4);
      const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
      const raw = window.atob(normalized);
      return Uint8Array.from(raw, (char) => char.charCodeAt(0));
    };

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(data.publicKey),
      });
    }
    setLocalSubscriptionReady(Boolean(subscription));

    const { error: subscribeError } = await supabase.functions.invoke('pwa_push', {
      method: 'POST',
      body: {
        action: 'subscribe',
        subscription,
      },
    });

    if (subscribeError) {
      throw subscribeError;
    }

    setPushSubscribed(true);
    setPushLastError('');
    return true;
  }, []);

  const sections = useMemo(() => {
    if (activeTab === 'booking') return liveSections.booking;
    if (activeTab === 'order') return liveSections.order;
    if (activeTab === 'tools') return [];
    return rescueSections;
  }, [activeTab, liveSections]);

  useEffect(() => {
    const handlePopState = () => {
      const nextRoute = resolveCmsPwaRoute(window.location.pathname);
      setRouteState(nextRoute);
      if (nextRoute.kind === 'cms') {
        setActiveTab(nextRoute.tab);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (routeState.kind !== 'cms') return;

    let active = true;
    const syncSession = async () => {
      if (configError) {
        if (active) {
          setAuthState('unauthenticated');
          setError(configError);
        }
        return;
      }

      try {
        const result = await resolveAdminSession();
        if (!active) return;
        setAuthState(result.state);
        setUserEmail(result.email);
      } catch (sessionError: any) {
        if (!active) return;
        setAuthState('unauthenticated');
        setUserEmail('');
        setError(sessionError?.message || 'Could not verify mobile ops access.');
      }
    };

    syncSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      if (!session?.user) {
        setAuthState('unauthenticated');
        setUserEmail('');
        return;
      }
      try {
        const result = await resolveAdminSession();
        if (!active) return;
        setAuthState(result.state);
        setUserEmail(result.email);
      } catch (sessionError: any) {
        if (!active) return;
        setAuthState('unauthenticated');
        setUserEmail('');
        setError(sessionError?.message || 'Could not verify mobile ops access.');
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [configError, routeState.kind]);

  const loadLiveData = React.useCallback(async (
      cancelledRef?: { current: boolean },
      options?: { force?: boolean },
    ) => {
      const isCancelled = () => cancelledRef?.current === true;
      if (loadInFlightRef.current && !options?.force) {
        return;
      }

      const requestId = ++loadRequestIdRef.current;
      const isStale = () => requestId !== loadRequestIdRef.current;
      const withTimeout = async <T,>(promise: Promise<T>, label: string, timeoutMs = 20000): Promise<T> => {
        return await Promise.race([
          promise,
          new Promise<T>((_, reject) => {
            window.setTimeout(() => reject(new Error(`${label} timed out. Please try again.`)), timeoutMs);
          }),
        ]);
      };

      loadInFlightRef.current = true;
      setDataLoading(true);
      setDataError('');

      try {
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 7);
        const endDateStr = endDate.toISOString().slice(0, 10);

        const bookingSelectFull = 'id, created_at, updated_at, status, booking_language, booking_date, booking_time, license_plate, service_name, customer_name, customer_phone, customer_email, notes';
        const bookingSelectFallback = 'id, created_at, status, booking_language, booking_date, booking_time, license_plate, service_name, customer_name, customer_phone, customer_email, notes';

        let bookingsQuery = await withTimeout(
          supabase
          .from('bookings')
          .select(bookingSelectFull)
          .gte('booking_date', todayStr)
          .lte('booking_date', endDateStr)
          .order('booking_date', { ascending: true })
          .order('booking_time', { ascending: true })
          .limit(40),
          'Booking refresh',
        );

        if (bookingsQuery.error && isMissingColumnError(bookingsQuery.error, 'updated_at')) {
          bookingsQuery = await withTimeout(
            supabase
            .from('bookings')
            .select(bookingSelectFallback)
            .gte('booking_date', todayStr)
            .lte('booking_date', endDateStr)
            .order('booking_date', { ascending: true })
            .order('booking_time', { ascending: true })
            .limit(40),
            'Booking refresh',
          );
        }

        const orderSelectFull = 'id, created_at, status, customer_email, customer_phone, customer_first_name, customer_last_name, grand_total_cents, cart_snapshot';
        const orderSelectFallback = 'id, created_at, status, grand_total_cents, cart_snapshot';

        let ordersQuery = await withTimeout(
          supabase
          .from('orders')
          .select(orderSelectFull)
          .order('created_at', { ascending: false })
          .limit(30),
          'Order refresh',
        );

        if (ordersQuery.error && (
          isMissingColumnError(ordersQuery.error, 'customer_email') ||
          isMissingColumnError(ordersQuery.error, 'customer_phone') ||
          isMissingColumnError(ordersQuery.error, 'customer_first_name') ||
          isMissingColumnError(ordersQuery.error, 'customer_last_name')
        )) {
          ordersQuery = await withTimeout(
            supabase
            .from('orders')
            .select(orderSelectFallback)
            .order('created_at', { ascending: false })
            .limit(30),
            'Order refresh',
          );
        }

        if (bookingsQuery.error) throw bookingsQuery.error;
        if (isCancelled() || isStale()) return;

        const bookingData = (bookingsQuery.data ?? []) as BookingRow[];
        setBookingRows(bookingData);
        setLiveSections({
          booking: buildBookingSections(bookingData, language),
          order: ordersQuery.error ? buildOrderSections([]) : buildOrderSections((ordersQuery.data ?? []) as OrderRow[]),
        });
        setLastUpdatedAt(new Date().toISOString());

        if (ordersQuery.error) {
          setDataError(ordersQuery.error.message || 'Order queue could not be loaded.');
        }
      } catch (fetchError: any) {
        if (isCancelled() || isStale()) return;
        setDataError(fetchError?.message || 'Failed to load mobile ops data.');
      } finally {
        if (!isCancelled() && !isStale()) {
          setDataLoading(false);
        }
        if (!isStale()) {
          loadInFlightRef.current = false;
        }
      }
    }, [language]);

  useEffect(() => {
    if (authState !== 'authenticated') return;

    const cancelledRef = { current: false };

    loadLiveData(cancelledRef, { force: true });
    const intervalId = window.setInterval(() => {
      void loadLiveData(cancelledRef);
    }, REFRESH_INTERVAL_MS);

    return () => {
      cancelledRef.current = true;
      window.clearInterval(intervalId);
    };
  }, [authState, loadLiveData, language]);

  useEffect(() => {
    if (authState !== 'authenticated') {
      return;
    }

    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') {
        loadRequestIdRef.current += 1;
        loadInFlightRef.current = false;
        void loadLiveData(undefined, { force: true });
      }
    };

    const refreshOnFocus = () => {
      loadRequestIdRef.current += 1;
      loadInFlightRef.current = false;
      void loadLiveData(undefined, { force: true });
    };

    const refreshOnOnline = () => {
      loadRequestIdRef.current += 1;
      loadInFlightRef.current = false;
      void loadLiveData(undefined, { force: true });
    };

    document.addEventListener('visibilitychange', refreshIfVisible);
    window.addEventListener('focus', refreshOnFocus);
    window.addEventListener('pageshow', refreshOnFocus);
    window.addEventListener('online', refreshOnOnline);

    return () => {
      document.removeEventListener('visibilitychange', refreshIfVisible);
      window.removeEventListener('focus', refreshOnFocus);
      window.removeEventListener('pageshow', refreshOnFocus);
      window.removeEventListener('online', refreshOnOnline);
    };
  }, [authState, loadLiveData]);

  useEffect(() => {
    if (authState !== 'authenticated') {
      return;
    }

    const channel = supabase
      .channel('cms-pwa-bookings-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          void loadLiveData();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [authState, loadLiveData]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported');
      return;
    }

    setNotificationPermission(Notification.permission);
  }, [authState]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    navigator.serviceWorker.ready
      .then(async (registration) => {
        setServiceWorkerReady(true);
        const subscription = await registration.pushManager.getSubscription();
        setLocalSubscriptionReady(Boolean(subscription));
      })
      .catch(() => {
        setServiceWorkerReady(false);
      });
  }, []);

  useEffect(() => {
    updateBookingBadge(unhandedNewBookingRows.length);
  }, [unhandedNewBookingRows.length, updateBookingBadge]);

  useEffect(() => {
    if (authState !== 'authenticated' || notificationPermission !== 'granted' || pushSubscribed) {
      return;
    }

    void registerPushSubscription().catch((error) => {
      console.error('Push subscription failed:', error);
      const message = error instanceof Error ? error.message : String(error);
      setPushLastError(message);
      setDataError((current) => current || 'Push notifications could not be registered.');
    });
  }, [authState, notificationPermission, pushSubscribed, registerPushSubscription]);

  useEffect(() => {
    const handleScroll = () => {
      setHeaderMinimized(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (loginError) {
        setError(loginError.message || 'Login failed');
        setSubmitting(false);
        return;
      }

      if (data.user) {
        try {
          await supabase.rpc('account_profile_bootstrap');
        } catch {
          // Non-blocking.
        }

        const result = await resolveAdminSession();
        startTransition(() => {
          setAuthState(result.state);
          setUserEmail(result.email);
        });

        if (result.state !== 'authenticated') {
          setError('This account does not have admin access.');
        }
      }
    } catch (loginError: any) {
      setError(loginError?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthState('unauthenticated');
    setUserEmail('');
    updateBookingBadge(0);
  };

  const handleSelectTab = (tab: CmsPwaTab) => {
    const targetPath = tabPathMap[tab];
    setActiveTab(tab);
    setRouteState({ kind: 'cms', tab });
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  const handleBookingHandoff = async () => {
    if (handoffLoading) return;

    const now = Date.now();
    const targetIds = bookingRows
      .filter((booking) => {
        const status = (booking.status ?? 'confirmed').toLowerCase();
        if (status === 'cancelled' || status === BOOKING_STATUS_HANDOFF) {
          return false;
        }
        if (!booking.created_at) {
          return false;
        }
        const createdAt = new Date(booking.created_at).getTime();
        return Number.isFinite(createdAt) && now - createdAt <= 24 * 60 * 60 * 1000;
      })
      .map((booking) => booking.id);

    if (targetIds.length === 0) {
      setDataError('No new bookings available for handoff.');
      return;
    }

    setHandoffLoading(true);
    setDataError('');

    try {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: BOOKING_STATUS_HANDOFF })
        .in('id', targetIds);

      if (updateError) {
        throw updateError;
      }

      await loadLiveData();
    } catch (handoffError: any) {
      setDataError(handoffError?.message || 'Booking handoff failed.');
    } finally {
      setHandoffLoading(false);
    }
  };

  const handleEnableNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window) || enablingNotifications) {
      return;
    }

    setEnablingNotifications(true);
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        await registerPushSubscription();
      }
    } finally {
      setEnablingNotifications(false);
    }
  };

  const handleManualRefresh = () => {
    loadRequestIdRef.current += 1;
    loadInFlightRef.current = false;
    void loadLiveData(undefined, { force: true });
  };

  if (routeState.kind !== 'cms') {
    return <CmsPwaNotFound path={window.location.pathname} />;
  }

  if (authState === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#11141A] px-6 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#FF6B35]" />
          <p className="text-sm text-white/70">Checking mobile ops access...</p>
        </div>
      </div>
    );
  }

  if (authState === 'not-admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#11141A] px-6 text-white">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#141922] p-6 shadow-2xl">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
            <AlertCircle className="h-6 w-6 text-red-400" />
          </div>
          <h1 className="text-2xl font-semibold">Access denied</h1>
          <p className="mt-2 text-sm text-white/70">This account is signed in but does not have mobile ops access.</p>
          {userEmail ? <p className="mt-2 text-xs text-white/50">{userEmail}</p> : null}
          <button
            onClick={handleLogout}
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-medium text-[#11141A]"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[#11141A] text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
          <div className="mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#FF6B35] text-lg font-black text-[#11141A]">MA</div>
            <p className="mt-6 text-xs font-medium tracking-[0.04em] text-[#FF6B35]">PWA / CMS</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Mobile Ops</h1>
            <p className="mt-3 text-sm leading-6 text-white/65">Separate admin entry for Rescue, Booking, Order, and notifications.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 rounded-2xl border border-white/10 bg-[#141922] p-6 shadow-2xl">
            <div className="space-y-2">
              <label htmlFor="pwa-cms-email" className="text-sm text-white/75">Email</label>
              <input
                id="pwa-cms-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="h-12 w-full rounded-xl border border-white/10 bg-[#0D1016] px-4 text-base outline-none transition focus:border-[#FF6B35]"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="pwa-cms-password" className="text-sm text-white/75">Password</label>
              <input
                id="pwa-cms-password"
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="h-12 w-full rounded-xl border border-white/10 bg-[#0D1016] px-4 text-base outline-none transition focus:border-[#FF6B35]"
                autoComplete="current-password"
                required
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#FF6B35] px-4 text-sm font-semibold text-[#11141A] transition hover:bg-[#ff845a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Signing in...' : 'Sign in to Mobile Ops'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E1117] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-5">
        <CmsPwaHeader
          headerMinimized={headerMinimized}
          onLogout={handleLogout}
          language={language}
          setLanguage={setLanguage}
          diagnosticsStatus={diagnosticsStatus}
          onOpenDiagnostics={() => setDiagnosticsOpen(true)}
        />
        <CmsPwaSummary
          counts={counts}
          lastUpdatedAt={lastUpdatedAt}
          dataLoading={dataLoading}
          activeTab={activeTab}
          onBookingHandoff={handleBookingHandoff}
          handoffLoading={handoffLoading}
          activeBookingHandoffCount={activeBookingHandoffCount}
          onRefresh={handleManualRefresh}
        />
        <CmsPwaScreenState
          activeTab={activeTab}
          dataError={dataError}
          userEmail={userEmail}
        />

        {activeTab === 'tools' ? (
          <CmsPwaToolsList items={toolSections} />
        ) : (
          <section className="mt-4 space-y-5" aria-live="polite">
            {dataLoading && (activeTab === 'booking' || activeTab === 'order') ? (
              <div className="rounded-2xl border border-white/10 bg-[#141922] px-4 py-3 text-sm text-white/55">
                Refreshing {activeTab} queue...
              </div>
            ) : null}
            <CmsPwaSectionList sections={sections} />
          </section>
        )}
      </div>

      <CmsPwaTabBar
        activeTab={activeTab}
        counts={{ ...counts, booking: unhandedNewBookingRows.length }}
        onSelect={handleSelectTab}
      />

      {diagnosticsOpen ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/55 px-4 pb-4 pt-12">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#141922] p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Push diagnostics</p>
                <p className="mt-1 text-xs text-white/55">Current notification and subscription health on this device.</p>
              </div>
              <button
                type="button"
                onClick={() => setDiagnosticsOpen(false)}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-white/65">
              <span>Permission</span>
              <span className="text-right">{notificationPermission}</span>
              <span>Service worker</span>
              <span className="text-right">{serviceWorkerReady ? 'ready' : 'not ready'}</span>
              <span>Push supported</span>
              <span className="text-right">{typeof window !== 'undefined' && 'PushManager' in window ? 'yes' : 'no'}</span>
              <span>Local subscription</span>
              <span className="text-right">{localSubscriptionReady ? 'yes' : 'no'}</span>
              <span>Saved to backend</span>
              <span className="text-right">{pushSubscribed ? 'yes' : 'no'}</span>
            </div>

            {pushLastError ? (
              <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
                {pushLastError}
              </p>
            ) : null}

            <div className="mt-4 flex gap-2">
              {notificationPermission === 'default' ? (
                <button
                  type="button"
                  onClick={handleEnableNotifications}
                  disabled={enablingNotifications}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#FF6B35] px-3 py-2 text-xs font-semibold text-[#11141A] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enablingNotifications ? 'Enabling...' : 'Enable notifications'}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setPushLastError('');
                  setPushSubscribed(false);
                  setLocalSubscriptionReady(false);
                  setServiceWorkerReady(false);
                  void handleManualRefresh();
                  if (notificationPermission === 'granted') {
                    void registerPushSubscription().catch((error) => {
                      const message = error instanceof Error ? error.message : String(error);
                      setPushLastError(message);
                    });
                  }
                }}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white"
              >
                Re-run diagnostics
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function mountCmsPwaApp(root: HTMLElement) {
  createRoot(root).render(
    <LanguageProvider>
      <CmsPwaScreen />
    </LanguageProvider>
  );
}
