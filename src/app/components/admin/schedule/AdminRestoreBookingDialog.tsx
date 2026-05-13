import React from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../ui/alert-dialog';
import { Checkbox } from '../../ui/checkbox';
import type { ScheduleBooking } from '../../../utils/schedule';

interface AdminRestoreBookingDialogProps {
  booking: ScheduleBooking | null;
  restoringBookingId: string | null;
  sendRestoreEmail: boolean;
  onConfirm: (booking: ScheduleBooking) => void;
  onOpenChange: (open: boolean) => void;
  onSendRestoreEmailChange: (checked: boolean) => void;
  t: (key: string) => string;
  theme: string;
}

export function AdminRestoreBookingDialog({
  booking,
  restoringBookingId,
  sendRestoreEmail,
  onConfirm,
  onOpenChange,
  onSendRestoreEmailChange,
  t,
  theme,
}: AdminRestoreBookingDialogProps) {
  return (
    <AlertDialog open={Boolean(booking)} onOpenChange={onOpenChange}>
      <AlertDialogContent className={theme === 'dark' ? 'border-white/10 bg-[#16181D] text-white' : ''}>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('restoreBookingConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription className={theme === 'dark' ? 'text-gray-400' : ''}>
            {t('restoreBookingConfirmDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-start gap-3">
          <Checkbox checked={sendRestoreEmail} onCheckedChange={(checked) => onSendRestoreEmailChange(Boolean(checked))} />
          <label className={`text-sm leading-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {t('sendRestoreEmail')}
          </label>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel className={theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : ''}>
            {t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              if (booking) onConfirm(booking);
            }}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {restoringBookingId ? t('saving') : t('restoreBooking')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
