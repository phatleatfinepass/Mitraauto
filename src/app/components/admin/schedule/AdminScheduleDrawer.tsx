import React from 'react';
import {
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  FileText,
  Mail,
  MailPlus,
  Pencil,
  Phone,
  PlusCircle,
  Save,
  Send,
  StickyNote,
  Trash2,
  User,
  Wrench,
  X,
} from 'lucide-react';

import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Checkbox } from '../../ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../../ui/sheet';
import { Textarea } from '../../ui/textarea';
import { toast } from 'sonner';
import {
  OTHER_SERVICE_CATEGORY_ID,
  OTHER_SERVICE_ID,
  type SupportedBookingLanguage,
} from '../../../utils/serviceCatalog';
import type { ScheduleBooking, ScheduleTimeSlot } from '../../../utils/schedule';
import { getSupabaseClient } from '../../../utils/supabase/client';
import { AdminBookingEditPanel } from '../AdminBookingEditPanel';
import type { BookingConversationMessage } from '../communication/types';
import type { AdminBookingFormState } from './AdminSchedule.types';

interface AdminScheduleDrawerProps {
  cancellingBookingId: string | null;
  confirmingBookingId: string | null;
  createBookingCurrentServiceId: string;
  createBookingForm: AdminBookingFormState;
  createBookingSelectedCategory: string;
  createBookingServiceIds: string[];
  editBookingCurrentServiceId: Record<string, string>;
  editBookingForms: Record<string, AdminBookingFormState>;
  editBookingSelectedCategory: Record<string, string>;
  editBookingServiceIds: Record<string, string[]>;
  editingBookingId: string | null;
  getBookingServiceNameForCms: (serviceName?: string | null) => string;
  getSelectedServiceNames: (serviceIds: string[], bookingLanguage: SupportedBookingLanguage) => string[];
  handleCreateBooking: () => void;
  handleEditBookingFieldChange: (bookingId: string, field: keyof AdminBookingFormState, value: string) => void;
  handleForceConfirmBooking: (booking: ScheduleBooking) => Promise<void> | void;
  handleOpenCancelBookingDialog: (booking: ScheduleBooking) => void;
  handleOpenMessageComposer: (booking: ScheduleBooking, replyTo?: BookingConversationMessage) => void;
  handleResendBookingConfirmation: (booking: ScheduleBooking) => void;
  handleSaveBookingChanges: (booking: ScheduleBooking) => Promise<void> | void;
  handleStartEditingBooking: (booking: ScheduleBooking) => void;
  handleToggleBookingExpanded: (booking: ScheduleBooking, expanded: boolean) => void;
  isBookingExpanded: (bookingId: string) => boolean;
  isCreateFormOpen: boolean;
  isCreatingBooking: boolean;
  isOpen: boolean;
  language: string;
  onCloseCreateForm: () => void;
  onOpenChange: (open: boolean) => void;
  onToggleCreateFormForSelectedSlot: () => void;
  panelSurfaceClass: string;
  resendingBookingId: string | null;
  resendCounts: Record<string, number>;
  savingBookingId: string | null;
  selectedDate: Date;
  selectedLanguageServiceCategories: (bookingLanguage: SupportedBookingLanguage) => ReturnType<typeof import('../../../utils/serviceCatalog').getLocalizedServiceCategories>;
  selectedSlot: ScheduleTimeSlot | null;
  selectedSlotTime: string;
  sendingMessageBookingId: string | null;
  setCreateBookingCurrentServiceId: React.Dispatch<React.SetStateAction<string>>;
  setCreateBookingForm: React.Dispatch<React.SetStateAction<AdminBookingFormState>>;
  setCreateBookingSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  setCreateBookingServiceIds: React.Dispatch<React.SetStateAction<string[]>>;
  setEditBookingCurrentServiceId: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setEditBookingSelectedCategory: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setEditBookingServiceIds: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  setEditingBookingId: React.Dispatch<React.SetStateAction<string | null>>;
  syncCreateBookingServiceName: (serviceIds: string[], bookingLanguage: SupportedBookingLanguage) => void;
  syncEditBookingServiceName: (bookingId: string, serviceIds: string[], bookingLanguage: SupportedBookingLanguage) => void;
  t: (key: string) => string;
  theme: string;
}

interface BookingServiceSelectorProps {
  currentServiceId: string;
  language: string;
  onCurrentServiceIdChange: (value: string) => void;
  onSelectedCategoryChange: (value: string) => void;
  onServiceIdsChange: (serviceIds: string[]) => void;
  readOnlyValue: string;
  selectedCategory: string;
  serviceIds: string[];
  t: (key: string) => string;
  theme: string;
  bookingLanguage: SupportedBookingLanguage;
  getSelectedServiceNames: (serviceIds: string[], bookingLanguage: SupportedBookingLanguage) => string[];
  selectedLanguageServiceCategories: (bookingLanguage: SupportedBookingLanguage) => ReturnType<typeof import('../../../utils/serviceCatalog').getLocalizedServiceCategories>;
  syncServiceName: (serviceIds: string[], bookingLanguage: SupportedBookingLanguage) => void;
}

