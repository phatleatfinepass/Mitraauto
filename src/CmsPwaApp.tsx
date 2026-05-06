import React, { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AlertCircle } from 'lucide-react';
import { supabase, getSupabaseConfigError } from './utils/supabase/client';
import { CmsPwaTabBar, type CmsPwaTab } from './components/cms-pwa/CmsPwaTabBar';
import { CmsPwaNotFound } from './components/cms-pwa/CmsPwaNotFound';
import { CmsPwaSectionList } from './components/cms-pwa/CmsPwaSectionList';
import { CmsPwaToolsList } from './components/cms-pwa/CmsPwaToolsList';
import { CmsPwaHeader } from './components/cms-pwa/CmsPwaHeader';
import { CmsPwaSummary } from './components/cms-pwa/CmsPwaSummary';
import { CmsPwaScreenState } from './components/cms-pwa/CmsPwaScreenState';
import { CmsPwaDiagnosticsSheet } from './components/cms-pwa/CmsPwaDiagnosticsSheet';
import { CMS_PWA_COPY } from './components/cms-pwa/copy';
import {
  BOOKING_STATUS_HANDOFF,
  buildBookingSections,
  buildOrderSections,
  isBookingAttentionItem,
  isMissingColumnError,
  REFRESH_INTERVAL_MS,
  rescueSections,
  resolveCmsPwaRoute,
  tabPathMap,
  toolSections,
} from './components/cms-pwa/data';
import { LanguageProvider, useLanguage } from './components/LanguageContext';
import type { AuthState, BookingRow, LiveSectionsState, LoginState, OrderRow } from './components/cms-pwa/types';

type CmsPwaAccessRow = {
  user_id?: string | null;
  email?: string | null;
  role?: string | null;
  account_status?: string | null;
  is_super_admin?: boolean | null;
};

function isCmsPwaStaffRole(role: string) {
  return role === 'super_admin' || role === 'admin' || role === 'supervisor' || role === 'staff';
}

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

  try {
    const { data: accessRows, error: accessError } = await withTimeout(
      supabase.rpc('cms_get_current_access'),
    );

    if (accessError) {
      throw accessError;
    }

    const access = (Array.isArray(accessRows) ? accessRows[0] : accessRows) as CmsPwaAccessRow | undefined;
    const accountStatus = String(access?.account_status ?? 'active');
    const role = String(access?.role ?? 'user');
    const isSuperAdmin = Boolean(access?.is_super_admin);
    const email = access?.email ?? session.user.email ?? '';

    if (accountStatus !== 'active' || !isCmsPwaStaffRole(role)) {
      return { state: 'not-admin' as const, email };
    }

    if (isSuperAdmin || role === 'admin') {
      return { state: 'authenticated' as const, email };
    }

    const permissionChecks = await withTimeout(
      Promise.all([
        supabase.rpc('cms_has_permission', { p_module: 'rescue', p_action: 'read' }),
        supabase.rpc('cms_has_permission', { p_module: 'schedule', p_action: 'read' }),
        supabase.rpc('cms_has_permission', { p_module: 'orders', p_action: 'read' }),
      ]),
    );

    const hasPwaAccess = permissionChecks.some(({ data, error }) => !error && data === true);

    return {
      state: hasPwaAccess ? ('authenticated' as const) : ('not-admin' as const),
      email,
    };
  } catch {
    return {
      state: 'unauthenticated' as const,
      email: '',
    };
  }
}

