import React from 'react';

export function Button({
  children,
  color = 'secondary',
  iconLeading,
  isDark,
  isDisabled,
  isLoading,
  size: _size,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  color?: 'primary' | 'secondary';
  iconLeading?: React.ReactNode;
  isDark?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  size?: 'sm';
}) {
  const colorClass = color === 'primary'
    ? 'border-[#F97316] bg-[#F97316] text-white hover:bg-[#EA580C]'
    : isDark
      ? 'border-white/10 bg-white/5 text-white hover:bg-white/10'
      : 'border-[#D2D2D7] bg-white text-[#1D1D1F] hover:bg-[#F5F5F7]';

  return (
    <button
      {...props}
      disabled={isDisabled || isLoading || props.disabled}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${colorClass} ${className}`}
    >
      {iconLeading}
      {isLoading ? 'Saving...' : children}
    </button>
  );
}

export function Input({
  label,
  isDark,
  value,
  onChange,
  inputClassName = '',
  size: _size,
  className = '',
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> & {
  label?: string;
  isDark?: boolean;
  inputClassName?: string;
  size?: 'sm';
  onChange?: (value: string) => void;
}) {
  return (
    <label className={`block ${className}`}>
      {label ? <span className={`mb-1 block text-xs font-medium ${isDark ? 'text-gray-400' : 'text-[#6E6E73]'}`}>{label}</span> : null}
      <input
        {...props}
        value={value ?? ''}
        onChange={(event) => onChange?.(event.target.value)}
        className={`h-10 w-full rounded-md border px-3 text-sm outline-none transition-colors focus:border-[#F97316] ${
          isDark
            ? 'border-white/10 bg-[#11141A] text-white placeholder:text-gray-500'
            : 'border-[#D2D2D7] bg-white text-[#1D1D1F] placeholder:text-[#98989D]'
        } ${inputClassName}`}
      />
    </label>
  );
}

export function TextArea({
  label,
  isDark,
  value,
  onChange,
  textAreaClassName = '',
  className = '',
  ...props
}: Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> & {
  label?: string;
  isDark?: boolean;
  textAreaClassName?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className={`block ${className}`}>
      {label ? <span className={`mb-1 block text-xs font-medium ${isDark ? 'text-gray-400' : 'text-[#6E6E73]'}`}>{label}</span> : null}
      <textarea
        {...props}
        value={value ?? ''}
        onChange={(event) => onChange?.(event.target.value)}
        className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors focus:border-[#F97316] ${
          isDark
            ? 'border-white/10 bg-[#11141A] text-white placeholder:text-gray-500'
            : 'border-[#D2D2D7] bg-white text-[#1D1D1F] placeholder:text-[#98989D]'
        } ${textAreaClassName}`}
      />
    </label>
  );
}

export function Select({
  label,
  isDark,
  value,
  onChange,
  children,
  selectClassName = '',
  className = '',
  ...props
}: Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> & {
  label?: string;
  isDark?: boolean;
  selectClassName?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className={`block ${className}`}>
      {label ? <span className={`mb-1 block text-xs font-medium ${isDark ? 'text-gray-400' : 'text-[#6E6E73]'}`}>{label}</span> : null}
      <select
        {...props}
        value={value ?? ''}
        onChange={(event) => onChange?.(event.target.value)}
        className={`h-10 w-full rounded-md border px-3 text-sm outline-none transition-colors focus:border-[#F97316] ${
          isDark
            ? 'border-white/10 bg-[#11141A] text-white'
            : 'border-[#D2D2D7] bg-white text-[#1D1D1F]'
        } ${selectClassName}`}
      >
        {children}
      </select>
    </label>
  );
}

export function Badge({
  children,
  isDark,
  tone = 'gray',
}: {
  children: React.ReactNode;
  isDark?: boolean;
  tone?: 'gray' | 'success' | 'warning';
  size?: 'sm';
}) {
  const toneClass =
    tone === 'success'
      ? isDark ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : tone === 'warning'
        ? isDark ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-700'
        : isDark ? 'border-white/10 bg-white/5 text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-700';

  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${toneClass}`}>
      {children}
    </span>
  );
}
