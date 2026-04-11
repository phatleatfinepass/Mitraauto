import React from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Car } from 'lucide-react';

interface LicensePlateInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  label?: string;
  helperText?: string;
}

export function LicensePlateInput({
  value,
  onChange,
  error,
  disabled = false,
  label = 'License Plate',
  helperText = 'e.g., ABC-123',
}: LicensePlateInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.toUpperCase();
    // Basic license plate formatting (XXX-XXX or XXXXXX)
    const formatted = input.replace(/[^A-Z0-9-]/g, '').slice(0, 7);
    onChange(formatted);
  };

  return (
    <div className="space-y-2 group">
      <Label 
        htmlFor="license_plate" 
        className={`transition-all ${error ? 'text-destructive' : 'group-hover:text-ring'}`}
      >
        <span className="flex items-center gap-2">
          <Car className="h-4 w-4" />
          {label}
        </span>
      </Label>
      <Input
        id="license_plate"
        type="text"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder="ABC-123"
        className={`uppercase text-lg tracking-wide transition-all ${
          error 
            ? 'border-destructive focus-visible:ring-destructive' 
            : 'focus-visible:ring-ring'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? 'plate-error' : 'plate-helper'}
      />
      {error ? (
        <p id="plate-error" className="text-sm text-destructive">
          {error}
        </p>
      ) : helperText ? (
        <p id="plate-helper" className="text-sm text-muted-foreground">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
