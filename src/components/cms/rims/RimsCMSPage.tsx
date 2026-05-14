import { AlertCircle, RotateCcw, Save, X } from 'lucide-react';

import { useLanguage } from '../../../i18n/LanguageContext';
import { useTheme } from '../../../theme/ThemeContext';
import { RimsCmsPagination } from './RimsCmsPagination';
import { RimsCmsTableSection } from './RimsCmsTableSection';
import { RimsCmsToolbar } from './RimsCmsToolbar';
import { RimsContentSection } from './RimsContentSection';
import { RimsImagesSection } from './RimsImagesSection';
import { RimsPricingSection } from './RimsPricingSection';
import { RimsSpecsSection } from './RimsSpecsSection';
import { RimsVisibilitySection } from './RimsVisibilitySection';
import { useRimsCmsEditor } from './useRimsCmsEditor';
import { useRimsCmsImages } from './useRimsCmsImages';
import { useRimsCmsList } from './useRimsCmsList';
import { useRimsCmsMutations } from './useRimsCmsMutations';
import type { RimRow } from './types';

const VAT_RATE = 0.255;
const VAT_MULTIPLIER = 1 + VAT_RATE;

function toPriceWithVat(priceWithoutVat: number | null | undefined) {
  if (priceWithoutVat === null || priceWithoutVat === undefined) return null;
  const numeric = Number(priceWithoutVat);
  return Number.isFinite(numeric) ? numeric * VAT_MULTIPLIER : null;
}

function formatSize(rim: RimRow) {
  if (rim.size_string) return rim.size_string;
  const parts = [];
  if (rim.width_in) parts.push(`${rim.width_in}"`);
  if (rim.rim_diameter_in) parts.push(`${rim.rim_diameter_in}"`);
  if (rim.et_offset_mm !== null && rim.et_offset_mm !== undefined) parts.push(`ET${rim.et_offset_mm}`);
  if (rim.bolt_pattern) parts.push(rim.bolt_pattern);
  if (rim.center_bore_mm ?? rim.cb_mm) parts.push(`CB${rim.center_bore_mm ?? rim.cb_mm}`);
  return parts.join(' x ') || '-';
}

