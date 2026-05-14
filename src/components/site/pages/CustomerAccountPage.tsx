import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { CalendarClock, Car, Gift, History, LogIn, LogOut, MailCheck, RefreshCw, Wrench } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { getSupabaseClient } from '../../../utils/supabase/client';

const CUSTOMER_PASSWORD_SETUP_PARAMS_KEY = 'mitra.customer.password-setup.params.v1';

type CustomerPortalPayload = {
  customer?: {
    id?: string;
    full_name?: string;
    primary_email?: string;
    primary_phone?: string;
    customer_type?: string;
    language?: string;
    marketing_consent?: boolean | null;
    contact_consent?: boolean | null;
  };
  vehicles?: Array<{
    id: string;
    license_plate?: string;
    vehicle_name?: string;
    vin?: string;
  }>;
  appointments?: Array<Record<string, any>>;
  next_appointment?: Record<string, any> | null;
  next_appointment_day?: string | null;
  next_possible_service_date?: string | null;
  pickup_schedule?: Array<Record<string, any>>;
  benefits?: {
    points_balance?: number;
    lifetime_points?: number;
    tier?: string;
    discount_percent?: number;
    updated_at?: string | null;
  };
  benefit_events?: Array<Record<string, any>>;
  service_book?: Array<Record<string, any>>;
  maintenance_reminders?: Array<Record<string, any>>;
  notification_history?: Array<Record<string, any>>;
};

type CustomerAccountPageProps = {
  onLoginNeeded: () => void;
  onNavigateHome: () => void;
};

