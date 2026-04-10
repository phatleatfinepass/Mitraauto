import React from 'react';
import { Calendar as CalendarIcon, CheckSquare, ChevronRight } from 'lucide-react';

import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Card } from '../ui/card';
import { Textarea } from '../ui/textarea';

interface AdminScheduleSidebarProps {
  blockReason: string;
  formatDate: (date: Date) => string;
  isBatchBlockMode: boolean;
  isSunday: boolean;
  language: string;
  mutedPanelClass: string;
  mutedTextClass: string;
  outlineButtonClass: string;
  panelClass: string;
  selectedBlockTimes: string[];
  selectedDate: Date;
  setBlockReason: React.Dispatch<React.SetStateAction<string>>;
  setIsBatchBlockMode: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedBlockTimes: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
  t: (key: string) => string;
  theme: string;
  titleClass: string;
}

export function AdminScheduleSidebar({
  blockReason,
  formatDate,
  isBatchBlockMode,
  isSunday,
  language,
  mutedPanelClass,
  mutedTextClass,
  outlineButtonClass,
  panelClass,
  selectedBlockTimes,
  selectedDate,
  setBlockReason,
  setIsBatchBlockMode,
  setSelectedBlockTimes,
  setSelectedDate,
  t,
  theme,
  titleClass,
}: AdminScheduleSidebarProps) {
  return (
    <aside className={`space-y-4 p-4 xl:border-r ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
      <Card className={`rounded-lg p-4 shadow-none ${panelClass}`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className={`text-sm font-semibold ${titleClass}`}>{t('selectDate')}</h3>
            <p className={`mt-1 text-xs ${mutedTextClass}`}>
              {language === 'fi' ? 'Valitse päivä ja tarkastele kapasiteettia reaaliajassa.' : 'Pick a day and review capacity in real time.'}
            </p>
          </div>
          <Badge variant="secondary" className={theme === 'dark' ? 'bg-white/10 text-gray-200' : 'bg-gray-100 text-gray-700'}>
            {isSunday ? t('closed') : formatDate(selectedDate)}
          </Badge>
        </div>
        <div className={`rounded-lg border p-2 ${mutedPanelClass}`}>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            weekStartsOn={1}
            modifiers={{ sunday: { dayOfWeek: [0] } }}
            modifiersClassNames={{
              sunday: theme === 'dark' ? 'text-gray-500' : 'text-gray-400',
            }}
            className={`${theme === 'dark' ? '[&_.rdp-day_selected]:bg-[#E74C3C] [&_.rdp-head_cell:last-child]:text-gray-500' : '[&_.rdp-head_cell:last-child]:text-gray-400'}`}
            classNames={{
              head_cell: `rounded-md w-8 font-normal text-[0.8rem] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`,
            }}
          />
        </div>
      </Card>

      <Card className={`rounded-lg p-4 shadow-none ${panelClass}`}>
        <div className="mb-4">
          <h3 className={`text-sm font-semibold ${titleClass}`}>{language === 'fi' ? 'Pikatoiminnot' : 'Quick actions'}</h3>
          <p className={`mt-1 text-xs ${mutedTextClass}`}>
            {language === 'fi' ? 'Siirry nopeasti seuraaviin vapaisiin päiviin tai aloita estojen hallinta.' : 'Jump to the next key day or start block management quickly.'}
          </p>
        </div>
        <div className="space-y-2">
          <Button
            variant="ghost"
            className={`w-full justify-start ${theme === 'dark' ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
            onClick={() => setSelectedDate(new Date())}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {t('today')}
          </Button>
          <Button
            variant="ghost"
            className={`w-full justify-start ${theme === 'dark' ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
            onClick={() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              setSelectedDate(tomorrow);
            }}
          >
            <ChevronRight className="mr-2 h-4 w-4" />
            {t('tomorrow')}
          </Button>
          <Button
            variant={isBatchBlockMode ? 'default' : 'outline'}
            onClick={() => {
              setIsBatchBlockMode((current) => !current);
              setSelectedBlockTimes([]);
              setBlockReason('');
            }}
            className={isBatchBlockMode ? 'bg-[#E74C3C] hover:bg-[#E74C3C]/90 text-white' : outlineButtonClass}
          >
            <CheckSquare className="mr-2 h-4 w-4" />
            {isBatchBlockMode ? t('cancelSelection') : t('selectSlotsToBlock')}
          </Button>
        </div>
      </Card>

      {isBatchBlockMode && (
        <Card className={`rounded-lg p-4 shadow-none ${panelClass}`}>
          <div className="space-y-3">
            <div>
              <h3 className={`text-sm font-semibold ${titleClass}`}>{t('blockSelectedSlots')}</h3>
              <p className={`mt-1 text-xs ${mutedTextClass}`}>
                {selectedBlockTimes.length} {t('slotsSelected')}
              </p>
            </div>
            <Textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder={language === 'fi' ? 'Syy estolle (valinnainen)' : 'Reason for blocking (optional)'}
              className={theme === 'dark' ? 'bg-[#252525] border-white/10 text-white' : ''}
              rows={3}
            />
          </div>
        </Card>
      )}
    </aside>
  );
}
