import React from 'react';
import { useTheme } from '../ThemeContext';
import { useLanguage } from '../LanguageContext';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface EULabelData {
  fuel?: string | null;
  wet?: string | null;
  noise_db?: number | null;
  noise_class?: string | null;
}

interface EULabelOverrideProps {
  baseValues: EULabelData;
  overrideValues: EULabelData | null;
  onOverrideChange: (values: EULabelData) => void;
  onClearOverride: () => void;
}

const EU_FUEL_WET_OPTIONS = ['A', 'B', 'C', 'D', 'E'];
const EU_NOISE_CLASS_OPTIONS = ['A', 'B', 'C'];

export function EULabelOverride({ 
  baseValues, 
  overrideValues, 
  onOverrideChange, 
  onClearOverride 
}: EULabelOverrideProps) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isDark = theme === 'dark';

  const hasAnyOverride = overrideValues && Object.keys(overrideValues).length > 0;

  const finalValues: EULabelData = {
    fuel: overrideValues?.fuel ?? baseValues.fuel,
    wet: overrideValues?.wet ?? baseValues.wet,
    noise_db: overrideValues?.noise_db ?? baseValues.noise_db,
    noise_class: overrideValues?.noise_class ?? baseValues.noise_class,
  };

  const handleFieldChange = (field: keyof EULabelData, value: string | number | null) => {
    const updated = { ...(overrideValues || {}) };
    
    if (value === null || value === '') {
      delete updated[field];
    } else {
      updated[field] = value as any;
    }
    
    onOverrideChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className={`flex gap-3 p-4 rounded-lg border ${
        isDark 
          ? 'bg-blue-500/10 border-blue-500/30' 
          : 'bg-blue-50 border-blue-200'
      }`}>
        <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
        <div className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-900'}`}>
          <p className="font-medium mb-1">
            {language === 'fi' ? 'EU-rengas­merkintä' : 'EU Tyre Label'}
          </p>
          <p className={isDark ? 'text-blue-300' : 'text-blue-700'}>
            {language === 'fi' 
              ? 'Voit ohittaa toimittajan arvot. Tyhjä = käytä perusarvoa.'
              : 'Override supplier values. Empty = use base value.'}
          </p>
        </div>
      </div>

      {/* Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Fuel Efficiency */}
        <div className="space-y-3">
          <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fi' ? 'Polttoaine­tehokkuus' : 'Fuel Efficiency'}
          </label>
          
          {/* Base Value */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            isDark ? 'bg-white/5' : 'bg-gray-100'
          }`}>
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'fi' ? 'Perustaso:' : 'Base:'}
            </span>
            <span className={`font-mono font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {baseValues.fuel || '—'}
            </span>
          </div>

          {/* Override Select */}
          <select
            value={overrideValues?.fuel || ''}
            onChange={(e) => handleFieldChange('fuel', e.target.value || null)}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark 
                ? 'bg-[#1C1C1E] border-white/20 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">{language === 'fi' ? '— Käytä perustasoa —' : '— Use base value —'}</option>
            {EU_FUEL_WET_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>

          {/* Final Value Preview */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 ${
            overrideValues?.fuel 
              ? (isDark ? 'border-green-500/50 bg-green-500/10' : 'border-green-500 bg-green-50')
              : (isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50')
          }`}>
            <span className={`text-xs font-medium ${
              overrideValues?.fuel 
                ? (isDark ? 'text-green-400' : 'text-green-700')
                : (isDark ? 'text-gray-400' : 'text-gray-600')
            }`}>
              {language === 'fi' ? 'Lopullinen:' : 'Final:'}
            </span>
            <span className={`font-mono font-bold text-lg ${
              overrideValues?.fuel 
                ? (isDark ? 'text-green-400' : 'text-green-700')
                : (isDark ? 'text-white' : 'text-gray-900')
            }`}>
              {finalValues.fuel || '—'}
            </span>
          </div>
        </div>

        {/* Wet Grip */}
        <div className="space-y-3">
          <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fi' ? 'Märkäpito' : 'Wet Grip'}
          </label>
          
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            isDark ? 'bg-white/5' : 'bg-gray-100'
          }`}>
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'fi' ? 'Perustaso:' : 'Base:'}
            </span>
            <span className={`font-mono font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {baseValues.wet || '—'}
            </span>
          </div>

          <select
            value={overrideValues?.wet || ''}
            onChange={(e) => handleFieldChange('wet', e.target.value || null)}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark 
                ? 'bg-[#1C1C1E] border-white/20 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">{language === 'fi' ? '— Käytä perustasoa —' : '— Use base value —'}</option>
            {EU_FUEL_WET_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>

          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 ${
            overrideValues?.wet 
              ? (isDark ? 'border-green-500/50 bg-green-500/10' : 'border-green-500 bg-green-50')
              : (isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50')
          }`}>
            <span className={`text-xs font-medium ${
              overrideValues?.wet 
                ? (isDark ? 'text-green-400' : 'text-green-700')
                : (isDark ? 'text-gray-400' : 'text-gray-600')
            }`}>
              {language === 'fi' ? 'Lopullinen:' : 'Final:'}
            </span>
            <span className={`font-mono font-bold text-lg ${
              overrideValues?.wet 
                ? (isDark ? 'text-green-400' : 'text-green-700')
                : (isDark ? 'text-white' : 'text-gray-900')
            }`}>
              {finalValues.wet || '—'}
            </span>
          </div>
        </div>

        {/* Noise dB */}
        <div className="space-y-3">
          <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fi' ? 'Melutaso (dB)' : 'Noise Level (dB)'}
          </label>
          
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            isDark ? 'bg-white/5' : 'bg-gray-100'
          }`}>
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'fi' ? 'Perustaso:' : 'Base:'}
            </span>
            <span className={`font-mono font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {baseValues.noise_db ? `${baseValues.noise_db} dB` : '—'}
            </span>
          </div>

          <input
            type="number"
            min="50"
            max="90"
            step="1"
            value={overrideValues?.noise_db ?? ''}
            onChange={(e) => handleFieldChange('noise_db', e.target.value ? parseInt(e.target.value) : null)}
            placeholder={language === 'fi' ? 'Käytä perustasoa' : 'Use base value'}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark 
                ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
          />

          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 ${
            overrideValues?.noise_db 
              ? (isDark ? 'border-green-500/50 bg-green-500/10' : 'border-green-500 bg-green-50')
              : (isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50')
          }`}>
            <span className={`text-xs font-medium ${
              overrideValues?.noise_db 
                ? (isDark ? 'text-green-400' : 'text-green-700')
                : (isDark ? 'text-gray-400' : 'text-gray-600')
            }`}>
              {language === 'fi' ? 'Lopullinen:' : 'Final:'}
            </span>
            <span className={`font-mono font-bold text-lg ${
              overrideValues?.noise_db 
                ? (isDark ? 'text-green-400' : 'text-green-700')
                : (isDark ? 'text-white' : 'text-gray-900')
            }`}>
              {finalValues.noise_db ? `${finalValues.noise_db} dB` : '—'}
            </span>
          </div>
        </div>

        {/* Noise Class */}
        <div className="space-y-3">
          <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fi' ? 'Meluluokka' : 'Noise Class'}
          </label>
          
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            isDark ? 'bg-white/5' : 'bg-gray-100'
          }`}>
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'fi' ? 'Perustaso:' : 'Base:'}
            </span>
            <span className={`font-mono font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {baseValues.noise_class || '—'}
            </span>
          </div>

          <select
            value={overrideValues?.noise_class || ''}
            onChange={(e) => handleFieldChange('noise_class', e.target.value || null)}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark 
                ? 'bg-[#1C1C1E] border-white/20 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">{language === 'fi' ? '— Käytä perustasoa —' : '— Use base value —'}</option>
            {EU_NOISE_CLASS_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>

          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 ${
            overrideValues?.noise_class 
              ? (isDark ? 'border-green-500/50 bg-green-500/10' : 'border-green-500 bg-green-50')
              : (isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50')
          }`}>
            <span className={`text-xs font-medium ${
              overrideValues?.noise_class 
                ? (isDark ? 'text-green-400' : 'text-green-700')
                : (isDark ? 'text-gray-400' : 'text-gray-600')
            }`}>
              {language === 'fi' ? 'Lopullinen:' : 'Final:'}
            </span>
            <span className={`font-mono font-bold text-lg ${
              overrideValues?.noise_class 
                ? (isDark ? 'text-green-400' : 'text-green-700')
                : (isDark ? 'text-white' : 'text-gray-900')
            }`}>
              {finalValues.noise_class || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Clear Override Button */}
      {hasAnyOverride && (
        <div className="flex justify-end pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClearOverride}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              isDark 
                ? 'border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400' 
                : 'border-red-300 bg-red-50 hover:bg-red-100 text-red-700'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            {language === 'fi' ? 'Tyhjennä kaikki ohitukset' : 'Clear All Overrides'}
          </button>
        </div>
      )}
    </div>
  );
}
