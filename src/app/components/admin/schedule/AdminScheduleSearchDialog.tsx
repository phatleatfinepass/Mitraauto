import React from 'react';
import { Search } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import type { ScheduleBooking } from '../../../utils/schedule';

interface AdminScheduleSearchDialogProps {
  getBookingServiceNameForCms: (serviceName?: string | null) => string;
  inputSurfaceClass: string;
  isOpen: boolean;
  isSearchingBookings: boolean;
  mutedPanelClass: string;
  mutedTextClass: string;
  onOpenBooking: (booking: ScheduleBooking) => void;
  onOpenChange: (open: boolean) => void;
  onSearch: () => Promise<void> | void;
  searchQuery: string;
  searchResults: ScheduleBooking[];
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  subtleTextClass: string;
  t: (key: string) => string;
  theme: string;
  titleClass: string;
}

export function AdminScheduleSearchDialog({
  getBookingServiceNameForCms,
  inputSurfaceClass,
  isOpen,
  isSearchingBookings,
  mutedPanelClass,
  mutedTextClass,
  onOpenBooking,
  onOpenChange,
  onSearch,
  searchQuery,
  searchResults,
  setSearchQuery,
  subtleTextClass,
  t,
  theme,
  titleClass,
}: AdminScheduleSearchDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-3xl ${theme === 'dark' ? 'border-white/10 bg-[#16181D] text-white' : ''}`}>
        <DialogHeader>
          <DialogTitle>{t('searchBookings')}</DialogTitle>
          <DialogDescription className={theme === 'dark' ? 'text-gray-400' : ''}>
            {t('searchDialogDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            <Input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void onSearch();
                }
              }}
              placeholder={t('searchBookingsPlaceholder')}
              className={`pl-9 ${inputSurfaceClass}`}
            />
          </div>

          <div className={`max-h-[420px] overflow-y-auto rounded-lg border p-3 ${mutedPanelClass}`}>
            {searchQuery.trim() === '' ? (
              <p className={`text-sm ${mutedTextClass}`}>{t('startTypingToSearch')}</p>
            ) : isSearchingBookings ? (
              <p className={`text-sm ${mutedTextClass}`}>{t('searching')}</p>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((booking) => (
                  <button
                    key={`dialog-search-${booking.id}`}
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      onOpenBooking(booking);
                    }}
                    className={`grid w-full gap-2 rounded-md border px-3 py-3 text-left transition-colors sm:grid-cols-[150px_minmax(0,1fr)_170px] ${
                      theme === 'dark'
                        ? 'border-white/10 bg-[#11141A] hover:bg-white/5'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className={`font-mono text-sm font-semibold ${titleClass}`}>{booking.license_plate}</p>
                      <p className={`mt-1 text-xs ${subtleTextClass}`}>{booking.id}</p>
                    </div>
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                        {booking.customer_name || '—'}
                      </p>
                      <p className={`mt-1 truncate text-sm ${mutedTextClass}`}>{getBookingServiceNameForCms(booking.service_name)}</p>
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                        {booking.booking_date} {booking.booking_time}
                      </p>
                      <p className={`mt-1 text-xs uppercase tracking-[0.08em] ${(booking.status || '').toLowerCase() === 'cancelled' ? 'text-red-500' : subtleTextClass}`}>
                        {booking.status || 'confirmed'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className={`text-sm ${mutedTextClass}`}>{t('noSearchResults')}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
