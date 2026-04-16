import React from 'react';

import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

import type { BookingConversationMessage } from './types';

interface BookingThreadViewerProps {
  language: string;
  message: BookingConversationMessage | null;
  theme: string;
  t: (key: string) => string;
  onReply: (message: BookingConversationMessage) => void;
}

export function BookingThreadViewer({
  language,
  message,
  theme,
  t,
  onReply,
}: BookingThreadViewerProps) {
  if (!message) {
    return (
      <section className={`flex min-h-[320px] min-w-0 items-center justify-center border-t px-6 py-10 lg:border-t-0 xl:min-h-0 xl:border-r ${theme === 'dark' ? 'border-white/10 bg-[#111318] text-gray-400' : 'border-gray-200 bg-white text-gray-600'}`}>
        <div className="max-w-sm text-center">
          <p className="text-base font-medium">{language === 'fi' ? 'Valitse viesti' : 'Select a message'}</p>
          <p className="mt-2 text-sm">
            {language === 'fi'
              ? 'Avaa viesti vasemmalta nähdäksesi koko sisällön ja vastataksesi siihen.'
              : 'Open a message from the left rail to read the full content and reply.'}
          </p>
        </div>
      </section>
    );
  }

  const timestamp = message.receivedAt || message.sentAt || message.createdAt;
  const isInbound = message.direction === 'inbound';
  const body = (message.bodyText || message.snippet || '').trim();

  return (
    <section className={`flex min-h-0 min-w-0 flex-col border-t lg:border-t-0 ${theme === 'dark' ? 'border-white/10 bg-[#111318]' : 'border-gray-200 bg-white'} xl:border-r`}>
      <div className={`border-b px-6 py-5 ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{message.subject || (language === 'fi' ? 'Viesti' : 'Message')}</p>
            <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {isInbound ? (message.fromEmail || '—') : (message.toEmail || '—')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary">{isInbound ? t('receivedLabel') : t('sentLabel')}</Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReply(message)}
              className={theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : ''}
            >
              {t('replyToMessage')}
            </Button>
          </div>
        </div>

        <p className={`mt-3 text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
          {new Date(timestamp).toLocaleString(language === 'fi' ? 'fi-FI' : 'en-US')}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className={`prose prose-sm max-w-none whitespace-pre-wrap break-words leading-7 ${theme === 'dark' ? 'prose-invert text-gray-200' : 'text-gray-800'}`}>
          {body || '—'}
        </div>
      </div>
    </section>
  );
}
