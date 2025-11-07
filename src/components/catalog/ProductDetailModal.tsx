import React, { useState } from 'react';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeContext';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { X, ChevronLeft, ChevronRight, Minus, Plus, Truck, Package, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import svgPaths from '../../imports/svg-a1qm6qb0np';

interface TireProduct {
  type: 'tire';
  id: string;
  brand: string;
  model: string;
  subtitle?: string;
  tire_width: number;
  aspect_ratio: number;
  construction: string;
  rim_diameter: number;
  load_index?: number;
  speed_rating?: string;
  season: string;
  extra_load?: boolean;
  runflat?: boolean;
  studded?: boolean;
  fuel_efficiency?: string;
  wet_grip?: string;
  noise_level?: number;
  best_price_eur?: number;
  best_image_url: string;
  images?: string[];
  description?: string;
  highlights?: string[];
  in_stock: boolean;
  supplier_name?: string;
  delivery_days?: string;
}

interface RimProduct {
  type: 'rim';
  id: string;
  brand: string;
  model: string;
  subtitle?: string;
  rim_width?: number;
  rim_diameter?: number;
  pcd?: string;
  et_offset?: number;
  cb?: number;
  color?: string;
  material?: string;
  best_price_eur?: number;
  best_image_url: string;
  images?: string[];
  description?: string;
  highlights?: string[];
  in_stock: boolean;
  supplier_name?: string;
  delivery_days?: string;
}

type Product = TireProduct | RimProduct;

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: Product, quantity: number) => void;
  onBookInstallation?: (product: Product) => void;
}