export function RimsCMSPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === 'dark';
  const pageSize = 100;

  const list = useRimsCmsList(pageSize);
  const editor = useRimsCmsEditor();
  const images = useRimsCmsImages({
    selectedRim: editor.selectedRim,
    editData: editor.editData,
    onEditDataChange: editor.setEditData,
  });
  const mutations = useRimsCmsMutations({
    selectedRim: editor.selectedRim,
    editData: editor.editData,
    patchLocalCmsData: list.patchLocalCmsData,
    closeEditor: editor.closeEditor,
    refreshRims: list.fetchRims,
    setError: list.setError,
  });

  const totalPages = Math.max(1, Math.ceil(list.totalCount / pageSize));
  const clampedPage = Math.min(list.currentPage, totalPages);
  const startItem = list.totalCount === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const endItem = Math.min(clampedPage * pageSize, list.totalCount);
  const paginationItems = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

    const items: Array<number | 'ellipsis-left' | 'ellipsis-right'> = [1];
    const windowStart = Math.max(2, clampedPage - 1);
    const windowEnd = Math.min(totalPages - 1, clampedPage + 1);
    if (windowStart > 2) items.push('ellipsis-left');
    for (let page = windowStart; page <= windowEnd; page += 1) items.push(page);
    if (windowEnd < totalPages - 1) items.push('ellipsis-right');
    items.push(totalPages);
    return items;
  })();

  return (
    <div className={`${embedded ? 'min-h-0' : 'min-h-screen'} ${isDark ? 'bg-[#0B0D10]' : 'bg-gray-50'}`}>
      <RimsCmsToolbar
        isDark={isDark}
        hideHeader={embedded}
        searchTerm={list.searchTerm}
        supplierFilter={list.supplierFilter}
        showMissingPriceOnly={list.showMissingPriceOnly}
        showMissingImagesOnly={list.showMissingImagesOnly}
        showMissingSeoOnly={list.showMissingSeoOnly}
        showMissingSpecsOnly={list.showMissingSpecsOnly}
        statusFilter={list.statusFilter}
        syncing={mutations.syncing}
        hasPendingCatalogSync={mutations.hasPendingCatalogSync}
        catalogSyncMessage={mutations.catalogSyncMessage}
        onSearchTermChange={list.setSearchTerm}
        onSupplierFilterChange={list.setSupplierFilter}
        onShowMissingPriceOnlyChange={list.setShowMissingPriceOnly}
        onShowMissingImagesOnlyChange={list.setShowMissingImagesOnly}
        onShowMissingSeoOnlyChange={list.setShowMissingSeoOnly}
        onShowMissingSpecsOnlyChange={list.setShowMissingSpecsOnly}
        onStatusFilterChange={list.setStatusFilter}
        onApplySync={mutations.applyRimWebshopSync}
      />

      <div className="px-8 py-6">
        {list.loading ? (
          <div className="py-20 text-center">
            <div className={`mx-auto h-12 w-12 animate-spin rounded-full border-b-2 ${isDark ? 'border-white' : 'border-gray-900'}`} />
          </div>
        ) : list.error ? (
          <div className={`rounded-lg p-4 ${isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
            <p>{list.error}</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('rimsCmsPage.totalItems', { total: list.totalCount })}
                {list.refreshing ? ` (${t('rimsCmsPage.refreshing')})` : ''}
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {t('rimsCmsPage.showingPage', {
                  start: startItem,
                  end: endItem,
                  total: list.totalCount,
                  page: clampedPage,
                  pages: totalPages,
                })}
              </p>
            </div>

            <RimsCmsTableSection
              isDark={isDark}
              rims={list.rims}
              formatSize={formatSize}
              onToggleVisibility={mutations.handleToggleVisibility}
              onEdit={editor.openEditor}
            />

            {list.rims.length === 0 && (
              <div className="py-20 text-center">
                <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('rimsCmsPage.noRims')}
                </p>
              </div>
            )}

            <RimsCmsPagination
              isDark={isDark}
              currentPage={clampedPage}
              totalPages={totalPages}
              totalCount={list.totalCount}
              startItem={startItem}
              endItem={endItem}
              paginationItems={paginationItems}
              onPageChange={list.setCurrentPage}
            />
          </>
        )}
      </div>

      {editor.drawerOpen && editor.selectedRim && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={editor.closeEditor} />

          <div className={`absolute bottom-0 right-0 top-0 w-full max-w-4xl overflow-y-auto shadow-2xl ${isDark ? 'bg-[#0B0D10]' : 'bg-white'}`}>
            <div className={`sticky top-0 z-10 flex items-center justify-between border-b px-6 py-4 ${isDark ? 'bg-[#161A22] border-white/10' : 'bg-white border-gray-200'}`}>
              <div>
                <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('rimsCmsPage.editRim')}
                </h2>
                <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {editor.selectedRim.brand} {editor.selectedRim.model} - {formatSize(editor.selectedRim)}
                </p>
              </div>
              <button
                type="button"
                onClick={editor.closeEditor}
                className={`rounded-lg p-2 transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
              >
                <X className={`h-6 w-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>

            <div className="space-y-8 px-6 py-6">
              <div>
                <h3 className={`mb-4 text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('rimsCmsPage.identity')}
                </h3>
                <div className={`grid grid-cols-2 gap-4 rounded-lg p-4 md:grid-cols-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  {[
                    [t('rimsCmsPage.brand'), editor.selectedRim.brand],
                    [t('rimsCmsPage.model'), editor.selectedRim.model || '-'],
                    ['EAN', editor.selectedRim.ean || '-'],
                    [t('rimsCmsPage.size'), formatSize(editor.selectedRim)],
                    ['PCD', editor.selectedRim.bolt_pattern || '-'],
                    ['ET', editor.selectedRim.et_offset_mm ?? '-'],
                    [t('rimsCmsPage.priceVat0'), editor.selectedRim.price_eur !== null ? `€${editor.selectedRim.price_eur.toFixed(2)}` : '-'],
                    [t('rimsCmsPage.priceVat255'), toPriceWithVat(editor.selectedRim.price_eur) !== null ? `€${toPriceWithVat(editor.selectedRim.price_eur)!.toFixed(2)}` : '-'],
                  ].map(([label, value]) => (
                    <div key={String(label)}>
                      <label className={`mb-1 block text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {label}
                      </label>
                      <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <RimsImagesSection
                isDark={isDark}
                selectedRim={editor.selectedRim}
                gallery={images.gallery}
                supplierFallbackUrl={images.supplierFallbackUrl}
                onGalleryChange={images.setGallery}
              />
              <RimsContentSection
                isDark={isDark}
                selectedRim={editor.selectedRim}
                editData={editor.editData}
                onEditDataChange={editor.setEditData}
              />
              <RimsSpecsSection
                isDark={isDark}
                selectedRim={editor.selectedRim}
                editData={editor.editData}
                onEditDataChange={editor.setEditData}
              />
              <RimsPricingSection
                isDark={isDark}
                selectedRim={editor.selectedRim}
                editData={editor.editData}
                onEditDataChange={editor.setEditData}
              />
              <RimsVisibilitySection
                isDark={isDark}
                selectedRim={editor.selectedRim}
                editData={editor.editData}
                onEditDataChange={editor.setEditData}
              />

              {mutations.saveError && (
                <div className={`flex gap-3 rounded-lg p-4 ${isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">{mutations.saveError}</p>
                </div>
              )}
            </div>

            <div className={`sticky bottom-0 flex items-center justify-between gap-3 border-t px-6 py-4 ${isDark ? 'bg-[#161A22] border-white/10' : 'bg-white border-gray-200'}`}>
              <button
                type="button"
                onClick={mutations.handleResetCms}
                disabled={mutations.saving}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isDark ? 'border border-red-500/40 text-red-300 hover:bg-red-500/20' : 'border border-red-300 text-red-600 hover:bg-red-50'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <RotateCcw className="h-4 w-4" />
                {t('rimsCmsPage.resetCms')}
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={editor.closeEditor}
                  disabled={mutations.saving}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {t('rimsCmsPage.cancel')}
                </button>
                <button
                  type="button"
                  onClick={mutations.handleSave}
                  disabled={mutations.saving}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isDark ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <Save className="h-4 w-4" />
                  {mutations.saving ? t('rimsCmsPage.saving') : t('rimsCmsPage.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RimsCMSPage;
