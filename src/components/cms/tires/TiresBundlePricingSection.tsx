import React from 'react';
import { RotateCcw } from 'lucide-react';
import { calculateLinePricing, isFixedBundleTotalCompatible, type BundlePricingMode } from '../../../utils/pricing';

export function TiresBundlePricingSection({
  clearBundlePricing,
  getBundlePricing,
  isDark,
  language,
  selectedTireFinalPriceEur,
  selectedTirePrice,
  setBundleTier,
}: {
  clearBundlePricing: () => void;
  getBundlePricing: () => any;
  isDark: boolean;
  language: string;
  selectedTireFinalPriceEur: number | null | undefined;
  selectedTirePrice: number | null | undefined;
  setBundleTier: (qty: 2 | 4, patch: { mode?: BundlePricingMode; percent_off?: number | null; fixed_total_eur?: number | null }) => void;
}) {
  const bundlePricing = getBundlePricing();
  const tier2 = bundlePricing?.qty2 ?? {
    mode: 'none' as BundlePricingMode,
    percent_off: null,
    fixed_total_eur: null,
  };
  const tier4 = bundlePricing?.qty4 ?? {
    mode: 'none' as BundlePricingMode,
    percent_off: null,
    fixed_total_eur: null,
  };
  const basePrice = Number(selectedTireFinalPriceEur ?? selectedTirePrice ?? 0);
  const preview2 = calculateLinePricing(basePrice, 2, bundlePricing);
  const preview4 = calculateLinePricing(basePrice, 4, bundlePricing);
  const invalidFixed2 =
    tier2.mode === 'fixed_total' &&
    tier2.fixed_total_eur !== null &&
    !isFixedBundleTotalCompatible(tier2.fixed_total_eur, 2);
  const invalidFixed4 =
    tier4.mode === 'fixed_total' &&
    tier4.fixed_total_eur !== null &&
    !isFixedBundleTotalCompatible(tier4.fixed_total_eur, 4);

  return (
    <div className="border-t pt-4 border-white/10 space-y-4">
      <div>
        <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {language === 'fi' ? 'Pakettihinnoittelu (2 / 4 kpl)' : 'Bundle pricing (2 / 4 items)'}
        </h4>
        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {language === 'fi'
            ? 'Valitse alennusprosentti tai kiinteä kokonaishinta 2 tai 4 kappaleelle.'
            : 'Choose percentage discount or fixed total for bundles of 2 or 4 units.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className={`rounded-lg border p-3 space-y-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>2 {language === 'fi' ? 'kpl' : 'items'}</p>
          <select
            value={tier2.mode}
            onChange={(e) =>
              setBundleTier(2, {
                mode: e.target.value as BundlePricingMode,
                percent_off: null,
                fixed_total_eur: null,
              })
            }
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="none">{language === 'fi' ? 'Ei alennusta' : 'No bundle discount'}</option>
            <option value="percent">{language === 'fi' ? 'Alennus %' : 'Discount %'}</option>
            <option value="fixed_total">{language === 'fi' ? 'Kiinteä kokonaishinta' : 'Fixed total price'}</option>
          </select>
          {tier2.mode === 'percent' && (
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={tier2.percent_off ?? ''}
              onChange={(e) => setBundleTier(2, { percent_off: e.target.value ? Number(e.target.value) : null })}
              placeholder={language === 'fi' ? 'Esim. 5' : 'e.g. 5'}
              className={`w-full px-3 py-2 rounded-lg border ${
                isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          )}
          {tier2.mode === 'fixed_total' && (
            <input
              type="number"
              min="0"
              step="0.01"
              value={tier2.fixed_total_eur ?? ''}
              onChange={(e) => setBundleTier(2, { fixed_total_eur: e.target.value ? Number(e.target.value) : null })}
              placeholder={language === 'fi' ? 'Esim. 220.00' : 'e.g. 220.00'}
              className={`w-full px-3 py-2 rounded-lg border ${
                isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          )}
          {invalidFixed2 && (
            <p className={`text-xs ${isDark ? 'text-red-300' : 'text-red-700'}`}>
              {language === 'fi'
                ? 'Kiinteä hinta ei jakaudu tasan 2 kappaleelle senttitasolla.'
                : 'Fixed total does not divide evenly across 2 units in cents.'}
            </p>
          )}
          <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {language === 'fi' ? 'Esikatselu:' : 'Preview:'} €{preview2.lineTotalEur.toFixed(2)}
            {preview2.savingsEur > 0
              ? ` (${language === 'fi' ? 'säästö' : 'saving'} €${preview2.savingsEur.toFixed(2)})`
              : ''}
          </p>
        </div>

        <div className={`rounded-lg border p-3 space-y-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>4 {language === 'fi' ? 'kpl' : 'items'}</p>
          <select
            value={tier4.mode}
            onChange={(e) =>
              setBundleTier(4, {
                mode: e.target.value as BundlePricingMode,
                percent_off: null,
                fixed_total_eur: null,
              })
            }
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="none">{language === 'fi' ? 'Ei alennusta' : 'No bundle discount'}</option>
            <option value="percent">{language === 'fi' ? 'Alennus %' : 'Discount %'}</option>
            <option value="fixed_total">{language === 'fi' ? 'Kiinteä kokonaishinta' : 'Fixed total price'}</option>
          </select>
          {tier4.mode === 'percent' && (
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={tier4.percent_off ?? ''}
              onChange={(e) => setBundleTier(4, { percent_off: e.target.value ? Number(e.target.value) : null })}
              placeholder={language === 'fi' ? 'Esim. 10' : 'e.g. 10'}
              className={`w-full px-3 py-2 rounded-lg border ${
                isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          )}
          {tier4.mode === 'fixed_total' && (
            <input
              type="number"
              min="0"
              step="0.01"
              value={tier4.fixed_total_eur ?? ''}
              onChange={(e) => setBundleTier(4, { fixed_total_eur: e.target.value ? Number(e.target.value) : null })}
              placeholder={language === 'fi' ? 'Esim. 420.00' : 'e.g. 420.00'}
              className={`w-full px-3 py-2 rounded-lg border ${
                isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          )}
          {invalidFixed4 && (
            <p className={`text-xs ${isDark ? 'text-red-300' : 'text-red-700'}`}>
              {language === 'fi'
                ? 'Kiinteä hinta ei jakaudu tasan 4 kappaleelle senttitasolla.'
                : 'Fixed total does not divide evenly across 4 units in cents.'}
            </p>
          )}
          <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {language === 'fi' ? 'Esikatselu:' : 'Preview:'} €{preview4.lineTotalEur.toFixed(2)}
            {preview4.savingsEur > 0
              ? ` (${language === 'fi' ? 'säästö' : 'saving'} €${preview4.savingsEur.toFixed(2)})`
              : ''}
          </p>
        </div>
      </div>

      {(bundlePricing?.qty2 || bundlePricing?.qty4) && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={clearBundlePricing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              isDark
                ? 'border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400'
                : 'border-red-300 bg-red-50 hover:bg-red-100 text-red-700'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            {language === 'fi' ? 'Tyhjennä pakettihinnoittelu' : 'Clear bundle pricing'}
          </button>
        </div>
      )}
    </div>
  );
}
