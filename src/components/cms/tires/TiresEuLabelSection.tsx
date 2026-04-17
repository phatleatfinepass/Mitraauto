import { AlertCircle, RotateCcw } from 'lucide-react';
import type { TireRow } from './types';

interface EuOverride {
  fuel_class?: string;
  wet_grip_class?: string;
  noise_db?: number;
  noise_class?: string;
}

interface TiresEuLabelSectionProps {
  euFuelWetOptions: string[];
  euNoiseClassOptions: string[];
  getEuOverride: () => EuOverride | undefined;
  hasEuOverride: boolean;
  isDark: boolean;
  language: string;
  onClearEuOverrides: () => void;
  onSetEuField: (field: string, value: any) => void;
  selectedTire: TireRow;
}

export function TiresEuLabelSection({
  euFuelWetOptions,
  euNoiseClassOptions,
  getEuOverride,
  hasEuOverride,
  isDark,
  language,
  onClearEuOverrides,
  onSetEuField,
  selectedTire,
}: TiresEuLabelSectionProps) {
  const euOverride = getEuOverride();

  return (
    <div>
      <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {language === 'fi' ? 'EU-rengasmerkintä' : 'EU Tyre Label'}
      </h3>

      <div className={`flex gap-3 p-4 rounded-lg border mb-6 ${
        isDark ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'
      }`}>
        <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
        <div className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-900'}`}>
          {language === 'fi'
            ? 'Voit ohittaa toimittajan arvot. Tyhjä = käytä perusarvoa.'
            : 'Override supplier values. Empty = use base value.'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fi' ? 'Polttoainetehokkuus' : 'Fuel Efficiency'}
          </label>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'fi' ? 'Perustaso:' : 'Base:'}
            </span>
            <span className={`font-mono font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {selectedTire.eu_fuel_class || '—'}
            </span>
          </div>
          <select
            value={euOverride?.fuel_class || ''}
            onChange={(e) => onSetEuField('fuel_class', e.target.value || undefined)}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">{language === 'fi' ? '— Käytä perustasoa —' : '— Use base value —'}</option>
            {euFuelWetOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fi' ? 'Märkäpito' : 'Wet Grip'}
          </label>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'fi' ? 'Perustaso:' : 'Base:'}
            </span>
            <span className={`font-mono font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {selectedTire.eu_wet_grip_class || '—'}
            </span>
          </div>
          <select
            value={euOverride?.wet_grip_class || ''}
            onChange={(e) => onSetEuField('wet_grip_class', e.target.value || undefined)}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">{language === 'fi' ? '— Käytä perustasoa —' : '— Use base value —'}</option>
            {euFuelWetOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fi' ? 'Melutaso (dB)' : 'Noise Level (dB)'}
          </label>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'fi' ? 'Perustaso:' : 'Base:'}
            </span>
            <span className={`font-mono font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {selectedTire.eu_noise_db ? `${selectedTire.eu_noise_db} dB` : '—'}
            </span>
          </div>
          <input
            type="number"
            min="50"
            max="90"
            step="1"
            value={euOverride?.noise_db ?? ''}
            onChange={(e) => onSetEuField('noise_db', e.target.value ? parseInt(e.target.value, 10) : undefined)}
            placeholder={language === 'fi' ? 'Käytä perustasoa' : 'Use base value'}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>

        <div className="space-y-3">
          <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fi' ? 'Meluluokka' : 'Noise Class'}
          </label>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'fi' ? 'Perustaso:' : 'Base:'}
            </span>
            <span className={`font-mono font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {selectedTire.eu_noise_class || '—'}
            </span>
          </div>
          <select
            value={euOverride?.noise_class || ''}
            onChange={(e) => onSetEuField('noise_class', e.target.value || undefined)}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">{language === 'fi' ? '— Käytä perustasoa —' : '— Use base value —'}</option>
            {euNoiseClassOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {hasEuOverride && (
        <div className="flex justify-end pt-4 mt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClearEuOverrides}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              isDark ? 'border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400' : 'border-red-300 bg-red-50 hover:bg-red-100 text-red-700'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            {language === 'fi' ? 'Tyhjennä EU-ohitukset' : 'Clear EU Overrides'}
          </button>
        </div>
      )}
    </div>
  );
}
