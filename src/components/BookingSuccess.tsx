import React from 'react';
import { CheckCircle2, Calendar, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface BookingSuccessProps {
  licensePlate: string;
  date: Date;
  timeSlot: string;
  serviceName: string;
  language?: 'fi' | 'en';
  contactInfo: {
    name: string;
    phone: string;
    email: string;
    notes?: string;
  };
  onClose: () => void;
  t: (key: string) => string;
  locale?: string;
}

function padCalendarNumber(value: number) {
  return String(value).padStart(2, '0');
}

function buildLocalBookingDateTime(date: Date, timeSlot: string) {
  const normalizedTime = timeSlot.trim();
  const match = normalizedTime.match(/^(\d{1,2}):(\d{2})$/);
  const hours = match ? Number(match[1]) : 9;
  const minutes = match ? Number(match[2]) : 0;

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    0,
    0,
  );
}

function formatIcsUtc(date: Date) {
  return [
    date.getUTCFullYear(),
    padCalendarNumber(date.getUTCMonth() + 1),
    padCalendarNumber(date.getUTCDate()),
    'T',
    padCalendarNumber(date.getUTCHours()),
    padCalendarNumber(date.getUTCMinutes()),
    padCalendarNumber(date.getUTCSeconds()),
    'Z',
  ].join('');
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function foldIcsLine(line: string) {
  if (line.length <= 74) {
    return line;
  }

  const parts: string[] = [];
  let remaining = line;

  while (remaining.length > 74) {
    parts.push(remaining.slice(0, 74));
    remaining = ` ${remaining.slice(74)}`;
  }

  parts.push(remaining);
  return parts.join('\r\n');
}

function buildIcsLine(key: string, value: string) {
  return foldIcsLine(`${key}:${value}`);
}

export function BookingSuccess({
  licensePlate,
  date,
  timeSlot,
  serviceName,
  language = 'fi',
  contactInfo,
  onClose,
  t,
  locale = 'fi-FI',
}: BookingSuccessProps) {
  const handleAddToCalendar = () => {
    const startAt = buildLocalBookingDateTime(date, timeSlot);
    const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
    const createdAt = new Date();
    const summary = `Mitra Auto: ${serviceName} (${licensePlate})`;
    const location = 'Hankasuontie 5, 00390, Helsinki, Finland';
    const workshopPhone = '+358407777163';
    const workshopEmail = 'contact@mitra-auto.fi';
    const copy = language === 'fi'
      ? {
          confirmationTitle: 'Mitra Auto varausvahvistus',
          service: 'Palvelu',
          licensePlate: 'Rekisterinumero',
          date: 'Päivä',
          time: 'Aika',
          customer: 'Asiakas',
          phone: 'Puhelin',
          email: 'Sähköposti',
          bookingNotes: 'Varausmuistiinpanot',
          location: 'Sijainti',
          workshopPhone: 'Korjaamon puhelin',
          workshopEmail: 'Korjaamon sähköposti',
          arrivalNote: 'Saavu paikalle muutama minuutti ennen varattua aikaa.',
          reminder: 'Muistutus',
        }
      : {
          confirmationTitle: 'Mitra Auto booking confirmation',
          service: 'Service',
          licensePlate: 'License plate',
          date: 'Date',
          time: 'Time',
          customer: 'Customer',
          phone: 'Phone',
          email: 'Email',
          bookingNotes: 'Booking notes',
          location: 'Location',
          workshopPhone: 'Workshop phone',
          workshopEmail: 'Workshop email',
          arrivalNote: 'Please arrive a few minutes before your booked time.',
          reminder: 'Reminder',
        };
    const description = [
      copy.confirmationTitle,
      '',
      `${copy.service}: ${serviceName}`,
      `${copy.licensePlate}: ${licensePlate}`,
      `${copy.date}: ${date.toLocaleDateString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })}`,
      `${copy.time}: ${timeSlot}`,
      '',
      `${copy.customer}: ${contactInfo.name}`,
      `${copy.phone}: ${contactInfo.phone}`,
      ...(contactInfo.email ? [`${copy.email}: ${contactInfo.email}`] : []),
      ...(contactInfo.notes?.trim() ? ['', `${copy.bookingNotes}: ${contactInfo.notes.trim()}`] : []),
      '',
      `${copy.location}: ${location}`,
      `${copy.workshopPhone}: ${workshopPhone}`,
      `${copy.workshopEmail}: ${workshopEmail}`,
      copy.arrivalNote,
    ].join('\n');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Mitra Auto//Booking//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      buildIcsLine('UID', `booking-${licensePlate}-${startAt.getTime()}@mitra-auto.fi`),
      buildIcsLine('DTSTAMP', formatIcsUtc(createdAt)),
      buildIcsLine('DTSTART', formatIcsUtc(startAt)),
      buildIcsLine('DTEND', formatIcsUtc(endAt)),
      buildIcsLine('SUMMARY', escapeIcsText(summary)),
      buildIcsLine('DESCRIPTION', escapeIcsText(description)),
      buildIcsLine('LOCATION', escapeIcsText(location)),
      buildIcsLine('ORGANIZER;CN=Mitra Auto', `mailto:${workshopEmail}`),
      buildIcsLine('STATUS', 'CONFIRMED'),
      buildIcsLine('TRANSP', 'OPAQUE'),
      'BEGIN:VALARM',
      buildIcsLine('ACTION', 'DISPLAY'),
      buildIcsLine('DESCRIPTION', escapeIcsText(`${copy.reminder}: ${summary}`)),
      buildIcsLine('TRIGGER', '-PT2H'),
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `mitra-auto-booking-${licensePlate.toLowerCase()}.ics`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
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
