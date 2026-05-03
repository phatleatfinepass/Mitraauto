import { useState } from 'react';
import { useTheme } from '../ThemeContext';
import { useLanguage } from '../LanguageContext';
import FigmaLicnesePlateMd from '../../imports/FigmaLicnesePlateMd-142-2027';
import FigmaLicnesePlateSm from '../../imports/FigmaLicnesePlateSm-142-2801';
import FigmaLicnesePlateMobile from '../../imports/FigmaLicnesePlateMobile-142-2934';

interface LicensePlateDisplayProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function LicensePlateDisplay({ value, onChange, placeholder = 'ABC-123' }: LicensePlateDisplayProps) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  
  const secondaryTextClass = theme === 'dark' ? 'text-[#B0B8C4]' : 'text-[#6B7280]';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.toUpperCase();
    // Format: XXX-XXX (3 letters/numbers, dash, 3 numbers)
    let formatted = input.replace(/[^A-Z0-9]/g, '');
    if (formatted.length > 3) {
      formatted = formatted.slice(0, 3) + '-' + formatted.slice(3, 6);
    }
    onChange(formatted);
  };

  return (
    <div className="relative">
      {/* Desktop/Tablet - MD variant */}
      <div className="hidden md:block lg:hidden">
        <div className="w-[333.333px] h-[100px] mx-auto relative">
          <FigmaLicnesePlateSm />
          <div className="absolute inset-0 flex items-center justify-center pl-[66.667px]">
            <input
              type="text"
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              maxLength={7}
              className="w-[266.667px] h-[100px] bg-transparent text-center text-[54px] font-bold outline-none placeholder:text-[#6B7280]"
              style={{ 
                fontFamily: 'Inter, sans-serif',
                color: '#000000'
              }}
            />
          </div>
        </div>
      </div>

      {/* Large Desktop - LG variant */}
      <div className="hidden lg:block">
        <div className="w-[400px] h-[120px] mx-auto relative">
          <FigmaLicnesePlateMd />
          <div className="absolute inset-0 flex items-center justify-center pl-[80px]">
            <input
              type="text"
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              maxLength={7}
              className="w-[320px] h-[120px] bg-transparent text-center text-[64px] font-bold outline-none placeholder:text-[#6B7280]"
              style={{ 
                fontFamily: 'Inter, sans-serif',
                color: '#000000'
              }}
            />
          </div>
        </div>
      </div>

      {/* Mobile - Small variant */}
      <div className="block md:hidden">
        <div className="w-[266.667px] h-[80px] mx-auto relative">
          <FigmaLicnesePlateMobile />
          <div className="absolute inset-0 flex items-center justify-center pl-[53.333px]">
            <input
              type="text"
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              maxLength={7}
              className="w-[213.333px] h-[80px] bg-transparent text-center text-[42px] font-bold outline-none placeholder:text-[#6B7280]"
              style={{ 
                fontFamily: 'Inter, sans-serif',
                color: '#000000'
              }}
            />
          </div>
        </div>
      </div>

      {/* Helper text */}
      <p className={`text-center ${secondaryTextClass} text-sm mt-3`}>
        {language === 'fi' 
          ? 'Kirjoita rekisteritunnus muodossa ABC-123'
          : 'Enter the plate in ABC-123 format'
        }
      </p>
    </div>
  );
}
