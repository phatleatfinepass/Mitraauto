import React, { useState } from 'react';
import { AlertCircle, Plus, X } from 'lucide-react';
import { ServiceCardList, Service } from './ServiceCard';
import { BookingSummaryCard } from './BookingSummaryCard';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';

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

const serviceCategories: ServiceCategory[] = [
  {
    id: 'car-wash',
    name: 'Car Wash',
    services: [
      { id: 'exterior-wash', name: 'Exterior Wash', price: 95.00 },
      { id: 'full-wash', name: 'Full Wash', price: 150.00 },
      { id: 'interior-cleaning', name: 'Interior Cleaning', price: 80.00 },
      { id: 'engine-wash', name: 'Engine Wash', price: 65.00 },
    ],
  },
  {
    id: 'maintenance',
    name: 'Maintenance',
    services: [
      { id: 'basic-service', name: 'Basic Service', price: 250.00 },
      { id: 'large-service', name: 'Large Service', price: 450.00 },
      { id: 'ac-service', name: 'AC Service', price: 120.00 },
      { id: 'brake-fluid', name: 'Brake Fluid', price: 85.00 },
    ],
  },
  {
    id: 'tire-work',
    name: 'Tire Work',
    services: [
      { id: 'tire-mounting', name: 'Tire Mounting', price: 60.00 },
      { id: 'tire-removal', name: 'Tire Removal', price: 40.00 },
      { id: 'wheel-balancing', name: 'Wheel Balancing', price: 15.00 },
      { id: 'tire-repair', name: 'Tire Repair', price: 25.00 },
      { id: 'tpms-service', name: 'TPMS Service', price: 45.00 },
      { id: 'wheel-alignment', name: 'Wheel Alignment', price: 95.00 },
    ],
  },
];

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
}: BookingStep2Props) {
  const [error, setError] = useState<string>('');
  
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
      setError('Please select at least one service to continue');
      return;
    }

    onContinue();
  };
  
  const handleAddService = () => {
    if (!currentServiceId || !onServicesChange) return;
    
    // Check if service is already added
    if (selectedServiceIds.includes(currentServiceId)) {
      setError('This service is already added');
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
              Choose the service you need for your vehicle
            </p>
            
            <div className="space-y-5" id="services-page-multi-select">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Select category
                  </label>
                  <Select
                    value={selectedCategory || undefined}
                    onValueChange={(value) => {
                      setSelectedCategory(value);
                      setCurrentServiceId('');
                      setError('');
                    }}
                  >
                    <SelectTrigger aria-label="Select service category">
                      <SelectValue placeholder="Choose category" />
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
                    Select service
                  </label>
                  <Select
                    value={currentServiceId || undefined}
                    onValueChange={(value) => {
                      setCurrentServiceId(value);
                      setError('');
                    }}
                    disabled={!selectedCategory}
                  >
                    <SelectTrigger aria-label="Select service" disabled={!selectedCategory}>
                      <SelectValue placeholder="Choose a service" />
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
                  Add service
                </Button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Selected services</h4>
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
                            aria-label={`Remove ${service.name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Added services will appear here.
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
          disabled={!canContinue}
        >
          {t('booking.continue')}
        </Button>
      </div>
    </div>
  );
}
