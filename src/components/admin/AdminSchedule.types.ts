import type { SupportedBookingLanguage } from '../../utils/serviceCatalog';
import type { ScheduleBooking } from '../../utils/schedule';

export interface AdminBookingFormState {
  license_plate: string;
  booking_date: string;
  booking_time: string;
  booking_language: SupportedBookingLanguage;
  service_name: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  notes: string;
}

export interface BookingMessageDraft {
  subject: string;
  message: string;
}

export interface BookingListGroup {
  date: string;
  bookings: ScheduleBooking[];
}
