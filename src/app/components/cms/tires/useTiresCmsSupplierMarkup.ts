import { useLanguage } from '../../../i18n/LanguageContext';
import type { ProductCMS, TireRow } from './types';

export function useTiresCmsSupplierMarkup({
  baseApiPrice,
  selectedTire,
  setEditData,
  setSaveError,
  supplierMarkupAmount,
  supplierMarkupPercent,
}: {
  baseApiPrice: number | null;
  selectedTire: TireRow | null;
  setEditData: React.Dispatch<React.SetStateAction<Partial<ProductCMS>>>;
  setSaveError: React.Dispatch<React.SetStateAction<string | null>>;
  supplierMarkupAmount: string | number;
  supplierMarkupPercent: string | number;
}) {
  const { t } = useLanguage();

  const applySupplierMarkup = () => {
    if (!selectedTire) return;

    const amountText = String(supplierMarkupAmount ?? '').trim();
    const percentText = String(supplierMarkupPercent ?? '').trim();
    const markupAmount = amountText === '' ? 0 : Number(amountText);
    const markupPercent = percentText === '' ? 0 : Number(percentText);

    if (!baseApiPrice || !Number.isFinite(baseApiPrice)) {
      setSaveError(t('tiresSupplierMarkup.noApiPrice'));
      return;
    }

    if (!Number.isFinite(markupAmount) || !Number.isFinite(markupPercent)) {
      setSaveError(t('tiresSupplierMarkup.numericRequired'));
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
      setSaveError(t('tiresSupplierMarkup.invalidFinalPrice'));
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
