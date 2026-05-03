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
  language: string;
  setFeatureField: (field: TireBadgeKey, value: boolean) => void;
}

const TIRE_BADGES: Array<{ key: TireBadgeKey; labelFi: string; labelEn: string }> = [
  { key: 'ev_ready', labelFi: 'EV', labelEn: 'EV' },
  { key: 'sound_absorber', labelFi: 'Äänenvaimennus', labelEn: 'Sound absorber' },
  { key: 'runflat', labelFi: 'RunFlat', labelEn: 'RunFlat' },
  { key: 'xl', labelFi: 'XL', labelEn: 'XL' },
  { key: 'studded', labelFi: 'Nastat', labelEn: 'Studded' },
  { key: 'threepmsf', labelFi: '3PMSF', labelEn: '3PMSF' },
  { key: 'winter_approved', labelFi: 'M+S', labelEn: 'M+S' },
  { key: 'ice_approved', labelFi: 'Jää', labelEn: 'Ice approved' },
];

export function TiresBadgesSection({
  clearFeatureOverrides,
  getEffectiveFeatureValue,
  isDark,
  language,
  setFeatureField,
}: TiresBadgesSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {language === 'fi' ? 'Rengasmerkit (badges)' : 'Tire badges'}
        </h3>
        <button
          type="button"
          onClick={clearFeatureOverrides}
          className={`flex items-center gap-2 text-sm ${isDark ? 'text-blue-200 hover:text-white' : 'text-blue-700 hover:text-blue-900'}`}
        >
          {language === 'fi' ? 'Palauta badge-ohitukset' : 'Reset badge overrides'}
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
              {language === 'fi' ? feature.labelFi : feature.labelEn}
            </span>
          </label>
        ))}
      </div>

      <p className="mt-2 text-xs text-gray-500">
        {language === 'fi'
          ? 'Nämä arvot tallennetaan CMS-ohituksina ja voidaan näyttää verkkokaupan korteissa.'
          : 'These are saved as CMS overrides and can be shown on webshop cards.'}
      </p>
    </div>
  );
}
