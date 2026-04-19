import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeContext';
import { 
  ArrowLeft,
  Heart, 
  Share2, 
  Truck, 
  Package, 
  ChevronLeft,
  ChevronRight,
  Check,
  Star,
  Shield,
  MessageCircle,
  RotateCcw,
  Lock,
  Snowflake,
  Sun,
  CloudSun,
  Search,
  X,
  Gauge,
  Settings,
  Volume2,
  ShoppingCart,
  Droplet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { TireCard } from './TireCard';
import { RimCard } from './RimCard';
import { buildProductImageFallback } from '../../utils/productImage';
import { calculateLinePricing, type ProductPricingRules } from '../../utils/pricing';

const VAT_RATE = 0.255;
const VAT_MULTIPLIER = 1 + VAT_RATE;

export interface TireProduct {
  type: 'tire';
  id: string;
  brand: string;
  model: string;
  title?: string;
  subtitle?: string;
  tire_width?: number;
  aspect_ratio?: number;
  construction: string;
  rim_diameter?: number;
  load_index?: string;
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
  pricing_rules?: ProductPricingRules | null;
  best_image_url: string;
  images?: string[];
  short_description?: string;
  long_description?: string;
  description?: string;
  in_stock: boolean;
  stock_quantity?: number;
  supplier_name?: string;
  delivery_days?: string;
  weight?: number;
  warranty_years?: number;
  rating?: number;
  review_count?: number;
}

export interface RimProduct {
  type: 'rim';
  id: string;
  brand: string;
  model: string;
  title?: string;
  subtitle?: string;
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
  pricing_rules?: ProductPricingRules | null;
  best_image_url: string;
  images?: string[];
  short_description?: string;
  long_description?: string;
  description?: string;
  in_stock: boolean;
  stock_quantity?: number;
  supplier_name?: string;
  delivery_days?: string;
  compatible_vehicles?: string[];
  warranty_years?: number;
  rating?: number;
  review_count?: number;
}

export type Product = TireProduct | RimProduct;

interface ProductDetailPageProps {
  product: Product;
  relatedProducts?: Product[];
  onAddToCart?: (product: Product, quantity: number) => void;
  onToggleFavorite?: (product: Product) => void;
  onShare?: (product: Product) => void;
}

function CompatibilityList({
  theme,
  language,
  vehicles,
}: {
  theme: string;
  language: string;
  vehicles: string[];
}) {
  if (vehicles.length === 0) {
    return (
      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}`}>
        {language === 'fi' ? 'Yhteensopivuustietoja ei ole saatavilla.' : 'Compatibility data is not available.'}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {vehicles.slice(0, 12).map((vehicle, idx) => (
        <div
          key={`${vehicle}-${idx}`}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
            theme === 'dark' ? 'bg-white/5 text-gray-200' : 'bg-white text-[#334155]'
          }`}
        >
          <Check className="size-4 text-[#FF6B00] flex-shrink-0" />
          <span>{vehicle}</span>
        </div>
      ))}
    </div>
  );
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
  const [showFloatingBack, setShowFloatingBack] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);

  const displayName = String((product as any).title ?? product.model ?? '').trim();
  const galleryImages = (product.images ?? [])
    .map((value) => String(value ?? '').trim())
    .filter((value) => value.length > 0);
  const fallbackImage = String(product.best_image_url ?? '').trim() || buildProductImageFallback(product.brand, displayName);
  const images = (galleryImages.length > 0 ? galleryImages : [fallbackImage]).slice(0, 7);
  const displaySubtitle = String((product as any).subtitle ?? '').trim();
  const hasReviewData =
    typeof product.rating === 'number' || typeof product.review_count === 'number';
  const compatibilityVehicles =
    product.type === 'rim' && Array.isArray(product.compatible_vehicles)
      ? product.compatible_vehicles.filter((item): item is string => Boolean(item && String(item).trim()))
      : [];
  const detailDescription = String(product.long_description ?? product.short_description ?? product.description ?? '').trim();
  const price = product.best_price_eur || 0;
  const pricingForQuantity = calculateLinePricing(price, quantity, product.pricing_rules ?? null);
  const totalPrice = pricingForQuantity.lineTotalEur * VAT_MULTIPLIER;
  const displayUnitPrice = pricingForQuantity.effectiveUnitPriceEur * VAT_MULTIPLIER;
  const hasTierDiscount = pricingForQuantity.savingsEur > 0;

  // Sticky CTA and floating back button on scroll
  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = 600;
      const scrollThreshold = 200;
      setShowMobileCTA(window.scrollY > heroHeight);
      setShowFloatingBack(window.scrollY > scrollThreshold);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard navigation for image preview
  useEffect(() => {
    if (!isImagePreviewOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsImagePreviewOpen(false);
      } else if (e.key === 'ArrowLeft') {
        setPreviewImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      } else if (e.key === 'ArrowRight') {
        setPreviewImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      }
    };

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isImagePreviewOpen, images.length]);

  const handleBack = (e?: React.MouseEvent) => {
    // Prevent default to avoid any scroll behavior
    if (e) {
      e.preventDefault();
    }
    // Navigate back in history
    window.history.back();
  };

  const t = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      'home': { fi: 'Etusivu', en: 'Home' },
      'tires': { fi: 'Renkaat', en: 'Tires' },
      'rims': { fi: 'Vanteet', en: 'Rims' },
      'perPcs': { fi: 'kpl', en: 'pcs' },
      'total': { fi: 'Yhteensä', en: 'Total' },
      'inStock': { fi: 'Varastossa', en: 'In Stock' },
      'outOfStock': { fi: 'Loppu varastosta', en: 'Out of Stock' },
      'delivery': { fi: 'Toimitus 1–3 arkipäivää', en: 'Delivery 1–3 business days' },
      'fulfilledBy': { fi: 'Toimittaa Mitra Auto', en: 'Fulfilled by Mitra Auto' },
      'quantity': { fi: 'Määrä', en: 'Quantity' },
      'addToCart': { fi: 'Lisää ostoskoriin', en: 'Add to Cart' },
      'soldOut': { fi: 'Loppu', en: 'Sold Out' },
      'favorite': { fi: 'Suosikki', en: 'Favorite' },
      'share': { fi: 'Jaa', en: 'Share' },
      'reviews': { fi: 'arvostelua', en: 'reviews' },
      
      // Highlights
      'season': { fi: 'Kausiluokitus', en: 'Season' },
      'summer': { fi: 'Kesä', en: 'Summer' },
      'winter': { fi: 'Talvi', en: 'Winter' },
      'allSeason': { fi: 'Ympärivuotinen', en: 'All Season' },
      'studded': { fi: 'Nastarengas', en: 'Studded' },
      'loadIndex': { fi: 'Kantavuusindeksi', en: 'Load Index' },
      'speedIndex': { fi: 'Nopeusindeksi', en: 'Speed Index' },
      'evReady': { fi: 'EV-valmis', en: 'EV Ready' },
      'warranty': { fi: 'Takuu', en: 'Warranty' },
      'years': { fi: 'vuotta', en: 'years' },
      'material': { fi: 'Materiaali', en: 'Material' },
      'finish': { fi: 'Viimeistely', en: 'Finish' },
      'weight': { fi: 'Paino', en: 'Weight' },
      
      // EU Label
      'euLabel': { fi: 'EU-merkintä ja suorituskyky', en: 'EU Label & Performance' },
      'fuelEfficiency': { fi: 'Polttoainetalous', en: 'Fuel Efficiency' },
      'wetGrip': { fi: 'Märkäpito', en: 'Wet Grip' },
      'noise': { fi: 'Ulkoinen melu', en: 'External Noise' },
      'learnEU': { fi: 'Lue lisää EU-luokituksista →', en: 'Learn about EU ratings →' },
      
      // Fitment
      'fitment': { fi: 'Tekniset tiedot ja yhteensopivuus', en: 'Fitment & Compatibility' },
      'specifications': { fi: 'Tekniset tiedot', en: 'Specifications' },
      'width': { fi: 'Leveys', en: 'Width' },
      'diameter': { fi: 'Halkaisija', en: 'Diameter' },
      'offset': { fi: 'Offset', en: 'Offset' },
      'boltPattern': { fi: 'Pulttijako', en: 'Bolt Pattern' },
      'centerBore': { fi: 'Keskireikä', en: 'Center Bore' },
      'compatibleVehicles': { fi: 'Yhteensopivat ajoneuvot', en: 'Compatible Vehicles' },
      'viewFitmentGuide': { fi: 'Katso sovitusopas →', en: 'View Fitment Guide →' },
      
      // Tabs
      'description': { fi: 'Kuvaus', en: 'Description' },
      'technicalData': { fi: 'Tekniset tiedot', en: 'Technical Data' },
      'reviewsTab': { fi: 'Arvostelut', en: 'Reviews' },
      'noDescription': { fi: 'Ei kuvausta saatavilla.', en: 'No description available.' },
      
      // Related
      'youMayLike': { fi: 'Saatat pitää myös näistä', en: 'You may also like' },
      
      // Trust Footer
      'fastDelivery': { fi: 'Nopea toimitus', en: 'Fast Delivery' },
      'deliveryDesc': { fi: '1–3 arkipäivää kautta Suomen', en: '1–3 business days across Finland' },
      'securePayments': { fi: 'Turvalliset maksut', en: 'Secure Payments' },
      'paymentsDesc': { fi: 'Paytrail / Visa / Mastercard', en: 'Paytrail / Visa / Mastercard' },
      'customerSupport': { fi: 'Asiakastuki', en: 'Customer Support' },
      'supportDesc': { fi: 'Tarvitsetko apua? Ota yhteyttä Mitra Autoon', en: 'Need help? Contact Mitra Auto' },
      'easyReturns': { fi: 'Helppo palautus', en: 'Easy Returns' },
      'returnsDesc': { fi: '30 päivän palautusoikeus', en: '30-day return policy' },
    };
    
    return translations[key]?.[language] || key;
  };

  const getSeasonLabel = (season: string) => {
    const labels: Record<string, string> = {
      summer: t('summer'),
      winter: t('winter'),
      all_season: t('allSeason'),
    };
    return labels[season] || season;
  };

  const getSeasonIcon = (season: string) => {
    const icons: Record<string, React.ReactNode> = {
      summer: <Sun className="size-4" />,
      winter: <Snowflake className="size-4" />,
      all_season: <CloudSun className="size-4" />,
    };
    return icons[season] || null;
  };

  const getMaterialLabel = (material?: string) => {
    if (!material) return '';
    const labels: Record<string, Record<string, string>> = {
      alloy: { fi: 'Alumiini', en: 'Aluminum' },
      aluminum: { fi: 'Alumiini', en: 'Aluminum' },
      steel: { fi: 'Teräs', en: 'Steel' },
    };
    return labels[material.toLowerCase()]?.[language] || material;
  };

  const getEUGradeColor = (grade?: string) => {
    if (!grade) return theme === 'dark' ? 'bg-white/5 text-gray-400 border-white/10' : 'bg-gray-100 text-gray-600 border-gray-300';
    const gradeUpper = grade.toUpperCase();
    
    if (theme === 'dark') {
      const colors: Record<string, string> = {
        A: 'bg-green-500/20 text-green-300 border-green-500/30',
        B: 'bg-lime-500/20 text-lime-300 border-lime-500/30',
        C: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        D: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
        E: 'bg-red-500/20 text-red-300 border-red-500/30',
      };
      return colors[gradeUpper] || 'bg-white/5 text-gray-400 border-white/10';
    } else {
      const colors: Record<string, string> = {
        A: 'bg-green-100 text-green-700 border-green-300',
        B: 'bg-lime-100 text-lime-700 border-lime-300',
        C: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        D: 'bg-orange-100 text-orange-700 border-orange-300',
        E: 'bg-red-100 text-red-700 border-red-300',
      };
      return colors[gradeUpper] || 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#11141A]' : 'bg-white'}`}>
      {/* Back Button */}
      <div className={`border-b ${theme === 'dark' ? 'border-white/10' : 'border-[#E2E8F0]'}`}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <button
            onClick={handleBack}
            className={`flex items-center gap-2 transition-colors ${
              theme === 'dark' 
                ? 'text-gray-400 hover:text-white' 
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <ArrowLeft className="size-5" />
            <span className="text-sm">
              {language === 'fi' ? 'Takaisin hakutuloksiin' : 'Back to search results'}
            </span>
          </button>
        </div>
      </div>

      {/* Floating Back Button - appears on scroll, vertically centered, hidden on mobile */}
      <AnimatePresence>
        {showFloatingBack && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            onClick={handleBack}
            className={`hidden sm:flex fixed top-1/2 -translate-y-1/2 left-4 lg:left-6 z-50 items-center gap-2 px-3 lg:px-4 py-2.5 rounded-full shadow-lg transition-all ${
              theme === 'dark'
                ? 'bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white border border-white/10'
                : 'bg-white hover:bg-gray-50 text-[#0F172A] border border-[#E2E8F0]'
            }`}
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
          >
            <ArrowLeft className="size-5" />
            <span className="text-sm hidden md:inline">
              {language === 'fi' ? 'Takaisin' : 'Back'}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Product Hero Section */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {/* LEFT - Product Gallery (55% visual weight) */}
          <div className="space-y-3 sm:space-y-4">
            {/* Main Image */}
            <div 
              className={`relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group ${
                theme === 'dark' ? 'bg-[#1C1C1E]' : 'bg-[#F8FAFC]'
              }`}
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
              onClick={() => {
                setPreviewImageIndex(currentImageIndex);
                setIsImagePreviewOpen(true);
              }}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={images[currentImageIndex]}
                  alt={`${product.brand} ${displayName || product.model}`}
                  className="w-full h-full object-cover transition-transform"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>
              
              {/* Click to view overlay hint */}
              <div className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
                theme === 'dark' ? 'bg-black/50' : 'bg-black/30'
              }`}>
                <div className="flex flex-col sm:flex-row items-center gap-2 text-white px-4 text-center">
                  <Search className="size-5 sm:size-6" />
                  <span className="text-xs sm:text-sm">
                    {language === 'fi' ? 'Klikkaa nähdäksesi koko kuva' : 'Click to view full image'}
                  </span>
                </div>
              </div>

              {/* Navigation Chevron Buttons - Enhanced visibility */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                    }}
                    className={`absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full transition-all shadow-lg ${
                      theme === 'dark'
                        ? 'bg-white/20 hover:bg-white/30 text-white border border-white/20 backdrop-blur-md'
                        : 'bg-white/90 hover:bg-white text-gray-900 border border-gray-200 backdrop-blur-md'
                    }`}
                    style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                    aria-label={language === 'fi' ? 'Edellinen kuva' : 'Previous image'}
                  >
                    <ChevronLeft className="size-6 sm:size-7" strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                    }}
                    className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full transition-all shadow-lg ${
                      theme === 'dark'
                        ? 'bg-white/20 hover:bg-white/30 text-white border border-white/20 backdrop-blur-md'
                        : 'bg-white/90 hover:bg-white text-gray-900 border border-gray-200 backdrop-blur-md'
                    }`}
                    style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                    aria-label={language === 'fi' ? 'Seuraava kuva' : 'Next image'}
                  >
                    <ChevronRight className="size-6 sm:size-7" strokeWidth={2.5} />
                  </button>
                </>
              )}

              {/* Image Navigation Indicators */}
              {images.length > 1 && (
                <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(idx);
                      }}
                      className={`transition-all rounded-full ${
                        idx === currentImageIndex
                          ? 'w-6 sm:w-8 h-2 bg-[#FF6B00]'
                          : theme === 'dark'
                          ? 'w-2 h-2 bg-white/30 hover:bg-white/50'
                          : 'w-2 h-2 bg-black/30 hover:bg-black/50'
                      }`}
                      aria-label={`Go to image ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((image, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative flex-shrink-0 size-[70px] sm:size-[80px] md:size-[100px] rounded-lg overflow-hidden border-2 transition-all ${
                      idx === currentImageIndex
                        ? 'border-[#FF6B00] ring-2 ring-[#FF6B00]/20'
                        : theme === 'dark'
                        ? 'border-white/10 hover:border-white/30'
                        : 'border-[#E2E8F0] hover:border-gray-300'
                    } ${theme === 'dark' ? 'bg-[#1C1C1E]' : 'bg-[#F8FAFC]'}`}
                    style={{ boxShadow: idx === currentImageIndex ? '0 0 0 rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.04)' }}
                  >
                    <img
                      src={image}
                      alt={`View ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT - Product Summary (45% visual weight) */}
          <div className="space-y-4 sm:space-y-6">
            {/* Brand */}
            <div>
              <p className={`text-lg sm:text-xl uppercase tracking-wide mb-2 ${
                theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'
              }`}>
                {product.brand}
              </p>
              
              {/* Model */}
              <h1 className={`text-2xl sm:text-3xl lg:text-4xl mb-3 ${
                theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
              }`}>
                {displayName}
              </h1>

              {/* Size/Spec Line */}
              <p className={`text-base mb-4 ${
                theme === 'dark' ? 'text-gray-300' : 'text-[#64748B]'
              }`}>
                {product.type === 'tire' ? (
                  displaySubtitle ? (
                    displaySubtitle
                  ) : (
                    <>
                      {product.tire_width !== undefined && product.aspect_ratio !== undefined && product.rim_diameter !== undefined
                        ? `${product.tire_width}/${product.aspect_ratio} ${product.construction}${product.rim_diameter}`
                        : ''}
                      {product.load_index && ` ${product.load_index}`}
                      {product.speed_rating && ` ${product.speed_rating}`}
                    </>
                  )
                ) : (
                  displaySubtitle ? (
                    displaySubtitle
                  ) : (
                    <>
                      {product.rim_width !== undefined && product.rim_diameter !== undefined
                        ? `${product.rim_width}×${product.rim_diameter}"`
                        : ''}
                      {product.et_offset !== undefined && ` ET${product.et_offset}`}
                      {product.pcd && ` ${product.pcd}`}
                      {product.cb && ` CB ${product.cb}mm`}
                    </>
                  )
                )}
              </p>

              {/* Badge */}
              {product.type === 'tire' ? (
                <Badge className={`px-3 py-1.5 text-sm ${
                  theme === 'dark'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {getSeasonIcon(product.season)}
                  <span className="ml-1.5">{getSeasonLabel(product.season)} {language === 'fi' ? 'Rengas' : 'Tire'}</span>
                </Badge>
              ) : (
                <Badge className={`px-3 py-1.5 text-sm ${
                  theme === 'dark'
                    ? 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                    : 'bg-gray-100 text-gray-700 border-gray-300'
                }`}>
                  <Settings className="size-4 mr-1.5" />
                  {product.material ? getMaterialLabel(product.material) : ''} {language === 'fi' ? 'Vanne' : 'Wheel'}
                </Badge>
              )}
            </div>

            <Separator className={theme === 'dark' ? 'bg-white/10' : 'bg-[#E2E8F0]'} />

            {/* Price Block */}
            <div className="space-y-3">
              <div className="flex items-baseline gap-2 sm:gap-3">
                <span className="text-3xl sm:text-4xl text-[#FF6B00]">
                  €{displayUnitPrice.toFixed(2)}
                </span>
                <span className={`text-sm sm:text-base ${
                  theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'
                }`}>
                  / {t('perPcs')}
                </span>
              </div>

              <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-[#64748B]'}`}>
                {language === 'fi' ? 'Sis. ALV 25.5%' : 'Incl. VAT 25.5%'}
              </p>

              {hasTierDiscount && (
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-[#64748B]'}`}>
                  {language === 'fi' ? 'Perushinta' : 'Base price'}: €{(price * VAT_MULTIPLIER).toFixed(2)} / {t('perPcs')}
                </p>
              )}
              
              {quantity > 1 && (
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'
                }`}>
                  {t('total')}: <span className={theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}>€{totalPrice.toFixed(2)}</span> / {quantity} {t('perPcs')}
                </p>
              )}

              {/* Availability */}
              <div className="flex items-center gap-2">
                {product.in_stock ? (
                  <>
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm text-green-600">
                      {t('inStock')}
                      {product.stock_quantity && ` (${product.stock_quantity} ${t('perPcs')})`}
                    </span>
                  </>
                ) : (
                  <>
                    <Package className="size-4 text-red-600" />
                    <span className="text-sm text-red-600">
                      {t('outOfStock')}
                    </span>
                  </>
                )}
              </div>

              {/* Delivery Info */}
              <div className={`flex items-start gap-3 p-4 rounded-xl ${
                theme === 'dark' ? 'bg-white/5' : 'bg-[#F8FAFC]'
              }`}>
                <Truck className={`size-5 mt-0.5 flex-shrink-0 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'
                }`} />
                <div className="flex-1">
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-[#0F172A]'
                  }`}>
                    {product.delivery_days || t('delivery')}
                  </p>
                  <p className={`text-xs mt-0.5 ${
                    theme === 'dark' ? 'text-gray-500' : 'text-[#64748B]'
                  }`}>
                    {t('fulfilledBy')}
                  </p>
                </div>
              </div>

              {/* Trust Row - Rating & Payment Icons */}
              <div className="flex items-center gap-4 flex-wrap">
                {product.rating && (
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`size-4 ${
                            i < Math.floor(product.rating || 0)
                              ? 'fill-[#FF6B00] text-[#FF6B00]'
                              : theme === 'dark'
                              ? 'text-gray-600'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'
                    }`}>
                      {product.rating?.toFixed(1)}
                    </span>
                    {product.review_count && (
                      <span className={`text-sm ${
                        theme === 'dark' ? 'text-gray-500' : 'text-[#64748B]'
                      }`}>
                        ({product.review_count} {t('reviews')})
                      </span>
                    )}
                  </div>
                )}
                
                {/* Payment Icons */}
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 text-xs rounded ${
                    theme === 'dark' ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-600'
                  }`}>
                    Paytrail
                  </div>
                  <div className={`px-2 py-1 text-xs rounded ${
                    theme === 'dark' ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-600'
                  }`}>
                    Visa
                  </div>
                  <div className={`px-2 py-1 text-xs rounded ${
                    theme === 'dark' ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-600'
                  }`}>
                    Mastercard
                  </div>
                </div>
              </div>
            </div>

            <Separator className={theme === 'dark' ? 'bg-white/10' : 'bg-[#E2E8F0]'} />

            {/* Quantity Selector */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className={`text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-[#0F172A]'
                }`}>
                  {t('quantity')}
                </label>
                <div className={`flex items-center gap-3 rounded-lg px-4 py-2 ${
                  theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-[#F1F5F9] border border-[#E2E8F0]'
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
                    <span className="text-lg select-none">−</span>
                  </button>
                  <span className={`text-lg min-w-[3ch] text-center ${
                    theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
                  }`}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((prev) => Math.min(20, prev + 1))}
                    disabled={quantity >= 20}
                    className={`p-1 rounded transition-colors ${
                      quantity >= 20
                        ? 'opacity-30 cursor-not-allowed'
                        : theme === 'dark'
                        ? 'hover:bg-white/10'
                        : 'hover:bg-gray-200'
                    }`}
                  >
                    <span className="text-lg select-none">+</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 sm:gap-3">
                <Button
                  onClick={() => onAddToCart?.(product, quantity)}
                  disabled={!product.in_stock}
                  className="flex-1 bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white h-11 sm:h-12 text-sm sm:text-base disabled:opacity-50 transition-transform hover:scale-[1.02]"
                  style={{ boxShadow: '0 2px 12px rgba(255, 107, 0, 0.25)' }}
                >
                  <Package className="size-4 sm:size-5 mr-1.5 sm:mr-2" />
                  <span className="hidden min-[400px]:inline">{product.in_stock ? t('addToCart') : t('outOfStock')}</span>
                  <span className="min-[400px]:hidden">{product.in_stock ? (language === 'fi' ? 'Lisää' : 'Add') : (language === 'fi' ? 'Loppu' : 'Out')}</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setIsFavorite(!isFavorite);
                    onToggleFavorite?.(product);
                  }}
                  className={`h-11 sm:h-12 px-3 sm:px-4 ${
                    isFavorite
                      ? 'text-[#FF6B00] border-[#FF6B00] bg-[#FF6B00]/5'
                      : theme === 'dark'
                      ? 'border-white/20 hover:bg-white/5'
                      : 'border-[#E2E8F0] hover:bg-gray-50'
                  }`}
                >
                  <Heart className={`size-4 sm:size-5 ${isFavorite ? 'fill-current' : ''}`} />
                </Button>

                <Button
                  variant="outline"
                  onClick={() => onShare?.(product)}
                  className={`h-12 px-4 ${
                    theme === 'dark'
                      ? 'border-white/20 hover:bg-white/5'
                      : 'border-[#E2E8F0] hover:bg-gray-50'
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
          {product.type === 'tire' && (
            /* EU Label & Performance Section - Icon + Value + Description Format */
            <div 
              className={`rounded-2xl p-6 ${
                theme === 'dark' ? 'bg-[#1C1C1E]' : 'bg-[#F1F5F9]'
              }`}
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            >
              <h2 className={`text-xl mb-6 ${
                theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
              }`}>
                {t('euLabel')}
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Fuel Efficiency */}
                {product.fuel_efficiency && (
                  <div 
                    className={`rounded-xl p-4 flex flex-col items-center text-center transition-all hover:shadow-md ${
                      theme === 'dark'
                        ? 'bg-white/5 border-2 border-white/10'
                        : 'bg-white border-2 border-[#E2E8F0]'
                    }`}
                  >
                    <div className={`size-10 rounded-full flex items-center justify-center mb-2 ${
                      getEUGradeColor(product.fuel_efficiency)
                    }`}>
                      <Droplet className="size-5" />
                    </div>
                    <div className={`text-2xl mb-1 ${
                      theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
                    }`}>
                      {product.fuel_efficiency?.toUpperCase()}
                    </div>
                    <div className={`text-xs leading-tight ${
                      theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'
                    }`}>
                      {t('fuelEfficiency')}
                    </div>
                  </div>
                )}

                {/* Wet Grip */}
                {product.wet_grip && (
                  <div 
                    className={`rounded-xl p-4 flex flex-col items-center text-center transition-all hover:shadow-md ${
                      theme === 'dark'
                        ? 'bg-white/5 border-2 border-white/10'
                        : 'bg-white border-2 border-[#E2E8F0]'
                    }`}
                  >
                    <div className={`size-10 rounded-full flex items-center justify-center mb-2 ${
                      getEUGradeColor(product.wet_grip)
                    }`}>
                      <CloudSun className="size-5" />
                    </div>
                    <div className={`text-2xl mb-1 ${
                      theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
                    }`}>
                      {product.wet_grip?.toUpperCase()}
                    </div>
                    <div className={`text-xs leading-tight ${
                      theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'
                    }`}>
                      {t('wetGrip')}
                    </div>
                  </div>
                )}

                {/* Noise */}
                {product.noise_level && (
                  <div 
                    className={`rounded-xl p-4 flex flex-col items-center text-center transition-all hover:shadow-md ${
                      theme === 'dark'
                        ? 'bg-white/5 border-2 border-white/10'
                        : 'bg-white border-2 border-[#E2E8F0]'
                    }`}
                  >
                    <div className={`size-10 rounded-full flex items-center justify-center mb-2 ${
                      theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
                    }`}>
                      <Volume2 className="size-5" />
                    </div>
                    <div className={`text-2xl mb-1 ${
                      theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
                    }`}>
                      {product.noise_level}
                    </div>
                    <div className={`text-xs leading-tight ${
                      theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'
                    }`}>
                      {t('noise')} (dB)
                    </div>
                  </div>
                )}

                {/* Season */}
                <div 
                  className={`rounded-xl p-4 flex flex-col items-center text-center transition-all hover:shadow-md ${
                    theme === 'dark'
                      ? 'bg-white/5 border-2 border-white/10'
                      : 'bg-white border-2 border-[#E2E8F0]'
                  }`}
                >
                  <div className={`size-10 rounded-full flex items-center justify-center mb-2 ${
                    theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-50'
                  }`}>
                    {getSeasonIcon(product.season)}
                  </div>
                  <div className={`text-2xl mb-1 ${
                    theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
                  }`}>
                    {getSeasonLabel(product.season)}
                  </div>
                  <div className={`text-xs leading-tight ${
                    theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'
                  }`}>
                    {t('season')}
                  </div>
                </div>

                {/* Studded */}
                <div 
                  className={`rounded-xl p-4 flex flex-col items-center text-center transition-all hover:shadow-md ${
                    theme === 'dark'
                      ? 'bg-white/5 border-2 border-white/10'
                      : 'bg-white border-2 border-[#E2E8F0]'
                  }`}
                >
                  <div className={`size-10 rounded-full flex items-center justify-center mb-2 ${
                    product.studded 
                      ? (theme === 'dark' ? 'bg-cyan-500/20' : 'bg-cyan-50')
                      : (theme === 'dark' ? 'bg-white/10' : 'bg-gray-100')
                  }`}>
                    <Snowflake className="size-5" />
                  </div>
                  <div className={`text-2xl mb-1 ${
                    theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
                  }`}>
                    {product.studded ? (language === 'fi' ? 'Kyllä' : 'Yes') : 'No'}
                  </div>
                  <div className={`text-xs leading-tight ${
                    theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'
                  }`}>
                    {t('studded')}
                  </div>
                </div>

                {/* Load & Speed Index */}
                {(product.load_index || product.speed_rating) && (
                  <div 
                    className={`rounded-xl p-4 flex flex-col items-center text-center transition-all hover:shadow-md ${
                      theme === 'dark'
                        ? 'bg-white/5 border-2 border-white/10'
                        : 'bg-white border-2 border-[#E2E8F0]'
                    }`}
                  >
                    <div className={`size-10 rounded-full flex items-center justify-center mb-2 ${
                      theme === 'dark' ? 'bg-orange-500/20' : 'bg-orange-50'
                    }`}>
                      <Gauge className="size-5" />
                    </div>
                    <div className={`text-2xl mb-1 ${
                      theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
                    }`}>
                      {product.load_index}{product.speed_rating}
                    </div>
                    <div className={`text-xs leading-tight ${
                      theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'
                    }`}>
                      {language === 'fi' ? 'Indeksit' : 'Index'}
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Features */}
              {(product.ev_ready || product.runflat || product.three_pmsf) && (
                <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/10">
                  {product.ev_ready && (
                    <Badge className={`px-3 py-1.5 text-xs ${
                      theme === 'dark'
                        ? 'bg-green-500/20 text-green-300 border-green-500/30'
                        : 'bg-green-50 text-green-700 border-green-200'
                    }`}>
                      <Check className="size-3 mr-1" />
                      EV Ready
                    </Badge>
                  )}
                  {product.runflat && (
                    <Badge className={`px-3 py-1.5 text-xs ${
                      theme === 'dark'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}>
                      <Shield className="size-3 mr-1" />
                      RunFlat
                    </Badge>
                  )}
                  {product.three_pmsf && (
                    <Badge className={`px-3 py-1.5 text-xs ${
                      theme === 'dark'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      <Snowflake className="size-3 mr-1" />
                      3PMSF
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}

          {product.type === 'rim' && (
            /* Fitment & Compatibility Section for Rims */
            <div 
              className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 ${
                theme === 'dark' ? 'bg-[#1C1C1E]' : 'bg-[#F8FAFC]'
              }`}
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            >
              <h2 className={`text-lg sm:text-xl mb-4 sm:mb-6 ${
                theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
              }`}>
                {t('fitment')}
              </h2>

              <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Left - Spec Table with Orange Color */}
                <div className="space-y-3">
                  <h3 className={`text-base mb-4 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-[#64748B]'
                  }`}>
                    {t('specifications')}
                  </h3>

                  <div className={`rounded-lg sm:rounded-xl p-4 sm:p-6 ${
                    theme === 'dark' ? 'bg-white/[0.02]' : 'bg-gray-50'
                  }`}>
                    <div className="space-y-0">
                      {[
                        { label: t('width'), value: product.rim_width ? `${product.rim_width}J` : null },
                        { label: `${t('offset')} (ET)`, value: product.et_offset !== undefined ? `ET${product.et_offset}` : null },
                        { label: `${t('boltPattern')} (PCD)`, value: product.pcd },
                        { label: `${t('centerBore')} (CB)`, value: product.cb ? `${product.cb}mm` : null },
                        { label: t('material'), value: product.material ? getMaterialLabel(product.material) : null },
                        { label: t('finish'), value: product.finish },
                        { label: t('weight'), value: product.weight ? `${product.weight} kg` : null },
                      ].map((spec, idx) => spec.value && (
                        <div
                          key={idx}
                          className={`flex justify-between py-3 border-b ${
                            theme === 'dark' ? 'border-white/10' : 'border-[#FF6B00]/20'
                          } last:border-0`}
                        >
                          <span className={`text-sm ${
                            theme === 'dark' ? 'text-gray-300' : 'text-[#64748B]'
                          }`}>
                            {spec.label}
                          </span>
                          <span className={`text-sm ${
                            theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
                          }`}>
                            {spec.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right - Compatibility Checker with See More */}
                <div className="space-y-3">
                  <h3 className={`text-base mb-4 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-[#64748B]'
                  }`}>
                    {language === 'fi' ? 'Yhteensopivuus' : 'Compatibility'}
                  </h3>

                  <CompatibilityList theme={theme} language={language} vehicles={compatibilityVehicles} />

                  <p className={`text-xs mt-4 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'
                  }`}>
                    {language === 'fi' 
                      ? '* Yhteensopivuustiedot ovat viitteellisiä. Tarkista aina ajoneuvosi tekniset tiedot ennen tilaamista.' 
                      : '* Compatibility information is indicative. Always verify your vehicle specifications before ordering.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scrolling Sections - Description and Feedback */}
        <div className="mt-12 space-y-12">
          {/* Description Section */}
          <div>
            <h2 className={`text-2xl mb-6 ${
              theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
            }`}>
              {t('description')}
            </h2>
            
            <div className="max-w-3xl">
              {detailDescription ? (
                <div className="space-y-4">
                  {detailDescription
                    .split(/\n{2,}/)
                    .map((paragraph) => paragraph.trim())
                    .filter((paragraph) => paragraph.length > 0)
                    .map((paragraph, idx) => (
                      <p
                        key={idx}
                        className={`text-base leading-7 ${
                          theme === 'dark' ? 'text-gray-300' : 'text-[#64748B]'
                        }`}
                      >
                        {paragraph}
                      </p>
                    ))}
                </div>
              ) : (
                <p className={`text-base leading-7 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-[#64748B]'
                }`}>
                  {t('noDescription')}
                </p>
              )}

              {product.type === 'tire' && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {product.ev_ready && (
                    <Badge className={`${theme === 'dark' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-green-50 text-green-700 border-green-200'}`}>
                      EV
                    </Badge>
                  )}
                  {product.runflat && (
                    <Badge className={`${theme === 'dark' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                      RunFlat
                    </Badge>
                  )}
                  {product.extra_load && (
                    <Badge className={`${theme === 'dark' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                      XL
                    </Badge>
                  )}
                  {product.studded && (
                    <Badge className={`${theme === 'dark' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-cyan-50 text-cyan-700 border-cyan-200'}`}>
                      {language === 'fi' ? 'Nastat' : 'Studded'}
                    </Badge>
                  )}
                  {product.three_pmsf && (
                    <Badge className={`${theme === 'dark' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                      3PMSF
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Feedback Section - Separated for Rims */}
          {product.type === 'rim' && hasReviewData && (
            <div>
              <h2 className={`text-2xl mb-6 ${
                theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
              }`}>
                {language === 'fi' ? 'Asiakaspalaute' : 'Customer Feedback'}
              </h2>

              <div>
                <div className={`rounded-xl border overflow-hidden ${
                  theme === 'dark' ? 'border-white/10' : 'border-[#E2E8F0]'
                }`}>
                  {/* Single Combined Reviews Container */}
                  <div className={`p-8 ${
                    theme === 'dark' ? 'bg-[#FF6B00]/10' : 'bg-[#FF6B00]/5'
                  }`}>
                    <div className="grid md:grid-cols-2 gap-8 divide-x divide-white/10">
                      {/* Average Rating Section */}
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className={`text-sm mb-3 uppercase tracking-wide ${
                          theme === 'dark' ? 'text-gray-300' : 'text-[#64748B]'
                        }`}>
                          {language === 'fi' ? 'Keskiarvo' : 'Average Rating'}
                        </div>
                        <div className={`text-6xl mb-4 ${
                          theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
                        }`}>
                          {typeof product.rating === 'number' ? product.rating.toFixed(1) : '—'}
                        </div>
                        <div className="flex items-center gap-1 mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`size-6 ${
                                i < Math.floor(product.rating || 0)
                                  ? 'fill-[#FF6B00] text-[#FF6B00]'
                                  : theme === 'dark'
                                  ? 'text-gray-600'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <div className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'
                        }`}>
                          {(product.review_count ?? 0)} {language === 'fi' ? 'arvostelua' : 'reviews'}
                        </div>
                      </div>

                      {/* Number of Buyers Section */}
                      <div className="flex flex-col items-center justify-center text-center md:pl-8">
                        <div className={`text-sm mb-3 uppercase tracking-wide ${
                          theme === 'dark' ? 'text-gray-300' : 'text-[#64748B]'
                        }`}>
                          <div className="flex items-center gap-2 justify-center">
                            <ShoppingCart className="size-5 text-[#FF6B00]" />
                            <span>{language === 'fi' ? 'Ostajia' : 'Buyers'}</span>
                          </div>
                        </div>
                        <div className={`text-6xl mb-2 ${
                          theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
                        }`}>
                          {Math.floor((product.review_count ?? 0) * 3.2)}
                        </div>
                        <div className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'
                        }`}>
                          {language === 'fi' ? 'tyytyväistä asiakasta' : 'satisfied customers'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reviews Section - Only for Tires */}
          {product.type === 'tire' && (
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Technical Data Section */}
            <div>
            <h2 className={`text-2xl mb-6 ${
              theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
            }`}>
              {t('technicalData')}
            </h2>
            
            <div>
              <div className={`rounded-xl overflow-hidden border ${
                theme === 'dark' ? 'border-white/10 bg-[#1C1C1E]' : 'border-[#E2E8F0] bg-white'
              }`}>
                <table className="w-full">
                  <tbody>
                    {product.type === 'tire' ? (
                      <>
                        {[
                          { label: t('width'), value: product.tire_width !== undefined ? `${product.tire_width} mm` : null },
                          { label: language === 'fi' ? 'Profiili' : 'Profile', value: product.aspect_ratio ?? null },
                          { label: language === 'fi' ? 'Vanteen koko' : 'Rim Size', value: product.rim_diameter !== undefined ? `${product.rim_diameter}"` : null },
                          { label: t('loadIndex'), value: product.load_index },
                          { label: t('speedIndex'), value: product.speed_rating },
                          { label: t('season'), value: getSeasonLabel(product.season) },
                          { label: t('studded'), value: product.studded ? (language === 'fi' ? 'Kyllä' : 'Yes') : 'No' },
                          { label: t('weight'), value: product.weight ? `${product.weight} kg` : null },
                          { label: t('fuelEfficiency'), value: product.fuel_efficiency?.toUpperCase() },
                          { label: t('wetGrip'), value: product.wet_grip?.toUpperCase() },
                          { label: t('noise'), value: product.noise_level ? `${product.noise_level} dB` : null },
                        ].filter(row => row.value).map((row, idx, arr) => (
                          <tr 
                            key={idx}
                            className={idx < arr.length - 1 
                              ? (theme === 'dark' ? 'border-b border-white/10' : 'border-b border-[#E2E8F0]')
                              : ''
                            }
                          >
                            <td className={`py-3 px-4 text-sm ${
                              theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'
                            }`}>
                              {row.label}
                            </td>
                            <td className={`py-3 px-4 text-sm text-right ${
                              theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
                            }`}>
                              {row.value}
                            </td>
                          </tr>
                        ))}
                      </>
                    ) : (
                      <>
                        {[
                          { label: t('width'), value: product.rim_width ? `${product.rim_width}J` : null },
                          { label: t('diameter'), value: product.rim_diameter ? `${product.rim_diameter}"` : null },
                          { label: 'ET', value: product.et_offset !== undefined ? `ET${product.et_offset}` : null },
                          { label: 'PCD', value: product.pcd },
                          { label: 'CB', value: product.cb ? `${product.cb} mm` : null },
                          { label: t('material'), value: product.material ? getMaterialLabel(product.material) : null },
                          { label: t('finish'), value: product.finish },
                          { label: t('weight'), value: product.weight ? `${product.weight} kg` : null },
                        ].filter(row => row.value).map((row, idx, arr) => (
                          <tr 
                            key={idx}
                            className={idx < arr.length - 1 
                              ? (theme === 'dark' ? 'border-b border-white/10' : 'border-b border-[#E2E8F0]')
                              : ''
                            }
                          >
                            <td className={`py-3 px-4 text-sm ${
                              theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'
                            }`}>
                              {row.label}
                            </td>
                            <td className={`py-3 px-4 text-sm text-right ${
                              theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
                            }`}>
                              {row.value}
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Reviews & Ratings Section */}
          {hasReviewData && (
          <div>
            <h2 className={`text-2xl mb-6 ${
              theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
            }`}>
              {t('reviewsTab')}
            </h2>

            <div>
              <div className={`rounded-xl border overflow-hidden ${
                theme === 'dark' ? 'border-white/10' : 'border-[#E2E8F0]'
              }`}>
                {/* Single Combined Reviews Container */}
                <div className={`p-8 ${
                  theme === 'dark' ? 'bg-[#FF6B00]/10' : 'bg-[#FF6B00]/5'
                }`}>
                  <div className="grid md:grid-cols-2 gap-8 divide-x divide-white/10">
                    {/* Average Rating Section */}
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className={`text-sm mb-3 uppercase tracking-wide ${
                        theme === 'dark' ? 'text-gray-300' : 'text-[#64748B]'
                      }`}>
                        {language === 'fi' ? 'Keskiarvo' : 'Average Rating'}
                      </div>
                      <div className={`text-6xl mb-4 ${
                        theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
                      }`}>
                        {typeof product.rating === 'number' ? product.rating.toFixed(1) : '—'}
                      </div>
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`size-6 ${
                              i < Math.floor(product.rating || 0)
                                ? 'fill-[#FF6B00] text-[#FF6B00]'
                                : theme === 'dark'
                                ? 'text-gray-600'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <div className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'
                      }`}>
                        {(product.review_count ?? 0)} {language === 'fi' ? 'arvostelua' : 'reviews'}
                      </div>
                    </div>

                    {/* Number of Buyers Section */}
                    <div className="flex flex-col items-center justify-center text-center md:pl-8">
                      <div className={`text-sm mb-3 uppercase tracking-wide ${
                        theme === 'dark' ? 'text-gray-300' : 'text-[#64748B]'
                      }`}>
                        <div className="flex items-center gap-2 justify-center">
                          <ShoppingCart className="size-5 text-[#FF6B00]" />
                          <span>{language === 'fi' ? 'Ostajia' : 'Buyers'}</span>
                        </div>
                      </div>
                      <div className={`text-6xl mb-2 ${
                        theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
                      }`}>
                        {Math.floor((product.review_count ?? 0) * 3.2)}
                      </div>
                      <div className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'
                      }`}>
                        {language === 'fi' ? 'tyytyväistä asiakasta' : 'satisfied customers'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
          </div>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pb-16">
            <h2 className={`text-2xl mb-8 ${
              theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
            }`}>
              {t('youMayLike')}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto lg:overflow-visible">
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

      {/* NEW: Trust & Info Footer */}
      <div className={`border-t ${
        theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-[#F8FAFC] border-[#E2E8F0]'
      }`}>
        <div className="max-w-[1280px] mx-auto px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Fast Delivery */}
            <div className="flex flex-col items-center text-center">
              <div className={`p-4 rounded-full mb-4 ${
                theme === 'dark' ? 'bg-white/5' : 'bg-white'
              }`}>
                <Truck className={`size-6 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-[#FF6B00]'
                }`} />
              </div>
              <h3 className={`text-base mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
              }`}>
                {t('fastDelivery')}
              </h3>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'
              }`}>
                {t('deliveryDesc')}
              </p>
            </div>

            {/* Secure Payments */}
            <div className="flex flex-col items-center text-center">
              <div className={`p-4 rounded-full mb-4 ${
                theme === 'dark' ? 'bg-white/5' : 'bg-white'
              }`}>
                <Lock className={`size-6 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-[#FF6B00]'
                }`} />
              </div>
              <h3 className={`text-base mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
              }`}>
                {t('securePayments')}
              </h3>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'
              }`}>
                {t('paymentsDesc')}
              </p>
            </div>

            {/* Customer Support */}
            <div className="flex flex-col items-center text-center">
              <div className={`p-4 rounded-full mb-4 ${
                theme === 'dark' ? 'bg-white/5' : 'bg-white'
              }`}>
                <MessageCircle className={`size-6 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-[#FF6B00]'
                }`} />
              </div>
              <h3 className={`text-base mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
              }`}>
                {t('customerSupport')}
              </h3>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'
              }`}>
                {t('supportDesc')}
              </p>
            </div>

            {/* Easy Returns */}
            <div className="flex flex-col items-center text-center">
              <div className={`p-4 rounded-full mb-4 ${
                theme === 'dark' ? 'bg-white/5' : 'bg-white'
              }`}>
                <RotateCcw className={`size-6 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-[#FF6B00]'
                }`} />
              </div>
              <h3 className={`text-base mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
              }`}>
                {t('easyReturns')}
              </h3>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'
              }`}>
                {t('returnsDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile CTA */}
      <AnimatePresence>
        {showMobileCTA && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t shadow-lg ${
              theme === 'dark'
                ? 'bg-[#1C1C1E]/95 backdrop-blur-md border-white/10'
                : 'bg-white/95 backdrop-blur-md border-[#E2E8F0]'
            }`}
            style={{ height: '68px' }}
          >
            <div className="flex items-center justify-between px-4 sm:px-6 h-full gap-3">
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl text-[#FF6B00]">
                  €{displayUnitPrice.toFixed(2)}
                </p>
                <p className={`text-xs ${
                  theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'
                }`}>
                  / {t('perPcs')}
                </p>
              </div>
              <Button
                onClick={() => onAddToCart?.(product, quantity)}
                disabled={!product.in_stock}
                className="bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white h-11 px-4 sm:px-6 md:px-8 text-sm sm:text-base transition-transform active:scale-95 whitespace-nowrap"
              >
                <span className="hidden sm:inline">{product.in_stock ? t('addToCart') : t('soldOut')}</span>
                <span className="sm:hidden">{product.in_stock ? (language === 'fi' ? 'Lisää' : 'Add') : (language === 'fi' ? 'Loppu' : 'Out')}</span>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-Screen Image Preview Modal */}
      <AnimatePresence>
        {isImagePreviewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
            onClick={() => setIsImagePreviewOpen(false)}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsImagePreviewOpen(false)}
              className="absolute top-3 sm:top-6 right-3 sm:right-6 p-2 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md border border-white/20 z-10"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
              aria-label={language === 'fi' ? 'Sulje' : 'Close'}
            >
              <X className="size-5 sm:size-6" strokeWidth={2} />
            </button>

            {/* Image Counter */}
            <div className="absolute top-3 sm:top-6 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 text-white text-xs sm:text-sm backdrop-blur-md border border-white/20">
              {previewImageIndex + 1} / {images.length}
            </div>

            {/* Main Image */}
            <div 
              className="relative w-full h-full flex items-center justify-center p-2 sm:p-4 md:p-8 pb-24 sm:pb-28"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={previewImageIndex}
                  src={images[previewImageIndex]}
                  alt={`${product.brand} ${product.model} - Image ${previewImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>

              {/* Navigation Buttons */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                    }}
                    className="absolute left-2 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 md:p-4 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-all backdrop-blur-md border border-white/20"
                    style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                    aria-label={language === 'fi' ? 'Edellinen kuva' : 'Previous image'}
                  >
                    <ChevronLeft className="size-6 sm:size-7 md:size-8" strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-2 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 md:p-4 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-all backdrop-blur-md border border-white/20"
                    style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                    aria-label={language === 'fi' ? 'Seuraava kuva' : 'Next image'}
                  >
                    <ChevronRight className="size-6 sm:size-7 md:size-8" strokeWidth={2.5} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 max-w-[calc(100vw-2rem)] overflow-x-auto scrollbar-hide">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewImageIndex(idx);
                    }}
                    className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-md sm:rounded-lg overflow-hidden transition-all ${
                      idx === previewImageIndex
                        ? 'ring-2 ring-[#FF6B00] ring-offset-1 sm:ring-offset-2 ring-offset-black/50 scale-110'
                        : 'opacity-60 hover:opacity-100 active:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ProductDetailPage;
