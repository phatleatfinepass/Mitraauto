import React, { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';
import { useLanguage } from '../LanguageContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Calendar } from '../ui/calendar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import {
  Calendar as CalendarIcon,
  Clock,
  Lock,
  Unlock,
  ChevronRight,
  AlertCircle,
  CheckSquare,
  Square,
  User,
  Mail,
  Phone,
  Wrench,
  StickyNote,
  Send,
  Ban,
} from 'lucide-react';
import { getSupabaseClient } from '../../utils/supabase/client';
import { formatDateForSupabase } from '../../utils/date';
import { buildScheduleTimeSlots, generateScheduleSlots, ScheduleBlockedSlot, ScheduleBooking, ScheduleTimeSlot } from '../../utils/schedule';
import { toast } from 'sonner';

interface AdminSchedulePageProps {
  onLogout?: () => void;
}

export const AdminSchedulePage: React.FC<AdminSchedulePageProps> = ({ onLogout }) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [timeSlots, setTimeSlots] = useState<ScheduleTimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleTimeSlot | null>(null);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [cancellationNote, setCancellationNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<ScheduleBooking[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<ScheduleBlockedSlot[]>([]);
  const [isBatchBlockMode, setIsBatchBlockMode] = useState(false);
  const [selectedBlockTimes, setSelectedBlockTimes] = useState<string[]>([]);
  const [resendingBookingId, setResendingBookingId] = useState<string | null>(null);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [resendCounts, setResendCounts] = useState<Record<string, number>>({});

  const t = (key: string) => {
    const translations: Record<string, { fi: string; en: string }> = {
      scheduling: { fi: 'Ajanvaraukset', en: 'Scheduling' },
      selectedDate: { fi: 'Valittu päivä', en: 'Selected Date' },
      totalBookings: { fi: 'Varauksia yhteensä', en: 'Total Bookings' },
      blockedSlots: { fi: 'Estettyä aikaa', en: 'Blocked Slots' },
      today: { fi: 'Tänään', en: 'Today' },
      tomorrow: { fi: 'Huomenna', en: 'Tomorrow' },
      thisWeek: { fi: 'Tämä viikko', en: 'This Week' },
      closed: { fi: 'Suljettu', en: 'Closed' },
      sundayClosed: { fi: 'Sunnuntaisin suljettu', en: 'Closed on Sundays' },
      emptySlot: { fi: 'Vapaa', en: 'Available' },
      booked: { fi: 'Varattu', en: 'Booked' },
      blocked: { fi: 'Estetty', en: 'Blocked' },
      blockThisSlot: { fi: 'Estä tämä aika', en: 'Block this slot' },
      slotDetails: { fi: 'Ajanvarauksen tiedot', en: 'Slot Details' },
      bookingsList: { fi: 'Varaukset', en: 'Bookings' },
      licensePlate: { fi: 'Rekisterinumero', en: 'License Plate' },
      createdAt: { fi: 'Luotu', en: 'Created At' },
      blockingControls: { fi: 'Eston hallinta', en: 'Blocking Controls' },
      reasonOptional: { fi: 'Syy (valinnainen)', en: 'Reason (optional)' },
      blockSlot: { fi: 'Estä aika', en: 'Block Slot' },
      blockUntilEndOfDay: { fi: 'Estä loppupäivä', en: 'Block Until End of Day' },
      unblockSlot: { fi: 'Poista esto', en: 'Unblock Slot' },
      noBookings: { fi: 'Ei varauksia', en: 'No bookings' },
      blockSuccessful: { fi: 'Aika estetty onnistuneesti', en: 'Slot blocked successfully' },
      unblockSuccessful: { fi: 'Esto poistettu onnistuneesti', en: 'Slot unblocked successfully' },
      errorBlocking: { fi: 'Virhe eston luomisessa', en: 'Error blocking slot' },
      errorUnblocking: { fi: 'Virhe eston poistamisessa', en: 'Error unblocking slot' },
      selectDate: { fi: 'Valitse päivä', en: 'Select Date' },
      customerName: { fi: 'Asiakas', en: 'Customer' },
      customerPhone: { fi: 'Puhelin', en: 'Phone' },
      customerEmail: { fi: 'Sähköposti', en: 'Email' },
      serviceName: { fi: 'Palvelu', en: 'Service' },
      notes: { fi: 'Lisätiedot', en: 'Notes' },
      status: { fi: 'Tila', en: 'Status' },
      noNotes: { fi: 'Ei lisätietoja', en: 'No notes' },
      blockSelectedSlots: { fi: 'Estä valitut ajat', en: 'Block selected slots' },
      selectSlotsToBlock: { fi: 'Valitse estettävät ajat', en: 'Select slots to block' },
      cancelSelection: { fi: 'Peru valinta', en: 'Cancel selection' },
      slotsSelected: { fi: 'aikaa valittu', en: 'slots selected' },
      clearSelection: { fi: 'Tyhjennä valinta', en: 'Clear selection' },
      selectionModeHint: { fi: 'Klikkaa vapaita aikoja estääksesi ne yhdellä kertaa.', en: 'Click available slots to block them in one action.' },
      batchBlockSuccessful: { fi: 'Valitut ajat estetty onnistuneesti', en: 'Selected slots blocked successfully' },
      resendConfirmation: { fi: 'Lähetä uudelleen', en: 'Resend confirmation' },
      resendSuccessful: { fi: 'Vahvistusviesti lähetetty uudelleen', en: 'Confirmation email sent again' },
      resendFailed: { fi: 'Vahvistusviestin uudelleenlähetys epäonnistui', en: 'Failed to resend confirmation email' },
      noEmailAddress: { fi: 'Ei sähköpostiosoitetta', en: 'No email address' },
      sending: { fi: 'Lähetetään...', en: 'Sending...' },
      resendCount: { fi: 'Lähetyksiä', en: 'Resends' },
      cancelBooking: { fi: 'Peruuta', en: 'Cancel booking' },
      cancelling: { fi: 'Perutaan...', en: 'Cancelling...' },
      cancelSuccessful: { fi: 'Varaus peruttu', en: 'Booking cancelled' },
      cancelFailed: { fi: 'Varauksen peruminen epäonnistui', en: 'Failed to cancel booking' },
      cancellationEmailSent: { fi: 'Peruutusviesti lähetetty asiakkaalle', en: 'Cancellation email sent to customer' },
      cancellationNote: { fi: 'Peruutuksen syy', en: 'Cancellation note' },
      cancellationNotePlaceholder: { fi: 'Esim. Aika ei ole enää saatavilla tai varausta siirrettiin puhelimitse', en: 'For example, the slot is no longer available or the booking was moved by phone' },
    };
    return translations[key]?.[language] || key;
  };

  // Fetch bookings and blocked slots
  const fetchScheduleData = async (date: Date) => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const dateStr = formatDateForSupabase(date);

      console.log('[CMS] Fetching bookings for date:', dateStr);

      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, license_plate, booking_date, booking_time, service_name, customer_name, customer_phone, customer_email, notes, status, created_at')
        .eq('booking_date', dateStr);

      if (bookingsError) {
        console.error('[CMS] Bookings fetch error:', bookingsError);
        // If table doesn't exist, create empty array
        if (bookingsError.message.includes('does not exist')) {
          console.warn('[CMS] Bookings table does not exist. Please run setup SQL.');
          setBookings([]);
        } else {
          throw bookingsError;
        }
      } else {
        console.log('[CMS] Fetched bookings:', bookingsData);
        setBookings(bookingsData || []);
      }

      const bookingIds = (bookingsData || []).map((booking) => booking.id);
      if (bookingIds.length > 0) {
        const { data: emailEventsData, error: emailEventsError } = await supabase
          .from('booking_email_events')
          .select('booking_id, event_type')
          .in('booking_id', bookingIds)
          .eq('event_type', 'confirmation_resent');

        if (emailEventsError) {
          if (emailEventsError.message.includes('does not exist')) {
            setResendCounts({});
          } else {
            throw emailEventsError;
          }
        } else {
          const counts = (emailEventsData || []).reduce<Record<string, number>>((acc, event) => {
            acc[event.booking_id] = (acc[event.booking_id] || 0) + 1;
            return acc;
          }, {});
          setResendCounts(counts);
        }
      } else {
        setResendCounts({});
      }

      // Fetch blocked slots
      const { data: blockedData, error: blockedError } = await supabase
        .from('blocked_slots')
        .select('id, date, start_time, end_time, reason, created_at')
        .eq('date', dateStr);

      if (blockedError) {
        console.error('[CMS] Blocked slots fetch error:', blockedError);
        // If table doesn't exist, create empty array
        if (blockedError.message.includes('does not exist')) {
          console.warn('[CMS] Blocked slots table does not exist. Please run setup SQL.');
          setBlockedSlots([]);
        } else {
          throw blockedError;
        }
      } else {
        console.log('[CMS] Fetched blocked slots:', blockedData);
        setBlockedSlots(blockedData || []);
      }

      // Build time slots
      const timeSlotsData = buildScheduleTimeSlots(date, bookingsData || [], blockedData || []);

      console.log('[CMS] Time slots built:', timeSlotsData.filter(s => s.bookings.length > 0).length, 'with bookings');
      setTimeSlots(timeSlotsData);
    } catch (error) {
      console.error('[CMS] Error fetching schedule data:', error);
      toast.error(language === 'fi' ? 'Virhe tietojen lataamisessa' : 'Error loading data');
      // Set empty data so UI doesn't break
      setBookings([]);
      setBlockedSlots([]);
      setResendCounts({});
      const slots = generateScheduleSlots(date);
      setTimeSlots(slots.map(time => ({ time, bookings: [], isBlocked: false, available: true })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedBlockTimes([]);
    setIsBatchBlockMode(false);
    setCancellationNote('');
    fetchScheduleData(selectedDate);
  }, [selectedDate]);

  // Block a single slot
  const handleBlockSlot = async (time: string, untilEndOfDay: boolean = false) => {
    const dateStr = formatDateForSupabase(selectedDate);
    const supabase = getSupabaseClient();

    try {
      let endTime: string;
      if (untilEndOfDay) {
        const slots = generateScheduleSlots(selectedDate);
        const lastSlot = slots[slots.length - 1];
        const [hours, minutes] = lastSlot.split(':').map(Number);
        endTime = `${(minutes === 30 ? hours + 1 : hours).toString().padStart(2, '0')}:00`;
      } else {
        // Calculate end time (30 minutes later)
        const [hours, minutes] = time.split(':').map(Number);
        const endMinutes = minutes + 30;
        if (endMinutes >= 60) {
          endTime = `${(hours + 1).toString().padStart(2, '0')}:00`;
        } else {
          endTime = `${hours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
        }
      }

      const { error } = await supabase.from('blocked_slots').insert({
        date: dateStr,
        start_time: time,
        end_time: endTime,
        reason: blockReason.trim() || null,
      });

      if (error) throw error;

      toast.success(t('blockSuccessful'));
      setBlockReason('');
      setIsDrawerOpen(false);
      fetchScheduleData(selectedDate);
    } catch (error) {
      console.error('Error blocking slot:', error);
      toast.error(t('errorBlocking'));
    }
  };

  const handleBatchSlotToggle = (time: string) => {
    setSelectedBlockTimes((current) =>
      current.includes(time) ? current.filter((item) => item !== time) : [...current, time].sort(),
    );
  };

  const handleBlockSelectedSlots = async () => {
    if (selectedBlockTimes.length === 0) return;

    const dateStr = formatDateForSupabase(selectedDate);
    const supabase = getSupabaseClient();

    try {
      const rows = selectedBlockTimes.map((time) => {
        const [hours, minutes] = time.split(':').map(Number);
        const endMinutes = minutes + 30;
        const endTime =
          endMinutes >= 60
            ? `${(hours + 1).toString().padStart(2, '0')}:00`
            : `${hours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

        return {
          date: dateStr,
          start_time: time,
          end_time: endTime,
          reason: blockReason.trim() || null,
        };
      });

      const { error } = await supabase.from('blocked_slots').insert(rows);

      if (error) throw error;

      toast.success(t('batchBlockSuccessful'));
      setBlockReason('');
      setSelectedBlockTimes([]);
      setIsBatchBlockMode(false);
      fetchScheduleData(selectedDate);
    } catch (error) {
      console.error('Error blocking selected slots:', error);
      toast.error(t('errorBlocking'));
    }
  };

  const handleResendBookingConfirmation = async (booking: ScheduleBooking) => {
    if (!booking.customer_email) {
      toast.error(t('noEmailAddress'));
      return;
    }

    setResendingBookingId(booking.id);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.functions.invoke('send_booking_confirmation', {
        method: 'POST',
        body: {
          bookingId: booking.id,
          customerName: booking.customer_name || '',
          customerEmail: booking.customer_email,
          customerPhone: booking.customer_phone || null,
          licensePlate: booking.license_plate,
          bookingDate: booking.booking_date,
          bookingTime: booking.booking_time,
          serviceName: booking.service_name || 'Service',
          notes: booking.notes || null,
        },
      });

      if (error) {
        throw error;
      }

      const { error: logError } = await supabase.from('booking_email_events').insert({
        booking_id: booking.id,
        event_type: 'confirmation_resent',
        recipient_email: booking.customer_email,
      });

      if (logError && !logError.message.includes('does not exist')) {
        throw logError;
      }

      setResendCounts((current) => ({
        ...current,
        [booking.id]: (current[booking.id] || 0) + 1,
      }));

      toast.success(t('resendSuccessful'));
    } catch (error) {
      console.error('Error resending booking confirmation:', error);
      toast.error(t('resendFailed'));
    } finally {
      setResendingBookingId(null);
    }
  };

  const handleCancelBooking = async (booking: ScheduleBooking) => {
    setCancellingBookingId(booking.id);
    try {
      const supabase = getSupabaseClient();

      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', booking.id);

      if (updateError) {
        throw updateError;
      }

      if (booking.customer_email) {
        const { error: emailError } = await supabase.functions.invoke('send_booking_cancellation', {
          method: 'POST',
          body: {
            bookingId: booking.id,
            customerName: booking.customer_name || '',
            customerEmail: booking.customer_email,
            customerPhone: booking.customer_phone || null,
            licensePlate: booking.license_plate,
            bookingDate: booking.booking_date,
            bookingTime: booking.booking_time,
            serviceName: booking.service_name || 'Service',
            cancellationNote: cancellationNote.trim() || null,
          },
        });

        if (emailError) {
          throw emailError;
        }

        const { error: logError } = await supabase.from('booking_email_events').insert({
          booking_id: booking.id,
          event_type: 'cancellation_sent',
          recipient_email: booking.customer_email,
        });

        if (logError && !logError.message.includes('does not exist')) {
          throw logError;
        }

        toast.success(t('cancellationEmailSent'));
      }

      toast.success(t('cancelSuccessful'));
      setCancellationNote('');
      setIsDrawerOpen(false);
      fetchScheduleData(selectedDate);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(t('cancelFailed'));
    } finally {
      setCancellingBookingId(null);
    }
  };

  // Unblock a slot
  const handleUnblockSlot = async (time: string) => {
    const dateStr = formatDateForSupabase(selectedDate);
    const supabase = getSupabaseClient();

    try {
      const blockedSlot = blockedSlots.find(
        (bs) => time >= bs.start_time && time < bs.end_time
      );

      if (!blockedSlot) return;

      const { error } = await supabase
        .from('blocked_slots')
        .delete()
        .eq('id', blockedSlot.id);

      if (error) throw error;

      toast.success(t('unblockSuccessful'));
      setIsDrawerOpen(false);
      fetchScheduleData(selectedDate);
    } catch (error) {
      console.error('Error unblocking slot:', error);
      toast.error(t('errorUnblocking'));
    }
  };

  const handleSlotClick = (slot: ScheduleTimeSlot, time: string) => {
    if (isBatchBlockMode && !slot.isBlocked && slot.bookings.length === 0) {
      handleBatchSlotToggle(time);
      return;
    }

    setSelectedSlot(slot);
    setSelectedSlotTime(time);
    setIsDrawerOpen(true);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(language === 'fi' ? 'fi-FI' : 'en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getTotalBookings = () => {
    return timeSlots.reduce((acc, slot) => acc + slot.bookings.length, 0);
  };

  const getTotalBlockedSlots = () => {
    return timeSlots.filter((slot) => slot.isBlocked).length;
  };

  const isSunday = selectedDate.getDay() === 0;

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#11141A]' : 'bg-gray-50'}`}>
      {/* Top Bar */}
      <div className={`border-b ${theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-gray-200'}`}>
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t('scheduling')}
              </h1>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {formatDate(selectedDate)}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className={`text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {getTotalBookings()}
                </div>
                <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('totalBookings')}
                </div>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div className="text-center">
                <div className={`text-2xl font-semibold text-[#FF6B35]`}>
                  {getTotalBlockedSlots()}
                </div>
                <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('blockedSlots')}
                </div>
              </div>
              {onLogout && (
                <>
                  <Separator orientation="vertical" className="h-12" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onLogout}
                    className={`gap-2 ${
                      theme === 'dark' 
                        ? 'text-gray-400 hover:text-white hover:bg-white/5' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {language === 'fi' ? 'Kirjaudu ulos' : 'Logout'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto p-6">
        <div className="grid grid-cols-[320px_1fr] gap-6">
          {/* Left Sidebar */}
          <div className="space-y-4">
            {/* Date Picker Card */}
            <Card className={`p-4 ${theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t('selectDate')}
              </h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className={theme === 'dark' ? '[&_.rdp-day_selected]:bg-[#FF6B35]' : ''}
              />
            </Card>

            {/* Quick Filters */}
            <Card className={`p-4 ${theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-gray-200'}`}>
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${
                    theme === 'dark' ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                  onClick={() => setSelectedDate(new Date())}
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {t('today')}
                </Button>
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${
                    theme === 'dark' ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    setSelectedDate(tomorrow);
                  }}
                >
                  <ChevronRight className="w-4 h-4 mr-2" />
                  {t('tomorrow')}
                </Button>
              </div>
            </Card>

            {isBatchBlockMode && (
              <Card className={`p-4 ${theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-gray-200'}`}>
                <div className="space-y-3">
                  <div>
                    <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {t('blockSelectedSlots')}
                    </h3>
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {selectedBlockTimes.length} {t('slotsSelected')}
                    </p>
                  </div>
                  <Textarea
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder={language === 'fi' ? 'Syy estolle (valinnainen)' : 'Reason for blocking (optional)'}
                    className={theme === 'dark' ? 'bg-[#252525] border-white/10 text-white' : ''}
                    rows={3}
                  />
                </div>
              </Card>
            )}
          </div>

          {/* Main Content - Schedule Grid */}
          <Card className={`p-6 ${theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-gray-200'}`}>
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {t('scheduling')}
                </h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {isBatchBlockMode ? t('selectionModeHint') : formatDate(selectedDate)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={isBatchBlockMode ? 'default' : 'outline'}
                  onClick={() => {
                    setIsBatchBlockMode((current) => !current);
                    setSelectedBlockTimes([]);
                  }}
                  className={isBatchBlockMode ? 'bg-[#FF6B35] hover:bg-[#FF6B35]/90' : ''}
                >
                  {isBatchBlockMode ? <CheckSquare className="w-4 h-4 mr-2" /> : <Square className="w-4 h-4 mr-2" />}
                  {isBatchBlockMode ? t('cancelSelection') : t('selectSlotsToBlock')}
                </Button>
                {isBatchBlockMode && selectedBlockTimes.length > 0 && (
                  <>
                    <Badge variant="secondary">
                      {selectedBlockTimes.length} {t('slotsSelected')}
                    </Badge>
                    <Button variant="outline" onClick={() => setSelectedBlockTimes([])}>
                      {t('clearSelection')}
                    </Button>
                    <Button
                      onClick={handleBlockSelectedSlots}
                      className="bg-[#FF6B35] hover:bg-[#FF6B35]/90"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      {t('blockSelectedSlots')}
                    </Button>
                  </>
                )}
              </div>
            </div>
            {isSunday ? (
              <div className="flex flex-col items-center justify-center h-[600px]">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                  theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                }`}>
                  <AlertCircle className={`w-10 h-10 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {t('closed')}
                </h3>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  {t('sundayClosed')}
                </p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-[600px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35]" />
              </div>
            ) : (
              <div className="space-y-2">
                {timeSlots.map((slot) => (
                  <div
                    key={slot.time}
                    onClick={() => handleSlotClick(slot, slot.time)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      selectedBlockTimes.includes(slot.time)
                        ? theme === 'dark'
                          ? 'ring-2 ring-[#FF6B35] bg-[#FF6B35]/10 border-[#FF6B35]/50'
                          : 'ring-2 ring-[#FF6B35] bg-orange-50 border-orange-300'
                        :
                      slot.isBlocked
                        ? theme === 'dark'
                          ? 'bg-red-950/20 border-red-900/50 hover:bg-red-950/30'
                          : 'bg-red-50 border-red-200 hover:bg-red-100'
                        : slot.bookings.length > 0
                        ? theme === 'dark'
                          ? 'bg-blue-950/20 border-blue-900/50 hover:bg-blue-950/30'
                          : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                        : theme === 'dark'
                        ? 'bg-[#252525] border-white/10 hover:bg-[#2C2C2E]'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                        <span className={`font-mono ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {slot.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {slot.isBlocked ? (
                          <Badge variant="destructive" className="bg-red-600">
                            <Lock className="w-3 h-3 mr-1" />
                            {t('blocked')}
                          </Badge>
                        ) : slot.bookings.length > 0 ? (
                          <>
                          <Badge className="bg-blue-600">
                              {t('booked')} ({slot.bookings.length})
                            </Badge>
                            <div className="flex gap-2">
                              {slot.bookings.slice(0, 2).map((booking, idx) => (
                                <span
                                  key={idx}
                                  className={`text-xs px-2 py-1 rounded ${
                                    theme === 'dark' ? 'bg-white/10 text-gray-300' : 'bg-white text-gray-700'
                                  }`}
                                >
                                  {booking.license_plate}
                                </span>
                              ))}
                              {slot.bookings.length > 2 && (
                                <span
                                  className={`text-xs px-2 py-1 rounded ${
                                    theme === 'dark' ? 'bg-white/10 text-gray-300' : 'bg-white text-gray-700'
                                  }`}
                                >
                                  +{slot.bookings.length - 2}
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <span className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                            {t('emptySlot')}
                          </span>
                        )}
                      </div>
                    </div>
                    {slot.isBlocked && slot.blockReason && (
                      <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {slot.blockReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Slot Detail Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <SheetContent
          side="right"
          className={`w-full overflow-y-auto sm:max-w-xl ${
            theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-gray-200'
          }`}
        >
          <SheetHeader className={theme === 'dark' ? 'border-b border-white/10' : 'border-b border-gray-200'}>
            <SheetTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
              {t('slotDetails')}
            </SheetTitle>
            <SheetDescription className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              {formatDate(selectedDate)} — {selectedSlotTime}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 px-4 py-5">
            {/* Bookings List */}
            <div>
              <h3 className={`font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t('bookingsList')} ({selectedSlot?.bookings.length || 0})
              </h3>
              {selectedSlot?.bookings && selectedSlot.bookings.length > 0 ? (
                <div className="space-y-2">
                  {selectedSlot.bookings.map((booking) => (
                    <Card
                      key={booking.id}
                      className={`p-4 ${
                        theme === 'dark' ? 'bg-[#252525] border-white/10' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`font-mono text-2xl font-semibold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {booking.license_plate}
                              </span>
                              <Badge variant="outline" className="whitespace-nowrap">
                                {t('resendCount')}: {resendCounts[booking.id] || 0}
                              </Badge>
                            </div>
                            <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                              {t('createdAt')}: {new Date(booking.created_at).toLocaleString(language === 'fi' ? 'fi-FI' : 'en-US')}
                            </p>
                          </div>

                          <div className="grid gap-2 sm:w-[240px]">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResendBookingConfirmation(booking)}
                              disabled={!booking.customer_email || resendingBookingId === booking.id}
                              className={`w-full justify-center ${theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : ''}`}
                            >
                              <Send className="w-4 h-4 mr-2 shrink-0" />
                              {resendingBookingId === booking.id ? t('sending') : t('resendConfirmation')}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancelBooking(booking)}
                              disabled={cancellingBookingId === booking.id}
                              className="w-full justify-center"
                            >
                              <Ban className="w-4 h-4 mr-2 shrink-0" />
                              {cancellingBookingId === booking.id ? t('cancelling') : t('cancelBooking')}
                            </Button>
                          </div>
                        </div>

                        <div className={`rounded-xl border p-3 ${theme === 'dark' ? 'border-white/10 bg-[#1C1C1E]' : 'border-gray-200 bg-white/80'}`}>
                          <label className={`mb-2 block text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {t('cancellationNote')}
                          </label>
                          <Textarea
                            value={cancellationNote}
                            onChange={(e) => setCancellationNote(e.target.value)}
                            placeholder={t('cancellationNotePlaceholder')}
                            className={theme === 'dark' ? 'bg-[#11141A] border-white/10 text-white' : ''}
                            rows={3}
                          />
                        </div>

                        <dl className="grid gap-4 sm:grid-cols-2">
                          {booking.service_name && (
                            <div className="min-w-0 rounded-xl border p-3 sm:col-span-2">
                              <dt className={`mb-1 flex items-center gap-2 text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                <Wrench className="h-4 w-4 shrink-0" />
                                {t('serviceName')}
                              </dt>
                              <dd className={`text-base font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                                {booking.service_name}
                              </dd>
                            </div>
                          )}
                          {booking.customer_name && (
                            <div className="min-w-0 rounded-xl border p-3">
                              <dt className={`mb-1 flex items-center gap-2 text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                <User className="h-4 w-4 shrink-0" />
                                {t('customerName')}
                              </dt>
                              <dd className={`text-base font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                                {booking.customer_name}
                              </dd>
                            </div>
                          )}
                          {booking.customer_phone && (
                            <div className="min-w-0 rounded-xl border p-3">
                              <dt className={`mb-1 flex items-center gap-2 text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                <Phone className="h-4 w-4 shrink-0" />
                                {t('customerPhone')}
                              </dt>
                              <dd className={`text-base font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                                {booking.customer_phone}
                              </dd>
                            </div>
                          )}
                          {booking.customer_email && (
                            <div className="min-w-0 rounded-xl border p-3 sm:col-span-2">
                              <dt className={`mb-1 flex items-center gap-2 text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                <Mail className="h-4 w-4 shrink-0" />
                                {t('customerEmail')}
                              </dt>
                              <dd className={`break-all text-base font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                                {booking.customer_email}
                              </dd>
                            </div>
                          )}
                          <div className="min-w-0 rounded-xl border p-3 sm:col-span-2">
                            <dt className={`mb-1 flex items-center gap-2 text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              <StickyNote className="h-4 w-4 shrink-0" />
                              {t('notes')}
                            </dt>
                            <dd className={`text-base leading-relaxed ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                              {booking.notes || t('noNotes')}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                  {t('noBookings')}
                </p>
              )}
            </div>

            <Separator className={theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'} />

            {/* Blocking Controls */}
            <div>
              <h3 className={`font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t('blockingControls')}
              </h3>
              {selectedSlot?.isBlocked ? (
                <div>
                  {selectedSlot.blockReason && (
                    <div
                      className={`p-3 rounded-lg mb-4 ${
                        theme === 'dark' ? 'bg-red-950/20 border border-red-900/50' : 'bg-red-50 border border-red-200'
                      }`}
                    >
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {selectedSlot.blockReason}
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={() => handleUnblockSlot(selectedSlotTime)}
                    variant="destructive"
                    className="w-full"
                  >
                    <Unlock className="w-4 h-4 mr-2" />
                    {t('unblockSlot')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className={`text-sm mb-2 block ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('reasonOptional')}
                    </label>
                    <Textarea
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      placeholder={language === 'fi' ? 'Esim. Huoltokatko' : 'e.g. Maintenance'}
                      className={theme === 'dark' ? 'bg-[#252525] border-white/10 text-white' : ''}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleBlockSlot(selectedSlotTime, false)}
                      className="flex-1 bg-[#FF6B35] hover:bg-[#FF6B35]/90"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      {t('blockSlot')}
                    </Button>
                    <Button
                      onClick={() => handleBlockSlot(selectedSlotTime, true)}
                      variant="outline"
                      className={`flex-1 ${
                        theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : ''
                      }`}
                    >
                      {t('blockUntilEndOfDay')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
