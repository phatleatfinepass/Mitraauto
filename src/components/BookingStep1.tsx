import React, { useState } from 'react';
import { Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { LicensePlateInput } from './LicensePlateInput';
import { TimeSlotGrid, TimeSlot } from './TimeSlotGrid';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Alert, AlertDescription } from './ui/alert';

interface BookingStep1Props {
  licensePlate: string;
  date: Date | undefined;
  selectedTimeSlot: string | null;
  onLicensePlateChange: (value: string) => void;
  onDateChange: (date: Date | undefined) => void;
  onTimeSlotChange: (slotId: string) => void;
  onContinue: () => void;
  onCancel: () => void;
  t: (key: string) => string;
}

// Mock time slots - in production, fetch based on selected date
const generateTimeSlots = (date: Date | undefined): TimeSlot[] => {
  if (!date) return [];
  
  const slots: TimeSlot[] = [];
  const startHour = 9;
  const endHour = 17;
  
  // Fixed availability pattern - some slots are unavailable
  const unavailableSlots = ['10:00', '12:00', '13:30', '15:00'];
  
  for (let hour = startHour; hour < endHour; hour++) {
    const slot1 = `${hour}:00`;
    const slot2 = `${hour}:30`;
    
    slots.push({
      id: slot1,
      time: slot1,
      available: !unavailableSlots.includes(slot1),
    });
    slots.push({
      id: slot2,
      time: slot2,
      available: !unavailableSlots.includes(slot2),
    });
  }
  
  return slots;
};

export function BookingStep1({
  licensePlate,
  date,
  selectedTimeSlot,
  onLicensePlateChange,
  onDateChange,
  onTimeSlotChange,
  onContinue,
  onCancel,
  t,
}: BookingStep1Props) {
  const [plateError, setPlateError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [calendarOpen, setCalendarOpen] = useState(false);

  const timeSlots = generateTimeSlots(date);

  const validateAndContinue = async () => {
    setPlateError('');
    setError('');

    // Validate license plate
    if (!licensePlate || licensePlate.length < 3) {
      setPlateError('Please enter a valid license plate');
      return;
    }

    // Validate date
    if (!date) {
      setError('Please select a date');
      return;
    }

    // Validate time slot
    if (!selectedTimeSlot) {
      setError('Please select a time slot');
      return;
    }

    // Simulate checking availability
    setLoading(true);
    try {
      // [BOOKING ACTION] Check availability: /api/bookings/check-availability
      await new Promise(resolve => setTimeout(resolve, 500));
      onContinue();
    } catch (err) {
      setError('Unable to verify availability. Please try again.');
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
                date.toLocaleDateString('fi-FI', {
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
              disabled={(date) => date < new Date()}
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
