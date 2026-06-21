import { AlertTriangle, CheckCircle2, Edit, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../../../i18n/LanguageContext';
import { Skeleton } from '../../ui/skeleton';
import { TiresCmsPagination } from './TiresCmsPagination';
import type { TireRow } from './types';

const TABLE_PAGE_ROW_COUNT = 25;
const TABLE_COLUMN_COUNT = 9;

interface TiresTableSectionProps {
  currentPage: number;
  endItem: number;
  error: string | null;
  filteredTires: TireRow[];
  getEffectiveIdentity: (tire: TireRow | null) => { brand: string; model: string; size_string: string };
  handleEdit: (tire: TireRow) => void;
  handleToggleVisibility: (tire: TireRow) => void;
  hasMissingSupplierPrice: (tire: TireRow | null) => boolean;
  isDark: boolean;
  loading: boolean;
  mustHideFromStore: (tire: TireRow | null) => boolean;
  onPageChange: (page: number) => void;
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
  handleEdit,
  handleToggleVisibility,
  hasMissingSupplierPrice,
  isDark,
  loading,
  mustHideFromStore,
  onPageChange,
  startItem,
  totalCount,
  totalPages,
}: TiresTableSectionProps) {
  const { t } = useLanguage();
  const getReadinessBadge = (tire: TireRow) => {
    if (tire.cms_data?.is_hidden) {
      return {
        label: t('tiresCmsTable.hidden'),
        className: isDark ? 'bg-gray-500/15 text-gray-300' : 'bg-gray-100 text-gray-700',
      };
    }
    if (mustHideFromStore(tire)) {
      return {
        label: t('tiresCmsTable.match.blocked'),
        className: isDark ? 'bg-red-500/15 text-red-200' : 'bg-red-50 text-red-700',
      };
    }
    if (tire.ean_conflict_open || tire.has_duplicate_ean_conflict) {
      return {
        label: t('tiresCmsTable.conflict'),
        className: isDark ? 'bg-amber-500/15 text-amber-200' : 'bg-amber-50 text-amber-700',
      };
    }
    if (tire.has_mandatory_field_conflict) {
      return {
        label: t('tiresCmsTable.missingRequired'),
        className: isDark ? 'bg-orange-500/15 text-orange-200' : 'bg-orange-50 text-orange-700',
      };
    }

    return {
      label: t('tiresCmsTable.ready'),
      className: isDark ? 'bg-green-500/15 text-green-200' : 'bg-green-50 text-green-700',
    };
  };
  const getSegmentLabel = (segment: string | null | undefined) => {
    switch (segment) {
      case 'passenger':
        return t('tiresCmsTable.segment.passenger');
      case 'van_c':
        return t('tiresCmsTable.segment.vanC');
      case 'suv_4x4':
        return t('tiresCmsTable.segment.suv4x4');
      case 'excluded_heavy':
        return t('tiresCmsTable.segment.excludedHeavy');
      case 'excluded_motorcycle':
        return t('tiresCmsTable.segment.excludedMotorcycle');
      case 'excluded_agri_industrial':
        return t('tiresCmsTable.segment.excludedAgriIndustrial');
      case 'other':
        return t('tiresCmsTable.segment.other');
      default:
        return '—';
    }
  };
  const skeletonLineClass = isDark ? 'bg-white/10' : 'bg-gray-200';
  const readinessIconClass = (className: string) => `inline-flex h-7 w-7 items-center justify-center rounded-full ${className}`;

  const renderSkeletonRows = () =>
    Array.from({ length: TABLE_PAGE_ROW_COUNT }).map((_, rowIndex) => (
      <tr key={`skeleton-${rowIndex}`} className="h-14">
        {Array.from({ length: TABLE_COLUMN_COUNT }).map((__, cellIndex) => (
          <td key={cellIndex} className="px-4 py-4">
            <Skeleton
              className={`h-4 ${skeletonLineClass} ${cellIndex === 1 ? 'w-28' : cellIndex === 6 ? 'w-7 rounded-full' : 'w-full'}`}
            />
          </td>
        ))}
      </tr>
    ));
  const renderEmptyRows = () =>
    Array.from({ length: Math.max(0, TABLE_PAGE_ROW_COUNT - filteredTires.length) }).map((_, rowIndex) => (
      <tr key={`empty-${rowIndex}`} className="h-14" aria-hidden="true">
        <td colSpan={TABLE_COLUMN_COUNT} className="px-4 py-3">
          {'\u00a0'}
        </td>
      </tr>
    ));

  if (error) {
    return (
      <div className={`rounded-lg p-4 ${isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {t('tiresCmsTable.atLeastItems', { count: totalCount })}
        </p>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {t('tiresCmsTable.showingPage', { start: startItem, end: endItem, page: currentPage })}
        </p>
      </div>

      <div className={`overflow-hidden rounded-lg border ${isDark ? 'border-white/10 bg-[#161A22]' : 'border-gray-200 bg-white'}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[926px] table-fixed">
            <colgroup>
              <col className="w-[116px]" />
              <col className="w-[128px]" />
              <col className="w-[158px]" />
              <col className="w-[96px]" />
              <col className="w-[128px]" />
              <col className="w-[96px]" />
              <col className="w-[56px]" />
              <col className="w-[56px]" />
              <col className="w-[92px]" />
            </colgroup>
            <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('tiresCmsTable.brand')}</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('tiresCmsTable.model')}</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('tiresCmsTable.size')}</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('tiresCmsTable.segment')}</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>EAN</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('tiresCmsTable.price')}</th>
                <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('tiresCmsTable.readiness')}</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('tiresCmsTable.visible')}</th>
                <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('tiresCmsTable.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? renderSkeletonRows() : (
                <>
                  {filteredTires.map((tire) => (
                    <tr
                      key={tire.variant_id}
                      className={`h-14 ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} ${tire.ean_conflict_open ? (isDark ? 'bg-yellow-500/10' : 'bg-yellow-50') : ''}`}
                    >
                      <td className={`${isDark ? 'text-white' : 'text-gray-900'} px-4 py-3 text-sm`}>
                        <span className="block truncate">{getEffectiveIdentity(tire).brand}</span>
                      </td>
                      <td className={`${isDark ? 'text-gray-300' : 'text-gray-700'} truncate px-4 py-3 text-left text-sm`}>{getEffectiveIdentity(tire).model || '—'}</td>
                      <td className={`${isDark ? 'text-gray-400' : 'text-gray-600'} truncate px-4 py-3 text-sm`}>{getEffectiveIdentity(tire).size_string || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex min-w-0 flex-wrap items-center justify-center gap-1">
                          <span className={`inline-flex max-w-full rounded-full px-2 py-1 text-[11px] font-semibold ${isDark ? 'bg-white/10 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
                            <span className="truncate">
                              {getSegmentLabel(tire.tire_segment)}
                            </span>
                          </span>
                          {tire.is_non_passenger && (
                            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700'}`}>
                              {tire.is_non_passenger_manual ? t('tiresCmsTable.nonPassengerManual') : t('tiresCmsTable.nonPassenger')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`truncate px-4 py-3 font-mono text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{tire.derived_ean || '—'}</td>
                      <td className={`${isDark ? 'text-white' : 'text-gray-900'} px-4 py-3 text-sm`}>
                        {tire.final_price_eur !== null && tire.final_price_eur !== undefined ? `€${tire.final_price_eur.toFixed(2)}` : '—'}
                        {hasMissingSupplierPrice(tire) && (
                          <p className={`mt-1 text-xs ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                            {t('tiresCmsTable.missingSupplierPrice')}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {(() => {
                          const badge = getReadinessBadge(tire);
                          const isReady = badge.label === t('tiresCmsTable.ready');
                          return (
                            <span
                              className={readinessIconClass(badge.className)}
                              title={badge.label}
                              aria-label={badge.label}
                            >
                              {isReady ? (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                              )}
                            </span>
                          );
                        })()}
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
                          className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
                            isDark ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          <Edit className="h-4 w-4" />
                          {t('tiresCmsTable.edit')}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {renderEmptyRows()}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && filteredTires.length === 0 && (
        <div className="py-20 text-center">
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('tiresCmsTable.noTiresFound')}
          </p>
        </div>
      )}

      <TiresCmsPagination
        isDark={isDark}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        startItem={startItem}
        endItem={endItem}
        onPageChange={onPageChange}
      />
    </>
  );
}
