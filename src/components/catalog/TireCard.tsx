import React from 'react';
import { useLanguage } from '../LanguageContext';
import { motion } from 'motion/react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ShoppingCart, Package, PackageX } from 'lucide-react';
import { EURating } from './EURating';
import { StockBadge } from './StockBadge';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface TireCardProps {
  product: {
    id: string;
    brand: string;
    model: string;
    size_text?: string;
    eu_fuel?: string;
    eu_wet?: string;
    eu_noise?: number;
    season?: string;
    runflat?: boolean;
    xl?: boolean;
    studded?: boolean;
    best_price_eur?: number;
    best_image_url: string;
    in_stock: boolean;
  };
}

export function TireCard({ product }: TireCardProps) {
  const { language } = useLanguage();

  const getSeasonIcon = (season?: string) => {
    if (!season) return null;
    switch (season.toLowerCase()) {
      case 'summer':
        return '☀️';
      case 'winter':
        return '❄️';
      case 'all_season':
        return '🔄';
      default:
        return null;
    }
  };

  const getSeasonLabel = (season?: string) => {
    if (!season) return '';
    const labels = {
      summer: language === 'fi' ? 'Kesä' : 'Summer',
      winter: language === 'fi' ? 'Talvi' : 'Winter',
      all_season: language === 'fi' ? 'Ympärivuotinen' : 'All Season',
    };
    return labels[season.toLowerCase() as keyof typeof labels] || season;
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="group relative h-full"
    >
      <div
        className="
          h-full rounded-3xl
          border overflow-hidden
          transition-all duration-300
          hover:border-[#0B6BFF]/50
          border-gray-200 dark:border-white/10
          bg-white dark:bg-[#1C1C1E]
          shadow-lg dark:shadow-none
          hover:shadow-xl hover:shadow-[#0B6BFF]/20 dark:hover:shadow-[0_0_24px_rgba(11,107,255,0.25)]
        "
      >
        {/* Image Container - Golden Ratio Height */}
        <div className="relative aspect-[1/0.618] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-white/5 dark:to-white/[0.02] overflow-hidden">
          <ImageWithFallback
            src={product.best_image_url}
            alt={`${product.brand} ${product.model}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Dark overlay for better badge visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 dark:from-black/40 dark:to-black/20" />
          
          {/* Stock Badge Overlay */}
          <div className="absolute top-4 right-4 z-10">
            <StockBadge inStock={product.in_stock} />
          </div>

          {/* Season Badge */}
          {product.season && (
            <div className="absolute top-4 left-4 z-10">
              <Badge className="bg-white/90 dark:bg-white/10 backdrop-blur-md text-gray-900 dark:text-white border-gray-200 dark:border-white/20 shadow-md">
                {getSeasonIcon(product.season)} {getSeasonLabel(product.season)}
              </Badge>
            </div>
          )}

          {/* EU Label - Prominent Display */}
          {(product.eu_fuel || product.eu_wet || product.eu_noise) && (
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <div className="bg-white/95 dark:bg-black/80 backdrop-blur-md rounded-xl p-3 border border-gray-200 dark:border-white/20 shadow-lg">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-xs">EU</span>
                    </div>
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      {language === 'fi' ? 'Energiamerkintä' : 'EU Label'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {product.eu_fuel && (
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">{language === 'fi' ? 'Polttoaine' : 'Fuel'}</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{product.eu_fuel}</span>
                      </div>
                    )}
                    {product.eu_wet && (
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">{language === 'fi' ? 'Märkäpito' : 'Wet'}</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{product.eu_wet}</span>
                      </div>
                    )}
                    {product.eu_noise && (
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">{language === 'fi' ? 'Melu' : 'Noise'}</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{product.eu_noise}dB</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Brand & Model */}
          <div>
            <h3 className="text-gray-900 dark:text-white mb-1">{product.brand}</h3>
            <p className="text-gray-600 dark:text-[#B0B8C4] text-sm">{product.model}</p>
          </div>

          {/* Size */}
          {product.size_text && (
            <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <span className="text-gray-900 dark:text-white">{product.size_text}</span>
            </div>
          )}

          {/* Feature Badges */}
          <div className="flex flex-wrap gap-2">
            {product.runflat && (
              <Badge variant="outline" className="bg-blue-50 dark:bg-[#0B6BFF]/10 border-blue-200 dark:border-[#0B6BFF]/30 text-blue-700 dark:text-[#0B6BFF] text-xs">
                RunFlat
              </Badge>
            )}
            {product.xl && (
              <Badge variant="outline" className="bg-gray-100 dark:bg-white/5 border-gray-300 dark:border-white/20 text-gray-700 dark:text-white text-xs">
                XL
              </Badge>
            )}
            {product.studded && (
              <Badge variant="outline" className="bg-gray-100 dark:bg-white/5 border-gray-300 dark:border-white/20 text-gray-700 dark:text-white text-xs">
                {language === 'fi' ? 'Nastat' : 'Studded'}
              </Badge>
            )}
          </div>

          {/* Price & Add to Cart */}
          <div className="pt-4 border-t border-gray-200 dark:border-white/10 space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl text-gray-900 dark:text-white">
                  €{(product.best_price_eur || 0).toFixed(2)}
                </span>
                <span className="text-gray-600 dark:text-[#B0B8C4] text-sm ml-2">
                  {language === 'fi' ? '/kpl' : '/each'}
                </span>
              </div>
            </div>

            <Button
              className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/80 text-white
                shadow-[0_0_20px_rgba(255,107,53,0.3)] hover:shadow-[0_0_30px_rgba(255,107,53,0.5)]
                transition-all duration-300"
              disabled={!product.in_stock}
            >
              {product.in_stock ? (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {language === 'fi' ? 'Lisää ostoskoriin' : 'Add to Cart'}
                </>
              ) : (
                <>
                  <PackageX className="w-4 h-4 mr-2" />
                  {language === 'fi' ? 'Ei varastossa' : 'Out of Stock'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Hover Glow Effect */}
        <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-[#0B6BFF]/10 to-transparent" />
        </div>
      </div>
    </motion.div>
  );
}
