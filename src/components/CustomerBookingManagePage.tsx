import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  CircleAlert,
  Loader2,
  Mail,
  Phone,
  StickyNote,
  UserRound,
  XCircle,
} from 'lucide-react';
import { getSupabaseClient } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { normalizeFinnishPhone, normalizeFinnishPhoneInput } from '../utils/phone';

type ManageMode = 'view' | 'edit' | 'cancel' | 'complete';

type RawManagedBooking = Record<string, unknown> & {
  id?: string;
  status?: string;
  bookingLanguage?: 'fi' | 'en';
  booking_language?: 'fi' | 'en';
  bookingDate?: string;
  booking_date?: string;
  bookingTime?: string;
  booking_time?: string;
  bookingEndTime?: string;
  booking_end_time?: string;
  licensePlate?: string;
  license_plate?: string;
  serviceName?: string;
  service_name?: string;
  customerName?: string;
  customer_name?: string;
  customerPhone?: string;
  customer_phone?: string;
  customerEmail?: string;
  customer_email?: string;
  notes?: string;
  cancellationNote?: string;
  cancellation_note?: string;
  manageTokenExpiresAt?: string | null;
  manage_token_expires_at?: string | null;
  canManage?: boolean;
  can_manage?: boolean;
};

type ManagedBooking = {
  id: string;
  status: string;
  bookingLanguage: 'fi' | 'en';
  bookingDate: string;
  bookingTime: string;
  bookingEndTime: string;
  licensePlate: string;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes: string;
  cancellationNote: string;
  manageTokenExpiresAt: string | null;
  canManage: boolean;
};

type ManageFields = {
  licensePlate: string;
  customerPhone: string;
  customerEmail: string;
  notes: string;
};

interface CustomerBookingManagePageProps {
  onNavigateHome: () => void;
}

function readStringValue(raw: RawManagedBooking, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return fallback;
}

function readBooleanValue(raw: RawManagedBooking, keys: string[], fallback = false) {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === 'boolean') {
      return value;
    }
  }

  return fallback;
}

function normalizeBooking(raw: RawManagedBooking): ManagedBooking | null {
  const id = readStringValue(raw, ['id']);
  if (!id) return null;

  const status = readStringValue(raw, ['status'], 'confirmed');
  const licensePlate = readStringValue(raw, ['licensePlate', 'license_plate']);
  const serviceName = readStringValue(raw, ['serviceName', 'service_name']);
  const customerName = readStringValue(raw, ['customerName', 'customer_name']);
  const customerPhone = readStringValue(raw, ['customerPhone', 'customer_phone']);
  const customerEmail = readStringValue(raw, ['customerEmail', 'customer_email']);
  const notes = readStringValue(raw, ['notes']);
  const cancellationNote = readStringValue(raw, ['cancellationNote', 'cancellation_note']);

  return {
    id,
    status,
    bookingLanguage: readStringValue(raw, ['bookingLanguage', 'booking_language'], 'fi') === 'en' ? 'en' : 'fi',
    bookingDate: readStringValue(raw, ['bookingDate', 'booking_date']),
    bookingTime: readStringValue(raw, ['bookingTime', 'booking_time']),
    bookingEndTime: readStringValue(raw, ['bookingEndTime', 'booking_end_time']),
    licensePlate,
    serviceName,
    customerName,
    customerPhone,
    customerEmail,
    notes,
    cancellationNote,
    manageTokenExpiresAt: readStringValue(raw, ['manageTokenExpiresAt', 'manage_token_expires_at']) || null,
    canManage: readBooleanValue(raw, ['canManage', 'can_manage'], status.toLowerCase() !== 'cancelled'),
  };
}

function getInitialManageState() {
  if (typeof window === 'undefined') {
    return {
      token: '',
      mode: 'view' as ManageMode,
      hasExplicitMode: false,
      languageHint: 'fi' as 'fi' | 'en',
    };
  }

  const params = new URLSearchParams(window.location.search);
  const modeParam = params.get('mode');
  const parsedMode: ManageMode =
    modeParam === 'edit' || modeParam === 'cancel' || modeParam === 'complete' || modeParam === 'view'
      ? modeParam
      : 'view';

  return {
    token: sanitizeManageToken(params.get('token') ?? ''),
    mode: parsedMode,
    hasExplicitMode: params.has('mode'),
    languageHint: window.location.pathname.startsWith('/en/') ? 'en' as const : 'fi' as const,
  };
}

