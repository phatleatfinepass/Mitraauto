import React from 'react';
import { Calendar, Clock, Car, Edit2, Wrench } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';

interface BookingSummaryCardProps {
  licensePlate?: string;
  date?: Date;
  timeSlot?: string;
  serviceName?: string;
  onEdit?: () => void;
  compact?: boolean;
}

export function BookingSummaryCard({
  licensePlate,
  date,
  timeSlot,
  serviceName,
  onEdit,
  compact = false,
}: BookingSummaryCardProps) {
  const hasData = licensePlate || date || timeSlot || serviceName;

  if (!hasData) {
    return null;
  }

  return (
    <Card className={`${compact ? 'p-4' : 'p-6'} bg-secondary/30 border-border/50`}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-semibold">Booking Summary</h3>
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-8 px-2 hover:bg-secondary"
          >
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {licensePlate && (
          <div className="flex items-center gap-3 text-sm">
            <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center">
              <Car className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">License Plate</p>
              <p className="font-semibold tracking-wide">{licensePlate}</p>
            </div>
          </div>
        )}

        {date && (
          <div className="flex items-center gap-3 text-sm">
            <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-semibold">
                {date.toLocaleDateString('fi-FI', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        )}

        {timeSlot && (
          <div className="flex items-center gap-3 text-sm">
            <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Time</p>
              <p className="font-semibold">{timeSlot}</p>
            </div>
          </div>
        )}

        {serviceName && (
          <div className="flex items-center gap-3 text-sm">
            <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center">
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Service</p>
              <p className="font-semibold">{serviceName}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
