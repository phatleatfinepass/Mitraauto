import React from 'react';
import {
  Ban,
  ChevronDown,
  ChevronUp,
  Mail,
  MailPlus,
  Pencil,
  Phone,
  PlusCircle,
  Save,
  Send,
  StickyNote,
  User,
  Wrench,
  X,
} from 'lucide-react';

import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Checkbox } from '../../ui/checkbox';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../../ui/sheet';
import { Textarea } from '../../ui/textarea';
import type { SupportedBookingLanguage } from '../../../utils/serviceCatalog';
import type { ScheduleBooking, ScheduleTimeSlot } from '../../../utils/schedule';
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

  return (
    <div className="space-y-2 sm:col-span-2">
      <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('serviceName')}</label>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <Select
          value={selectedCategory || undefined}
          onValueChange={(value) => {
            onSelectedCategoryChange(value);
            onCurrentServiceIdChange('');
          }}
        >
          <SelectTrigger className={theme === 'dark' ? 'border-white/10 bg-[#11141A] text-white' : ''}>
            <SelectValue placeholder={language === 'fi' ? 'Valitse kategoria' : 'Select category'} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentServiceId || undefined} onValueChange={onCurrentServiceIdChange} disabled={!selectedCategory}>
          <SelectTrigger className={theme === 'dark' ? 'border-white/10 bg-[#11141A] text-white' : ''}>
            <SelectValue placeholder={t('servicePlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {selectedServices.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                {service.name}
                {'price' in service ? ` · €${service.price.toFixed(2)}` : ''}
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
            const nextServiceIds = [...serviceIds, currentServiceId];
            onServiceIdsChange(nextServiceIds);
            syncServiceName(nextServiceIds, bookingLanguage);
            onCurrentServiceIdChange('');
            onSelectedCategoryChange('');
          }}
        >
          {language === 'fi' ? 'Lisää' : 'Add'}
        </Button>
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
                  }}
                  className="rounded-full hover:bg-black/10"
                  aria-label={language === 'fi' ? 'Poista palvelu' : 'Remove service'}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </Badge>
            );
          })}
        </div>
      ) : (
        <p className={`mt-3 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {language === 'fi' ? 'Lisätyt palvelut näkyvät täällä.' : 'Added services will appear here.'}
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
  t,
  theme,
}: {
  booking: ScheduleBooking;
  getBookingServiceNameForCms: (serviceName?: string | null) => string;
  t: (key: string) => string;
  theme: string;
}) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-12">
      {booking.service_name && (
        <div className={`min-w-0 rounded-md border p-4 sm:col-span-2 xl:col-span-12 ${theme === 'dark' ? 'border-white/10 bg-[#15171C]' : 'border-gray-200 bg-[#FCFCFC]'}`}>
          <dt className={`mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <Wrench className="h-4 w-4 shrink-0" />
            {t('serviceName')}
          </dt>
          <dd className={`text-base font-medium leading-7 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
            {getBookingServiceNameForCms(booking.service_name)}
          </dd>
        </div>
      )}
      {booking.customer_name && (
        <div className={`min-w-0 rounded-md border p-4 xl:col-span-4 ${theme === 'dark' ? 'border-white/10 bg-[#15171C]' : 'border-gray-200 bg-[#FCFCFC]'}`}>
          <dt className={`mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <User className="h-4 w-4 shrink-0" />
            {t('customerName')}
          </dt>
          <dd className={`text-base font-medium leading-7 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{booking.customer_name}</dd>
        </div>
      )}
      {booking.customer_phone && (
        <div className={`min-w-0 rounded-md border p-4 xl:col-span-4 ${theme === 'dark' ? 'border-white/10 bg-[#15171C]' : 'border-gray-200 bg-[#FCFCFC]'}`}>
          <dt className={`mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <Phone className="h-4 w-4 shrink-0" />
            {t('customerPhone')}
          </dt>
          <dd className={`text-base font-medium leading-7 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{booking.customer_phone}</dd>
        </div>
      )}
      {booking.customer_email && (
        <div className={`min-w-0 rounded-md border p-4 sm:col-span-2 xl:col-span-4 ${theme === 'dark' ? 'border-white/10 bg-[#15171C]' : 'border-gray-200 bg-[#FCFCFC]'}`}>
          <dt className={`mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <Mail className="h-4 w-4 shrink-0" />
            {t('customerEmail')}
          </dt>
          <dd className={`break-all text-base font-medium leading-7 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{booking.customer_email}</dd>
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

function isBookingAwaitingCustomerCompletion(booking: Partial<ScheduleBooking> | AdminBookingFormState, language: string) {
  return normalizeBookingStatus(booking.status) === awaitingCustomerCompletionStatus || getMissingCompletionFields(booking, language).length > 0;
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
  const createBookingCompletionMode = isBookingAwaitingCustomerCompletion(createBookingForm, language);
  const createBookingMissingFields = getMissingCompletionFields(createBookingForm, language);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={`w-full overflow-y-auto sm:max-w-xl ${theme === 'dark' ? 'border-white/10 bg-[#1C1C1E]' : 'border-gray-200 bg-white'}`}
      >
        <SheetHeader className={theme === 'dark' ? 'border-b border-white/10' : 'border-b border-gray-200'}>
          <SheetTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{t('slotDetails')}</SheetTitle>
          <SheetDescription className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            {selectedDate.toLocaleDateString(language === 'fi' ? 'fi-FI' : 'en-US', {
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
                        {t('incompleteBookingWarning')}: {createBookingMissingFields.join(', ') || (language === 'fi' ? 'asiakastiedot' : 'customer details')}
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
              <div className="grid gap-3 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-gray-500">{t('slotSummary')}</p>
                  <p className={`mt-1 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {selectedDate.toLocaleDateString(language === 'fi' ? 'fi-FI' : 'en-US', {
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
                <div>
                  <p className="text-xs text-gray-500">{t('blockReason')}</p>
                  <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {selectedSlot?.isBlocked ? selectedSlot.blockReason || t('noBlockReason') : '—'}
                  </p>
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
                  const bookingCompletionMode = isBookingAwaitingCustomerCompletion(booking, language);
                  const bookingMissingFields = getMissingCompletionFields(booking, language);

                  return (
                    <Card
                      key={booking.id}
                      className={`overflow-hidden p-0 shadow-none ${theme === 'dark' ? 'border-white/10 bg-[#1C1C1E]' : 'border-gray-200 bg-white'}`}
                    >
                      <div className="space-y-5 p-4 sm:p-5">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0 flex-1 space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className={`font-mono text-[2rem] font-semibold tracking-[-0.04em] ${theme === 'dark' ? 'text-white' : 'text-gray-950'}`}>
                                {booking.license_plate}
                              </span>
                              <span
                                className={`inline-flex items-center rounded-md border px-2.5 py-1 text-sm font-medium ${
                                  theme === 'dark' ? 'border-white/10 text-gray-300' : 'border-gray-300 text-gray-700'
                                }`}
                              >
                                {t('resendCount')}: {resendCounts[booking.id] || 0}
                              </span>
                              <Badge variant={bookingCompletionMode ? 'secondary' : 'outline'}>
                                {bookingCompletionMode ? t('awaitingCustomerCompletion') : (booking.status || 'confirmed')}
                              </Badge>
                            </div>
                            {bookingCompletionMode && bookingMissingFields.length > 0 && (
                              <p className={`text-sm ${theme === 'dark' ? 'text-amber-300' : 'text-amber-700'}`}>
                                {t('incompleteBookingWarning')}: {bookingMissingFields.join(', ')}
                              </p>
                            )}

                            <div className="grid gap-3 sm:grid-cols-3">
                              <div className={`rounded-md border p-3 ${theme === 'dark' ? 'border-white/10 bg-[#15171C]' : 'border-gray-200 bg-[#FCFCFC]'}`}>
                                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">{t('bookingSummaryService')}</p>
                                <p className={`mt-2 text-sm font-medium leading-6 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                                  {getBookingServiceNameForCms(booking.service_name)}
                                </p>
                              </div>
                              <div className={`rounded-md border p-3 ${theme === 'dark' ? 'border-white/10 bg-[#15171C]' : 'border-gray-200 bg-[#FCFCFC]'}`}>
                                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">{t('bookingSummaryCustomer')}</p>
                                <p className={`mt-2 text-sm font-medium leading-6 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{booking.customer_name || '—'}</p>
                              </div>
                              <div className={`rounded-md border p-3 ${theme === 'dark' ? 'border-white/10 bg-[#15171C]' : 'border-gray-200 bg-[#FCFCFC]'}`}>
                                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">{t('createdAt')}</p>
                                <p className={`mt-2 text-sm leading-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {new Date(booking.created_at).toLocaleString(language === 'fi' ? 'fi-FI' : 'en-US')}
                                </p>
                              </div>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleBookingExpanded(booking, !isExpanded)}
                            className={`min-w-[220px] justify-center rounded-md ${theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : ''}`}
                          >
                            {isExpanded ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                            {isExpanded ? t('collapseInformation') : t('fullInformation')}
                          </Button>
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
                                  : (isBookingAwaitingCustomerCompletion(booking, language) ? t('requestCompletion') : t('resendConfirmation'))}
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
                                  ? (language === 'fi' ? 'Vahvistetaan...' : 'Confirming...')
                                  : (language === 'fi' ? 'Pakota vahvistus' : 'Force confirm')}
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
                                variant="destructive"
                                onClick={() => handleOpenCancelBookingDialog(booking)}
                                disabled={cancellingBookingId === booking.id}
                                className="justify-start rounded-md"
                              >
                                <Ban className="mr-2 h-4 w-4 shrink-0" />
                                {cancellingBookingId === booking.id ? t('cancelling') : t('cancelBooking')}
                              </Button>
                            </div>

                            <BookingDetails booking={booking} getBookingServiceNameForCms={getBookingServiceNameForCms} t={t} theme={theme} />

                            {editingBookingId === booking.id && editForm && (
                              (() => {
                                const editCompletionMode = isBookingAwaitingCustomerCompletion(editForm, language);
                                const editCompletionMissingFields = getMissingCompletionFields(editForm, language);

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

                            {booking.customer_email && (
                              <div className={`rounded-md border p-4 ${theme === 'dark' ? 'border-white/10 bg-[#18181B]' : 'border-gray-200 bg-white'}`}>
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <h4 className={theme === 'dark' ? 'font-medium text-white' : 'font-medium text-gray-900'}>
                                      {language === 'fi' ? 'Viestintä' : 'Communication'}
                                    </h4>
                                    <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {language === 'fi'
                                        ? 'Avaa viestintäkeskus nähdäksesi ketjun ja vastataksesi asiakkaalle.'
                                        : 'Open the communication hub to review the thread and reply to the customer.'}
                                    </p>
                                  </div>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenMessageComposer(booking)}
                                    disabled={sendingMessageBookingId === booking.id}
                                    className={`justify-start rounded-md ${theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : ''}`}
                                  >
                                    <MailPlus className="mr-2 h-4 w-4 shrink-0" />
                                    {language === 'fi' ? 'Avaa viestit' : 'Open messages'}
                                  </Button>
                                </div>
                              </div>
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
  );
}
