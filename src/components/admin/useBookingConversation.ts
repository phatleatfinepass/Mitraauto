import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { getSupabaseClient } from '../../utils/supabase/client';
import type { ScheduleBooking } from '../../utils/schedule';
import type {
  BookingConversationMessage,
  BookingConversationState,
  BookingMessageDraft,
} from './AdminSchedule.types';

interface UseBookingConversationArgs {
  buildCustomerCompletionDraft: (booking: ScheduleBooking) => { subject: string; message: string };
  getBookingLanguage: (booking: ScheduleBooking) => 'fi' | 'en';
  language: string;
  setBookingExpanded: (bookingId: string, expanded: boolean) => void;
  t: (key: string) => string;
}

export function useBookingConversation({
  buildCustomerCompletionDraft,
  getBookingLanguage,
  language,
  setBookingExpanded,
  t,
}: UseBookingConversationArgs) {
  const [composeMessageBookingId, setComposeMessageBookingId] = useState<string | null>(null);
  const [messageDrafts, setMessageDrafts] = useState<Record<string, BookingMessageDraft>>({});
  const [bookingConversations, setBookingConversations] = useState<Record<string, BookingConversationState>>({});
  const [loadingConversationBookingId, setLoadingConversationBookingId] = useState<string | null>(null);
  const [sendingMessageBookingId, setSendingMessageBookingId] = useState<string | null>(null);

  const ensureReplySubject = useCallback((subject?: string | null) => {
    const trimmed = (subject || '').trim();
    if (!trimmed) {
      return language === 'fi' ? 'Vastaus varaukseesi liittyen' : 'Reply regarding your booking';
    }

    return /^re:/i.test(trimmed) ? trimmed : `Re: ${trimmed}`;
  }, [language]);

  const buildReplyBody = useCallback((message: BookingConversationMessage) => {
    const source = (message.bodyText || message.snippet || '').trim();
    if (!source) return '';

    return `\n\n${source.split('\n').map((line) => `> ${line}`).join('\n')}`;
  }, []);

  const loadBookingConversation = useCallback(async (bookingId: string, sync = false) => {
    setLoadingConversationBookingId(bookingId);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.functions.invoke('gmail_get_booking_conversation', {
        method: 'POST',
        body: {
          bookingId,
          sync,
        },
      });

      if (error) throw error;

      setBookingConversations((current) => ({
        ...current,
        [bookingId]: data as BookingConversationState,
      }));
    } catch (error) {
      console.error('Error loading booking conversation:', error);
      toast.error(t('conversationLoadFailed'));
    } finally {
      setLoadingConversationBookingId((current) => (current === bookingId ? null : current));
    }
  }, [t]);

  const refreshBookingConversationIfLoaded = useCallback(async (bookingId: string) => {
    if (!bookingConversations[bookingId]) return;
    await loadBookingConversation(bookingId, true);
  }, [bookingConversations, loadBookingConversation]);

  const handleToggleBookingExpanded = useCallback((booking: ScheduleBooking, expanded: boolean) => {
    setBookingExpanded(booking.id, expanded);
    if (expanded && booking.customer_email) {
      void loadBookingConversation(booking.id, true);
    }
  }, [loadBookingConversation, setBookingExpanded]);

  const handleSyncBookingConversation = useCallback(async (bookingId: string) => {
    await loadBookingConversation(bookingId, true);
  }, [loadBookingConversation]);

  const handleBookingMessageDraftChange = useCallback((
    bookingId: string,
    field: keyof BookingMessageDraft,
    value: string,
  ) => {
    setMessageDrafts((current) => ({
      ...current,
      [bookingId]: {
        ...(current[bookingId] || { subject: '', message: '' }),
        [field]: value,
      },
    }));
  }, []);

  const handleOpenMessageComposer = useCallback((booking: ScheduleBooking, replyTo?: BookingConversationMessage) => {
    if (!booking.customer_email) {
      toast.error(t('noEmailNoSend'));
      return;
    }

    const messageLanguage = getBookingLanguage(booking);
    const isCompletionFlow = (booking.status || '').trim().toLowerCase() === 'awaiting_customer_completion';
    setComposeMessageBookingId((current) => (current === booking.id ? null : booking.id));
    setBookingExpanded(booking.id, true);
    setMessageDrafts((current) => ({
      ...current,
      [booking.id]: replyTo
        ? {
            subject: ensureReplySubject(replyTo.subject),
            message: buildReplyBody(replyTo),
          }
        : current[booking.id] || {
            subject: isCompletionFlow
              ? (messageLanguage === 'fi' ? 'Täydennä varauksesi tiedot' : 'Complete your booking details')
              : (messageLanguage === 'fi' ? 'Viesti varaukseesi liittyen' : 'Message regarding your booking'),
            message: isCompletionFlow
              ? buildCustomerCompletionDraft(booking).message
              : '',
          },
    }));
    void loadBookingConversation(booking.id, true);
  }, [
    buildCustomerCompletionDraft,
    buildReplyBody,
    ensureReplySubject,
    getBookingLanguage,
    loadBookingConversation,
    setBookingExpanded,
    t,
  ]);

  const handleSendBookingMessage = useCallback(async (booking: ScheduleBooking) => {
    const draft = messageDrafts[booking.id];
    if (!booking.customer_email) {
      toast.error(t('noEmailNoSend'));
      return;
    }
    if (!draft?.subject.trim() || !draft?.message.trim()) {
      toast.error(t('messageRequired'));
      return;
    }

    setSendingMessageBookingId(booking.id);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.functions.invoke('send_booking_message', {
        method: 'POST',
        body: {
          bookingId: booking.id,
          customerName: booking.customer_name || '',
          customerEmail: booking.customer_email,
          licensePlate: booking.license_plate,
          bookingDate: booking.booking_date,
          bookingTime: booking.booking_time,
          serviceName: booking.service_name || 'Service',
          language: getBookingLanguage(booking),
          subject: draft.subject.trim(),
          message: draft.message.trim(),
        },
      });

      if (error) {
        throw error;
      }

      toast.success(t('adminMessageSent'));
      await loadBookingConversation(booking.id, true);
      setComposeMessageBookingId(null);
      setMessageDrafts((current) => {
        const next = { ...current };
        delete next[booking.id];
        return next;
      });
    } catch (error) {
      console.error('Error sending booking message:', error);
      toast.error(t('adminMessageFailed'));
    } finally {
      setSendingMessageBookingId(null);
    }
  }, [getBookingLanguage, loadBookingConversation, messageDrafts, t]);

  return {
    bookingConversations,
    composeMessageBookingId,
    handleBookingMessageDraftChange,
    handleOpenMessageComposer,
    handleSendBookingMessage,
    handleSyncBookingConversation,
    handleToggleBookingExpanded,
    loadBookingConversation,
    loadingConversationBookingId,
    messageDrafts,
    refreshBookingConversationIfLoaded,
    sendingMessageBookingId,
    setComposeMessageBookingId,
  };
}
