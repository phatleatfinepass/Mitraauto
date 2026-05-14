import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Package, PackageX } from 'lucide-react';

interface StockBadgeProps {
  inStock: boolean;
}

export function StockBadge({ inStock }: StockBadgeProps) {
  const { t } = useLanguage();

  if (inStock) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 backdrop-blur-sm">
        <Package className="w-3.5 h-3.5 text-green-400" />
        <span className="text-xs text-green-300">
          {t('productDetail.inStock')}
        </span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-500/20 border border-gray-500/30 backdrop-blur-sm">
      <PackageX className="w-3.5 h-3.5 text-gray-400" />
      <span className="text-xs text-gray-400">
        {t('productDetail.outOfStock')}
      </span>
    </div>
  );
}
