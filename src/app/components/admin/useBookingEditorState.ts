import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { formatDateForSupabase } from '../../utils/date';
import {
  detectStoredServiceLanguage,
  getServiceIdsFromStoredServiceName,
  SupportedBookingLanguage,
} from '../../utils/serviceCatalog';
import type { ScheduleBooking } from '../../utils/schedule';
import { getSupabaseClient } from '../../utils/supabase/client';
import type { AdminBookingFormState } from './AdminSchedule.types';
import {
  awaitingCustomerCompletionStatus,
  buildCustomerCompletionDraft,
  getMissingCompletionFields,
  isBookingAwaitingCustomerCompletion,
} from './bookingCompletion';

interface UseBookingEditorStateArgs {
  createBookingConfirmationPayload: (booking: ScheduleBooking) => {
    bookingId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string | null;
    licensePlate: string;
    bookingDate: string;
    bookingTime: string;
    serviceName: string;
    language: SupportedBookingLanguage;
    notes: string | null;
  };
  fetchScheduleData: (date: Date) => Promise<void> | void;
  getBookingLanguage: (booking: ScheduleBooking) => SupportedBookingLanguage;
  language: string;
  refreshBookingConversationIfLoaded: (bookingId: string) => Promise<void>;
  selectedDate: Date;
  selectedSlotTime: string;
  setBookingExpanded: (bookingId: string, expanded: boolean) => void;
  t: (key: string) => string;
}

