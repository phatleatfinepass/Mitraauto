import { AlertTriangle, Edit, Eye, EyeOff } from 'lucide-react';

import { useLanguage } from '../../../i18n/LanguageContext';
import type { RimRow } from './types';

interface RimsCmsTableSectionProps {
  isDark: boolean;
  rims: RimRow[];
  formatSize: (rim: RimRow) => string;
  onToggleVisibility: (rim: RimRow) => void;
  onEdit: (rim: RimRow) => void;
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
                t('rimsCmsTable.audit'),
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
              const warnings = [
                rim.missing_supplier_price ? t('rimsCmsTable.warningPrice') : null,
                rim.missing_supplier_image ? t('rimsCmsTable.warningImage') : null,
                !rim.cms_data?.seo_slug || !rim.cms_data?.seo_title || !rim.cms_data?.seo_description
                  ? 'SEO'
                  : null,
              ].filter(Boolean);

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
                    {warnings.length > 0 ? (
                      <div className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-50 text-amber-700'}`}>
                        <AlertTriangle className="h-3 w-3" />
                        {warnings.join(', ')}
                      </div>
                    ) : (
                      <span className={`text-xs ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                        {t('rimsCmsTable.ok')}
                      </span>
                    )}
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
