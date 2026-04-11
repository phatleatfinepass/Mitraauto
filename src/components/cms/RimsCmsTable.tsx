import React from 'react';
import { Edit, Eye, EyeOff } from 'lucide-react';

interface RimTableRow {
  id: string;
  brand: string;
  model: string;
  color: string | null;
  ean: string | null;
  price_eur: number | null;
  cms_data?: {
    is_hidden?: boolean;
  } | null;
}

interface RimsCmsTableProps {
  isDark: boolean;
  language: string;
  rims: RimTableRow[];
  formatSize: (rim: RimTableRow) => string;
  onToggleVisibility: (rim: RimTableRow) => void;
  onEdit: (rim: RimTableRow) => void;
}

export function RimsCmsTable({
  isDark,
  language,
  rims,
  formatSize,
  onToggleVisibility,
  onEdit,
}: RimsCmsTableProps) {
  return (
    <div className={`overflow-hidden rounded-lg border ${isDark ? 'border-white/10 bg-[#161A22]' : 'border-gray-200 bg-white'}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
            <tr>
              <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {language === 'fi' ? 'Brändi' : 'Brand'}
              </th>
              <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {language === 'fi' ? 'Malli' : 'Model'}
              </th>
              <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {language === 'fi' ? 'Koko' : 'Size'}
              </th>
              <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {language === 'fi' ? 'Väri' : 'Color'}
              </th>
              <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                EAN
              </th>
              <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {language === 'fi' ? 'Hinta' : 'Price'}
              </th>
              <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {language === 'fi' ? 'Näkyvyys' : 'Visible'}
              </th>
              <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {language === 'fi' ? 'Toiminnot' : 'Actions'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rims.map((rim) => (
              <tr key={rim.id} className={isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{rim.brand}</td>
                <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{rim.model}</td>
                <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{formatSize(rim)}</td>
                <td className={`px-4 py-3 capitalize ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{rim.color || '—'}</td>
                <td className={`px-4 py-3 text-xs font-mono ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{rim.ean || '—'}</td>
                <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {rim.price_eur !== null && rim.price_eur !== undefined
                    ? `€${Number(rim.price_eur).toFixed(2)}`
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  <button
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
                    onClick={() => onEdit(rim)}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      isDark
                        ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
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
  );
}
