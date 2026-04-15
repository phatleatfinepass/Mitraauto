import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Ban,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Eye,
  Loader2,
  Mail,
  MessageSquareText,
  PencilLine,
  Phone,
  ShieldCheck,
  StickyNote,
  UserRound,
  XCircle,
} from 'lucide-react';
import { getSupabaseClient } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
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
    };
  }

  const params = new URLSearchParams(window.location.search);
  const modeParam = params.get('mode');
  const parsedMode: ManageMode =
    modeParam === 'edit' || modeParam === 'cancel' || modeParam === 'complete' || modeParam === 'view'
      ? modeParam
      : 'view';

  return {
    token: params.get('token') ?? '',
    mode: parsedMode,
    hasExplicitMode: params.has('mode'),
  };
}

function syncManageUrl(token: string, mode: ManageMode) {
  if (typeof window === 'undefined') return;

  const nextUrl = new URL(window.location.href);
  if (token.trim()) {
    nextUrl.searchParams.set('token', token.trim());
  } else {
    nextUrl.searchParams.delete('token');
  }
  nextUrl.searchParams.set('mode', mode);
  window.history.replaceState(window.history.state, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
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

function formatExpiry(value: string | null, locale: string) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString(locale, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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

function getNextModeLabel(mode: ManageMode, language: 'fi' | 'en') {
  const labels =
    language === 'fi'
      ? {
          view: 'Näytä',
          edit: 'Muokkaa',
          complete: 'Täydennä',
          cancel: 'Peruuta',
        }
      : {
          view: 'View',
          edit: 'Edit',
          complete: 'Complete',
          cancel: 'Cancel',
        };

  return labels[mode];
}

function ManageModeButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      className="justify-start gap-2 rounded-full px-4"
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  );
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

function ManageSummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1 rounded-2xl border bg-background/70 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || '—'}</p>
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

  const language = booking?.bookingLanguage ?? 'fi';
  const locale = language === 'fi' ? 'fi-FI' : 'en-US';
  const explicitModeProvided = initial.hasExplicitMode;

  const copy = useMemo(() => {
    return language === 'fi'
      ? {
          title: 'Hallitse varaustasi',
          subtitle: 'Tämä näkymä toimii vain sähköpostiin lähetetyllä hallintalinkillä. Voit tarkastella varausta, täydentää puuttuvat tiedot, muokata yhteystietoja tai perua ajan.',
          secureAccess: 'Suojattu hallintalinki',
          secureDescription: 'Token validoidaan palvelimella ennen kuin mitään muutoksia sallitaan.',
          tokenLabel: 'Varauslinkin token',
          tokenPlaceholder: 'Liitä sähköpostissa saatu token',
          loadBooking: 'Avaa varaus',
          loading: 'Avataan...',
          invalidToken: 'Hallintalinkki on virheellinen tai vanhentunut.',
          modeView: 'Näytä',
          modeEdit: 'Muokkaa',
          modeComplete: 'Täydennä',
          modeCancel: 'Peruuta',
          currentBooking: 'Nykyinen varaus',
          bookingSummary: 'Varaustiedot',
          service: 'Palvelu',
          vehicle: 'Ajoneuvo',
          appointment: 'Aika',
          status: 'Tila',
          expires: 'Linkki vanhenee',
          customer: 'Asiakas',
          missingFieldsTitle: 'Puuttuvat tiedot',
          missingFieldsDescription: 'Täydennä vain ne kentät, joita CMS ei vielä tiennyt. Tämä on kevyt vahvistus, ei uusi varaus.',
          completionTitle: 'Täydennä varaus',
          completionSubtitle: 'Täytä puuttuvat tiedot ja vahvista ne yhdellä napilla. Kalenterikutsu päivitetään samalla UID:llä.',
          editTitle: 'Muokkaa yhteystietoja',
          editSubtitle: 'Pidä aika samana ja päivitä vain olennaiset tiedot: rekisterinumero, puhelin, sähköposti ja muistiinpanot.',
          cancelTitle: 'Peruuta varaus',
          cancelSubtitle: 'Tämä lähettää hallitun kalenteriperuutuksen samalla UID:llä ja merkitsee varauksen perutuksi.',
          cancelWarning: 'Peruutus on lopullinen. Voit jättää vapaaehtoisen syyn ennen vahvistusta.',
          reasonLabel: 'Peruutuksen syy',
          confirmCancel: 'Vahvista peruutus',
          cancelling: 'Perutaan...',
          saveChanges: 'Tallenna muutokset',
          saving: 'Tallennetaan...',
          completeDetails: 'Vahvista tiedot',
          completing: 'Vahvistetaan...',
          backHome: 'Takaisin etusivulle',
          backToSummary: 'Takaisin yhteenvetoon',
          viewDetails: 'Näytä yhteenveto',
          editBooking: 'Muokkaa varausta',
          completeBooking: 'Täydennä puuttuvat tiedot',
          cancelBooking: 'Peruuta varaus',
          completeCta: 'Täydennä nyt',
          missingLicensePlate: 'Rekisterinumero',
          missingPhone: 'Puhelinnumero',
          missingEmail: 'Sähköposti',
          notes: 'Lisätiedot',
          licensePlate: 'Rekisterinumero',
          phone: 'Puhelin',
          email: 'Sähköposti',
          name: 'Nimi',
          saveNotice: 'Muutokset tallentuvat samaan varaukseen ja sähköposti saa päivitetyn kalenterikutsun.',
          managedNotice: 'Muutokset päivittyvät keskitetysti. Kalenterin UID pysyy samana koko varauksen elinkaaren ajan.',
          noMissingFields: 'Kaikki pakolliset tiedot ovat jo valmiina.',
          cancelled: 'Tämä varaus on jo peruttu.',
          updatedSuccess: 'Varaus päivitettiin. Päivitetty kalenterikutsu lähetettiin sähköpostiin.',
          completedSuccess: 'Tiedot vahvistettiin. Päivitetty kalenterikutsu lähetettiin sähköpostiin.',
          cancelledSuccess: 'Varaus peruttiin ja peruutusviesti lähetettiin sähköpostiin.',
          summaryHint: 'Vahvista vain se, mikä puuttuu. Älä tee tästä uutta varausta.',
          statusValue: {
            confirmed: 'Vahvistettu',
            pending: 'Odottaa vahvistusta',
            cancelled: 'Peruttu',
          },
          whatThisDoes: 'Hallintalinkki on sidottu yhteen varaukseen. Kaikki muutokset menevät tietokannan kautta ja kalenteri päivittyy samalla UID:llä.',
        }
      : {
          title: 'Manage your booking',
          subtitle: 'This page only works with the secure email link. You can review the booking, complete missing details, edit contact fields, or cancel the appointment.',
          secureAccess: 'Secure manage link',
          secureDescription: 'The token is validated server-side before any action is allowed.',
          tokenLabel: 'Booking token',
          tokenPlaceholder: 'Paste the token from your email',
          loadBooking: 'Open booking',
          loading: 'Opening...',
          invalidToken: 'The management link is invalid or expired.',
          modeView: 'View',
          modeEdit: 'Edit',
          modeComplete: 'Complete',
          modeCancel: 'Cancel',
          currentBooking: 'Current booking',
          bookingSummary: 'Booking details',
          service: 'Service',
          vehicle: 'Vehicle',
          appointment: 'Appointment',
          status: 'Status',
          expires: 'Link expires',
          customer: 'Customer',
          missingFieldsTitle: 'Missing details',
          missingFieldsDescription: 'Only fill the fields that CMS did not already know. This is a lightweight confirmation flow, not a new booking.',
          completionTitle: 'Complete booking details',
          completionSubtitle: 'Fill the missing fields and confirm them with one action. The calendar invite updates with the same UID.',
          editTitle: 'Edit contact details',
          editSubtitle: 'Keep the appointment fixed and update only the essentials: plate, phone, email, and notes.',
          cancelTitle: 'Cancel booking',
          cancelSubtitle: 'This sends a managed calendar cancellation with the same UID and marks the booking as cancelled.',
          cancelWarning: 'Cancellation is final. You can optionally leave a reason before confirming.',
          reasonLabel: 'Cancellation reason',
          confirmCancel: 'Confirm cancellation',
          cancelling: 'Cancelling...',
          saveChanges: 'Save changes',
          saving: 'Saving...',
          completeDetails: 'Confirm details',
          completing: 'Confirming...',
          backHome: 'Back to home',
          backToSummary: 'Back to summary',
          viewDetails: 'View summary',
          editBooking: 'Edit booking',
          completeBooking: 'Complete missing details',
          cancelBooking: 'Cancel booking',
          completeCta: 'Complete now',
          missingLicensePlate: 'License plate',
          missingPhone: 'Phone',
          missingEmail: 'Email',
          notes: 'Notes',
          licensePlate: 'License plate',
          phone: 'Phone',
          email: 'Email',
          name: 'Name',
          saveNotice: 'Changes save to the same booking and the email gets an updated calendar invite.',
          managedNotice: 'The backend stays the source of truth. The calendar UID remains stable for the lifetime of the booking.',
          noMissingFields: 'All required details are already present.',
          cancelled: 'This booking has already been cancelled.',
          updatedSuccess: 'Booking updated. A refreshed calendar invite was emailed to you.',
          completedSuccess: 'Details confirmed. A refreshed calendar invite was emailed to you.',
          cancelledSuccess: 'Booking cancelled. A cancellation message was emailed to you.',
          summaryHint: 'Confirm only what is missing. This should not feel like a full rebooking flow.',
          statusValue: {
            confirmed: 'Confirmed',
            pending: 'Awaiting confirmation',
            cancelled: 'Cancelled',
          },
          whatThisDoes: 'The manage link points to one booking only. Every change goes through the database and the calendar keeps the same UID.',
        };
  }, [language]);

  const completionFields = useMemo(() => {
    if (!booking) return [];
    return getMissingManageFields(booking);
  }, [booking]);

  const completionProgress = booking
    ? Math.max(0, Math.min(100, ((3 - completionFields.length) / 3) * 100))
    : 0;

  const updateMode = (nextMode: ManageMode) => {
    setMode(nextMode);
    if (bookingToken) {
      syncManageUrl(bookingToken, nextMode);
    }
  };

  const loadBooking = async (overrideToken?: string) => {
    const activeToken = (overrideToken ?? tokenInput ?? bookingToken).trim();
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
      setError(copy.invalidToken);
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
          action: 'update_booking',
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
      setSuccess(mode === 'complete' ? copy.completedSuccess : copy.updatedSuccess);
    } catch (saveError: any) {
      console.error('Failed to update booking', saveError);
      setError(saveError?.message || copy.invalidToken);
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
      setError(cancelError?.message || copy.invalidToken);
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
  const expiryLabel = booking ? formatExpiry(booking.manageTokenExpiresAt, locale) : '—';
  const statusMeta = booking ? getStatusMeta(booking.status, language) : null;
  const canMutate = Boolean(booking?.canManage && booking?.status?.toLowerCase() !== 'cancelled');
  const showMissingCompletion = completionFields.length > 0;

  return (
    <section className="relative overflow-hidden bg-background py-10 sm:py-14">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-ring/10 blur-3xl" />
      </div>

      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-8 flex flex-col gap-4">
          <Badge variant="secondary" className="w-fit gap-2 px-3 py-1">
            <ShieldCheck className="h-4 w-4" />
            {copy.secureAccess}
          </Badge>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{copy.title}</h1>
            <p className="max-w-3xl text-pretty text-muted-foreground">{copy.subtitle}</p>
          </div>
        </div>

        {!booking ? (
          <Card className="overflow-hidden border-muted/60 shadow-sm">
            <CardHeader className="space-y-2">
              <CardTitle>{copy.secureAccess}</CardTitle>
              <CardDescription>{copy.secureDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="booking-token">{copy.tokenLabel}</Label>
                <Input
                  id="booking-token"
                  value={tokenInput}
                  onChange={(event) => setTokenInput(event.target.value)}
                  placeholder={copy.tokenPlaceholder}
                />
              </div>

              {error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{copy.secureAccess}</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

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
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <Card className="overflow-hidden border-muted/60 shadow-sm">
                <CardContent className="space-y-5 p-5 sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
                        <Badge variant="outline" className="gap-2">
                          <ShieldCheck className="h-4 w-4" />
                          {copy.secureAccess}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                          {booking.serviceName || copy.service}
                        </h2>
                        <p className="text-sm text-muted-foreground">{formattedCurrentTime}</p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[300px]">
                      <ManageSummaryRow label={copy.vehicle} value={booking.licensePlate || '—'} />
                      <ManageSummaryRow label={copy.expires} value={expiryLabel} />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <ManageSummaryRow label={copy.customer} value={booking.customerName || '—'} />
                    <ManageSummaryRow label={copy.phone} value={booking.customerPhone || '—'} />
                    <ManageSummaryRow label={copy.email} value={booking.customerEmail || '—'} />
                    <ManageSummaryRow label={copy.bookingSummary} value={booking.notes?.trim() ? booking.notes : copy.summaryHint} />
                  </div>

                  <div className="flex flex-wrap gap-2 rounded-2xl border bg-background/70 p-2">
                    <ManageModeButton active={mode === 'view'} icon={Eye} label={copy.modeView} onClick={() => updateMode('view')} />
                    {canMutate ? (
                      <>
                        <ManageModeButton active={mode === 'edit'} icon={PencilLine} label={copy.modeEdit} onClick={() => updateMode('edit')} />
                        <ManageModeButton active={mode === 'complete'} icon={MessageSquareText} label={copy.modeComplete} onClick={() => updateMode('complete')} />
                        <ManageModeButton active={mode === 'cancel'} icon={Ban} label={copy.modeCancel} onClick={() => updateMode('cancel')} />
                      </>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              {error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{copy.secureAccess}</AlertTitle>
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

              {mode === 'view' && (
                <Card className="overflow-hidden border-muted/60 shadow-sm">
                  <CardHeader className="space-y-2">
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      {copy.currentBooking}
                    </CardTitle>
                    <CardDescription>{copy.whatThisDoes}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-4 rounded-2xl border bg-background/70 p-5">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <ManageSummaryRow label={copy.service} value={booking.serviceName || '—'} />
                        <ManageSummaryRow label={copy.status} value={statusMeta?.label ?? booking.status} />
                      </div>
                      <div className="rounded-2xl bg-secondary/30 p-4 text-sm text-muted-foreground">
                        {copy.managedNotice}
                      </div>
                    </div>

                    {canMutate ? (
                      <div className="flex flex-wrap gap-3">
                        <Button variant="default" onClick={() => updateMode(showMissingCompletion ? 'complete' : 'edit')}>
                          {showMissingCompletion ? copy.completeCta : copy.editBooking}
                        </Button>
                        {showMissingCompletion ? (
                          <Button variant="outline" onClick={() => updateMode('complete')}>
                            {copy.completeBooking}
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        ) : null}
                        <Button variant="outline" onClick={() => updateMode('cancel')}>
                          {copy.cancelBooking}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        <Button variant="outline" onClick={onNavigateHome}>
                          {copy.backHome}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {mode === 'edit' && canMutate ? (
                <Card className="overflow-hidden border-muted/60 shadow-sm">
                  <CardHeader className="space-y-2">
                    <CardTitle className="flex items-center gap-2">
                      <PencilLine className="h-5 w-5" />
                      {copy.editTitle}
                    </CardTitle>
                    <CardDescription>{copy.editSubtitle}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <ManageField
                        id="manage-license-plate"
                        label={copy.licensePlate}
                        value={form.licensePlate}
                        onChange={(value) => handleFieldChange('licensePlate', value)}
                        placeholder="ABC-123"
                        icon={UserRound}
                        autoComplete="off"
                      />
                      <ManageField
                        id="manage-phone"
                        label={copy.phone}
                        value={form.customerPhone}
                        onChange={(value) => handleFieldChange('customerPhone', value)}
                        placeholder="+358..."
                        icon={Phone}
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                      />
                      <ManageField
                        id="manage-email"
                        label={copy.email}
                        value={form.customerEmail}
                        onChange={(value) => handleFieldChange('customerEmail', value)}
                        placeholder="name@example.com"
                        icon={Mail}
                        type="email"
                        autoComplete="email"
                      />
                      <div className="sm:col-span-2">
                        <ManageNotesField
                          id="manage-notes"
                          label={copy.notes}
                          value={form.notes}
                          onChange={(value) => handleFieldChange('notes', value)}
                          placeholder={copy.summaryHint}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border bg-secondary/20 p-4 text-sm text-muted-foreground">
                      {copy.saveNotice}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button onClick={() => void handleSave()} disabled={saving || cancelling}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {saving ? copy.saving : copy.saveChanges}
                      </Button>
                      <Button variant="outline" onClick={() => updateMode('view')}>
                        {copy.backToSummary}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {mode === 'complete' && canMutate ? (
                <Card className="overflow-hidden border-muted/60 shadow-sm">
                  <CardHeader className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="gap-2">
                        <MessageSquareText className="h-4 w-4" />
                        {copy.completeBooking}
                      </Badge>
                      <Badge variant="outline" className="gap-2">
                        {completionFields.length || 0} {copy.missingFieldsTitle.toLowerCase()}
                      </Badge>
                    </div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      {copy.completionTitle}
                    </CardTitle>
                    <CardDescription>{copy.completionSubtitle}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2 rounded-2xl border bg-background/70 p-5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{copy.missingFieldsTitle}</span>
                        <span className="font-medium">{Math.round(completionProgress)}%</span>
                      </div>
                      <Progress value={completionProgress} className="h-2" />
                      <p className="text-sm text-muted-foreground">{copy.missingFieldsDescription}</p>
                    </div>

                    {showMissingCompletion ? (
                      <div className="space-y-4">
                        {completionFields.includes('licensePlate') ? (
                          <ManageField
                            id="complete-license-plate"
                            label={copy.missingLicensePlate}
                            value={form.licensePlate}
                            onChange={(value) => handleFieldChange('licensePlate', value)}
                            placeholder="ABC-123"
                            icon={UserRound}
                            autoComplete="off"
                          />
                        ) : null}
                        {completionFields.includes('customerPhone') ? (
                          <ManageField
                            id="complete-phone"
                            label={copy.missingPhone}
                            value={form.customerPhone}
                            onChange={(value) => handleFieldChange('customerPhone', value)}
                            placeholder="+358..."
                            icon={Phone}
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                          />
                        ) : null}
                        {completionFields.includes('customerEmail') ? (
                          <ManageField
                            id="complete-email"
                            label={copy.missingEmail}
                            value={form.customerEmail}
                            onChange={(value) => handleFieldChange('customerEmail', value)}
                            placeholder="name@example.com"
                            icon={Mail}
                            type="email"
                            autoComplete="email"
                          />
                        ) : null}
                      </div>
                    ) : (
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>{copy.noMissingFields}</AlertDescription>
                      </Alert>
                    )}

                    <div className="rounded-2xl border bg-secondary/20 p-4 text-sm text-muted-foreground">
                      {copy.summaryHint}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button onClick={() => void handleSave()} disabled={saving || cancelling}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {saving ? copy.completing : copy.completeDetails}
                      </Button>
                      <Button variant="outline" onClick={() => updateMode('view')}>
                        {copy.backToSummary}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {mode === 'cancel' && canMutate ? (
                <Card className="overflow-hidden border-destructive/30 shadow-sm">
                  <CardHeader className="space-y-2">
                    <CardTitle className="flex items-center gap-2">
                      <Ban className="h-5 w-5 text-destructive" />
                      {copy.cancelTitle}
                    </CardTitle>
                    <CardDescription>{copy.cancelSubtitle}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <Alert variant="destructive">
                      <CircleAlert className="h-4 w-4" />
                      <AlertTitle>{copy.cancelBooking}</AlertTitle>
                      <AlertDescription>{copy.cancelWarning}</AlertDescription>
                    </Alert>

                    <div className="space-y-3 rounded-2xl border bg-background/70 p-5">
                      <p className="text-sm font-medium text-muted-foreground">{copy.bookingSummary}</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <ManageSummaryRow label={copy.service} value={booking.serviceName || '—'} />
                        <ManageSummaryRow label={copy.appointment} value={formattedCurrentTime} />
                      </div>
                      <ManageNotesField
                        id="cancel-note"
                        label={copy.reasonLabel ?? copy.summaryHint}
                        value={cancellationNote}
                        onChange={setCancellationNote}
                        placeholder={copy.cancelWarning}
                      />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button variant="destructive" onClick={() => void handleCancel()} disabled={saving || cancelling || !canMutate}>
                        {cancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {cancelling ? copy.cancelling : copy.confirmCancel}
                      </Button>
                      <Button variant="outline" onClick={() => updateMode('view')}>
                        {copy.backToSummary}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>

            <div className="space-y-6">
              <Card className="overflow-hidden border-muted/60 shadow-sm">
                <CardHeader className="space-y-2">
                  <CardTitle>{copy.secureAccess}</CardTitle>
                  <CardDescription>{copy.managedNotice}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <div className="rounded-2xl bg-secondary/30 p-4">
                    <p className="font-medium text-foreground">{copy.bookingSummary}</p>
                    <ul className="mt-3 space-y-2">
                      <li className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                        <span>{copy.whatThisDoes}</span>
                      </li>
                      <li className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                        <span>{copy.saveNotice}</span>
                      </li>
                      <li className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                        <span>{copy.cancelSubtitle}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="grid gap-3">
                    <ManageSummaryRow label={copy.status} value={statusMeta?.label ?? booking.status} />
                    <ManageSummaryRow label={copy.expires} value={expiryLabel} />
                  </div>

                  <div className="rounded-2xl border p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{copy.currentBooking}</p>
                    <p className="mt-2 text-sm font-medium text-foreground">{booking.licensePlate || copy.vehicle}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{formattedCurrentTime}</p>
                  </div>

                  <div className="rounded-2xl border border-dashed p-4">
                    <p className="font-medium text-foreground">{copy.missingFieldsTitle}</p>
                    <p className="mt-1 text-muted-foreground">
                      {showMissingCompletion
                        ? `${completionFields.length} ${copy.missingFieldsTitle.toLowerCase()}`
                        : copy.noMissingFields}
                    </p>
                  </div>

                  <Button variant="outline" className="w-full justify-between" onClick={onNavigateHome}>
                    {copy.backHome}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
