import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Progress } from './ui/progress';
import { BookingStep1 } from './BookingStep1';
import { BookingStep2 } from './BookingStep2';
import { BookingStep3 } from './BookingStep3';
import { BookingSuccess } from './BookingSuccess';
import { useLanguage } from './LanguageContext';
import { FINNISH_PHONE_PREFIX, normalizeFinnishPhoneInput } from '../utils/phone';

type BookingStep = 'step1' | 'step2' | 'step3' | 'success';

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedService?: string;
  prefill?: {
    installToken?: string;
    earliestDate?: string;
    contact?: {
      name?: string;
      phone?: string;
      email?: string;
    };
  } | null;
}

export function BookingModal({ open, onOpenChange, preSelectedService, prefill }: BookingModalProps) {
  const { t, language } = useLanguage();
  
  // Current step
  const [currentStep, setCurrentStep] = useState<BookingStep>('step1');
  
  // Step 1 data
  const [licensePlate, setLicensePlate] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  
  // Step 2 data - always use multiple services with dropdown system
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [contactInfo, setContactInfo] = useState({
    name: '',
    phone: FINNISH_PHONE_PREFIX,
    email: '',
    notes: '',
  });

  // Set pre-selected service when modal opens
  useEffect(() => {
    if (!open) {
      return;
    }

    // Always use dropdown system with multiple services
    if (preSelectedService) {
      // If service ID is directly provided (from Services page)
      setSelectedServiceIds([preSelectedService]);
    } else {
      // No pre-selected service - start fresh
      setSelectedServiceIds([]);
    }
    setSelectedServiceId(null);
    if (prefill?.earliestDate) {
      setDate(new Date(`${prefill.earliestDate}T12:00:00`));
    }
    if (prefill?.contact) {
      setContactInfo((current) => ({
        ...current,
        name: prefill.contact?.name || current.name,
        phone: prefill.contact?.phone || current.phone,
        email: prefill.contact?.email || current.email,
      }));
    }
  }, [open, preSelectedService, prefill]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      // Delay reset to avoid visual glitch during close animation
      const timer = setTimeout(() => {
        setCurrentStep('step1');
        setLicensePlate('');
        setDate(undefined);
        setSelectedTimeSlot(null);
        setSelectedServiceId(null);
        setSelectedServiceIds([]);
        setContactInfo({
          name: '',
          phone: FINNISH_PHONE_PREFIX,
          email: '',
          notes: '',
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleContactInfoChange = (field: string, value: string) => {
    setContactInfo(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleStep1Continue = () => {
    setCurrentStep('step2');
  };

  const handleDateChange = (nextDate: Date | undefined) => {
    setDate(nextDate);
    setSelectedTimeSlot(null);
  };

  const handleStep2Back = () => {
    setCurrentStep('step1');
  };

  const handleStep2Continue = () => {
    setCurrentStep('step3');
  };

  const handleStep3Back = () => {
    setCurrentStep('step2');
  };

  const handleEditStep1 = () => {
    setCurrentStep('step1');
  };

  const handleConfirm = () => {
    setCurrentStep('success');
  };

  // Calculate progress
  const progress = 
    currentStep === 'step1' ? 33 : 
    currentStep === 'step2' ? 66 : 
    currentStep === 'step3' ? 100 : 
    100;

  // Get selected service name(s) for success screen
  const getServiceName = () => {
    const serviceMap: Record<string, string> = {
      'basic-hand-wash-car': `${t('service.basicHandWash')} · ${t('vehicle.passengerCar')}`,
      'basic-hand-wash-suv': `${t('service.basicHandWash')} · ${t('vehicle.suv')}`,
      'quick-wax-car': `${t('service.quickWax')} · ${t('vehicle.passengerCar')}`,
      'quick-wax-suv': `${t('service.quickWax')} · ${t('vehicle.suv')}`,
      'interior-cleaning-car': `${t('service.interiorCleaning')} · ${t('vehicle.passengerCar')}`,
      'interior-cleaning-suv': `${t('service.interiorCleaning')} · ${t('vehicle.suv')}`,
      'super-exterior-wash-car': `${t('service.premiumExteriorWash')} · ${t('vehicle.passengerCar')}`,
      'super-exterior-wash-suv': `${t('service.premiumExteriorWash')} · ${t('vehicle.suv')}`,
      'hard-wax-car': `${t('service.hardWaxProtection')} · ${t('vehicle.passengerCar')}`,
      'hard-wax-suv': `${t('service.hardWaxProtection')} · ${t('vehicle.suv')}`,
      'engine-wash': t('service.engineWash'),
      'wheel-wash-set': t('service.wheelWash'),
      'tire-change-car': t('service.tireChangeCar'),
      'tire-change-suv': t('service.tireChangeSuv'),
      'tire-change-van': t('service.tireChangeVan'),
      'wheel-balancing': t('service.wheelBalancing'),
      'tire-repair-outside': t('service.externalRepair'),
      'tire-repair-inside': t('service.internalRepair'),
      'tire-work-up-to-17': t('service.tireWorkUpTo17'),
      'tire-work-18-19': t('service.tireWork18To19'),
      'tire-work-20-21': t('service.tireWork20To21'),
      'tire-hotel-storage': t('service.tireHotelStorage'),
      'error-code-reading': t('service.errorCodeReading'),
      'troubleshooting': t('service.troubleshooting'),
      'engine-oil-change': t('service.engineOilChange'),
      'seasonal-maintenance': t('service.seasonalMaintenance'),
      'annual-maintenance': t('service.annualMaintenance'),
      'manual-gearbox-oil': t('service.manualGearboxOil'),
      'automatic-gearbox-oil': t('service.automaticGearboxOil'),
      'automatic-gearbox-flush': t('service.automaticGearboxFlush'),
      'brake-fluid': t('service.brakeFluid'),
      'pedal-installation': t('service.pedalInstallation'),
      'rust-repair': t('service.rustRepair'),
      'ac-service-r134a': t('service.acServiceR134a'),
      'ac-extra-refrigerant': t('service.extraRefrigerant'),
      'ac-hybrid-extra-r134a': t('service.hybridSurcharge'),
      'ac-service-r1234yf': t('service.acServiceR1234yf'),
      'ac-hybrid-extra-r1234yf': t('service.hybridSurcharge'),
      'ac-service-electric': t('service.acServiceElectric'),
      'ac-diagnostics': t('service.acDiagnostics'),
    };

    if (selectedServiceIds.length > 0) {
      return selectedServiceIds.map((id) => serviceMap[id] || 'Service').join(', ');
    }
    
    return 'Service';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent 
        className="w-full min-w-[320px] max-w-[calc(100vw-2rem)] sm:max-w-[640px] md:max-w-[720px] lg:max-w-[880px] max-h-[90vh] overflow-y-auto"
      >
        {/* Subtle Gradient Blobs Background */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none rounded-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-blob" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl animate-blob animation-delay-2000" />
        </div>

        {/* Header */}
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">
              {t('booking.title')}
            </DialogTitle>
            {currentStep !== 'success' && (
              <span className="text-sm text-muted-foreground">
                {currentStep === 'step1' ? t('booking.step1of3') : 
                 currentStep === 'step2' ? t('booking.step2of3') : 
                 t('booking.step3of3')}
              </span>
            )}
          </div>
          <DialogDescription>
            {currentStep === 'step1' 
              ? t('booking.step1.description')
              : currentStep === 'step2'
              ? t('booking.step2.modalDescription')
              : currentStep === 'step3'
              ? t('booking.step3.description')
              : t('booking.success.description')
            }
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        {currentStep !== 'success' && (
          <div className="mb-6">
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {/* Step Content */}
        <div className="animate-in fade-in slide-in-from-right-5 duration-300">
          {currentStep === 'step1' && (
            <BookingStep1
              licensePlate={licensePlate}
              date={date}
              selectedTimeSlot={selectedTimeSlot}
              onLicensePlateChange={setLicensePlate}
              onDateChange={handleDateChange}
              onTimeSlotChange={setSelectedTimeSlot}
              onContinue={handleStep1Continue}
              onCancel={handleClose}
              language={language}
              t={t}
              minimumDate={prefill?.earliestDate ? new Date(`${prefill.earliestDate}T12:00:00`) : undefined}
            />
          )}

          {currentStep === 'step2' && date && (
            <BookingStep2
              licensePlate={licensePlate}
              date={date}
              timeSlot={selectedTimeSlot || ''}
              selectedServiceId={selectedServiceId}
              selectedServiceIds={selectedServiceIds}
              onServiceChange={setSelectedServiceId}
              onServicesChange={setSelectedServiceIds}
              onBack={handleStep2Back}
              onEditStep1={handleEditStep1}
              onContinue={handleStep2Continue}
              t={t}
              locale={language === 'fi' ? 'fi-FI' : 'en-US'}
              orderInstallToken={prefill?.installToken}
            />
          )}

          {currentStep === 'step3' && date && (
            <BookingStep3
              licensePlate={licensePlate}
              date={date}
              timeSlot={selectedTimeSlot || ''}
              serviceName={getServiceName()}
              language={language}
              contactInfo={contactInfo}
              onContactInfoChange={handleContactInfoChange}
              onBack={handleStep3Back}
              onEditStep1={handleEditStep1}
              onConfirm={handleConfirm}
              t={t}
              locale={language === 'fi' ? 'fi-FI' : 'en-US'}
            />
          )}

          {currentStep === 'success' && date && (
            <BookingSuccess
              licensePlate={licensePlate}
              date={date}
              timeSlot={selectedTimeSlot || ''}
              serviceName={getServiceName()}
              language={language}
              contactInfo={contactInfo}
              onClose={handleClose}
              t={t}
              locale={language === 'fi' ? 'fi-FI' : 'en-US'}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
