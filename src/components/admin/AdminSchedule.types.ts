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
  status: string;
}

export interface BookingMessageDraft {
  subject: string;
  message: string;
}

export interface BookingListGroup {
  date: string;
  bookings: ScheduleBooking[];
}

export interface BookingConversationMessage {
  id: string;
  direction: 'inbound' | 'outbound';
  fromEmail: string | null;
  toEmail: string | null;
  subject: string | null;
  snippet: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  sentAt: string | null;
  receivedAt: string | null;
  createdAt: string;
}

export interface BookingConversationThread {
  id: string;
  provider: string;
  providerThreadId: string | null;
  subject: string | null;
  status: string | null;
  historyId: string | null;
  lastMessageAt: string | null;
  lastSyncedAt: string | null;
}

export interface BookingConversationState {
  booking: {
    id: string;
    customerName: string | null;
    customerEmail: string | null;
    status: string | null;
    serviceName: string | null;
    bookingDate: string;
    bookingTime: string;
    licensePlate: string | null;
  };
  mailboxEmail: string;
  thread: BookingConversationThread | null;
  messages: BookingConversationMessage[];
}
