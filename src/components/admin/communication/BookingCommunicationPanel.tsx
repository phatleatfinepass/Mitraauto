import React from 'react';
import { MailPlus, RefreshCw, Reply } from 'lucide-react';

import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';

import type { ScheduleBooking } from '../../../utils/schedule';
import type {
  BookingConversationMessage,
  BookingConversationState,
  BookingMessageDraft,
} from './types';

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

  return (
    <div className={`grid min-h-[72vh] gap-0 overflow-hidden rounded-xl border ${theme === 'dark' ? 'border-white/10 bg-[#111318] text-white' : 'border-gray-200 bg-white text-gray-900'} lg:grid-cols-[360px_minmax(0,1fr)]`}>
      <section className={`min-w-0 ${theme === 'dark' ? 'border-white/10 bg-[#0F1117]' : 'border-gray-200 bg-[#F7F7F5]'} lg:border-r`}>
        <div className={`flex items-start justify-between gap-3 border-b px-5 py-4 ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
          <div className="min-w-0">
            <h3 className="text-base font-semibold">{t('conversationHistory')}</h3>
            <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'fi'
                ? 'Sama ketju kaikille varaukseen liittyville viesteille.'
                : 'One thread for all booking-related messages.'}
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onSync(booking.id)}
            disabled={isLoadingConversation}
            className={`shrink-0 ${theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : ''}`}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingConversation ? 'animate-spin' : ''}`} />
            {isLoadingConversation ? t('syncingConversation') : t('syncConversation')}
          </Button>
        </div>

        <div className={`border-b px-5 py-4 ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
          <div className="space-y-3 text-sm">
            <div>
              <span className="block text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">
                {language === 'fi' ? 'Asiakas' : 'Customer'}
              </span>
              <p className="mt-1 font-medium">{booking.customer_name || booking.customer_email || '—'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{conversation?.thread ? t('threadConnected') : t('noThreadYet')}</Badge>
              <Badge variant="secondary">{booking.license_plate || '—'}</Badge>
            </div>
            <div>
              <span className="block text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">
                {language === 'fi' ? 'Viimeksi synkronoitu' : 'Last synced'}
              </span>
              <p className={`mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {conversation?.thread?.lastSyncedAt
                  ? new Date(conversation.thread.lastSyncedAt).toLocaleString(language === 'fi' ? 'fi-FI' : 'en-US')
                  : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="max-h-[calc(72vh-190px)] overflow-y-auto px-4 py-4">
          {isLoadingConversation ? (
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('conversationLoading')}
            </p>
          ) : conversationMessages.length > 0 ? (
            <div className="space-y-3">
              {conversationMessages.map((message) => {
                const timestamp = message.receivedAt || message.sentAt || message.createdAt;
                const isInbound = message.direction === 'inbound';
                const preview = (message.bodyText || message.snippet || '—').replace(/\s+/g, ' ').trim();

                return (
                  <article
                    key={message.id}
                    className={`rounded-lg border px-4 py-3 ${
                      isInbound
                        ? theme === 'dark'
                          ? 'border-emerald-500/20 bg-emerald-500/5'
                          : 'border-emerald-200 bg-emerald-50'
                        : theme === 'dark'
                          ? 'border-white/10 bg-[#171A21]'
                          : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {isInbound ? (message.fromEmail || '—') : (message.toEmail || '—')}
                        </p>
                        {message.subject && (
                          <p className={`truncate text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {message.subject}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">
                          {isInbound ? t('receivedLabel') : t('sentLabel')}
                        </p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(timestamp).toLocaleString(language === 'fi' ? 'fi-FI' : 'en-US')}
                        </p>
                      </div>
                    </div>

                    <p className={`line-clamp-4 text-sm leading-6 break-words ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                      {preview}
                    </p>

                    <div className="mt-3 flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onReply(booking, message)}
                        className={theme === 'dark' ? 'text-gray-200 hover:bg-white/5' : ''}
                      >
                        <Reply className="mr-2 h-4 w-4" />
                        {t('replyToMessage')}
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={`rounded-lg border border-dashed px-4 py-6 text-sm ${theme === 'dark' ? 'border-white/10 text-gray-400' : 'border-gray-300 text-gray-600'}`}>
              {t('conversationEmpty')}
            </div>
          )}
        </div>
      </section>

      <section className={`min-w-0 ${theme === 'dark' ? 'bg-[#111318]' : 'bg-white'}`}>
        <div className={`border-b px-6 py-4 ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
          <h3 className="text-base font-semibold">{t('sendMessage')}</h3>
          <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {booking.customer_email || '—'}
          </p>
        </div>

        <div className="grid gap-6 px-6 py-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('messageSubject')}</label>
              <Input
                value={messageDraft?.subject || ''}
                onChange={(e) => onDraftChange(booking.id, 'subject', e.target.value)}
                placeholder={t('messageSubjectPlaceholder')}
                className={theme === 'dark' ? 'border-white/10 bg-[#0D1015] text-white' : ''}
              />
            </div>

            <div className="space-y-2">
              <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('messageBody')}</label>
              <Textarea
                value={messageDraft?.message || ''}
                onChange={(e) => onDraftChange(booking.id, 'message', e.target.value)}
                placeholder={t('messageBodyPlaceholder')}
                rows={16}
                className={theme === 'dark' ? 'border-white/10 bg-[#0D1015] text-white' : ''}
              />
            </div>

            <Button
              onClick={() => onSend(booking)}
              disabled={sending}
              className="min-w-[220px] justify-center rounded-md bg-[#FF6B35] hover:bg-[#FF6B35]/90"
            >
              <MailPlus className="mr-2 h-4 w-4" />
              {sending ? t('sendingMessage') : t('sendMessage')}
            </Button>
          </div>

          <aside className={`space-y-4 rounded-lg border p-4 ${theme === 'dark' ? 'border-white/10 bg-[#0D1015]' : 'border-gray-200 bg-[#F7F7F5]'}`}>
            <div>
              <h4 className="text-sm font-semibold">{language === 'fi' ? 'Varaustiedot' : 'Booking context'}</h4>
              <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {language === 'fi'
                  ? 'Pidä viesti sidottuna tähän varaukseen.'
                  : 'Keep the message tied to this booking.'}
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="block text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">{language === 'fi' ? 'Palvelu' : 'Service'}</span>
                <p className={`mt-1 break-words ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{booking.service_name || '—'}</p>
              </div>
              <div>
                <span className="block text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">{language === 'fi' ? 'Ajankohta' : 'When'}</span>
                <p className={`mt-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{booking.booking_date} · {booking.booking_time}</p>
              </div>
              <div>
                <span className="block text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">{language === 'fi' ? 'Rekisterinumero' : 'Plate'}</span>
                <p className={`mt-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{booking.license_plate || '—'}</p>
              </div>
              <div>
                <span className="block text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">{language === 'fi' ? 'Ketjun tila' : 'Thread status'}</span>
                <p className={`mt-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{conversation?.thread?.status || 'active'}</p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
