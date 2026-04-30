import type { ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import type { ProductCMS, TireRow } from './types';

interface TiresPricingSectionProps {
  costAfterFeesExVat: number | null;
  children?: ReactNode;
  editData: Partial<ProductCMS>;
  effectiveDraftPrice: number | null;
  isDark: boolean;
  language: string;
  onApplySupplierMarkup: () => void;
  onEditDataChange: (updater: (prev: Partial<ProductCMS>) => Partial<ProductCMS>) => void;
  originalApiPrice: number | null;
  recyclingFeeExVat: number | null;
  selectedTire: TireRow | null;
  shippingFeeExVat: number | null;
  supplierMarkupAmount: string;
  supplierMarkupPercent: string;
  toPriceWithVat: (priceWithoutVat: number | null | undefined) => number | null;
  setSupplierMarkupAmount: (value: string) => void;
  setSupplierMarkupPercent: (value: string) => void;
}

export function TiresPricingSection({
  costAfterFeesExVat,
  children,
  editData,
  effectiveDraftPrice,
  isDark,
  language,
  onApplySupplierMarkup,
  onEditDataChange,
  originalApiPrice,
  recyclingFeeExVat,
  selectedTire,
  shippingFeeExVat,
  setSupplierMarkupAmount,
  setSupplierMarkupPercent,
  supplierMarkupAmount,
  supplierMarkupPercent,
  toPriceWithVat,
}: TiresPricingSectionProps) {
  const formatMoney = (value: number | null | undefined) =>
    value === null || value === undefined ? '—' : `€${value.toFixed(2)}`;
  const baseEffectivePrice = costAfterFeesExVat ?? originalApiPrice;
  const hasPriceOverride = editData.price_override_eur !== null && editData.price_override_eur !== undefined;
  const hasPercentAdjustmentInput = supplierMarkupPercent.trim() !== '' && Number.isFinite(Number(supplierMarkupPercent));
  const hasAmountAdjustmentInput = supplierMarkupAmount.trim() !== '' && Number.isFinite(Number(supplierMarkupAmount));
  const hasActiveDraftPriceAdjustment = (hasPercentAdjustmentInput || hasAmountAdjustmentInput) && !editData.promo_enabled;
  const showOverridePreview =
    hasActiveDraftPriceAdjustment &&
    hasPriceOverride &&
    baseEffectivePrice !== null &&
    baseEffectivePrice !== undefined &&
    Number(editData.price_override_eur) !== Number(baseEffectivePrice);
  const finalBasePriceWithVat = toPriceWithVat(baseEffectivePrice ?? null);
  const finalDraftPriceWithVat = toPriceWithVat(effectiveDraftPrice ?? null);
  const priceTextClass = isDark ? 'text-gray-200' : 'text-gray-800';
  const applyDraftPriceAdjustment = (nextPercent: string, nextAmount: string) => {
    if (!selectedTire) return;
    if (baseEffectivePrice === null || baseEffectivePrice === undefined || !Number.isFinite(Number(baseEffectivePrice))) return;

    const percentText = nextPercent.trim();
    const amountText = nextAmount.trim();
    if (percentText === '' && amountText === '') {
      onEditDataChange((prev) => ({ ...prev, price_override_eur: null }));
      return;
    }

    const percent = percentText === '' ? 0 : Number(percentText);
    const amount = amountText === '' ? 0 : Number(amountText);
    if (!Number.isFinite(percent) || !Number.isFinite(amount)) return;

    const nextPrice = Number(baseEffectivePrice) * (1 + percent / 100) + amount;
    if (!Number.isFinite(nextPrice) || nextPrice < 0) return;

    onEditDataChange((prev) => ({
      ...prev,
      price_override_eur: Math.round(nextPrice * 100) / 100,
    }));
  };
  const renderPriceValue = (
    currentValue: number | null | undefined,
    originalValue?: number | null,
    highlight = false,
  ) => {
    if (highlight && originalValue !== null && originalValue !== undefined && currentValue !== null && currentValue !== undefined) {
      return (
        <span className="flex flex-wrap items-center justify-end gap-2 text-right">
          <span className={`font-medium line-through ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {formatMoney(originalValue)}
          </span>
          <span className="rounded-md bg-orange-500/15 px-2 py-1 font-semibold text-orange-500">
            {formatMoney(currentValue)}
          </span>
        </span>
      );
    }

    return <span className={`font-semibold ${priceTextClass}`}>{formatMoney(currentValue)}</span>;
  };

  return (
    <div>
      <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {language === 'fi' ? 'Hinnoittelu' : 'Pricing'}
      </h3>

      <div className="space-y-4">
        <div className={`p-4 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
          <div className="flex justify-between items-center mb-2">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'fi' ? 'API / tietokannan alkuperäinen hinta (ilman ALV):' : 'Original API / database price (excl. VAT):'}
            </span>
            <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {formatMoney(originalApiPrice)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'fi' ? 'Kierrätysmaksu (ilman ALV):' : 'Recycling fee (excl. VAT):'}
            </span>
            <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {formatMoney(recyclingFeeExVat)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'fi' ? 'Toimitus (ilman ALV):' : 'Shipping (excl. VAT):'}
            </span>
            <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {formatMoney(shippingFeeExVat)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'fi'
                ? 'Kustannus kierrätyksen + toimituksen jälkeen (ilman ALV):'
                : 'Cost after recycling + shipping excl. VAT:'}
            </span>
            <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {formatMoney(costAfterFeesExVat)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'fi' ? 'Nykyinen voimassa oleva hinta (ilman ALV):' : 'Current effective price (excl. VAT):'}
            </span>
            {renderPriceValue(effectiveDraftPrice, baseEffectivePrice, showOverridePreview)}
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'fi' ? 'Lopullinen voimassa oleva hinta ALV 25.5% kanssa:' : 'Final effective price incl. VAT 25.5%:'}
            </span>
            {renderPriceValue(finalDraftPriceWithVat, finalBasePriceWithVat, showOverridePreview)}
          </div>
        </div>

        <div className={`rounded-lg border p-4 space-y-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {language === 'fi' ? 'Hintaero tälle renkaalle' : 'Markup or discount by'}
              </h4>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {language === 'fi'
                  ? 'Koskee vain tätä rengasta. Massahinnoittelu tehdään erillisestä näkymäasetuksesta.'
                  : 'Applies only to this tire. Bulk pricing stays in the dedicated view settings action.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onApplySupplierMarkup}
              className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
            >
              {language === 'fi' ? 'Käytä' : 'Apply'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {language === 'fi' ? 'Prosentti (%)' : 'Percent (%)'}
              </label>
              <input
                type="number"
                step="0.01"
                value={supplierMarkupPercent}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setSupplierMarkupPercent(nextValue);
                  applyDraftPriceAdjustment(nextValue, supplierMarkupAmount);
                }}
                placeholder="0"
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {language === 'fi' ? 'Summa (€)' : 'Amount (€)'}
              </label>
              <input
                type="number"
                step="0.01"
                value={supplierMarkupAmount}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setSupplierMarkupAmount(nextValue);
                  applyDraftPriceAdjustment(supplierMarkupPercent, nextValue);
                }}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
          </div>

          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {language === 'fi'
              ? 'Lasketaan nykyisestä API-kustannuksesta. Negatiivinen prosentti tai summa laskee hintaa.'
              : 'Calculated from the current API cost. Negative percent or amount lowers the price.'}
          </p>
          {hasPriceOverride && (
            <button
              type="button"
              onClick={() => {
                setSupplierMarkupAmount('');
                setSupplierMarkupPercent('');
                onEditDataChange((prev) => ({ ...prev, price_override_eur: null }));
              }}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                isDark
                  ? 'border-white/10 text-gray-200 hover:bg-white/10'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {language === 'fi' ? 'Palauta API-hinta' : 'Restore API price'}
            </button>
          )}
        </div>

        <div className="border-t pt-4 border-white/10">
          <label className="mb-4 flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={editData.promo_enabled || false}
              onChange={(e) => onEditDataChange((prev) => ({ ...prev, promo_enabled: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300"
            />
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {language === 'fi' ? 'Tarjoushinta käytössä' : 'Promotional price enabled'}
            </span>
          </label>

          {editData.promo_enabled && (
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fi' ? 'Tarjoushinta (€)' : 'Promo Price (€)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editData.promo_price_eur ?? ''}
                  onChange={(e) =>
                    onEditDataChange((prev) => ({
                      ...prev,
                      promo_price_eur: e.target.value ? parseFloat(e.target.value) : null,
                    }))
                  }
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fi' ? 'Alkaa' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    value={editData.promo_start ?? ''}
                    onChange={(e) => onEditDataChange((prev) => ({ ...prev, promo_start: e.target.value || null }))}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                  <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {language === 'fi' ? 'ALV 25.5% kanssa:' : 'Incl. VAT 25.5%:'}{' '}
                    €{(toPriceWithVat(editData.promo_price_eur ?? null) ?? 0).toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fi' ? 'Päättyy' : 'End Date'}
                  </label>
                  <input
                    type="date"
                    value={editData.promo_end ?? ''}
                    onChange={(e) => onEditDataChange((prev) => ({ ...prev, promo_end: e.target.value || null }))}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
