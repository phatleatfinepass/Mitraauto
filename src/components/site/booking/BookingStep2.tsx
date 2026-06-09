import React, { useState } from 'react';
import { AlertCircle, Plus, X } from 'lucide-react';
import { BookingSummaryCard } from './BookingSummaryCard';
import { Button } from '../../ui/button';
import { Alert, AlertDescription } from '../../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { getLocalizedServiceCategories, type SupportedBookingLanguage } from '../../../utils/serviceCatalog';

interface BookingStep2Props {
  licensePlate: string;
  date: Date;
  timeSlot: string;
  selectedServiceId: string | null;
  selectedServiceIds?: string[];
  isFromServicesPage?: boolean;
  onServiceChange: (serviceId: string) => void;
  onServicesChange?: (serviceIds: string[]) => void;
  onBack: () => void;
  onEditStep1: () => void;
  onContinue: () => void;
  t: (key: string) => string;
  language?: SupportedBookingLanguage;
  locale?: string;
  orderInstallToken?: string | null;
}

export function BookingStep2({
  licensePlate,
  date,
  timeSlot,
  selectedServiceId,
  selectedServiceIds = [],
  isFromServicesPage = false,
  onServiceChange,
  onServicesChange,
  onBack,
  onEditStep1,
  onContinue,
  t,
  language = 'fi',
  locale = 'fi-FI',
}: BookingStep2Props) {
  const [error, setError] = useState<string>('');
  const serviceCategories = getLocalizedServiceCategories(language);
  
  // For dropdown UI (Services page flow)
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currentServiceId, setCurrentServiceId] = useState<string>('');
  
  // Initialize category if service is pre-selected
  React.useEffect(() => {
    if (selectedServiceIds.length > 0 && !selectedCategory) {
      const firstServiceId = selectedServiceIds[0];
      const category = serviceCategories.find(cat => 
        cat.services.some(s => s.id === firstServiceId)
      );
      if (category) {
        setSelectedCategory(category.id);
      }
    }
  }, [selectedServiceIds, selectedCategory]);

  const validateAndContinue = () => {
    setError('');

    // Always validate for multiple services (new default)
    if (selectedServiceIds.length === 0) {
      setError(t('booking.step2.selectAtLeastOne'));
      return;
    }

    onContinue();
  };
  
  const handleAddService = () => {
    if (!currentServiceId || !onServicesChange) return;
    
    // Check if service is already added
    if (selectedServiceIds.includes(currentServiceId)) {
      setError(t('booking.step2.serviceAlreadyAdded'));
      return;
    }
    
    // Add the service
    onServicesChange([...selectedServiceIds, currentServiceId]);
    
    // Reset both dropdowns to initial state
    setSelectedCategory('');
    setCurrentServiceId('');
    setError('');
  };
  
  const handleRemoveService = (serviceId: string) => {
    if (!onServicesChange) return;
    onServicesChange(selectedServiceIds.filter(id => id !== serviceId));
    setError('');
  };
  
  const getServiceDetails = (serviceId: string) => {
    for (const category of serviceCategories) {
      const service = category.services.find(s => s.id === serviceId);
      if (service) return service;
    }
    return null;
  };
  
  const getCategoryServices = () => {
    const category = serviceCategories.find(c => c.id === selectedCategory);
    return category?.services || [];
  };

  const formatServicePrice = (price: number) => {
    return price > 0 ? `€${price.toFixed(2)}` : t('service.vehicleSpecificQuote');
  };

  const canContinue = selectedServiceIds.length > 0;

  return (
    <div className="space-y-6">
      {/* Desktop: Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Service Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              {t('booking.step2.intro')}
            </p>
            
            <div className="space-y-5" id="services-page-multi-select">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    {t('booking.step2.selectCategory')}
                  </label>
                  <Select
                    value={selectedCategory || undefined}
                    onValueChange={(value) => {
                      setSelectedCategory(value);
                      setCurrentServiceId('');
                      setError('');
                    }}
                  >
                    <SelectTrigger aria-label={t('booking.step2.selectCategory')}>
                      <SelectValue placeholder={t('booking.step2.chooseCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    {t('booking.step2.selectService')}
                  </label>
                  <Select
                    value={currentServiceId || undefined}
                    onValueChange={(value) => {
                      setCurrentServiceId(value);
                      setError('');
                    }}
                    disabled={!selectedCategory}
                  >
                    <SelectTrigger aria-label={t('booking.step2.selectService')} disabled={!selectedCategory}>
                      <SelectValue placeholder={t('booking.step2.chooseService')} />
                    </SelectTrigger>
                    <SelectContent>
                      {getCategoryServices().map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} · {formatServicePrice(service.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  onClick={handleAddService}
                  disabled={!currentServiceId}
                  variant="secondary"
                  className="mt-6 sm:mt-auto sm:self-end"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t('booking.step2.addService')}
                </Button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">{t('booking.step2.selectedServices')}</h4>
                {selectedServiceIds.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedServiceIds.map((serviceId) => {
                      const service = getServiceDetails(serviceId);
                      if (!service) return null;
                      return (
                        <Badge
                          key={serviceId}
                          variant="secondary"
                          className="flex items-center gap-2 py-1 pr-2"
                        >
                          <span className="text-xs font-medium">{service.name}</span>
                          <span className="text-[10px] text-muted-foreground">{formatServicePrice(service.price)}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveService(serviceId)}
                            className="rounded-full p-0.5 hover:bg-secondary-foreground/10 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            aria-label={`${t('booking.step2.removeService')}: ${service.name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t('booking.step2.emptySelection')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Summary (Desktop) */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-6">
            <BookingSummaryCard
              licensePlate={licensePlate}
              date={date}
              timeSlot={timeSlot}
              onEdit={onEditStep1}
              t={t}
              locale={locale}
            />
          </div>
        </div>
      </div>

      {/* Mobile Summary */}
      <div className="lg:hidden">
        <BookingSummaryCard
          licensePlate={licensePlate}
          date={date}
          timeSlot={timeSlot}
          onEdit={onEditStep1}
          compact
          t={t}
          locale={locale}
        />
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onBack}
          className="w-full sm:w-auto"
        >
          {t('booking.back')}
        </Button>
        <Button
          id="cta_continue_step2"
          onClick={validateAndContinue}
          className="w-full sm:flex-1"
          disabled={!canContinue}
        >
          {t('booking.continue')}
        </Button>
      </div>
    </div>
  );
}
