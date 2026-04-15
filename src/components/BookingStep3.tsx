import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { BookingSummaryCard } from './BookingSummaryCard';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { getSupabaseClient } from '../utils/supabase/client';
import { formatDateForSupabase } from '../utils/date';
import { FINNISH_PHONE_PREFIX, hasFinnishPhoneValue, normalizeFinnishPhone, normalizeFinnishPhoneInput } from '../utils/phone';

interface BookingStep3Props {
  licensePlate: string;
  date: Date;
  timeSlot: string;
  serviceName: string;
  language?: 'fi' | 'en';
  contactInfo: {
    name: string;
    phone: string;
    email: string;
    notes: string;
  };
  onContactInfoChange: (field: string, value: string) => void;
  onBack: () => void;
  onEditStep1: () => void;
  onConfirm: () => void;
  t: (key: string) => string;
  locale?: string;
}

export function BookingStep3({
  licensePlate,
  date,
  timeSlot,
  serviceName,
  language = 'fi',
  contactInfo,
  onContactInfoChange,
  onBack,
  onEditStep1,
  onConfirm,
  t,
  locale = 'fi-FI',
}: BookingStep3Props) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>('');

  const validateAndConfirm = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setErrors({});
    setError('');

    const newErrors: Record<string, string> = {};

    // Validate name
    if (!contactInfo.name.trim()) {
      newErrors.name = t('booking.error.nameRequired');
    }

    // Validate phone
    const normalizedPhone = normalizeFinnishPhone(contactInfo.phone);

    if (!hasFinnishPhoneValue(normalizedPhone)) {
      newErrors.phone = t('booking.error.phoneRequired');
    } else if (!/^\+?\d+$/.test(normalizedPhone.replace(/\s+/g, ''))) {
      newErrors.phone = t('booking.error.invalidPhone');
    }

    // Validate email (optional but must be valid if provided)
    if (contactInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.email)) {
      newErrors.email = t('booking.error.invalidEmail');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // Save booking to Supabase
      const supabase = getSupabaseClient();
      
      // Format date as YYYY-MM-DD in local time to avoid timezone drift
      const bookingDate = formatDateForSupabase(date);
      
      const bookingData = {
        license_plate: licensePlate.toUpperCase(),
        booking_date: bookingDate,
        booking_time: timeSlot,
        booking_language: language,
        service_name: serviceName,
        customer_name: contactInfo.name,
        customer_phone: normalizedPhone,
        customer_email: contactInfo.email || null,
        notes: contactInfo.notes || null,
        status: 'confirmed',
      };

      console.log('[BOOKING] Creating booking with data:', bookingData);
      
      // Create booking record
      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select();

      if (error) {
        console.error('[BOOKING] Error creating booking:', error);
        console.error('[BOOKING] Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      console.log('[BOOKING] ✅ Booking created successfully:', data);
      console.log('[BOOKING] Booking ID:', data?.[0]?.id);
      console.log('[BOOKING] Check CMS for date:', bookingDate, 'time:', timeSlot);

      if (data?.[0]?.id) {
        const { error: pushError } = await supabase.functions.invoke(
          'send_booking_push',
          {
            method: 'POST',
            body: {
              booking: {
                id: data[0].id,
                license_plate: licensePlate.toUpperCase(),
                customer_name: contactInfo.name,
                booking_date: bookingDate,
                booking_time: timeSlot,
              },
            },
          },
        );

        if (pushError) {
          console.error('[BOOKING] Booking saved but push notification failed:', pushError);
        }
      }

      if (contactInfo.email && data?.[0]?.id) {
        const { error: emailError } = await supabase.functions.invoke(
          'send_booking_confirmation',
          {
            method: 'POST',
            body: {
              bookingId: data[0].id,
              customerName: contactInfo.name,
              customerEmail: contactInfo.email,
              customerPhone: normalizedPhone,
              licensePlate: licensePlate.toUpperCase(),
              bookingDate,
              bookingTime: timeSlot,
              serviceName,
              language,
              notes: contactInfo.notes || null,
            },
          },
        );

        if (emailError) {
          console.error('[BOOKING] Booking saved but confirmation email failed:', emailError);
        } else {
          console.log('[BOOKING] Booking confirmation email sent');
        }
      }

      onConfirm();
    } catch (err) {
      console.error('[BOOKING] ❌ Booking error:', err);
      setError(t('booking.error.unableToComplete'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" autoComplete="on" onSubmit={validateAndConfirm}>
      {/* Desktop: Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Contact Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">{t('booking.step3.contactTitle')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('booking.step3.contactIntro')}
              </p>
            </div>

            {/* Name */}
            <div className="space-y-2 group">
              <Label 
                htmlFor="booking-name"
                className={`transition-all ${errors.name ? 'text-destructive' : 'group-hover:text-ring'}`}
              >
                {t('booking.step3.fullName')} *
              </Label>
              <Input
                id="booking-name"
                type="text"
                name="name"
                autoComplete="name"
                value={contactInfo.name}
                onChange={(e) => onContactInfoChange('name', e.target.value)}
                placeholder={t('booking.step3.fullNamePlaceholder')}
                className={`transition-all ${errors.name ? 'border-destructive' : 'hover:shadow-[0_0_20px_rgba(0,113,227,0.15)] hover:border-ring/50 focus:shadow-[0_0_25px_rgba(0,113,227,0.25)]'}`}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2 group">
              <Label 
                htmlFor="booking-tel"
                className={`transition-all ${errors.phone ? 'text-destructive' : 'group-hover:text-ring'}`}
              >
                {t('booking.step3.phoneNumber')} *
              </Label>
              <Input
                id="booking-tel"
                type="tel"
                name="tel"
                autoComplete="tel"
                inputMode="tel"
                value={contactInfo.phone}
                onChange={(e) => onContactInfoChange('phone', normalizeFinnishPhoneInput(e.target.value))}
                onBlur={(e) => onContactInfoChange('phone', normalizeFinnishPhoneInput(e.target.value))}
                placeholder={FINNISH_PHONE_PREFIX}
                className={`transition-all ${errors.phone ? 'border-destructive' : 'hover:shadow-[0_0_20px_rgba(0,113,227,0.15)] hover:border-ring/50 focus:shadow-[0_0_25px_rgba(0,113,227,0.25)]'}`}
                aria-invalid={!!errors.phone}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2 group">
              <Label 
                htmlFor="booking-email"
                className={`transition-all ${errors.email ? 'text-destructive' : 'group-hover:text-ring'}`}
              >
                {t('booking.step3.emailLabel')}
              </Label>
              <Input
                id="booking-email"
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                value={contactInfo.email}
                onChange={(e) => onContactInfoChange('email', e.target.value)}
                placeholder={t('booking.step3.emailPlaceholder')}
                className={`transition-all ${errors.email ? 'border-destructive' : 'hover:shadow-[0_0_20px_rgba(0,113,227,0.15)] hover:border-ring/50 focus:shadow-[0_0_25px_rgba(0,113,227,0.25)]'}`}
                aria-invalid={!!errors.email}
              />
              <p className="text-sm text-muted-foreground">
                {t('booking.step3.emailHelper')}
              </p>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2 group">
              <Label htmlFor="notes" className="transition-all group-hover:text-ring">
                {t('booking.step3.additionalNotes')} <span className="text-muted-foreground">{t('booking.step3.optional')}</span>
              </Label>
            <Textarea
              id="notes"
              name="notes"
              value={contactInfo.notes}
              onChange={(e) => onContactInfoChange('notes', e.target.value)}
              placeholder={t('booking.step3.notesPlaceholder')}
                rows={4}
                className="resize-none transition-all hover:shadow-[0_0_20px_rgba(0,113,227,0.15)] hover:border-ring/50 focus:shadow-[0_0_25px_rgba(0,113,227,0.25)]"
              />
            </div>
          </div>
        </div>

        {/* Right: Summary (Desktop) */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-6">
            <BookingSummaryCard
              licensePlate={licensePlate}
              date={date}
              timeSlot={timeSlot}
              serviceName={serviceName}
              onEdit={onEditStep1}
              t={t}
              locale={locale}
            />
          </div>
        </div>
      </div>

      {/* Mobile Summary */}
      <div className="lg:hidden">
        <BookingSummaryCard
          licensePlate={licensePlate}
          date={date}
          timeSlot={timeSlot}
          serviceName={serviceName}
          onEdit={onEditStep1}
          compact
          t={t}
          locale={locale}
        />
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onBack}
          className="w-full sm:w-auto"
          disabled={loading}
        >
          {t('booking.back')}
        </Button>
        <Button
          id="cta_confirm"
          type="submit"
          className="w-full sm:flex-1"
          disabled={loading}
        >
          {loading ? t('booking.confirming') : t('booking.confirmBooking')}
        </Button>
      </div>
    </form>
  );
}
