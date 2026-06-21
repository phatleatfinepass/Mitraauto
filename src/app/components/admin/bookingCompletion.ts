import type { ScheduleBooking } from '../../utils/schedule';
import { translateForLanguage } from '../../i18n/LanguageContext';
import type { Language } from '../../i18n/types';
import type { AdminBookingFormState } from './schedule/AdminSchedule.types';

export const awaitingCustomerCompletionStatus = 'awaiting_customer_completion';

export function normalizeBookingStatus(status?: string | null) {
  return (status || 'confirmed').trim().toLowerCase();
}

export function getMissingCompletionFields(
  bookingLike: Partial<Pick<ScheduleBooking, 'license_plate' | 'customer_phone' | 'customer_email'>>,
  language: string,
) {
  const missingFields: string[] = [];
  const bookingLanguage = normalizeCompletionLanguage(language);
  const completionText = (key: string) => translateForLanguage(bookingLanguage, `adminSchedule.${key}`);

  if (!bookingLike.license_plate?.trim()) {
    missingFields.push(completionText('missingLicensePlate'));
  }
  if (!bookingLike.customer_phone?.trim()) {
    missingFields.push(completionText('missingPhone'));
  }
  if (!bookingLike.customer_email?.trim()) {
    missingFields.push(completionText('missingEmail'));
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
  const bookingLanguage = normalizeCompletionLanguage(language);
  const completionText = (key: string) => translateForLanguage(bookingLanguage, `adminSchedule.${key}`);
  const missingFields = getMissingCompletionFields(booking, language);
  const bookingLabel = `${booking.booking_date} ${booking.booking_time}`.trim();
  const missingList = missingFields.length > 0
    ? missingFields.join(', ')
    : completionText('customerDetailsFallback');
  const greeting = translateForLanguage(bookingLanguage, 'adminSchedule.completionDraftGreeting', {
    customerName: booking.customer_name || '',
  }).trim();

  return {
    subject: completionText('completionDraftSubject'),
    message: translateForLanguage(bookingLanguage, 'adminSchedule.completionDraftMessage', {
      greeting,
      bookingLabel,
      missingList,
    }),
  };
}

function normalizeCompletionLanguage(language: string): Language {
  return ({ fi: 'fi', en: 'en' } as const)[language as Language] ?? 'en';
}