export function useBookingEditorState({
  createBookingConfirmationPayload,
  fetchScheduleData,
  getBookingLanguage,
  language,
  refreshBookingConversationIfLoaded,
  selectedDate,
  selectedSlotTime,
  setBookingExpanded,
  t,
}: UseBookingEditorStateArgs) {
  const [savingBookingId, setSavingBookingId] = useState<string | null>(null);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [createBookingForm, setCreateBookingForm] = useState<AdminBookingFormState>({
    license_plate: '',
    booking_date: formatDateForSupabase(new Date()),
    booking_time: '',
    booking_language: language === 'en' ? 'en' : 'fi',
    service_name: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    notes: '',
    status: 'confirmed',
  });
  const [createBookingSelectedCategory, setCreateBookingSelectedCategory] = useState<string>('');
  const [createBookingCurrentServiceId, setCreateBookingCurrentServiceId] = useState<string>('');
  const [createBookingServiceIds, setCreateBookingServiceIds] = useState<string[]>([]);
  const [editBookingForms, setEditBookingForms] = useState<Record<string, AdminBookingFormState>>({});
  const [editBookingSelectedCategory, setEditBookingSelectedCategory] = useState<Record<string, string>>({});
  const [editBookingCurrentServiceId, setEditBookingCurrentServiceId] = useState<Record<string, string>>({});
  const [editBookingServiceIds, setEditBookingServiceIds] = useState<Record<string, string[]>>({});

  const bookingEmailWarning =
    language === 'fi'
      ? 'Varaus tallennettiin, mutta asiakkaan sähköpostia ei voitu lähettää.'
      : 'The booking was saved, but the customer email could not be sent.';
  const bookingUpdateEmailWarning =
    language === 'fi'
      ? 'Varaus päivitettiin, mutta asiakkaan sähköpostia ei voitu lähettää.'
      : 'The booking was updated, but the customer email could not be sent.';

  const normalizeAdminBookingLanguage = useCallback((
    bookingLanguage?: string | null,
    serviceName?: string | null,
  ): SupportedBookingLanguage => {
    const normalized = (bookingLanguage ?? '').trim().toLowerCase();
    if (normalized === 'en' || normalized === 'english') return 'en';
    if (normalized === 'fi' || normalized === 'finnish' || normalized === 'suomi') return 'fi';
    return detectStoredServiceLanguage(serviceName) ?? 'fi';
  }, []);

  const buildBookingFormState = useCallback((booking?: Partial<ScheduleBooking>, fallbackTime = ''): AdminBookingFormState => ({
    license_plate: booking?.license_plate || '',
    booking_date: booking?.booking_date || formatDateForSupabase(selectedDate),
    booking_time: booking?.booking_time || fallbackTime,
    booking_language: normalizeAdminBookingLanguage(booking?.booking_language, booking?.service_name),
    service_name: booking?.service_name || '',
    customer_name: booking?.customer_name || '',
    customer_phone: booking?.customer_phone || '',
    customer_email: booking?.customer_email || '',
    notes: booking?.notes || '',
    status: (booking?.status || 'confirmed').toLowerCase(),
  }), [normalizeAdminBookingLanguage, selectedDate]);

  const syncCreateBookingServiceName = useCallback((
    serviceIds: string[],
    selectedLanguage: SupportedBookingLanguage,
    getSelectedServiceNames: (serviceIds: string[], selectedLanguage: SupportedBookingLanguage) => string[],
  ) => {
    const serviceNames = getSelectedServiceNames(serviceIds, selectedLanguage);
    setCreateBookingForm((current) => ({
      ...current,
      service_name: serviceNames.join(', '),
    }));
  }, []);

  const syncEditBookingServiceName = useCallback((
    bookingId: string,
    serviceIds: string[],
    selectedLanguage: SupportedBookingLanguage,
    getSelectedServiceNames: (serviceIds: string[], selectedLanguage: SupportedBookingLanguage) => string[],
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
  }, [buildBookingFormState, selectedSlotTime]);

  const buildCompletionEmailPayload = useCallback((booking: ScheduleBooking) => {
    const draft = buildCustomerCompletionDraft(booking, language);

    return {
      bookingId: booking.id,
      customerName: booking.customer_name || '',
      customerEmail: booking.customer_email || '',
      customerPhone: booking.customer_phone || null,
      licensePlate: booking.license_plate,
      bookingDate: booking.booking_date,
      bookingTime: booking.booking_time,
      serviceName: booking.service_name || 'Service',
      language: getBookingLanguage(booking),
      subject: draft.subject,
      message: draft.message,
    };
  }, [getBookingLanguage, language]);

  const resetCreateBookingForm = useCallback((fallbackTime = '') => {
    setCreateBookingForm(buildBookingFormState(undefined, fallbackTime));
    setCreateBookingSelectedCategory('');
    setCreateBookingCurrentServiceId('');
    setCreateBookingServiceIds([]);
  }, [buildBookingFormState]);

  const resetEditBookingState = useCallback(() => {
    setEditBookingForms({});
    setEditBookingSelectedCategory({});
    setEditBookingCurrentServiceId({});
    setEditBookingServiceIds({});
    setEditingBookingId(null);
  }, []);

  const resetBookingEditorState = useCallback((fallbackTime = '') => {
    setIsCreateFormOpen(false);
    resetEditBookingState();
    resetCreateBookingForm(fallbackTime);
  }, [resetCreateBookingForm, resetEditBookingState]);

  const openCreateBookingForm = useCallback((fallbackTime = '') => {
    setEditingBookingId(null);
    resetCreateBookingForm(fallbackTime);
    setIsCreateFormOpen(true);
  }, [resetCreateBookingForm]);

  const closeCreateBookingForm = useCallback(() => {
    setIsCreateFormOpen(false);
  }, []);

  const toggleCreateBookingForm = useCallback((fallbackTime = '') => {
    setEditingBookingId(null);
    resetCreateBookingForm(fallbackTime);
    setIsCreateFormOpen((current) => !current);
  }, [resetCreateBookingForm]);

  const handleCreateBooking = useCallback(async () => {
    const missingCompletionFields = getMissingCompletionFields(createBookingForm, language);
    const completionMode =
      createBookingForm.status === awaitingCustomerCompletionStatus ||
      missingCompletionFields.length > 0;

    if (!createBookingForm.service_name.trim() || !createBookingForm.booking_date || !createBookingForm.booking_time) {
      toast.error(t('bookingSaveFailed'));
      return;
    }

    if (!completionMode && (!createBookingForm.license_plate.trim() || !createBookingForm.customer_name.trim() || !createBookingForm.customer_phone.trim())) {
      toast.error(t('bookingSaveFailed'));
      return;
    }

    setIsCreatingBooking(true);
    try {
      const supabase = getSupabaseClient();
      let emailFailureMessage: string | null = null;
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
        status: completionMode ? awaitingCustomerCompletionStatus : 'confirmed',
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingPayload])
        .select('*')
        .single();

      if (error || !data) throw error;

      if (data.customer_email) {
        try {
          if (completionMode) {
            const { error: emailError } = await supabase.functions.invoke('send_booking_message', {
              method: 'POST',
              body: buildCompletionEmailPayload(data),
            });

            if (emailError) throw emailError;
          } else {
            const { error: emailError } = await supabase.functions.invoke('send_booking_confirmation', {
              method: 'POST',
              body: createBookingConfirmationPayload(data),
            });

            if (emailError) throw emailError;
          }
        } catch (emailError) {
          console.error('Booking created but customer email failed:', emailError);
          emailFailureMessage = bookingEmailWarning;
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
      if (emailFailureMessage) {
        toast(emailFailureMessage);
      }
      setIsCreateFormOpen(false);
      resetCreateBookingForm(selectedSlotTime);
      await Promise.resolve(fetchScheduleData(selectedDate));
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(t('bookingSaveFailed'));
    } finally {
      setIsCreatingBooking(false);
    }
  }, [
    buildCompletionEmailPayload,
    createBookingConfirmationPayload,
    createBookingForm,
    fetchScheduleData,
    language,
    resetCreateBookingForm,
    selectedDate,
    selectedSlotTime,
    t,
  ]);

  const handleStartEditingBooking = useCallback((booking: ScheduleBooking) => {
    const initialServiceIds = getServiceIdsFromStoredServiceName(booking.service_name);
    setEditingBookingId(booking.id);
    setBookingExpanded(booking.id, true);
    setEditBookingForms((current) => ({
      ...current,
      [booking.id]: buildBookingFormState(booking),
    }));
    setEditBookingSelectedCategory((current) => ({ ...current, [booking.id]: '' }));
    setEditBookingCurrentServiceId((current) => ({ ...current, [booking.id]: '' }));
    setEditBookingServiceIds((current) => ({ ...current, [booking.id]: initialServiceIds }));
  }, [buildBookingFormState, setBookingExpanded]);

  const handleEditBookingFieldChange = useCallback((
    bookingId: string,
    field: keyof AdminBookingFormState,
    value: string,
  ) => {
    if (field === 'booking_language') {
      const nextLanguage = value as SupportedBookingLanguage;
      const currentServiceIds = editBookingServiceIds[bookingId] || [];
      setEditBookingForms((current) => ({
        ...current,
        [bookingId]: {
          ...(current[bookingId] || buildBookingFormState(undefined, selectedSlotTime)),
          booking_language: nextLanguage,
        },
      }));
      if (currentServiceIds.length === 0) return;
      return;
    }

    setEditBookingForms((current) => ({
      ...current,
      [bookingId]: {
        ...(current[bookingId] || buildBookingFormState(undefined, selectedSlotTime)),
        [field]: value,
      },
    }));
  }, [buildBookingFormState, editBookingServiceIds, selectedSlotTime]);

  const handleSaveBookingChanges = useCallback(async (booking: ScheduleBooking) => {
    const form = editBookingForms[booking.id];
    const missingCompletionFields = form ? getMissingCompletionFields(form, language) : [];
    const completionMode =
      Boolean(form) &&
      (form.status === awaitingCustomerCompletionStatus || missingCompletionFields.length > 0);

    if (!form || !form.service_name.trim() || !form.booking_date || !form.booking_time) {
      toast.error(t('bookingSaveFailed'));
      return;
    }

    if (!completionMode && (!form.license_plate.trim() || !form.customer_name.trim() || !form.customer_phone.trim())) {
      toast.error(t('bookingSaveFailed'));
      return;
    }

    setSavingBookingId(booking.id);
    try {
      const supabase = getSupabaseClient();
      let emailFailureMessage: string | null = null;
      let emailSuccessKey: 'completionRequestSent' | 'bookingConfirmationEmailSent' | 'bookingUpdateEmailSent' | null = null;
      const normalizedLicensePlate = form.license_plate.trim().toUpperCase();
      const normalizedServiceName = form.service_name.trim();
      const normalizedCustomerName = form.customer_name.trim();
      const normalizedCustomerPhone = form.customer_phone.trim();
      const normalizedCustomerEmail = form.customer_email.trim();
      const normalizedNotes = form.notes.trim();
      const previousCompletionMode = isBookingAwaitingCustomerCompletion(booking, language);
      const nextStatus = completionMode ? awaitingCustomerCompletionStatus : 'confirmed';
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
        !previousCompletionMode &&
        !completionMode &&
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
          status: nextStatus,
        })
        .eq('id', booking.id);

      if (error) throw error;

      const nextBooking: ScheduleBooking = {
        ...booking,
        license_plate: normalizedLicensePlate,
        booking_date: form.booking_date,
        booking_time: form.booking_time,
        booking_language: form.booking_language,
        service_name: normalizedServiceName,
        customer_name: normalizedCustomerName,
        customer_phone: normalizedCustomerPhone,
        customer_email: normalizedCustomerEmail || null,
        notes: normalizedNotes || null,
        status: nextStatus,
      };

      if (completionMode && normalizedCustomerEmail && !previousCompletionMode) {
        try {
          const { error: emailError } = await supabase.functions.invoke('send_booking_message', {
            method: 'POST',
            body: buildCompletionEmailPayload(nextBooking),
          });

          if (emailError) throw emailError;
          await refreshBookingConversationIfLoaded(booking.id);
          emailSuccessKey = 'completionRequestSent';
        } catch (emailError) {
          console.error('Booking updated but completion email failed:', emailError);
          emailFailureMessage = bookingUpdateEmailWarning;
        }
      } else if (previousCompletionMode && !completionMode && normalizedCustomerEmail) {
        try {
          const { error: emailError } = await supabase.functions.invoke('send_booking_confirmation', {
            method: 'POST',
            body: createBookingConfirmationPayload(nextBooking),
          });

          if (emailError) throw emailError;
          await refreshBookingConversationIfLoaded(booking.id);
          emailSuccessKey = 'bookingConfirmationEmailSent';
        } catch (emailError) {
          console.error('Booking updated but confirmation email failed:', emailError);
          emailFailureMessage = bookingUpdateEmailWarning;
        }
      } else if (shouldSendUpdateEmail) {
        try {
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

          if (emailError) throw emailError;
          await refreshBookingConversationIfLoaded(booking.id);
          emailSuccessKey = 'bookingUpdateEmailSent';
        } catch (emailError) {
          console.error('Booking updated but update email failed:', emailError);
          emailFailureMessage = bookingUpdateEmailWarning;
        }
      }

      toast.success(t('bookingUpdated'));
      if (emailSuccessKey) {
        toast.success(t(emailSuccessKey));
      } else if (emailFailureMessage) {
        toast(emailFailureMessage);
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
      await Promise.resolve(fetchScheduleData(selectedDate));
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error(t('bookingSaveFailed'));
    } finally {
      setSavingBookingId(null);
    }
  }, [
    buildCompletionEmailPayload,
    createBookingConfirmationPayload,
    editBookingForms,
    fetchScheduleData,
    language,
    refreshBookingConversationIfLoaded,
    selectedDate,
    t,
  ]);

  return {
    awaitingCustomerCompletionStatus,
    buildBookingFormState,
    buildCompletionEmailPayload,
    buildCustomerCompletionDraft: (booking: ScheduleBooking) => buildCustomerCompletionDraft(booking, language),
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
    handleStartEditingBooking,
    isBookingAwaitingCustomerCompletion: (booking: Partial<ScheduleBooking> | AdminBookingFormState) =>
      isBookingAwaitingCustomerCompletion(booking, language),
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
    syncCreateBookingServiceName,
    syncEditBookingServiceName,
    toggleCreateBookingForm,
  };
}
