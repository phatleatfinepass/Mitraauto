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
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { getSupabaseClient } from '../../utils/supabase/client';
import { toast } from 'sonner';

interface Booking {
  id: string;
  license_plate: string;
  booking_date: string;
  booking_time: string;
  created_at: string;
}

interface BlockedSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason?: string;
  created_at: string;
}

interface TimeSlot {
  time: string;
  bookings: Booking[];
  isBlocked: boolean;
  blockReason?: string;
}

const WEEKDAY_HOURS = { start: 9, end: 18 };
const SATURDAY_HOURS = { start: 10, end: 17 };

interface AdminSchedulePageProps {
  onLogout?: () => void;
}

export const AdminSchedulePage: React.FC<AdminSchedulePageProps> = ({ onLogout }) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);

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
    };
    return translations[key]?.[language] || key;
  };

  // Generate time slots based on day of week
  const generateTimeSlots = (date: Date): string[] => {
    const dayOfWeek = date.getDay();
    
    // Sunday - closed
    if (dayOfWeek === 0) {
      return [];
    }
    
    const hours = dayOfWeek === 6 ? SATURDAY_HOURS : WEEKDAY_HOURS;
    const slots: string[] = [];
    
    for (let hour = hours.start; hour < hours.end; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    
    return slots;
  };

  // Fetch bookings and blocked slots
  const fetchScheduleData = async (date: Date) => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const dateStr = date.toISOString().split('T')[0];

      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_date', dateStr);

      if (bookingsError) throw bookingsError;

      // Fetch blocked slots
      const { data: blockedData, error: blockedError } = await supabase
        .from('blocked_slots')
        .select('*')
        .eq('date', dateStr);

      if (blockedError) throw blockedError;

      setBookings(bookingsData || []);
      setBlockedSlots(blockedData || []);

      // Build time slots
      const slots = generateTimeSlots(date);
      const timeSlotsData: TimeSlot[] = slots.map((time) => {
        const slotBookings = (bookingsData || []).filter(
          (b) => b.booking_time === time
        );
        
        const blockedSlot = (blockedData || []).find(
          (bs) => time >= bs.start_time && time < bs.end_time
        );

        return {
          time,
          bookings: slotBookings,
          isBlocked: !!blockedSlot,
          blockReason: blockedSlot?.reason,
        };
      });

      setTimeSlots(timeSlotsData);
    } catch (error) {
      console.error('Error fetching schedule data:', error);
      toast.error(language === 'fi' ? 'Virhe tietojen lataamisessa' : 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleData(selectedDate);
  }, [selectedDate]);

  // Block a single slot
  const handleBlockSlot = async (time: string, untilEndOfDay: boolean = false) => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const supabase = getSupabaseClient();

    try {
      let endTime: string;
      if (untilEndOfDay) {
        const dayOfWeek = selectedDate.getDay();
        const hours = dayOfWeek === 6 ? SATURDAY_HOURS : WEEKDAY_HOURS;
        endTime = `${hours.end.toString().padStart(2, '0')}:00`;
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

  // Unblock a slot
  const handleUnblockSlot = async (time: string) => {
    const dateStr = selectedDate.toISOString().split('T')[0];
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

  const handleSlotClick = (slot: TimeSlot, time: string) => {
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
          </div>

          {/* Main Content - Schedule Grid */}
          <Card className={`p-6 ${theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-gray-200'}`}>
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
          className={`w-full sm:max-w-xl ${
            theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-gray-200'
          }`}
        >
          <SheetHeader>
            <SheetTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
              {t('slotDetails')}
            </SheetTitle>
            <SheetDescription className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              {formatDate(selectedDate)} — {selectedSlotTime}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
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
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-mono font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {booking.license_plate}
                        </span>
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {booking.booking_time}
                        </span>
                      </div>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                        {t('createdAt')}: {new Date(booking.created_at).toLocaleString(language === 'fi' ? 'fi-FI' : 'en-US')}
                      </p>
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
