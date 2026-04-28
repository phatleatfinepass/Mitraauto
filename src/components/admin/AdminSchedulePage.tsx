import React, { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';
import { useLanguage } from '../LanguageContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
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
import { Textarea } from '../ui/textarea';
import { getSupabaseClient } from '../../utils/supabase/client';
import { formatDateForSupabase } from '../../utils/date';
import { buildScheduleTimeSlots, ScheduleBlockedSlot, ScheduleBooking, ScheduleTimeSlot } from '../../utils/schedule';
import {
  getLocalizedServiceCategories,
  localizeStoredServiceName,
  SupportedBookingLanguage,
} from '../../utils/serviceCatalog';
import { toast } from 'sonner';
import { AdminScheduleBookingPanel } from './schedule/AdminScheduleBookingPanel';
import { AdminArchivedBookingDialog } from './schedule/AdminArchivedBookingDialog';
import { AdminScheduleDrawer } from './schedule/AdminScheduleDrawer';
import { AdminScheduleGrid } from './schedule/AdminScheduleGrid';
import { AdminScheduleSearchDialog } from './schedule/AdminScheduleSearchDialog';
import { AdminScheduleSidebar } from './schedule/AdminScheduleSidebar';
import { buildCustomerCompletionDraft, getMissingCompletionFields } from './bookingCompletion';
import { BookingCommunicationModal } from './communication/BookingCommunicationModal';
import { useBookingConversation } from './communication/useBookingConversation';
import { useBookingEditorState } from './schedule/useBookingEditorState';
import { useBookingReservationState } from './schedule/useBookingReservationState';

interface AdminSchedulePageProps {
  onLogout?: () => void;
}

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

function AdminCancelBookingDialog({
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

function AdminRestoreBookingDialog({
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
  const [resendCounts, setResendCounts] = useState<Record<string, number>>({});
  const [confirmingBookingId, setConfirmingBookingId] = useState<string | null>(null);
  const [expandedBookingIds, setExpandedBookingIds] = useState<string[]>([]);
  const [archivedBookingModal, setArchivedBookingModal] = useState<ScheduleBooking | null>(null);
  const [restoreArchivedBookingTarget, setRestoreArchivedBookingTarget] = useState<ScheduleBooking | null>(null);
  const [sendRestoreEmail, setSendRestoreEmail] = useState(true);
  const [restoringBookingId, setRestoringBookingId] = useState<string | null>(null);
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null);

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
      selectSlotsToBlock: { fi: 'Estä', en: 'Block' },
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
      bookingConfirmationEmailSent: { fi: 'Vahvistusviesti lähetetty asiakkaalle', en: 'Confirmation email sent to customer' },
      bookingUpdateEmailSent: { fi: 'Päivitysviesti lähetetty asiakkaalle', en: 'Update email sent to customer' },
      bookingSaveFailed: { fi: 'Varauksen tallennus epäonnistui', en: 'Failed to save booking' },
      bookingControls: { fi: 'Varauksen hallinta', en: 'Booking controls' },
      bookingControlsDescription: { fi: 'Lähetä vahvistus uudelleen, muokkaa varausta tai viesti asiakkaalle tästä varauksesta.', en: 'Resend confirmation, edit this booking, or contact the customer about this booking.' },
      awaitingCustomerCompletion: { fi: 'Odottaa asiakkaan täydennystä', en: 'Awaiting customer completion' },
      partialBooking: { fi: 'Osittainen varaus', en: 'Partial booking' },
      requestCompletion: { fi: 'Pyydä täydennystä', en: 'Request completion' },
      completionRequestSent: { fi: 'Täydennyspyyntö lähetetty asiakkaalle', en: 'Completion request sent to customer' },
      completionRequestFailed: { fi: 'Täydennyspyynnön lähetys epäonnistui', en: 'Failed to send completion request' },
      completionMode: { fi: 'Täydennyspyyntö', en: 'Completion request' },
      completionModeDescription: { fi: 'Tallenna varaus vaikka kaikki asiakastiedot eivät vielä ole valmiit. Asiakas voi täydentää puuttuvat tiedot myöhemmin.', en: 'Save the booking even if not all customer details are known yet. The customer can complete the missing details later.' },
      incompleteBookingWarning: { fi: 'Puuttuvia tietoja', en: 'Missing details' },
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
      conversationHistory: { fi: 'Viestiketju', en: 'Conversation history' },
      conversationLoading: { fi: 'Ladataan viestiketjua...', en: 'Loading conversation...' },
      conversationLoadFailed: { fi: 'Viestiketjun lataus epäonnistui', en: 'Failed to load conversation' },
      conversationEmpty: { fi: 'Tälle varaukselle ei ole vielä viestihistoriaa.', en: 'No conversation history exists for this booking yet.' },
      sentLabel: { fi: 'Lähetetty', en: 'Sent' },
      receivedLabel: { fi: 'Vastaanotettu', en: 'Received' },
      syncConversation: { fi: 'Synkronoi', en: 'Sync' },
      syncingConversation: { fi: 'Synkronoidaan...', en: 'Syncing...' },
      replyToMessage: { fi: 'Vastaa viestiin', en: 'Reply to message' },
      threadConnected: { fi: 'Ketju yhdistetty', en: 'Thread connected' },
      noThreadYet: { fi: 'Ei aktiivista ketjua vielä', en: 'No active thread yet' },
      lastSyncedLabel: { fi: 'Synkronoitu', en: 'Last synced' },
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

  const {
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
  } = useBookingReservationState({
    language,
    t,
    timelineBookings,
  });

  const getBookingLanguage = (booking: ScheduleBooking): SupportedBookingLanguage =>
    booking.booking_language === 'en' ? 'en' : 'fi';

  const getBookingServiceNameForCms = (serviceName?: string | null) =>
    localizeStoredServiceName(serviceName, language);

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

  const {
    bookingConversations,
    clearConversationComposerState,
    composeMessageBookingId,
    handleBookingMessageDraftChange,
    handleOpenMessageComposer: rawHandleOpenMessageComposer,
    handleSendBookingMessage,
    handleSyncBookingConversation,
    handleToggleBookingExpanded,
    loadBookingConversation,
    loadingConversationBookingId,
    messageDrafts,
    refreshBookingConversationIfLoaded,
    sendingMessageBookingId,
    setComposeMessageBookingId,
  } = useBookingConversation({
    buildCustomerCompletionDraft: (booking) => buildCustomerCompletionDraft(booking, language),
    getBookingLanguage,
    language,
    setBookingExpanded,
    t,
  });

  const {
    buildCompletionEmailPayload,
    closeCreateBookingForm,
    createBookingCurrentServiceId,
    createBookingForm,
    createBookingSelectedCategory,
    createBookingServiceIds,
    editBookingCurrentServiceId,
    editBookingForms,
    editBookingSelectedCategory,
    editBookingServiceIds,
    editingBookingId,
    handleCreateBooking,
    handleEditBookingFieldChange,
    handleSaveBookingChanges,
    handleStartEditingBooking: rawHandleStartEditingBooking,
    isBookingAwaitingCustomerCompletion,
    isCreateFormOpen,
    isCreatingBooking,
    openCreateBookingForm,
    resetBookingEditorState,
    resetCreateBookingForm,
    savingBookingId,
    setCreateBookingCurrentServiceId,
    setCreateBookingForm,
    setCreateBookingSelectedCategory,
    setCreateBookingServiceIds,
    setEditBookingCurrentServiceId,
    setEditingBookingId,
    setEditBookingSelectedCategory,
    setEditBookingServiceIds,
    syncCreateBookingServiceName: syncCreateBookingServiceNameInternal,
    syncEditBookingServiceName: syncEditBookingServiceNameInternal,
    toggleCreateBookingForm,
  } = useBookingEditorState({
    createBookingConfirmationPayload,
    fetchScheduleData,
    getBookingLanguage,
    language,
    refreshBookingConversationIfLoaded,
    selectedDate,
    selectedSlotTime,
    setBookingExpanded,
    t,
  });

  useEffect(() => {
    setSelectedBlockTimes([]);
    setIsBatchBlockMode(false);
    setCancelBookingTarget(null);
    setCancelBookingNote('');
    clearConversationComposerState();
    resetBookingEditorState('');
    fetchScheduleData(selectedDate);
  }, [clearConversationComposerState, resetBookingEditorState, selectedDate]);

  const syncCreateBookingServiceName = (serviceIds: string[], selectedLanguage: SupportedBookingLanguage) =>
    syncCreateBookingServiceNameInternal(serviceIds, selectedLanguage, getSelectedServiceNames);

  const syncEditBookingServiceName = (
    bookingId: string,
    serviceIds: string[],
    selectedLanguage: SupportedBookingLanguage,
  ) => syncEditBookingServiceNameInternal(bookingId, serviceIds, selectedLanguage, getSelectedServiceNames);

  const handleOpenMessageComposer = (booking: ScheduleBooking, replyTo?: Parameters<typeof rawHandleOpenMessageComposer>[1]) => {
    setEditingBookingId((current) => (current === booking.id ? null : current));
    rawHandleOpenMessageComposer(booking, replyTo);
  };

  const handleStartEditingBooking = (booking: ScheduleBooking) => {
    setComposeMessageBookingId((current) => (current === booking.id ? null : current));
    rawHandleStartEditingBooking(booking);
  };

  const handleOpenCreateBookingForm = (fallbackTime = '') => {
    setComposeMessageBookingId(null);
    openCreateBookingForm(fallbackTime);
  };

  const handleToggleCreateBookingForm = (fallbackTime = '') => {
    setComposeMessageBookingId(null);
    toggleCreateBookingForm(fallbackTime);
  };

  const activeCommunicationBooking =
    bookings.find((booking) => booking.id === composeMessageBookingId) ||
    timelineBookings.find((booking) => booking.id === composeMessageBookingId) ||
    null;

  const sendCustomerCompletionRequest = async (booking: ScheduleBooking) => {
    if (!booking.customer_email) {
      toast.error(t('noEmailAddress'));
      return false;
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase.functions.invoke('send_booking_message', {
      method: 'POST',
      body: buildCompletionEmailPayload(booking),
    });

    if (error) {
      throw error;
    }

    return true;
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
    setResendingBookingId(booking.id);
    try {
      const needsCompletion = isBookingAwaitingCustomerCompletion(booking);

      if (needsCompletion) {
        const sent = await sendCustomerCompletionRequest(booking);
        if (!sent) {
          return;
        }
        setResendCounts((current) => ({
          ...current,
          [booking.id]: (current[booking.id] || 0) + 1,
        }));
        await refreshBookingConversationIfLoaded(booking.id);
        toast.success(t('completionRequestSent'));
      } else {
        if (!booking.customer_email) {
          toast.error(t('noEmailAddress'));
          return;
        }

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

        await refreshBookingConversationIfLoaded(booking.id);
        toast.success(t('resendSuccessful'));
      }
    } catch (error) {
      console.error('Error resending booking confirmation:', error);
      toast.error(isBookingAwaitingCustomerCompletion(booking) ? t('completionRequestFailed') : t('resendFailed'));
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
      let emailFailureMessage: string | null = null;

      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', booking.id);

      if (updateError) {
        throw updateError;
      }
      const cancellationNote = cancelBookingNote;

      if (booking.customer_email) {
        try {
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

          await refreshBookingConversationIfLoaded(booking.id);
          toast.success(t('cancellationEmailSent'));
        } catch (emailError) {
          console.error('Booking cancelled but cancellation email failed:', emailError);
          emailFailureMessage = language === 'fi'
            ? 'Varaus peruttiin, mutta asiakkaan peruutusviestiä ei voitu lähettää.'
            : 'The booking was cancelled, but the customer cancellation email could not be sent.';
        }
      }

      toast.success(t('cancelSuccessful'));
      setCancelBookingTarget(null);
      setCancelBookingNote('');
      setIsDrawerOpen(false);
      await Promise.resolve(fetchScheduleData(selectedDate));
      if (emailFailureMessage) {
        toast(emailFailureMessage);
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(t('cancelFailed'));
    } finally {
      setCancellingBookingId(null);
    }
  };

  const handleForceConfirmBooking = async (booking: ScheduleBooking) => {
    if (isBookingAwaitingCustomerCompletion(booking)) {
      toast.error(language === 'fi' ? 'Täydennä puuttuvat tiedot ennen vahvistusta' : 'Complete the missing details before confirming');
      return;
    }

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
        await refreshBookingConversationIfLoaded(booking.id);
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

    setSelectedSlot(slot);
    setSelectedSlotTime(time);
    closeCreateBookingForm();
    setEditingBookingId(null);
    setComposeMessageBookingId(null);
    resetCreateBookingForm(time);
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

  const startManageSlots = () => {
    setIsBatchBlockMode(true);
    setSelectedBlockTimes([]);
    setBlockReason('');
  };

  const cancelManageSlots = () => {
    setIsBatchBlockMode(false);
    setSelectedBlockTimes([]);
    setBlockReason('');
  };

  const openCreateBookingDrawer = () => {
    setSelectedSlot(null);
    setSelectedSlotTime('');
    handleOpenCreateBookingForm('');
    setIsDrawerOpen(true);
  };

  const handleToggleCreateFormForSelectedSlot = () => {
    handleToggleCreateBookingForm(selectedSlotTime);
  };

  return (
    <div className={`rounded-lg border ${shellClass}`}>
      <div className="grid gap-0 xl:grid-cols-[340px_minmax(0,1fr)]">
        <AdminScheduleSidebar
          formatDate={formatDate}
          isSunday={isSunday}
          language={language}
          mutedPanelClass={mutedPanelClass}
          mutedTextClass={mutedTextClass}
          outlineButtonClass={outlineButtonClass}
          onLogout={onLogout}
          panelClass={panelClass}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          t={t}
          theme={theme}
          titleClass={titleClass}
        />

        <section className="space-y-4 p-4">
          <AdminScheduleBookingPanel
            activeBookingsTab={activeBookingsTab}
            applyManageSlotsButtonClass={manageActionButtonClass}
            applyManageSlotsDisabled={selectedBlockTimes.length === 0}
            applyManageSlotsLabel={manageActionLabel}
            blockReason={blockReason}
            formatBookingGroupLabel={formatBookingGroupLabel}
            getBookingServiceNameForCms={getBookingServiceNameForCms}
            reservationBookingGroups={reservationDisplayGroups}
            inputSurfaceClass={inputSurfaceClass}
            isBatchBlockMode={isBatchBlockMode}
            language={language}
            manageModeHasBlockingSelection={hasBlockingSelections}
            manageModeHint={manageModeHint}
            mutedTextClass={mutedTextClass}
            onApplyManageSlots={handleBlockSelectedSlots}
            onBookingsTabChange={handleBookingsTabChange}
            onCancelManageSlots={cancelManageSlots}
            onCreateBooking={openCreateBookingDrawer}
            onOpenBooking={openBookingFromList}
            onOpenSearchDialog={() => setIsSearchDialogOpen(true)}
            onStartManageSlots={startManageSlots}
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
            setBlockReason={setBlockReason}
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
        handleCreateBooking={handleCreateBooking}
        handleEditBookingFieldChange={handleEditBookingFieldChange}
        handleForceConfirmBooking={handleForceConfirmBooking}
        handleOpenCancelBookingDialog={handleOpenCancelBookingDialog}
        handleOpenMessageComposer={handleOpenMessageComposer}
        handleResendBookingConfirmation={handleResendBookingConfirmation}
        handleSaveBookingChanges={handleSaveBookingChanges}
        handleStartEditingBooking={handleStartEditingBooking}
        handleToggleBookingExpanded={handleToggleBookingExpanded}
        isBookingExpanded={isBookingExpanded}
        isCreateFormOpen={isCreateFormOpen}
        isCreatingBooking={isCreatingBooking}
        isOpen={isDrawerOpen}
        language={language}
        onCloseCreateForm={closeCreateBookingForm}
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

      <BookingCommunicationModal
        booking={activeCommunicationBooking}
        conversation={activeCommunicationBooking ? bookingConversations[activeCommunicationBooking.id] : undefined}
        isLoadingConversation={activeCommunicationBooking ? loadingConversationBookingId === activeCommunicationBooking.id : false}
        language={language}
        messageDraft={activeCommunicationBooking ? messageDrafts[activeCommunicationBooking.id] : undefined}
        open={Boolean(composeMessageBookingId)}
        sending={activeCommunicationBooking ? sendingMessageBookingId === activeCommunicationBooking.id : false}
        theme={theme}
        t={t}
        onDraftChange={handleBookingMessageDraftChange}
        onOpenChange={(open) => {
          if (!open) setComposeMessageBookingId(null);
        }}
        onReply={handleOpenMessageComposer}
        onSend={handleSendBookingMessage}
        onSync={(bookingId) => void handleSyncBookingConversation(bookingId)}
      />

      <AdminArchivedBookingDialog
        archivedBookingModal={archivedBookingModal}
        deletingBookingId={deletingBookingId}
        editBookingForms={editBookingForms}
        editingBookingId={editingBookingId}
        getBookingServiceNameForCms={getBookingServiceNameForCms}
        handleDeleteArchivedBooking={handleDeleteArchivedBooking}
        handleEditBookingFieldChange={handleEditBookingFieldChange}
        handleSaveBookingChanges={handleSaveBookingChanges}
        handleStartEditingBooking={handleStartEditingBooking}
        onOpenChange={(open) => !open && setArchivedBookingModal(null)}
        onRequestRestore={(booking) => {
          setSendRestoreEmail(true);
          setRestoreArchivedBookingTarget(booking);
        }}
        savingBookingId={savingBookingId}
        setEditingBookingId={setEditingBookingId}
        t={t}
        theme={theme}
      />

      <AdminCancelBookingDialog
        booking={cancelBookingTarget}
        cancellingBookingId={cancellingBookingId}
        cancellationNote={cancelBookingNote}
        getBookingServiceNameForCms={getBookingServiceNameForCms}
        onCancellationNoteChange={setCancelBookingNote}
        onConfirm={(booking) => {
          void handleCancelBooking(booking);
        }}
        onOpenChange={(open) => {
          if (!open && cancellingBookingId !== cancelBookingTarget?.id) {
            setCancelBookingTarget(null);
            setCancelBookingNote('');
          }
        }}
        t={t}
        theme={theme}
      />

      <AdminRestoreBookingDialog
        booking={restoreArchivedBookingTarget}
        restoringBookingId={restoringBookingId}
        sendRestoreEmail={sendRestoreEmail}
        onConfirm={(booking) => {
          void handleRestoreBooking(booking, sendRestoreEmail);
        }}
        onOpenChange={(open) => {
          if (!open) setRestoreArchivedBookingTarget(null);
        }}
        onSendRestoreEmailChange={setSendRestoreEmail}
        t={t}
        theme={theme}
      />
    </div>
  );
};
