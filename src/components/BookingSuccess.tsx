import React from 'react';
import { CheckCircle2, Calendar, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface BookingSuccessProps {
  licensePlate: string;
  date: Date;
  timeSlot: string;
  serviceName: string;
  contactInfo: {
    name: string;
    phone: string;
    email: string;
  };
  onClose: () => void;
  t: (key: string) => string;
  locale?: string;
}

export function BookingSuccess({
  licensePlate,
  date,
  timeSlot,
  serviceName,
  contactInfo,
  onClose,
  t,
  locale = 'fi-FI',
}: BookingSuccessProps) {
  const handleAddToCalendar = () => {
    // [BOOKING ACTION] Generate calendar event
    console.log('Add to calendar clicked');
    // In production, generate .ics file or integrate with calendar APIs
  };

  return (
    <div className="text-center space-y-6 py-4">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="h-20 w-20 rounded-full bg-green-50 dark:bg-green-950 flex items-center justify-center animate-in zoom-in duration-300">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
      </div>

      {/* Success Message */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">
          {t('booking.success.title')}
        </h2>
        <p className="text-muted-foreground">
          {t('booking.success.subtitle')}
        </p>
      </div>

      {/* Booking Details Card */}
      <Card className="p-6 bg-secondary/30 text-left">
        <h3 className="font-semibold mb-4">{t('booking.success.detailsTitle')}</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('booking.summary.service')}</span>
            <span className="font-medium">{serviceName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('booking.summary.licensePlate')}</span>
            <span className="font-medium tracking-wide">{licensePlate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('booking.summary.date')}</span>
            <span className="font-medium">
              {date.toLocaleDateString(locale, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('booking.summary.time')}</span>
            <span className="font-medium">{timeSlot}</span>
          </div>
          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('booking.success.name')}</span>
              <span className="font-medium">{contactInfo.name}</span>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-muted-foreground">{t('booking.success.phone')}</span>
              <span className="font-medium">{contactInfo.phone}</span>
            </div>
            {contactInfo.email && (
              <div className="flex justify-between mt-2">
                <span className="text-muted-foreground">{t('booking.success.email')}</span>
                <span className="font-medium">{contactInfo.email}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Confirmation Message */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          {contactInfo.email
            ? t('booking.success.emailSent')
            : t('booking.success.emailMissing')}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          variant="outline"
          onClick={handleAddToCalendar}
          className="w-full sm:flex-1"
        >
          <Calendar className="mr-2 h-4 w-4" />
          {t('booking.success.addToCalendar')}
        </Button>
        <Button
          onClick={onClose}
          className="w-full sm:flex-1"
        >
          {t('booking.success.done')}
        </Button>
      </div>
    </div>
  );
}
