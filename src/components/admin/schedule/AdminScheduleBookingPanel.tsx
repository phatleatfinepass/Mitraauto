import React from 'react';
import { Search } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Checkbox } from '../../ui/checkbox';
import { Switch } from '../../ui/switch';
import { Tabs, TabsList, TabsTrigger } from '../../ui/tabs';
import type { ScheduleBooking } from '../../../utils/schedule';

import type { BookingListGroup } from './AdminSchedule.types';

const awaitingCustomerCompletionStatus = 'awaiting_customer_completion';

function normalizeBookingStatus(status?: string | null) {
  return (status || 'confirmed').trim().toLowerCase();
}

function getMissingCompletionFields(
  bookingLike: Partial<Pick<ScheduleBooking, 'license_plate' | 'customer_phone' | 'customer_email'>>,
  language: string,
) {
  const missingFields: string[] = [];

  if (!bookingLike.license_plate?.trim()) {
    missingFields.push(language === 'fi' ? 'rekisterinumero' : 'license plate');
  }
  if (!bookingLike.customer_phone?.trim()) {
    missingFields.push(language === 'fi' ? 'puhelinnumero' : 'phone number');
  }
  if (!bookingLike.customer_email?.trim()) {
    missingFields.push(language === 'fi' ? 'sähköposti' : 'email');
  }

  return missingFields;
}

function isBookingAwaitingCustomerCompletion(booking: ScheduleBooking, language: string) {
  return normalizeBookingStatus(booking.status) === awaitingCustomerCompletionStatus || getMissingCompletionFields(booking, language).length > 0;
}

interface AdminScheduleBookingPanelProps {
  activeBookingsTab: 'schedule' | 'reservation';
  formatBookingGroupLabel: (dateValue: string) => string;
  getBookingServiceNameForCms: (serviceName?: string | null) => string;
  reservationBookingGroups: BookingListGroup[];
  inputSurfaceClass: string;
  language: string;
  mutedTextClass: string;
  onBookingsTabChange: (value: string) => void;
  onCreateBooking: () => void;
  onOpenBooking: (booking: ScheduleBooking) => void;
  onOpenSearchDialog: () => void;
  onToggleArchivedBookings: (checked: boolean) => void;
  onToggleArchivedInline: (checked: boolean) => void;
  panelClass: string;
  searchQuery: string;
  showArchivedBookings: boolean;
  showArchivedInline: boolean;
  subtleTextClass: string;
  t: (key: string) => string;
  theme: string;
  titleClass: string;
}

