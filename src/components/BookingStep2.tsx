import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { ServiceCardList, Service } from './ServiceCard';
import { BookingSummaryCard } from './BookingSummaryCard';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';

interface BookingStep2Props {
  licensePlate: string;
  date: Date;
  timeSlot: string;
  selectedServiceId: string | null;
  onServiceChange: (serviceId: string) => void;
  onBack: () => void;
  onEditStep1: () => void;
  onContinue: () => void;
  t: (key: string) => string;
}

// Mock services - in production, fetch from CMS
const mockServices: Service[] = [
  {
    id: 'tire-change',
    name: 'Tire Change',
    duration: '45 min',
    price: 49.90,
    description: 'Professional tire change service with balance check',
  },
  {
    id: 'tire-hotel',
    name: 'Tire Storage',
    duration: '15 min',
    price: 99.00,
    description: 'Seasonal tire storage in climate-controlled facility',
  },
  {
    id: 'inspection',
    name: 'Vehicle Inspection',
    duration: '60 min',
    price: 89.00,
    description: 'Comprehensive vehicle safety inspection',
  },
  {
    id: 'oil-change',
    name: 'Oil Change',
    duration: '30 min',
    price: 69.00,
    description: 'Full oil change with filter replacement',
  },
];

export function BookingStep2({
  licensePlate,
  date,
  timeSlot,
  selectedServiceId,
  onServiceChange,
  onBack,
  onEditStep1,
  onContinue,
  t,
}: BookingStep2Props) {
  const [error, setError] = useState<string>('');

  const validateAndContinue = () => {
    setError('');

    // Validate service
    if (!selectedServiceId) {
      setError('Please select a service to continue');
      return;
    }

    onContinue();
  };

  return (
    <div className="space-y-6">
      {/* Desktop: Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Service Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Choose the service you need for your vehicle
            </p>
            <div id="service_list">
              <ServiceCardList
                services={mockServices}
                selectedServiceId={selectedServiceId}
                onSelectService={onServiceChange}
                loading={false}
              />
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
          disabled={!selectedServiceId}
        >
          {t('booking.continue')}
        </Button>
      </div>
    </div>
  );
}
