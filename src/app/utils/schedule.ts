export interface ScheduleBooking {
  id: string;
  license_plate: string;
  booking_date: string;
  booking_time: string;
  booking_language?: 'fi' | 'en' | null;
  service_name?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  notes?: string | null;
  status?: string | null;
  created_at: string;
}

export interface ScheduleBlockedSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason?: string | null;
  reason_fi?: string | null;
  reason_en?: string | null;
  created_at: string;
}

export interface ScheduleTimeSlot {
  time: string;
  bookings: ScheduleBooking[];
  isBlocked: boolean;
  blockReason?: string;
  available: boolean;
}

const WEEKDAY_HOURS = { start: 9, end: 18 };
const SATURDAY_HOURS = { start: 10, end: 17 };

function normalizeBookingTimeValue(time: string): string {
  const trimmed = time.trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed.slice(0, 5);
  }
  return trimmed;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function generateScheduleSlots(date: Date): string[] {
  const dayOfWeek = date.getDay();

  if (dayOfWeek === 0) {
    return [];
  }

  const hours = dayOfWeek === 6 ? SATURDAY_HOURS : WEEKDAY_HOURS;
  const slots: string[] = [];

  for (let hour = hours.start; hour < hours.end; hour += 1) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }

  return slots;
}

export function buildScheduleTimeSlots(
  date: Date,
  bookings: ScheduleBooking[],
  blockedSlots: ScheduleBlockedSlot[],
  language: 'fi' | 'en' | string = 'en',
): ScheduleTimeSlot[] {
  return generateScheduleSlots(date).map((time) => {
    const slotBookings = bookings.filter((booking) => {
      const status = (booking.status || 'confirmed').toLowerCase();
      return normalizeBookingTimeValue(booking.booking_time) === time && status !== 'cancelled';
    });

    const blockedSlot = blockedSlots.find((slot) => {
      const slotMinutes = timeToMinutes(time);
      return slotMinutes >= timeToMinutes(slot.start_time) && slotMinutes < timeToMinutes(slot.end_time);
    });

    return {
      time,
      bookings: slotBookings,
      isBlocked: Boolean(blockedSlot),
      blockReason: getLocalizedBlockReason(blockedSlot, language),
      available: !blockedSlot && slotBookings.length === 0,
    };
  });
}

function getLocalizedBlockReason(blockedSlot: ScheduleBlockedSlot | undefined, language: 'fi' | 'en' | string) {
  if (!blockedSlot) return undefined;
  const localizedReason = language === 'fi' ? blockedSlot.reason_fi : blockedSlot.reason_en;
  return localizedReason?.trim() || blockedSlot.reason?.trim() || undefined;
}
