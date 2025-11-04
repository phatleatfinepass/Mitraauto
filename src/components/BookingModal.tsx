import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Progress } from './ui/progress';
import { BookingStep1 } from './BookingStep1';
import { BookingStep2 } from './BookingStep2';
import { BookingStep3 } from './BookingStep3';
import { BookingSuccess } from './BookingSuccess';
import { useLanguage } from './LanguageContext';

type BookingStep = 'step1' | 'step2' | 'step3' | 'success';

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedService?: string;
  isFromServicesPage?: boolean;
}

export function BookingModal({ open, onOpenChange, preSelectedService, isFromServicesPage = false }: BookingModalProps) {
  const { t } = useLanguage();
  
  // Current step
  const [currentStep, setCurrentStep] = useState<BookingStep>('step1');
  
  // Step 1 data
  const [licensePlate, setLicensePlate] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  
  // Step 2 data - support both single and multiple services
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [contactInfo, setContactInfo] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  // Set pre-selected service when modal opens
  useEffect(() => {
    if (open && preSelectedService && isFromServicesPage) {
      // Map service name to service ID for Services page
      const serviceNameToId: Record<string, string> = {
        // Car Wash
        'Ulkopesu': 'exterior-wash',
        'Exterior Wash': 'exterior-wash',
        'Täyspesu': 'full-wash',
        'Full Wash': 'full-wash',
        'Sisäpuhdistus': 'interior-cleaning',
        'Interior Cleaning': 'interior-cleaning',
        'Moottorin pesu': 'engine-wash',
        'Engine Wash': 'engine-wash',
        // Maintenance
        'Pieni huolto': 'basic-service',
        'Basic Service': 'basic-service',
        'Iso huolto': 'large-service',
        'Large Service': 'large-service',
        'Ilmastoinnin huolto': 'ac-service',
        'AC Service': 'ac-service',
        'Jarruneste': 'brake-fluid',
        'Brake Fluid': 'brake-fluid',
        // Tire Work
        'Rengasasennus': 'tire-mounting',
        'Tire Mounting': 'tire-mounting',
        'Renkaiden irrotus': 'tire-removal',
        'Tire Removal': 'tire-removal',
        'Rengastasapainotus': 'wheel-balancing',
        'Wheel Balancing': 'wheel-balancing',
        'Renkaan korjaus': 'tire-repair',
        'Tire Repair': 'tire-repair',
        'TPMS-huolto': 'tpms-service',
        'TPMS Service': 'tpms-service',
        'Pyörän suuntaus': 'wheel-alignment',
        'Wheel Alignment': 'wheel-alignment',
      };
      const serviceId = serviceNameToId[preSelectedService];
      if (serviceId) {
        setSelectedServiceIds([serviceId]);
      }
    } else if (open && preSelectedService) {
      // For non-Services page bookings, use the old mapping
      const serviceNameToId: Record<string, string> = {
        'Tire Change': 'tire-change',
        'Rengasvaihto': 'tire-change',
        'Tire Storage': 'tire-hotel',
        'Rengashotelli': 'tire-hotel',
        'Vehicle Inspection': 'inspection',
        'Katsastus': 'inspection',
        'Oil Change': 'oil-change',
        'Öljynvaihto': 'oil-change',
      };
      const serviceId = serviceNameToId[preSelectedService];
      if (serviceId) {
        setSelectedServiceId(serviceId);
      }
    }
  }, [open, preSelectedService, isFromServicesPage]);

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
          phone: '',
          email: '',
          notes: '',
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleContactInfoChange = (field: string, value: string) => {
    setContactInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleStep1Continue = () => {
    setCurrentStep('step2');
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
    if (isFromServicesPage && selectedServiceIds.length > 0) {
      // Multiple services selected
      return selectedServiceIds.map(id => {
        const serviceMap: Record<string, string> = {
          // Car Wash
          'exterior-wash': 'Exterior Wash',
          'full-wash': 'Full Wash',
          'interior-cleaning': 'Interior Cleaning',
          'engine-wash': 'Engine Wash',
          // Maintenance
          'basic-service': 'Basic Service',
          'large-service': 'Large Service',
          'ac-service': 'AC Service',
          'brake-fluid': 'Brake Fluid',
          // Tire Work
          'tire-mounting': 'Tire Mounting',
          'tire-removal': 'Tire Removal',
          'wheel-balancing': 'Wheel Balancing',
          'tire-repair': 'Tire Repair',
          'tpms-service': 'TPMS Service',
          'wheel-alignment': 'Wheel Alignment',
        };
        return serviceMap[id] || 'Service';
      }).join(', ');
    }
    
    // Single service (old flow)
    const serviceMap: Record<string, string> = {
      'tire-change': 'Tire Change',
      'tire-hotel': 'Tire Storage',
      'inspection': 'Vehicle Inspection',
      'oil-change': 'Oil Change',
    };
    return selectedServiceId ? serviceMap[selectedServiceId] || 'Service' : 'Service';
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
                {currentStep === 'step1' ? 'Step 1 of 3' : 
                 currentStep === 'step2' ? 'Step 2 of 3' : 
                 'Step 3 of 3'}
              </span>
            )}
          </div>
          <DialogDescription>
            {currentStep === 'step1' 
              ? t('booking.step1.description')
              : currentStep === 'step2'
              ? 'Choose the service you need'
              : currentStep === 'step3'
              ? 'Enter your contact information'
              : t('booking.success.subtitle')
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
              onDateChange={setDate}
              onTimeSlotChange={setSelectedTimeSlot}
              onContinue={handleStep1Continue}
              onCancel={handleClose}
              t={t}
            />
          )}

          {currentStep === 'step2' && date && (
            <BookingStep2
              licensePlate={licensePlate}
              date={date}
              timeSlot={selectedTimeSlot || ''}
              selectedServiceId={selectedServiceId}
              selectedServiceIds={selectedServiceIds}
              isFromServicesPage={isFromServicesPage}
              onServiceChange={setSelectedServiceId}
              onServicesChange={setSelectedServiceIds}
              onBack={handleStep2Back}
              onEditStep1={handleEditStep1}
              onContinue={handleStep2Continue}
              t={t}
            />
          )}

          {currentStep === 'step3' && date && (
            <BookingStep3
              licensePlate={licensePlate}
              date={date}
              timeSlot={selectedTimeSlot || ''}
              serviceName={getServiceName()}
              contactInfo={contactInfo}
              onContactInfoChange={handleContactInfoChange}
              onBack={handleStep3Back}
              onEditStep1={handleEditStep1}
              onConfirm={handleConfirm}
              t={t}
            />
          )}

          {currentStep === 'success' && date && (
            <BookingSuccess
              licensePlate={licensePlate}
              date={date}
              timeSlot={selectedTimeSlot || ''}
              serviceName={getServiceName()}
              contactInfo={contactInfo}
              onClose={handleClose}
              t={t}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
