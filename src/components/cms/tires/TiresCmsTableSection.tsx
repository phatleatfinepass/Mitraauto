import { AlertTriangle, Edit, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../../../i18n/LanguageContext';
import { TiresCmsPagination } from './TiresCmsPagination';
import type { TireRow } from './types';

interface TiresTableSectionProps {
  currentPage: number;
  endItem: number;
  error: string | null;
  eprelListLoading: boolean;
  eprelListStatuses: Record<string, {
    match_status: 'matched' | 'no_match' | 'multiple_matches' | 'wrong_product_group' | 'blocked' | 'unverified' | 'error' | undefined;
    review_status: 'not_reviewed' | 'pending' | 'accepted' | 'rejected' | 'kept_current' | 'mixed' | 'audited';
    eprel_registration_number: string | null;
  }>;
  eprelPilotSummary: {
    matched: number;
    no_match: number;
    multiple_matches: number;
    other: number;
    not_checked: number;
    pending_review: number;
    accepted_review: number;
    mixed_review: number;
  };
  filteredTires: TireRow[];
  getEffectiveIdentity: (tire: TireRow | null) => { brand: string; model: string; size_string: string };
  getWarningTooltip: (tire: TireRow) => string;
  handleEdit: (tire: TireRow) => void;
  handleToggleVisibility: (tire: TireRow) => void;
  hasMissingSupplierPrice: (tire: TireRow | null) => boolean;
  hideWarningTooltip: () => void;
  isDark: boolean;
  loading: boolean;
  refreshing: boolean;
  mustHideFromStore: (tire: TireRow | null) => boolean;
  onPageChange: (page: number) => void;
  showWarningTooltip: (text: string, x: number, y: number) => void;
  startItem: number;
  totalCount: number;
  totalPages: number;
}

export function TiresCmsTableSection({
  currentPage,
  endItem,
  error,
  eprelListLoading,
  eprelListStatuses,
  eprelPilotSummary,
  filteredTires,
  getEffectiveIdentity,
  getWarningTooltip,
  handleEdit,
  handleToggleVisibility,
  hasMissingSupplierPrice,
  hideWarningTooltip,
  isDark,
  loading,
  refreshing,
  mustHideFromStore,
  onPageChange,
  showWarningTooltip,
  startItem,
  totalCount,
  totalPages,
}: TiresTableSectionProps) {
  const { t } = useLanguage();
  const matchBadgeClasses = (status: string | undefined) => {
    if (status === 'matched') {
      return isDark ? 'bg-green-500/15 text-green-200' : 'bg-green-50 text-green-700';
    }
    if (status === 'no_match') {
      return isDark ? 'bg-gray-500/15 text-gray-300' : 'bg-gray-100 text-gray-700';
    }
    if (status === 'multiple_matches') {
      return isDark ? 'bg-amber-500/15 text-amber-200' : 'bg-amber-50 text-amber-700';
    }
    return isDark ? 'bg-red-500/15 text-red-200' : 'bg-red-50 text-red-700';
  };

  const reviewBadgeClasses = (status: string) => {
    if (status === 'accepted') return isDark ? 'bg-green-500/15 text-green-200' : 'bg-green-50 text-green-700';
    if (status === 'pending') return isDark ? 'bg-blue-500/15 text-blue-200' : 'bg-blue-50 text-blue-700';
    if (status === 'audited') return isDark ? 'bg-emerald-500/15 text-emerald-200' : 'bg-emerald-50 text-emerald-700';
    if (status === 'mixed') return isDark ? 'bg-purple-500/15 text-purple-200' : 'bg-purple-50 text-purple-700';
    if (status === 'rejected') return isDark ? 'bg-red-500/15 text-red-200' : 'bg-red-50 text-red-700';
    if (status === 'kept_current') return isDark ? 'bg-amber-500/15 text-amber-200' : 'bg-amber-50 text-amber-700';
    return isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-700';
  };

  const formatMatchLabel = (status: string | undefined) => {
    switch (status) {
      case 'matched':
        return t('tiresCmsTable.match.matched');
      case 'no_match':
        return t('tiresCmsTable.match.noMatch');
      case 'multiple_matches':
        return t('tiresCmsTable.match.multiple');
      case 'wrong_product_group':
        return t('tiresCmsTable.match.wrongGroup');
      case 'blocked':
        return t('tiresCmsTable.match.blocked');
      case 'unverified':
        return t('tiresCmsTable.match.unverified');
      case 'error':
        return t('tiresCmsTable.match.error');
      default:
        return t('tiresCmsTable.match.notChecked');
    }
  };

  const formatReviewLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return t('tiresCmsTable.review.pending');
      case 'accepted':
        return t('tiresCmsTable.review.accepted');
      case 'audited':
        return t('tiresCmsTable.review.audited');
      case 'rejected':
        return t('tiresCmsTable.review.rejected');
      case 'kept_current':
        return t('tiresCmsTable.review.keptCurrent');
      case 'mixed':
        return t('tiresCmsTable.review.mixed');
      default:
        return t('tiresCmsTable.review.none');
    }
  };

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
          {t('tiresCmsTable.atLeastItems', { count: totalCount })}
        </p>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {t('tiresCmsTable.showingPage', { start: startItem, end: endItem, page: currentPage })}
        </p>
      </div>

      {refreshing ? (
        <div className={`mb-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {t('tiresCmsTable.refreshing')}
        </div>
      ) : null}

      <div className={`mb-4 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
        <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {t('tiresCmsTable.eprelPilotInView')}
        </span>
        <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${isDark ? 'bg-green-500/15 text-green-200' : 'bg-green-50 text-green-700'}`}>
          {t('tiresCmsTable.matched')}: {eprelPilotSummary.matched}
        </span>
        <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${isDark ? 'bg-blue-500/15 text-blue-200' : 'bg-blue-50 text-blue-700'}`}>
          {t('tiresCmsTable.pendingReview')}: {eprelPilotSummary.pending_review}
        </span>
        <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${isDark ? 'bg-amber-500/15 text-amber-200' : 'bg-amber-50 text-amber-700'}`}>
          {t('tiresCmsTable.multiple')}: {eprelPilotSummary.multiple_matches}
        </span>
        <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${isDark ? 'bg-gray-500/15 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
          {t('tiresCmsTable.match.notChecked')}: {eprelPilotSummary.not_checked}
        </span>
        {eprelListLoading ? (
          <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('tiresCmsTable.loadingEprelStatuses')}
          </span>
        ) : null}
      </div>

      <div className={`overflow-hidden rounded-lg border ${isDark ? 'border-white/10 bg-[#161A22]' : 'border-gray-200 bg-white'}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('tiresCmsTable.brand')}</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('tiresCmsTable.model')}</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('tiresCmsTable.size')}</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>EAN</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>EPREL</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('tiresCmsTable.price')}</th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('tiresCmsTable.visible')}</th>
                <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('tiresCmsTable.actions')}</th>
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
                          {tire.is_non_passenger_manual ? t('tiresCmsTable.nonPassengerManual') : t('tiresCmsTable.nonPassenger')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={`${isDark ? 'text-gray-300' : 'text-gray-700'} px-4 py-3`}>{getEffectiveIdentity(tire).model}</td>
                  <td className={`${isDark ? 'text-gray-400' : 'text-gray-600'} px-4 py-3`}>{getEffectiveIdentity(tire).size_string || '—'}</td>
                  <td className={`px-4 py-3 text-xs font-mono ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{tire.derived_ean || '—'}</td>
                  <td className="px-4 py-3">
                    {(() => {
                      const status = eprelListStatuses[tire.variant_id];
                      if (!status) {
                        return (
                          <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                            {t('tiresCmsTable.match.notChecked')}
                          </span>
                        );
                      }

                      return (
                        <div className="flex flex-wrap gap-1.5">
                          <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${matchBadgeClasses(status.match_status)}`}>
                            {formatMatchLabel(status.match_status)}
                          </span>
                          <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${reviewBadgeClasses(status.review_status)}`}>
                            {formatReviewLabel(status.review_status)}
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className={`${isDark ? 'text-white' : 'text-gray-900'} px-4 py-3`}>
                    {tire.final_price_eur !== null && tire.final_price_eur !== undefined ? `€${tire.final_price_eur.toFixed(2)}` : '—'}
                    {hasMissingSupplierPrice(tire) && (
                      <p className={`mt-1 text-xs ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                        {t('tiresCmsTable.missingSupplierPrice')}
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
                      {t('tiresCmsTable.edit')}
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
