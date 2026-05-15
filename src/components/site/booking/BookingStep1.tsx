import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { LicensePlateInput } from './LicensePlateInput';
import { TimeSlotGrid, TimeSlot } from './TimeSlotGrid';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Calendar } from '../../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Alert, AlertDescription } from '../../ui/alert';
import { getSupabaseClient } from '../../../utils/supabase/client';
import { formatDateForSupabase } from '../../../utils/date';
import { buildScheduleTimeSlots } from '../../../utils/schedule';

interface BookingStep1Props {
  licensePlate: string;
  date: Date | undefined;
  selectedTimeSlot: string | null;
  onLicensePlateChange: (value: string) => void;
  onDateChange: (date: Date | undefined) => void;
  onTimeSlotChange: (slotId: string) => void;
  onContinue: () => void;
  onCancel: () => void;
  language: string;
  t: (key: string) => string;
  minimumDate?: Date;
}

export function BookingStep1({
  licensePlate,
  date,
  selectedTimeSlot,
  onLicensePlateChange,
  onDateChange,
  onTimeSlotChange,
  onContinue,
  onCancel,
  language,
  t,
  minimumDate,
}: BookingStep1Props) {
  const [plateError, setPlateError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstSelectableDate = minimumDate && minimumDate > today ? minimumDate : today;

  useEffect(() => {
    let cancelled = false;

    const loadAvailability = async () => {
      if (!date) {
        setTimeSlots([]);
        return;
      }

      setLoading(true);
      try {
        const supabase = getSupabaseClient();
        const dateStr = formatDateForSupabase(date);
        const todayStr = formatDateForSupabase(new Date());
        const currentHourStartMinutes = new Date().getHours() * 60;

        const [{ data: bookingsData, error: bookingsError }, { data: blockedData, error: blockedError }] = await Promise.all([
          supabase
            .from('bookings')
            .select('id, license_plate, booking_date, booking_time, service_name, customer_name, customer_phone, customer_email, notes, status, created_at')
            .eq('booking_date', dateStr),
          supabase
            .from('blocked_slots')
            .select('id, date, start_time, end_time, reason, reason_fi, reason_en, created_at')
            .eq('date', dateStr),
        ]);

        if (bookingsError) {
          throw bookingsError;
        }

        if (blockedError) {
          throw blockedError;
        }

        const slots = buildScheduleTimeSlots(date, bookingsData || [], blockedData || [], language).map((slot) => {
          const [hours, minutes] = slot.time.split(':').map(Number);
          const slotMinutes = hours * 60 + minutes;
          const isPastHourForToday = dateStr === todayStr && slotMinutes < currentHourStartMinutes;

          return {
            id: slot.time,
            time: slot.time,
            // Public booking should only respect admin blocks and same-day cutoff.
            // Existing bookings remain visible in CMS but do not close the slot.
            available: !slot.isBlocked && !isPastHourForToday,
            unavailableReason: slot.isBlocked ? slot.blockReason : undefined,
          };
        });

        if (!cancelled) {
          setTimeSlots(slots);
        }
      } catch (err) {
        console.error('[BOOKING] Failed to load availability:', err);
        if (!cancelled) {
          setTimeSlots([]);
          setError(t('booking.error.loadAvailability'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [date, language]);

  const validateAndContinue = async () => {
    setPlateError('');
    setError('');

    // Validate license plate
    if (!licensePlate || licensePlate.length < 3) {
      setPlateError(t('booking.error.invalidLicensePlate'));
      return;
    }

    // Validate date
    if (!date) {
      setError(t('booking.error.selectDate'));
      return;
    }

    // Validate time slot
    if (!selectedTimeSlot) {
      setError(t('booking.error.selectTimeSlot'));
      return;
    }

    setLoading(true);
    try {
      onContinue();
    } catch (err) {
      setError(t('booking.error.verifyAvailability'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* License Plate Input */}
      <LicensePlateInput
        value={licensePlate}
        onChange={onLicensePlateChange}
        error={plateError}
        label={t('booking.step1.licensePlate')}
        helperText={t('booking.step1.licensePlateHelper')}
      />

      {/* Date Picker */}
      <div className="space-y-2 group">
        <Label className="transition-all group-hover:text-ring">
          <span className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            {t('booking.step1.selectDate')}
          </span>
        </Label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              id="date_picker"
              variant="outline"
              className={`w-full justify-start text-left transition-all ${
                !date ? 'text-muted-foreground' : ''
              }`}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? (
                date.toLocaleDateString(t('booking.step1.dateLocale'), {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              ) : (
                <span>{t('booking.step1.pickDate')}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => {
                onDateChange(newDate);
                setCalendarOpen(false);
              }}
              today={today}
              fromDate={firstSelectableDate}
              disabled={{ before: firstSelectableDate }}
              modifiers={{ sunday: { dayOfWeek: [0] } }}
              modifiersClassNames={{
                sunday: 'text-muted-foreground opacity-60',
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time Slots */}
      {date && (
        <div id="time_slot_grid" className="space-y-2">
          <TimeSlotGrid
            slots={timeSlots}
            selectedSlot={selectedTimeSlot}
            onSelectSlot={onTimeSlotChange}
            loading={loading}
          />
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          className="w-full sm:w-auto"
          disabled={loading}
        >
          {t('booking.cancel')}
        </Button>
        <Button
          id="cta_continue"
          onClick={validateAndContinue}
          className="w-full sm:flex-1"
          disabled={loading || !licensePlate || !date || !selectedTimeSlot}
        >
          {loading ? t('booking.checking') : t('booking.continue')}
        </Button>
      </div>
    </div>
  );
}
