import { AlertTriangle, CheckCircle2, Edit, Eye, EyeOff } from 'lucide-react';

import { useLanguage } from '../../../i18n/LanguageContext';
import { Skeleton } from '../../ui/skeleton';
import { RimsCmsPagination } from './RimsCmsPagination';
import { getRimReadinessState, type RimReadinessState } from './rimReadiness';
import type { RimRow } from './types';

const TABLE_PAGE_ROW_COUNT = 25;
const TABLE_COLUMN_COUNT = 11;

interface RimsCmsTableSectionProps {
  cachedItemCount: number;
  currentPage: number;
  endItem: number;
  isDark: boolean;
  rims: RimRow[];
  loading?: boolean;
  paginationItems: Array<number | string>;
  preloading: boolean;
  startItem: number;
  totalCount: number;
  totalPages: number;
  formatSize: (rim: RimRow) => string;
  onPageChange: (page: number) => void;
  onToggleVisibility: (rim: RimRow) => void;
  onEdit: (rim: RimRow) => void;
}

const READINESS_LABEL_KEYS: Record<RimReadinessState, string> = {
  ready: 'rimsCmsTable.ready',
  missing_required: 'rimsCmsTable.missingRequired',
  blocked: 'rimsCmsTable.blocked',
  hidden: 'rimsCmsTable.hidden',
  conflict: 'rimsCmsTable.supplierConflict',
};

function readinessClass(state: RimReadinessState, isDark: boolean) {
  if (state === 'ready') return isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700';
  if (state === 'blocked') return isDark ? 'bg-red-500/15 text-red-300' : 'bg-red-50 text-red-700';
  if (state === 'hidden') return isDark ? 'bg-slate-500/15 text-slate-300' : 'bg-slate-100 text-slate-700';
  if (state === 'conflict') return isDark ? 'bg-violet-500/15 text-violet-300' : 'bg-violet-50 text-violet-700';
  return isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-50 text-amber-700';
}

