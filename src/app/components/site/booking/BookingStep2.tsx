import React, { useState } from 'react';
import { AlertCircle, Plus, X } from 'lucide-react';
import { BookingSummaryCard } from './BookingSummaryCard';
import { Button } from '../../ui/button';
import { Alert, AlertDescription } from '../../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';

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
  locale?: string;
}

// Categorized services for Services Page flow
interface ServiceCategory {
  id: string;
  name: string;
  services: {
    id: string;
    name: string;
    price: number;
  }[];
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
  locale = 'fi-FI',
}: BookingStep2Props) {
  const [error, setError] = useState<string>('');
  const serviceCategories: ServiceCategory[] = [
    {
      id: 'car-care',
      name: t('serviceCategory.carCare'),
      services: [
        { id: 'basic-hand-wash-car', name: `${t('service.basicHandWash')} · ${t('vehicle.passengerCar')}`, price: 25.00 },
        { id: 'basic-hand-wash-suv', name: `${t('service.basicHandWash')} · ${t('vehicle.suv')}`, price: 30.00 },
        { id: 'quick-wax-car', name: `${t('service.quickWax')} · ${t('vehicle.passengerCar')}`, price: 30.00 },
        { id: 'quick-wax-suv', name: `${t('service.quickWax')} · ${t('vehicle.suv')}`, price: 40.00 },
        { id: 'interior-cleaning-car', name: `${t('service.interiorCleaning')} · ${t('vehicle.passengerCar')}`, price: 40.00 },
        { id: 'interior-cleaning-suv', name: `${t('service.interiorCleaning')} · ${t('vehicle.suv')}`, price: 50.00 },
        { id: 'super-exterior-wash-car', name: `${t('service.premiumExteriorWash')} · ${t('vehicle.passengerCar')}`, price: 45.00 },
        { id: 'super-exterior-wash-suv', name: `${t('service.premiumExteriorWash')} · ${t('vehicle.suv')}`, price: 55.00 },
        { id: 'hard-wax-car', name: `${t('service.hardWaxProtection')} · ${t('vehicle.passengerCar')}`, price: 110.00 },
        { id: 'hard-wax-suv', name: `${t('service.hardWaxProtection')} · ${t('vehicle.suv')}`, price: 130.00 },
        { id: 'engine-wash', name: t('service.engineWash'), price: 60.00 },
        { id: 'wheel-wash-set', name: t('service.wheelWash'), price: 10.00 },
      ],
    },
    {
      id: 'tire-services',
      name: t('serviceCategory.tireServices'),
      services: [
        { id: 'tire-change-car', name: t('service.tireChangeCar'), price: 30.00 },
        { id: 'tire-change-suv', name: t('service.tireChangeSuv'), price: 35.00 },
        { id: 'tire-change-van', name: t('service.tireChangeVan'), price: 45.00 },
        { id: 'wheel-balancing', name: t('service.wheelBalancing'), price: 20.00 },
        { id: 'tire-repair-outside', name: t('service.externalRepair'), price: 25.00 },
        { id: 'tire-repair-inside', name: t('service.internalRepair'), price: 50.00 },
        { id: 'tire-work-up-to-17', name: t('service.tireWorkUpTo17'), price: 80.00 },
        { id: 'tire-work-18-19', name: t('service.tireWork18To19'), price: 90.00 },
        { id: 'tire-work-20-21', name: t('service.tireWork20To21'), price: 100.00 },
        { id: 'tire-hotel-storage', name: t('service.tireHotelStorage'), price: 60.00 },
      ],
    },
    {
      id: 'diagnostics-maintenance',
      name: t('serviceCategory.diagnosticsMaintenance'),
      services: [
        { id: 'error-code-reading', name: t('service.errorCodeReading'), price: 20.00 },
        { id: 'troubleshooting', name: t('service.troubleshooting'), price: 80.00 },
        { id: 'engine-oil-change', name: t('service.engineOilChange'), price: 80.00 },
        { id: 'seasonal-maintenance', name: t('service.seasonalMaintenance'), price: 120.00 },
        { id: 'annual-maintenance', name: t('service.annualMaintenance'), price: 170.00 },
        { id: 'manual-gearbox-oil', name: t('service.manualGearboxOil'), price: 80.00 },
        { id: 'automatic-gearbox-oil', name: t('service.automaticGearboxOil'), price: 180.00 },
        { id: 'automatic-gearbox-flush', name: t('service.automaticGearboxFlush'), price: 220.00 },
        { id: 'brake-fluid', name: t('service.brakeFluid'), price: 65.00 },
        { id: 'pedal-installation', name: t('service.pedalInstallation'), price: 260.00 },
        { id: 'rust-repair', name: t('service.rustRepair'), price: 80.00 },
      ],
    },
    {
      id: 'ac-service',
      name: t('serviceCategory.acService'),
      services: [
        { id: 'ac-service-r134a', name: t('service.acServiceR134a'), price: 60.00 },
        { id: 'ac-extra-refrigerant', name: t('service.extraRefrigerant'), price: 10.00 },
        { id: 'ac-hybrid-extra-r134a', name: t('service.hybridSurcharge'), price: 15.00 },
        { id: 'ac-service-r1234yf', name: t('service.acServiceR1234yf'), price: 70.00 },
        { id: 'ac-hybrid-extra-r1234yf', name: t('service.hybridSurcharge'), price: 15.00 },
        { id: 'ac-service-electric', name: t('service.acServiceElectric'), price: 120.00 },
        { id: 'ac-diagnostics', name: t('service.acDiagnostics'), price: 80.00 },
      ],
    },
  ];
  
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
                          {service.name} · €{service.price.toFixed(2)}
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
                          <span className="text-[10px] text-muted-foreground">€{service.price.toFixed(2)}</span>
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
