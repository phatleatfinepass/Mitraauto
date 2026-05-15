import { AlertTriangle, Edit, Eye, EyeOff } from 'lucide-react';

import { useLanguage } from '../../../i18n/LanguageContext';
import { getRimReadinessState, getRimWarningKeys, type RimReadinessState, type RimWarningKey } from './rimReadiness';
import type { RimRow } from './types';

interface RimsCmsTableSectionProps {
  isDark: boolean;
  rims: RimRow[];
  formatSize: (rim: RimRow) => string;
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

const WARNING_LABEL_KEYS: Record<RimWarningKey, string> = {
  mounting_specs: 'rimsCmsTable.warningMountingSpecs',
  image: 'rimsCmsTable.warningImage',
  price: 'rimsCmsTable.warningPrice',
  stock: 'rimsCmsTable.warningStock',
  pcd: 'rimsCmsTable.warningPcd',
  et_cb: 'rimsCmsTable.warningEtCb',
  ean: 'rimsCmsTable.warningEan',
  material_finish: 'rimsCmsTable.warningMaterialFinish',
};

function readinessClass(state: RimReadinessState, isDark: boolean) {
  if (state === 'ready') return isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700';
  if (state === 'blocked') return isDark ? 'bg-red-500/15 text-red-300' : 'bg-red-50 text-red-700';
  if (state === 'hidden') return isDark ? 'bg-slate-500/15 text-slate-300' : 'bg-slate-100 text-slate-700';
  if (state === 'conflict') return isDark ? 'bg-violet-500/15 text-violet-300' : 'bg-violet-50 text-violet-700';
  return isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-50 text-amber-700';
}

export function RimsCmsTableSection({
  isDark,
  rims,
  formatSize,
  onToggleVisibility,
  onEdit,
}: RimsCmsTableSectionProps) {
  const { t } = useLanguage();

  return (
    <div className={`overflow-hidden rounded-lg border ${isDark ? 'border-white/10 bg-[#161A22]' : 'border-gray-200 bg-white'}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
            <tr>
              {[
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
              ].map((header, index) => (
                <th
                  key={header}
                  className={`px-4 py-3 text-left text-xs font-medium uppercase ${index === 10 ? 'text-right' : ''} ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={isDark ? 'divide-y divide-white/10' : 'divide-y divide-gray-100'}>
            {rims.map((rim) => {
              const readiness = getRimReadinessState(rim);
              const warnings = getRimWarningKeys(rim);

              return (
                <tr key={rim.variant_id} className={isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                  <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {rim.supplier_code_best || '-'}
                  </td>
                  <td className={`px-4 py-3 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {rim.brand}
                  </td>
                  <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {rim.model || '-'}
                  </td>
                  <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {formatSize(rim)}
                  </td>
                  <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {rim.bolt_pattern || '-'}
                  </td>
                  <td className={`px-4 py-3 text-sm capitalize ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {rim.color || rim.finish || '-'}
                  </td>
                  <td className={`px-4 py-3 font-mono text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {rim.ean || '-'}
                  </td>
                  <td className={`px-4 py-3 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {rim.price_eur !== null && rim.price_eur !== undefined ? `€${Number(rim.price_eur).toFixed(2)}` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-[180px] flex-col gap-2">
                      <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${readinessClass(readiness, isDark)}`}>
                        {readiness !== 'ready' && <AlertTriangle className="h-3 w-3" />}
                        {t(READINESS_LABEL_KEYS[readiness])}
                      </span>
                      {warnings.length > 0 && (
                        <div className="flex max-w-[220px] flex-wrap gap-1">
                          {warnings.slice(0, 4).map((warning) => (
                            <span
                              key={warning}
                              className={`rounded px-1.5 py-0.5 text-[11px] ${isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
                            >
                              {t(WARNING_LABEL_KEYS[warning])}
                            </span>
                          ))}
                          {warnings.length > 4 && (
                            <span className={`rounded px-1.5 py-0.5 text-[11px] ${isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                              +{warnings.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
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
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
