import React from 'react';
import { useTheme } from '../ThemeContext';
import { useLanguage } from '../LanguageContext';
import { X, Save, AlertCircle, Upload, GripVertical, RotateCcw } from 'lucide-react';
import { TiresCmsToolbar } from './tires/TiresCmsToolbar';
import { TiresImagesSection } from './tires/TiresImagesSection';
import { TiresBadgesSection } from './tires/TiresBadgesSection';
import { TiresBundlePricingSection } from './tires/TiresBundlePricingSection';
import { TiresCmsTableSection } from './tires/TiresCmsTableSection';
import { TiresContentSection } from './tires/TiresContentSection';
import { TiresEuLabelSection } from './tires/TiresEuLabelSection';
import { TiresIdentitySection } from './tires/TiresIdentitySection';
import { TiresPricingSection } from './tires/TiresPricingSection';
import { TiresSeoSection } from './tires/TiresSeoSection';
import { TiresVisibilitySection } from './tires/TiresVisibilitySection';
import { TiresWarningTooltip } from './tires/TiresWarningTooltip';
import { useTiresCmsEditor, getManualNonPassengerFlag } from './tires/useTiresCmsEditor';
import { useTiresCmsCatalogSync } from './tires/useTiresCmsCatalogSync';
import { useTiresCmsImages } from './tires/useTiresCmsImages';
import { useTiresCmsList } from './tires/useTiresCmsList';
import { useTiresCmsMutations } from './tires/useTiresCmsMutations';
import { useTiresCmsSupplierMarkup } from './tires/useTiresCmsSupplierMarkup';
import { useTiresCmsWarnings } from './tires/useTiresCmsWarnings';
import type { TireRow } from './tires/types';

const EU_FUEL_WET_OPTIONS = ['A', 'B', 'C', 'D', 'E'];
const EU_NOISE_CLASS_OPTIONS = ['A', 'B', 'C'];
const VAT_RATE = 0.255;
const VAT_MULTIPLIER = 1 + VAT_RATE;

const SUPPLIER_OPTIONS = [
  { code: 'RD', label: 'Rengasduo' },
  { code: 'VT', label: 'Vannetukku' },
];

