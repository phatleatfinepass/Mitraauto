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
    best_price_eur: number;
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
          h-full rounded-2xl border border-white/10 
          bg-gradient-to-b from-white/5 to-white/[0.02]
          backdrop-blur-xl overflow-hidden
          transition-all duration-300
          hover:border-[#0B6BFF]/50
          hover:shadow-[0_0_24px_rgba(11,107,255,0.25)]
        "
      >
        {/* Image Container */}
        <div className="relative aspect-square bg-white/5 p-6 flex items-center justify-center overflow-hidden">
          <ImageWithFallback
            src={product.best_image_url}
            alt={`${product.brand} ${product.model}`}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Stock Badge Overlay */}
          <div className="absolute top-3 right-3">
            <StockBadge inStock={product.in_stock} />
          </div>

          {/* Season Badge */}
          {product.season && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-white/10 backdrop-blur-sm text-white border-white/20">
                {getSeasonIcon(product.season)} {getSeasonLabel(product.season)}
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Brand & Model */}
          <div>
            <h3 className="text-white mb-1">{product.brand}</h3>
            <p className="text-[#B0B8C4] text-sm">{product.model}</p>
          </div>

          {/* Size */}
          {product.size_text && (
            <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <span className="text-white">{product.size_text}</span>
            </div>
          )}

          {/* Feature Badges */}
          <div className="flex flex-wrap gap-2">
            {product.runflat && (
              <Badge variant="outline" className="bg-[#0B6BFF]/10 border-[#0B6BFF]/30 text-[#0B6BFF] text-xs">
                RunFlat
              </Badge>
            )}
            {product.xl && (
              <Badge variant="outline" className="bg-white/5 border-white/20 text-white text-xs">
                XL
              </Badge>
            )}
            {product.studded && (
              <Badge variant="outline" className="bg-white/5 border-white/20 text-white text-xs">
                {language === 'fi' ? 'Nastat' : 'Studded'}
              </Badge>
            )}
          </div>

          {/* EU Ratings */}
          {(product.eu_fuel || product.eu_wet || product.eu_noise) && (
            <EURating
              fuel={product.eu_fuel}
              wet={product.eu_wet}
              noise={product.eu_noise}
            />
          )}

          {/* Price & Add to Cart */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl text-white">
                  €{product.best_price_eur.toFixed(2)}
                </span>
                <span className="text-[#B0B8C4] text-sm ml-2">
                  {language === 'fi' ? '/kpl' : '/each'}
                </span>
              </div>
            </div>

            <Button
              className="w-full bg-[#0B6BFF] hover:bg-[#0B6BFF]/80 text-white
                shadow-[0_0_20px_rgba(11,107,255,0.3)] hover:shadow-[0_0_30px_rgba(11,107,255,0.5)]
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
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-[#0B6BFF]/10 to-transparent" />
        </div>
      </div>
    </motion.div>
  );
}