export function ProductDetailModal({ 
  product, 
  isOpen, 
  onClose,
  onAddToCart,
  onBookInstallation 
}: ProductDetailModalProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const images = product.images || [product.best_image_url];
  const price = product.best_price_eur || 0;
  const totalPrice = price * quantity;

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(99, prev + delta)));
  };

  const getSeasonLabel = (season: string) => {
    const labels: Record<string, Record<string, string>> = {
      summer: { fi: 'Kesärengas', en: 'Summer Tire' },
      winter: { fi: 'Talvirengas', en: 'Winter Tire' },
      all_season: { fi: 'Ympärivuotinen', en: 'All Season' },
    };
    return labels[season]?.[language] || season;
  };

  const getMaterialLabel = (material?: string) => {
    if (!material) return '';
    const labels: Record<string, Record<string, string>> = {
      alloy: { fi: 'Alumiini', en: 'Aluminum' },
      steel: { fi: 'Teräs', en: 'Steel' },
    };
    return labels[material.toLowerCase()]?.[language] || material;
  };

  const getEUGrade = (grade?: string) => {
    if (!grade) return 'N/A';
    return grade.toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`max-w-[1200px] w-[90vw] max-h-[90vh] p-0 gap-0 overflow-hidden ${
          theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-gray-200'
        }`}
        style={{
          borderRadius: '24px',
        }}
      >
        <DialogTitle className="sr-only">
          {product.brand} {product.model}
        </DialogTitle>

        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute right-6 top-6 z-50 rounded-full p-2 transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-white/10 hover:bg-white/20 text-white' 
              : 'bg-black/5 hover:bg-black/10 text-gray-900'
          }`}
        >
          <X className="size-5" />
        </button>

        <div className="flex flex-col lg:flex-row h-full max-h-[90vh] overflow-hidden">
          {/* Left Panel - Product Image (55%) */}
          <div className={`lg:w-[55%] relative flex items-center justify-center p-8 lg:p-12 ${
            theme === 'dark' 
              ? 'bg-gradient-to-br from-[#2C2C2E] to-[#1C1C1E]' 
              : 'bg-gradient-to-br from-gray-50 to-white'
          }`}>
            {/* EU Label or Brand Badge (Floating) */}
            {product.type === 'tire' && (product.fuel_efficiency || product.wet_grip) && (
              <div className={`absolute top-6 left-6 px-3 py-1.5 rounded-lg text-xs backdrop-blur-md ${
                theme === 'dark' 
                  ? 'bg-blue-400/20 border border-blue-400/30 text-blue-300' 
                  : 'bg-blue-50 border border-blue-200 text-blue-700'
              }`}>
                EU LABEL
              </div>
            )}

            {/* Image Container - 16:9 Aspect */}
            <div className="relative w-full aspect-video flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={images[currentImageIndex]}
                  alt={`${product.brand} ${product.model}`}
                  className="max-w-full max-h-full object-contain"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>

              {/* Carousel Controls */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className={`absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all duration-300 ${
                      theme === 'dark' 
                        ? 'bg-white/10 hover:bg-white/20 text-white' 
                        : 'bg-black/5 hover:bg-black/10 text-gray-900'
                    }`}
                  >
                    <ChevronLeft className="size-6" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className={`absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all duration-300 ${
                      theme === 'dark' 
                        ? 'bg-white/10 hover:bg-white/20 text-white' 
                        : 'bg-black/5 hover:bg-black/10 text-gray-900'
                    }`}
                  >
                    <ChevronRight className="size-6" />
                  </button>

                  {/* Image Indicators */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`size-2 rounded-full transition-all duration-300 ${
                          idx === currentImageIndex
                            ? 'w-6 bg-[#FF6B35]'
                            : theme === 'dark'
                            ? 'bg-white/30 hover:bg-white/50'
                            : 'bg-black/20 hover:bg-black/40'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Panel - Product Details (45%) */}
          <div className="lg:w-[45%] flex flex-col overflow-y-auto">
            <div className="p-8 lg:p-10 space-y-8 flex-1">
              {/* 1. Product Header */}
              <div className="space-y-2">
                <p className={`text-xs uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {product.brand}
                </p>
                <h2 className={`text-3xl lg:text-4xl ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {product.model}
                </h2>
                {product.subtitle && (
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {product.subtitle}
                  </p>
                )}
              </div>

              {/* 2. Size & Spec Badges */}
              <div className="flex flex-wrap gap-2">
                {product.type === 'tire' ? (
                  <>
                    {/* Tire Size */}
                    <div className={`px-3 py-2 rounded-lg text-sm ${
                      theme === 'dark' 
                        ? 'bg-white/5 border border-white/10 text-white' 
                        : 'bg-gray-100 border border-gray-200 text-gray-900'
                    }`}>
                      {product.tire_width}/{product.aspect_ratio} {product.construction}{product.rim_diameter}
                      {product.load_index && ` ${product.load_index}`}
                      {product.speed_rating && product.speed_rating}
                    </div>
                    
                    {/* Season */}
                    <div className={`px-3 py-2 rounded-lg text-sm ${
                      theme === 'dark' 
                        ? 'bg-blue-400/10 border border-blue-400/30 text-blue-300' 
                        : 'bg-blue-50 border border-blue-200 text-blue-700'
                    }`}>
                      {getSeasonLabel(product.season)}
                    </div>

                    {/* Tags */}
                    {product.extra_load && (
                      <div className={`px-3 py-2 rounded-lg text-sm ${
                        theme === 'dark' 
                          ? 'bg-orange-400/10 border border-orange-400/30 text-orange-300' 
                          : 'bg-orange-50 border border-orange-200 text-orange-700'
                      }`}>
                        XL
                      </div>
                    )}
                    {product.runflat && (
                      <div className={`px-3 py-2 rounded-lg text-sm ${
                        theme === 'dark' 
                          ? 'bg-purple-400/10 border border-purple-400/30 text-purple-300' 
                          : 'bg-purple-50 border border-purple-200 text-purple-700'
                      }`}>
                        Runflat
                      </div>
                    )}
                    {product.studded && (
                      <div className={`px-3 py-2 rounded-lg text-sm ${
                        theme === 'dark' 
                          ? 'bg-cyan-400/10 border border-cyan-400/30 text-cyan-300' 
                          : 'bg-cyan-50 border border-cyan-200 text-cyan-700'
                      }`}>
                        {language === 'fi' ? 'Nastarengas' : 'Studded'}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Rim Size */}
                    {product.rim_width && product.rim_diameter && (
                      <div className={`px-3 py-2 rounded-lg text-sm ${
                        theme === 'dark' 
                          ? 'bg-white/5 border border-white/10 text-white' 
                          : 'bg-gray-100 border border-gray-200 text-gray-900'
                      }`}>
                        {product.rim_width}J × {product.rim_diameter}"
                      </div>
                    )}
                    
                    {/* ET Offset */}
                    {product.et_offset && (
                      <div className={`px-3 py-2 rounded-lg text-sm ${
                        theme === 'dark' 
                          ? 'bg-white/5 border border-white/10 text-white' 
                          : 'bg-gray-100 border border-gray-200 text-gray-900'
                      }`}>
                        ET{product.et_offset}
                      </div>
                    )}

                    {/* PCD */}
                    {product.pcd && (
                      <div className={`px-3 py-2 rounded-lg text-sm ${
                        theme === 'dark' 
                          ? 'bg-white/5 border border-white/10 text-white' 
                          : 'bg-gray-100 border border-gray-200 text-gray-900'
                      }`}>
                        {product.pcd}
                      </div>
                    )}

                    {/* CB */}
                    {product.cb && (
                      <div className={`px-3 py-2 rounded-lg text-sm ${
                        theme === 'dark' 
                          ? 'bg-blue-400/10 border border-blue-400/30 text-blue-300' 
                          : 'bg-blue-50 border border-blue-200 text-blue-700'
                      }`}>
                        CB {product.cb}mm
                      </div>
                    )}

                    {/* Material & Color */}
                    {product.material && (
                      <div className={`px-3 py-2 rounded-lg text-sm capitalize ${
                        theme === 'dark' 
                          ? 'bg-white/5 border border-white/10 text-white' 
                          : 'bg-gray-100 border border-gray-200 text-gray-900'
                      }`}>
                        {getMaterialLabel(product.material)}
                      </div>
                    )}
                    {product.color && (
                      <div className={`px-3 py-2 rounded-lg text-sm capitalize ${
                        theme === 'dark' 
                          ? 'bg-white/5 border border-white/10 text-white' 
                          : 'bg-gray-100 border border-gray-200 text-gray-900'
                      }`}>
                        {product.color}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 3. EU Label Section (Tires Only) */}
              {product.type === 'tire' && (product.fuel_efficiency || product.wet_grip || product.noise_level) && (
                <div className="space-y-3">
                  <h3 className={`text-xs uppercase tracking-wider ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {language === 'fi' ? 'EU-MERKINTÄ SUORITUSKYKY' : 'EU LABEL PERFORMANCE'}
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Fuel Efficiency */}
                    <div className={`aspect-square rounded-lg p-3 flex flex-col items-center justify-center text-center ${
                      theme === 'dark' 
                        ? 'bg-white/5 border border-white/10' 
                        : 'bg-gray-50 border border-gray-200'
                    }`}>
                      <div className={`text-3xl mb-1 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {getEUGrade(product.fuel_efficiency)}
                      </div>
                      <div className={`text-xs ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {language === 'fi' ? 'Polttoaine' : 'Fuel'}
                      </div>
                    </div>

                    {/* Wet Grip */}
                    <div className={`aspect-square rounded-lg p-3 flex flex-col items-center justify-center text-center ${
                      theme === 'dark' 
                        ? 'bg-white/5 border border-white/10' 
                        : 'bg-gray-50 border border-gray-200'
                    }`}>
                      <div className={`text-3xl mb-1 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {getEUGrade(product.wet_grip)}
                      </div>
                      <div className={`text-xs ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {language === 'fi' ? 'Märkäpito' : 'Wet Grip'}
                      </div>
                    </div>

                    {/* Noise */}
                    <div className={`aspect-square rounded-lg p-3 flex flex-col items-center justify-center text-center ${
                      theme === 'dark' 
                        ? 'bg-white/5 border border-white/10' 
                        : 'bg-gray-50 border border-gray-200'
                    }`}>
                      <div className={`text-2xl mb-1 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {product.noise_level || '–'} dB
                      </div>
                      <div className={`text-xs ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {language === 'fi' ? 'Melu' : 'Noise'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Description & Highlights */}
              {(product.description || product.highlights) && (
                <div className="space-y-3">
                  {product.description && (
                    <p className={`text-sm leading-relaxed ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {product.description}
                    </p>
                  )}
                  {product.highlights && product.highlights.length > 0 && (
                    <ul className="space-y-2">
                      {product.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <div className="mt-1.5 size-1.5 rounded-full bg-[#FF6B35] shrink-0" />
                          <span className={`text-sm ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {highlight}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* 5. Stock & Supplier Info */}
              <div className={`p-4 rounded-lg space-y-2 ${
                theme === 'dark' 
                  ? 'bg-white/5 border border-white/10' 
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                {/* Stock Status */}
                <div className="flex items-center gap-2">
                  <Package className={`size-4 ${
                    product.in_stock 
                      ? 'text-green-500' 
                      : theme === 'dark' ? 'text-red-400' : 'text-red-500'
                  }`} />
                  <span className={`text-sm ${
                    product.in_stock 
                      ? 'text-green-500' 
                      : theme === 'dark' ? 'text-red-400' : 'text-red-500'
                  }`}>
                    {product.in_stock 
                      ? (language === 'fi' ? 'Varastossa' : 'In Stock')
                      : (language === 'fi' ? 'Loppu varastosta' : 'Out of Stock')
                    }
                  </span>
                </div>

                {/* Delivery Estimate */}
                {product.in_stock && (
                  <div className="flex items-center gap-2">
                    <Truck className={`size-4 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`} />
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {product.delivery_days || (language === 'fi' ? 'Toimitus 1-2 arkipäivää' : 'Ships within 1-2 business days')}
                    </span>
                  </div>
                )}

                {/* Supplier */}
                {product.supplier_name && (
                  <div className={`text-xs ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {language === 'fi' ? 'Toimittaja' : 'Supplier'}: {product.supplier_name}
                  </div>
                )}
              </div>
            </div>

            {/* 6. Sticky Footer - Pricing & Actions */}
            <div className={`border-t p-6 lg:p-8 space-y-4 ${
              theme === 'dark' 
                ? 'bg-[#1C1C1E] border-white/10' 
                : 'bg-white border-gray-200'
            }`}>
              {/* Price */}
              <div className="flex items-end justify-between">
                <div>
                  <p className={`text-xs ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {language === 'fi' ? 'Hinta / kpl' : 'Price / each'}
                  </p>
                  <p className={`text-4xl ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    €{price.toFixed(2)}
                  </p>
                  <p className={`text-xs ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {language === 'fi' ? 'sis. ALV' : 'incl. VAT'}
                  </p>
                </div>

                {/* Quantity Selector */}
                <div className={`flex items-center gap-3 rounded-lg px-4 py-3 ${
                  theme === 'dark' 
                    ? 'bg-white/5 border border-white/10' 
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className={`p-1 rounded transition-colors ${
                      quantity <= 1
                        ? 'opacity-30 cursor-not-allowed'
                        : theme === 'dark'
                        ? 'hover:bg-white/10'
                        : 'hover:bg-gray-200'
                    }`}
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className={`text-lg min-w-[2ch] text-center ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= 99}
                    className={`p-1 rounded transition-colors ${
                      quantity >= 99
                        ? 'opacity-30 cursor-not-allowed'
                        : theme === 'dark'
                        ? 'hover:bg-white/10'
                        : 'hover:bg-gray-200'
                    }`}
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>

              {/* Total Price */}
              {quantity > 1 && (
                <div className={`text-sm flex justify-between ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <span>{language === 'fi' ? 'Yhteensä' : 'Total'}:</span>
                  <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                    €{totalPrice.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Add to Cart */}
                <button
                  onClick={() => onAddToCart?.(product, quantity)}
                  disabled={!product.in_stock}
                  className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full py-4 transition-all duration-300 shadow-[0_4px_12px_rgba(255,107,53,0.25)] hover:shadow-[0_6px_16px_rgba(255,107,53,0.35)] flex items-center justify-center gap-2"
                >
                  <svg className="size-5" fill="none" viewBox="0 0 16 16">
                    <g clipPath="url(#clip0_cart)">
                      <path d={svgPaths.p22b32180} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                      <path d={svgPaths.pceec000} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                      <path d={svgPaths.p35e3f800} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                    </g>
                    <defs>
                      <clipPath id="clip0_cart">
                        <rect fill="white" height="16" width="16" />
                      </clipPath>
                    </defs>
                  </svg>
                  <span className="font-semibold">
                    {product.in_stock 
                      ? (language === 'fi' ? 'Lisää ostoskoriin' : 'Add to Cart')
                      : (language === 'fi' ? 'Loppu varastosta' : 'Out of Stock')
                    }
                  </span>
                </button>

                {/* Book Installation */}
                <button
                  onClick={() => onBookInstallation?.(product)}
                  className={`w-full py-3 rounded-full transition-all duration-300 border ${
                    theme === 'dark'
                      ? 'border-white/20 hover:bg-white/5 text-white'
                      : 'border-gray-300 hover:bg-gray-50 text-gray-900'
                  }`}
                >
                  <span className="text-sm">
                    {language === 'fi' ? 'Varaa asennus' : 'Book Installation'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