export function RimsCmsTableSection({
  cachedItemCount,
  currentPage,
  endItem,
  isDark,
  rims,
  loading = false,
  paginationItems,
  preloading,
  startItem,
  totalCount,
  totalPages,
  formatSize,
  onPageChange,
  onToggleVisibility,
  onEdit,
}: RimsCmsTableSectionProps) {
  const { t } = useLanguage();
  const skeletonLineClass = isDark ? 'bg-white/10' : 'bg-gray-200';
  const indexingPercent = totalCount > 0 ? Math.min(100, Math.round((cachedItemCount / totalCount) * 100)) : 0;
  const readinessIconClass = (className: string) => `inline-flex h-7 w-7 items-center justify-center rounded-full ${className}`;
  const headers = [
    t('rimsCmsTable.supplier'),
    t('rimsCmsTable.brand'),
    t('rimsCmsTable.model'),
    t('rimsCmsTable.size'),
    'PCD',
    t('rimsCmsTable.color'),
    'EAN',
    t('rimsCmsTable.price'),
    t('rimsCmsTable.readiness'),
    t('rimsCmsTable.visible'),
    t('rimsCmsTable.actions'),
  ];

  const renderSkeletonRows = () =>
    Array.from({ length: TABLE_PAGE_ROW_COUNT }).map((_, rowIndex) => (
      <tr key={`skeleton-${rowIndex}`} className="h-14">
        {Array.from({ length: TABLE_COLUMN_COUNT }).map((__, cellIndex) => (
          <td key={cellIndex} className="px-4 py-4">
            <Skeleton
              className={`h-4 ${skeletonLineClass} ${cellIndex === 8 ? 'w-7 rounded-full' : cellIndex === 2 ? 'w-28' : 'w-full'}`}
            />
          </td>
        ))}
      </tr>
    ));
  const renderEmptyRows = () =>
    Array.from({ length: Math.max(0, TABLE_PAGE_ROW_COUNT - rims.length) }).map((_, rowIndex) => (
      <tr key={`empty-${rowIndex}`} className="h-14" aria-hidden="true">
        <td colSpan={TABLE_COLUMN_COUNT} className="px-4 py-3">
          {'\u00a0'}
        </td>
      </tr>
    ));

  return (
    <>
      <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(160px,1fr)_minmax(220px,360px)_minmax(220px,1fr)] lg:items-center">
        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {t('rimsCmsPage.totalItems', { total: totalCount })}
        </p>
        <div className="min-h-8">
          {preloading ? (
            <div className={`rounded-full border px-3 py-2 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
              <div className="mb-1 flex items-center justify-between gap-3">
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {indexingPercent}%
                </span>
                <span className={`truncate text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('rimsCmsPage.preloading', { cached: cachedItemCount, total: totalCount })}
                </span>
              </div>
              <div className={`h-1.5 overflow-hidden rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${indexingPercent}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>
        <p className={`text-sm lg:text-right ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {t('rimsCmsPage.showingPage', {
            start: startItem,
            end: endItem,
            total: totalCount,
            page: currentPage,
            pages: totalPages,
          })}
        </p>
      </div>

      <div className={`overflow-hidden rounded-lg border ${isDark ? 'border-white/10 bg-[#161A22]' : 'border-gray-200 bg-white'}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1188px] table-fixed">
            <colgroup>
              <col className="w-[72px]" />
              <col className="w-[116px]" />
              <col className="w-[128px]" />
              <col className="w-[268px]" />
              <col className="w-[88px]" />
              <col className="w-[96px]" />
              <col className="w-[128px]" />
              <col className="w-[88px]" />
              <col className="w-[56px]" />
              <col className="w-[56px]" />
              <col className="w-[92px]" />
            </colgroup>
            <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={header}
                    className={`px-4 py-3 text-left text-xs font-medium uppercase ${index === 8 ? 'text-center' : ''} ${index === 10 ? 'text-right' : ''} ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={isDark ? 'divide-y divide-white/10' : 'divide-y divide-gray-100'}>
              {loading ? renderSkeletonRows() : (
                <>
                  {rims.map((rim) => {
                    const readiness = getRimReadinessState(rim);

                    return (
                      <tr key={rim.variant_id} className={`h-14 ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                        <td className={`truncate px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {rim.supplier_code_best || '-'}
                        </td>
                        <td className={`truncate px-4 py-3 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {rim.brand}
                        </td>
                        <td className={`truncate px-4 py-3 text-left text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {rim.model || '-'}
                        </td>
                        <td className={`truncate px-4 py-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {formatSize(rim)}
                        </td>
                        <td className={`truncate px-4 py-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {rim.bolt_pattern || '-'}
                        </td>
                        <td className={`truncate px-4 py-3 text-sm capitalize ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {rim.color || rim.finish || '-'}
                        </td>
                        <td className={`truncate px-4 py-3 font-mono text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {rim.ean || '-'}
                        </td>
                        <td className={`px-4 py-3 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {rim.price_eur !== null && rim.price_eur !== undefined ? `€${Number(rim.price_eur).toFixed(2)}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={readinessIconClass(readinessClass(readiness, isDark))}
                            title={t(READINESS_LABEL_KEYS[readiness])}
                            aria-label={t(READINESS_LABEL_KEYS[readiness])}
                          >
                            {readiness === 'ready' ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 shrink-0" />
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => onToggleVisibility(rim)}
                            className={`rounded p-1 transition-colors ${
                              rim.cms_data?.is_hidden
                                ? (isDark ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600')
                                : (isDark ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700')
                            }`}
                          >
                            {rim.cms_data?.is_hidden ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => onEdit(rim)}
                            className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
                              isDark
                                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                          >
                            <Edit className="h-4 w-4" />
                            {t('rimsCmsTable.edit')}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {renderEmptyRows()}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && rims.length === 0 && (
        <div className="py-20 text-center">
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('rimsCmsPage.noRims')}
          </p>
        </div>
      )}

      <RimsCmsPagination
        isDark={isDark}
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
