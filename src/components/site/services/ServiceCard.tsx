import React from 'react';
import { Clock, Euro, Check } from 'lucide-react';

export interface Service {
  id: string;
  name: string;
  duration: string;
  price: number;
  description?: string;
  icon?: string;
}

interface ServiceCardProps {
  service: Service;
  selected: boolean;
  onSelect: (serviceId: string) => void;
  disabled?: boolean;
}

export function ServiceCard({ service, selected, onSelect, disabled = false }: ServiceCardProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect(service.id)}
      disabled={disabled}
      className={`
        relative w-full text-left rounded-2xl p-4 transition-all duration-200
        border-2
        ${
          selected
            ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
            : 'border-border hover:border-primary/50 hover:shadow-sm bg-background'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
      `}
      role="radio"
      aria-checked={selected}
    >
      {/* Selected Checkmark */}
      {selected && (
        <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <Check className="h-4 w-4" />
        </div>
      )}

      {/* Service Name */}
      <h3 className="font-semibold mb-2 pr-8">{service.name}</h3>

      {/* Description */}
      {service.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {service.description}
        </p>
      )}

      {/* Duration & Price */}
      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-4 w-4" />
          {service.duration}
        </span>
        <span className="flex items-center gap-1 font-semibold text-primary">
          <Euro className="h-4 w-4" />
          {service.price.toFixed(2)}
        </span>
      </div>
    </button>
  );
}

interface ServiceCardListProps {
  services: Service[];
  selectedServiceId: string | null;
  onSelectService: (serviceId: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function ServiceCardList({
  services,
  selectedServiceId,
  onSelectService,
  disabled = false,
  loading = false,
}: ServiceCardListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-secondary/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4" role="radiogroup" aria-label="Select a service">
      <h3 className="font-semibold">Select Service</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            selected={selectedServiceId === service.id}
            onSelect={onSelectService}
            disabled={disabled}
          />
        ))}
      </div>

      {services.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No services available at this time
        </p>
      )}
    </div>
  );
}
