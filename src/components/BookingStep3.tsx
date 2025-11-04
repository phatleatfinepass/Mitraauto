import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { BookingSummaryCard } from './BookingSummaryCard';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';

interface BookingStep3Props {
  licensePlate: string;
  date: Date;
  timeSlot: string;
  serviceName: string;
  contactInfo: {
    name: string;
    phone: string;
    email: string;
    notes: string;
  };
  onContactInfoChange: (field: string, value: string) => void;
  onBack: () => void;
  onEditStep1: () => void;
  onConfirm: () => void;
  t: (key: string) => string;
}

export function BookingStep3({
  licensePlate,
  date,
  timeSlot,
  serviceName,
  contactInfo,
  onContactInfoChange,
  onBack,
  onEditStep1,
  onConfirm,
  t,
}: BookingStep3Props) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>('');

  const validateAndConfirm = async () => {
    setErrors({});
    setError('');

    const newErrors: Record<string, string> = {};

    // Validate name
    if (!contactInfo.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Validate phone
    if (!contactInfo.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-()]+$/.test(contactInfo.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Validate email (optional but must be valid if provided)
    if (contactInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // [BOOKING ACTION] Create booking: /api/bookings/create
      await new Promise(resolve => setTimeout(resolve, 1000));
      onConfirm();
    } catch (err) {
      setError('Unable to complete booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Desktop: Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Contact Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">Contact Information</h3>
              <p className="text-sm text-muted-foreground">
                We'll use this information to confirm your booking
              </p>
            </div>

            {/* Name */}
            <div className="space-y-2 group">
              <Label 
                htmlFor="name"
                className={`transition-all ${errors.name ? 'text-destructive' : 'group-hover:text-ring'}`}
              >
                Full Name *
              </Label>
              <Input
                id="name"
                type="text"
                value={contactInfo.name}
                onChange={(e) => onContactInfoChange('name', e.target.value)}
                placeholder="John Doe"
                className={`transition-all ${errors.name ? 'border-destructive' : 'hover:shadow-[0_0_20px_rgba(0,113,227,0.15)] hover:border-ring/50 focus:shadow-[0_0_25px_rgba(0,113,227,0.25)]'}`}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2 group">
              <Label 
                htmlFor="phone"
                className={`transition-all ${errors.phone ? 'text-destructive' : 'group-hover:text-ring'}`}
              >
                Phone Number *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={contactInfo.phone}
                onChange={(e) => onContactInfoChange('phone', e.target.value)}
                placeholder="+358 40 123 4567"
                className={`transition-all ${errors.phone ? 'border-destructive' : 'hover:shadow-[0_0_20px_rgba(0,113,227,0.15)] hover:border-ring/50 focus:shadow-[0_0_25px_rgba(0,113,227,0.25)]'}`}
                aria-invalid={!!errors.phone}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2 group">
              <Label 
                htmlFor="email"
                className={`transition-all ${errors.email ? 'text-destructive' : 'group-hover:text-ring'}`}
              >
                Email <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={contactInfo.email}
                onChange={(e) => onContactInfoChange('email', e.target.value)}
                placeholder="john.doe@example.com"
                className={`transition-all ${errors.email ? 'border-destructive' : 'hover:shadow-[0_0_20px_rgba(0,113,227,0.15)] hover:border-ring/50 focus:shadow-[0_0_25px_rgba(0,113,227,0.25)]'}`}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2 group">
              <Label htmlFor="notes" className="transition-all group-hover:text-ring">
                Additional Notes <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Textarea
                id="notes"
                value={contactInfo.notes}
                onChange={(e) => onContactInfoChange('notes', e.target.value)}
                placeholder="Any special requirements or additional information..."
                rows={4}
                className="resize-none transition-all hover:shadow-[0_0_20px_rgba(0,113,227,0.15)] hover:border-ring/50 focus:shadow-[0_0_25px_rgba(0,113,227,0.25)]"
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
              serviceName={serviceName}
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
          serviceName={serviceName}
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
          disabled={loading}
        >
          {t('booking.back')}
        </Button>
        <Button
          id="cta_confirm"
          onClick={validateAndConfirm}
          className="w-full sm:flex-1"
          disabled={loading}
        >
          {loading ? t('booking.confirming') : t('booking.confirmBooking')}
        </Button>
      </div>
    </div>
  );
}
