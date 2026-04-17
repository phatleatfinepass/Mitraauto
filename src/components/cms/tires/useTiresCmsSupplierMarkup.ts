import type { ProductCMS, TireRow } from './types';

function getSupplierLabel(code: string | null | undefined, supplierOptions: Array<{ code: string; label: string }>) {
  const normalized = String(code ?? '').trim().toUpperCase();
  const known = supplierOptions.find((option) => option.code === normalized);
  return known?.label ?? (normalized || 'Unknown supplier');
}

export function useTiresCmsSupplierMarkup({
  language,
  selectedTire,
  setEditData,
  setSaveError,
  supplierMarkupAmount,
  supplierMarkupSupplier,
  supplierOptions,
}: {
  language: string;
  selectedTire: TireRow | null;
  setEditData: React.Dispatch<React.SetStateAction<Partial<ProductCMS>>>;
  setSaveError: React.Dispatch<React.SetStateAction<string | null>>;
  supplierMarkupAmount: string | number;
  supplierMarkupSupplier: string | null | undefined;
  supplierOptions: Array<{ code: string; label: string }>;
}) {
  const applySupplierMarkup = () => {
    if (!selectedTire) return;

    const selectedSupplier = String(supplierMarkupSupplier ?? '').trim().toUpperCase();
    const tireSupplier = String(selectedTire.supplier_code_best ?? '').trim().toUpperCase();
    const baseApiPrice =
      selectedTire.price !== null && selectedTire.price !== undefined ? Number(selectedTire.price) : null;
    const markupAmount = Number(supplierMarkupAmount);

    if (!baseApiPrice || !Number.isFinite(baseApiPrice)) {
      setSaveError(language === 'fi' ? 'API-hintaa ei löytynyt tälle tuotteelle.' : 'No API price was found for this tire.');
      return;
    }

    if (!Number.isFinite(markupAmount)) {
      setSaveError(language === 'fi' ? 'Lisähinnan pitää olla numero.' : 'Markup amount must be a number.');
      return;
    }

    if (selectedSupplier !== tireSupplier) {
      setSaveError(
        language === 'fi'
          ? `Valittu toimittaja (${getSupplierLabel(selectedSupplier, supplierOptions)}) ei vastaa renkaan toimittajaa (${getSupplierLabel(tireSupplier, supplierOptions)}).`
          : `Selected supplier (${getSupplierLabel(selectedSupplier, supplierOptions)}) does not match this tire's supplier (${getSupplierLabel(tireSupplier, supplierOptions)}).`
      );
      return;
    }

    setSaveError(null);
    setEditData((prev) => ({
      ...prev,
      price_override_eur: Math.round((baseApiPrice + markupAmount) * 100) / 100,
    }));
  };

  return {
    applySupplierMarkup,
    getSupplierLabel: (code: string | null | undefined) => getSupplierLabel(code, supplierOptions),
  };
}