export function TiresCMSPage() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isDark = theme === 'dark';

  const {
    currentPage,
    endItem,
    error,
    fetchTires,
    loading,
    paginationItems,
    patchLocalCmsData,
    patchLocalIdentityData,
    searchTerm,
    setCurrentPage,
    setSearchTerm,
    setShowMissingEanOnly,
    showMissingEanOnly,
    startItem,
    tires,
    totalCount,
    totalPages,
  } = useTiresCmsList(25);

  const {
    catalogSyncMessage,
    handleApplyCatalogSync,
    hasPendingCatalogSync,
    setCatalogSyncMessage,
    setHasPendingCatalogSync,
    syncingCatalog,
  } = useTiresCmsCatalogSync({
    fetchTires,
    language,
  });

  const toNumberOrNull = (value: any) => {
    if (value === null || value === undefined || value === '') return null;
    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const toPriceWithVat = (priceWithoutVat: number | null | undefined) => {
    const numeric = toNumberOrNull(priceWithoutVat);
    if (numeric === null) return null;
    return numeric * VAT_MULTIPLIER;
  };

  const hasMissingSupplierPrice = (tire: TireRow | null) =>
    !tire || tire.final_price_eur === null || tire.final_price_eur === undefined;

  const mustHideFromStore = (tire: TireRow | null) =>
    hasMissingSupplierPrice(tire) || Boolean(tire?.is_non_passenger);

  const {
    clearBundlePricing,
    clearEUOverrides,
    clearFeatureOverrides,
    clearIdentityOverrides,
    closeEditor,
    draggedIndex,
    drawerOpen,
    editData,
    getBundlePricing,
    getEUOverride,
    getEffectiveFeatureValue,
    getEffectiveIdentity,
    getIdentityOverride,
    handleDragEnd,
    handleDragOver,
    handleDragStart,
    handleImageReorder,
    hasEUOverride,
    openEditor,
    selectedTire,
    setBundleTier,
    setEditData,
    setEUField,
    setFeatureField,
    setIdentityField,
    setSupplierMarkupAmount,
    setSupplierMarkupSupplier,
    sizeParts,
    supplierMarkupAmount,
    supplierMarkupSupplier,
    updateSizePart,
  } = useTiresCmsEditor({ mustHideFromStore });

  const {
    clearImageFeedback,
    handleImageUpload,
    handleRemoveImage,
    uploadError,
    uploadingImages,
  } = useTiresCmsImages({
    editData,
    selectedTire,
    setEditData,
  });

  const {
    handleResetCms,
    handleSave,
    handleToggleVisibility,
    saveError,
    saving,
    setSaveError,
  } = useTiresCmsMutations({
    editData,
    fetchTires,
    hasMissingSupplierPrice,
    language,
    onCloseEditor: closeEditor,
    patchLocalCmsData,
    patchLocalIdentityData,
    selectedTire,
    setCatalogSyncMessage,
    setHasPendingCatalogSync,
  });

  const { getWarningTooltip, hideWarningTooltip, showWarningTooltip, warningTooltip } =
    useTiresCmsWarnings(language);

  const handleImageDragOver = (event: React.DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
    handleDragOver(index);
  };

  const handleEdit = (tire: TireRow) => {
    openEditor(tire);
    clearImageFeedback();
  };

  const handleCloseDrawer = () => {
    closeEditor();
    setSaveError(null);
    clearImageFeedback();
  };

  const filteredTires = tires;

  const { applySupplierMarkup, getSupplierLabel } = useTiresCmsSupplierMarkup({
    language,
    selectedTire,
    setEditData,
    setSaveError,
    supplierMarkupAmount,
    supplierMarkupSupplier,
    supplierOptions: SUPPLIER_OPTIONS,
  });

  const originalApiPrice =
    selectedTire?.price !== null && selectedTire?.price !== undefined
      ? Number(selectedTire.price)
      : null;
  const effectiveDraftPrice =
    editData.promo_enabled && editData.promo_price_eur !== null && editData.promo_price_eur !== undefined
      ? Number(editData.promo_price_eur)
      : editData.price_override_eur !== null && editData.price_override_eur !== undefined
        ? Number(editData.price_override_eur)
        : originalApiPrice;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0B0D10]' : 'bg-gray-50'}`}>
      <TiresWarningTooltip isDark={isDark} warningTooltip={warningTooltip} />
      <TiresCmsToolbar
        isDark={isDark}
        language={language}
        searchTerm={searchTerm}
        showMissingEanOnly={showMissingEanOnly}
        syncingCatalog={syncingCatalog}
        hasPendingCatalogSync={hasPendingCatalogSync}
        catalogSyncMessage={catalogSyncMessage}
        onSearchTermChange={setSearchTerm}
        onShowMissingEanOnlyChange={setShowMissingEanOnly}
        onApplyCatalogSync={handleApplyCatalogSync}
      />

      {/* Main Content */}
      <div className="px-8 py-6">
        <TiresCmsTableSection
          currentPage={currentPage}
          endItem={endItem}
          error={error}
          filteredTires={filteredTires}
          getEffectiveIdentity={getEffectiveIdentity}
          getWarningTooltip={getWarningTooltip}
          handleEdit={handleEdit}
          handleToggleVisibility={handleToggleVisibility}
          hasMissingSupplierPrice={hasMissingSupplierPrice}
          hideWarningTooltip={hideWarningTooltip}
          isDark={isDark}
          language={language}
          loading={loading}
          mustHideFromStore={mustHideFromStore}
          onPageChange={setCurrentPage}
          paginationItems={paginationItems}
          showWarningTooltip={showWarningTooltip}
          startItem={startItem}
          totalCount={totalCount}
          totalPages={totalPages}
        />
      </div>

      {/* Edit Drawer */}
      {drawerOpen && selectedTire && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseDrawer}
          />

          {/* Drawer */}
          <div className={`absolute right-0 top-0 bottom-0 w-full max-w-3xl ${
            isDark ? 'bg-[#0B0D10]' : 'bg-white'
          } shadow-2xl overflow-y-auto`}>
            {/* Drawer Header */}
            <div className={`sticky top-0 z-10 border-b ${
              isDark ? 'bg-[#161A22] border-white/10' : 'bg-white border-gray-200'
            } px-6 py-4 flex items-center justify-between`}>
              <div>
                <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fi' ? 'Muokkaa rengasta' : 'Edit Tire'}
                </h2>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {getEffectiveIdentity(selectedTire).brand} {getEffectiveIdentity(selectedTire).model} — {getEffectiveIdentity(selectedTire).size_string || '—'}
                </p>
              </div>
              <button
                onClick={handleCloseDrawer}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                }`}
              >
                <X className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="px-6 py-6 space-y-8">
              
              <TiresIdentitySection
                baseBrand={selectedTire.brand}
                baseDerivedEan={selectedTire.derived_ean}
                baseEan={selectedTire.ean}
                baseModel={selectedTire.model}
                baseSeason={selectedTire.season}
                clearIdentityOverrides={clearIdentityOverrides}
                getIdentityOverride={getIdentityOverride}
                isDark={isDark}
                language={language}
                setIdentityField={setIdentityField}
                sizeParts={sizeParts}
                updateSizePart={updateSizePart}
              />

              <TiresBadgesSection
                clearFeatureOverrides={clearFeatureOverrides}
                getEffectiveFeatureValue={getEffectiveFeatureValue}
                isDark={isDark}
                language={language}
                setFeatureField={setFeatureField}
              />

              <TiresEuLabelSection
                euFuelWetOptions={EU_FUEL_WET_OPTIONS}
                euNoiseClassOptions={EU_NOISE_CLASS_OPTIONS}
                getEuOverride={getEUOverride}
                hasEuOverride={hasEUOverride()}
                isDark={isDark}
                language={language}
                onClearEuOverrides={clearEUOverrides}
                onSetEuField={setEUField}
                selectedTire={selectedTire}
              />

              {/* Section C: Pricing */}
              <TiresPricingSection
                editData={editData}
                effectiveDraftPrice={effectiveDraftPrice}
                getSupplierLabel={getSupplierLabel}
                isDark={isDark}
                language={language}
                onApplySupplierMarkup={applySupplierMarkup}
                onEditDataChange={(updater) => setEditData((prev) => updater(prev))}
                originalApiPrice={originalApiPrice}
                selectedTire={selectedTire}
                setSupplierMarkupAmount={setSupplierMarkupAmount}
                setSupplierMarkupSupplier={setSupplierMarkupSupplier}
                supplierMarkupAmount={supplierMarkupAmount}
                supplierMarkupSupplier={supplierMarkupSupplier}
                supplierOptions={SUPPLIER_OPTIONS}
                toPriceWithVat={toPriceWithVat}
              >
                <TiresBundlePricingSection
                  clearBundlePricing={clearBundlePricing}
                  getBundlePricing={getBundlePricing}
                  isDark={isDark}
                  language={language}
                  selectedTireFinalPriceEur={selectedTire.final_price_eur}
                  selectedTirePrice={selectedTire.price}
                  setBundleTier={setBundleTier}
                />
              </TiresPricingSection>

              <TiresImagesSection
                draggedIndex={draggedIndex}
                editGallery={(editData.gallery as string[]) ?? []}
                handleDragEnd={handleDragEnd}
                handleDragOver={handleImageDragOver}
                handleDragStart={handleDragStart}
                handleImageUpload={handleImageUpload}
                handleRemoveImage={handleRemoveImage}
                isDark={isDark}
                language={language}
                uploadError={uploadError}
                uploadingImages={uploadingImages}
              />

              <TiresContentSection
                editData={editData}
                identityBrand={getEffectiveIdentity(selectedTire).brand}
                identityModel={getEffectiveIdentity(selectedTire).model}
                identitySizeString={getEffectiveIdentity(selectedTire).size_string}
                isDark={isDark}
                language={language}
                onEditDataChange={(updater) => setEditData((prev) => updater(prev))}
              />

              <TiresSeoSection
                editData={editData}
                isDark={isDark}
                language={language}
                onEditDataChange={(updater) => setEditData((prev) => updater(prev))}
              />

              <TiresVisibilitySection
                editData={editData}
                hasMissingSupplierPrice={hasMissingSupplierPrice}
                isDark={isDark}
                isManualNonPassenger={getManualNonPassengerFlag(editData.spec_overrides)}
                language={language}
                mustHideFromStore={mustHideFromStore}
                onHiddenChange={(hidden) => setEditData((prev) => ({ ...prev, is_hidden: hidden }))}
                onManualNonPassengerChange={(checked) =>
                  setEditData((prev) => {
                    const currentOverrides = prev.spec_overrides || {};
                    const currentClassification = (currentOverrides.classification || {}) as Record<string, any>;
                    const nextClassification = { ...currentClassification };

                    if (checked) {
                      nextClassification.non_passenger_manual = true;
                    } else {
                      delete nextClassification.non_passenger_manual;
                    }

                    const { classification, ...restOverrides } = currentOverrides;
                    const nextOverrides = {
                      ...restOverrides,
                      ...(Object.keys(nextClassification).length > 0 ? { classification: nextClassification } : {}),
                    };

                    return {
                      ...prev,
                      spec_overrides: Object.keys(nextOverrides).length > 0 ? nextOverrides : null,
                    };
                  })
                }
                selectedTire={selectedTire}
              />

              {/* Save Error */}
              {saveError && (
                <div className={`flex gap-3 p-4 rounded-lg ${
                  isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'
                }`}>
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{saveError}</p>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className={`sticky bottom-0 border-t ${
              isDark ? 'bg-[#161A22] border-white/10' : 'bg-white border-gray-200'
            } px-6 py-4 flex items-center justify-between gap-3`}>
              <button
                onClick={handleResetCms}
                disabled={saving}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark
                    ? 'border border-red-500/40 text-red-300 hover:bg-red-500/20'
                    : 'border border-red-300 text-red-600 hover:bg-red-50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <RotateCcw className="w-4 h-4" />
                {language === 'fi' ? 'Tyhjennä CMS' : 'Reset CMS'}
              </button>
              <button
                onClick={handleCloseDrawer}
                disabled={saving}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark 
                    ? 'bg-white/10 text-white hover:bg-white/20' 
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {language === 'fi' ? 'Peruuta' : 'Cancel'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Save className="w-4 h-4" />
                {saving ? (language === 'fi' ? 'Tallennetaan...' : 'Saving...') : (language === 'fi' ? 'Tallenna' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
