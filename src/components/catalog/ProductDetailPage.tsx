import React, { useEffect, useState } from 'react';
import { translateForLanguage, useLanguage } from '../../i18n/LanguageContext';
import { useTheme } from '../../theme/ThemeContext';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Droplet,
  Gauge,
  Heart,
  Lock,
  MessageCircle,
  Package,
  RotateCcw,
  Search,
  Settings,
  Share2,
  Snowflake,
  Star,
  Sun,
  SunSnow,
  Truck,
  Volume2,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { TireCard } from './TireCard';
import { RimCard } from './RimCard';
import { buildProductImageFallback } from '../../utils/productImage';
import { calculateLinePricing, type ProductPricingRules } from '../../utils/pricing';
import { fetchProductLocaleContent, type ProductLocaleContent } from '../../utils/productsSearch';
import type { TyreLabelSectionData } from '../../utils/tyreLabel';

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
  sound_absorber?: boolean;
  three_pmsf?: boolean;
  tyre_label_section?: TyreLabelSectionData;
  ean?: string;
  manufacture_year?: number;
  best_price_eur?: number;
  seo_slug?: string;
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
  delivery_days_min?: number;
  delivery_days_max?: number;
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
  seo_slug?: string;
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
  delivery_days_min?: number;
  delivery_days_max?: number;
  tags?: string[];
  generated_tags?: string[];
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

function DetailCard({
  theme,
  label,
  value,
  accent = false,
}: {
  theme: string;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        theme === 'dark'
          ? accent
            ? 'border-[#FF6B00]/30 bg-[#FF6B00]/10'
            : 'border-white/10 bg-white/[0.03]'
          : accent
          ? 'border-[#FF6B00]/20 bg-[#FFF4EC]'
          : 'border-[#E2E8F0] bg-white'
      }`}
    >
      <p className={`text-xs uppercase tracking-[0.18em] ${theme === 'dark' ? 'text-gray-500' : 'text-[#94A3B8]'}`}>
        {label}
      </p>
      <p className={`mt-2 text-base ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>{value}</p>
    </div>
  );
}