function BookingGroupSection({
  emptyText,
  formatBookingGroupLabel,
  getBookingServiceNameForCms,
  groups,
  mutedTextClass,
  onOpenBooking,
  subtleTextClass,
  t,
  theme,
  titleClass,
}: {
  emptyText: string;
  formatBookingGroupLabel: (dateValue: string) => string;
  getBookingServiceNameForCms: (serviceName?: string | null) => string;
  groups: BookingListGroup[];
  mutedTextClass: string;
  onOpenBooking: (booking: ScheduleBooking) => void;
  subtleTextClass: string;
  t: (key: string) => string;
  theme: string;
  titleClass: string;
}) {
  if (groups.length === 0) {
    return <p className={`text-sm ${mutedTextClass}`}>{emptyText}</p>;
  }

  return (
    <AnimatePresence initial={false}>
      {groups.map((group) => (
        <motion.div
          key={group.date}
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between gap-4">
            <p className={`text-lg font-semibold capitalize ${titleClass}`}>{formatBookingGroupLabel(group.date)}</p>
            <div className={`h-px flex-1 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
          </div>

          <AnimatePresence initial={false}>
            {group.bookings.map((booking) => {
              const isArchived = Boolean(booking.isArchived) || normalizeBookingStatus(booking.status) === 'cancelled';
              const archivedAccentClass = theme === 'dark' ? 'text-amber-300' : 'text-amber-700';
              const bookingCompletionMode = !isArchived && isBookingAwaitingCustomerCompletion(booking, language);
              const bookingMissingFields = getMissingCompletionFields(booking, language);

              return (
                <motion.button
                  key={booking.id}
                  layout
                  type="button"
                  onClick={() => onOpenBooking(booking)}
                  initial={{ opacity: 0, scale: 0.985 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.985 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className={`grid w-full gap-2 rounded-md border px-3 py-3 text-left transition-colors sm:grid-cols-[140px_minmax(0,1fr)_170px] ${
                    isArchived
                      ? theme === 'dark'
                        ? 'border-amber-700/40 bg-amber-950/20 hover:bg-amber-950/30'
                        : 'border-amber-200 bg-amber-50 hover:bg-amber-100'
                      : theme === 'dark'
                        ? 'border-white/10 bg-[#11141A] hover:bg-white/5'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`font-mono text-sm font-semibold ${titleClass}`}>{booking.license_plate}</p>
                    <p className={`mt-1 text-xs ${isArchived ? archivedAccentClass : subtleTextClass}`}>{booking.booking_time}</p>
                  </div>

                  <div className="min-w-0">
                    <p className={`truncate text-sm font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                      {booking.customer_name || '—'}
                    </p>
                    <p className={`mt-1 truncate text-sm ${mutedTextClass}`}>{getBookingServiceNameForCms(booking.service_name)}</p>
                  </div>

                  <div className="min-w-0">
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                      {booking.customer_phone || booking.customer_email || '—'}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <p className={`text-xs uppercase tracking-[0.08em] ${isArchived ? archivedAccentClass : subtleTextClass}`}>
                        {isArchived ? t('archivedStatus') : (bookingCompletionMode ? t('awaitingCustomerCompletion') : booking.status || 'confirmed')}
                      </p>
                      {bookingCompletionMode && bookingMissingFields.length > 0 && (
                        <Badge variant="secondary" className="px-2 py-0.5 text-[10px] uppercase tracking-[0.08em]">
                          {t('incompleteBookingWarning')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

export function AdminScheduleBookingPanel({
  activeBookingsTab,
  formatBookingGroupLabel,
  getBookingServiceNameForCms,
  reservationBookingGroups,
  inputSurfaceClass,
  language,
  mutedTextClass,
  onBookingsTabChange,
  onCreateBooking,
  onOpenBooking,
  onOpenSearchDialog,
  onToggleArchivedBookings,
  onToggleArchivedInline,
  panelClass,
  searchQuery,
  showArchivedBookings,
  showArchivedInline,
  subtleTextClass,
  t,
  theme,
  titleClass,
}: AdminScheduleBookingPanelProps) {
  const reservationEmptyText = showArchivedBookings
    ? showArchivedInline
      ? (language === 'fi' ? 'Ei varauksia valitulla näkymällä.' : 'No bookings in the current view.')
      : t('noArchivedBookings')
    : (language === 'fi' ? 'Ei tulevia varauksia seuraaville seitsemälle päivälle.' : 'No upcoming bookings for the next seven days.');

  return (
    <>
      <Card className={`rounded-lg p-4 shadow-none ${panelClass}`}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <Tabs value={activeBookingsTab} onValueChange={onBookingsTabChange} className="gap-0">
            <TabsList className={`h-10 rounded-md p-1 ${theme === 'dark' ? 'bg-[#11141A]' : 'bg-gray-100'}`}>
              <TabsTrigger value="schedule" className="rounded-sm px-3">
                {t('scheduleTab')}
              </TabsTrigger>
              <TabsTrigger value="reservation" className="rounded-sm px-3">
                {t('reservationTab')}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
            <button
              type="button"
              onClick={onOpenSearchDialog}
              className={`flex h-10 min-w-0 items-center rounded-md border px-3 text-left text-sm transition-colors lg:w-[360px] ${inputSurfaceClass} ${theme === 'dark' ? 'hover:bg-[#15171C]' : 'hover:bg-gray-50'}`}
            >
              <Search className={`mr-2 h-4 w-4 shrink-0 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
              <span className={`min-w-0 truncate ${searchQuery.trim() ? titleClass : mutedTextClass}`}>
                {searchQuery.trim() || t('searchBookingsPlaceholder')}
              </span>
            </button>

            <Button onClick={onCreateBooking} className="bg-emerald-600 text-white hover:bg-emerald-700">
              {t('createBooking')}
            </Button>
          </div>
        </div>
      </Card>

      {activeBookingsTab === 'reservation' && (
        <Card className={`rounded-lg p-4 shadow-none ${panelClass}`}>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <h3 className={`font-semibold ${titleClass}`}>{t('reservationTab')}</h3>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <label className={`flex items-center gap-3 text-sm ${titleClass}`}>
                <Switch checked={showArchivedBookings} onCheckedChange={onToggleArchivedBookings} />
                <span>{t('showArchivedBookings')}</span>
              </label>

              <AnimatePresence initial={false}>
                {showArchivedBookings && (
                  <motion.label
                    key="archived-inline"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className={`flex items-center gap-2 text-sm ${titleClass}`}
                  >
                    <Checkbox
                      checked={showArchivedInline}
                      onCheckedChange={(checked) => onToggleArchivedInline(checked === true)}
                    />
                    <span>{t('archivedInline')}</span>
                  </motion.label>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            <BookingGroupSection
              emptyText={reservationEmptyText}
              formatBookingGroupLabel={formatBookingGroupLabel}
              getBookingServiceNameForCms={getBookingServiceNameForCms}
              groups={reservationBookingGroups}
              mutedTextClass={mutedTextClass}
              onOpenBooking={onOpenBooking}
              subtleTextClass={subtleTextClass}
              t={t}
              theme={theme}
              titleClass={titleClass}
            />
          </div>
        </Card>
      )}
    </>
  );
}
