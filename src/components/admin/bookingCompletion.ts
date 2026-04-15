import type { ScheduleBooking } from '../../utils/schedule';
import type { AdminBookingFormState } from './AdminSchedule.types';

export const awaitingCustomerCompletionStatus = 'awaiting_customer_completion';

export function normalizeBookingStatus(status?: string | null) {
  return (status || 'confirmed').trim().toLowerCase();
}

export function getMissingCompletionFields(
  bookingLike: Partial<Pick<ScheduleBooking, 'license_plate' | 'customer_phone' | 'customer_email'>>,
  language: string,
) {
  const missingFields: string[] = [];

  if (!bookingLike.license_plate?.trim()) {
    missingFields.push(language === 'fi' ? 'rekisterinumero' : 'license plate');
  }
  if (!bookingLike.customer_phone?.trim()) {
    missingFields.push(language === 'fi' ? 'puhelinnumero' : 'phone number');
  }
  if (!bookingLike.customer_email?.trim()) {
    missingFields.push(language === 'fi' ? 'sähköposti' : 'email');
  }

  return missingFields;
}

export function isBookingAwaitingCustomerCompletion(
  booking: Partial<ScheduleBooking> | AdminBookingFormState,
  language: string,
) {
  return normalizeBookingStatus(booking.status) === awaitingCustomerCompletionStatus
    || getMissingCompletionFields(booking, language).length > 0;
}

export function buildCustomerCompletionDraft(
  booking: Pick<ScheduleBooking, 'booking_date' | 'booking_time' | 'customer_name' | 'customer_phone' | 'customer_email' | 'license_plate'>,
  language: string,
) {
  const missingFields = getMissingCompletionFields(booking, language);
  const bookingLabel = `${booking.booking_date} ${booking.booking_time}`.trim();
  const missingList = missingFields.length > 0
    ? missingFields.join(language === 'fi' ? ', ' : ', ')
    : (language === 'fi' ? 'asiakastiedot' : 'customer details');

  return {
    subject: language === 'fi'
      ? 'Täydennä varauksen tiedot'
      : 'Complete your booking details',
    message: language === 'fi'
      ? `Hei ${booking.customer_name || ''}`.trim() + `\n\nVarauksesi (${bookingLabel}) on valmis asiakkaan täydennystä varten.\nPuuttuvat tiedot: ${missingList}.\n\nVoit vastata tähän viestiin ja täydentää puuttuvat tiedot.`
      : `Hi ${booking.customer_name || ''}`.trim() + `\n\nYour booking (${bookingLabel}) is ready for completion.\nMissing details: ${missingList}.\n\nPlease reply to this message and send the missing information.`,
  };
}