function sanitizeManageToken(value: string) {
  const trimmed = value.trim();
  const exactHexToken = trimmed.match(/^[a-f0-9]{48}$/i);
  if (exactHexToken) return exactHexToken[0].toLowerCase();

  const embeddedHexToken = trimmed.match(/[a-f0-9]{48}/i);
  return embeddedHexToken ? embeddedHexToken[0].toLowerCase() : trimmed;
}

function syncManageUrl(token: string, mode: ManageMode) {
  if (typeof window === 'undefined') return;

  const nextUrl = new URL(window.location.href);
  const cleanToken = sanitizeManageToken(token);
  if (cleanToken) {
    nextUrl.searchParams.set('token', cleanToken);
  } else {
    nextUrl.searchParams.delete('token');
  }
  nextUrl.searchParams.set('mode', mode);
  window.history.replaceState(window.history.state, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
}

async function getInvokeErrorMessage(error: unknown, fallback: string) {
  const context = (error as { context?: unknown })?.context;
  if (context instanceof Response) {
    try {
      const payload = await context.clone().json();
      if (typeof payload?.error === 'string' && payload.error.trim()) {
        return payload.error;
      }
      if (typeof payload?.message === 'string' && payload.message.trim()) {
        return payload.message;
      }
    } catch {
      try {
        const text = await context.clone().text();
        if (text.trim()) return text.trim();
      } catch {
        // Keep the original fallback when the response body cannot be read.
      }
    }
  }

  const message = (error as { message?: unknown })?.message;
  return typeof message === 'string' && message.trim() ? message : fallback;
}

function formatBookingWindow(booking: ManagedBooking, locale: string) {
  if (!booking.bookingDate || !booking.bookingTime) return '';

  const dateLabel = new Date(`${booking.bookingDate}T12:00:00`).toLocaleDateString(locale, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return `${dateLabel} · ${booking.bookingTime}${booking.bookingEndTime ? ` - ${booking.bookingEndTime}` : ''}`;
}

function getStatusMeta(status: string, language: 'fi' | 'en') {
  const normalized = status.toLowerCase();

  if (normalized === 'cancelled' || normalized === 'canceled') {
    return {
      label: language === 'fi' ? 'Peruttu' : 'Cancelled',
      variant: 'destructive' as const,
    };
  }

  if (normalized === 'pending' || normalized === 'awaiting_customer') {
    return {
      label: language === 'fi' ? 'Odottaa vahvistusta' : 'Awaiting confirmation',
      variant: 'secondary' as const,
    };
  }

  return {
    label: language === 'fi' ? 'Vahvistettu' : 'Confirmed',
    variant: 'secondary' as const,
  };
}

function getMissingManageFields(booking: ManagedBooking) {
  const missing: Array<keyof ManageFields> = [];

  if (!booking.licensePlate.trim()) missing.push('licensePlate');
  if (!booking.customerPhone.trim()) missing.push('customerPhone');
  if (!booking.customerEmail.trim()) missing.push('customerEmail');

  return missing;
}

function ManageField({
  id,
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  type = 'text',
  autoComplete,
  inputMode,
  optional,
  description,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
  type?: string;
  autoComplete?: string;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>['inputMode'];
  optional?: boolean;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-2">
        {label}
        {optional ? <span className="text-xs text-muted-foreground">({description})</span> : null}
      </Label>
      <div className="relative">
        {Icon ? <Icon className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /> : null}
        <Input
          id={id}
          type={type}
          autoComplete={autoComplete}
          inputMode={inputMode}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={Icon ? 'pl-10' : undefined}
        />
      </div>
    </div>
  );
}

function ManageNotesField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-2">
        <StickyNote className="h-4 w-4 text-muted-foreground" />
        {label}
      </Label>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
      />
    </div>
  );
}

