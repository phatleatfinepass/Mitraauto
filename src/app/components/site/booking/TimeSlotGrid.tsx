import React from 'react';
import { Clock } from 'lucide-react';

export interface TimeSlot {
  time: string;
  available: boolean;
  id: string;
  unavailableReason?: string;
}

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedSlot: string | null;
  onSelectSlot: (slotId: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function TimeSlotGrid({
  slots,
  selectedSlot,
  onSelectSlot,
  disabled = false,
  loading = false,
}: TimeSlotGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="h-12 rounded-lg bg-secondary/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Available time slots</span>
      </div>
      
      <div 
        className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2"
        role="radiogroup"
        aria-label="Available time slots"
      >
        {slots.map((slot) => {
          const isSelected = selectedSlot === slot.id;
          const isDisabled = disabled || !slot.available;

          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => slot.available && !disabled && onSelectSlot(slot.id)}
              disabled={isDisabled}
              role="radio"
              aria-checked={isSelected}
              className={`
                min-h-12 rounded-lg px-2 py-2 transition-all duration-200
                flex flex-col items-center justify-center
                ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-md scale-105 ring-2 ring-primary/50'
                    : isDisabled
                    ? 'bg-secondary/30 text-muted-foreground cursor-not-allowed opacity-50'
                    : 'bg-secondary hover:bg-secondary/80 hover:shadow-sm hover:scale-102 active:scale-98'
                }
              `}
            >
              <span className="font-medium">{slot.time}</span>
              {!slot.available && slot.unavailableReason ? (
                <span className="mt-0.5 max-w-full truncate text-[10px] leading-3" title={slot.unavailableReason}>
                  {slot.unavailableReason}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {slots.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No available time slots for selected date
        </p>
      )}
    </div>
  );
}
