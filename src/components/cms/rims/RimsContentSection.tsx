import type { Dispatch, SetStateAction } from 'react';

import { useLanguage } from '../../../i18n/LanguageContext';
import type { ProductCMS, RimRow } from './types';

interface RimsContentSectionProps {
  isDark: boolean;
  selectedRim: RimRow;
  editData: Partial<ProductCMS>;
  onEditDataChange: Dispatch<SetStateAction<Partial<ProductCMS>>>;
}

export function RimsContentSection({
  isDark,
  selectedRim,
  editData,
  onEditDataChange,
}: RimsContentSectionProps) {
  const { t } = useLanguage();
  const inputClass = `w-full rounded-lg border px-3 py-2 ${
    isDark
      ? 'bg-[#1C1C1E] border-white/20 text-white placeholder-gray-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  }`;

  return (
    <div>
      <h3 className={`mb-4 text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {t('rimsContent.title')}
      </h3>
      <div className="space-y-4">
        <div>
          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('rimsContent.productTitle')}
          </label>
          <input
            type="text"
            value={editData.title ?? ''}
            onChange={(event) => onEditDataChange((prev) => ({ ...prev, title: event.target.value }))}
            placeholder={`${selectedRim.brand} ${selectedRim.model}`}
            className={inputClass}
          />
        </div>
        <div>
          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('rimsContent.subtitle')}
          </label>
          <input
            type="text"
            value={editData.subtitle ?? ''}
            onChange={(event) => onEditDataChange((prev) => ({ ...prev, subtitle: event.target.value }))}
            placeholder={selectedRim.size_string ?? ''}
            className={inputClass}
          />
        </div>
        <div>
          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('rimsContent.shortDescription')}
          </label>
          <textarea
            rows={3}
            value={editData.short_description ?? ''}
            onChange={(event) => onEditDataChange((prev) => ({ ...prev, short_description: event.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('rimsContent.longDescription')}
          </label>
          <textarea
            rows={6}
            value={editData.long_description ?? ''}
            onChange={(event) => onEditDataChange((prev) => ({ ...prev, long_description: event.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('rimsContent.manualBadges')}
          </label>
          <input
            type="text"
            value={(editData.badges ?? []).join(', ')}
            onChange={(event) =>
              onEditDataChange((prev) => ({
                ...prev,
                badges: event.target.value.split(',').map((item) => item.trim()).filter(Boolean),
              }))
            }
            placeholder={t('rimsContent.manualBadgesPlaceholder')}
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('rimsContent.seoSlug')}
            </label>
            <input
              type="text"
              value={editData.seo_slug ?? ''}
              onChange={(event) => onEditDataChange((prev) => ({ ...prev, seo_slug: event.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('rimsContent.seoTitle')}
            </label>
            <input
              type="text"
              value={editData.seo_title ?? ''}
              onChange={(event) => onEditDataChange((prev) => ({ ...prev, seo_title: event.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('rimsContent.seoDescription')}
            </label>
            <input
              type="text"
              value={editData.seo_description ?? ''}
              onChange={(event) => onEditDataChange((prev) => ({ ...prev, seo_description: event.target.value }))}
              className={inputClass}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
