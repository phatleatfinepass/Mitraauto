import { useState } from 'react';
import { useLanguage } from '../../../i18n/LanguageContext';
import type { ProductCMS } from './types';
import type { TiresAiGenerationState } from './aiCopy';

interface TiresSeoSectionProps {
  aiError: string | null;
  aiGeneratingField: TiresAiGenerationState | null;
  aiGenerationProgress: { current: number; total: number; label: string } | null;
  editData: Partial<ProductCMS>;
  isDark: boolean;
  onEditDataChange: (updater: (prev: Partial<ProductCMS>) => Partial<ProductCMS>) => void;
}

type LocaleMode = 'fi' | 'en';

export function TiresSeoSection({
  aiError,
  aiGeneratingField,
  aiGenerationProgress,
  editData,
  isDark,
  onEditDataChange,
}: TiresSeoSectionProps) {
  const { t } = useLanguage();
  const [localeMode, setLocaleMode] = useState<LocaleMode>('fi');
  const englishSeo = (editData.spec_overrides as any)?.i18n?.en ?? {};
  const isFinnish = localeMode === 'fi';
  const labels = {
    fi: t('tiresSeo.finnish'),
    en: t('tiresSeo.english'),
  };

  const updateLocalizedField = (
    field: 'seo_slug' | 'seo_title' | 'seo_description',
    value: string,
  ) => {
    if (isFinnish) {
      onEditDataChange((prev) => ({ ...prev, [field]: value }));
      return;
    }

    onEditDataChange((prev) => {
      const specOverrides = { ...(prev.spec_overrides || {}) } as Record<string, any>;
      const i18n = { ...(specOverrides.i18n || {}) };
      const en = { ...(i18n.en || {}) };
      en[field] = value;
      i18n.en = en;
      specOverrides.i18n = i18n;
      return {
        ...prev,
        spec_overrides: specOverrides,
      };
    });
  };

  const localizedValues = isFinnish
    ? {
        seo_slug: editData.seo_slug ?? '',
        seo_title: editData.seo_title ?? '',
        seo_description: editData.seo_description ?? '',
      }
    : {
        seo_slug: englishSeo.seo_slug ?? '',
        seo_title: englishSeo.seo_title ?? '',
        seo_description: englishSeo.seo_description ?? '',
      };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            SEO
          </h3>
          <div className={`inline-flex rounded-lg p-1 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
            {(['fi', 'en'] as const).map((locale) => (
              <button
                key={locale}
                type="button"
                onClick={() => setLocaleMode(locale)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  localeMode === locale
                    ? isDark
                      ? 'bg-white/15 text-white'
                      : 'bg-white text-gray-900 shadow-sm'
                    : isDark
                      ? 'text-gray-300 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {labels[locale]}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {aiGeneratingField === 'all_fields' && aiGenerationProgress ? (
          <div className={`rounded-lg border px-3 py-3 ${isDark ? 'border-blue-500/20 bg-blue-500/10' : 'border-blue-200 bg-blue-50'}`}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className={isDark ? 'text-blue-100' : 'text-blue-800'}>{aiGenerationProgress.label}</span>
              <span className={isDark ? 'text-blue-200' : 'text-blue-700'}>
                {Math.min(aiGenerationProgress.total, aiGenerationProgress.current)}/{aiGenerationProgress.total}
                {' '}({Math.round((Math.min(aiGenerationProgress.total, aiGenerationProgress.current) / Math.max(1, aiGenerationProgress.total)) * 100)}%)
              </span>
            </div>
            <div className={`h-2 overflow-hidden rounded-full ${isDark ? 'bg-white/10' : 'bg-blue-100'}`}>
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(Math.min(aiGenerationProgress.total, aiGenerationProgress.current) / Math.max(1, aiGenerationProgress.total)) * 100}%` }}
              />
            </div>
          </div>
        ) : null}

        <div className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
          <div className="mb-3 flex items-center justify-between">
            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {labels[localeMode]}
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('tiresSeo.slug')}
              </label>
              <input
                type="text"
                value={localizedValues.seo_slug}
                onChange={(e) => updateLocalizedField('seo_slug', e.target.value)}
                placeholder="tire-brand-model-size"
                className={`w-full rounded-lg border px-3 py-2 ${
                  isDark
                    ? 'border-white/20 bg-[#1C1C1E] text-white placeholder-gray-500'
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
            <div>
              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('tiresSeo.title')}
              </label>
              <input
                type="text"
                value={localizedValues.seo_title}
                onChange={(e) => updateLocalizedField('seo_title', e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 ${
                  isDark
                    ? 'border-white/20 bg-[#1C1C1E] text-white placeholder-gray-500'
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
            <div>
              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('tiresSeo.description')}
              </label>
              <textarea
                rows={3}
                value={localizedValues.seo_description}
                onChange={(e) => updateLocalizedField('seo_description', e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 ${
                  isDark
                    ? 'border-white/20 bg-[#1C1C1E] text-white placeholder-gray-500'
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
          </div>
        </div>

        {aiError ? (
          <div
            className={`rounded-lg border px-3 py-2 text-sm ${
              isDark ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {aiError}
          </div>
        ) : null}
      </div>
    </div>
  );
}
