import type { ProductCMS, TireRow } from './types';

export function useTiresCmsSupplierMarkup({
  baseApiPrice,
  language,
  selectedTire,
  setEditData,
  setSaveError,
  supplierMarkupAmount,
  supplierMarkupPercent,
}: {
  baseApiPrice: number | null;
  language: string;
  selectedTire: TireRow | null;
  setEditData: React.Dispatch<React.SetStateAction<Partial<ProductCMS>>>;
  setSaveError: React.Dispatch<React.SetStateAction<string | null>>;
  supplierMarkupAmount: string | number;
  supplierMarkupPercent: string | number;
}) {
  const applySupplierMarkup = () => {
    if (!selectedTire) return;

    const amountText = String(supplierMarkupAmount ?? '').trim();
    const percentText = String(supplierMarkupPercent ?? '').trim();
    const markupAmount = amountText === '' ? 0 : Number(amountText);
    const markupPercent = percentText === '' ? 0 : Number(percentText);

    if (!baseApiPrice || !Number.isFinite(baseApiPrice)) {
      setSaveError(language === 'fi' ? 'API-hintaa ei löytynyt tälle tuotteelle.' : 'No API price was found for this tire.');
      return;
    }

    if (!Number.isFinite(markupAmount) || !Number.isFinite(markupPercent)) {
      setSaveError(
        language === 'fi'
          ? 'Hintaeron pitää olla numero.'
          : 'Markup or discount must be numeric.'
      );
      return;
    }

    if (amountText === '' && percentText === '') {
      setEditData((prev) => ({
        ...prev,
        price_override_eur: null,
      }));
      setSaveError(null);
      return;
    }

    const nextPrice = baseApiPrice * (1 + markupPercent / 100) + markupAmount;

    if (!Number.isFinite(nextPrice) || nextPrice < 0) {
      setSaveError(language === 'fi' ? 'Lopullinen hinta ei ole kelvollinen.' : 'Final price is not valid.');
      return;
    }

    setSaveError(null);
    setEditData((prev) => ({
      ...prev,
      price_override_eur: Math.round(nextPrice * 100) / 100,
    }));
  };

  return {
    applySupplierMarkup,
  };
}
