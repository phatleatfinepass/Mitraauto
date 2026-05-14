import { useLanguage } from '../../../i18n/LanguageContext';

type TireBadgeKey =
  | 'ev_ready'
  | 'sound_absorber'
  | 'runflat'
  | 'xl'
  | 'studded'
  | 'threepmsf'
  | 'winter_approved'
  | 'ice_approved';

interface TiresBadgesSectionProps {
  clearFeatureOverrides: () => void;
  getEffectiveFeatureValue: (field: TireBadgeKey) => boolean;
  isDark: boolean;
  setFeatureField: (field: TireBadgeKey, value: boolean) => void;
}

const TIRE_BADGES: Array<{ key: TireBadgeKey; labelKey: string }> = [
  { key: 'ev_ready', labelKey: 'tiresTyreLabel.badge.evReady' },
  { key: 'sound_absorber', labelKey: 'tiresTyreLabel.badge.soundAbsorber' },
  { key: 'runflat', labelKey: 'tiresTyreLabel.badge.runflat' },
  { key: 'xl', labelKey: 'tiresTyreLabel.badge.xl' },
  { key: 'studded', labelKey: 'tiresTyreLabel.badge.studded' },
  { key: 'threepmsf', labelKey: 'tiresTyreLabel.badge.threepmsf' },
  { key: 'winter_approved', labelKey: 'tiresTyreLabel.badge.winterApproved' },
  { key: 'ice_approved', labelKey: 'tiresTyreLabel.badge.iceApproved' },
];

export function TiresBadgesSection({
  clearFeatureOverrides,
  getEffectiveFeatureValue,
  isDark,
  setFeatureField,
}: TiresBadgesSectionProps) {
  const { t } = useLanguage();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('tiresBadges.title')}
        </h3>
        <button
          type="button"
          onClick={clearFeatureOverrides}
          className={`flex items-center gap-2 text-sm ${isDark ? 'text-blue-200 hover:text-white' : 'text-blue-700 hover:text-blue-900'}`}
        >
          {t('tiresTyreLabel.resetBadgeOverrides')}
        </button>
      </div>

      <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
        {TIRE_BADGES.map((feature) => (
          <label key={feature.key} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={getEffectiveFeatureValue(feature.key)}
              onChange={(e) => setFeatureField(feature.key, e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t(feature.labelKey)}
            </span>
          </label>
        ))}
      </div>

      <p className="mt-2 text-xs text-gray-500">
        {t('tiresBadges.description')}
      </p>
    </div>
  );
}