function SpecList({
  theme,
  rows,
}: {
  theme: string;
  rows: Array<{ label: string; value: string | null | undefined }>;
}) {
  const visibleRows = rows.filter((row) => row.value && String(row.value).trim().length > 0);

  if (visibleRows.length === 0) {
    return null;
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border ${
        theme === 'dark' ? 'border-white/10 bg-white/[0.03]' : 'border-[#E2E8F0] bg-white'
      }`}
    >
      {visibleRows.map((row, index) => (
        <div
          key={`${row.label}-${index}`}
          className={`flex items-start justify-between gap-4 px-4 py-3 sm:px-5 ${
            index < visibleRows.length - 1
              ? theme === 'dark'
                ? 'border-b border-white/10'
                : 'border-b border-[#E2E8F0]'
              : ''
          }`}
        >
          <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}`}>{row.label}</span>
          <span className={`text-right text-sm ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function CompatibilityList({
  theme,
  emptyText,
  vehicles,
}: {
  theme: string;
  emptyText: string;
  vehicles: string[];
}) {
  if (vehicles.length === 0) {
    return (
      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}`}>
        {emptyText}
      </p>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {vehicles.slice(0, 12).map((vehicle, idx) => (
        <div
          key={`${vehicle}-${idx}`}
          className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm ${
            theme === 'dark' ? 'bg-white/5 text-gray-200' : 'bg-white text-[#334155]'
          }`}
        >
          <Check className="size-4 flex-shrink-0 text-[#FF6B00]" />
          <span>{vehicle}</span>
        </div>
      ))}
    </div>
  );
}

function TyreLabelBlock({
  grade,
  theme,
  title,
}: {
  grade: string | null | undefined;
  theme: string;
  title: string;
}) {
  const grades = ['A', 'B', 'C', 'D', 'E'];
  const activeGrade = String(grade ?? '').trim().toUpperCase();

  const tone = (value: string, active: boolean) => {
    if (!active) {
      return theme === 'dark'
        ? 'border-white/10 bg-white/5 text-gray-500'
        : 'border-gray-200 bg-gray-100 text-gray-400';
    }

    switch (value) {
      case 'A':
        return theme === 'dark' ? 'border-green-500/30 bg-green-500/15 text-green-300' : 'border-green-200 bg-green-50 text-green-700';
      case 'B':
        return theme === 'dark' ? 'border-lime-500/30 bg-lime-500/15 text-lime-300' : 'border-lime-200 bg-lime-50 text-lime-700';
      case 'C':
        return theme === 'dark' ? 'border-yellow-500/30 bg-yellow-500/15 text-yellow-300' : 'border-yellow-200 bg-yellow-50 text-yellow-700';
      case 'D':
        return theme === 'dark' ? 'border-orange-500/30 bg-orange-500/15 text-orange-300' : 'border-orange-200 bg-orange-50 text-orange-700';
      case 'E':
        return theme === 'dark' ? 'border-red-500/30 bg-red-500/15 text-red-300' : 'border-red-200 bg-red-50 text-red-700';
      default:
        return theme === 'dark' ? 'border-white/10 bg-white/5 text-gray-300' : 'border-gray-200 bg-white text-gray-700';
    }
  };

  return (
    <div>
      <p className={`mb-2 text-xs uppercase tracking-[0.18em] ${theme === 'dark' ? 'text-gray-500' : 'text-[#94A3B8]'}`}>
        {title}
      </p>
      <div className="space-y-1">
        {grades.map((value) => (
          <div key={`${title}-${value}`} className={`rounded-md border px-3 py-1.5 text-sm font-medium ${tone(value, activeGrade === value)}`}>
            {value}
          </div>
        ))}
      </div>
    </div>
  );
}

function TyreLabelIdentitySection({
  product,
  productText,
  theme,
}: {
  product: TireProduct;
  productText: (key: string) => string;
  theme: string;
}) {
  const data = product.tyre_label_section;
  if (!data) return null;

  const identityRows = [
    { label: productText('trademark'), value: data.identity.supplier_trademark },
    { label: productText('commercialName'), value: data.identity.commercial_name },
    { label: productText('tyreTypeId'), value: data.identity.tyre_type_identifier },
    { label: productText('tyreClass'), value: data.identity.tyre_class },
    { label: productText('sizeDesignation'), value: data.identity.size_designation },
    {
      label: productText('loadSpeed'),
      value: [data.identity.load_index, data.identity.speed_symbol].filter(Boolean).join(' / ') || null,
    },
    {
      label: productText('loadVersion'),
      value: data.identity.load_version,
    },
    { label: 'EAN', value: data.identity.ean },
  ].filter((row) => row.value && String(row.value).trim().length > 0);

  const complianceRows = [
    { label: 'EPREL', value: data.eu_label.eprel_registration_number },
    { label: productText('productionStart'), value: data.compliance.production_start },
    { label: productText('productionEnd'), value: data.compliance.production_end ?? productText('no') },
    { label: productText('marketStart'), value: data.compliance.market_start },
    { label: productText('source'), value: data.compliance.data_source },
  ].filter((row) => row.value && String(row.value).trim().length > 0);

  const merchandisingBadges = [
    product.runflat ? 'RunFlat' : null,
    data.badges.extra_load ? 'XL' : null,
    product.ev_ready ? 'EV' : null,
    product.sound_absorber ? productText('soundAbsorber') : null,
    product.studded ? productText('studdedShort') : null,
    data.badges.winter_approved ? 'M+S' : null,
  ].filter(Boolean) as string[];

  return (
    <section className={`rounded-3xl border p-6 sm:p-7 ${theme === 'dark' ? 'border-white/10 bg-[#171B22]' : 'border-[#E2E8F0] bg-[#FCFCFD]'}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className={`text-2xl ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>{productText('tyreLabelTitle')}</h2>
          <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}`}>
            {productText('tyreLabelSubtitle')}
          </p>
        </div>

        {(data.eu_label.eprel_qr_url || data.eu_label.eprel_sheet_url) && (
          <div className="flex flex-wrap gap-2">
            {data.eu_label.eprel_qr_url && (
              <a
                href={data.eu_label.eprel_qr_url}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${
                  theme === 'dark' ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-gray-50'
                }`}
              >
                <ExternalLink className="size-4" />
                {productText('eprelQr')}
              </a>
            )}
            {data.eu_label.eprel_sheet_url && (
              <a
                href={data.eu_label.eprel_sheet_url}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${
                  theme === 'dark' ? 'border-blue-500/20 bg-blue-500/10 text-blue-200 hover:bg-blue-500/15' : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <ExternalLink className="size-4" />
                {productText('eprelFiche')}
              </a>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div>
            <p className={`mb-3 text-xs uppercase tracking-[0.18em] ${theme === 'dark' ? 'text-gray-500' : 'text-[#94A3B8]'}`}>
              {productText('identity')}
            </p>
            <SpecList theme={theme} rows={identityRows} />
          </div>

          {merchandisingBadges.length > 0 && (
            <div>
              <p className={`mb-3 text-xs uppercase tracking-[0.18em] ${theme === 'dark' ? 'text-gray-500' : 'text-[#94A3B8]'}`}>
                {productText('tyreBadges')}
              </p>
              <div className="flex flex-wrap gap-2">
                {merchandisingBadges.map((badge) => (
                  <Badge
                    key={badge}
                    className={`rounded-full px-3 py-1.5 ${
                      theme === 'dark'
                        ? 'border-white/10 bg-white/5 text-gray-200'
                        : 'border-[#E2E8F0] bg-white text-[#334155]'
                    }`}
                  >
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {complianceRows.length > 0 && (
            <div>
              <p className={`mb-3 text-xs uppercase tracking-[0.18em] ${theme === 'dark' ? 'text-gray-500' : 'text-[#94A3B8]'}`}>
                {productText('eprelCompliance')}
              </p>
              <SpecList theme={theme} rows={complianceRows} />
            </div>
          )}
        </div>

        <div className={`rounded-3xl border p-5 ${theme === 'dark' ? 'border-white/10 bg-[#11141A]' : 'border-[#E2E8F0] bg-white'}`}>
          <div className="grid gap-4 md:grid-cols-2">
            <TyreLabelBlock grade={data.eu_label.fuel_efficiency_class} theme={theme} title={productText('fuelEfficiency')} />
            <TyreLabelBlock grade={data.eu_label.wet_grip_class} theme={theme} title={productText('wetGrip')} />
          </div>

          <div className={`mt-4 rounded-2xl border p-4 ${theme === 'dark' ? 'border-white/10 bg-white/[0.03]' : 'border-[#E2E8F0] bg-[#F8FAFC]'}`}>
            <div className="flex items-center justify-between gap-3">
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-[#475569]'}`}>
                {productText('externalRollingNoise')}
              </p>
              <p className={`font-mono text-lg ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>
                {data.eu_label.external_noise_db ? `${data.eu_label.external_noise_db} dB` : '—'}
              </p>
            </div>
            <div className="mt-3 flex items-center gap-2">
              {['A', 'B', 'C'].map((noiseClass) => (
                <span
                  key={noiseClass}
                  className={`inline-flex min-w-10 items-center justify-center rounded-full border px-2 py-1 text-xs font-semibold ${
                    theme === 'dark'
                      ? data.eu_label.external_noise_class === noiseClass
                        ? 'border-blue-500/30 bg-blue-500/15 text-blue-200'
                        : 'border-white/10 bg-white/5 text-gray-500'
                      : data.eu_label.external_noise_class === noiseClass
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-gray-100 text-gray-400'
                  }`}
                >
                  {noiseClass}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <DetailCard
              theme={theme}
              label={productText('severeSnow')}
              value={data.eu_label.severe_snow ? '3PMSF' : '—'}
              accent={Boolean(data.eu_label.severe_snow)}
            />
            <DetailCard
              theme={theme}
              label={productText('severeIce')}
              value={data.eu_label.severe_ice ? productText('approved') : '—'}
              accent={Boolean(data.eu_label.severe_ice)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProductDetailPage({
  product,
  relatedProducts = [],
  onAddToCart,
  onToggleFavorite,
  onShare,
}: ProductDetailPageProps) {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const stockLimit = product.in_stock && typeof product.stock_quantity === 'number' && product.stock_quantity > 0
    ? Math.floor(product.stock_quantity)
    : null;
  const maxQuantity = stockLimit ?? 20;
  const defaultQuantity = Math.min(product.type === 'tire' ? 4 : 1, maxQuantity);
  const clampQuantity = (value: number) => Math.min(maxQuantity, Math.max(1, Math.floor(value || 1)));
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(defaultQuantity);
  const [showMobileCTA, setShowMobileCTA] = useState(false);
  const [showFloatingBack, setShowFloatingBack] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [localeContent, setLocaleContent] = useState<ProductLocaleContent | null>(null);

  const localizedTitle = {
    fi: localeContent?.title_fi ?? null,
    en: localeContent?.title_en ?? null,
  }[language];
  const localizedSubtitle = {
    fi: localeContent?.subtitle_fi ?? null,
    en: localeContent?.subtitle_en ?? null,
  }[language];
  const localizedShortDescription = {
    fi: localeContent?.short_description_fi ?? null,
    en: localeContent?.short_description_en ?? null,
  }[language];
  const localizedLongDescription = {
    fi: localeContent?.long_description_fi ?? null,
    en: localeContent?.long_description_en ?? null,
  }[language];
  const localizedSeoSlug = {
    fi: localeContent?.seo_slug_fi ?? localeContent?.seo_slug_en ?? null,
    en: localeContent?.seo_slug_en ?? localeContent?.seo_slug_fi ?? null,
  }[language];
  const localizedSeoTitle = {
    fi: localeContent?.seo_title_fi ?? localeContent?.seo_title_en ?? null,
    en: localeContent?.seo_title_en ?? localeContent?.seo_title_fi ?? null,
  }[language];
  const localizedSeoDescription = {
    fi: localeContent?.seo_description_fi ?? localeContent?.seo_description_en ?? null,
    en: localeContent?.seo_description_en ?? localeContent?.seo_description_fi ?? null,
  }[language];

  const displayName = String(localizedTitle ?? (product as any).title ?? product.model ?? '').trim();
  const displaySubtitle = String(localizedSubtitle ?? (product as any).subtitle ?? '').trim();
  const shortDescription = String(localizedShortDescription ?? product.short_description ?? '').trim();
  const detailDescription = String(localizedLongDescription ?? localizedShortDescription ?? product.long_description ?? product.short_description ?? product.description ?? '').trim();
  const fallbackImage = String(product.best_image_url ?? '').trim() || buildProductImageFallback(product.brand, displayName);
  const galleryImages = (product.images ?? []).map((value) => String(value ?? '').trim()).filter(Boolean);
  const images = (galleryImages.length > 0 ? galleryImages : [fallbackImage]).slice(0, 7);
  const compatibilityVehicles =
    product.type === 'rim' && Array.isArray(product.compatible_vehicles)
      ? product.compatible_vehicles.filter((item): item is string => Boolean(item && String(item).trim()))
      : [];
  const hasReviewData = typeof product.rating === 'number' && typeof product.review_count === 'number' && product.review_count > 0;
  const price = product.best_price_eur || 0;
  const pricingForQuantity = calculateLinePricing(price, quantity, product.pricing_rules ?? null);
  const displayUnitPrice = pricingForQuantity.effectiveUnitPriceEur * VAT_MULTIPLIER;
  const totalPrice = pricingForQuantity.lineTotalEur * VAT_MULTIPLIER;
  const hasTierDiscount = pricingForQuantity.savingsEur > 0;

  useEffect(() => {
    setQuantity(defaultQuantity);
    setCurrentImageIndex(0);
    setPreviewImageIndex(0);
  }, [defaultQuantity, product.id]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const nextLocaleContent = await fetchProductLocaleContent(product.id);
      if (!cancelled) {
        setLocaleContent(nextLocaleContent);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [product.id]);

  useEffect(() => {
    const handleScroll = () => {
      setShowMobileCTA(window.scrollY > 520);
      setShowFloatingBack(window.scrollY > 180);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;

    const title = String(localizedSeoTitle ?? displayName ?? '').trim();
    if (title) {
      document.title = title;
    }

    const description = String(localizedSeoDescription ?? shortDescription ?? detailDescription ?? '').trim();
    let descriptionTag = document.querySelector('meta[name="description"]');
    if (!descriptionTag) {
      descriptionTag = document.createElement('meta');
      descriptionTag.setAttribute('name', 'description');
      document.head.appendChild(descriptionTag);
    }
    descriptionTag.setAttribute('content', description);

    const origin = window.location.origin;
    const seoSlug = String(localizedSeoSlug ?? (product as any).seo_slug ?? '').trim();
    const productPath = `/catalog/${product.type}/${seoSlug || product.id}`;
    const currentPath = { fi: productPath, en: `/en${productPath}` }[language];
    const alternatePath = { fi: `/en${productPath}`, en: productPath }[language];

    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute('href', `${origin}${currentPath}`);

    const updateAlternate = (hreflang: string, href: string) => {
      let link = document.querySelector(`link[rel="alternate"][hreflang="${hreflang}"]`);
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'alternate');
        link.setAttribute('hreflang', hreflang);
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    updateAlternate('fi', `${origin}/catalog/${product.type}/${seoSlug || product.id}`);
    updateAlternate('en', `${origin}/en/catalog/${product.type}/${seoSlug || product.id}`);
    updateAlternate('x-default', `${origin}${alternatePath}`);
  }, [
    detailDescription,
    displayName,
    language,
    localizedSeoDescription,
    localizedSeoSlug,
    localizedSeoTitle,
    product.id,
    product.type,
    shortDescription,
  ]);

  useEffect(() => {
    if (!isImagePreviewOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsImagePreviewOpen(false);
      }
      if (event.key === 'ArrowLeft') {
        setPreviewImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      }
      if (event.key === 'ArrowRight') {
        setPreviewImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [images.length, isImagePreviewOpen]);

  const handleBack = (event?: React.MouseEvent) => {
    event?.preventDefault();
    window.history.back();
  };

  const productText = (key: string) => t(`productDetail.${key}`);

  const getSeasonLabel = (season: string) => {
    const labels: Record<string, string> = {
      summer: productText('summer'),
      winter: productText('winter'),
      all_season: productText('allSeason'),
    };
    return labels[season] || season;
  };

  const getSeasonIcon = (season: string) => {
    const icons: Record<string, React.ReactNode> = {
      summer: <Sun className="size-4" />,
      winter: <Snowflake className="size-4" />,
      all_season: <SunSnow className="size-4" />,
    };
    return icons[season] || null;
  };

  const getMaterialLabel = (material?: string) => {
    if (!material) {
      return '';
    }
    const labelKeys: Record<string, string> = {
      alloy: 'productDetail.materialAlloy',
      aluminum: 'productDetail.materialAlloy',
      steel: 'productDetail.materialSteel',
    };
    const labelKey = labelKeys[material.toLowerCase()];
    return labelKey ? translateForLanguage(language, labelKey) : material;
  };

  const getEUGradeColor = (grade?: string) => {
    if (!grade) {
      return theme === 'dark' ? 'bg-white/5 text-gray-400 border-white/10' : 'bg-gray-100 text-gray-600 border-gray-300';
    }

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
    }

    const colors: Record<string, string> = {
      A: 'bg-green-100 text-green-700 border-green-300',
      B: 'bg-lime-100 text-lime-700 border-lime-300',
      C: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      D: 'bg-orange-100 text-orange-700 border-orange-300',
      E: 'bg-red-100 text-red-700 border-red-300',
    };
    return colors[gradeUpper] || 'bg-gray-100 text-gray-600 border-gray-300';
  };

  const tireFeatureBadges =
    product.type === 'tire'
      ? [
          product.ev_ready ? 'EV Ready' : null,
          product.sound_absorber ? productText('soundAbsorber') : null,
          product.runflat ? 'RunFlat' : null,
          product.extra_load ? 'XL' : null,
          product.studded ? productText('studdedShort') : null,
          product.three_pmsf ? '3PMSF' : null,
        ].filter((value): value is string => Boolean(value))
      : [];
  const rimFeatureBadges =
    product.type === 'rim'
      ? (product.generated_tags?.length ? product.generated_tags : product.tags ?? [])
          .map((tag) => String(tag ?? '').trim())
          .filter((tag, index, tags) => tag.length > 0 && tags.findIndex((candidate) => candidate.toLowerCase() === tag.toLowerCase()) === index)
          .slice(0, 10)
      : [];
  const productFeatureBadges = product.type === 'tire' ? tireFeatureBadges : rimFeatureBadges;

  const overviewCards =
    product.type === 'tire'
      ? [
          {
            label: productText('season'),
            value: getSeasonLabel(product.season),
            accent: true,
          },
          {
            label: productText('stockStatus'),
            value: product.in_stock ? productText('inStock') : productText('outOfStock'),
          },
          {
            label: productText('deliveryTime'),
            value: product.delivery_days || productText('delivery'),
          },
          {
            label: productText('speedIndex'),
            value: [product.load_index, product.speed_rating].filter(Boolean).join(' '),
          },
        ]
      : [
          {
            label: productText('material'),
            value: product.material ? getMaterialLabel(product.material) : productText('notSpecified'),
            accent: true,
          },
          {
            label: productText('stockStatus'),
            value: product.in_stock ? productText('inStock') : productText('outOfStock'),
          },
          {
            label: productText('deliveryTime'),
            value: product.delivery_days || productText('delivery'),
          },
          {
            label: 'PCD / ET',
            value: [product.pcd, product.et_offset !== undefined ? `ET${product.et_offset}` : null].filter(Boolean).join(' • '),
          },
        ];

  const technicalRows =
    product.type === 'tire'
      ? [
          { label: productText('width'), value: product.tire_width !== undefined ? `${product.tire_width} mm` : null },
          { label: productText('profile'), value: product.aspect_ratio !== undefined ? String(product.aspect_ratio) : null },
          { label: productText('construction'), value: product.construction || null },
          { label: productText('rimSize'), value: product.rim_diameter !== undefined ? `${product.rim_diameter}"` : null },
          { label: productText('loadIndex'), value: product.load_index || null },
          { label: productText('speedIndex'), value: product.speed_rating || null },
          { label: productText('season'), value: getSeasonLabel(product.season) },
          { label: productText('dotYear'), value: product.manufacture_year ? String(product.manufacture_year) : null },
          { label: productText('studded'), value: product.studded ? productText('yes') : productText('no') },
          { label: productText('fuelEfficiency'), value: product.fuel_efficiency?.toUpperCase() || null },
          { label: productText('wetGrip'), value: product.wet_grip?.toUpperCase() || null },
          { label: productText('noise'), value: product.noise_level ? `${product.noise_level} dB` : null },
          { label: productText('weight'), value: product.weight ? `${product.weight} kg` : null },
        ]
      : [
          { label: productText('width'), value: product.rim_width ? `${product.rim_width}J` : null },
          { label: productText('diameter'), value: product.rim_diameter ? `${product.rim_diameter}"` : null },
          { label: `${productText('offset')} (ET)`, value: product.et_offset !== undefined ? `ET${product.et_offset}` : null },
          { label: `${productText('boltPattern')} (PCD)`, value: product.pcd || null },
          { label: `${productText('centerBore')} (CB)`, value: product.cb ? `${product.cb} mm` : null },
          { label: productText('material'), value: product.material ? getMaterialLabel(product.material) : null },
          { label: productText('finish'), value: product.finish || null },
          { label: productText('weight'), value: product.weight ? `${product.weight} kg` : null },
          { label: productText('deliveryTime'), value: product.delivery_days || productText('delivery') },
        ];

  const trustItems = [
    {
      icon: <Truck className={`size-6 ${theme === 'dark' ? 'text-gray-300' : 'text-[#FF6B00]'}`} />,
      title: productText('fastDelivery'),
      body: productText('deliveryDesc'),
    },
    {
      icon: <Lock className={`size-6 ${theme === 'dark' ? 'text-gray-300' : 'text-[#FF6B00]'}`} />,
      title: productText('securePayments'),
      body: productText('paymentsDesc'),
    },
    {
      icon: <MessageCircle className={`size-6 ${theme === 'dark' ? 'text-gray-300' : 'text-[#FF6B00]'}`} />,
      title: productText('customerSupport'),
      body: productText('supportDesc'),
    },
    {
      icon: <RotateCcw className={`size-6 ${theme === 'dark' ? 'text-gray-300' : 'text-[#FF6B00]'}`} />,
      title: productText('easyReturns'),
      body: productText('returnsDesc'),
    },
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#11141A]' : 'bg-white'}`}>
      <div className={`border-b ${theme === 'dark' ? 'border-white/10' : 'border-[#E2E8F0]'}`}>
        <div className="mx-auto max-w-[1280px] px-4 py-4 sm:px-6">
          <button
            onClick={handleBack}
            className={`flex items-center gap-2 transition-colors ${
              theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <ArrowLeft className="size-5" />
            <span className="text-sm">{productText('backToSearch')}</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showFloatingBack && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            onClick={handleBack}
            className={`fixed left-4 top-1/2 z-50 hidden -translate-y-1/2 items-center gap-2 rounded-full border px-4 py-2.5 shadow-lg sm:flex ${
              theme === 'dark'
                ? 'border-white/10 bg-[#1C1C1E] text-white hover:bg-[#2C2C2E]'
                : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-gray-50'
            }`}
          >
            <ArrowLeft className="size-5" />
            <span className="hidden text-sm md:inline">{productText('back')}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:gap-12">
          <div className="space-y-4">
            <div
              className={`group relative aspect-square overflow-hidden rounded-3xl ${
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
                  className="h-full w-full object-cover"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.25 }}
                />
              </AnimatePresence>

              <div className={`absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 ${
                theme === 'dark' ? 'bg-black/45' : 'bg-black/28'
              }`}>
                <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-4 py-2 text-white backdrop-blur-md">
                  <Search className="size-4" />
                  <span className="text-sm">{productText('openImage')}</span>
                </div>
              </div>

              {images.length > 1 && (
                <>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                    }}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 rounded-full border p-3 shadow-lg ${
                      theme === 'dark'
                        ? 'border-white/20 bg-white/15 text-white hover:bg-white/25'
                        : 'border-gray-200 bg-white/90 text-gray-900 hover:bg-white'
                    }`}
                    aria-label={productText('previousImage')}
                  >
                    <ChevronLeft className="size-6" />
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                    }}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full border p-3 shadow-lg ${
                      theme === 'dark'
                        ? 'border-white/20 bg-white/15 text-white hover:bg-white/25'
                        : 'border-gray-200 bg-white/90 text-gray-900 hover:bg-white'
                    }`}
                    aria-label={productText('nextImage')}
                  >
                    <ChevronRight className="size-6" />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`size-[78px] flex-shrink-0 overflow-hidden rounded-2xl border-2 ${
                      index === currentImageIndex
                        ? 'border-[#FF6B00] ring-2 ring-[#FF6B00]/20'
                        : theme === 'dark'
                        ? 'border-white/10 hover:border-white/30'
                        : 'border-[#E2E8F0] hover:border-gray-300'
                    }`}
                  >
                    <img src={image} alt={`View ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className={`rounded-3xl border p-6 sm:p-7 ${
              theme === 'dark' ? 'border-white/10 bg-[#171B22]' : 'border-[#E2E8F0] bg-[#FCFCFD]'
            }`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className={`text-sm uppercase tracking-[0.22em] ${theme === 'dark' ? 'text-gray-500' : 'text-[#94A3B8]'}`}>
                    {product.brand}
                  </p>
                  <h1 className={`mt-3 text-3xl leading-tight sm:text-4xl ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>
                    {displayName}
                  </h1>
                  <p className={`mt-3 text-base ${theme === 'dark' ? 'text-gray-300' : 'text-[#475569]'}`}>
                    {displaySubtitle ||
                      (product.type === 'tire'
                        ? `${product.tire_width ?? ''}/${product.aspect_ratio ?? ''} ${product.construction}${product.rim_diameter ?? ''} ${product.load_index ?? ''} ${product.speed_rating ?? ''}`.trim()
                        : `${product.rim_width ?? ''}×${product.rim_diameter ?? ''}" ${product.pcd ?? ''} ${product.et_offset !== undefined ? `ET${product.et_offset}` : ''}`.trim())}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsFavorite((prev) => !prev);
                      onToggleFavorite?.(product);
                    }}
                    className={`h-11 w-11 p-0 ${
                      isFavorite
                        ? 'border-[#FF6B00] bg-[#FF6B00]/5 text-[#FF6B00]'
                        : theme === 'dark'
                        ? 'border-white/20 hover:bg-white/5'
                        : 'border-[#E2E8F0] hover:bg-gray-50'
                    }`}
                  >
                    <Heart className={`size-5 ${isFavorite ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onShare?.(product)}
                    className={`h-11 w-11 p-0 ${
                      theme === 'dark' ? 'border-white/20 hover:bg-white/5' : 'border-[#E2E8F0] hover:bg-gray-50'
                    }`}
                  >
                    <Share2 className="size-5" />
                  </Button>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {product.type === 'tire' ? (
                  <Badge className={`rounded-full px-3 py-1.5 ${
                    theme === 'dark'
                      ? 'border-blue-500/30 bg-blue-500/20 text-blue-200'
                      : 'border-blue-200 bg-blue-50 text-blue-700'
                  }`}>
                    {getSeasonIcon(product.season)}
                    <span className="ml-1.5">{getSeasonLabel(product.season)} {productText('tire')}</span>
                  </Badge>
                ) : (
                  <Badge className={`rounded-full px-3 py-1.5 ${
                    theme === 'dark'
                      ? 'border-white/10 bg-white/10 text-gray-200'
                      : 'border-[#E2E8F0] bg-white text-[#334155]'
                  }`}>
                    <Settings className="mr-1.5 size-4" />
                    {product.material ? getMaterialLabel(product.material) : productText('wheel')}
                  </Badge>
                )}

                {productFeatureBadges.map((badge) => (
                  <Badge
                    key={badge}
                    className={`rounded-full px-3 py-1.5 ${
                      theme === 'dark'
                        ? 'border-white/10 bg-white/5 text-gray-200'
                        : 'border-[#E2E8F0] bg-white text-[#334155]'
                    }`}
                  >
                    {badge}
                  </Badge>
                ))}
              </div>

              {shortDescription && (
                <p className={`mt-5 text-base leading-7 ${theme === 'dark' ? 'text-gray-300' : 'text-[#475569]'}`}>
                  {shortDescription}
                </p>
              )}

              <Separator className={`my-6 ${theme === 'dark' ? 'bg-white/10' : 'bg-[#E2E8F0]'}`} />

              <div className="space-y-4">
                <div className="flex items-end gap-3">
                  <span className="text-4xl text-[#FF6B00]">€{displayUnitPrice.toFixed(2)}</span>
                  <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}`}>/ {productText('perPcs')}</span>
                </div>

                <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-[#64748B]'}`}>
                  {productText('vatIncluded')}
                </p>

                {hasTierDiscount && (
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-[#64748B]'}`}>
                    {productText('basePrice')}: €{(price * VAT_MULTIPLIER).toFixed(2)} / {productText('perPcs')}
                  </p>
                )}

                {quantity > 1 && (
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}`}>
                    {productText('total')}: <span className={theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}>€{totalPrice.toFixed(2)}</span>
                  </p>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className={`rounded-2xl p-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-[#F8FAFC]'}`}>
                    <p className={`text-xs uppercase tracking-[0.16em] ${theme === 'dark' ? 'text-gray-500' : 'text-[#94A3B8]'}`}>
                      {productText('stockStatus')}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Check className={`size-4 ${product.in_stock ? 'text-green-500' : 'text-red-500'}`} />
                      <span className={`text-sm ${product.in_stock ? 'text-green-600' : 'text-red-600'}`}>
                        {product.in_stock ? productText('inStock') : productText('outOfStock')}
                        {product.in_stock && product.stock_quantity ? ` (${product.stock_quantity} ${productText('perPcs')})` : ''}
                      </span>
                    </div>
                  </div>
                  <div className={`rounded-2xl p-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-[#F8FAFC]'}`}>
                    <p className={`text-xs uppercase tracking-[0.16em] ${theme === 'dark' ? 'text-gray-500' : 'text-[#94A3B8]'}`}>
                      {productText('deliveryTime')}
                    </p>
                    <div className="mt-2 flex items-start gap-2">
                      <Truck className={`mt-0.5 size-4 ${theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}`} />
                      <div>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-[#0F172A]'}`}>
                          {product.delivery_days || productText('delivery')}
                        </p>
                        <p className={`mt-0.5 text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-[#64748B]'}`}>
                          {productText('fulfilledBy')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-[#0F172A]'}`}>{productText('quantity')}</label>
                  <div className={`flex items-center gap-3 rounded-full px-3 py-2 ${
                    theme === 'dark' ? 'border border-white/10 bg-white/5' : 'border border-[#E2E8F0] bg-[#F1F5F9]'
                  }`}>
                    <button
                      onClick={() => setQuantity((prev) => clampQuantity(prev - 1))}
                      disabled={quantity <= 1}
                      className={`rounded-full px-2 py-1 ${quantity <= 1 ? 'opacity-30' : ''}`}
                    >
                      −
                    </button>
                    <span className={`min-w-[2ch] text-center ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>{quantity}</span>
                    <button
                      onClick={() => setQuantity((prev) => clampQuantity(prev + 1))}
                      disabled={quantity >= maxQuantity}
                      className={`rounded-full px-2 py-1 ${quantity >= maxQuantity ? 'opacity-30' : ''}`}
                    >
                      +
                    </button>
                  </div>
                </div>

                <Button
                  onClick={() => onAddToCart?.(product, quantity)}
                  disabled={!product.in_stock}
                  className="h-12 w-full bg-[#FF6B00] text-white hover:bg-[#FF6B00]/90 disabled:opacity-50"
                >
                  <Package className="mr-2 size-5" />
                  {product.in_stock ? productText('addToCart') : productText('soldOut')}
                </Button>

                <div className="flex flex-wrap gap-2">
                  {['Paytrail', 'Visa', 'Mastercard'].map((item) => (
                    <span
                      key={item}
                      className={`rounded-full px-3 py-1 text-xs ${
                        theme === 'dark' ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {overviewCards
                .filter((card) => card.value && String(card.value).trim().length > 0)
                .map((card) => (
                  <DetailCard
                    key={`${card.label}-${card.value}`}
                    theme={theme}
                    label={card.label}
                    value={card.value}
                    accent={Boolean(card.accent)}
                  />
                ))}
            </div>
          </div>
        </div>

        <div className="mt-12 space-y-12">
          {product.type === 'tire' && product.tyre_label_section && (
            <TyreLabelIdentitySection product={product} productText={productText} theme={theme} />
          )}

          <section className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div>
              <h2 className={`text-2xl ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>{productText('description')}</h2>
              <div className="mt-6 max-w-3xl">
                {detailDescription ? (
                  <div className="space-y-4">
                    {detailDescription
                      .split(/\n{2,}/)
                      .map((paragraph) => paragraph.trim())
                      .filter(Boolean)
                      .map((paragraph, index) => (
                        <p key={index} className={`text-base leading-7 ${theme === 'dark' ? 'text-gray-300' : 'text-[#475569]'}`}>
                          {paragraph}
                        </p>
                      ))}
                  </div>
                ) : (
                  <p className={`text-base leading-7 ${theme === 'dark' ? 'text-gray-300' : 'text-[#475569]'}`}>{productText('noDescription')}</p>
                )}

                {productFeatureBadges.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {productFeatureBadges.map((badge) => (
                      <Badge
                        key={`description-${badge}`}
                        className={`rounded-full px-3 py-1.5 ${
                          theme === 'dark'
                            ? 'border-white/10 bg-white/5 text-gray-200'
                            : 'border-[#E2E8F0] bg-white text-[#334155]'
                        }`}
                      >
                        {badge}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className={`text-2xl ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>{productText('technicalData')}</h2>
              <div className="mt-6">
                <SpecList theme={theme} rows={technicalRows} />
              </div>
            </div>
          </section>

          {product.type === 'rim' && (
            <section>
              <h2 className={`text-2xl ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>{productText('fitment')}</h2>
              <div className={`mt-6 rounded-3xl border p-6 ${
                theme === 'dark' ? 'border-white/10 bg-[#1C1C1E]' : 'border-[#E2E8F0] bg-[#F8FAFC]'
              }`}>
                <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                  <div>
                    <p className={`text-sm uppercase tracking-[0.18em] ${theme === 'dark' ? 'text-gray-500' : 'text-[#94A3B8]'}`}>
                      {productText('compatibleVehicles')}
                    </p>
                    <p className={`mt-3 text-sm leading-6 ${theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}`}>
                      {productText('compatibilityDisclaimer')}
                    </p>
                  </div>
                  <CompatibilityList theme={theme} emptyText={productText('noCompatibility')} vehicles={compatibilityVehicles} />
                </div>
              </div>
            </section>
          )}

          {hasReviewData && (
            <section>
              <h2 className={`text-2xl ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>{productText('customerFeedback')}</h2>
              <div className={`mt-6 rounded-3xl border p-6 sm:p-8 ${
                theme === 'dark' ? 'border-white/10 bg-[#1C1C1E]' : 'border-[#E2E8F0] bg-[#FFF7F2]'
              }`}>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="text-center md:text-left">
                    <p className={`text-xs uppercase tracking-[0.18em] ${theme === 'dark' ? 'text-gray-500' : 'text-[#94A3B8]'}`}>
                      {productText('averageRating')}
                    </p>
                    <p className={`mt-3 text-6xl ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>
                      {product.rating?.toFixed(1)}
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-1 md:justify-start">
                      {[...Array(5)].map((_, index) => (
                        <Star
                          key={index}
                          className={`size-5 ${
                            index < Math.floor(product.rating || 0)
                              ? 'fill-[#FF6B00] text-[#FF6B00]'
                              : theme === 'dark'
                              ? 'text-gray-600'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-center md:text-left">
                    <p className={`text-xs uppercase tracking-[0.18em] ${theme === 'dark' ? 'text-gray-500' : 'text-[#94A3B8]'}`}>
                      {productText('reviewsTitle')}
                    </p>
                    <p className={`mt-3 text-4xl ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>{product.review_count}</p>
                    <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}`}>
                      {product.review_count} {productText('reviews')}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section>
            <h2 className={`text-2xl ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>{productText('servicePromise')}</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {trustItems.map((item) => (
                <div
                  key={item.title}
                  className={`rounded-3xl border p-6 ${
                    theme === 'dark' ? 'border-white/10 bg-[#1C1C1E]' : 'border-[#E2E8F0] bg-[#F8FAFC]'
                  }`}
                >
                  <div className={`inline-flex rounded-full p-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-white'}`}>{item.icon}</div>
                  <h3 className={`mt-5 text-lg ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>{item.title}</h3>
                  <p className={`mt-2 text-sm leading-6 ${theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}`}>{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          {relatedProducts.length > 0 && (
            <section className="pb-16">
              <h2 className={`text-2xl ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>{productText('youMayLike')}</h2>
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {relatedProducts.slice(0, 4).map((relatedProduct, index) => (
                  <div key={relatedProduct.id}>
                    {relatedProduct.type === 'tire' ? (
                      <TireCard product={relatedProduct as any} index={index} />
                    ) : (
                      <RimCard product={relatedProduct as any} index={index} />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showMobileCTA && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className={`fixed bottom-0 left-0 right-0 z-40 border-t lg:hidden ${
              theme === 'dark'
                ? 'border-white/10 bg-[#1C1C1E]/95 backdrop-blur-md'
                : 'border-[#E2E8F0] bg-white/95 backdrop-blur-md'
            }`}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <div>
                <p className="text-2xl text-[#FF6B00]">€{displayUnitPrice.toFixed(2)}</p>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'}`}>/ {productText('perPcs')}</p>
              </div>
              <Button
                onClick={() => onAddToCart?.(product, quantity)}
                disabled={!product.in_stock}
                className="h-11 bg-[#FF6B00] px-6 text-white hover:bg-[#FF6B00]/90"
              >
                {product.in_stock ? productText('addToCart') : productText('soldOut')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isImagePreviewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
            onClick={() => setIsImagePreviewOpen(false)}
          >
            <button
              onClick={() => setIsImagePreviewOpen(false)}
              className="absolute right-4 top-4 z-10 rounded-full border border-white/20 bg-white/10 p-3 text-white backdrop-blur-md hover:bg-white/20"
              aria-label={productText('close')}
            >
              <X className="size-5" />
            </button>

            <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-md">
              {previewImageIndex + 1} / {images.length}
            </div>

            <div className="relative flex h-full w-full items-center justify-center p-4 pb-24 sm:p-8" onClick={(event) => event.stopPropagation()}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={previewImageIndex}
                  src={images[previewImageIndex]}
                  alt={`${product.brand} ${displayName || product.model} - Image ${previewImageIndex + 1}`}
                  className="max-h-full max-w-full object-contain"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                />
              </AnimatePresence>

              {images.length > 1 && (
                <>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setPreviewImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 p-3 text-white backdrop-blur-md hover:bg-white/20 sm:left-8"
                  >
                    <ChevronLeft className="size-7" />
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setPreviewImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 p-3 text-white backdrop-blur-md hover:bg-white/20 sm:right-8"
                  >
                    <ChevronRight className="size-7" />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 gap-2 overflow-x-auto rounded-full border border-white/20 bg-white/10 px-3 py-3 backdrop-blur-md">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setPreviewImageIndex(index);
                    }}
                    className={`h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl ${
                      index === previewImageIndex ? 'ring-2 ring-[#FF6B00] ring-offset-2 ring-offset-black/50' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={image} alt={`Thumbnail ${index + 1}`} className="h-full w-full object-cover" />
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
