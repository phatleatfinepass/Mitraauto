import React from 'react';
import { MailPlus, RefreshCw, Reply } from 'lucide-react';

import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

import type { ScheduleBooking } from '../../utils/schedule';
import type {
  BookingConversationMessage,
  BookingConversationState,
  BookingMessageDraft,
} from './AdminSchedule.types';

interface AdminBookingConversationPanelProps {
  booking: ScheduleBooking;
  conversation?: BookingConversationState;
  isLoadingConversation: boolean;
  language: string;
  messageDraft?: BookingMessageDraft;
  sending: boolean;
  theme: string;
  t: (key: string) => string;
  onClose: () => void;
  onDraftChange: (bookingId: string, field: keyof BookingMessageDraft, value: string) => void;
  onReply: (booking: ScheduleBooking, message: BookingConversationMessage) => void;
  onSend: (booking: ScheduleBooking) => void;
  onSync: (bookingId: string) => void;
}

export function AdminBookingConversationPanel({
  booking,
  conversation,
  isLoadingConversation,
  language,
  messageDraft,
  sending,
  theme,
  t,
  onClose,
  onDraftChange,
  onReply,
  onSend,
  onSync,
}: AdminBookingConversationPanelProps) {
  const conversationMessages = conversation?.messages ?? [];

  return (
    <div className={`rounded-md border p-4 ${theme === 'dark' ? 'border-white/10 bg-[#18181B]' : 'border-gray-200 bg-white'}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className={theme === 'dark' ? 'font-medium text-white' : 'font-medium text-gray-900'}>{t('sendMessage')}</h4>
        <Button size="sm" variant="ghost" onClick={onClose}>
          {t('closeComposer')}
        </Button>
      </div>

      <div className={`mb-4 rounded-md border p-3 ${theme === 'dark' ? 'border-white/10 bg-[#15171C]' : 'border-gray-200 bg-[#FCFCFC]'}`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h5 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
              {t('conversationHistory')}
            </h5>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {conversation?.thread ? t('threadConnected') : t('noThreadYet')}
              </Badge>
              {conversation?.thread?.lastSyncedAt && (
                <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('lastSyncedLabel')}: {new Date(conversation.thread.lastSyncedAt).toLocaleString(language === 'fi' ? 'fi-FI' : 'en-US')}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {conversation?.thread?.subject && (
              <span className={`max-w-[240px] truncate text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {conversation.thread.subject}
              </span>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSync(booking.id)}
              disabled={isLoadingConversation}
              className={theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : ''}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingConversation ? 'animate-spin' : ''}`} />
              {isLoadingConversation ? t('syncingConversation') : t('syncConversation')}
            </Button>
          </div>
        </div>

        {isLoadingConversation ? (
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('conversationLoading')}
          </p>
        ) : conversationMessages.length > 0 ? (
          <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
            {conversationMessages.map((message) => {
              const timestamp = message.receivedAt || message.sentAt || message.createdAt;
              const messageLabel = message.direction === 'inbound' ? t('receivedLabel') : t('sentLabel');

              return (
                <div
                  key={message.id}
                  className={`rounded-md border p-3 ${
                    message.direction === 'inbound'
                      ? theme === 'dark'
                        ? 'border-emerald-500/20 bg-emerald-500/5'
                        : 'border-emerald-200 bg-emerald-50'
                      : theme === 'dark'
                      ? 'border-white/10 bg-[#101215]'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                        {message.direction === 'inbound' ? (message.fromEmail || '—') : (message.toEmail || '—')}
                      </p>
                      {message.subject && (
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {message.subject}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">
                        {messageLabel}
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {new Date(timestamp).toLocaleString(language === 'fi' ? 'fi-FI' : 'en-US')}
                      </p>
                    </div>
                  </div>
                  <p className={`whitespace-pre-wrap text-sm leading-6 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                    {message.bodyText || message.snippet || '—'}
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
                </div>
              );
            })}
          </div>
        ) : (
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('conversationEmpty')}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('messageSubject')}</label>
          <Input
            value={messageDraft?.subject || ''}
            onChange={(e) => onDraftChange(booking.id, 'subject', e.target.value)}
            placeholder={t('messageSubjectPlaceholder')}
          />
        </div>
        <div className="space-y-2">
          <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('messageBody')}</label>
          <Textarea
            value={messageDraft?.message || ''}
            onChange={(e) => onDraftChange(booking.id, 'message', e.target.value)}
            placeholder={t('messageBodyPlaceholder')}
            rows={5}
            className={theme === 'dark' ? 'border-white/10 bg-[#11141A] text-white' : ''}
          />
        </div>
        <Button onClick={() => onSend(booking)} disabled={sending} className="bg-[#FF6B35] hover:bg-[#FF6B35]/90">
          <MailPlus className="mr-2 h-4 w-4" />
          {sending ? t('sendingMessage') : t('sendMessage')}
        </Button>
      </div>
    </div>
  );
}
