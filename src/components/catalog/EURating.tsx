import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Fuel, Droplets, Volume2 } from 'lucide-react';

interface EURatingProps {
  fuel?: string;
  wet?: string;
  noise?: number;
}

export function EURating({ fuel, wet, noise }: EURatingProps) {
  const { t } = useLanguage();

  const getRatingColor = (rating?: string) => {
    if (!rating) return 'text-[#B0B8C4]';
    switch (rating.toUpperCase()) {
      case 'A':
        return 'text-green-400';
      case 'B':
        return 'text-lime-400';
      case 'C':
        return 'text-yellow-400';
      case 'D':
        return 'text-orange-400';
      case 'E':
        return 'text-red-400';
      default:
        return 'text-[#B0B8C4]';
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-[#B0B8C4] uppercase tracking-wider">
        {t('catalog.euLabels')}
      </p>
      
      <div className="grid grid-cols-3 gap-2">
        {/* Fuel Efficiency */}
        {fuel && (
          <div className="flex flex-col items-center p-2 rounded-lg bg-white/5 border border-white/10">
            <Fuel className="w-4 h-4 text-[#B0B8C4] mb-1" />
            <span className={`text-lg ${getRatingColor(fuel)}`}>
              {fuel.toUpperCase()}
            </span>
            <span className="text-[10px] text-[#B0B8C4] text-center mt-0.5">
              {t('productDetail.fuelEfficiency')}
            </span>
          </div>
        )}

        {/* Wet Grip */}
        {wet && (
          <div className="flex flex-col items-center p-2 rounded-lg bg-white/5 border border-white/10">
            <Droplets className="w-4 h-4 text-[#B0B8C4] mb-1" />
            <span className={`text-lg ${getRatingColor(wet)}`}>
              {wet.toUpperCase()}
            </span>
            <span className="text-[10px] text-[#B0B8C4] text-center mt-0.5">
              {t('productDetail.wetGrip')}
            </span>
          </div>
        )}

        {/* Noise */}
        {noise && (
          <div className="flex flex-col items-center p-2 rounded-lg bg-white/5 border border-white/10">
            <Volume2 className="w-4 h-4 text-[#B0B8C4] mb-1" />
            <span className="text-lg text-white">
              {noise}
            </span>
            <span className="text-[10px] text-[#B0B8C4] text-center mt-0.5">
              dB
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