function getCustomerPasswordSetupParams() {
  if (typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
  const read = (key: string) => hash.get(key) || url.searchParams.get(key) || '';
  const accessToken = read('access_token');
  const refreshToken = read('refresh_token');
  const expiresIn = read('expires_in');
  const tokenType = read('token_type');
  const code = read('code');
  const tokenHash = read('token_hash');
  const type = read('type') || 'recovery';
  const params = {
    accessToken,
    refreshToken,
    expiresIn,
    tokenType,
    code,
    tokenHash,
    type,
    hasImplicitSession: Boolean(accessToken && refreshToken && expiresIn && tokenType),
  };

  if (params.hasImplicitSession || params.code || params.tokenHash) {
    window.sessionStorage.setItem(CUSTOMER_PASSWORD_SETUP_PARAMS_KEY, JSON.stringify({ ...params, savedAt: Date.now() }));
    return params;
  }

  const saved = window.sessionStorage.getItem(CUSTOMER_PASSWORD_SETUP_PARAMS_KEY);
  if (!saved) return params;

  try {
    const parsed = JSON.parse(saved);
    if (!parsed?.savedAt || Date.now() - Number(parsed.savedAt) > 1000 * 60 * 30) {
      window.sessionStorage.removeItem(CUSTOMER_PASSWORD_SETUP_PARAMS_KEY);
      return params;
    }

    const savedAccessToken = String(parsed.accessToken ?? '');
    const savedRefreshToken = String(parsed.refreshToken ?? '');
    const savedExpiresIn = String(parsed.expiresIn ?? '');
    const savedTokenType = String(parsed.tokenType ?? '');
    return {
      accessToken: savedAccessToken,
      refreshToken: savedRefreshToken,
      expiresIn: savedExpiresIn,
      tokenType: savedTokenType,
      code: String(parsed.code ?? ''),
      tokenHash: String(parsed.tokenHash ?? ''),
      type: String(parsed.type ?? 'recovery') || 'recovery',
      hasImplicitSession: Boolean(savedAccessToken && savedRefreshToken && savedExpiresIn && savedTokenType),
    };
  } catch {
    window.sessionStorage.removeItem(CUSTOMER_PASSWORD_SETUP_PARAMS_KEY);
    return params;
  }
}

function hasCustomerPasswordSetupLink() {
  const params = getCustomerPasswordSetupParams();
  return Boolean(params?.hasImplicitSession || params?.code || params?.tokenHash);
}

function text(value: unknown, fallback = '') {
  return String(value ?? fallback).trim();
}

function formatDate(value: unknown) {
  const raw = text(value);
  if (!raw) return 'Not scheduled';
  const date = new Date(raw.includes('T') ? raw : `${raw}T00:00:00`);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function formatTime(value: unknown) {
  const raw = text(value);
  return raw ? raw.slice(0, 5) : '';
}

function formatMoney(cents: unknown) {
  const value = Number(cents ?? 0);
  if (!Number.isFinite(value) || value <= 0) return '';
  return new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR' }).format(value / 100);
}

function vehicleLabel(vehicles: CustomerPortalPayload['vehicles'], vehicleId: unknown, fallbackPlate?: unknown) {
  const id = text(vehicleId);
  const vehicle = vehicles?.find((item) => item.id === id);
  if (vehicle) {
    return [vehicle.license_plate, vehicle.vehicle_name].map(text).filter(Boolean).join(' - ');
  }
  return text(fallbackPlate);
}

export function CustomerAccountPage({ onLoginNeeded, onNavigateHome }: CustomerAccountPageProps) {
  const [payload, setPayload] = useState<CustomerPortalPayload | null>(null);
  const [sessionEmail, setSessionEmail] = useState('');
  const [marketingConsent, setMarketingConsent] = useState<boolean | null>(null);
  const [contactConsent, setContactConsent] = useState<boolean | null>(null);
  const [preferenceSaving, setPreferenceSaving] = useState(false);
  const [preferenceMessage, setPreferenceMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirm, setSetupConfirm] = useState('');
  const [setupSaving, setSetupSaving] = useState(false);
  const [setupMode, setSetupMode] = useState(() => hasCustomerPasswordSetupLink());

  const vehicles = payload?.vehicles ?? [];
  const appointments = payload?.appointments ?? [];
  const pickups = payload?.pickup_schedule ?? [];
  const serviceBook = payload?.service_book ?? [];
  const reminders = payload?.maintenance_reminders ?? [];
  const notificationHistory = payload?.notification_history ?? [];
  const benefitEvents = payload?.benefit_events ?? [];
  const benefits = payload?.benefits ?? {};

  const customerName = text(payload?.customer?.full_name, sessionEmail || 'Customer');
  const nextAppointment = payload?.next_appointment;
  const nextPossibleServiceDate = payload?.next_possible_service_date;

  const visibleServiceBook = useMemo(() => serviceBook.slice(0, 8), [serviceBook]);

  const loadAccount = async () => {
    setLoading(true);
    setError('');

    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      setSessionEmail(session?.user?.email ?? '');

      if (!session?.user) {
        setPayload(null);
        setLoading(false);
        return;
      }

      const { data, error: rpcError } = await supabase.rpc('customer_portal_get_account');
      if (rpcError) throw rpcError;
      const nextPayload = (data ?? {}) as CustomerPortalPayload;
      setPayload(nextPayload);
      const { data: preferences } = await supabase.rpc('customer_portal_get_preferences');
      setMarketingConsent(typeof preferences?.marketing_consent === 'boolean' ? preferences.marketing_consent : null);
      setContactConsent(typeof preferences?.contact_consent === 'boolean' ? preferences.contact_consent : null);
    } catch (err: any) {
      setPayload(null);
      setError(err.message ?? 'Customer account could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const ensurePasswordSetupSession = async () => {
    const supabase = getSupabaseClient();
    const { data: currentSession } = await supabase.auth.getSession();
    if (currentSession.session?.user) return true;

    const setupParams = getCustomerPasswordSetupParams();
    if (!setupParams) return false;

    if (setupParams.hasImplicitSession) {
      const { data, error: sessionError } = await supabase.auth.setSession({
        access_token: setupParams.accessToken,
        refresh_token: setupParams.refreshToken,
      });
      if (sessionError) throw sessionError;
      return Boolean(data.session?.user);
    }

    if (setupParams.code) {
      const { data, error: codeError } = await supabase.auth.exchangeCodeForSession(setupParams.code);
      if (codeError) throw codeError;
      return Boolean(data.session?.user);
    }

    if (setupParams.tokenHash) {
      const { data, error: tokenError } = await supabase.auth.verifyOtp({
        token_hash: setupParams.tokenHash,
        type: setupParams.type === 'invite' ? 'invite' : 'recovery',
      });
      if (tokenError) throw tokenError;
      return Boolean(data.session?.user);
    }

    return false;
  };

  const saveSetupPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (setupSaving) return;
    setError('');

    if (setupPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (setupPassword !== setupConfirm) {
      setError('Passwords do not match.');
      return;
    }

    setSetupSaving(true);

    try {
      const supabase = getSupabaseClient();
      const hasSession = await ensurePasswordSetupSession();
      if (!hasSession) {
        setError('Customer portal setup session is missing. Open the newest activation link and try again.');
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: setupPassword });
      if (updateError) throw updateError;

      window.sessionStorage.removeItem(CUSTOMER_PASSWORD_SETUP_PARAMS_KEY);
      setSetupPassword('');
      setSetupConfirm('');
      setSetupMode(false);
      if (typeof window !== 'undefined') {
        window.history.replaceState(window.history.state, '', '/account');
      }
      await loadAccount();
    } catch (err: any) {
      setError(err.message ?? 'Customer portal password setup failed.');
    } finally {
      setSetupSaving(false);
    }
  };

  useEffect(() => {
    let subscription: any = null;
    const supabase = getSupabaseClient();

    if (setupMode) {
      setLoading(false);
    } else {
      void loadAccount();
    }

    const { data } = supabase.auth.onAuthStateChange(() => {
      if (!setupMode) void loadAccount();
    });
    subscription = data.subscription;

    return () => {
      subscription?.unsubscribe();
    };
    // loadAccount intentionally reads current session and RPC state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setupMode]);

  const signOut = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut({ scope: 'local' });
    setPayload(null);
    setSessionEmail('');
    onNavigateHome();
  };

  const savePreferences = async () => {
    setPreferenceSaving(true);
    setPreferenceMessage('');

    try {
      const supabase = getSupabaseClient();
      const { data, error: rpcError } = await supabase.rpc('customer_portal_update_preferences', {
        p_marketing_consent: marketingConsent,
        p_contact_consent: contactConsent,
      });
      if (rpcError) throw rpcError;
      setMarketingConsent(typeof data?.marketing_consent === 'boolean' ? data.marketing_consent : marketingConsent);
      setContactConsent(typeof data?.contact_consent === 'boolean' ? data.contact_consent : contactConsent);
      setPreferenceMessage('Preferences saved.');
    } catch (err: any) {
      setPreferenceMessage(err.message ?? 'Preferences could not be saved.');
    } finally {
      setPreferenceSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background py-16">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="h-40 animate-pulse rounded-lg border bg-muted/30" />
        </div>
      </main>
    );
  }

  if (setupMode) {
    return (
      <main className="min-h-screen bg-background py-16">
        <div className="container mx-auto max-w-md px-6">
          <Card>
            <CardContent className="p-6">
              <Badge variant="outline" className="mb-3">Customer portal</Badge>
              <h1 className="text-3xl font-semibold tracking-tight">Set password</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Create a password to open your Mitra Auto customer portal.
              </p>
              <form onSubmit={saveSetupPassword} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">New password</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={setupPassword}
                    onChange={(event) => setSetupPassword(event.target.value)}
                    className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm password</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={setupConfirm}
                    onChange={(event) => setSetupConfirm(event.target.value)}
                    className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                    required
                  />
                </div>
                {error ? <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}
                <Button type="submit" disabled={setupSaving} className="w-full">
                  {setupSaving ? 'Saving...' : 'Save password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (!sessionEmail) {
    return (
      <main className="min-h-screen bg-background py-16">
        <div className="container mx-auto max-w-3xl px-6">
          <div className="rounded-lg border bg-card p-8 text-center">
            <LogIn className="mx-auto mb-4 h-8 w-8 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight">Customer Account</h1>
            <p className="mt-3 text-muted-foreground">
              Sign in with the email address linked to your Mitra Auto customer account.
            </p>
            <Button className="mt-6" onClick={onLoginNeeded}>
              Sign in
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background py-16">
        <div className="container mx-auto max-w-3xl px-6">
          <div className="rounded-lg border bg-card p-8">
            <h1 className="text-3xl font-semibold tracking-tight">Customer Account</h1>
            <p className="mt-3 text-destructive">{error}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button onClick={loadAccount}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
              <Button variant="outline" onClick={signOut}>
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-10">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge variant="outline" className="mb-3">Customer account</Badge>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{customerName}</h1>
            <p className="mt-2 text-muted-foreground">{payload?.customer?.primary_email || sessionEmail}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={loadAccount}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="ghost" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>

        <section className="grid gap-3 py-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <CalendarClock className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">Next appointment</p>
              <p className="mt-1 font-semibold">{formatDate(payload?.next_appointment_day)}</p>
              <p className="text-xs text-muted-foreground">{formatTime(nextAppointment?.booking_time)} {text(nextAppointment?.service_name)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Wrench className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">Next possible service</p>
              <p className="mt-1 font-semibold">{formatDate(nextPossibleServiceDate)}</p>
              <p className="text-xs text-muted-foreground">Based on bookings and reminders</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Gift className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">Benefits</p>
              <p className="mt-1 font-semibold capitalize">{text(benefits.tier, 'bronze')} - {Number(benefits.discount_percent ?? 0)}%</p>
              <p className="text-xs text-muted-foreground">{Number(benefits.points_balance ?? 0)} points</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Car className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">Vehicles</p>
              <p className="mt-1 font-semibold">{vehicles.length}</p>
              <p className="text-xs text-muted-foreground">{vehicles.map((vehicle) => vehicle.license_plate).filter(Boolean).slice(0, 2).join(', ')}</p>
            </CardContent>
          </Card>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <section className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Appointments</h2>
              </div>
              {appointments.length === 0 ? (
                <p className="rounded-lg border p-4 text-sm text-muted-foreground">No upcoming appointments.</p>
              ) : appointments.map((appointment) => (
                <div key={text(appointment.id)} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{text(appointment.service_name, 'Service appointment')}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(appointment.booking_date)} {formatTime(appointment.booking_time)}
                      </p>
                    </div>
                    <Badge variant="outline">{text(appointment.status, 'scheduled')}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {vehicleLabel(vehicles, appointment.customer_vehicle_id, appointment.license_plate)}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Digital service book</h2>
              </div>
              {visibleServiceBook.length === 0 ? (
                <p className="rounded-lg border p-4 text-sm text-muted-foreground">No service book entries are visible yet.</p>
              ) : visibleServiceBook.map((entry) => (
                <div key={text(entry.id)} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{text(entry.title, 'Service entry')}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(entry.work_date)} {entry.mileage_km ? `- ${entry.mileage_km} km` : ''}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">{text(entry.entry_type, 'service')}</Badge>
                  </div>
                  {entry.description ? <p className="mt-2 whitespace-pre-wrap text-sm">{text(entry.description)}</p> : null}
                  <p className="mt-2 text-sm text-muted-foreground">
                    {vehicleLabel(vehicles, entry.customer_vehicle_id)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Customer benefits</h2>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Current tier</p>
                <p className="mt-1 text-2xl font-semibold capitalize">{text(benefits.tier, 'bronze')}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {Number(benefits.points_balance ?? 0)} points - {Number(benefits.discount_percent ?? 0)}% discount
                </p>
              </div>
              {benefitEvents.slice(0, 4).map((event, index) => (
                <div key={`${text(event.created_at)}-${index}`} className="rounded-lg border px-3 py-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <span>{text(event.reason, 'Benefit update')}</span>
                    <span className={Number(event.points_delta ?? 0) >= 0 ? 'text-emerald-600' : 'text-destructive'}>
                      {Number(event.points_delta ?? 0) >= 0 ? '+' : ''}{Number(event.points_delta ?? 0)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDate(event.created_at)}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Reminders</h2>
              </div>
              {reminders.length === 0 ? (
                <p className="rounded-lg border p-4 text-sm text-muted-foreground">No active reminders.</p>
              ) : reminders.slice(0, 6).map((reminder) => (
                <div key={text(reminder.id)} className="rounded-lg border p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{text(reminder.title, 'Reminder')}</span>
                    <Badge variant="outline" className="capitalize">{text(reminder.status, 'active')}</Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {formatDate(reminder.due_date)} {reminder.due_mileage_km ? `- ${reminder.due_mileage_km} km` : ''}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {vehicleLabel(vehicles, reminder.customer_vehicle_id)}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MailCheck className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Messages</h2>
              </div>
              {notificationHistory.length === 0 ? (
                <p className="rounded-lg border p-4 text-sm text-muted-foreground">No customer messages yet.</p>
              ) : notificationHistory.slice(0, 5).map((message, index) => (
                <div key={`${text(message.created_at)}-${index}`} className="rounded-lg border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{text(message.subject, text(message.notification_type, 'Message'))}</span>
                    <Badge variant="outline" className="capitalize">{text(message.status)}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(message.sent_at || message.created_at)}</p>
                </div>
              ))}
            </div>

            {pickups.length ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Pickup</h2>
                </div>
                {pickups.slice(0, 4).map((pickup) => (
                  <div key={text(pickup.id)} className="rounded-lg border p-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{text(pickup.item_label, 'Order')}</span>
                      <Badge variant="outline" className="capitalize">{text(pickup.fulfillment_status, pickup.status)}</Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground">{formatMoney(pickup.total_cents)} {formatDate(pickup.created_at)}</p>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MailCheck className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Communication preferences</h2>
              </div>
              <div className="rounded-lg border p-4 text-sm">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={marketingConsent === true}
                    onChange={(event) => setMarketingConsent(event.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium">Marketing and benefit messages</span>
                    <span className="text-muted-foreground">Offers, benefit campaigns, and optional customer messages.</span>
                  </span>
                </label>
                <label className="mt-4 flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={contactConsent === true}
                    onChange={(event) => setContactConsent(event.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium">General contact permission</span>
                    <span className="text-muted-foreground">Non-urgent contact related to the customer relationship.</span>
                  </span>
                </label>
                <p className="mt-4 text-xs text-muted-foreground">
                  Necessary service messages, such as bookings, safety, payment, pickup, and service-critical reminders, may still be sent when required for service delivery.
                </p>
                <Button className="mt-4" size="sm" onClick={savePreferences} disabled={preferenceSaving}>
                  {preferenceSaving ? 'Saving...' : 'Save preferences'}
                </Button>
                {preferenceMessage ? <p className="mt-2 text-xs text-muted-foreground">{preferenceMessage}</p> : null}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
