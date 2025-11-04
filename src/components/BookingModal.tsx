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
}

export function BookingModal({ open, onOpenChange }: BookingModalProps) {
  const { t } = useLanguage();
  
  // Current step
  const [currentStep, setCurrentStep] = useState<BookingStep>('step1');
  
  // Step 1 data
  const [licensePlate, setLicensePlate] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  
  // Step 2 data
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [contactInfo, setContactInfo] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

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

  // Get selected service name for success screen
  const getServiceName = () => {
    // This would come from the actual service data in production
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
              onServiceChange={setSelectedServiceId}
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