export function CustomerBookingManagePage({ onNavigateHome }: CustomerBookingManagePageProps) {
  const initial = useMemo(() => getInitialManageState(), []);

  const [tokenInput, setTokenInput] = useState(initial.token);
  const [bookingToken, setBookingToken] = useState(initial.token);
  const [mode, setMode] = useState<ManageMode>(initial.mode);
  const [booking, setBooking] = useState<ManagedBooking | null>(null);
  const [loading, setLoading] = useState(Boolean(initial.token));
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cancellationNote, setCancellationNote] = useState('');
  const [form, setForm] = useState<ManageFields>({
    licensePlate: '',
    customerPhone: '',
    customerEmail: '',
    notes: '',
  });

  const language = booking?.bookingLanguage ?? initial.languageHint;
  const locale = language === 'fi' ? 'fi-FI' : 'en-US';
  const explicitModeProvided = initial.hasExplicitMode;

  const copy = useMemo(() => {
    return language === 'fi'
      ? {
          title: 'Hallitse varaustasi',
          subtitle: 'Tarkista aika, täydennä vain puuttuvat tiedot tai peruuta varaus.',
          secureAccess: 'Suojattu hallintalinki',
          secureDescription: 'Avataan varausta...',
          tokenMissing: 'Avaa tämä sivu sähköpostissa olevasta varauslinkistä.',
          tokenLabel: 'Varauslinkin token',
          tokenPlaceholder: 'Liitä sähköpostissa saatu token',
          loadBooking: 'Avaa varaus',
          loading: 'Avataan...',
          invalidToken: 'Hallintalinkki on virheellinen tai vanhentunut.',
          service: 'Palvelu',
          missingFieldsTitle: 'Puuttuvat tiedot',
          cancelWarning: 'Peruutus on lopullinen. Voit jättää vapaaehtoisen syyn ennen vahvistusta.',
          reasonLabel: 'Peruutuksen syy',
          confirmCancel: 'Vahvista peruutus',
          cancelling: 'Perutaan...',
          saveChanges: 'Tallenna muutokset',
          editDetails: 'Muokkaa tietoja',
          saving: 'Tallennetaan...',
          completeDetails: 'Vahvista tiedot',
          backHome: 'Takaisin etusivulle',
          backToSummary: 'Takaisin yhteenvetoon',
          cancelBooking: 'Peruuta varaus',
          missingLicensePlate: 'Rekisterinumero',
          missingPhone: 'Puhelinnumero',
          missingEmail: 'Sähköposti',
          notes: 'Lisätiedot',
          licensePlate: 'Rekisterinumero',
          phone: 'Puhelin',
          email: 'Sähköposti',
          cancelled: 'Tämä varaus on jo peruttu.',
          updatedSuccess: 'Varaus päivitettiin. Päivitetty kalenterikutsu lähetettiin sähköpostiin.',
          completedSuccess: 'Tiedot vahvistettiin. Päivitetty kalenterikutsu lähetettiin sähköpostiin.',
          cancelledSuccess: 'Varaus peruttiin ja peruutusviesti lähetettiin sähköpostiin.',
          summaryHint: 'Ei lisätietoja.',
          bookingReady: 'Varauksen tiedot ovat valmiit.',
          vehicle: 'Ajoneuvo',
          customer: 'Asiakas',
          noVehicle: 'Ei rekisterinumeroa',
        }
      : {
          title: 'Manage your booking',
          subtitle: 'Check the appointment, complete only missing details, or cancel it.',
          secureAccess: 'Secure manage link',
          secureDescription: 'Opening your booking...',
          tokenMissing: 'Open this page from the booking link in your email.',
          tokenLabel: 'Booking token',
          tokenPlaceholder: 'Paste the token from your email',
          loadBooking: 'Open booking',
          loading: 'Opening...',
          invalidToken: 'The management link is invalid or expired.',
          service: 'Service',
          missingFieldsTitle: 'Missing details',
          cancelWarning: 'Cancellation is final. You can optionally leave a reason before confirming.',
          reasonLabel: 'Cancellation reason',
          confirmCancel: 'Confirm cancellation',
          cancelling: 'Cancelling...',
          saveChanges: 'Save changes',
          saving: 'Saving...',
          completeDetails: 'Confirm details',
          backHome: 'Back to home',
          backToSummary: 'Back to summary',
          cancelBooking: 'Cancel booking',
          missingLicensePlate: 'License plate',
          missingPhone: 'Phone',
          missingEmail: 'Email',
          notes: 'Notes',
          licensePlate: 'License plate',
          phone: 'Phone',
          email: 'Email',
          cancelled: 'This booking has already been cancelled.',
          updatedSuccess: 'Booking updated. A refreshed calendar invite was emailed to you.',
          completedSuccess: 'Details confirmed. A refreshed calendar invite was emailed to you.',
          cancelledSuccess: 'Booking cancelled. A cancellation message was emailed to you.',
          summaryHint: 'No notes.',
          bookingReady: 'Your booking details are ready.',
          vehicle: 'Vehicle',
          customer: 'Customer',
          noVehicle: 'No license plate',
        };
  }, [language]);

  const completionFields = useMemo(() => {
    if (!booking) return [];
    return getMissingManageFields(booking);
  }, [booking]);

  const updateMode = (nextMode: ManageMode) => {
    setMode(nextMode);
    if (bookingToken) {
      syncManageUrl(bookingToken, nextMode);
    }
  };

  const loadBooking = async (overrideToken?: string) => {
    const activeToken = sanitizeManageToken(overrideToken ?? tokenInput ?? bookingToken);
    if (!activeToken) {
      setError(copy.invalidToken);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const supabase = getSupabaseClient();
      const { data, error: invokeError } = await supabase.functions.invoke('booking_manage', {
        method: 'POST',
        body: { action: 'get_booking', token: activeToken },
      });

      if (invokeError) throw invokeError;

      const nextBooking = normalizeBooking((data?.booking ?? data) as RawManagedBooking);
      if (!nextBooking) {
        throw new Error(copy.invalidToken);
      }

      setBooking(nextBooking);
      setBookingToken(activeToken);
      setTokenInput(activeToken);
      setForm({
        licensePlate: nextBooking.licensePlate,
        customerPhone: nextBooking.customerPhone,
        customerEmail: nextBooking.customerEmail,
        notes: nextBooking.notes,
      });
      setCancellationNote('');

      if (!explicitModeProvided && getMissingManageFields(nextBooking).length > 0 && nextBooking.canManage) {
        setMode('complete');
        syncManageUrl(activeToken, 'complete');
      } else {
        syncManageUrl(activeToken, mode);
      }
    } catch (loadError) {
      console.error('Failed to load managed booking', loadError);
      setBooking(null);
      setBookingToken('');
      setError(await getInvokeErrorMessage(loadError, copy.invalidToken));
    } finally {
      setLoading(false);
    }
  };

  const buildMutationPayload = (nextFields: ManageFields) => ({
    token: bookingToken,
    licensePlate: nextFields.licensePlate.trim().toUpperCase(),
    license_plate: nextFields.licensePlate.trim().toUpperCase(),
    customerPhone: normalizeFinnishPhone(nextFields.customerPhone),
    customer_phone: normalizeFinnishPhone(nextFields.customerPhone),
    customerEmail: nextFields.customerEmail.trim(),
    customer_email: nextFields.customerEmail.trim(),
    customerName: booking?.customerName ?? '',
    customer_name: booking?.customerName ?? '',
    bookingDate: booking?.bookingDate ?? '',
    booking_date: booking?.bookingDate ?? '',
    bookingTime: booking?.bookingTime ?? '',
    booking_time: booking?.bookingTime ?? '',
    notes: nextFields.notes.trim(),
  });

  const handleSave = async () => {
    if (!booking) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const supabase = getSupabaseClient();
      const { data, error: invokeError } = await supabase.functions.invoke('booking_manage', {
        method: 'POST',
        body: {
          action: showMissingCompletion ? 'complete_missing_fields' : 'update_booking',
          ...buildMutationPayload(form),
        },
      });

      if (invokeError) throw invokeError;

      const updatedBooking = normalizeBooking((data?.booking ?? data) as RawManagedBooking);
      if (updatedBooking) {
        setBooking(updatedBooking);
        setForm({
          licensePlate: updatedBooking.licensePlate,
          customerPhone: updatedBooking.customerPhone,
          customerEmail: updatedBooking.customerEmail,
          notes: updatedBooking.notes,
        });
      }

      setMode('view');
      syncManageUrl(bookingToken, 'view');
      setSuccess(showMissingCompletion ? copy.completedSuccess : copy.updatedSuccess);
    } catch (saveError: any) {
      console.error('Failed to update booking', saveError);
      setError(await getInvokeErrorMessage(saveError, copy.invalidToken));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!booking) return;

    setCancelling(true);
    setError('');
    setSuccess('');

    try {
      const supabase = getSupabaseClient();
      const { data, error: invokeError } = await supabase.functions.invoke('booking_manage', {
        method: 'POST',
        body: {
          action: 'cancel_booking',
          token: bookingToken,
          cancellationNote,
          cancellation_note: cancellationNote,
        },
      });

      if (invokeError) throw invokeError;

      const cancelledBooking = normalizeBooking((data?.booking ?? data) as RawManagedBooking);
      if (cancelledBooking) {
        setBooking(cancelledBooking);
      }

      setMode('view');
      syncManageUrl(bookingToken, 'view');
      setSuccess(copy.cancelledSuccess);
    } catch (cancelError: any) {
      console.error('Failed to cancel booking', cancelError);
      setError(await getInvokeErrorMessage(cancelError, copy.invalidToken));
    } finally {
      setCancelling(false);
    }
  };

  const handleFieldChange = (field: keyof ManageFields, value: string) => {
    setForm((current) => {
      if (field === 'customerPhone') {
        return {
          ...current,
          [field]: normalizeFinnishPhoneInput(value),
        };
      }

      return {
        ...current,
        [field]: value,
      };
    });
  };

  useEffect(() => {
    if (initial.token) {
      void loadBooking(initial.token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const next = getInitialManageState();
      setTokenInput(next.token);
      setBookingToken(next.token);
      setMode(next.mode);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', handlePopState);
      }
    };
  }, []);

  const formattedCurrentTime = booking ? formatBookingWindow(booking, locale) : '';
  const statusMeta = booking ? getStatusMeta(booking.status, language) : null;
  const canMutate = Boolean(booking?.canManage && booking?.status?.toLowerCase() !== 'cancelled');
  const showMissingCompletion = completionFields.length > 0;
  const showEditFields = canMutate && (showMissingCompletion || mode === 'edit');

  const visibleFields: Array<keyof ManageFields> = showMissingCompletion
    ? completionFields
    : mode === 'edit'
      ? ['licensePlate', 'customerPhone', 'customerEmail', 'notes']
      : [];

  return (
    <section className="bg-background py-8 sm:py-12">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mx-auto mb-6 max-w-3xl space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{copy.title}</h1>
          <p className="text-muted-foreground">{copy.subtitle}</p>
        </div>

        {!booking && loading ? (
          <Card className="mx-auto max-w-3xl overflow-hidden border-muted/60 shadow-sm">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div>
                  <p className="font-medium">{copy.secureAccess}</p>
                  <p className="text-sm text-muted-foreground">{copy.secureDescription}</p>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-primary" />
              </div>
            </CardContent>
          </Card>
        ) : !booking ? (
          <Card className="mx-auto max-w-3xl overflow-hidden border-muted/60 shadow-sm">
            <CardContent className="space-y-4 p-6">
              <div>
                <CardTitle>{copy.secureAccess}</CardTitle>
                <CardDescription className="mt-2">{error ? copy.invalidToken : copy.tokenMissing}</CardDescription>
              </div>

              {error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{copy.secureAccess}</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="booking-token">{copy.tokenLabel}</Label>
                <Input
                  id="booking-token"
                  value={tokenInput}
                  onChange={(event) => setTokenInput(event.target.value)}
                  placeholder={copy.tokenPlaceholder}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void loadBooking()} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {loading ? copy.loading : copy.loadBooking}
                </Button>
                <Button variant="outline" onClick={onNavigateHome}>{copy.backHome}</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6">
            <Card className="overflow-hidden border-muted/60 shadow-sm">
              <CardContent className="space-y-6 p-5 sm:p-6">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusMeta?.variant ?? 'secondary'} className="gap-2">
                      {booking.status.toLowerCase() === 'cancelled' ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                      {statusMeta?.label}
                    </Badge>
                    {showMissingCompletion ? (
                      <Badge variant="outline" className="gap-2">
                        <CircleAlert className="h-4 w-4" />
                        {completionFields.length} {copy.missingFieldsTitle.toLowerCase()}
                      </Badge>
                    ) : null}
                  </div>

                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                      {booking.serviceName || copy.service}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">{formattedCurrentTime}</p>
                  </div>
                </div>

                {error ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}

                {success ? (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                ) : null}

                {!canMutate ? (
                  <Alert>
                    <CircleAlert className="h-4 w-4" />
                    <AlertDescription>{copy.cancelled}</AlertDescription>
                  </Alert>
                ) : null}

                {!showEditFields ? (
                  <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
                    <p className="font-medium">{copy.bookingReady}</p>
                    <div className="grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{copy.vehicle}</p>
                        <p className="font-medium">{booking.licensePlate || copy.noVehicle}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{copy.customer}</p>
                        <p className="font-medium">{booking.customerName || booking.customerEmail}</p>
                        <p className="text-muted-foreground">{booking.customerPhone}</p>
                      </div>
                      {booking.notes ? (
                        <div className="sm:col-span-2">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">{copy.notes}</p>
                          <p className="text-muted-foreground">{booking.notes}</p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {visibleFields.includes('licensePlate') ? (
                      <ManageField
                        id="manage-license-plate"
                        label={showMissingCompletion ? copy.missingLicensePlate : copy.licensePlate}
                        value={form.licensePlate}
                        onChange={(value) => handleFieldChange('licensePlate', value)}
                        placeholder="ABC-123"
                        icon={UserRound}
                        autoComplete="off"
                      />
                    ) : null}
                    {visibleFields.includes('customerPhone') ? (
                      <ManageField
                        id="manage-phone"
                        label={showMissingCompletion ? copy.missingPhone : copy.phone}
                        value={form.customerPhone}
                        onChange={(value) => handleFieldChange('customerPhone', value)}
                        placeholder="+358..."
                        icon={Phone}
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                      />
                    ) : null}
                    {visibleFields.includes('customerEmail') ? (
                      <ManageField
                        id="manage-email"
                        label={showMissingCompletion ? copy.missingEmail : copy.email}
                        value={form.customerEmail}
                        onChange={(value) => handleFieldChange('customerEmail', value)}
                        placeholder="name@example.com"
                        icon={Mail}
                        type="email"
                        autoComplete="email"
                      />
                    ) : null}
                    {visibleFields.includes('notes') ? (
                      <div className="sm:col-span-2">
                        <ManageNotesField
                          id="manage-notes"
                          label={copy.notes}
                          value={form.notes}
                          onChange={(value) => handleFieldChange('notes', value)}
                          placeholder={copy.summaryHint}
                        />
                      </div>
                    ) : null}
                  </div>
                )}

                {mode === 'cancel' && canMutate ? (
                  <div className="space-y-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
                    <Alert variant="destructive">
                      <CircleAlert className="h-4 w-4" />
                      <AlertDescription>{copy.cancelWarning}</AlertDescription>
                    </Alert>
                    <ManageNotesField
                      id="cancel-note"
                      label={copy.reasonLabel ?? copy.cancelBooking}
                      value={cancellationNote}
                      onChange={setCancellationNote}
                      placeholder={copy.cancelWarning}
                    />
                    <div className="flex flex-wrap gap-3">
                      <Button variant="destructive" onClick={() => void handleCancel()} disabled={saving || cancelling || !canMutate}>
                        {cancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {cancelling ? copy.cancelling : copy.confirmCancel}
                      </Button>
                      <Button variant="outline" onClick={() => updateMode('view')}>
                        {copy.backToSummary}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {showEditFields ? (
                      <Button onClick={() => void handleSave()} disabled={saving || cancelling || !canMutate}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {saving ? copy.saving : (showMissingCompletion ? copy.completeDetails : copy.saveChanges)}
                      </Button>
                    ) : canMutate ? (
                      <Button onClick={() => updateMode('edit')}>
                        {copy.editDetails}
                      </Button>
                    ) : null}
                    {canMutate ? (
                      <Button variant="outline" onClick={() => updateMode('cancel')}>
                        {copy.cancelBooking}
                      </Button>
                    ) : null}
                    <Button variant="ghost" onClick={onNavigateHome}>
                      {copy.backHome}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}
