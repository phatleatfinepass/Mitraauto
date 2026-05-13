import React from 'react';

import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { MailPlus } from 'lucide-react';

import type { ScheduleBooking } from '../../../utils/schedule';
import type { BookingConversationState, BookingMessageDraft } from './types';

interface BookingComposerRailProps {
  booking: ScheduleBooking;
  conversation?: BookingConversationState;
  draft?: BookingMessageDraft;
  language: string;
  sending: boolean;
  theme: string;
  t: (key: string) => string;
  onDraftChange: (field: keyof BookingMessageDraft, value: string) => void;
  onSend: () => void;
}

export function BookingComposerRail({
  booking,
  conversation,
  draft,
  language,
  sending,
  theme,
  t,
  onDraftChange,
  onSend,
}: BookingComposerRailProps) {
  return (
    <aside className={`flex min-h-0 min-w-0 flex-col border-t lg:border-l lg:border-t-0 ${theme === 'dark' ? 'border-white/10 bg-[#0F1117]' : 'border-gray-200 bg-[#F7F7F3]'}`}>
      <div className={`border-b px-5 py-4 ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
        <h3 className="text-sm font-semibold">{t('sendMessage')}</h3>
        <p className={`mt-1 truncate text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {booking.customer_email || '—'}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="space-y-5">
          <div className="space-y-2">
            <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('messageSubject')}</label>
            <Input
              value={draft?.subject || ''}
              onChange={(event) => onDraftChange('subject', event.target.value)}
              placeholder={t('messageSubjectPlaceholder')}
              className={theme === 'dark' ? 'border-white/10 bg-[#11141A] text-white' : ''}
            />
          </div>

          <div className="space-y-2">
            <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('messageBody')}</label>
            <Textarea
              value={draft?.message || ''}
              onChange={(event) => onDraftChange('message', event.target.value)}
              placeholder={t('messageBodyPlaceholder')}
              rows={14}
              className={theme === 'dark' ? 'border-white/10 bg-[#11141A] text-white' : ''}
            />
          </div>

          <Button
            onClick={onSend}
            disabled={sending}
            className="w-full justify-center rounded-md bg-[#FF6B35] text-white hover:bg-[#FF6B35]/90"
          >
            <MailPlus className="mr-2 h-4 w-4" />
            {sending ? t('sendingMessage') : t('sendMessage')}
          </Button>

          <div className={`space-y-4 rounded-lg border p-4 ${theme === 'dark' ? 'border-white/10 bg-[#12151B]' : 'border-gray-200 bg-white'}`}>
            <div>
              <p className="text-sm font-semibold">{language === 'fi' ? 'Varauskonteksti' : 'Booking context'}</p>
              <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {language === 'fi'
                  ? 'Viestit pysyvät sidottuna tähän varaukseen ja samaan ketjuun.'
                  : 'Messages stay tied to this booking and the same thread.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{conversation?.thread ? t('threadConnected') : t('noThreadYet')}</Badge>
              <Badge variant="secondary">{booking.license_plate || '—'}</Badge>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="block text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">
                  {language === 'fi' ? 'Palvelu' : 'Service'}
                </span>
                <p className={`mt-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{booking.service_name || '—'}</p>
              </div>
              <div>
                <span className="block text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">
                  {language === 'fi' ? 'Ajankohta' : 'When'}
                </span>
                <p className={`mt-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{booking.booking_date} · {booking.booking_time}</p>
              </div>
              <div>
                <span className="block text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">
                  {language === 'fi' ? 'Ketjun tila' : 'Thread status'}
                </span>
                <p className={`mt-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{conversation?.thread?.status || 'active'}</p>
              </div>
              <div>
                <span className="block text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">
                  {language === 'fi' ? 'Synkronoitu' : 'Last synced'}
                </span>
                <p className={`mt-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                  {conversation?.thread?.lastSyncedAt
                    ? new Date(conversation.thread.lastSyncedAt).toLocaleString(language === 'fi' ? 'fi-FI' : 'en-US')
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
