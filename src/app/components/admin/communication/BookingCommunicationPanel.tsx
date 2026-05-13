import React, { useEffect, useMemo, useState } from 'react';

import type { ScheduleBooking } from '../../../utils/schedule';
import type {
  BookingConversationMessage,
  BookingConversationState,
  BookingMessageDraft,
} from './types';
import { BookingComposerRail } from './BookingComposerRail';
import { BookingThreadList } from './BookingThreadList';
import { BookingThreadViewer } from './BookingThreadViewer';

interface BookingCommunicationPanelProps {
  booking: ScheduleBooking;
  conversation?: BookingConversationState;
  isLoadingConversation: boolean;
  language: string;
  messageDraft?: BookingMessageDraft;
  sending: boolean;
  theme: string;
  t: (key: string) => string;
  onDraftChange: (bookingId: string, field: keyof BookingMessageDraft, value: string) => void;
  onReply: (booking: ScheduleBooking, message: BookingConversationMessage) => void;
  onSend: (booking: ScheduleBooking) => void;
  onSync: (bookingId: string) => void;
}

export function BookingCommunicationPanel({
  booking,
  conversation,
  isLoadingConversation,
  language,
  messageDraft,
  sending,
  theme,
  t,
  onDraftChange,
  onReply,
  onSend,
  onSync,
}: BookingCommunicationPanelProps) {
  const conversationMessages = conversation?.messages ?? [];
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(conversationMessages[0]?.id ?? null);

  useEffect(() => {
    if (conversationMessages.length === 0) {
      setSelectedMessageId(null);
      return;
    }

    setSelectedMessageId((current) =>
      current && conversationMessages.some((message) => message.id === current)
        ? current
        : conversationMessages[0].id,
    );
  }, [conversationMessages]);

  const selectedMessage = useMemo(
    () => conversationMessages.find((message) => message.id === selectedMessageId) ?? null,
    [conversationMessages, selectedMessageId],
  );

  return (
    <div className={`grid min-h-full grid-cols-1 gap-0 overflow-hidden rounded-xl border ${theme === 'dark' ? 'border-white/10 bg-[#111318] text-white' : 'border-gray-200 bg-white text-gray-900'} lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[320px_minmax(0,1fr)_360px]`}>
      <BookingThreadList
        isLoading={isLoadingConversation}
        language={language}
        messages={conversationMessages}
        selectedMessageId={selectedMessageId}
        theme={theme}
        t={t}
        onReply={(message) => onReply(booking, message)}
        onSelect={setSelectedMessageId}
        onSync={() => onSync(booking.id)}
      />

      <BookingThreadViewer
        language={language}
        message={selectedMessage}
        theme={theme}
        t={t}
        onReply={(message) => onReply(booking, message)}
      />

      <BookingComposerRail
        booking={booking}
        conversation={conversation}
        draft={messageDraft}
        language={language}
        sending={sending}
        theme={theme}
        t={t}
        onDraftChange={(field, value) => onDraftChange(booking.id, field, value)}
        onSend={() => onSend(booking)}
      />
    </div>
  );
}
