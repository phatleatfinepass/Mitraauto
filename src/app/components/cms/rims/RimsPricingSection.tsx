import type { Dispatch, SetStateAction } from 'react';
import { RotateCcw } from 'lucide-react';

import {
  calculateLinePricing,
  getPricingRulesFromSpecOverrides,
  isFixedBundleTotalCompatible,
  setPricingRulesToSpecOverrides,
  type BundlePricingMode,
  type ProductPricingRules,
} from '../../../utils/pricing';
import type { ProductCMS, RimRow } from './types';

interface RimsPricingSectionProps {
  isDark: boolean;
  language: string;
  selectedRim: RimRow;
  editData: Partial<ProductCMS>;
  onEditDataChange: Dispatch<SetStateAction<Partial<ProductCMS>>>;
}

export function RimsPricingSection({
  isDark,
  language,
  selectedRim,
  editData,
  onEditDataChange,
}: RimsPricingSectionProps) {
  const inputClass = `w-full rounded-lg border px-3 py-2 ${
    isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
  }`;
  const bundlePricing = getPricingRulesFromSpecOverrides(editData.spec_overrides);
  const basePrice = Number(selectedRim.price ?? selectedRim.final_price_eur ?? 0);

  const setBundleTier = (
    qty: 2 | 4,
    tier: { mode?: BundlePricingMode; percent_off?: number | null; fixed_total_eur?: number | null },
  ) => {
    onEditDataChange((prev) => {
      const currentPricing = getPricingRulesFromSpecOverrides(prev.spec_overrides) ?? { qty2: null, qty4: null };
      const key = qty === 2 ? 'qty2' : 'qty4';
      const existingTier = currentPricing[key] ?? { mode: 'none' as BundlePricingMode, percent_off: null, fixed_total_eur: null };
      const mergedTier = { ...existingTier, ...tier };
      const nextPricing: ProductPricingRules = {
        qty2: key === 'qty2' ? mergedTier : currentPricing.qty2,
        qty4: key === 'qty4' ? mergedTier : currentPricing.qty4,
      };
      return {
        ...prev,
        spec_overrides: setPricingRulesToSpecOverrides(prev.spec_overrides, nextPricing),
      };
    });
  };

  const renderBundleTier = (qty: 2 | 4) => {
    const tier = (qty === 2 ? bundlePricing?.qty2 : bundlePricing?.qty4) ?? {
      mode: 'none' as BundlePricingMode,
      percent_off: null,
      fixed_total_eur: null,
    };
    const preview = calculateLinePricing(basePrice, qty, bundlePricing);
    const invalidFixed = tier.mode === 'fixed_total' && tier.fixed_total_eur !== null && !isFixedBundleTotalCompatible(tier.fixed_total_eur, qty);

    return (
      <div className={`space-y-3 rounded-lg border p-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {qty} {language === 'fi' ? 'kpl' : 'items'}
        </p>
        <select
          value={tier.mode}
          onChange={(event) => setBundleTier(qty, { mode: event.target.value as BundlePricingMode, percent_off: null, fixed_total_eur: null })}
          className={inputClass}
        >
          <option value="none">{language === 'fi' ? 'Ei alennusta' : 'No bundle discount'}</option>
          <option value="percent">{language === 'fi' ? 'Alennus %' : 'Discount %'}</option>
          <option value="fixed_total">{language === 'fi' ? 'Kiinteä kokonaishinta' : 'Fixed total price'}</option>
        </select>
        {tier.mode === 'percent' && (
          <input type="number" min="0" max="100" step="0.1" value={tier.percent_off ?? ''} onChange={(event) => setBundleTier(qty, { percent_off: event.target.value ? Number(event.target.value) : null })} className={inputClass} />
        )}
        {tier.mode === 'fixed_total' && (
          <input type="number" min="0" step="0.01" value={tier.fixed_total_eur ?? ''} onChange={(event) => setBundleTier(qty, { fixed_total_eur: event.target.value ? Number(event.target.value) : null })} className={inputClass} />
        )}
        {invalidFixed && (
          <p className={`text-xs ${isDark ? 'text-red-300' : 'text-red-700'}`}>
            {language === 'fi' ? `Kiinteä hinta ei jakaudu tasan ${qty} kappaleelle.` : `Fixed total does not divide evenly across ${qty} units.`}
          </p>
        )}
        <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {language === 'fi' ? 'Esikatselu:' : 'Preview:'} €{preview.lineTotalEur.toFixed(2)}
          {preview.savingsEur > 0 ? ` (${language === 'fi' ? 'säästö' : 'saving'} €${preview.savingsEur.toFixed(2)})` : ''}
        </p>
      </div>
    );
  };

  return (
    <div>
      <h3 className={`mb-4 text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {language === 'fi' ? 'Hinnoittelu ja varasto' : 'Pricing and stock'}
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <input type="number" step="0.01" className={inputClass} value={editData.price_override_eur ?? ''} onChange={(event) => onEditDataChange((prev) => ({ ...prev, price_override_eur: event.target.value ? Number(event.target.value) : null }))} placeholder={language === 'fi' ? 'Hintaoikaisu €' : 'Price override €'} />
        <input type="number" step="0.01" className={inputClass} value={editData.promo_price_eur ?? ''} onChange={(event) => onEditDataChange((prev) => ({ ...prev, promo_price_eur: event.target.value ? Number(event.target.value) : null }))} placeholder={language === 'fi' ? 'Kampanjahinta €' : 'Promo price €'} />
        <input type="datetime-local" className={inputClass} value={editData.promo_start ?? ''} onChange={(event) => onEditDataChange((prev) => ({ ...prev, promo_start: event.target.value || null }))} />
        <input type="datetime-local" className={inputClass} value={editData.promo_end ?? ''} onChange={(event) => onEditDataChange((prev) => ({ ...prev, promo_end: event.target.value || null }))} />
      </div>
      <div className={`mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={Boolean(editData.promo_enabled)} onChange={(event) => onEditDataChange((prev) => ({ ...prev, promo_enabled: event.target.checked }))} />
          {language === 'fi' ? 'Kampanja aktiivinen' : 'Promo enabled'}
        </label>
        <input type="number" step="1" className={inputClass} value={editData.stock_override ?? ''} onChange={(event) => onEditDataChange((prev) => ({ ...prev, stock_override: event.target.value ? Number(event.target.value) : null }))} placeholder={language === 'fi' ? 'Varastosaldo-ohitus' : 'Stock override'} />
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={Boolean(editData.force_out_of_stock)} onChange={(event) => onEditDataChange((prev) => ({ ...prev, force_out_of_stock: event.target.checked }))} />
          {language === 'fi' ? 'Pakota loppuunmyydyksi' : 'Force out of stock'}
        </label>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        {renderBundleTier(2)}
        {renderBundleTier(4)}
      </div>
      {(bundlePricing?.qty2 || bundlePricing?.qty4) && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => onEditDataChange((prev) => ({ ...prev, spec_overrides: setPricingRulesToSpecOverrides(prev.spec_overrides, null) }))}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${
              isDark ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-red-300 bg-red-50 text-red-700'
            }`}
          >
            <RotateCcw className="h-4 w-4" />
            {language === 'fi' ? 'Tyhjennä pakettihinnoittelu' : 'Clear bundle pricing'}
          </button>
        </div>
      )}
    </div>
  );
}
