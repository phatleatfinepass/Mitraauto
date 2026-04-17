import { AlertTriangle, Edit, Eye, EyeOff } from 'lucide-react';
import { TiresCmsPagination } from './TiresCmsPagination';
import type { TireRow } from './types';

interface TiresTableSectionProps {
  currentPage: number;
  endItem: number;
  error: string | null;
  filteredTires: TireRow[];
  getEffectiveIdentity: (tire: TireRow | null) => { brand: string; model: string; size_string: string };
  getWarningTooltip: (tire: TireRow) => string;
  handleEdit: (tire: TireRow) => void;
  handleToggleVisibility: (tire: TireRow) => void;
  hasMissingSupplierPrice: (tire: TireRow | null) => boolean;
  hideWarningTooltip: () => void;
  isDark: boolean;
  language: string;
  loading: boolean;
  mustHideFromStore: (tire: TireRow | null) => boolean;
  onPageChange: (page: number) => void;
  paginationItems: Array<number | 'ellipsis-left' | 'ellipsis-right'>;
  showWarningTooltip: (text: string, x: number, y: number) => void;
  startItem: number;
  totalCount: number;
  totalPages: number;
}

export function TiresCmsTableSection({
  currentPage,
  endItem,
  error,
  filteredTires,
  getEffectiveIdentity,
  getWarningTooltip,
  handleEdit,
  handleToggleVisibility,
  hasMissingSupplierPrice,
  hideWarningTooltip,
  isDark,
  language,
  loading,
  mustHideFromStore,
  onPageChange,
  paginationItems,
  showWarningTooltip,
  startItem,
  totalCount,
  totalPages,
}: TiresTableSectionProps) {
  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className={`mx-auto h-12 w-12 animate-spin rounded-full border-b-2 ${isDark ? 'border-white' : 'border-gray-900'}`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-lg p-4 ${isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {language === 'fi' ? `Yhteensä ${totalCount} tuotetta` : `${totalCount} items total`}
        </p>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {language === 'fi'
            ? `Näytetään ${startItem}-${endItem} / ${totalCount} (sivu ${currentPage}/${totalPages})`
            : `Showing ${startItem}-${endItem} of ${totalCount} (page ${currentPage}/${totalPages})`}
        </p>
      </div>

      <div className={`overflow-hidden rounded-lg border ${isDark ? 'border-white/10 bg-[#161A22]' : 'border-gray-200 bg-white'}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{language === 'fi' ? 'Brändi' : 'Brand'}</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{language === 'fi' ? 'Malli' : 'Model'}</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{language === 'fi' ? 'Koko' : 'Size'}</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>EAN</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{language === 'fi' ? 'Hinta' : 'Price'}</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{language === 'fi' ? 'Näkyvyys' : 'Visible'}</th>
                <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{language === 'fi' ? 'Toiminnot' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredTires.map((tire) => (
                <tr
                  key={tire.variant_id}
                  className={`${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} ${tire.ean_conflict_open ? (isDark ? 'bg-yellow-500/10' : 'bg-yellow-50') : ''}`}
                >
                  <td className={`${isDark ? 'text-white' : 'text-gray-900'} px-4 py-3`}>
                    <div className="flex items-center gap-2">
                      {getEffectiveIdentity(tire).brand}
                      {tire.ean_conflict_open && (
                        <span
                          className="inline-flex cursor-help items-center px-1"
                          aria-label={getWarningTooltip(tire)}
                          onMouseEnter={(e) => showWarningTooltip(getWarningTooltip(tire), e.clientX, e.clientY)}
                          onMouseMove={(e) => showWarningTooltip(getWarningTooltip(tire), e.clientX, e.clientY)}
                          onMouseLeave={hideWarningTooltip}
                          onFocus={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            showWarningTooltip(getWarningTooltip(tire), rect.left, rect.bottom);
                          }}
                          onBlur={hideWarningTooltip}
                        >
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        </span>
                      )}
                      {tire.is_non_passenger && (
                        <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700'}`}>
                          {language === 'fi'
                            ? (tire.is_non_passenger_manual ? 'Ei-henkilöauto (manuaali)' : 'Ei-henkilöauto')
                            : (tire.is_non_passenger_manual ? 'Non-passenger (manual)' : 'Non-passenger')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={`${isDark ? 'text-gray-300' : 'text-gray-700'} px-4 py-3`}>{getEffectiveIdentity(tire).model}</td>
                  <td className={`${isDark ? 'text-gray-400' : 'text-gray-600'} px-4 py-3`}>{getEffectiveIdentity(tire).size_string || '—'}</td>
                  <td className={`px-4 py-3 text-xs font-mono ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{tire.derived_ean || '—'}</td>
                  <td className={`${isDark ? 'text-white' : 'text-gray-900'} px-4 py-3`}>
                    {tire.final_price_eur !== null && tire.final_price_eur !== undefined ? `€${tire.final_price_eur.toFixed(2)}` : '—'}
                    {hasMissingSupplierPrice(tire) && (
                      <p className={`mt-1 text-xs ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                        {language === 'fi' ? 'Toimittajahinta puuttuu' : 'Missing supplier price'}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleVisibility(tire)}
                      className={`rounded p-1 transition-colors ${
                        (tire.cms_data?.is_hidden || mustHideFromStore(tire))
                          ? (isDark ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600')
                          : (isDark ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700')
                      }`}
                    >
                      {(tire.cms_data?.is_hidden || mustHideFromStore(tire)) ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleEdit(tire)}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                        isDark ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      <Edit className="h-4 w-4" />
                      {language === 'fi' ? 'Muokkaa' : 'Edit'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredTires.length === 0 && (
        <div className="py-20 text-center">
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {language === 'fi' ? 'Ei renkaita löytynyt' : 'No tires found'}
          </p>
        </div>
      )}

      <TiresCmsPagination
        isDark={isDark}
        language={language}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        startItem={startItem}
        endItem={endItem}
        paginationItems={paginationItems}
        onPageChange={onPageChange}
      />
    </>
  );
}
