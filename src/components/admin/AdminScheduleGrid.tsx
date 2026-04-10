import React from 'react';
import { AlertCircle, Clock, Lock } from 'lucide-react';

import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import type { ScheduleTimeSlot } from '../../utils/schedule';

interface AdminScheduleGridProps {
  handleSlotClick: (slot: ScheduleTimeSlot, time: string) => void;
  isSunday: boolean;
  loading: boolean;
  mutedTextClass: string;
  panelClass: string;
  selectedBlockTimes: string[];
  t: (key: string) => string;
  theme: string;
  timeSlots: ScheduleTimeSlot[];
  titleClass: string;
}

export function AdminScheduleGrid({
  handleSlotClick,
  isSunday,
  loading,
  mutedTextClass,
  panelClass,
  selectedBlockTimes,
  t,
  theme,
  timeSlots,
  titleClass,
}: AdminScheduleGridProps) {
  return (
    <Card className={`rounded-lg p-4 shadow-none ${panelClass}`}>
      {isSunday ? (
        <div className="flex h-[520px] flex-col items-center justify-center">
          <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
            <AlertCircle className={`h-5 w-5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>
          <h3 className={`mb-2 text-lg font-semibold ${titleClass}`}>{t('closed')}</h3>
          <p className={mutedTextClass}>{t('sundayClosed')}</p>
        </div>
      ) : loading ? (
        <div className="flex h-[520px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[#E74C3C]" />
        </div>
      ) : (
        <div className="space-y-2">
          {timeSlots.map((slot) => (
            <div
              key={slot.time}
              onClick={() => handleSlotClick(slot, slot.time)}
              className={`cursor-pointer rounded-lg border px-4 py-3 transition-colors ${
                selectedBlockTimes.includes(slot.time)
                  ? theme === 'dark'
                    ? 'border-[#E74C3C] bg-[#E74C3C]/10'
                    : 'border-[#E74C3C] bg-[#FFF1EE]'
                  : slot.isBlocked
                    ? theme === 'dark'
                      ? 'border-red-900/50 bg-red-950/20 hover:bg-red-950/30'
                      : 'border-red-200 bg-red-50 hover:bg-red-100'
                    : slot.bookings.length > 0
                      ? theme === 'dark'
                        ? 'border-emerald-900/40 bg-emerald-950/10 hover:bg-emerald-950/20'
                        : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                      : theme === 'dark'
                        ? 'border-white/10 bg-[#16181D] hover:bg-[#202228]'
                        : 'border-gray-200 bg-[#FAFAFA] hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Clock className={`h-4 w-4 ${mutedTextClass}`} />
                  <span className={`font-mono text-sm font-medium ${titleClass}`}>{slot.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  {slot.isBlocked ? (
                    <Badge variant="destructive" className="bg-red-600">
                      <Lock className="mr-1 h-3 w-3" />
                      {t('blocked')}
                    </Badge>
                  ) : slot.bookings.length > 0 ? (
                    <>
                      <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                        {t('booked')} ({slot.bookings.length})
                      </Badge>
                      <div className="hidden gap-2 sm:flex">
                        {slot.bookings.slice(0, 2).map((booking, idx) => (
                          <span
                            key={idx}
                            className={`rounded-md px-2 py-1 text-xs ${theme === 'dark' ? 'bg-white/10 text-gray-300' : 'bg-white text-gray-700'}`}
                          >
                            {booking.license_plate}
                          </span>
                        ))}
                        {slot.bookings.length > 2 && (
                          <span className={`rounded-md px-2 py-1 text-xs ${theme === 'dark' ? 'bg-white/10 text-gray-300' : 'bg-white text-gray-700'}`}>
                            +{slot.bookings.length - 2}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <span className={`text-sm ${mutedTextClass}`}>{t('emptySlot')}</span>
                  )}
                </div>
              </div>
              {slot.isBlocked && slot.blockReason && <p className={`mt-2 text-xs ${mutedTextClass}`}>{slot.blockReason}</p>}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