function BookingServiceSelector({
  currentServiceId,
  language,
  onCurrentServiceIdChange,
  onSelectedCategoryChange,
  onServiceIdsChange,
  readOnlyValue,
  selectedCategory,
  serviceIds,
  t,
  theme,
  bookingLanguage,
  getSelectedServiceNames,
  selectedLanguageServiceCategories,
  syncServiceName,
}: BookingServiceSelectorProps) {
  const categories = selectedLanguageServiceCategories(bookingLanguage);
  const selectedServices = categories.find((category) => category.id === selectedCategory)?.services || [];
  const isOtherCategorySelected = selectedCategory === OTHER_SERVICE_CATEGORY_ID;
  const formatServicePrice = (price: number) => (
    price > 0 ? `€${price.toFixed(2)}` : t('vehicleSpecificQuote')
  );

  return (
    <div className="space-y-2 sm:col-span-2">
      <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('serviceName')}</label>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <Select
          value={selectedCategory || undefined}
          onValueChange={(value) => {
            onSelectedCategoryChange(value);
            onCurrentServiceIdChange('');
            if (value === OTHER_SERVICE_CATEGORY_ID) {
              onServiceIdsChange([OTHER_SERVICE_ID]);
              syncServiceName([OTHER_SERVICE_ID], bookingLanguage);
            } else if (serviceIds.includes(OTHER_SERVICE_ID)) {
              onServiceIdsChange([]);
              syncServiceName([], bookingLanguage);
            }
          }}
        >
          <SelectTrigger className={theme === 'dark' ? 'border-white/10 bg-[#11141A] text-white' : ''}>
            <SelectValue placeholder={t('selectCategory')} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isOtherCategorySelected ? (
          <div className={`flex h-10 items-center rounded-md border px-3 text-sm ${theme === 'dark' ? 'border-white/10 bg-[#11141A] text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
            {t('otherNoServiceNeeded')}
          </div>
        ) : (
          <>
            <Select value={currentServiceId || undefined} onValueChange={onCurrentServiceIdChange} disabled={!selectedCategory}>
              <SelectTrigger className={theme === 'dark' ? 'border-white/10 bg-[#11141A] text-white' : ''}>
                <SelectValue placeholder={t('servicePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {selectedServices.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                    {'price' in service ? ` · ${formatServicePrice(service.price)}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="secondary"
              disabled={!currentServiceId || serviceIds.includes(currentServiceId)}
              onClick={() => {
                if (!currentServiceId) return;
                const nextServiceIds = serviceIds.includes(OTHER_SERVICE_ID)
                  ? [currentServiceId]
                  : [...serviceIds, currentServiceId];
                onServiceIdsChange(nextServiceIds);
                syncServiceName(nextServiceIds, bookingLanguage);
                onCurrentServiceIdChange('');
                onSelectedCategoryChange('');
              }}
            >
              {t('add')}
            </Button>
          </>
        )}
      </div>

      {serviceIds.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {getSelectedServiceNames(serviceIds, bookingLanguage).map((serviceName, index) => {
            const serviceId = serviceIds[index];

            return (
              <Badge key={serviceId} variant="secondary" className="gap-2 px-3 py-1">
                <span>{serviceName}</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextServiceIds = serviceIds.filter((id) => id !== serviceId);
                    onServiceIdsChange(nextServiceIds);
                    syncServiceName(nextServiceIds, bookingLanguage);
                    if (serviceId === OTHER_SERVICE_ID) {
                      onSelectedCategoryChange('');
                    }
                  }}
                  className="rounded-full hover:bg-black/10"
                  aria-label={t('removeService')}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </Badge>
            );
          })}
        </div>
      ) : (
        <p className={`mt-3 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {t('addedServicesEmpty')}
        </p>
      )}

      <Input
        value={readOnlyValue}
        readOnly
        placeholder={t('servicePlaceholder')}
        className={theme === 'dark' ? 'border-white/10 bg-[#11141A] text-white' : ''}
      />
    </div>
  );
}

function BookingDetails({
  booking,
  getBookingServiceNameForCms,
  language,
  t,
  theme,
}: {
  booking: ScheduleBooking;
  getBookingServiceNameForCms: (serviceName?: string | null) => string;
  language: string;
  t: (key: string) => string;
  theme: string;
}) {
  const serviceItems = getBookingServiceItems(booking.service_name, getBookingServiceNameForCms);

  return (
    <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-12">
      {serviceItems.length > 0 && (
        <div className={`min-w-0 rounded-md border p-4 sm:col-span-2 xl:col-span-12 ${theme === 'dark' ? 'border-white/10 bg-[#15171C]' : 'border-gray-200 bg-[#FCFCFC]'}`}>
          <dt className={`mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <Wrench className="h-4 w-4 shrink-0" />
            {t('serviceName')}
          </dt>
          <dd className={`space-y-2 text-base font-medium leading-7 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
            {serviceItems.map((service) => (
              <div key={service} className="flex min-w-0 gap-2">
                <span className="shrink-0 opacity-70">-</span>
                <span className="min-w-0 break-words">{service}</span>
              </div>
            ))}
          </dd>
        </div>
      )}
      {(booking.customer_name || booking.customer_phone || booking.customer_email) && (
        <div className={`min-w-0 rounded-md border p-4 sm:col-span-2 xl:col-span-12 ${theme === 'dark' ? 'border-white/10 bg-[#15171C]' : 'border-gray-200 bg-[#FCFCFC]'}`}>
          <dt className={`mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <User className="h-4 w-4 shrink-0" />
            {t('customerName')}
          </dt>
          <dd className="space-y-3">
            <div className="min-w-0">
              <p className={`text-[11px] font-medium uppercase tracking-[0.08em] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                {t('name')}
              </p>
              <p className={`mt-1 break-words text-base font-medium leading-7 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                {booking.customer_name || '—'}
              </p>
            </div>
            <div className="min-w-0">
              <p className={`flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                <Phone className="h-4 w-4 shrink-0" />
                {t('customerPhone')}
              </p>
              <p className={`mt-1 break-words text-base font-medium leading-7 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                {booking.customer_phone || '—'}
              </p>
            </div>
            <div className="min-w-0">
              <p className={`flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                <Mail className="h-4 w-4 shrink-0" />
                {t('customerEmail')}
              </p>
              <p className={`mt-1 break-all text-base font-medium leading-7 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                {booking.customer_email || '—'}
              </p>
            </div>
          </dd>
        </div>
      )}
      <div className={`min-w-0 rounded-md border p-4 sm:col-span-2 xl:col-span-12 ${theme === 'dark' ? 'border-white/10 bg-[#15171C]' : 'border-gray-200 bg-[#FCFCFC]'}`}>
        <dt className={`mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          <StickyNote className="h-4 w-4 shrink-0" />
          {t('notes')}
        </dt>
        <dd className={`text-base leading-7 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{booking.notes || t('noNotes')}</dd>
      </div>
    </dl>
  );
}

function getBookingServiceItems(
  serviceName: string | null | undefined,
  getBookingServiceNameForCms: (serviceName?: string | null) => string,
) {
  const label = getBookingServiceNameForCms(serviceName).trim();
  if (!label) return [];

  return label
    .split(/\s*,\s*/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getCollapsedServicePreview(serviceItems: string[], t: (key: string) => string) {
  if (serviceItems.length === 0) return ['—'];
  if (serviceItems.length <= 2) return serviceItems;

  const remainingCount = serviceItems.length - 2;
  const moreLabel = `${remainingCount} ${t('moreCount')}`;

  return [
    serviceItems[0],
    `${serviceItems[1]}, + ${moreLabel}`,
  ];
}

const awaitingCustomerCompletionStatus = 'awaiting_customer_completion';

type BookingReceiptLine = {
  id: string;
  title: string;
  quantity: string;
  unitPrice: string;
};

function normalizeBookingStatus(status?: string | null) {
  return (status || 'confirmed').trim().toLowerCase();
}

function getMissingCompletionFields(
  bookingLike: Partial<Pick<ScheduleBooking, 'license_plate' | 'customer_phone' | 'customer_email'>>,
  t: (key: string) => string,
) {
  const missingFields: string[] = [];

  if (!bookingLike.license_plate?.trim()) {
    missingFields.push(t('missingLicensePlate'));
  }
  if (!bookingLike.customer_phone?.trim()) {
    missingFields.push(t('missingPhone'));
  }
  if (!bookingLike.customer_email?.trim()) {
    missingFields.push(t('missingEmail'));
  }

  return missingFields;
}

function isBookingAwaitingCustomerCompletion(booking: Partial<ScheduleBooking> | AdminBookingFormState, t: (key: string) => string) {
  return normalizeBookingStatus(booking.status) === awaitingCustomerCompletionStatus || getMissingCompletionFields(booking, t).length > 0;
}

function parseEuroToCents(value: string) {
  const numeric = Number.parseFloat(value.replace(',', '.'));
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return Math.round(numeric * 100);
}

function centsToEuro(cents: number) {
  return (cents / 100).toFixed(2);
}

export function AdminScheduleDrawer({
  cancellingBookingId,
  confirmingBookingId,
  createBookingCurrentServiceId,
  createBookingForm,
  createBookingSelectedCategory,
  createBookingServiceIds,
  editBookingCurrentServiceId,
  editBookingForms,
  editBookingSelectedCategory,
  editBookingServiceIds,
  editingBookingId,
  getBookingServiceNameForCms,
  getSelectedServiceNames,
  handleCreateBooking,
  handleEditBookingFieldChange,
  handleForceConfirmBooking,
  handleOpenCancelBookingDialog,
  handleOpenMessageComposer,
  handleResendBookingConfirmation,
  handleSaveBookingChanges,
  handleStartEditingBooking,
  handleToggleBookingExpanded,
  isBookingExpanded,
  isCreateFormOpen,
  isCreatingBooking,
  isOpen,
  language,
  onCloseCreateForm,
  onOpenChange,
  onToggleCreateFormForSelectedSlot,
  panelSurfaceClass,
  resendCounts,
  resendingBookingId,
  savingBookingId,
  selectedDate,
  selectedLanguageServiceCategories,
  selectedSlot,
  selectedSlotTime,
  sendingMessageBookingId,
  setCreateBookingCurrentServiceId,
  setCreateBookingForm,
  setCreateBookingSelectedCategory,
  setCreateBookingServiceIds,
  setEditBookingCurrentServiceId,
  setEditBookingSelectedCategory,
  setEditBookingServiceIds,
  setEditingBookingId,
  syncCreateBookingServiceName,
  syncEditBookingServiceName,
  t,
  theme,
}: AdminScheduleDrawerProps) {
  const dateLocale = { fi: 'fi-FI', en: 'en-US' }[language as 'fi' | 'en'] ?? 'en-US';
  const createBookingCompletionMode = isBookingAwaitingCustomerCompletion(createBookingForm, t);
  const createBookingMissingFields = getMissingCompletionFields(createBookingForm, t);
  const [receiptBooking, setReceiptBooking] = React.useState<ScheduleBooking | null>(null);
  const [receiptLines, setReceiptLines] = React.useState<BookingReceiptLine[]>([]);
  const [receiptNotes, setReceiptNotes] = React.useState('');
  const [sendingReceipt, setSendingReceipt] = React.useState(false);

  const openReceiptDialog = (booking: ScheduleBooking) => {
    const serviceItems = getBookingServiceItems(booking.service_name, getBookingServiceNameForCms);
    setReceiptBooking(booking);
    setReceiptLines(
      (serviceItems.length > 0 ? serviceItems : [t('serviceName')]).map((service, index) => ({
        id: `${Date.now()}-${index}`,
        title: service,
        quantity: '1',
        unitPrice: '',
      })),
    );
    setReceiptNotes('');
  };

  const receiptTotalCents = receiptLines.reduce((sum, line) => {
    const quantity = Math.max(1, Number.parseInt(line.quantity, 10) || 1);
    return sum + parseEuroToCents(line.unitPrice) * quantity;
  }, 0);
  const receiptVatCents = Math.round(receiptTotalCents - receiptTotalCents / 1.255);

  const updateReceiptLine = (lineId: string, patch: Partial<BookingReceiptLine>) => {
    setReceiptLines((current) => current.map((line) => (line.id === lineId ? { ...line, ...patch } : line)));
  };

  const addReceiptLine = () => {
    setReceiptLines((current) => [
      ...current,
      {
        id: `${Date.now()}-${current.length}`,
        title: '',
        quantity: '1',
        unitPrice: '',
      },
    ]);
  };

  const removeReceiptLine = (lineId: string) => {
    setReceiptLines((current) => current.length > 1 ? current.filter((line) => line.id !== lineId) : current);
  };

  const sendReceipt = async () => {
    if (!receiptBooking) return;
    if (!receiptBooking.customer_email) {
      toast.error(t('receiptMissingEmail'));
      return;
    }
    const validLines = receiptLines
      .map((line) => {
        const quantity = Math.max(1, Number.parseInt(line.quantity, 10) || 1);
        const unitCents = parseEuroToCents(line.unitPrice);
        return {
          title: line.title.trim(),
          quantity,
          unit_cents: unitCents,
          line_total_cents: unitCents * quantity,
          vat_rate: 25.5,
        };
      })
      .filter((line) => line.title && line.line_total_cents >= 0);

    if (validLines.length === 0) {
      toast.error(t('receiptLinesRequired'));
      return;
    }

    setSendingReceipt(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.functions.invoke('send_booking_receipt', {
        method: 'POST',
        body: {
          bookingId: receiptBooking.id,
          recipientEmail: receiptBooking.customer_email,
          notes: receiptNotes,
          lines: validLines,
        },
      });
      if (error) throw error;
      toast.success(t('receiptSent'));
      setReceiptBooking(null);
    } catch (error: any) {
      toast.error(error?.message ?? t('receiptFailed'));
    } finally {
      setSendingReceipt(false);
    }
  };

  return (
    <>
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={`w-full overflow-y-auto sm:max-w-xl ${theme === 'dark' ? 'border-white/10 bg-[#1C1C1E]' : 'border-gray-200 bg-white'}`}
      >
        <SheetHeader className={theme === 'dark' ? 'border-b border-white/10' : 'border-b border-gray-200'}>
          <SheetTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{t('slotDetails')}</SheetTitle>
          <SheetDescription className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            {selectedDate.toLocaleDateString(dateLocale, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}{' '}
            {selectedSlotTime ? `— ${selectedSlotTime}` : ''}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 py-5">
          {isCreateFormOpen && (
            <Card className={`p-4 ${panelSurfaceClass}`}>
              <div className="space-y-4">
                <div>
                  <h3 className={theme === 'dark' ? 'font-semibold text-white' : 'font-semibold text-gray-900'}>{t('createBooking')}</h3>
                  <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('createBookingDescription')}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('bookingLanguage')}</label>
                    <Select
                      value={createBookingForm.booking_language}
                      onValueChange={(value: SupportedBookingLanguage) => {
                        setCreateBookingForm((current) => ({ ...current, booking_language: value }));
                        syncCreateBookingServiceName(createBookingServiceIds, value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fi">{t('finnish')}</SelectItem>
                        <SelectItem value="en">{t('english')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('licensePlate')}</label>
                    <Input
                      value={createBookingForm.license_plate}
                      onChange={(e) => setCreateBookingForm((current) => ({ ...current, license_plate: e.target.value.toUpperCase() }))}
                      placeholder="ABC-123"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('date')}</label>
                    <Input
                      type="date"
                      value={createBookingForm.booking_date}
                      onChange={(e) => setCreateBookingForm((current) => ({ ...current, booking_date: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('time')}</label>
                    <Input
                      type="time"
                      value={createBookingForm.booking_time}
                      onChange={(e) => setCreateBookingForm((current) => ({ ...current, booking_time: e.target.value }))}
                    />
                  </div>

                  <BookingServiceSelector
                    bookingLanguage={createBookingForm.booking_language}
                    currentServiceId={createBookingCurrentServiceId}
                    getSelectedServiceNames={getSelectedServiceNames}
                    language={language}
                    onCurrentServiceIdChange={setCreateBookingCurrentServiceId}
                    onSelectedCategoryChange={setCreateBookingSelectedCategory}
                    onServiceIdsChange={setCreateBookingServiceIds}
                    readOnlyValue={createBookingForm.service_name}
                    selectedCategory={createBookingSelectedCategory}
                    selectedLanguageServiceCategories={selectedLanguageServiceCategories}
                    serviceIds={createBookingServiceIds}
                    syncServiceName={syncCreateBookingServiceName}
                    t={t}
                    theme={theme}
                  />

                  <div className="space-y-2">
                    <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('customerName')}</label>
                    <Input value={createBookingForm.customer_name} onChange={(e) => setCreateBookingForm((current) => ({ ...current, customer_name: e.target.value }))} />
                  </div>

                  <div className="space-y-2">
                    <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('customerPhone')}</label>
                    <Input value={createBookingForm.customer_phone} onChange={(e) => setCreateBookingForm((current) => ({ ...current, customer_phone: e.target.value }))} />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('customerEmail')}</label>
                    <Input type="email" value={createBookingForm.customer_email} onChange={(e) => setCreateBookingForm((current) => ({ ...current, customer_email: e.target.value }))} />
                  </div>

                  <div className={`sm:col-span-2 rounded-md border p-3 ${theme === 'dark' ? 'border-white/10 bg-[#15171C]' : 'border-gray-200 bg-gray-50'}`}>
                    <label className="flex items-start gap-3">
                      <Checkbox
                        checked={createBookingForm.status === awaitingCustomerCompletionStatus}
                        onCheckedChange={(checked) => {
                          setCreateBookingForm((current) => ({
                            ...current,
                            status: checked === true ? awaitingCustomerCompletionStatus : 'confirmed',
                          }));
                        }}
                      />
                      <span className="space-y-1">
                        <span className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                          {t('awaitingCustomerCompletion')}
                        </span>
                        <span className={`block text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {t('completionModeDescription')}
                        </span>
                      </span>
                    </label>

                    {(createBookingCompletionMode || createBookingMissingFields.length > 0) && (
                      <p className={`mt-3 text-sm ${theme === 'dark' ? 'text-amber-300' : 'text-amber-700'}`}>
                        {t('incompleteBookingWarning')}: {createBookingMissingFields.join(', ') || t('customerDetailsFallback')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('notes')}</label>
                    <Textarea
                      value={createBookingForm.notes}
                      onChange={(e) => setCreateBookingForm((current) => ({ ...current, notes: e.target.value }))}
                      rows={3}
                      className={theme === 'dark' ? 'border-white/10 bg-[#11141A] text-white' : ''}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreateBooking} disabled={isCreatingBooking} className="bg-[#FF6B35] hover:bg-[#FF6B35]/90">
                    <Save className="mr-2 h-4 w-4" />
                    {isCreatingBooking ? t('creatingBooking') : t('createBooking')}
                  </Button>
                  <Button variant="outline" onClick={onCloseCreateForm} className={theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : ''}>
                    {t('cancel')}
                  </Button>
                </div>
              </div>
            </Card>
          )}

	          {selectedSlotTime && (
	            <div className={`rounded-lg border px-4 py-3 ${theme === 'dark' ? 'border-white/10 bg-[#16181D]' : 'border-gray-200 bg-white'}`}>
	              <div className="grid gap-3 sm:grid-cols-[minmax(16rem,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
	                <div className="min-w-0">
	                  <p className="text-xs text-gray-500">{t('slotSummary')}</p>
	                  <p className={`mt-1 whitespace-nowrap text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {selectedDate.toLocaleDateString(dateLocale, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    {selectedSlotTime}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('slotStatus')}</p>
                  <p className={`mt-1 text-sm font-medium ${selectedSlot?.isBlocked ? 'text-red-600' : theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                    {selectedSlot?.isBlocked ? t('slotBlocked') : t('slotAvailable')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('slotBookingsCount')}</p>
                  <p className={`mt-1 text-sm font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{selectedSlot?.bookings.length || 0}</p>
                </div>
	              </div>
	            </div>
	          )}

          <div className={`rounded-lg border p-4 ${theme === 'dark' ? 'border-white/10 bg-[#16181D]' : 'border-gray-200 bg-white'}`}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className={theme === 'dark' ? 'font-semibold text-white' : 'font-semibold text-gray-900'}>
                  {t('bookingsList')} ({selectedSlot?.bookings.length || 0})
                </h3>
                <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('bookingControlsDescription')}</p>
              </div>
              {selectedSlotTime && (
                <Button size="sm" variant="outline" onClick={onToggleCreateFormForSelectedSlot} className={theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : ''}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t('createBooking')}
                </Button>
              )}
            </div>

            {selectedSlot?.bookings && selectedSlot.bookings.length > 0 ? (
              <div className="space-y-3">
	                {selectedSlot.bookings.map((booking) => {
	                  const isExpanded = isBookingExpanded(booking.id);
	                  const editForm = editBookingForms[booking.id];
	                  const bookingCompletionMode = isBookingAwaitingCustomerCompletion(booking, t);
	                  const bookingMissingFields = getMissingCompletionFields(booking, t);
	                  const serviceItems = getBookingServiceItems(booking.service_name, getBookingServiceNameForCms);
	                  const collapsedServicePreview = getCollapsedServicePreview(serviceItems, t);

                  return (
                    <Card
                      key={booking.id}
	                      className={`overflow-hidden p-0 shadow-none ${theme === 'dark' ? 'border-white/10 bg-[#1C1C1E]' : 'border-gray-200 bg-white'}`}
	                    >
	                      <div className="space-y-5 p-4 sm:p-5">
		                        <div className="space-y-3">
					                          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(2.5rem,1fr)] items-center gap-3">
				                            <div className="min-w-0">
				                              <div className="flex h-10 min-w-0 items-center gap-2">
				                                <span className={`min-w-0 truncate font-mono text-2xl font-semibold leading-10 tracking-[-0.03em] ${theme === 'dark' ? 'text-white' : 'text-gray-950'}`}>
				                                  {booking.license_plate || '—'}
			                                </span>
				                                <span
				                                  title={bookingCompletionMode ? t('awaitingCustomerCompletion') : (booking.status || 'confirmed')}
				                                  className={`inline-flex h-10 w-6 shrink-0 items-center justify-center ${
				                                    bookingCompletionMode
				                                      ? theme === 'dark'
				                                        ? 'text-amber-300'
				                                        : 'text-amber-700'
				                                      : theme === 'dark'
				                                        ? 'text-emerald-300'
				                                        : 'text-emerald-700'
				                                  }`}
				                                >
				                                  {bookingCompletionMode ? <CircleAlert className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
			                                </span>
			                              </div>
			                            </div>
					                            <span
					                              className={`inline-flex h-10 shrink-0 items-center justify-self-center px-2 text-sm font-medium ${
					                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
					                              }`}
				                            >
			                              {t('resendCount')}: {resendCounts[booking.id] || 0}
			                            </span>
		                            <Button
		                              size="icon"
				                              variant="outline"
				                              aria-label={isExpanded ? t('collapseInformation') : t('fullInformation')}
				                              onClick={() => handleToggleBookingExpanded(booking, !isExpanded)}
				                              className={`h-10 w-10 shrink-0 justify-self-end rounded-md border-0 bg-transparent shadow-none ${theme === 'dark' ? 'text-white hover:bg-white/5' : 'hover:bg-gray-100'}`}
			                            >
		                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
		                            </Button>
			                          </div>

			                          {!isExpanded && (
			                            <div className="min-h-[44px] space-y-1" title={serviceItems.join(', ')}>
			                              {collapsedServicePreview.map((service, index) => (
			                                <p
			                                  key={`${service}-${index}`}
			                                  className={`truncate text-sm font-medium leading-5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}
			                                >
			                                  - {service}
			                                </p>
			                              ))}
			                            </div>
			                          )}

	                          {bookingCompletionMode && bookingMissingFields.length > 0 && (
	                            <p className={`rounded-md px-3 py-2 text-sm ${theme === 'dark' ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-700'}`}>
	                              {t('incompleteBookingWarning')}: {bookingMissingFields.join(', ')}
	                            </p>
	                          )}
	                        </div>

                        {isExpanded && (
                          <div className="space-y-4 border-t pt-5">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResendBookingConfirmation(booking)}
                                disabled={!booking.customer_email || resendingBookingId === booking.id}
                                className={`justify-start rounded-md ${theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : ''}`}
                              >
                                <Send className="mr-2 h-4 w-4 shrink-0" />
                                {resendingBookingId === booking.id
                                  ? t('sending')
                                  : (isBookingAwaitingCustomerCompletion(booking, t) ? t('requestCompletion') : t('resendConfirmation'))}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleForceConfirmBooking(booking)}
                                disabled={confirmingBookingId === booking.id}
                                className={`justify-start rounded-md ${theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : ''}`}
                              >
                                <Save className="mr-2 h-4 w-4 shrink-0" />
                                {confirmingBookingId === booking.id
                                  ? t('confirming')
                                  : t('forceConfirm')}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStartEditingBooking(booking)}
                                disabled={savingBookingId === booking.id}
                                className={`justify-start rounded-md ${theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : ''}`}
                              >
                                <Pencil className="mr-2 h-4 w-4 shrink-0" />
                                {t('editBooking')}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenMessageComposer(booking)}
                                disabled={!booking.customer_email || sendingMessageBookingId === booking.id}
                                className={`justify-start rounded-md ${theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : ''}`}
                              >
                                <MailPlus className="mr-2 h-4 w-4 shrink-0" />
                                {sendingMessageBookingId === booking.id ? t('sendingMessage') : t('sendMessage')}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openReceiptDialog(booking)}
                                disabled={!booking.customer_email}
                                className={`justify-start rounded-md ${theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : ''}`}
                              >
                                <FileText className="mr-2 h-4 w-4 shrink-0" />
                                {t('sendReceipt')}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleOpenCancelBookingDialog(booking)}
                                disabled={cancellingBookingId === booking.id}
                                className="justify-start rounded-md"
                              >
                                <Ban className="mr-2 h-4 w-4 shrink-0" />
                                {cancellingBookingId === booking.id ? t('cancelling') : t('cancelBooking')}
                              </Button>
	                          </div>

                            <BookingDetails booking={booking} getBookingServiceNameForCms={getBookingServiceNameForCms} language={language} t={t} theme={theme} />

                            {editingBookingId === booking.id && editForm && (
                              (() => {
                                const editCompletionMode = isBookingAwaitingCustomerCompletion(editForm, t);
                                const editCompletionMissingFields = getMissingCompletionFields(editForm, t);

                                return (
                              <AdminBookingEditPanel
                                awaitingCustomerCompletionStatus={awaitingCustomerCompletionStatus}
                                booking={booking}
                                currentServiceId={editBookingCurrentServiceId[booking.id] || ''}
                                editCompletionMissingFields={editCompletionMissingFields}
                                editCompletionMode={editCompletionMode}
                                form={editForm}
                                getSelectedServiceNames={getSelectedServiceNames}
                                language={language}
                                saving={savingBookingId === booking.id}
                                selectedCategory={editBookingSelectedCategory[booking.id] || ''}
                                selectedLanguageServiceCategories={selectedLanguageServiceCategories}
                                serviceIds={editBookingServiceIds[booking.id] || []}
                                setCurrentServiceId={(value) => setEditBookingCurrentServiceId((current) => ({ ...current, [booking.id]: value }))}
                                setSelectedCategory={(value) => setEditBookingSelectedCategory((current) => ({ ...current, [booking.id]: value }))}
                                setServiceIds={(serviceIds) => setEditBookingServiceIds((current) => ({ ...current, [booking.id]: serviceIds }))}
                                setEditingBookingId={setEditingBookingId}
                                syncServiceName={(serviceIds, bookingLanguage) => syncEditBookingServiceName(booking.id, serviceIds, bookingLanguage)}
                                t={t}
                                theme={theme}
                                onFieldChange={handleEditBookingFieldChange}
                                onSave={handleSaveBookingChanges}
                              />
                                );
                              })()
                            )}

	                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>{t('noBookings')}</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
    <Dialog open={Boolean(receiptBooking)} onOpenChange={(open) => !open && !sendingReceipt && setReceiptBooking(null)}>
      <DialogContent className={`max-h-[90vh] overflow-y-auto sm:max-w-3xl ${theme === 'dark' ? 'border-white/10 bg-[#16181D] text-white' : ''}`}>
        <DialogHeader>
          <DialogTitle>{t('sendReceipt')}</DialogTitle>
          <DialogDescription className={theme === 'dark' ? 'text-gray-400' : ''}>
            {receiptBooking
              ? `${receiptBooking.license_plate || '—'} · ${receiptBooking.booking_date} ${receiptBooking.booking_time?.slice(0, 5)}`
              : ''}
          </DialogDescription>
        </DialogHeader>

        {receiptBooking && (
          <div className="space-y-4">
            <div className={`grid gap-3 rounded-md border p-3 sm:grid-cols-3 ${theme === 'dark' ? 'border-white/10 bg-[#11141A]' : 'border-gray-200 bg-gray-50'}`}>
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-gray-500">{t('customer')}</p>
                <p className={`mt-1 text-sm font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{receiptBooking.customer_name || '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-gray-500">{t('email')}</p>
                <p className={`mt-1 break-all text-sm font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{receiptBooking.customer_email || '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-gray-500">{t('phone')}</p>
                <p className={`mt-1 text-sm font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{receiptBooking.customer_phone || '—'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                  {t('receiptLines')}
                </h4>
                <Button type="button" size="sm" variant="outline" onClick={addReceiptLine} className={theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : ''}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t('addLine')}
                </Button>
              </div>

              {receiptLines.map((line) => {
                const quantity = Math.max(1, Number.parseInt(line.quantity, 10) || 1);
                const lineTotal = parseEuroToCents(line.unitPrice) * quantity;

                return (
                  <div key={line.id} className={`grid gap-2 rounded-md border p-3 sm:grid-cols-[minmax(0,1fr)_80px_120px_90px_auto] ${theme === 'dark' ? 'border-white/10 bg-[#11141A]' : 'border-gray-200 bg-white'}`}>
                    <Input
                      value={line.title}
                      onChange={(event) => updateReceiptLine(line.id, { title: event.target.value })}
                      placeholder={t('serviceNamePlaceholder')}
                      className={theme === 'dark' ? 'border-white/10 bg-[#15171C] text-white' : ''}
                    />
                    <Input
                      value={line.quantity}
                      onChange={(event) => updateReceiptLine(line.id, { quantity: event.target.value.replace(/[^\d]/g, '') || '1' })}
                      inputMode="numeric"
                      className={theme === 'dark' ? 'border-white/10 bg-[#15171C] text-white' : ''}
                    />
                    <Input
                      value={line.unitPrice}
                      onChange={(event) => updateReceiptLine(line.id, { unitPrice: event.target.value })}
                      inputMode="decimal"
                      placeholder="0.00"
                      className={theme === 'dark' ? 'border-white/10 bg-[#15171C] text-white' : ''}
                    />
                    <div className={`flex h-10 items-center justify-end text-sm font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                      €{centsToEuro(lineTotal)}
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => removeReceiptLine(line.id)}
                      disabled={receiptLines.length === 1}
                      className={theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : ''}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2">
              <label className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('receiptEmailNote')}
              </label>
              <Textarea
                value={receiptNotes}
                onChange={(event) => setReceiptNotes(event.target.value)}
                rows={3}
                className={theme === 'dark' ? 'border-white/10 bg-[#11141A] text-white' : ''}
              />
            </div>

            <div className={`ml-auto w-full max-w-sm rounded-md border p-3 ${theme === 'dark' ? 'border-white/10 bg-[#11141A]' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex justify-between text-sm">
                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{t('vat25')}</span>
                <span className={theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}>€{centsToEuro(receiptVatCents)}</span>
              </div>
              <div className="mt-2 flex justify-between text-lg font-semibold">
                <span>{t('total')}</span>
                <span className="text-[#FF6B35]">€{centsToEuro(receiptTotalCents)}</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setReceiptBooking(null)} disabled={sendingReceipt} className={theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : ''}>
            {t('cancel')}
          </Button>
          <Button onClick={sendReceipt} disabled={sendingReceipt || !receiptBooking?.customer_email} className="bg-[#FF6B35] text-white hover:bg-[#FF6B35]/90">
            <Send className="mr-2 h-4 w-4" />
            {sendingReceipt ? t('sending') : t('sendReceipt')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
