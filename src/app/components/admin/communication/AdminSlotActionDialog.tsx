import React from 'react';
import { CheckSquare, Lock, PlusCircle } from 'lucide-react';

import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Textarea } from '../../ui/textarea';
import type { ScheduleTimeSlot } from '../../../utils/schedule';

interface AdminSlotActionDialogProps {
  blockReason: string;
  formatDate: (date: Date) => string;
  language: string;
  onBlockReasonChange: (value: string) => void;
  onCreateBooking: () => void;
  onOpenChange: (open: boolean) => void;
  onStartBatchBlock: () => void;
  onBlockSlot: () => void;
  open: boolean;
  selectedDate: Date;
  slot: ScheduleTimeSlot | null;
  slotTime: string | null;
  t: (key: string) => string;
  theme: string;
}

export function AdminSlotActionDialog({
  blockReason,
  formatDate,
  language,
  onBlockReasonChange,
  onCreateBooking,
  onOpenChange,
  onStartBatchBlock,
  onBlockSlot,
  open,
  selectedDate,
  slot,
  slotTime,
  t,
  theme,
}: AdminSlotActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={theme === 'dark' ? 'border-white/10 bg-[#16181D] text-white' : ''}>
        <DialogHeader>
          <DialogTitle>{t('slotActions')}</DialogTitle>
          <DialogDescription className={theme === 'dark' ? 'text-gray-400' : ''}>
            {t('slotActionsDescription')}
          </DialogDescription>
        </DialogHeader>

        {slotTime && (
          <div className="space-y-4">
            <div className={`rounded-xl border p-4 ${theme === 'dark' ? 'border-white/10 bg-[#1C1C1E]' : 'border-gray-200 bg-gray-50'}`}>
              <p className="text-xs uppercase tracking-[0.08em] text-gray-500">{t('slotSummary')}</p>
              <p className={`mt-2 text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {formatDate(selectedDate)} — {slotTime}
              </p>
              {slot?.isBlocked && (
                <p className="mt-2 text-sm text-red-500">{slot.blockReason || t('slotBlocked')}</p>
              )}
            </div>

            {!slot?.isBlocked && (
              <div className="space-y-2">
                <label className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('reasonOptional')}
                </label>
                <Textarea
                  value={blockReason}
                  onChange={(event) => onBlockReasonChange(event.target.value)}
                  placeholder={language === 'fi' ? 'Esim. Huoltokatko' : 'e.g. Maintenance'}
                  className={theme === 'dark' ? 'border-white/10 bg-[#11141A] text-white' : ''}
                  rows={3}
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter className="sm:grid sm:grid-cols-3">
          <Button variant="outline" onClick={onCreateBooking} className={theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : ''}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('createInThisSlot')}
          </Button>
          <Button
            onClick={onBlockSlot}
            disabled={Boolean(slot?.isBlocked)}
            className="bg-[#FF6B35] hover:bg-[#FF6B35]/90"
          >
            <Lock className="mr-2 h-4 w-4" />
            {t('blockThisSlot')}
          </Button>
          <Button variant="outline" onClick={onStartBatchBlock} className={theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : ''}>
            <CheckSquare className="mr-2 h-4 w-4" />
            {t('blockMultipleTimeSlots')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
