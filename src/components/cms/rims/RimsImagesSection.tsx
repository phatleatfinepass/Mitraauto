import { useLanguage } from '../../../i18n/LanguageContext';
import { ImageUpload } from '../shared/ImageUpload';
import type { RimRow } from './types';

interface RimsImagesSectionProps {
  isDark: boolean;
  selectedRim: RimRow;
  gallery: string[];
  supplierFallbackUrl: string | null;
  onGalleryChange: (images: string[]) => void;
}

export function RimsImagesSection({
  isDark,
  selectedRim,
  gallery,
  supplierFallbackUrl,
  onGalleryChange,
}: RimsImagesSectionProps) {
  const { t } = useLanguage();

  return (
    <div>
      <h3 className={`mb-4 text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {t('rimsImages.title')}
      </h3>
      {supplierFallbackUrl && (
        <div className={`mb-4 rounded-lg border p-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
          <p className={`mb-2 text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {t('rimsImages.supplierFallback')}
          </p>
          <img src={supplierFallbackUrl} alt="" className="h-24 w-24 rounded-md object-contain" />
        </div>
      )}
      <ImageUpload
        images={gallery}
        maxImages={10}
        onImagesChange={onGalleryChange}
        productType="rim"
        variantId={selectedRim.variant_id}
      />
    </div>
  );
}
