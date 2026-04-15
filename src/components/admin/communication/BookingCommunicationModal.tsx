import React from 'react';

import { Badge } from '../../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import type { ScheduleBooking } from '../../../utils/schedule';
import type {
  BookingConversationMessage,
  BookingConversationState,
  BookingMessageDraft,
} from './types';
import { BookingCommunicationPanel } from './BookingCommunicationPanel';

interface BookingCommunicationModalProps {
  booking: ScheduleBooking | null;
  conversation?: BookingConversationState;
  isLoadingConversation: boolean;
  language: string;
  messageDraft?: BookingMessageDraft;
  open: boolean;
  sending: boolean;
  theme: string;
  t: (key: string) => string;
  onDraftChange: (bookingId: string, field: keyof BookingMessageDraft, value: string) => void;
  onOpenChange: (open: boolean) => void;
  onReply: (booking: ScheduleBooking, message: BookingConversationMessage) => void;
  onSend: (booking: ScheduleBooking) => void;
  onSync: (bookingId: string) => void;
}

export function BookingCommunicationModal({
  booking,
  conversation,
  isLoadingConversation,
  language,
  messageDraft,
  open,
  sending,
  theme,
  t,
  onDraftChange,
  onOpenChange,
  onReply,
  onSend,
  onSync,
}: BookingCommunicationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`h-[min(88vh,920px)] max-w-[min(1360px,calc(100vw-2rem))] overflow-hidden p-0 ${theme === 'dark' ? 'border-white/10 bg-[#0F1117] text-white' : 'border-gray-200 bg-[#F3F2EE]'}`}>
        {booking ? (
          <>
            <DialogHeader className={`border-b px-6 py-5 ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <DialogTitle className="text-xl font-semibold">
                    {language === 'fi' ? 'Viestintäkeskus' : 'Communication hub'}
                  </DialogTitle>
                  <DialogDescription className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {language === 'fi'
                      ? 'Keskustele asiakkaan kanssa samassa varausketjussa.'
                      : 'Manage the customer conversation in one booking thread.'}
                  </DialogDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{booking.customer_email || '—'}</Badge>
                  <Badge variant="secondary">{booking.license_plate || '—'}</Badge>
                  <Badge variant="secondary">{booking.booking_date} · {booking.booking_time}</Badge>
                </div>
              </div>
            </DialogHeader>

            <div className="min-h-0 flex-1 px-6 py-5">
              <BookingCommunicationPanel
                booking={booking}
                conversation={conversation}
                isLoadingConversation={isLoadingConversation}
                language={language}
                messageDraft={messageDraft}
                sending={sending}
                theme={theme}
                t={t}
                onDraftChange={onDraftChange}
                onReply={onReply}
                onSend={onSend}
                onSync={onSync}
              />
            </div>
          </>
        ) : (
          <div className="px-6 py-8">
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              {language === 'fi'
                ? 'Valitse ensin varaus avataksesi viestintäkeskuksen.'
                : 'Select a booking first to open the communication hub.'}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