export function CmsPwaScreen() {
  const { language, setLanguage } = useLanguage();
  const copy = CMS_PWA_COPY[language];
  const route = resolveCmsPwaRoute(window.location.pathname);
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [userEmail, setUserEmail] = useState('');
  const [form, setForm] = useState<LoginState>({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<CmsPwaTab>(route.kind === 'cms' ? route.tab : 'rescue');
  const [routeState, setRouteState] = useState(route);
  const [liveSections, setLiveSections] = useState<LiveSectionsState>({
    booking: buildBookingSections([], language),
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
  const authStateRef = useRef<AuthState>('loading');
  const hadAuthenticatedSessionRef = useRef(false);

  const activeTitle =
    activeTab === 'rescue'
      ? copy.rescueTitle
      : activeTab === 'booking'
        ? copy.bookingTitle
        : activeTab === 'order'
          ? copy.orderTitle
          : copy.toolsTitle;

  const configError = useMemo(() => getSupabaseConfigError(), []);

  useEffect(() => {
    authStateRef.current = authState;
    if (authState === 'authenticated') {
      hadAuthenticatedSessionRef.current = true;
    }
  }, [authState]);

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
  const bookingAttentionCount = useMemo(() => {
    return bookingRows.filter((booking) => isBookingAttentionItem(booking)).length;
  }, [bookingRows]);
  const rescueAttentionCount = useMemo(() => {
    return 0;
  }, []);
  const orderAttentionCount = useMemo(() => {
    return 0;
  }, []);
  const appBadgeCount = useMemo(() => {
    return bookingAttentionCount + rescueAttentionCount + orderAttentionCount;
  }, [bookingAttentionCount, rescueAttentionCount, orderAttentionCount]);

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
        if (authStateRef.current === 'loading') {
          setAuthState('unauthenticated');
          setUserEmail('');
        }
        setError(sessionError?.message || 'Could not verify mobile ops access.');
      }
    };

    syncSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      if (!session?.user) {
        setAuthState('unauthenticated');
        setUserEmail('');
        setPushSubscribed(false);
        if (hadAuthenticatedSessionRef.current) {
          setError('Your session ended on this device. It may have been replaced by another login or revoked. Please sign in again.');
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

  const forceRefreshLiveData = useCallback((cancelledRef?: { current: boolean }) => {
    loadRequestIdRef.current += 1;
    loadInFlightRef.current = false;
    return loadLiveData(cancelledRef, { force: true });
  }, [loadLiveData]);

  useEffect(() => {
    if (authState !== 'authenticated') return;

    const cancelledRef = { current: false };

    forceRefreshLiveData(cancelledRef);
    const intervalId = window.setInterval(() => {
      void forceRefreshLiveData(cancelledRef);
    }, REFRESH_INTERVAL_MS);

    return () => {
      cancelledRef.current = true;
      window.clearInterval(intervalId);
    };
  }, [authState, forceRefreshLiveData, language]);

  useEffect(() => {
    if (authState !== 'authenticated') {
      return;
    }

    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') {
        void forceRefreshLiveData();
      }
    };

    const refreshOnFocus = () => {
      void forceRefreshLiveData();
    };

    const refreshOnOnline = () => {
      void forceRefreshLiveData();
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
  }, [authState, forceRefreshLiveData]);

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
          void forceRefreshLiveData();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [authState, forceRefreshLiveData]);

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
    updateBookingBadge(appBadgeCount);
  }, [appBadgeCount, updateBookingBadge]);

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

    const targetIds = bookingRows
      .filter((booking) => isBookingAttentionItem(booking))
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

      await forceRefreshLiveData();
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
    void forceRefreshLiveData();
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
    <div className="app-shell min-h-[100dvh] bg-[#0b0f16] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-5">
        <CmsPwaHeader
          headerMinimized={headerMinimized}
          onLogout={handleLogout}
          language={language}
          setLanguage={setLanguage}
          diagnosticsStatus={diagnosticsStatus}
          onOpenDiagnostics={() => setDiagnosticsOpen(true)}
          copy={copy}
          activeTitle={activeTitle}
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
          copy={copy}
        />
        <CmsPwaScreenState
          activeTab={activeTab}
          dataError={dataError}
          userEmail={userEmail}
          copy={copy}
        />

        {activeTab === 'tools' ? (
          <CmsPwaToolsList items={toolSections} />
        ) : (
          <section className="mt-4 space-y-5" aria-live="polite">
            {dataLoading && (activeTab === 'booking' || activeTab === 'order') ? (
              <div className="rounded-2xl border border-white/10 bg-[#141922] px-4 py-3 text-sm text-white/55">
                {copy.refreshingQueue}
              </div>
            ) : null}
            <CmsPwaSectionList sections={sections} emptyLabel={copy.noItems} />
          </section>
        )}
      </div>

      <CmsPwaTabBar
        activeTab={activeTab}
        counts={{ ...counts, booking: bookingAttentionCount }}
        onSelect={handleSelectTab}
      />

      <CmsPwaDiagnosticsSheet
        open={diagnosticsOpen}
        copy={copy}
        notificationPermission={notificationPermission}
        serviceWorkerReady={serviceWorkerReady}
        localSubscriptionReady={localSubscriptionReady}
        pushSubscribed={pushSubscribed}
        pushLastError={pushLastError}
        enablingNotifications={enablingNotifications}
        pushSupported={typeof window !== 'undefined' && 'PushManager' in window}
        onClose={() => setDiagnosticsOpen(false)}
        onEnableNotifications={handleEnableNotifications}
        onRerunDiagnostics={() => {
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
      />
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
