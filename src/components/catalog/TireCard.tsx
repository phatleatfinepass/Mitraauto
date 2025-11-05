import React from 'react';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeContext';
import { motion } from 'motion/react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ShoppingCart, PackageX, Droplets, Fuel, Volume2 } from 'lucide-react';
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
  const { theme } = useTheme();

  // Parse EU values
  const euFuel = product.eu_fuel ? product.eu_fuel.toString().trim().toUpperCase() : undefined;
  const euWet = product.eu_wet ? product.eu_wet.toString().trim().toUpperCase() : undefined;
  const parsedNoise =
    typeof product.eu_noise === 'number'
      ? product.eu_noise
      : Number.parseFloat(String(product.eu_noise ?? '').replace(/[^0-9.,-]/g, '').replace(',', '.'));
  const euNoise = Number.isFinite(parsedNoise) ? parsedNoise : undefined;
  const hasEuLabel = euFuel !== undefined || euWet !== undefined || euNoise !== undefined;

  // Log for debugging
  console.log('TireCard Debug:', {
    id: product.id,
    brand: product.brand,
    euFuel,
    euWet,
    euNoise,
    hasEuLabel,
    raw: {
      fuel: product.eu_fuel,
      wet: product.eu_wet,
      noise: product.eu_noise
    }
  });

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
        className={`
          h-full rounded-3xl
          border overflow-hidden
          transition-all duration-300
          hover:border-[#0B6BFF]/50
          ${theme === 'dark' 
            ? 'border-white/10 bg-[#1C1C1E] hover:shadow-[0_0_24px_rgba(11,107,255,0.25)]' 
            : 'border-gray-200 bg-white shadow-lg hover:shadow-xl hover:shadow-[#0B6BFF]/20'
          }
        `}
      >
        {/* Image Container - Golden Ratio Height */}
        <div className={`relative aspect-[1/0.618] overflow-hidden ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-white/5 to-white/[0.02]' 
            : 'bg-gradient-to-br from-gray-50 to-gray-100'
        }`}>
          <ImageWithFallback
            src={product.best_image_url}
            alt={`${product.brand} ${product.model}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Overlay for badge visibility */}
          <div className={`absolute inset-0 ${
            theme === 'dark'
              ? 'bg-gradient-to-t from-black/40 via-transparent to-black/20'
              : 'bg-gradient-to-t from-black/20 via-transparent to-black/10'
          }`} />
          
          {/* Stock Badge */}
          <div className="absolute top-4 right-4 z-10">
            <StockBadge inStock={product.in_stock} />
          </div>

          {/* Season Badge */}
          {product.season && (
            <div className="absolute top-4 left-4 z-10">
              <Badge className={`${
                theme === 'dark'
                  ? 'bg-white/10 text-white border-white/20'
                  : 'bg-white/90 text-gray-900 border-gray-200'
              } backdrop-blur-md shadow-md`}>
                {getSeasonIcon(product.season)} {getSeasonLabel(product.season)}
              </Badge>
            </div>
          )}

          {/* EU Label - Redesigned with Icons */}
          {hasEuLabel && (
            <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
              <div className={`rounded-2xl p-4 backdrop-blur-xl border shadow-2xl ${
                theme === 'dark'
                  ? 'bg-black/90 border-white/10'
                  : 'bg-white/95 border-gray-200'
              }`}>
                <div className="flex items-center justify-between gap-3">
                  {/* EU Logo */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#0B6BFF] to-[#0052CC] rounded-lg flex items-center justify-center shadow-md">
                      <span className="text-white text-xs font-bold">EU</span>
                    </div>
                    <div className="hidden sm:block">
                      <div className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {language === 'fi' ? 'Energiamerkki' : 'EU Label'}
                      </div>
                    </div>
                  </div>

                  {/* Rating Values with Icons */}
                  <div className="flex items-center gap-3">
                    {euFuel && (
                      <div className="flex flex-col items-center gap-1">
                        <Fuel className={`w-4 h-4 ${theme === 'dark' ? 'text-[#0B6BFF]' : 'text-blue-600'}`} />
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {language === 'fi' ? 'Polttoaine' : 'Fuel'}
                        </span>
                        <span className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {euFuel}
                        </span>
                      </div>
                    )}
                    {euWet && (
                      <div className="flex flex-col items-center gap-1">
                        <Droplets className={`w-4 h-4 ${theme === 'dark' ? 'text-[#0B6BFF]' : 'text-blue-600'}`} />
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {language === 'fi' ? 'Märkä' : 'Wet'}
                        </span>
                        <span className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {euWet}
                        </span>
                      </div>
                    )}
                    {euNoise !== undefined && (
                      <div className="flex flex-col items-center gap-1">
                        <Volume2 className={`w-4 h-4 ${theme === 'dark' ? 'text-[#0B6BFF]' : 'text-blue-600'}`} />
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {language === 'fi' ? 'Melu' : 'Noise'}
                        </span>
                        <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {Math.round(euNoise)}dB
                        </span>
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
            <h3 className={`mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {product.brand}
            </h3>
            <p className={`text-sm ${theme === 'dark' ? 'text-[#B0B8C4]' : 'text-gray-600'}`}>
              {product.model}
            </p>
          </div>

          {/* Size */}
          {product.size_text && (
            <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border ${
              theme === 'dark'
                ? 'bg-white/5 border-white/10 text-white'
                : 'bg-gray-100 border-gray-200 text-gray-900'
            }`}>
              <span>{product.size_text}</span>
            </div>
          )}

          {/* Feature Badges */}
          <div className="flex flex-wrap gap-2">
            {product.runflat && (
              <Badge variant="outline" className={`text-xs ${
                theme === 'dark'
                  ? 'bg-[#0B6BFF]/10 border-[#0B6BFF]/30 text-[#0B6BFF]'
                  : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}>
                RunFlat
              </Badge>
            )}
            {product.xl && (
              <Badge variant="outline" className={`text-xs ${
                theme === 'dark'
                  ? 'bg-white/5 border-white/20 text-white'
                  : 'bg-gray-100 border-gray-300 text-gray-700'
              }`}>
                XL
              </Badge>
            )}
            {product.studded && (
              <Badge variant="outline" className={`text-xs ${
                theme === 'dark'
                  ? 'bg-white/5 border-white/20 text-white'
                  : 'bg-gray-100 border-gray-300 text-gray-700'
              }`}>
                {language === 'fi' ? 'Nastat' : 'Studded'}
              </Badge>
            )}
          </div>

          {/* Price & Add to Cart */}
          <div className={`pt-4 border-t space-y-3 ${
            theme === 'dark' ? 'border-white/10' : 'border-gray-200'
          }`}>
            <div className="flex items-baseline justify-between">
              <div>
                <span className={`text-3xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  €{(product.best_price_eur || 0).toFixed(2)}
                </span>
                <span className={`text-sm ml-2 ${theme === 'dark' ? 'text-[#B0B8C4]' : 'text-gray-600'}`}>
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
