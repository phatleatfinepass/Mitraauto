import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { getSupabaseClient } from '../../utils/supabase/client';
import type { ScheduleBooking } from '../../utils/schedule';

interface UseBookingReservationStateArgs {
  language: string;
  t: (key: string) => string;
  timelineBookings: ScheduleBooking[];
}

export function useBookingReservationState({
  language,
  t,
  timelineBookings,
}: UseBookingReservationStateArgs) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ScheduleBooking[]>([]);
  const [isSearchingBookings, setIsSearchingBookings] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [activeBookingsTab, setActiveBookingsTab] = useState<'schedule' | 'reservation'>('schedule');
  const [showArchivedBookings, setShowArchivedBookings] = useState(false);
  const [showArchivedInline, setShowArchivedInline] = useState(false);
  const [archivedBookings, setArchivedBookings] = useState<ScheduleBooking[]>([]);
  const searchRequestIdRef = useRef(0);

  const searchMatchesBooking = (booking: ScheduleBooking, query: string) => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return true;

    return [
      booking.license_plate,
      booking.customer_name,
      booking.customer_phone,
      booking.customer_email,
      booking.id,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery));
  };

  const formatBookingGroupLabel = (dateValue: string) => {
    const bookingDate = new Date(`${dateValue}T12:00:00`);
    const weekdayLabel = bookingDate.toLocaleDateString(language === 'fi' ? 'fi-FI' : 'en-US', {
      weekday: 'long',
    });
    const [year, month, day] = dateValue.split('-');
    const formattedDate = `${day}.${month}.${year}`;

    return `${weekdayLabel}, ${formattedDate}`;
  };

  const groupedTimelineBookings = useMemo(() => timelineBookings.reduce<Array<{ date: string; bookings: ScheduleBooking[] }>>((groups, booking) => {
    const currentGroup = groups[groups.length - 1];
    if (currentGroup?.date === booking.booking_date) {
      currentGroup.bookings.push(booking);
      return groups;
    }

    groups.push({ date: booking.booking_date, bookings: [booking] });
    return groups;
  }, []), [timelineBookings]);

  const groupedArchivedBookings = useMemo(() => archivedBookings.reduce<Array<{ date: string; bookings: ScheduleBooking[] }>>((groups, booking) => {
    const currentGroup = groups[groups.length - 1];
    if (currentGroup?.date === booking.booking_date) {
      currentGroup.bookings.push(booking);
      return groups;
    }

    groups.push({ date: booking.booking_date, bookings: [booking] });
    return groups;
  }, []), [archivedBookings]);

  const reservationDisplayGroups = useMemo(() => {
    const upcomingItems = groupedTimelineBookings.map((group) => ({
      date: group.date,
      bookings: group.bookings.map((booking) => ({ ...booking, isArchived: false })),
    }));

    if (!showArchivedBookings) {
      return upcomingItems;
    }

    if (!showArchivedInline) {
      return groupedArchivedBookings.map((group) => ({
        date: group.date,
        bookings: group.bookings.map((booking) => ({ ...booking, isArchived: true })),
      }));
    }

    const mergedBookings = [...timelineBookings, ...archivedBookings]
      .map((booking) => ({
        ...booking,
        isArchived: (booking.status || '').toLowerCase() === 'cancelled',
      }))
      .sort((left, right) => {
        if (left.booking_date !== right.booking_date) {
          return left.booking_date.localeCompare(right.booking_date);
        }
        return left.booking_time.localeCompare(right.booking_time);
      });

    return mergedBookings.reduce<Array<{ date: string; bookings: typeof mergedBookings }>>((groups, booking) => {
      const currentGroup = groups[groups.length - 1];
      if (currentGroup?.date === booking.booking_date) {
        currentGroup.bookings.push(booking);
        return groups;
      }

      groups.push({ date: booking.booking_date, bookings: [booking] });
      return groups;
    }, []);
  }, [archivedBookings, groupedArchivedBookings, groupedTimelineBookings, showArchivedBookings, showArchivedInline, timelineBookings]);

  const handleSearchBookings = async (queryOverride?: string) => {
    const query = (queryOverride ?? searchQuery).trim();
    if (!query) {
      setSearchResults([]);
      return;
    }

    const requestId = ++searchRequestIdRef.current;

    try {
      setIsSearchingBookings(true);
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      const matches = (data || []).filter((booking) => searchMatchesBooking(booking, query));
      if (requestId === searchRequestIdRef.current) {
        setSearchResults(matches.slice(0, 25));
      }
    } catch (error) {
      console.error('Error searching bookings:', error);
      if (requestId === searchRequestIdRef.current) {
        toast.error(language === 'fi' ? 'Varauksien haku epäonnistui' : 'Failed to search bookings');
      }
    } finally {
      if (requestId === searchRequestIdRef.current) {
        setIsSearchingBookings(false);
      }
    }
  };

  const loadArchivedBookings = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('status', 'cancelled')
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true })
        .limit(100);

      if (error) throw error;
      setArchivedBookings(data || []);
    } catch (error) {
      console.error('Error loading archived bookings:', error);
      toast.error(language === 'fi' ? 'Arkistoitujen varausten lataus epäonnistui' : 'Failed to load archived bookings');
    }
  };

  const refreshArchivedBookings = async () => {
    if (!showArchivedBookings && !showArchivedInline) return;
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('status', 'cancelled')
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true })
        .limit(100);
      if (error) throw error;
      setArchivedBookings(data || []);
    } catch (error) {
      console.error('Error refreshing archived bookings:', error);
    }
  };

  const handleBookingsTabChange = (value: string) => {
    const nextTab = value === 'reservation' ? 'reservation' : 'schedule';
    setActiveBookingsTab(nextTab);

    if (nextTab !== 'reservation') {
      setShowArchivedInline(false);
      return;
    }

    if ((showArchivedBookings || showArchivedInline) && archivedBookings.length === 0) {
      void loadArchivedBookings();
    }
  };

  useEffect(() => {
    if (activeBookingsTab === 'reservation' && (showArchivedBookings || showArchivedInline) && !isSearchDialogOpen) {
      if (archivedBookings.length === 0) {
        void loadArchivedBookings();
      }
      return;
    }

    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setIsSearchingBookings(false);
      searchRequestIdRef.current += 1;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void handleSearchBookings(query);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [activeBookingsTab, archivedBookings.length, isSearchDialogOpen, searchQuery, showArchivedBookings, showArchivedInline]);

  return {
    activeBookingsTab,
    archivedBookings,
    formatBookingGroupLabel,
    handleBookingsTabChange,
    handleSearchBookings,
    isSearchDialogOpen,
    isSearchingBookings,
    loadArchivedBookings,
    refreshArchivedBookings,
    reservationDisplayGroups,
    searchQuery,
    searchResults,
    setArchivedBookings,
    setIsSearchDialogOpen,
    setSearchQuery,
    setShowArchivedBookings,
    setShowArchivedInline,
    showArchivedBookings,
    showArchivedInline,
  };
}
