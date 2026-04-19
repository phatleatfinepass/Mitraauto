import type { ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import type { ProductCMS, TireRow } from './types';

interface SupplierOption {
  code: string;
  label: string;
}

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
  supplierMarkupSupplier: string;
  supplierOptions: SupplierOption[];
  toPriceWithVat: (priceWithoutVat: number | null | undefined) => number | null;
  getSupplierLabel: (code: string | null | undefined) => string;
  setSupplierMarkupAmount: (value: string) => void;
  setSupplierMarkupSupplier: (value: string) => void;
}

export function TiresPricingSection({
  costAfterFeesExVat,
  children,
  editData,
  effectiveDraftPrice,
  getSupplierLabel,
  isDark,
  language,
  onApplySupplierMarkup,
  onEditDataChange,
  originalApiPrice,
  recyclingFeeExVat,
  selectedTire,
  shippingFeeExVat,
  setSupplierMarkupAmount,
  setSupplierMarkupSupplier,
  supplierMarkupAmount,
  supplierMarkupSupplier,
  supplierOptions,
  toPriceWithVat,
}: TiresPricingSectionProps) {
  const formatMoney = (value: number | null | undefined) =>
    value === null || value === undefined ? '—' : `€${value.toFixed(2)}`;

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
            <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {formatMoney(effectiveDraftPrice)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'fi' ? 'Lopullinen voimassa oleva hinta ALV 25.5% kanssa:' : 'Final effective price incl. VAT 25.5%:'}
            </span>
            <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {formatMoney(toPriceWithVat(effectiveDraftPrice ?? null))}
            </span>
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fi' ? 'Hinnan ohitus (€)' : 'Price Override (€)'}
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={editData.price_override_eur ?? ''}
            onChange={(e) =>
              onEditDataChange((prev) => ({
                ...prev,
                price_override_eur: e.target.value ? parseFloat(e.target.value) : null,
              }))
            }
            placeholder={language === 'fi' ? 'Jätä tyhjäksi käyttääksesi perushintaa' : 'Leave empty to use base price'}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark
                ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
          />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'fi'
                ? 'Tyhjä arvo palauttaa alkuperäisen API-hinnan.'
                : 'Leaving this empty restores the original API price.'}
            </p>
            {editData.price_override_eur !== null && editData.price_override_eur !== undefined && (
              <button
                type="button"
                onClick={() => onEditDataChange((prev) => ({ ...prev, price_override_eur: null }))}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  isDark
                    ? 'border-white/10 text-gray-200 hover:bg-white/10'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {language === 'fi' ? 'Palauta alkuperäinen API-hinta' : 'Restore original API price'}
              </button>
            )}
          </div>
          <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {language === 'fi' ? 'ALV 25.5% kanssa:' : 'Incl. VAT 25.5%:'}{' '}
            €{(toPriceWithVat(editData.price_override_eur ?? null) ?? 0).toFixed(2)}
          </p>
        </div>

        <div className={`rounded-lg border p-4 space-y-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {language === 'fi' ? 'Toimittajan hintaero' : 'Supplier markup or discount'}
              </h4>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {language === 'fi'
                  ? `Nykyinen toimittaja: ${getSupplierLabel(selectedTire?.supplier_code_best)}`
                  : `Current supplier: ${getSupplierLabel(selectedTire?.supplier_code_best)}`}
              </p>
            </div>
            <button
              type="button"
              onClick={onApplySupplierMarkup}
              className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
            >
              {language === 'fi' ? 'Lisää API-hintaan' : 'Apply to API price'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_1fr]">
            <div>
              <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {language === 'fi' ? 'Toimittaja' : 'Supplier'}
              </label>
              <select
                value={supplierMarkupSupplier}
                onChange={(e) => setSupplierMarkupSupplier(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {supplierOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
                {selectedTire?.supplier_code_best &&
                  !supplierOptions.some((option) => option.code === String(selectedTire.supplier_code_best).trim().toUpperCase()) && (
                    <option value={String(selectedTire.supplier_code_best).trim().toUpperCase()}>
                      {getSupplierLabel(selectedTire.supplier_code_best)}
                    </option>
                  )}
              </select>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {language === 'fi' ? 'Hintaero (€)' : 'Markup or discount (€)'}
              </label>
              <input
                type="number"
                step="0.01"
                value={supplierMarkupAmount}
                onChange={(e) => setSupplierMarkupAmount(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
          </div>

          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {language === 'fi'
              ? 'Tämä asettaa hinnan ohituksen muotoon API-hinta + hintaero. Negatiivinen arvo laskee hintaa.'
              : 'This sets the price override as API price plus a markup or discount. Negative values lower the price.'}
          </p>
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
