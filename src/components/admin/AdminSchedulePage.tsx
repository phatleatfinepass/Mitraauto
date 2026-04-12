import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../ThemeContext';
import { useLanguage } from '../LanguageContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import {
  Lock,
  Unlock,
  CheckSquare,
  Square,
  Pencil,
  PlusCircle,
  Save,
} from 'lucide-react';
import { getSupabaseClient } from '../../utils/supabase/client';
import { formatDateForSupabase } from '../../utils/date';
import { buildScheduleTimeSlots, generateScheduleSlots, ScheduleBlockedSlot, ScheduleBooking, ScheduleTimeSlot } from '../../utils/schedule';
import {
  getLocalizedServiceCategories,
  getServiceIdsFromStoredServiceName,
  localizeStoredServiceName,
  SupportedBookingLanguage,
} from '../../utils/serviceCatalog';
import { toast } from 'sonner';
import { AdminScheduleBookingPanel } from './AdminScheduleBookingPanel';
import { AdminScheduleDrawer } from './AdminScheduleDrawer';
import { AdminScheduleGrid } from './AdminScheduleGrid';
import { AdminScheduleSearchDialog } from './AdminScheduleSearchDialog';
import { AdminScheduleSidebar } from './AdminScheduleSidebar';
import type { AdminBookingFormState, BookingMessageDraft } from './AdminSchedule.types';

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
  const [cancelBookingTarget, setCancelBookingTarget] = useState<ScheduleBooking | null>(null);
  const [cancelBookingNote, setCancelBookingNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<ScheduleBooking[]>([]);
  const [timelineBookings, setTimelineBookings] = useState<ScheduleBooking[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<ScheduleBlockedSlot[]>([]);
  const [isBatchBlockMode, setIsBatchBlockMode] = useState(false);
  const [selectedBlockTimes, setSelectedBlockTimes] = useState<string[]>([]);
  const [resendingBookingId, setResendingBookingId] = useState<string | null>(null);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [savingBookingId, setSavingBookingId] = useState<string | null>(null);
  const [sendingMessageBookingId, setSendingMessageBookingId] = useState<string | null>(null);
  const [resendCounts, setResendCounts] = useState<Record<string, number>>({});
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [confirmingBookingId, setConfirmingBookingId] = useState<string | null>(null);
  const [composeMessageBookingId, setComposeMessageBookingId] = useState<string | null>(null);
  const [expandedBookingIds, setExpandedBookingIds] = useState<string[]>([]);
  const [createBookingForm, setCreateBookingForm] = useState<AdminBookingFormState>({
    license_plate: '',
    booking_date: formatDateForSupabase(new Date()),
    booking_time: '',
    booking_language: language,
    service_name: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    notes: '',
  });
  const [createBookingSelectedCategory, setCreateBookingSelectedCategory] = useState<string>('');
  const [createBookingCurrentServiceId, setCreateBookingCurrentServiceId] = useState<string>('');
  const [createBookingServiceIds, setCreateBookingServiceIds] = useState<string[]>([]);
  const [editBookingForms, setEditBookingForms] = useState<Record<string, AdminBookingFormState>>({});
  const [editBookingSelectedCategory, setEditBookingSelectedCategory] = useState<Record<string, string>>({});
  const [editBookingCurrentServiceId, setEditBookingCurrentServiceId] = useState<Record<string, string>>({});
  const [editBookingServiceIds, setEditBookingServiceIds] = useState<Record<string, string[]>>({});
  const [messageDrafts, setMessageDrafts] = useState<Record<string, BookingMessageDraft>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ScheduleBooking[]>([]);
  const [isSearchingBookings, setIsSearchingBookings] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [activeBookingsTab, setActiveBookingsTab] = useState<'schedule' | 'reservation'>('schedule');
  const [showArchivedBookings, setShowArchivedBookings] = useState(false);
  const [showArchivedInline, setShowArchivedInline] = useState(false);
  const [archivedBookings, setArchivedBookings] = useState<ScheduleBooking[]>([]);
  const [slotActionTime, setSlotActionTime] = useState<string | null>(null);
  const [slotActionSlot, setSlotActionSlot] = useState<ScheduleTimeSlot | null>(null);
  const [isSlotActionDialogOpen, setIsSlotActionDialogOpen] = useState(false);
  const [archivedBookingModal, setArchivedBookingModal] = useState<ScheduleBooking | null>(null);
  const [restoreArchivedBookingTarget, setRestoreArchivedBookingTarget] = useState<ScheduleBooking | null>(null);
  const [sendRestoreEmail, setSendRestoreEmail] = useState(true);
  const [restoringBookingId, setRestoringBookingId] = useState<string | null>(null);
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null);
  const searchRequestIdRef = useRef(0);

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
      timeSlots: { fi: 'Ajat', en: 'Time slots' },
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
      blockSelectedSlots: { fi: 'Estä', en: 'Block' },
      selectSlotsToBlock: { fi: 'Hallitse aikoja', en: 'Manage slots' },
      cancelSelection: { fi: 'Peru valinta', en: 'Cancel selection' },
      slotsSelected: { fi: 'aikaa valittu', en: 'slots selected' },
      clearSelection: { fi: 'Tyhjennä valinta', en: 'Clear selection' },
      selectionModeHint: {
        fi: 'Klikkaa vapaita aikoja estääksesi ne tai estettyjä aikoja poistaaksesi eston. Varattuja aikoja ei hallita tässä tilassa.',
        en: 'Click available slots to block them or blocked slots to remove the block. Booked slots cannot be changed in this mode.',
      },
      batchBlockSuccessful: { fi: 'Valittujen aikojen muutokset tallennettiin', en: 'Selected slot changes saved' },
      bookedSlotsNotManageable: { fi: 'Varattuja aikoja ei voi hallita tässä tilassa', en: 'Booked slots cannot be changed in this mode' },
      resendConfirmation: { fi: 'Lähetä uudelleen', en: 'Resend confirmation' },
      resendSuccessful: { fi: 'Vahvistusviesti lähetetty uudelleen', en: 'Confirmation email sent again' },
      resendFailed: { fi: 'Vahvistusviestin uudelleenlähetys epäonnistui', en: 'Failed to resend confirmation email' },
      noEmailAddress: { fi: 'Ei sähköpostiosoitetta', en: 'No email address' },
      sending: { fi: 'Lähetetään...', en: 'Sending...' },
      resendCount: { fi: 'Lähetyksiä', en: 'Resends' },
      cancelBooking: { fi: 'Peruuta', en: 'Cancel booking' },
      cancelling: { fi: 'Perutaan...', en: 'Cancelling...' },
      saving: { fi: 'Tallennetaan...', en: 'Saving...' },
      cancelSuccessful: { fi: 'Varaus peruttu', en: 'Booking cancelled' },
      cancelFailed: { fi: 'Varauksen peruminen epäonnistui', en: 'Failed to cancel booking' },
      cancellationEmailSent: { fi: 'Peruutusviesti lähetetty asiakkaalle', en: 'Cancellation email sent to customer' },
      cancellationNote: { fi: 'Peruutuksen syy', en: 'Cancellation note' },
      cancellationNotePlaceholder: { fi: 'Esim. Aika ei ole enää saatavilla tai varausta siirrettiin puhelimitse', en: 'For example, the slot is no longer available or the booking was moved by phone' },
      cancelBookingConfirmTitle: { fi: 'Perutaanko varaus?', en: 'Cancel this booking?' },
      cancelBookingConfirmDescription: { fi: 'Peruutusviesti lähetetään asiakkaalle ja varaus merkitään perutuksi.', en: 'A cancellation email will be sent to the customer and the booking will be marked as cancelled.' },
      keepBooking: { fi: 'Pidä varaus', en: 'Keep booking' },
      confirmCancelBooking: { fi: 'Peruuta varaus', en: 'Cancel booking' },
      createBooking: { fi: 'Luo varaus', en: 'Create booking' },
      creatingBooking: { fi: 'Luodaan varausta...', en: 'Creating booking...' },
      createBookingDescription: { fi: 'Kirjaa puhelimitse tai tiskillä tehty varaus ja lähetä vahvistus asiakkaalle.', en: 'Create a booking made by phone or at the desk and send the confirmation to the customer.' },
      editBooking: { fi: 'Muokkaa varausta', en: 'Edit booking' },
      saveBooking: { fi: 'Tallenna varaus', en: 'Save booking' },
      saveChanges: { fi: 'Tallenna muutokset', en: 'Save changes' },
      bookingSaved: { fi: 'Varaus tallennettu', en: 'Booking saved' },
      bookingUpdated: { fi: 'Varaus päivitetty', en: 'Booking updated' },
      bookingUpdateEmailSent: { fi: 'Päivitysviesti lähetetty asiakkaalle', en: 'Update email sent to customer' },
      bookingSaveFailed: { fi: 'Varauksen tallennus epäonnistui', en: 'Failed to save booking' },
      bookingControls: { fi: 'Varauksen hallinta', en: 'Booking controls' },
      bookingControlsDescription: { fi: 'Lähetä vahvistus uudelleen, muokkaa varausta tai viesti asiakkaalle tästä varauksesta.', en: 'Resend confirmation, edit this booking, or contact the customer about this booking.' },
      blockingControlsDescription: { fi: 'Estä tämä aika kokonaan tai loppupäiväksi. Tämä vaikuttaa julkiseen varausnäkymään.', en: 'Block this slot completely or until end of day. This affects public booking availability.' },
      bookingLanguage: { fi: 'Varauksen kieli', en: 'Booking language' },
      finnish: { fi: 'Suomi', en: 'Finnish' },
      english: { fi: 'Englanti', en: 'English' },
      date: { fi: 'Päivämäärä', en: 'Date' },
      time: { fi: 'Aika', en: 'Time' },
      servicePlaceholder: { fi: 'Valitse palvelu', en: 'Select a service' },
      noEmailNoSend: { fi: 'Sähköposti puuttuu, joten viestiä ei voi lähettää', en: 'Missing email address, so the message cannot be sent' },
      sendMessage: { fi: 'Lähetä viesti', en: 'Send message' },
      sendingMessage: { fi: 'Lähetetään viestiä...', en: 'Sending message...' },
      messageSubject: { fi: 'Viestin aihe', en: 'Message subject' },
      messageBody: { fi: 'Viesti', en: 'Message' },
      messageSubjectPlaceholder: { fi: 'Esim. Tarvitsemme rengaskoon ennen käyntiä', en: 'e.g. We need the tire size before your visit' },
      messageBodyPlaceholder: { fi: 'Kirjoita asiakkaalle lähetettävä viesti tähän.', en: 'Write the message that will be sent to the customer here.' },
      adminMessageSent: { fi: 'Viesti lähetetty asiakkaalle', en: 'Message sent to customer' },
      adminMessageFailed: { fi: 'Viestin lähetys epäonnistui', en: 'Failed to send message' },
      messageRequired: { fi: 'Kirjoita aihe ja viesti ennen lähettämistä', en: 'Enter both a subject and a message before sending' },
      cancel: { fi: 'Peruuta', en: 'Cancel' },
      cancelEditing: { fi: 'Peruuta muokkaus', en: 'Cancel edit' },
      closeComposer: { fi: 'Sulje viesti', en: 'Close message' },
      slotSummary: { fi: 'Valittu aika', en: 'Selected slot' },
      slotStatus: { fi: 'Tilanne', en: 'Status' },
      slotAvailable: { fi: 'Vapaa', en: 'Available' },
      slotBlocked: { fi: 'Estetty', en: 'Blocked' },
      slotBookingsCount: { fi: 'Varauksia', en: 'Bookings' },
      bookingInformation: { fi: 'Varauksen tiedot', en: 'Booking information' },
      bookingActions: { fi: 'Toiminnot', en: 'Actions' },
      blockReason: { fi: 'Eston syy', en: 'Block reason' },
      currentBlock: { fi: 'Nykyinen esto', en: 'Current block' },
      noBlockReason: { fi: 'Ei syytä annettu', en: 'No reason provided' },
      selectedSlotControls: { fi: 'Valitun ajan hallinta', en: 'Selected slot controls' },
      selectedSlotControlsDescription: { fi: 'Estä tai vapauta valittu aika ilman, että avaat varaustiedot uudelleen.', en: 'Block or release the selected slot without opening booking details again.' },
      fullInformation: { fi: 'Täydet tiedot', en: 'Full information' },
      collapseInformation: { fi: 'Tiivistä', en: 'Collapse information' },
      bookingSummaryService: { fi: 'Palvelu', en: 'Service' },
      bookingSummaryCustomer: { fi: 'Asiakas', en: 'Customer' },
      searchBookings: { fi: 'Etsi varauksia', en: 'Search bookings' },
      scheduleTab: { fi: 'Aikataulu', en: 'Schedule' },
      reservationTab: { fi: 'Varaukset', en: 'Reservation' },
      searchBookingsPlaceholder: { fi: 'Rekisterinumero, nimi, puhelin, sähköposti tai varaustunnus', en: 'License plate, name, phone, email or booking id' },
      search: { fi: 'Hae', en: 'Search' },
      searching: { fi: 'Haetaan...', en: 'Searching...' },
      searchResultsTitle: { fi: 'Hakutulokset', en: 'Search results' },
      searchDialogDescription: { fi: 'Kirjoita asiakkaan nimi, puhelin, sähköposti, rekisterinumero tai varauksen tunnus.', en: 'Type a customer name, phone, email, license plate, or booking ID.' },
      startTypingToSearch: { fi: 'Aloita kirjoittaminen nähdäksesi hakutulokset.', en: 'Start typing to see matching bookings.' },
      upcomingBookings: { fi: 'Tulevat varaukset', en: 'Upcoming bookings' },
      archivedBookings: { fi: 'Arkistoidut varaukset', en: 'Archived bookings' },
      archivedStatus: { fi: 'Arkistoitu', en: 'Archived' },
      archivedInline: { fi: 'Arkistoidut samassa listassa', en: 'Archived inline' },
      showArchivedBookings: { fi: 'Näytä arkistoidut', en: 'Show archived' },
      hideArchivedBookings: { fi: 'Piilota arkistoidut', en: 'Hide archived' },
      noArchivedBookings: { fi: 'Ei arkistoituja varauksia', en: 'No archived bookings' },
      noSearchResults: { fi: 'Hakutuloksia ei löytynyt', en: 'No matching bookings found' },
      searchHint: { fi: 'Haku käy myös peruttuihin varauksiin.', en: 'Search includes cancelled bookings too.' },
      sundayLabel: { fi: 'Su', en: 'Su' },
      createInThisSlot: { fi: 'Luo varaus tähän aikaan', en: 'Create booking in this time slot' },
      slotActions: { fi: 'Ajan toiminnot', en: 'Time slot actions' },
      slotActionsDescription: { fi: 'Valitse, mitä haluat tehdä tällä ajalla.', en: 'Choose what you want to do with this time slot.' },
      blockMultipleTimeSlots: { fi: 'Estä useita aikoja', en: 'Block multiple time slots' },
      batchBlockActivated: { fi: 'Moniaikojen esto aktivoitu. Valitse estettävät ajat kalenterista.', en: 'Multi-slot blocking enabled. Choose the time slots to block from the schedule.' },
      archivedBookingDetails: { fi: 'Arkistoidun varauksen tiedot', en: 'Archived booking details' },
      restoreBooking: { fi: 'Palauta varaus', en: 'Restore booking' },
      restoreBookingConfirmTitle: { fi: 'Palautetaanko varaus?', en: 'Restore this booking?' },
      restoreBookingConfirmDescription: { fi: 'Varaus merkitään taas aktiiviseksi. Voit halutessasi lähettää asiakkaalle uuden vahvistusviestin.', en: 'The booking will become active again. You can optionally send a new confirmation email to the customer.' },
      sendRestoreEmail: { fi: 'Lähetä asiakkaalle uusi vahvistusviesti', en: 'Send a new confirmation email to the customer' },
      restoreSuccessful: { fi: 'Varaus palautettu', en: 'Booking restored' },
      restoreFailed: { fi: 'Varauksen palautus epäonnistui', en: 'Failed to restore booking' },
      deleteBookingPermanently: { fi: 'Poista pysyvästi', en: 'Delete permanently' },
      deleteBookingConfirmTitle: { fi: 'Poistetaanko varaus pysyvästi?', en: 'Delete booking permanently?' },
      deleteBookingConfirmDescription: { fi: 'Tätä toimintoa ei voi perua. Vain arkistoidut varaukset kannattaa poistaa pysyvästi.', en: 'This action cannot be undone. Only archived bookings should be permanently deleted.' },
      deleting: { fi: 'Poistetaan...', en: 'Deleting...' },
      deleteSuccessful: { fi: 'Varaus poistettu pysyvästi', en: 'Booking permanently deleted' },
      deleteFailed: { fi: 'Varauksen pysyvä poisto epäonnistui', en: 'Failed to permanently delete booking' },
    };
    return translations[key]?.[language] || key;
  };

  const selectedLanguageServiceCategories = (selectedLanguage: SupportedBookingLanguage) =>
    getLocalizedServiceCategories(selectedLanguage);

  const getSelectedServiceNames = (serviceIds: string[], selectedLanguage: SupportedBookingLanguage) => {
    const services = selectedLanguageServiceCategories(selectedLanguage)
      .flatMap((category) => category.services)
      .filter((service) => serviceIds.includes(service.id));

    return services.map((service) => service.name);
  };

  const syncCreateBookingServiceName = (serviceIds: string[], selectedLanguage: SupportedBookingLanguage) => {
    const serviceNames = getSelectedServiceNames(serviceIds, selectedLanguage);
    setCreateBookingForm((current) => ({
      ...current,
      service_name: serviceNames.join(', '),
    }));
  };

  const syncEditBookingServiceName = (
    bookingId: string,
    serviceIds: string[],
    selectedLanguage: SupportedBookingLanguage,
  ) => {
    const serviceNames = getSelectedServiceNames(serviceIds, selectedLanguage);
    setEditBookingForms((current) => ({
      ...current,
      [bookingId]: {
        ...(current[bookingId] || buildBookingFormState(undefined, selectedSlotTime)),
        booking_language: selectedLanguage,
        service_name: serviceNames.join(', '),
      },
    }));
  };

  const buildBookingFormState = (booking?: Partial<ScheduleBooking>, fallbackTime = ''): AdminBookingFormState => ({
    license_plate: booking?.license_plate || '',
    booking_date: booking?.booking_date || formatDateForSupabase(selectedDate),
    booking_time: booking?.booking_time || fallbackTime,
    booking_language: booking?.booking_language === 'en' ? 'en' : 'fi',
    service_name: booking?.service_name || '',
    customer_name: booking?.customer_name || '',
    customer_phone: booking?.customer_phone || '',
    customer_email: booking?.customer_email || '',
    notes: booking?.notes || '',
  });

  // Fetch bookings and blocked slots
  const fetchScheduleData = async (date: Date) => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const dateStr = formatDateForSupabase(date);
      const todayStr = formatDateForSupabase(new Date());

      console.log('[CMS] Fetching bookings for date:', dateStr);

      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
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

      const { data: timelineData, error: timelineError } = await supabase
        .from('bookings')
        .select('*')
        .gte('booking_date', todayStr)
        .lte('booking_date', formatDateForSupabase(new Date(new Date().setDate(new Date().getDate() + 7))))
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true })
        .limit(250);

      if (timelineError) {
        throw timelineError;
      }

      setTimelineBookings((timelineData || []).filter((booking) => (booking.status || 'confirmed').toLowerCase() !== 'cancelled'));
    } catch (error) {
      console.error('[CMS] Error fetching schedule data:', error);
      toast.error(language === 'fi' ? 'Virhe tietojen lataamisessa' : 'Error loading data');
      // Set empty data so UI doesn't break
      setBookings([]);
      setTimelineBookings([]);
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
    setCancelBookingTarget(null);
    setCancelBookingNote('');
    setIsCreateFormOpen(false);
    setEditingBookingId(null);
    setComposeMessageBookingId(null);
    setEditBookingForms({});
    setEditBookingSelectedCategory({});
    setEditBookingCurrentServiceId({});
    setEditBookingServiceIds({});
    setMessageDrafts({});
    setCreateBookingForm(buildBookingFormState(undefined, ''));
    setCreateBookingSelectedCategory('');
    setCreateBookingCurrentServiceId('');
    setCreateBookingServiceIds([]);
    fetchScheduleData(selectedDate);
  }, [selectedDate]);

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
  }, [searchQuery, activeBookingsTab, showArchivedBookings, showArchivedInline, isSearchDialogOpen]);

  const getBookingLanguage = (booking: ScheduleBooking): SupportedBookingLanguage =>
    booking.booking_language === 'en' ? 'en' : 'fi';

  const getBookingServiceNameForCms = (serviceName?: string | null) =>
    localizeStoredServiceName(serviceName, language);

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

  const groupedTimelineBookings = timelineBookings.reduce<Array<{ date: string; bookings: ScheduleBooking[] }>>((groups, booking) => {
    const currentGroup = groups[groups.length - 1];
    if (currentGroup?.date === booking.booking_date) {
      currentGroup.bookings.push(booking);
      return groups;
    }

    groups.push({ date: booking.booking_date, bookings: [booking] });
    return groups;
  }, []);

  const groupedArchivedBookings = archivedBookings.reduce<Array<{ date: string; bookings: ScheduleBooking[] }>>((groups, booking) => {
    const currentGroup = groups[groups.length - 1];
    if (currentGroup?.date === booking.booking_date) {
      currentGroup.bookings.push(booking);
      return groups;
    }

    groups.push({ date: booking.booking_date, bookings: [booking] });
    return groups;
  }, []);

  const reservationDisplayGroups = (() => {
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
  })();

  const isBookingExpanded = (bookingId: string) => expandedBookingIds.includes(bookingId);

  const setBookingExpanded = (bookingId: string, expanded: boolean) => {
    setExpandedBookingIds((current) =>
      expanded ? (current.includes(bookingId) ? current : [...current, bookingId]) : current.filter((id) => id !== bookingId),
    );
  };

  const createBookingConfirmationPayload = (booking: ScheduleBooking) => ({
    bookingId: booking.id,
    customerName: booking.customer_name || '',
    customerEmail: booking.customer_email || '',
    customerPhone: booking.customer_phone || null,
    licensePlate: booking.license_plate,
    bookingDate: booking.booking_date,
    bookingTime: booking.booking_time,
    serviceName: booking.service_name || 'Service',
    language: getBookingLanguage(booking),
    notes: booking.notes || null,
  });

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
      const selectedBlockedSlots = blockedSlots.filter((slot) =>
        selectedBlockTimes.some((time) => time >= slot.start_time && time < slot.end_time),
      );

      const blockedSlotIdsToDelete = [...new Set(selectedBlockedSlots.map((slot) => slot.id))];
      const timesToInsert = selectedBlockTimes.filter(
        (time) => !selectedBlockedSlots.some((slot) => time >= slot.start_time && time < slot.end_time),
      );

      const rows = timesToInsert.map((time) => {
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

      if (blockedSlotIdsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('blocked_slots')
          .delete()
          .in('id', blockedSlotIdsToDelete);

        if (deleteError) throw deleteError;
      }

      if (rows.length > 0) {
        const { error: insertError } = await supabase.from('blocked_slots').insert(rows);

        if (insertError) throw insertError;
      }

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
          ...createBookingConfirmationPayload(booking),
        },
      });

      if (error) {
        throw error;
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

  const handleOpenCancelBookingDialog = (booking: ScheduleBooking) => {
    setCancelBookingTarget(booking);
    setCancelBookingNote('');
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
      const cancellationNote = cancelBookingNote;

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
            language: getBookingLanguage(booking),
            cancellationNote: cancellationNote.trim() || null,
          },
        });

        if (emailError) {
          throw emailError;
        }

        toast.success(t('cancellationEmailSent'));
      }

      toast.success(t('cancelSuccessful'));
      setCancelBookingTarget(null);
      setCancelBookingNote('');
      setIsDrawerOpen(false);
      fetchScheduleData(selectedDate);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(t('cancelFailed'));
    } finally {
      setCancellingBookingId(null);
    }
  };

  const handleCreateBooking = async () => {
    if (!createBookingForm.license_plate.trim() || !createBookingForm.customer_name.trim() || !createBookingForm.customer_phone.trim() || !createBookingForm.service_name.trim() || !createBookingForm.booking_date || !createBookingForm.booking_time) {
      toast.error(t('bookingSaveFailed'));
      return;
    }

    setIsCreatingBooking(true);
    try {
      const supabase = getSupabaseClient();
      const bookingPayload = {
        license_plate: createBookingForm.license_plate.trim().toUpperCase(),
        booking_date: createBookingForm.booking_date,
        booking_time: createBookingForm.booking_time,
        booking_language: createBookingForm.booking_language,
        service_name: createBookingForm.service_name.trim(),
        customer_name: createBookingForm.customer_name.trim(),
        customer_phone: createBookingForm.customer_phone.trim(),
        customer_email: createBookingForm.customer_email.trim() || null,
        notes: createBookingForm.notes.trim() || null,
        status: 'confirmed',
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingPayload])
        .select('*')
        .single();

      if (error || !data) {
        throw error;
      }

      if (data.customer_email) {
        const { error: emailError } = await supabase.functions.invoke('send_booking_confirmation', {
          method: 'POST',
          body: createBookingConfirmationPayload(data),
        });

        if (emailError) {
          throw emailError;
        }
      }

      const { error: pushError } = await supabase.functions.invoke('send_booking_push', {
        method: 'POST',
        body: {
          booking: {
            id: data.id,
            license_plate: data.license_plate,
            customer_name: data.customer_name,
            booking_date: data.booking_date,
            booking_time: data.booking_time,
          },
        },
      });

      if (pushError) {
        console.error('Booking saved but push notification failed:', pushError);
      }

      toast.success(t('bookingSaved'));
      setIsCreateFormOpen(false);
      setCreateBookingForm(buildBookingFormState(undefined, selectedSlotTime));
      setCreateBookingSelectedCategory('');
      setCreateBookingCurrentServiceId('');
      setCreateBookingServiceIds([]);
      setSelectedSlotTime(data.booking_time);
      fetchScheduleData(selectedDate);
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(t('bookingSaveFailed'));
    } finally {
      setIsCreatingBooking(false);
    }
  };

  const handleStartEditingBooking = (booking: ScheduleBooking) => {
    const initialServiceIds = getServiceIdsFromStoredServiceName(booking.service_name);
    setComposeMessageBookingId((current) => (current === booking.id ? null : current));
    setEditingBookingId(booking.id);
    setBookingExpanded(booking.id, true);
    setEditBookingForms((current) => ({
      ...current,
      [booking.id]: buildBookingFormState(booking),
    }));
    setEditBookingSelectedCategory((current) => ({ ...current, [booking.id]: '' }));
    setEditBookingCurrentServiceId((current) => ({ ...current, [booking.id]: '' }));
    setEditBookingServiceIds((current) => ({ ...current, [booking.id]: initialServiceIds }));
  };

  const handleEditBookingFieldChange = (
    bookingId: string,
    field: keyof AdminBookingFormState,
    value: string,
  ) => {
    if (field === 'booking_language') {
      const nextLanguage = value as SupportedBookingLanguage;
      const currentServiceIds = editBookingServiceIds[bookingId] || [];
      if (currentServiceIds.length > 0) {
        syncEditBookingServiceName(bookingId, currentServiceIds, nextLanguage);
      } else {
        setEditBookingForms((current) => ({
          ...current,
          [bookingId]: {
            ...(current[bookingId] || buildBookingFormState(undefined, selectedSlotTime)),
            booking_language: nextLanguage,
          },
        }));
      }
      return;
    }

    setEditBookingForms((current) => ({
      ...current,
      [bookingId]: {
        ...(current[bookingId] || buildBookingFormState(undefined, selectedSlotTime)),
        [field]: value,
      },
    }));
  };

  const handleSaveBookingChanges = async (booking: ScheduleBooking) => {
    const form = editBookingForms[booking.id];
    if (!form || !form.license_plate.trim() || !form.customer_name.trim() || !form.customer_phone.trim() || !form.service_name.trim() || !form.booking_date || !form.booking_time) {
      toast.error(t('bookingSaveFailed'));
      return;
    }

    setSavingBookingId(booking.id);
    try {
      const supabase = getSupabaseClient();
      const normalizedLicensePlate = form.license_plate.trim().toUpperCase();
      const normalizedServiceName = form.service_name.trim();
      const normalizedCustomerName = form.customer_name.trim();
      const normalizedCustomerPhone = form.customer_phone.trim();
      const normalizedCustomerEmail = form.customer_email.trim();
      const normalizedNotes = form.notes.trim();
      const originalServiceIds = getServiceIdsFromStoredServiceName(booking.service_name);
      const updatedServiceIds = getServiceIdsFromStoredServiceName(normalizedServiceName);
      const sameServiceSelection =
        originalServiceIds.length > 0 &&
        updatedServiceIds.length > 0 &&
        originalServiceIds.length === updatedServiceIds.length &&
        originalServiceIds.every((serviceId, index) => serviceId === updatedServiceIds[index]);
      const serviceActuallyChanged = sameServiceSelection
        ? false
        : (booking.service_name || '').trim() !== normalizedServiceName;
      const shouldSendUpdateEmail =
        !!normalizedCustomerEmail &&
        (
          booking.booking_date !== form.booking_date ||
          booking.booking_time !== form.booking_time ||
          serviceActuallyChanged
        );

      const { error } = await supabase
        .from('bookings')
        .update({
          license_plate: normalizedLicensePlate,
          booking_date: form.booking_date,
          booking_time: form.booking_time,
          booking_language: form.booking_language,
          service_name: normalizedServiceName,
          customer_name: normalizedCustomerName,
          customer_phone: normalizedCustomerPhone,
          customer_email: normalizedCustomerEmail || null,
          notes: normalizedNotes || null,
        })
        .eq('id', booking.id);

      if (error) {
        throw error;
      }

      if (shouldSendUpdateEmail) {
        const { error: emailError } = await supabase.functions.invoke('send_booking_update', {
          method: 'POST',
          body: {
            bookingId: booking.id,
            customerName: normalizedCustomerName,
            customerEmail: normalizedCustomerEmail,
            customerPhone: normalizedCustomerPhone || null,
            licensePlate: normalizedLicensePlate,
            bookingDate: form.booking_date,
            bookingTime: form.booking_time,
            serviceName: normalizedServiceName,
            language: form.booking_language,
            notes: normalizedNotes || null,
          },
        });

        if (emailError) {
          throw emailError;
        }
      }

      toast.success(t('bookingUpdated'));
      if (shouldSendUpdateEmail) {
        toast.success(t('bookingUpdateEmailSent'));
      }
      setEditingBookingId(null);
      setEditBookingForms((current) => {
        const next = { ...current };
        delete next[booking.id];
        return next;
      });
      setEditBookingSelectedCategory((current) => {
        const next = { ...current };
        delete next[booking.id];
        return next;
      });
      setEditBookingCurrentServiceId((current) => {
        const next = { ...current };
        delete next[booking.id];
        return next;
      });
      setEditBookingServiceIds((current) => {
        const next = { ...current };
        delete next[booking.id];
        return next;
      });
      fetchScheduleData(selectedDate);
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error(t('bookingSaveFailed'));
    } finally {
      setSavingBookingId(null);
    }
  };

  const handleForceConfirmBooking = async (booking: ScheduleBooking) => {
    setConfirmingBookingId(booking.id);

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', booking.id);

      if (error) {
        throw error;
      }

      toast.success(language === 'fi' ? 'Varaus vahvistettu' : 'Booking confirmed');
      fetchScheduleData(selectedDate);
    } catch (error) {
      console.error('Error force confirming booking:', error);
      toast.error(language === 'fi' ? 'Varauksen vahvistus epäonnistui' : 'Failed to confirm booking');
    } finally {
      setConfirmingBookingId(null);
    }
  };

  const handleOpenMessageComposer = (booking: ScheduleBooking) => {
    if (!booking.customer_email) {
      toast.error(t('noEmailNoSend'));
      return;
    }

    const messageLanguage = getBookingLanguage(booking);
    setEditingBookingId((current) => (current === booking.id ? null : current));
    setComposeMessageBookingId((current) => (current === booking.id ? null : booking.id));
    setBookingExpanded(booking.id, true);
    setMessageDrafts((current) => ({
      ...current,
      [booking.id]: current[booking.id] || {
        subject: messageLanguage === 'fi' ? 'Viesti varaukseesi liittyen' : 'Message regarding your booking',
        message: '',
      },
    }));
  };

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

  const openBookingFromList = (booking: ScheduleBooking) => {
    setSelectedDate(new Date(`${booking.booking_date}T12:00:00`));

    if ((booking.status || '').toLowerCase() === 'cancelled') {
      setArchivedBookingModal(booking);
      setEditingBookingId(null);
      setComposeMessageBookingId(null);
      setIsDrawerOpen(false);
      return;
    }

    setSelectedDate(new Date(`${booking.booking_date}T12:00:00`));
    setSelectedSlotTime(booking.booking_time);
    setExpandedBookingIds([booking.id]);
    setIsDrawerOpen(true);
  };

  const handleOpenSlotActionDialog = (slot: ScheduleTimeSlot, time: string) => {
    setSlotActionSlot(slot);
    setSlotActionTime(time);
    setBlockReason('');
    setIsSlotActionDialogOpen(true);
  };

  const handleStartCreateBookingFromSlotAction = () => {
    if (!slotActionTime) return;
    setSelectedSlot(slotActionSlot);
    setSelectedSlotTime(slotActionTime);
    setCreateBookingForm(buildBookingFormState(undefined, slotActionTime));
    setCreateBookingSelectedCategory('');
    setCreateBookingCurrentServiceId('');
    setCreateBookingServiceIds([]);
    setIsCreateFormOpen(true);
    setEditingBookingId(null);
    setComposeMessageBookingId(null);
    setIsSlotActionDialogOpen(false);
    setIsDrawerOpen(true);
  };

  const handleStartBatchBlockFromSlotAction = () => {
    if (!slotActionTime) return;
    setIsBatchBlockMode(true);
    setSelectedBlockTimes([slotActionTime]);
    setSelectedSlot(slotActionSlot);
    setSelectedSlotTime(slotActionTime);
    setIsSlotActionDialogOpen(false);
    toast.success(t('batchBlockActivated'));
  };

  const handleRestoreBooking = async (booking: ScheduleBooking, sendEmail: boolean) => {
    setRestoringBookingId(booking.id);
    try {
      const supabase = getSupabaseClient();
      const { error: restoreError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', booking.id);

      if (restoreError) throw restoreError;

      if (sendEmail && booking.customer_email) {
        const { error: emailError } = await supabase.functions.invoke('send_booking_confirmation', {
          method: 'POST',
          body: createBookingConfirmationPayload({
            ...booking,
            status: 'confirmed',
          }),
        });

        if (emailError) throw emailError;
      }

      toast.success(t('restoreSuccessful'));
      setRestoreArchivedBookingTarget(null);
      setArchivedBookingModal(null);
      setSendRestoreEmail(true);
      await refreshArchivedBookings();
      fetchScheduleData(selectedDate);
    } catch (error) {
      console.error('Error restoring booking:', error);
      toast.error(t('restoreFailed'));
    } finally {
      setRestoringBookingId(null);
    }
  };

  const handleDeleteArchivedBooking = async (booking: ScheduleBooking) => {
    setDeletingBookingId(booking.id);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('bookings').delete().eq('id', booking.id);
      if (error) throw error;

      toast.success(t('deleteSuccessful'));
      setArchivedBookingModal(null);
      setArchivedBookings((current) => current.filter((item) => item.id !== booking.id));
      setSearchResults((current) => current.filter((item) => item.id !== booking.id));
      fetchScheduleData(selectedDate);
    } catch (error) {
      console.error('Error deleting archived booking:', error);
      toast.error(t('deleteFailed'));
    } finally {
      setDeletingBookingId(null);
    }
  };

  const handleBookingMessageDraftChange = (
    bookingId: string,
    field: keyof BookingMessageDraft,
    value: string,
  ) => {
    setMessageDrafts((current) => ({
      ...current,
      [bookingId]: {
        ...(current[bookingId] || { subject: '', message: '' }),
        [field]: value,
      },
    }));
  };

  const handleSendBookingMessage = async (booking: ScheduleBooking) => {
    const draft = messageDrafts[booking.id];
    if (!booking.customer_email) {
      toast.error(t('noEmailNoSend'));
      return;
    }
    if (!draft?.subject.trim() || !draft?.message.trim()) {
      toast.error(t('messageRequired'));
      return;
    }

    setSendingMessageBookingId(booking.id);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.functions.invoke('send_booking_message', {
        method: 'POST',
        body: {
          bookingId: booking.id,
          customerName: booking.customer_name || '',
          customerEmail: booking.customer_email,
          licensePlate: booking.license_plate,
          bookingDate: booking.booking_date,
          bookingTime: booking.booking_time,
          serviceName: booking.service_name || 'Service',
          language: getBookingLanguage(booking),
          subject: draft.subject.trim(),
          message: draft.message.trim(),
        },
      });

      if (error) {
        throw error;
      }

      toast.success(t('adminMessageSent'));
      setComposeMessageBookingId(null);
      setMessageDrafts((current) => {
        const next = { ...current };
        delete next[booking.id];
        return next;
      });
    } catch (error) {
      console.error('Error sending booking message:', error);
      toast.error(t('adminMessageFailed'));
    } finally {
      setSendingMessageBookingId(null);
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
    if (isBatchBlockMode) {
      if (slot.bookings.length > 0) {
        toast.error(t('bookedSlotsNotManageable'));
        return;
      }

      handleBatchSlotToggle(time);
      return;
    }

    if (slot.bookings.length === 0) {
      handleOpenSlotActionDialog(slot, time);
      return;
    }

    setSelectedSlot(slot);
    setSelectedSlotTime(time);
    setIsCreateFormOpen(false);
    setEditingBookingId(null);
    setComposeMessageBookingId(null);
    setCreateBookingForm(buildBookingFormState(undefined, time));
    setCreateBookingSelectedCategory('');
    setCreateBookingCurrentServiceId('');
    setCreateBookingServiceIds([]);
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

  const formatGridDate = (date: Date) => {
    const weekday = date.toLocaleDateString(language === 'fi' ? 'fi-FI' : 'en-US', {
      weekday: 'short',
    });
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${weekday}, ${day}.${month}.${year}`;
  };

  const getTotalBookings = () => {
    return timeSlots.reduce((acc, slot) => acc + slot.bookings.length, 0);
  };

  const getTotalBlockedSlots = () => {
    return timeSlots.filter((slot) => slot.isBlocked).length;
  };

  const getManagedSlotIntent = (slot: ScheduleTimeSlot): 'block' | 'unblock' | 'none' => {
    if (slot.bookings.length > 0) return 'none';
    return slot.isBlocked ? 'unblock' : 'block';
  };

  const selectedManageIntents = timeSlots
    .filter((slot) => selectedBlockTimes.includes(slot.time))
    .map((slot) => getManagedSlotIntent(slot));
  const selectedManageIntentSet = new Set(selectedManageIntents);
  const hasBlockingSelections = selectedManageIntentSet.has('block');
  const hasUnblockingSelections = selectedManageIntentSet.has('unblock');

  let manageModeHint = t('selectionModeHint');
  if (hasUnblockingSelections && !hasBlockingSelections) {
    manageModeHint = language === 'fi'
      ? 'Klikkaa estettyjä aikoja poistaaksesi eston.'
      : 'Click blocked slots to remove the block.';
  }

  let manageActionLabel = t('blockSelectedSlots');
  let manageActionButtonClass = 'bg-[#E74C3C] hover:bg-[#E74C3C]/90 text-white';

  if (hasUnblockingSelections && !hasBlockingSelections) {
    manageActionLabel = language === 'fi' ? 'Poista esto' : 'Unblock';
    manageActionButtonClass = 'bg-emerald-600 hover:bg-emerald-700 text-white';
  } else if (hasBlockingSelections && hasUnblockingSelections) {
    manageActionLabel = language === 'fi' ? 'Tallenna muutokset' : 'Apply changes';
    manageActionButtonClass = 'bg-amber-600 hover:bg-amber-700 text-white';
  }

  const isSunday = selectedDate.getDay() === 0;
  const shellClass = theme === 'dark' ? 'border-white/10 bg-[#1C1C1E]' : 'border-gray-200 bg-white';
  const panelClass = theme === 'dark' ? 'border-white/10 bg-[#1A1A1C]' : 'border-gray-200 bg-white';
  const mutedPanelClass = theme === 'dark' ? 'border-white/10 bg-[#16181D]' : 'border-gray-200 bg-[#FAFAFA]';
  const titleClass = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const mutedTextClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const subtleTextClass = 'text-gray-500';
  const outlineButtonClass = theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : '';
  const inputSurfaceClass = theme === 'dark' ? 'border-white/10 bg-[#11141A] text-white' : 'bg-white';
  const createFormPanelClass = theme === 'dark' ? 'bg-[#252525] border-white/10' : 'bg-gray-50 border-gray-200';

  const openCreateBookingDrawer = () => {
    setSelectedSlot(null);
    setSelectedSlotTime('');
    setIsCreateFormOpen(true);
    setEditingBookingId(null);
    setComposeMessageBookingId(null);
    setCreateBookingForm(buildBookingFormState(undefined, ''));
    setCreateBookingSelectedCategory('');
    setCreateBookingCurrentServiceId('');
    setCreateBookingServiceIds([]);
    setIsDrawerOpen(true);
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

  const handleToggleCreateFormForSelectedSlot = () => {
    setIsCreateFormOpen((current) => !current);
    setEditingBookingId(null);
    setComposeMessageBookingId(null);
    setCreateBookingForm(buildBookingFormState(undefined, selectedSlotTime));
  };

  return (
    <div className={`rounded-lg border ${shellClass}`}>
      <div className="grid gap-0 xl:grid-cols-[340px_minmax(0,1fr)]">
        <AdminScheduleSidebar
          blockReason={blockReason}
          formatDate={formatDate}
          applyManageSlotsButtonClass={manageActionButtonClass}
          applyManageSlotsLabel={manageActionLabel}
          applyManageSlotsDisabled={selectedBlockTimes.length === 0}
          isBatchBlockMode={isBatchBlockMode}
          isSunday={isSunday}
          language={language}
          manageModeHasBlockingSelection={hasBlockingSelections}
          manageModeHint={manageModeHint}
          mutedPanelClass={mutedPanelClass}
          mutedTextClass={mutedTextClass}
          outlineButtonClass={outlineButtonClass}
          onApplyManageSlots={handleBlockSelectedSlots}
          onLogout={onLogout}
          panelClass={panelClass}
          selectedBlockTimes={selectedBlockTimes}
          selectedDate={selectedDate}
          setBlockReason={setBlockReason}
          setIsBatchBlockMode={setIsBatchBlockMode}
          setSelectedBlockTimes={setSelectedBlockTimes}
          setSelectedDate={setSelectedDate}
          t={t}
          theme={theme}
          titleClass={titleClass}
        />

        <section className="space-y-4 p-4">
          <AdminScheduleBookingPanel
            activeBookingsTab={activeBookingsTab}
            formatBookingGroupLabel={formatBookingGroupLabel}
            getBookingServiceNameForCms={getBookingServiceNameForCms}
            reservationBookingGroups={reservationDisplayGroups}
            inputSurfaceClass={inputSurfaceClass}
            language={language}
            mutedTextClass={mutedTextClass}
            onBookingsTabChange={handleBookingsTabChange}
            onCreateBooking={openCreateBookingDrawer}
            onOpenBooking={openBookingFromList}
            onOpenSearchDialog={() => setIsSearchDialogOpen(true)}
            onToggleArchivedBookings={(checked) => {
              setShowArchivedBookings(checked);
              setShowArchivedInline(checked);
              if (checked && archivedBookings.length === 0) {
                void loadArchivedBookings();
              }
            }}
            onToggleArchivedInline={(checked) => {
              setShowArchivedInline(checked);
              if (checked && archivedBookings.length === 0) {
                void loadArchivedBookings();
              }
            }}
            outlineButtonClass={outlineButtonClass}
            panelClass={panelClass}
            searchQuery={searchQuery}
            showArchivedInline={showArchivedInline}
            showArchivedBookings={showArchivedBookings}
            subtleTextClass={subtleTextClass}
            t={t}
            theme={theme}
            titleClass={titleClass}
          />

          {activeBookingsTab === 'schedule' && (
            <AdminScheduleGrid
              handleSlotClick={handleSlotClick}
              isBatchBlockMode={isBatchBlockMode}
              isSunday={isSunday}
              loading={loading}
              managedSlotIntent={getManagedSlotIntent}
              mutedTextClass={mutedTextClass}
              panelClass={panelClass}
              selectedDateLabel={formatGridDate(selectedDate)}
              selectedBlockTimes={selectedBlockTimes}
              t={t}
              theme={theme}
              timeSlots={timeSlots}
              titleClass={titleClass}
            />
          )}
        </section>
      </div>

      <AdminScheduleSearchDialog
        getBookingServiceNameForCms={getBookingServiceNameForCms}
        inputSurfaceClass={inputSurfaceClass}
        isOpen={isSearchDialogOpen}
        isSearchingBookings={isSearchingBookings}
        mutedPanelClass={mutedPanelClass}
        mutedTextClass={mutedTextClass}
        onOpenBooking={openBookingFromList}
        onOpenChange={setIsSearchDialogOpen}
        onSearch={handleSearchBookings}
        searchQuery={searchQuery}
        searchResults={searchResults}
        setSearchQuery={setSearchQuery}
        subtleTextClass={subtleTextClass}
        t={t}
        theme={theme}
        titleClass={titleClass}
      />

      <AdminScheduleDrawer
        cancellingBookingId={cancellingBookingId}
        composeMessageBookingId={composeMessageBookingId}
        confirmingBookingId={confirmingBookingId}
        createBookingCurrentServiceId={createBookingCurrentServiceId}
        createBookingForm={createBookingForm}
        createBookingSelectedCategory={createBookingSelectedCategory}
        createBookingServiceIds={createBookingServiceIds}
        editBookingCurrentServiceId={editBookingCurrentServiceId}
        editBookingForms={editBookingForms}
        editBookingSelectedCategory={editBookingSelectedCategory}
        editBookingServiceIds={editBookingServiceIds}
        editingBookingId={editingBookingId}
        getBookingServiceNameForCms={getBookingServiceNameForCms}
        getSelectedServiceNames={getSelectedServiceNames}
        handleBookingMessageDraftChange={handleBookingMessageDraftChange}
        handleCreateBooking={handleCreateBooking}
        handleEditBookingFieldChange={handleEditBookingFieldChange}
        handleForceConfirmBooking={handleForceConfirmBooking}
        handleOpenCancelBookingDialog={handleOpenCancelBookingDialog}
        handleOpenMessageComposer={handleOpenMessageComposer}
        handleResendBookingConfirmation={handleResendBookingConfirmation}
        handleSaveBookingChanges={handleSaveBookingChanges}
        handleSendBookingMessage={handleSendBookingMessage}
        handleStartEditingBooking={handleStartEditingBooking}
        isBookingExpanded={isBookingExpanded}
        isCreateFormOpen={isCreateFormOpen}
        isCreatingBooking={isCreatingBooking}
        isOpen={isDrawerOpen}
        language={language}
        messageDrafts={messageDrafts}
        onCloseCreateForm={() => setIsCreateFormOpen(false)}
        onOpenChange={setIsDrawerOpen}
        onToggleCreateFormForSelectedSlot={handleToggleCreateFormForSelectedSlot}
        panelSurfaceClass={createFormPanelClass}
        resendCounts={resendCounts}
        resendingBookingId={resendingBookingId}
        savingBookingId={savingBookingId}
        selectedDate={selectedDate}
        selectedLanguageServiceCategories={selectedLanguageServiceCategories}
        selectedSlot={selectedSlot}
        selectedSlotTime={selectedSlotTime}
        sendingMessageBookingId={sendingMessageBookingId}
        setBookingExpanded={setBookingExpanded}
        setComposeMessageBookingId={setComposeMessageBookingId}
        setCreateBookingCurrentServiceId={setCreateBookingCurrentServiceId}
        setCreateBookingForm={setCreateBookingForm}
        setCreateBookingSelectedCategory={setCreateBookingSelectedCategory}
        setCreateBookingServiceIds={setCreateBookingServiceIds}
        setEditBookingCurrentServiceId={setEditBookingCurrentServiceId}
        setEditBookingSelectedCategory={setEditBookingSelectedCategory}
        setEditBookingServiceIds={setEditBookingServiceIds}
        setEditingBookingId={setEditingBookingId}
        syncCreateBookingServiceName={syncCreateBookingServiceName}
        syncEditBookingServiceName={syncEditBookingServiceName}
        t={t}
        theme={theme}
      />

      <Dialog open={isSlotActionDialogOpen} onOpenChange={setIsSlotActionDialogOpen}>
        <DialogContent className={theme === 'dark' ? 'border-white/10 bg-[#16181D] text-white' : ''}>
          <DialogHeader>
            <DialogTitle>{t('slotActions')}</DialogTitle>
            <DialogDescription className={theme === 'dark' ? 'text-gray-400' : ''}>
              {t('slotActionsDescription')}
            </DialogDescription>
          </DialogHeader>

          {slotActionTime && (
            <div className="space-y-4">
              <div className={`rounded-xl border p-4 ${theme === 'dark' ? 'border-white/10 bg-[#1C1C1E]' : 'border-gray-200 bg-gray-50'}`}>
                <p className={`text-xs uppercase tracking-[0.08em] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                  {t('slotSummary')}
                </p>
                <p className={`mt-2 text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {formatDate(selectedDate)} — {slotActionTime}
                </p>
                {slotActionSlot?.isBlocked && (
                  <p className="mt-2 text-sm text-red-500">{slotActionSlot.blockReason || t('slotBlocked')}</p>
                )}
              </div>

              {!slotActionSlot?.isBlocked && (
                <div className="space-y-2">
                  <label className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('reasonOptional')}
                  </label>
                  <Textarea
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder={language === 'fi' ? 'Esim. Huoltokatko' : 'e.g. Maintenance'}
                    className={theme === 'dark' ? 'bg-[#11141A] border-white/10 text-white' : ''}
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="sm:grid sm:grid-cols-3">
            <Button variant="outline" onClick={handleStartCreateBookingFromSlotAction} className={theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : ''}>
              <PlusCircle className="w-4 h-4 mr-2" />
              {t('createInThisSlot')}
            </Button>
            <Button
              onClick={() => {
                if (slotActionTime) {
                  void handleBlockSlot(slotActionTime, false);
                  setIsSlotActionDialogOpen(false);
                }
              }}
              disabled={Boolean(slotActionSlot?.isBlocked)}
              className="bg-[#FF6B35] hover:bg-[#FF6B35]/90"
            >
              <Lock className="w-4 h-4 mr-2" />
              {t('blockThisSlot')}
            </Button>
            <Button variant="outline" onClick={handleStartBatchBlockFromSlotAction} className={theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : ''}>
              <CheckSquare className="w-4 h-4 mr-2" />
              {t('blockMultipleTimeSlots')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(archivedBookingModal)} onOpenChange={(open) => !open && setArchivedBookingModal(null)}>
        <DialogContent className={`max-w-3xl ${theme === 'dark' ? 'border-white/10 bg-[#16181D] text-white' : ''}`}>
          <DialogHeader>
            <DialogTitle>{t('archivedBookingDetails')}</DialogTitle>
            <DialogDescription className={theme === 'dark' ? 'text-gray-400' : ''}>
              {archivedBookingModal ? `${archivedBookingModal.booking_date} ${archivedBookingModal.booking_time}` : ''}
            </DialogDescription>
          </DialogHeader>

          {archivedBookingModal && (
            <div className="space-y-5">
              <div className={`rounded-xl border p-4 ${theme === 'dark' ? 'border-white/10 bg-[#1C1C1E]' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`font-mono text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {archivedBookingModal.license_plate}
                  </span>
                  <Badge variant="destructive">{archivedBookingModal.status || 'cancelled'}</Badge>
                </div>
                <p className={`mt-3 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {getBookingServiceNameForCms(archivedBookingModal.service_name)}
                </p>
              </div>

              <dl className="grid gap-3 sm:grid-cols-2">
                <div className={`rounded-md border p-4 ${theme === 'dark' ? 'border-white/10 bg-[#15171C]' : 'border-gray-200 bg-white'}`}>
                  <dt className={`text-xs uppercase tracking-[0.08em] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{t('customerName')}</dt>
                  <dd className={`mt-2 text-base font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{archivedBookingModal.customer_name || '—'}</dd>
                </div>
                <div className={`rounded-md border p-4 ${theme === 'dark' ? 'border-white/10 bg-[#15171C]' : 'border-gray-200 bg-white'}`}>
                  <dt className={`text-xs uppercase tracking-[0.08em] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{t('customerPhone')}</dt>
                  <dd className={`mt-2 text-base font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{archivedBookingModal.customer_phone || '—'}</dd>
                </div>
                <div className={`rounded-md border p-4 sm:col-span-2 ${theme === 'dark' ? 'border-white/10 bg-[#15171C]' : 'border-gray-200 bg-white'}`}>
                  <dt className={`text-xs uppercase tracking-[0.08em] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{t('customerEmail')}</dt>
                  <dd className={`mt-2 break-all text-base font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{archivedBookingModal.customer_email || '—'}</dd>
                </div>
                <div className={`rounded-md border p-4 sm:col-span-2 ${theme === 'dark' ? 'border-white/10 bg-[#15171C]' : 'border-gray-200 bg-white'}`}>
                  <dt className={`text-xs uppercase tracking-[0.08em] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{t('notes')}</dt>
                  <dd className={`mt-2 text-base ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{archivedBookingModal.notes || t('noNotes')}</dd>
                </div>
              </dl>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => handleStartEditingBooking(archivedBookingModal)} className={theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : ''}>
                  <Pencil className="w-4 h-4 mr-2" />
                  {t('editBooking')}
                </Button>
                <Button onClick={() => {
                  setSendRestoreEmail(true);
                  setRestoreArchivedBookingTarget(archivedBookingModal);
                }} className="bg-emerald-600 hover:bg-emerald-700">
                  {t('restoreBooking')}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    const confirmed = window.confirm(t('deleteBookingConfirmDescription'));
                    if (confirmed) void handleDeleteArchivedBooking(archivedBookingModal);
                  }}
                  disabled={deletingBookingId === archivedBookingModal.id}
                >
                  {deletingBookingId === archivedBookingModal.id ? t('deleting') : t('deleteBookingPermanently')}
                </Button>
              </div>

              {editingBookingId === archivedBookingModal.id && editBookingForms[archivedBookingModal.id] && (
                <div className={`rounded-md border p-4 ${theme === 'dark' ? 'border-white/10 bg-[#18181B]' : 'border-gray-200 bg-white'}`}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h4 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('editBooking')}</h4>
                    <Button size="sm" variant="ghost" onClick={() => setEditingBookingId(null)}>{t('cancelEditing')}</Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('licensePlate')}</label>
                      <Input value={editBookingForms[archivedBookingModal.id].license_plate} onChange={(e) => handleEditBookingFieldChange(archivedBookingModal.id, 'license_plate', e.target.value.toUpperCase())} />
                    </div>
                    <div className="space-y-2">
                      <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('customerName')}</label>
                      <Input value={editBookingForms[archivedBookingModal.id].customer_name} onChange={(e) => handleEditBookingFieldChange(archivedBookingModal.id, 'customer_name', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('date')}</label>
                      <Input type="date" value={editBookingForms[archivedBookingModal.id].booking_date} onChange={(e) => handleEditBookingFieldChange(archivedBookingModal.id, 'booking_date', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('time')}</label>
                      <Input type="time" value={editBookingForms[archivedBookingModal.id].booking_time} onChange={(e) => handleEditBookingFieldChange(archivedBookingModal.id, 'booking_time', e.target.value)} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('customerEmail')}</label>
                      <Input type="email" value={editBookingForms[archivedBookingModal.id].customer_email} onChange={(e) => handleEditBookingFieldChange(archivedBookingModal.id, 'customer_email', e.target.value)} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('notes')}</label>
                      <Textarea value={editBookingForms[archivedBookingModal.id].notes} onChange={(e) => handleEditBookingFieldChange(archivedBookingModal.id, 'notes', e.target.value)} rows={3} className={theme === 'dark' ? 'bg-[#11141A] border-white/10 text-white' : ''} />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button onClick={() => void handleSaveBookingChanges(archivedBookingModal)} disabled={savingBookingId === archivedBookingModal.id} className="bg-[#FF6B35] hover:bg-[#FF6B35]/90">
                      <Save className="w-4 h-4 mr-2" />
                      {savingBookingId === archivedBookingModal.id ? t('saving') : t('saveChanges')}
                    </Button>
                    <Button variant="outline" onClick={() => setEditingBookingId(null)}>{t('cancel')}</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(cancelBookingTarget)}
        onOpenChange={(open) => {
          if (!open && cancellingBookingId !== cancelBookingTarget?.id) {
            setCancelBookingTarget(null);
            setCancelBookingNote('');
          }
        }}
      >
        <AlertDialogContent className={theme === 'dark' ? 'border-white/10 bg-[#16181D] text-white' : ''}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('cancelBookingConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription className={theme === 'dark' ? 'text-gray-400' : ''}>
              {t('cancelBookingConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {cancelBookingTarget && (
            <div className="space-y-4">
              <div className={`rounded-xl border p-3 ${theme === 'dark' ? 'border-white/10 bg-[#1C1C1E]' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`font-mono text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {cancelBookingTarget.license_plate}
                  </span>
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {cancelBookingTarget.booking_date} {cancelBookingTarget.booking_time}
                  </span>
                </div>
                {cancelBookingTarget.service_name && (
                  <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {getBookingServiceNameForCms(cancelBookingTarget.service_name)}
                  </p>
                )}
                {cancelBookingTarget.customer_name && (
                  <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {cancelBookingTarget.customer_name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('cancellationNote')}
                </label>
                <Textarea
                  value={cancelBookingNote}
                  onChange={(e) => setCancelBookingNote(e.target.value)}
                  placeholder={t('cancellationNotePlaceholder')}
                  className={theme === 'dark' ? 'bg-[#11141A] border-white/10 text-white' : ''}
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
                if (cancelBookingTarget) {
                  void handleCancelBooking(cancelBookingTarget);
                }
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {cancellingBookingId ? t('cancelling') : t('confirmCancelBooking')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(restoreArchivedBookingTarget)} onOpenChange={(open) => !open && setRestoreArchivedBookingTarget(null)}>
        <AlertDialogContent className={theme === 'dark' ? 'border-white/10 bg-[#16181D] text-white' : ''}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('restoreBookingConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription className={theme === 'dark' ? 'text-gray-400' : ''}>
              {t('restoreBookingConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-start gap-3">
            <Checkbox checked={sendRestoreEmail} onCheckedChange={(checked) => setSendRestoreEmail(Boolean(checked))} />
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
                if (restoreArchivedBookingTarget) {
                  void handleRestoreBooking(restoreArchivedBookingTarget, sendRestoreEmail);
                }
              }}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {restoringBookingId ? t('saving') : t('restoreBooking')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
