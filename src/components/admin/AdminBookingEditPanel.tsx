import React from 'react';

import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import type { SupportedBookingLanguage } from '../../utils/serviceCatalog';
import type { ScheduleBooking } from '../../utils/schedule';
import type { AdminBookingFormState } from './AdminSchedule.types';

interface BookingServiceSelectorProps {
  bookingLanguage: SupportedBookingLanguage;
  currentServiceId: string;
  getSelectedServiceNames: (serviceIds: string[], bookingLanguage: SupportedBookingLanguage) => string[];
  language: string;
  onCurrentServiceIdChange: (value: string) => void;
  onSelectedCategoryChange: (value: string) => void;
  onServiceIdsChange: (serviceIds: string[]) => void;
  readOnlyValue: string;
  selectedCategory: string;
  selectedLanguageServiceCategories: (bookingLanguage: SupportedBookingLanguage) => ReturnType<typeof import('../../utils/serviceCatalog').getLocalizedServiceCategories>;
  serviceIds: string[];
  syncServiceName: (serviceIds: string[], bookingLanguage: SupportedBookingLanguage) => void;
  t: (key: string) => string;
  theme: string;
}

function BookingServiceSelector({
  bookingLanguage,
  currentServiceId,
  getSelectedServiceNames,
  language,
  onCurrentServiceIdChange,
  onSelectedCategoryChange,
  onServiceIdsChange,
  readOnlyValue,
  selectedCategory,
  selectedLanguageServiceCategories,
  serviceIds,
  syncServiceName,
  t,
  theme,
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
                  <span className="sr-only">{language === 'fi' ? 'Poista palvelu' : 'Remove service'}</span>
                  ×
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

interface AdminBookingEditPanelProps {
  booking: ScheduleBooking;
  currentServiceId: string;
  editCompletionMissingFields: string[];
  editCompletionMode: boolean;
  form: AdminBookingFormState;
  getSelectedServiceNames: (serviceIds: string[], bookingLanguage: SupportedBookingLanguage) => string[];
  language: string;
  saving: boolean;
  selectedCategory: string;
  selectedLanguageServiceCategories: (bookingLanguage: SupportedBookingLanguage) => ReturnType<typeof import('../../utils/serviceCatalog').getLocalizedServiceCategories>;
  serviceIds: string[];
  setCurrentServiceId: (value: string) => void;
  setSelectedCategory: (value: string) => void;
  setServiceIds: (serviceIds: string[]) => void;
  setEditingBookingId: React.Dispatch<React.SetStateAction<string | null>>;
  syncServiceName: (serviceIds: string[], bookingLanguage: SupportedBookingLanguage) => void;
  t: (key: string) => string;
  theme: string;
  awaitingCustomerCompletionStatus: string;
  onFieldChange: (bookingId: string, field: keyof AdminBookingFormState, value: string) => void;
  onSave: (booking: ScheduleBooking) => void;
}

export function AdminBookingEditPanel({
  booking,
  currentServiceId,
  editCompletionMissingFields,
  editCompletionMode,
  form,
  getSelectedServiceNames,
  language,
  saving,
  selectedCategory,
  selectedLanguageServiceCategories,
  serviceIds,
  setCurrentServiceId,
  setSelectedCategory,
  setServiceIds,
  setEditingBookingId,
  syncServiceName,
  t,
  theme,
  awaitingCustomerCompletionStatus,
  onFieldChange,
  onSave,
}: AdminBookingEditPanelProps) {
  return (
    <div className={`rounded-md border p-4 ${theme === 'dark' ? 'border-white/10 bg-[#18181B]' : 'border-gray-200 bg-white'}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className={theme === 'dark' ? 'font-medium text-white' : 'font-medium text-gray-900'}>{t('editBooking')}</h4>
        <Button size="sm" variant="ghost" onClick={() => setEditingBookingId(null)}>
          {t('cancelEditing')}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('bookingLanguage')}</label>
          <Select
            value={form.booking_language}
            onValueChange={(value: SupportedBookingLanguage) => onFieldChange(booking.id, 'booking_language', value)}
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
          <Input value={form.license_plate} onChange={(e) => onFieldChange(booking.id, 'license_plate', e.target.value.toUpperCase())} />
        </div>

        <div className="space-y-2">
          <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('date')}</label>
          <Input type="date" value={form.booking_date} onChange={(e) => onFieldChange(booking.id, 'booking_date', e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('time')}</label>
          <Input type="time" value={form.booking_time} onChange={(e) => onFieldChange(booking.id, 'booking_time', e.target.value)} />
        </div>

        <BookingServiceSelector
          bookingLanguage={form.booking_language}
          currentServiceId={currentServiceId}
          getSelectedServiceNames={getSelectedServiceNames}
          language={language}
          onCurrentServiceIdChange={setCurrentServiceId}
          onSelectedCategoryChange={setSelectedCategory}
          onServiceIdsChange={setServiceIds}
          readOnlyValue={form.service_name}
          selectedCategory={selectedCategory}
          selectedLanguageServiceCategories={selectedLanguageServiceCategories}
          serviceIds={serviceIds}
          syncServiceName={syncServiceName}
          t={t}
          theme={theme}
        />

        <div className="space-y-2">
          <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('customerName')}</label>
          <Input value={form.customer_name} onChange={(e) => onFieldChange(booking.id, 'customer_name', e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('customerPhone')}</label>
          <Input value={form.customer_phone} onChange={(e) => onFieldChange(booking.id, 'customer_phone', e.target.value)} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('customerEmail')}</label>
          <Input type="email" value={form.customer_email} onChange={(e) => onFieldChange(booking.id, 'customer_email', e.target.value)} />
        </div>

        <div className={`sm:col-span-2 rounded-md border p-3 ${theme === 'dark' ? 'border-white/10 bg-[#15171C]' : 'border-gray-200 bg-gray-50'}`}>
          <label className="flex items-start gap-3">
            <Checkbox
              checked={form.status === awaitingCustomerCompletionStatus}
              onCheckedChange={(checked) => {
                onFieldChange(
                  booking.id,
                  'status',
                  checked === true ? awaitingCustomerCompletionStatus : 'confirmed',
                );
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

          {(editCompletionMode || editCompletionMissingFields.length > 0) && (
            <p className={`mt-3 text-sm ${theme === 'dark' ? 'text-amber-300' : 'text-amber-700'}`}>
              {t('incompleteBookingWarning')}: {editCompletionMissingFields.join(', ') || (language === 'fi' ? 'asiakastiedot' : 'customer details')}
            </p>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('notes')}</label>
          <Textarea
            value={form.notes}
            onChange={(e) => onFieldChange(booking.id, 'notes', e.target.value)}
            rows={3}
            className={theme === 'dark' ? 'border-white/10 bg-[#11141A] text-white' : ''}
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button onClick={() => onSave(booking)} disabled={saving} className="bg-[#FF6B35] hover:bg-[#FF6B35]/90">
          {saving ? t('saving') : t('saveChanges')}
        </Button>
        <Button variant="outline" onClick={() => setEditingBookingId(null)} className={theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : ''}>
          {t('cancel')}
        </Button>
      </div>
    </div>
  );
}
