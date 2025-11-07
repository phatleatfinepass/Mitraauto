import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeContext';
import { ChevronRight, Heart, Share2, Truck, Package, ChevronLeft, Check, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { TireCard } from './TireCard';
import { RimCard } from './RimCard';

interface TireProduct {
  type: 'tire';
  id: string;
  brand: string;
  model: string;
  tire_width: number;
  aspect_ratio: number;
  construction: string;
  rim_diameter: number;
  load_index?: number;
  speed_rating?: string;
  season: 'summer' | 'winter' | 'all_season';
  extra_load?: boolean;
  runflat?: boolean;
  studded?: boolean;
  fuel_efficiency?: string;
  wet_grip?: string;
  noise_level?: number;
  noise_class?: string;
  ev_ready?: boolean;
  three_pmsf?: boolean;
  best_price_eur?: number;
  best_image_url: string;
  images?: string[];
  description?: string;
  in_stock: boolean;
  stock_quantity?: number;
  supplier_name?: string;
  delivery_days?: string;
  weight?: number;
}

interface RimProduct {
  type: 'rim';
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
  finish?: string;
  weight?: number;
  best_price_eur?: number;
  best_image_url: string;
  images?: string[];
  description?: string;
  in_stock: boolean;
  stock_quantity?: number;
  supplier_name?: string;
  delivery_days?: string;
  compatible_vehicles?: string[];
}

type Product = TireProduct | RimProduct;

interface ProductDetailPageProps {
  product: Product;
  relatedProducts?: Product[];
  onAddToCart?: (product: Product, quantity: number) => void;
  onToggleFavorite?: (product: Product) => void;
  onShare?: (product: Product) => void;
}

export function ProductDetailPage({
  product,
  relatedProducts = [],
  onAddToCart,
  onToggleFavorite,
  onShare,
}: ProductDetailPageProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(product.type === 'tire' ? 4 : 1);
  const [showMobileCTA, setShowMobileCTA] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [isFavorite, setIsFavorite] = useState(false);

  const images = product.images || [product.best_image_url];
  const price = product.best_price_eur || 0;
  const totalPrice = price * quantity;

  // Sticky CTA on scroll
  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = 600; // Approximate hero section height
      setShowMobileCTA(window.scrollY > heroHeight);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getSeasonLabel = (season: string) => {
    const labels: Record<string, Record<string, string>> = {
      summer: { fi: 'Kesärengas', en: 'Summer' },
      winter: { fi: 'Talvirengas', en: 'Winter' },
      all_season: { fi: 'Ympärivuotinen', en: 'All Season' },
    };
    return labels[season]?.[language] || season;
  };

  const getSeasonIcon = (season: string) => {
    const icons: Record<string, string> = {
      summer: '☀️',
      winter: '❄️',
      all_season: '🌤️',
    };
    return icons[season] || '';
  };

  const getMaterialLabel = (material?: string) => {
    if (!material) return '';
    const labels: Record<string, Record<string, string>> = {
      alloy: { fi: 'Alumiini', en: 'Aluminum' },
      steel: { fi: 'Teräs', en: 'Steel' },
    };
    return labels[material.toLowerCase()]?.[language] || material;
  };

  const getEUGradeColor = (grade?: string) => {
    if (!grade) return 'bg-gray-100 text-gray-600';
    const gradeUpper = grade.toUpperCase();
    const colors: Record<string, string> = {
      A: 'bg-green-100 text-green-700 border-green-300',
      B: 'bg-lime-100 text-lime-700 border-lime-300',
      C: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      D: 'bg-orange-100 text-orange-700 border-orange-300',
      E: 'bg-red-100 text-red-700 border-red-300',
    };
    return colors[gradeUpper] || 'bg-gray-100 text-gray-600 border-gray-300';
  };

  const handleAddToCart = () => {
    onAddToCart?.(product, quantity);
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    onToggleFavorite?.(product);
  };

  const handleShare = () => {
    onShare?.(product);
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#11141A]' : 'bg-white'}`}>
      {/* Breadcrumbs */}
      <div className={`border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
        <div className="max-w-[1280px] mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-sm">
            <a 
              href="/" 
              className={`transition-colors ${
                theme === 'dark' 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {language === 'fi' ? 'Etusivu' : 'Home'}
            </a>
            <ChevronRight className="size-4 text-gray-400" />
            <a 
              href="/catalog" 
              className={`transition-colors ${
                theme === 'dark' 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {product.type === 'tire' 
                ? (language === 'fi' ? 'Renkaat' : 'Tires')
                : (language === 'fi' ? 'Vanteet' : 'Rims')
              }
            </a>
            <ChevronRight className="size-4 text-gray-400" />
            <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
              {product.brand} {product.model}
            </span>
          </div>
        </div>
      </div>

      {/* Product Hero Section */}
      <div className="max-w-[1280px] mx-auto px-6 py-8 lg:py-12">
        <div className="grid lg:grid-cols-[55%_45%] gap-8 lg:gap-12">
          {/* Left - Product Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className={`relative aspect-square rounded-2xl overflow-hidden ${
              theme === 'dark' ? 'bg-[#1C1C1E]' : 'bg-gray-50'
            }`}>
              <motion.img
                key={currentImageIndex}
                src={images[currentImageIndex]}
                alt={`${product.brand} ${product.model}`}
                className="w-full h-full object-contain p-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                    className={`absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${
                      theme === 'dark'
                        ? 'bg-white/10 hover:bg-white/20 text-white'
                        : 'bg-black/5 hover:bg-black/10 text-gray-900'
                    }`}
                  >
                    <ChevronLeft className="size-6" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${
                      theme === 'dark'
                        ? 'bg-white/10 hover:bg-white/20 text-white'
                        : 'bg-black/5 hover:bg-black/10 text-gray-900'
                    }`}
                  >
                    <ChevronRight className="size-6" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((image, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative flex-shrink-0 size-[100px] rounded-lg overflow-hidden border-2 transition-all ${
                      idx === currentImageIndex
                        ? 'border-[#FF6B35] ring-2 ring-[#FF6B35]/20'
                        : theme === 'dark'
                        ? 'border-white/10 hover:border-white/30'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${theme === 'dark' ? 'bg-[#1C1C1E]' : 'bg-gray-50'}`}
                  >
                    <img
                      src={image}
                      alt={`View ${idx + 1}`}
                      className="w-full h-full object-contain p-2"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right - Product Summary */}
          <div className="space-y-6">
            {/* Brand & Model */}
            <div>
              <p className={`text-xl uppercase tracking-wide mb-2 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {product.brand}
              </p>
              <h1 className={`text-3xl lg:text-4xl mb-3 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {product.model}
              </h1>

              {/* Size/Spec Subtitle */}
              <p className={`text-base ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {product.type === 'tire' ? (
                  <>
                    {product.tire_width} / {product.aspect_ratio} {product.construction}{product.rim_diameter}
                    {product.load_index && ` ${product.load_index}`}
                    {product.speed_rating && product.speed_rating}
                  </>
                ) : (
                  <>
                    {product.rim_width}J × {product.rim_diameter}"
                    {product.et_offset && ` ET${product.et_offset}`}
                    {product.pcd && ` ${product.pcd}`}
                    {product.cb && ` CB ${product.cb}mm`}
                  </>
                )}
              </p>
            </div>

            {/* Badges Row */}
            <div className="flex flex-wrap gap-2">
              {product.type === 'tire' ? (
                <>
                  {/* Season Badge */}
                  <Badge className={`px-3 py-1.5 text-sm ${
                    theme === 'dark'
                      ? 'bg-blue-400/10 text-blue-300 border-blue-400/30'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {getSeasonIcon(product.season)} {getSeasonLabel(product.season)}
                  </Badge>

                  {/* Extra Load */}
                  {product.extra_load && (
                    <Badge className={`px-3 py-1.5 text-sm ${
                      theme === 'dark'
                        ? 'bg-orange-400/10 text-orange-300 border-orange-400/30'
                        : 'bg-orange-50 text-orange-700 border-orange-200'
                    }`}>
                      XL
                    </Badge>
                  )}

                  {/* Runflat */}
                  {product.runflat && (
                    <Badge className={`px-3 py-1.5 text-sm ${
                      theme === 'dark'
                        ? 'bg-purple-400/10 text-purple-300 border-purple-400/30'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}>
                      RunFlat
                    </Badge>
                  )}

                  {/* Studded */}
                  {product.studded && (
                    <Badge className={`px-3 py-1.5 text-sm ${
                      theme === 'dark'
                        ? 'bg-cyan-400/10 text-cyan-300 border-cyan-400/30'
                        : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                    }`}>
                      🧊 {language === 'fi' ? 'Nastarengas' : 'Studded'}
                    </Badge>
                  )}

                  {/* EV Ready */}
                  {product.ev_ready && (
                    <Badge className={`px-3 py-1.5 text-sm ${
                      theme === 'dark'
                        ? 'bg-green-400/10 text-green-300 border-green-400/30'
                        : 'bg-green-50 text-green-700 border-green-200'
                    }`}>
                      EV Ready
                    </Badge>
                  )}

                  {/* 3PMSF */}
                  {product.three_pmsf && (
                    <Badge className={`px-3 py-1.5 text-sm ${
                      theme === 'dark'
                        ? 'bg-slate-400/10 text-slate-300 border-slate-400/30'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      3PMSF
                    </Badge>
                  )}
                </>
              ) : (
                <>
                  {/* Material */}
                  {product.material && (
                    <Badge className={`px-3 py-1.5 text-sm uppercase ${
                      theme === 'dark'
                        ? 'bg-white/5 text-gray-300 border-white/10'
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      {getMaterialLabel(product.material)}
                    </Badge>
                  )}

                  {/* Finish */}
                  {product.finish && (
                    <Badge className={`px-3 py-1.5 text-sm uppercase ${
                      theme === 'dark'
                        ? 'bg-white/5 text-gray-300 border-white/10'
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      {product.finish}
                    </Badge>
                  )}

                  {/* Color */}
                  {product.color && (
                    <Badge className={`px-3 py-1.5 text-sm uppercase ${
                      theme === 'dark'
                        ? 'bg-white/5 text-gray-300 border-white/10'
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      {product.color}
                    </Badge>
                  )}
                </>
              )}
            </div>

            <Separator className={theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'} />

            {/* Price Block */}
            <div className="space-y-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl text-[#FF6B35]">
                    €{price.toFixed(2)}
                  </span>
                  <span className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    / {language === 'fi' ? 'kpl' : 'pcs'}
                  </span>
                </div>
                {product.type === 'tire' && quantity === 4 && (
                  <p className={`text-sm mt-1 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {language === 'fi' ? 'Yhteensä' : 'Total'}: €{totalPrice.toFixed(2)} / 4 {language === 'fi' ? 'kpl' : 'pcs'}
                  </p>
                )}
              </div>

              {/* Availability */}
              <div className="flex items-center gap-2">
                {product.in_stock ? (
                  <>
                    <div className="size-2 rounded-full bg-green-500" />
                    <span className="text-sm text-green-600">
                      {language === 'fi' ? 'Varastossa' : 'In Stock'}
                      {product.stock_quantity && ` (${product.stock_quantity} ${language === 'fi' ? 'kpl' : 'pcs'})`}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="size-2 rounded-full bg-red-500" />
                    <span className="text-sm text-red-600">
                      {language === 'fi' ? 'Loppu varastosta' : 'Out of Stock'}
                    </span>
                  </>
                )}
              </div>

              {/* Delivery Info */}
              {product.in_stock && (
                <div className={`flex items-start gap-3 p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
                }`}>
                  <Truck className={`size-5 mt-0.5 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`} />
                  <div className="flex-1">
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {product.delivery_days || (language === 'fi' ? 'Toimitus 1-2 arkipäivää' : 'Delivery 1-2 business days')}
                    </p>
                    {product.supplier_name && (
                      <p className={`text-xs mt-1 ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        {language === 'fi' ? 'Toimittaja' : 'Supplier'}: {product.supplier_name}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Separator className={theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'} />

            {/* Quantity Selector (for tires default 4, for rims default 1) */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className={`text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {language === 'fi' ? 'Määrä' : 'Quantity'}:
                </label>
                <div className={`flex items-center gap-3 rounded-lg px-4 py-2 ${
                  theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <button
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    disabled={quantity <= 1}
                    className={`p-1 rounded transition-colors ${
                      quantity <= 1
                        ? 'opacity-30 cursor-not-allowed'
                        : theme === 'dark'
                        ? 'hover:bg-white/10'
                        : 'hover:bg-gray-200'
                    }`}
                  >
                    <span className="text-xl">−</span>
                  </button>
                  <span className={`text-lg min-w-[3ch] text-center ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((prev) => Math.min(99, prev + 1))}
                    disabled={quantity >= 99}
                    className={`p-1 rounded transition-colors ${
                      quantity >= 99
                        ? 'opacity-30 cursor-not-allowed'
                        : theme === 'dark'
                        ? 'hover:bg-white/10'
                        : 'hover:bg-gray-200'
                    }`}
                  >
                    <span className="text-xl">+</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={!product.in_stock}
                  className="flex-1 bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white h-12 text-base disabled:opacity-50"
                >
                  <Package className="size-5 mr-2" />
                  {product.in_stock
                    ? (language === 'fi' ? 'Lisää ostoskoriin' : 'Add to Cart')
                    : (language === 'fi' ? 'Loppu varastosta' : 'Out of Stock')
                  }
                </Button>

                <Button
                  variant="outline"
                  onClick={handleToggleFavorite}
                  className={`h-12 px-4 ${
                    isFavorite
                      ? 'text-[#FF6B35] border-[#FF6B35]'
                      : theme === 'dark'
                      ? 'border-white/20 hover:bg-white/5'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Heart className={`size-5 ${isFavorite ? 'fill-current' : ''}`} />
                </Button>

                <Button
                  variant="outline"
                  onClick={handleShare}
                  className={`h-12 px-4 ${
                    theme === 'dark'
                      ? 'border-white/20 hover:bg-white/5'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Share2 className="size-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Product-Type Specific Section */}
        <div className="mt-12">
          {product.type === 'tire' && (product.fuel_efficiency || product.wet_grip || product.noise_level) && (
            /* EU Label Section for Tires */
            <div className={`rounded-2xl p-6 lg:p-8 ${
              theme === 'dark' ? 'bg-[#1C1C1E]' : 'bg-gray-50'
            }`}>
              <h2 className={`text-xl mb-6 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {language === 'fi' ? 'EU-merkintä ja suorituskyky' : 'EU Label & Performance Summary'}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Fuel Efficiency */}
                <div className={`aspect-square rounded-xl p-6 flex flex-col items-center justify-center text-center border-2 ${
                  getEUGradeColor(product.fuel_efficiency)
                }`}>
                  <div className="text-6xl mb-3">
                    {product.fuel_efficiency?.toUpperCase() || '–'}
                  </div>
                  <div className={`text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {language === 'fi' ? 'Polttoainetalous' : 'Fuel Efficiency'}
                  </div>
                </div>

                {/* Wet Grip */}
                <div className={`aspect-square rounded-xl p-6 flex flex-col items-center justify-center text-center border-2 ${
                  getEUGradeColor(product.wet_grip)
                }`}>
                  <div className="text-6xl mb-3">
                    {product.wet_grip?.toUpperCase() || '–'}
                  </div>
                  <div className={`text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {language === 'fi' ? 'Märkäpito' : 'Wet Grip'}
                  </div>
                </div>

                {/* Noise */}
                <div className={`aspect-square rounded-xl p-6 flex flex-col items-center justify-center text-center border-2 ${
                  theme === 'dark'
                    ? 'bg-white/5 border-white/10'
                    : 'bg-gray-100 border-gray-300'
                }`}>
                  <div className="text-5xl mb-3">
                    {product.noise_level ? `${product.noise_level} dB` : '–'}
                  </div>
                  <div className={`text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {language === 'fi' ? 'Ulkoinen melu' : 'External Noise'}
                  </div>
                  {product.noise_class && (
                    <div className="mt-2 text-xs opacity-70">
                      Class {product.noise_class}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {product.type === 'rim' && (
            /* Fitment & Compatibility Section for Rims */
            <div className={`rounded-2xl p-6 lg:p-8 ${
              theme === 'dark' ? 'bg-[#1C1C1E]' : 'bg-gray-50'
            }`}>
              <h2 className={`text-xl mb-6 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {language === 'fi' ? 'Tekniset tiedot ja yhteensopivuus' : 'Fitment & Compatibility'}
              </h2>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Left - Spec Table */}
                <div className="space-y-3">
                  <h3 className={`text-base mb-4 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {language === 'fi' ? 'Tekniset tiedot' : 'Specifications'}
                  </h3>

                  <div className="space-y-2">
                    {[
                      { label: language === 'fi' ? 'Leveys' : 'Width', value: product.rim_width ? `${product.rim_width}J` : null },
                      { label: language === 'fi' ? 'Halkaisija' : 'Diameter', value: product.rim_diameter ? `${product.rim_diameter}"` : null },
                      { label: 'Offset (ET)', value: product.et_offset ? `ET${product.et_offset}` : null },
                      { label: language === 'fi' ? 'Pulttijako (PCD)' : 'Bolt Pattern (PCD)', value: product.pcd },
                      { label: language === 'fi' ? 'Keskireikä (CB)' : 'Center Bore (CB)', value: product.cb ? `${product.cb}mm` : null },
                      { label: language === 'fi' ? 'Materiaali' : 'Material', value: product.material ? getMaterialLabel(product.material) : null },
                      { label: language === 'fi' ? 'Viimeistely' : 'Finish', value: product.finish },
                      { label: language === 'fi' ? 'Paino' : 'Weight', value: product.weight ? `${product.weight} kg` : null },
                    ].map((spec, idx) => spec.value && (
                      <div
                        key={idx}
                        className={`flex justify-between py-2 border-b ${
                          theme === 'dark' ? 'border-white/10' : 'border-gray-200'
                        }`}
                      >
                        <span className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {spec.label}
                        </span>
                        <span className={`text-sm ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {spec.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right - Compatible Vehicles */}
                {product.compatible_vehicles && product.compatible_vehicles.length > 0 && (
                  <div className="space-y-3">
                    <h3 className={`text-base mb-4 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {language === 'fi' ? 'Yhteensopivat ajoneuvot' : 'Compatible Vehicles'}
                    </h3>

                    <div className="space-y-2">
                      {product.compatible_vehicles.map((vehicle, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-2 py-2 text-sm ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}
                        >
                          <Check className="size-4 text-[#FF6B35]" />
                          {vehicle}
                        </div>
                      ))}
                    </div>

                    <button className="text-sm text-[#FF6B35] hover:underline mt-4">
                      {language === 'fi' ? 'Katso sovitusopas →' : 'View Fitment Guide →'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tab Section */}
        <div className="mt-12">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`w-full justify-start border-b rounded-none h-12 ${
              theme === 'dark' ? 'bg-transparent border-white/10' : 'bg-transparent border-gray-200'
            }`}>
              <TabsTrigger
                value="description"
                className={`data-[state=active]:border-b-2 data-[state=active]:border-[#FF6B35] rounded-none ${
                  theme === 'dark' ? 'text-gray-400 data-[state=active]:text-white' : 'text-gray-600 data-[state=active]:text-gray-900'
                }`}
              >
                {language === 'fi' ? 'Kuvaus' : 'Description'}
              </TabsTrigger>
              <TabsTrigger
                value="technical"
                className={`data-[state=active]:border-b-2 data-[state=active]:border-[#FF6B35] rounded-none ${
                  theme === 'dark' ? 'text-gray-400 data-[state=active]:text-white' : 'text-gray-600 data-[state=active]:text-gray-900'
                }`}
              >
                {language === 'fi' ? 'Tekniset tiedot' : 'Technical Data'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-8 max-w-3xl">
              <div className={`prose prose-sm ${theme === 'dark' ? 'prose-invert' : ''}`}>
                {product.description ? (
                  <p className={`leading-7 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {product.description}
                  </p>
                ) : (
                  <p className={`text-sm italic ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    {language === 'fi' ? 'Ei kuvausta saatavilla.' : 'No description available.'}
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="technical" className="mt-8">
              <div className="max-w-3xl">
                <table className="w-full">
                  <tbody className="divide-y divide-gray-200">
                    {product.type === 'tire' ? (
                      <>
                        <tr className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                          <td className="py-3 text-sm">{language === 'fi' ? 'Leveys' : 'Width'}</td>
                          <td className="py-3 text-sm text-right">{product.tire_width} mm</td>
                        </tr>
                        <tr className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                          <td className="py-3 text-sm">{language === 'fi' ? 'Profiili' : 'Profile'}</td>
                          <td className="py-3 text-sm text-right">{product.aspect_ratio}</td>
                        </tr>
                        <tr className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                          <td className="py-3 text-sm">{language === 'fi' ? 'Vanteen koko' : 'Rim Size'}</td>
                          <td className="py-3 text-sm text-right">{product.rim_diameter}"</td>
                        </tr>
                        {product.load_index && (
                          <tr className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                            <td className="py-3 text-sm">{language === 'fi' ? 'Kantavuusindeksi' : 'Load Index'}</td>
                            <td className="py-3 text-sm text-right">{product.load_index}</td>
                          </tr>
                        )}
                        {product.speed_rating && (
                          <tr className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                            <td className="py-3 text-sm">{language === 'fi' ? 'Nopeusindeksi' : 'Speed Rating'}</td>
                            <td className="py-3 text-sm text-right">{product.speed_rating}</td>
                          </tr>
                        )}
                        <tr className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                          <td className="py-3 text-sm">{language === 'fi' ? 'Kausiluokitus' : 'Season'}</td>
                          <td className="py-3 text-sm text-right">{getSeasonLabel(product.season)}</td>
                        </tr>
                        {product.weight && (
                          <tr className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                            <td className="py-3 text-sm">{language === 'fi' ? 'Paino' : 'Weight'}</td>
                            <td className="py-3 text-sm text-right">{product.weight} kg</td>
                          </tr>
                        )}
                      </>
                    ) : (
                      <>
                        {product.rim_width && (
                          <tr className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                            <td className="py-3 text-sm">{language === 'fi' ? 'Leveys' : 'Width'}</td>
                            <td className="py-3 text-sm text-right">{product.rim_width}J</td>
                          </tr>
                        )}
                        {product.rim_diameter && (
                          <tr className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                            <td className="py-3 text-sm">{language === 'fi' ? 'Halkaisija' : 'Diameter'}</td>
                            <td className="py-3 text-sm text-right">{product.rim_diameter}"</td>
                          </tr>
                        )}
                        {product.et_offset && (
                          <tr className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                            <td className="py-3 text-sm">Offset (ET)</td>
                            <td className="py-3 text-sm text-right">ET{product.et_offset}</td>
                          </tr>
                        )}
                        {product.pcd && (
                          <tr className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                            <td className="py-3 text-sm">{language === 'fi' ? 'Pulttijako (PCD)' : 'Bolt Pattern (PCD)'}</td>
                            <td className="py-3 text-sm text-right">{product.pcd}</td>
                          </tr>
                        )}
                        {product.cb && (
                          <tr className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                            <td className="py-3 text-sm">{language === 'fi' ? 'Keskireikä (CB)' : 'Center Bore (CB)'}</td>
                            <td className="py-3 text-sm text-right">{product.cb} mm</td>
                          </tr>
                        )}
                        {product.material && (
                          <tr className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                            <td className="py-3 text-sm">{language === 'fi' ? 'Materiaali' : 'Material'}</td>
                            <td className="py-3 text-sm text-right">{getMaterialLabel(product.material)}</td>
                          </tr>
                        )}
                        {product.finish && (
                          <tr className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                            <td className="py-3 text-sm">{language === 'fi' ? 'Viimeistely' : 'Finish'}</td>
                            <td className="py-3 text-sm text-right">{product.finish}</td>
                          </tr>
                        )}
                        {product.weight && (
                          <tr className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                            <td className="py-3 text-sm">{language === 'fi' ? 'Paino' : 'Weight'}</td>
                            <td className="py-3 text-sm text-right">{product.weight} kg</td>
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pb-16">
            <h2 className={`text-2xl mb-8 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {language === 'fi' ? 'Saatat pitää myös näistä' : 'You may also like'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((relatedProduct, idx) => (
                <div key={relatedProduct.id}>
                  {relatedProduct.type === 'tire' ? (
                    <TireCard
                      product={relatedProduct as any}
                      index={idx}
                    />
                  ) : (
                    <RimCard
                      product={relatedProduct as any}
                      index={idx}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Mobile CTA */}
      {showMobileCTA && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t shadow-lg ${
            theme === 'dark'
              ? 'bg-[#1C1C1E] border-white/10'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-2xl text-[#FF6B35]">
                €{price.toFixed(2)}
              </p>
              <p className={`text-xs ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                / {language === 'fi' ? 'kpl' : 'pcs'}
              </p>
            </div>
            <Button
              onClick={handleAddToCart}
              disabled={!product.in_stock}
              className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white h-12 px-8"
            >
              {product.in_stock
                ? (language === 'fi' ? 'Lisää' : 'Add')
                : (language === 'fi' ? 'Loppu' : 'Sold Out')
              }
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
