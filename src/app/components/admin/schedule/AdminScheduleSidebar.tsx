import React from 'react';

import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Calendar } from '../../ui/calendar';
import { Card } from '../../ui/card';

interface AdminScheduleSidebarProps {
  formatDate: (date: Date) => string;
  isSunday: boolean;
  language: string;
  mutedPanelClass: string;
  mutedTextClass: string;
  outlineButtonClass: string;
  onLogout?: () => void;
  panelClass: string;
  selectedDate: Date;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
  t: (key: string) => string;
  theme: string;
  titleClass: string;
}

export function AdminScheduleSidebar({
  formatDate,
  isSunday,
  language,
  mutedPanelClass,
  mutedTextClass,
  outlineButtonClass,
  onLogout,
  panelClass,
  selectedDate,
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

      {onLogout && (
        <Button variant="outline" onClick={onLogout} className={outlineButtonClass}>
          {language === 'fi' ? 'Kirjaudu ulos' : 'Logout'}
        </Button>
      )}
    </aside>
  );
}
