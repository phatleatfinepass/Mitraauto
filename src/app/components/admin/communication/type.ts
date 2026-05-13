export interface BookingMessageDraft {
  subject: string;
  message: string;
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
