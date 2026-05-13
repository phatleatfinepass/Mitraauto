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
import { Textarea } from '../../ui/textarea';
import type { ScheduleBooking } from '../../../utils/schedule';

interface AdminCancelBookingDialogProps {
  booking: ScheduleBooking | null;
  cancellingBookingId: string | null;
  cancellationNote: string;
  getBookingServiceNameForCms: (serviceName?: string | null) => string;
  onCancellationNoteChange: (value: string) => void;
  onConfirm: (booking: ScheduleBooking) => void;
  onOpenChange: (open: boolean) => void;
  t: (key: string) => string;
  theme: string;
}

export function AdminCancelBookingDialog({
  booking,
  cancellingBookingId,
  cancellationNote,
  getBookingServiceNameForCms,
  onCancellationNoteChange,
  onConfirm,
  onOpenChange,
  t,
  theme,
}: AdminCancelBookingDialogProps) {
  return (
    <AlertDialog open={Boolean(booking)} onOpenChange={onOpenChange}>
      <AlertDialogContent className={theme === 'dark' ? 'border-white/10 bg-[#16181D] text-white' : ''}>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('cancelBookingConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription className={theme === 'dark' ? 'text-gray-400' : ''}>
            {t('cancelBookingConfirmDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {booking && (
          <div className="space-y-4">
            <div className={`rounded-xl border p-3 ${theme === 'dark' ? 'border-white/10 bg-[#1C1C1E]' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-mono text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {booking.license_plate}
                </span>
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {booking.booking_date} {booking.booking_time}
                </span>
              </div>
              {booking.service_name && (
                <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {getBookingServiceNameForCms(booking.service_name)}
                </p>
              )}
              {booking.customer_name && (
                <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {booking.customer_name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('cancellationNote')}
              </label>
              <Textarea
                value={cancellationNote}
                onChange={(event) => onCancellationNoteChange(event.target.value)}
                placeholder={t('cancellationNotePlaceholder')}
                className={theme === 'dark' ? 'border-white/10 bg-[#11141A] text-white' : ''}
                rows={4}
              />
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={Boolean(cancellingBookingId)}
            className={theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : ''}
          >
            {t('keepBooking')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              if (booking) onConfirm(booking);
            }}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {cancellingBookingId ? t('cancelling') : t('confirmCancelBooking')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
