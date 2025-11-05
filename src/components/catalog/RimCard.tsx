import React from 'react';
import { useLanguage } from '../LanguageContext';
import { motion } from 'motion/react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ShoppingCart, PackageX, Eye } from 'lucide-react';
import { StockBadge } from './StockBadge';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface RimCardProps {
  product: {
    id: string;
    brand: string;
    model: string;
    rim_width?: number;
    rim_diameter?: number;
    pcd?: string;
    et_offset?: number;
    cb?: number;
    color?: string;
    material?: string;
    best_price_eur?: number;
    best_image_url: string;
    in_stock: boolean;
  };
}

export function RimCard({ product }: RimCardProps) {
  const { language } = useLanguage();

  const getSizeText = () => {
    if (product.rim_width && product.rim_diameter) {
      let text = `${product.rim_width}×${product.rim_diameter}"`;
      if (product.et_offset) text += ` ET${product.et_offset}`;
      if (product.pcd) text += ` ${product.pcd}`;
      return text;
    }
    return null;
  };

  const getMaterialLabel = (material?: string) => {
    if (!material) return '';
    const labels = {
      alloy: language === 'fi' ? 'Alumiini' : 'Alloy',
      steel: language === 'fi' ? 'Teräs' : 'Steel',
    };
    return labels[material.toLowerCase() as keyof typeof labels] || material;
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
        <div className="relative aspect-[1/0.9] bg-gradient-to-br from-[#1A1F2E] to-[#0B0D10] p-6 flex items-center justify-center overflow-hidden">
          <motion.div
            whileHover={{ rotate: 15 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full"
          >
            <ImageWithFallback
              src={product.best_image_url}
              alt={`${product.brand} ${product.model}`}
              className="w-full h-full object-contain transition-all duration-500 
                group-hover:brightness-125 group-hover:drop-shadow-[0_0_30px_rgba(11,107,255,0.3)]"
            />
          </motion.div>
          
          {/* Stock Badge Overlay */}
          <div className="absolute top-3 right-3">
            <StockBadge inStock={product.in_stock} />
          </div>

          {/* Quick View Button */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <Button
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
            >
              <Eye className="w-4 h-4 mr-2" />
              {language === 'fi' ? 'Pikakatselu' : 'Quick View'}
            </Button>
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Brand & Model */}
          <div>
            <h3 className="text-white mb-1">{product.brand}</h3>
            <p className="text-[#B0B8C4] text-sm">{product.model}</p>
          </div>

          {/* Size Specification */}
          {getSizeText() && (
            <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <span className="text-white text-sm">{getSizeText()}</span>
            </div>
          )}

          {/* Specifications Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {product.material && (
              <div className="px-2 py-1.5 rounded-lg bg-white/5">
                <span className="text-[#B0B8C4]">
                  {language === 'fi' ? 'Materiaali' : 'Material'}:
                </span>
                <span className="text-white ml-1">{getMaterialLabel(product.material)}</span>
              </div>
            )}
            {product.color && (
              <div className="px-2 py-1.5 rounded-lg bg-white/5">
                <span className="text-[#B0B8C4]">
                  {language === 'fi' ? 'Väri' : 'Color'}:
                </span>
                <span className="text-white ml-1 capitalize">{product.color}</span>
              </div>
            )}
            {product.cb && (
              <div className="px-2 py-1.5 rounded-lg bg-white/5">
                <span className="text-[#B0B8C4]">CB:</span>
                <span className="text-white ml-1">{product.cb}mm</span>
              </div>
            )}
          </div>

          {/* Material Badge */}
          {product.material && (
            <div className="flex gap-2">
              <Badge
                variant="outline"
                className={`
                  ${product.material.toLowerCase() === 'alloy'
                    ? 'bg-[#0B6BFF]/10 border-[#0B6BFF]/30 text-[#0B6BFF]'
                    : 'bg-white/5 border-white/20 text-white'
                  } text-xs
                `}
              >
                {getMaterialLabel(product.material)}
              </Badge>
            </div>
          )}

          {/* Price & Add to Cart */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl text-white">
                  €{(product.best_price_eur || 0).toFixed(2)}
                </span>
                <span className="text-[#B0B8C4] text-sm ml-2">
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
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-[#0B6BFF]/10 to-transparent" />
        </div>

        {/* Reflective Edge Effect */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </motion.div>
  );
}
