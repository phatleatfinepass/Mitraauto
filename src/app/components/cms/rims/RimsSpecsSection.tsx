import type { Dispatch, SetStateAction } from 'react';

import { useLanguage } from '../../../i18n/LanguageContext';
import type { ProductCMS, RimRow } from './types';

interface RimsSpecsSectionProps {
  isDark: boolean;
  selectedRim: RimRow;
  editData: Partial<ProductCMS>;
  onEditDataChange: Dispatch<SetStateAction<Partial<ProductCMS>>>;
}

function getSpecValue(editData: Partial<ProductCMS>, section: string, key: string, fallback: any) {
  const sectionData = (editData.spec_overrides as any)?.[section] ?? {};
  return sectionData[key] ?? fallback ?? '';
}

export function RimsSpecsSection({
  isDark,
  selectedRim,
  editData,
  onEditDataChange,
}: RimsSpecsSectionProps) {
  const { t } = useLanguage();
  const inputClass = `w-full rounded-lg border px-3 py-2 ${
    isDark ? 'bg-[#1C1C1E] border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
  }`;

  const setSpec = (section: 'identity' | 'rim' | 'classification', key: string, value: any) => {
    onEditDataChange((prev) => ({
      ...prev,
      spec_overrides: {
        ...(prev.spec_overrides ?? {}),
        [section]: {
          ...((prev.spec_overrides as any)?.[section] ?? {}),
          [key]: value === '' ? null : value,
        },
      },
    }));
  };

  return (
    <div>
      <h3 className={`mb-4 text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {t('rimsSpecs.title')}
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <input className={inputClass} value={getSpecValue(editData, 'identity', 'brand', selectedRim.brand)} onChange={(event) => setSpec('identity', 'brand', event.target.value)} placeholder={t('rimsSpecs.brand')} />
        <input className={inputClass} value={getSpecValue(editData, 'identity', 'model', selectedRim.model)} onChange={(event) => setSpec('identity', 'model', event.target.value)} placeholder={t('rimsSpecs.model')} />
        <input className={inputClass} value={getSpecValue(editData, 'identity', 'size_string', selectedRim.size_string)} onChange={(event) => setSpec('identity', 'size_string', event.target.value)} placeholder={t('rimsSpecs.size')} />
        <input type="number" step="0.5" className={inputClass} value={getSpecValue(editData, 'rim', 'width_in', selectedRim.width_in)} onChange={(event) => setSpec('rim', 'width_in', event.target.value ? Number(event.target.value) : null)} placeholder="Width" />
        <input type="number" step="1" className={inputClass} value={getSpecValue(editData, 'rim', 'rim_diameter_in', selectedRim.rim_diameter_in)} onChange={(event) => setSpec('rim', 'rim_diameter_in', event.target.value ? Number(event.target.value) : null)} placeholder="Diameter" />
        <input className={inputClass} value={getSpecValue(editData, 'rim', 'bolt_pattern', selectedRim.bolt_pattern)} onChange={(event) => setSpec('rim', 'bolt_pattern', event.target.value)} placeholder="PCD" />
        <input type="number" step="1" className={inputClass} value={getSpecValue(editData, 'rim', 'et_offset_mm', selectedRim.et_offset_mm)} onChange={(event) => setSpec('rim', 'et_offset_mm', event.target.value ? Number(event.target.value) : null)} placeholder="ET" />
        <input type="number" step="0.1" className={inputClass} value={getSpecValue(editData, 'rim', 'center_bore_mm', selectedRim.center_bore_mm ?? selectedRim.cb_mm)} onChange={(event) => setSpec('rim', 'center_bore_mm', event.target.value ? Number(event.target.value) : null)} placeholder="CB" />
        <input className={inputClass} value={getSpecValue(editData, 'rim', 'material', selectedRim.material)} onChange={(event) => setSpec('rim', 'material', event.target.value)} placeholder={t('rimsSpecs.material')} />
        <input className={inputClass} value={getSpecValue(editData, 'rim', 'color', selectedRim.color)} onChange={(event) => setSpec('rim', 'color', event.target.value)} placeholder={t('rimsSpecs.color')} />
        <input className={inputClass} value={getSpecValue(editData, 'rim', 'finish', selectedRim.finish)} onChange={(event) => setSpec('rim', 'finish', event.target.value)} placeholder={t('rimsSpecs.finish')} />
        <input type="number" step="1" className={inputClass} value={getSpecValue(editData, 'rim', 'wheel_load_kg', selectedRim.wheel_load_kg)} onChange={(event) => setSpec('rim', 'wheel_load_kg', event.target.value ? Number(event.target.value) : null)} placeholder={t('rimsSpecs.wheelLoadKg')} />
      </div>
      <div className={`mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={Boolean(getSpecValue(editData, 'rim', 'bolts_included', selectedRim.bolts_included))} onChange={(event) => setSpec('rim', 'bolts_included', event.target.checked)} />
          {t('rimsSpecs.boltsIncluded')}
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={Boolean(getSpecValue(editData, 'rim', 'winter_approved', selectedRim.winter_approved))} onChange={(event) => setSpec('rim', 'winter_approved', event.target.checked)} />
          {t('rimsSpecs.winterApproved')}
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={Boolean((editData.spec_overrides as any)?.classification?.manual_not_sellable)} onChange={(event) => setSpec('classification', 'manual_not_sellable', event.target.checked)} />
          {t('rimsSpecs.notSellable')}
        </label>
      </div>
    </div>
  );
}
