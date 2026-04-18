import React from 'react';

import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

import type { BookingConversationMessage } from './types';

interface BookingThreadListProps {
  isLoading: boolean;
  language: string;
  messages: BookingConversationMessage[];
  selectedMessageId: string | null;
  theme: string;
  t: (key: string) => string;
  onReply: (message: BookingConversationMessage) => void;
  onSelect: (messageId: string) => void;
  onSync: () => void;
}

export function BookingThreadList({
  isLoading,
  language,
  messages,
  selectedMessageId,
  theme,
  t,
  onReply,
  onSelect,
  onSync,
}: BookingThreadListProps) {
  return (
    <section className={`flex min-h-0 flex-col lg:col-span-2 xl:col-span-1 ${theme === 'dark' ? 'border-white/10 bg-[#0D1015]' : 'border-gray-200 bg-[#F7F7F3]'} xl:border-r`}>
      <div className={`flex items-start justify-between gap-3 border-b px-5 py-4 ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
        <div>
          <h3 className="text-sm font-semibold">{language === 'fi' ? 'Viestit' : 'Messages'}</h3>
          <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('conversationHistory')}
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={onSync}
          disabled={isLoading}
          className={theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : ''}
        >
          {isLoading ? t('syncingConversation') : t('syncConversation')}
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {isLoading ? (
          <p className={`px-2 py-3 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('conversationLoading')}
          </p>
        ) : messages.length === 0 ? (
          <div className={`rounded-lg border border-dashed px-4 py-6 text-sm ${theme === 'dark' ? 'border-white/10 text-gray-400' : 'border-gray-300 text-gray-600'}`}>
            {t('conversationEmpty')}
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => {
              const timestamp = message.receivedAt || message.sentAt || message.createdAt;
              const isSelected = selectedMessageId === message.id;
              const isInbound = message.direction === 'inbound';
              const preview = (message.bodyText || message.snippet || '—').replace(/\s+/g, ' ').trim();

              return (
                <div
                  key={message.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(message.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSelect(message.id);
                    }
                  }}
                  className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                    isSelected
                      ? theme === 'dark'
                        ? 'border-[#FF6B35] bg-[#171A20]'
                        : 'border-[#FF6B35] bg-[#FFF4EF]'
                      : theme === 'dark'
                        ? 'border-white/10 bg-[#12151B] hover:bg-[#151920]'
                        : 'border-gray-200 bg-white hover:bg-[#FAFAFA]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {isInbound ? (message.fromEmail || '—') : (message.toEmail || '—')}
                      </p>
                      <p className={`mt-1 truncate text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {message.subject || '—'}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {isInbound ? t('receivedLabel') : t('sentLabel')}
                    </Badge>
                  </div>

                  <p className={`mt-2 line-clamp-3 text-sm leading-5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {preview}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                      {new Date(timestamp).toLocaleString(language === 'fi' ? 'fi-FI' : 'en-US')}
                    </p>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onReply(message);
                      }}
                      className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      {t('replyToMessage')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
