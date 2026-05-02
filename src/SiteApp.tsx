import React, { Suspense, lazy, startTransition, useState, useEffect, useCallback, useRef } from 'react';
import { LanguageProvider, useLanguage } from './components/LanguageContext';
import { ThemeProvider } from './components/ThemeContext';
import { CartProvider, useCart } from './components/CartContext';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutPage } from './components/CheckoutPage';
import { CheckoutSuccessPage } from './components/CheckoutSuccessPage';
import { CheckoutCancelPage } from './components/CheckoutCancelPage';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ContactSection } from './components/ContactSection';
import { AuthModal } from './components/AuthModal';
import { EmergencyTowModal } from './components/EmergencyTowModal';
import { BookingModal } from './components/BookingModal';
import { ServicesPage } from './components/ServicesPage';
import { TireHotelPage } from './components/TireHotelPage';
import { AboutPage } from './components/AboutPage';
import { LegalPage } from './components/LegalPage';
import { CatalogPage } from './components/catalog/CatalogPage';
import { ProductDetailPage, type Product as ProductDetail, type TireProduct as DetailTireProduct } from './components/catalog/ProductDetailPage';
import { mapProductSearchRow, type CatalogProduct } from './components/catalog/CatalogPage';
import { CmsGuard } from './components/cms/CmsGuard';
// NEW PAGES
import { ContactPage } from './components/ContactPage';
import { FAQPage } from './components/FAQPage';
import { HelsinkiPage } from './components/HelsinkiPage';
import { CarServicePage } from './components/CarServicePage';
import { TireChangePage } from './components/TireChangePage';
import { DiagnosticsPage } from './components/DiagnosticsPage';
import { CarWashPage } from './components/CarWashPage';
import { CustomerBookingManagePage } from './components/CustomerBookingManagePage';
import { NotFoundPage } from './components/NotFoundPage';
import { CmsPwaScreen } from './CmsPwaApp';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { supabase } from './utils/supabase/client';
import { fetchProductSearchRowByIdentifier } from './utils/productsSearch';
import { buildTyreLabelSectionData } from './utils/tyreLabel';
import { 
  Wrench, 
  Scale, 
  Warehouse, 
  ClipboardCheck,
  Shield,
  Calendar,
  Star,
  CheckCircle2,
  ArrowRight,
  Award,
  Clock,
  Zap,
  Navigation,
  Users
} from 'lucide-react';
import waitingArea from 'figma:asset/7f3da97624c68ef159f5a1406820901e8a63dd7e.png';
import exterior from 'figma:asset/7e74af861ad46b8cd1808354fba42e25bb94d0bc.png';
import workshop from 'figma:asset/d4d52a152eeb5a4243fd5af9c734372c01fc3fc6.png';

// Hero carousel images
const heroImages = [
  {
    src: waitingArea,
    alt: "Mitra Auto Waiting Area Interior"
  },
  {
    src: exterior,
    alt: "Mitra Auto Building Exterior"
  },
  {
    src: workshop,
    alt: "Mitra Auto Workshop Garage"
  }
];

const AdminSchedulePage = lazy(() =>
  import('./components/admin/AdminSchedulePage').then((module) => ({ default: module.AdminSchedulePage }))
);
const RescueCMSPage = lazy(() =>
  import('./components/cms/RescueCMSPage').then((module) => ({ default: module.RescueCMSPage }))
);
const TiresCMSPage = lazy(() =>
  import('./components/cms/TiresCMSPage').then((module) => ({ default: module.TiresCMSPage }))
);
const TiresConflictResolvePage = lazy(() =>
  import('./components/cms/TiresConflictResolvePage').then((module) => ({ default: module.TiresConflictResolvePage }))
);
const RimsCMSPage = lazy(() =>
  import('./components/cms/RimsCMSPageV2').then((module) => ({ default: module.RimsCMSPageV2 }))
);
const OrdersCMSPage = lazy(() =>
  import('./components/cms/OrdersCMSPage').then((module) => ({ default: module.OrdersCMSPage }))
);
const InvoicesCMSPage = lazy(() =>
  import('./components/cms/InvoicesCMSPage').then((module) => ({ default: module.InvoicesCMSPage }))
);

type ParsedTireSize = {
  width?: number;
  aspect?: number;
  construction?: string;
  diameter?: number;
  loadIndex?: number;
  speedRating?: string;
};

type CmsTab = 'rescue' | 'schedule' | 'catalog-tires' | 'catalog-rims' | 'orders' | 'invoices' | 'future';
const BOOKING_STATUS_HANDOFF = 'handoff';

function resolveCmsTabFromHash(hash?: string): CmsTab {
  const normalized = (hash ?? '').replace('#', '').toLowerCase();

  if (normalized === 'rescue') {
    return 'rescue';
  }

  if (normalized === 'catalog-tires') {
    return 'catalog-tires';
  }

  if (normalized === 'catalog-rims') {
    return 'catalog-rims';
  }

  if (normalized === 'orders') {
    return 'orders';
  }

  if (normalized === 'invoices') {
    return 'invoices';
  }

  if (normalized === 'future') {
    return 'future';
  }

  return 'rescue';
}

function normalizeAppPath(path: string): string {
  if (!path) {
    return '/';
  }

  if (path.length > 1 && path.endsWith('/')) {
    return path.replace(/\/+$/, '') || '/';
  }

  return path;
}

function parseCatalogDetailPath(path: string): { productType: 'tire' | 'rim'; identifier: string } | null {
  const normalizedPath = normalizeAppPath(path);
  const match = normalizedPath.match(/^\/catalog\/(tire|rim)\/([^/]+)$/);
  if (!match) return null;
  return {
    productType: match[1] as 'tire' | 'rim',
    identifier: decodeURIComponent(match[2]),
  };
}

function CmsRouteFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6B35]" />
        <p className="text-sm text-muted-foreground">Loading CMS…</p>
      </div>
    </div>
  );
}

function CmsBetaHandoffControl() {
  const [handoffCount, setHandoffCount] = useState(0);
  const [forceClearCount, setForceClearCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadCounts = useCallback(async () => {
    const [{ count: handoff }, forceClearQuery] = await Promise.all([
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('status', BOOKING_STATUS_HANDOFF),
      supabase
        .from('bookings')
        .select('id, status')
        .neq('status', 'cancelled'),
    ]);

    setHandoffCount(handoff ?? 0);
    setForceClearCount(
      (forceClearQuery.data ?? []).filter((booking) => (booking.status || 'confirmed').toLowerCase() !== 'confirmed').length,
    );
  }, []);

  useEffect(() => {
    void loadCounts();
    const intervalId = window.setInterval(() => {
      void loadCounts();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [loadCounts]);

  const handleFinishHandoff = async () => {
    if (loading || handoffCount === 0) return;
    setLoading(true);

    try {
      const { data, error: queryError } = await supabase
        .from('bookings')
        .select('id')
        .eq('status', BOOKING_STATUS_HANDOFF);

      if (queryError) {
        throw queryError;
      }

      const ids = (data ?? []).map((booking) => booking.id).filter(Boolean);
      if (ids.length === 0) {
        setHandoffCount(0);
        return;
      }

      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .in('id', ids);

      if (updateError) {
        throw updateError;
      }

      toast.success('Booking handoff cleared');
      await loadCounts();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to clear booking handoff');
    } finally {
      setLoading(false);
    }
  };

  const handleForceClearAll = async () => {
    if (loading || forceClearCount === 0) return;
    setLoading(true);

    try {
      const { data, error: queryError } = await supabase
        .from('bookings')
        .select('id, status')
        .neq('status', 'cancelled');

      if (queryError) {
        throw queryError;
      }

      const ids = (data ?? [])
        .filter((booking) => (booking.status || 'confirmed').toLowerCase() !== 'confirmed')
        .map((booking) => booking.id)
        .filter(Boolean);

      if (ids.length === 0) {
        setForceClearCount(0);
        return;
      }

      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .in('id', ids);

      if (updateError) {
        throw updateError;
      }

      toast.success('All booking statuses cleared to confirmed');
      await loadCounts();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to force clear booking statuses');
    } finally {
      setLoading(false);
    }
  };

  if (handoffCount > 0 || forceClearCount > 0) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {handoffCount > 0 ? (
          <button
            type="button"
            onClick={handleFinishHandoff}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:text-emerald-300"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            {loading ? 'Clearing handoff...' : `Clear handoff (${handoffCount})`}
          </button>
        ) : null}
        {forceClearCount > 0 ? (
          <button
            type="button"
            onClick={handleForceClearAll}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:text-amber-300"
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
            {loading ? 'Force clearing...' : `Force clear (${forceClearCount})`}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
      <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
      Switch tabs to access schedule and catalog tools
    </span>
  );
}

const VALID_TIRE_SEASONS = new Set<DetailTireProduct['season']>(['summer', 'winter', 'all_season']);

function parseTireSize(sizeText?: string): ParsedTireSize {
  if (!sizeText) {
    return {};
  }

  const normalized = sizeText.toUpperCase().trim();
  const pattern = /(?<width>\d{3})\s*\/\s*(?<aspect>\d{2})\s*(?<construction>Z?R)?\s*(?<diameter>\d{2})(?:\s*(?<load>\d{2,3})\s*(?<speed>[A-Z]))?/;
  const match = normalized.match(pattern);

  if (!match || !match.groups) {
    return {};
  }

  const { width, aspect, construction, diameter, load, speed } = match.groups as Record<string, string | undefined>;

  return {
    width: width ? Number.parseInt(width, 10) : undefined,
    aspect: aspect ? Number.parseInt(aspect, 10) : undefined,
    construction: construction ?? 'R',
    diameter: diameter ? Number.parseInt(diameter, 10) : undefined,
    loadIndex: load ? Number.parseInt(load, 10) : undefined,
    speedRating: speed ?? undefined,
  };
}

// Generate mock product images (1-7 images per product for demo)
function generateProductImages(productId: string, baseImageUrl: string, productType: 'tire' | 'rim'): string[] {
  // Use product ID to deterministically generate 1-7 images
  const hash = productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const imageCount = (hash % 7) + 1; // 1-7 images
  
  // Mock image URLs representing different angles/views
  // In production, these would come from the CMS/database
  const tireImageTemplates = [
    baseImageUrl, // Main/primary image
    'https://images.unsplash.com/photo-1625402302260-34722fef9a01?w=800&h=800&fit=crop', // Side view
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=800&fit=crop', // Tread pattern
    'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&h=800&fit=crop', // Detail shot
    'https://images.unsplash.com/photo-1581858868540-92c8e8b9f983?w=800&h=800&fit=crop', // Profile view
    'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&h=800&fit=crop', // Label/EU rating
    'https://images.unsplash.com/photo-1621939514649-280e2e4e85ca?w=800&h=800&fit=crop', // 3/4 angle
  ];
  
  const rimImageTemplates = [
    baseImageUrl, // Main/primary image
    'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&h=800&fit=crop', // Front view
    'https://images.unsplash.com/photo-1614162536357-5d6b3c2e6b4f?w=800&h=800&fit=crop', // Side profile
    'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&h=800&fit=crop', // Detail/spoke
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=800&fit=crop', // Angle view
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=800&fit=crop', // Close-up
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=800&fit=crop', // Mounted view
  ];
  
  const templates = productType === 'tire' ? tireImageTemplates : rimImageTemplates;
  return templates.slice(0, imageCount);
}

function mapCatalogProductToDetail(product: CatalogProduct, language: 'fi' | 'en' = 'en'): ProductDetail {
  const cmsImages =
    Array.isArray(product.gallery_images)
      ? product.gallery_images
          .map((value) => String(value ?? '').trim())
          .filter((value) => value.length > 0)
      : [];
  const detailImages =
    cmsImages.length > 0
      ? cmsImages
      : [product.best_image_url].filter((value): value is string => Boolean(String(value ?? '').trim()));

  if (product.product_type === 'tire') {
    const parsedSize = parseTireSize(product.size_text);
    const rawSeason = typeof product.season === 'string' ? product.season.toLowerCase() : undefined;
    const normalizedSeason: DetailTireProduct['season'] = rawSeason && VALID_TIRE_SEASONS.has(rawSeason as DetailTireProduct['season'])
      ? (rawSeason as DetailTireProduct['season'])
      : 'all_season';

    return {
      type: 'tire',
      id: product.id,
      brand: product.brand,
      model: product.model,
      title: product.title,
      subtitle: product.subtitle,
      tire_width: parsedSize.width ?? 0,
      aspect_ratio: parsedSize.aspect ?? 0,
      construction: parsedSize.construction ?? 'R',
      rim_diameter: parsedSize.diameter ?? 0,
      load_index: parsedSize.loadIndex,
      speed_rating: parsedSize.speedRating,
      season: normalizedSeason,
      extra_load: product.xl ?? undefined,
      runflat: product.runflat ?? undefined,
      studded: product.studded ?? undefined,
      fuel_efficiency: product.eu_fuel ? String(product.eu_fuel) : undefined,
      wet_grip: product.eu_wet ? String(product.eu_wet) : undefined,
      noise_level: typeof product.eu_noise === 'number' ? product.eu_noise : undefined,
      noise_class: undefined,
      ev_ready: rawSeason === 'all_season' ? true : undefined,
      three_pmsf: normalizedSeason === 'winter' ? true : undefined,
      tyre_label_section: buildTyreLabelSectionData({
        existing: product.tyre_label_section,
        brand: product.brand,
        supplierName: product.supplier_name,
        model: product.model,
        sizeString: product.size_text,
        loadIndex: parsedSize.loadIndex,
        speedRating: parsedSize.speedRating,
        season: normalizedSeason,
        runflat: product.runflat ?? undefined,
        xlReinforced: product.xl ?? undefined,
        evReady: rawSeason === 'all_season' ? true : undefined,
        studded: product.studded ?? undefined,
        threepmsf: normalizedSeason === 'winter' ? true : undefined,
        winterApproved: normalizedSeason === 'winter' || normalizedSeason === 'all_season',
        iceApproved: undefined,
        ean: product.ean,
        euFuelClass: product.eu_fuel ? String(product.eu_fuel) : undefined,
        euWetGripClass: product.eu_wet ? String(product.eu_wet) : undefined,
        euNoiseDb: typeof product.eu_noise === 'number' ? product.eu_noise : undefined,
      }),
      ean: product.ean,
      manufacture_year: product.manufacture_year,
      best_price_eur: product.best_price_eur,
      best_image_url: product.best_image_url,
      images: detailImages,
      short_description: product.short_description,
      long_description: product.long_description,
      description: product.long_description ?? product.short_description,
      in_stock: product.in_stock,
      stock_quantity: product.in_stock ? Math.max(0, product.stock_qty ?? 0) : 0,
      supplier_name: undefined,
      delivery_days: product.delivery_days ?? (product.in_stock ? (language === 'fi' ? '1-3 päivää' : '1-3 Days') : undefined),
      delivery_days_min: product.delivery_days_min,
      delivery_days_max: product.delivery_days_max,
      weight: undefined,
    };
  }

  return {
    type: 'rim',
    id: product.id,
    brand: product.brand,
    model: product.model,
    title: product.title,
    subtitle: product.subtitle,
    rim_width: product.rim_width,
    rim_diameter: product.rim_diameter,
    pcd: product.pcd,
    et_offset: product.et_offset,
    cb: product.cb,
    color: product.color,
    material: product.material,
    finish: undefined,
    weight: undefined,
    best_price_eur: product.best_price_eur,
    best_image_url: product.best_image_url,
    images: detailImages,
    short_description: product.short_description,
    long_description: product.long_description,
    description: product.long_description ?? product.short_description,
      in_stock: product.in_stock,
      stock_quantity: product.in_stock ? 4 : 0,
      supplier_name: undefined,
      delivery_days: product.delivery_days ?? (product.in_stock ? (language === 'fi' ? '2-5 päivää' : '2-5 Days') : undefined),
      delivery_days_min: product.delivery_days_min,
      delivery_days_max: product.delivery_days_max,
      compatible_vehicles: [],
  };
}

function HomePage() {
  const { t, language } = useLanguage();
  const { addToCart, totalItems, setIsCartOpen } = useCart();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [preSelectedService, setPreSelectedService] = useState<string>('');
  const [bookingPrefill, setBookingPrefill] = useState<{
    installToken?: string;
    earliestDate?: string;
    contact?: { name?: string; phone?: string; email?: string };
  } | null>(null);
  const [currentPage, setCurrentPage] = useState<'home' | 'services' | 'tire-hotel' | 'catalog' | 'about' | 'legal' | 'product-detail' | 'checkout' | 'checkout-success' | 'checkout-cancel' | 'admin-schedule' | 'cms-beta' | 'cms-rescue' | 'cms-tires' | 'cms-tire-conflicts' | 'cms-rims' | 'cms-orders' | 'cms-invoices' | 'catalog-detail' | 'privacy' | 'terms' | 'contact' | 'faq' | 'helsinki' | 'car-service' | 'tire-change' | 'diagnostics' | 'car-wash' | 'booking-manage' | 'pwa-cms' | 'pwa-not-found' | 'not-found'>('home');
  const [cmsTab, setCmsTab] = useState<CmsTab>('rescue');
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const requestedProtectedPathRef = useRef<string | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false
  );

  // Check auth state on mount
  useEffect(() => {
    let subscription: any = null;
    
    const checkAuth = async () => {
      const { getSupabaseClient } = await import('./utils/supabase/client');
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }

      // Listen for auth state changes
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (session?.user) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      });

      subscription = authListener.subscription;
    };
    
    checkAuth();

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const shouldOpenBooking = params.get('booking') === '1';
    const installToken = params.get('install_token');
    const invoicePaymentStatus = params.get('invoice_payment');
    const invoiceNumber = params.get('invoice');

    if (invoicePaymentStatus) {
      const invoiceSuffix = invoiceNumber ? ` ${invoiceNumber}` : '';
      if (invoicePaymentStatus === 'paid') {
        toast.success(language === 'fi' ? `Maksu vastaanotettu.${invoiceSuffix}` : `Payment received.${invoiceSuffix}`);
      } else if (invoicePaymentStatus === 'already_paid') {
        toast.info(language === 'fi' ? `Lasku on jo maksettu.${invoiceSuffix}` : `Invoice already paid.${invoiceSuffix}`);
      } else if (invoicePaymentStatus === 'failed') {
        toast.error(language === 'fi' ? `Maksu ei valmistunut.${invoiceSuffix}` : `Payment was not completed.${invoiceSuffix}`);
      } else {
        toast.info(language === 'fi' ? `Maksua vahvistetaan.${invoiceSuffix}` : `Payment is being confirmed.${invoiceSuffix}`);
      }

      params.delete('invoice_payment');
      params.delete('invoice');
      const nextSearch = params.toString();
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`);
    }

    if (installToken) {
      let cancelled = false;
      supabase.functions.invoke('order_install_booking', {
        method: 'POST',
        body: {
          action: 'context',
          token: installToken,
        },
      }).then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          toast.error(language === 'fi' ? 'Asennusvarauksen linkki ei ole voimassa.' : 'The install booking link is not valid.');
          return;
        }
        setPreSelectedService(data?.serviceId || 'tire-change-car');
        setBookingPrefill({
          installToken,
          earliestDate: data?.recommendedDate,
          contact: data?.customer,
        });
        setBookingModalOpen(true);
      });
      return () => {
        cancelled = true;
      };
    }

    if (shouldOpenBooking) {
      setBookingPrefill(null);
      setPreSelectedService('');
      setBookingModalOpen(true);
    }
  }, [language]);



  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const applyMatch = (event?: MediaQueryListEvent) => {
      setIsMobileViewport(event ? event.matches : mediaQuery.matches);
    };

    applyMatch();
    mediaQuery.addEventListener('change', applyMatch);

    return () => {
      mediaQuery.removeEventListener('change', applyMatch);
    };
  }, []);

  // Hero carousel timer - desktop only
  useEffect(() => {
    if (isMobileViewport) {
      return undefined;
    }

    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 30000); // 30 seconds

    return () => clearInterval(timer);
  }, [isMobileViewport]);

  const transitionNavigationState = useCallback(
    (
      page: typeof currentPage,
      product: ProductDetail | null = null,
      nextCmsTab?: CmsTab,
    ) => {
      startTransition(() => {
        setCurrentPage(page);
        setSelectedProduct(product);
        if (nextCmsTab !== undefined) {
          setCmsTab(nextCmsTab);
        }
      });
    },
    [setCurrentPage, setSelectedProduct, setCmsTab]
  );
  
  const updatePageFromPath = useCallback(
    (path: string, state?: { selectedProduct?: ProductDetail | null }) => {
      const normalizedPath = normalizeAppPath(path);
      const nextCmsTab =
        normalizedPath === '/cms' || normalizedPath === '/cms/rescue'
          ? resolveCmsTabFromHash(typeof window !== 'undefined' ? window.location.hash : undefined)
          : undefined;

      if (normalizedPath === '/') {
        transitionNavigationState('home');
      }

      // Legacy routes (keep working)
      else if (normalizedPath === '/services') {
        transitionNavigationState('services');
      } else if (normalizedPath === '/tire-hotel') {
        transitionNavigationState('tire-hotel');
      } else if (normalizedPath === '/about') {
        transitionNavigationState('about');
      } 
      
      // NEW FINNISH CANONICAL ROUTES
      else if (normalizedPath === '/yhteystiedot') {
        transitionNavigationState('contact');
      } else if (normalizedPath === '/ukk') {
        transitionNavigationState('faq');
      } else if (normalizedPath === '/helsinki') {
        transitionNavigationState('helsinki');
      } else if (normalizedPath === '/palvelut') {
        transitionNavigationState('services');
      } else if (normalizedPath === '/palvelut/autohuolto' || normalizedPath === '/helsinki/autohuolto') {
        transitionNavigationState('car-service');
      } else if (normalizedPath === '/palvelut/renkaanvaihto' || normalizedPath === '/helsinki/renkaanvaihto') {
        transitionNavigationState('tire-change');
      } else if (normalizedPath === '/palvelut/rengashotelli' || normalizedPath === '/helsinki/rengashotelli') {
        transitionNavigationState('tire-hotel');
      } else if (normalizedPath === '/palvelut/vikadiagnostiikka') {
        transitionNavigationState('diagnostics');
      } else if (normalizedPath === '/palvelut/autopesu') {
        transitionNavigationState('car-wash');
      } else if (normalizedPath === '/meista') {
        transitionNavigationState('about');
      }
      
      // NEW ENGLISH MIRROR ROUTES
      else if (normalizedPath === '/en') {
        transitionNavigationState('home');
      } else if (normalizedPath === '/en/contact') {
        transitionNavigationState('contact');
      } else if (normalizedPath === '/en/faq') {
        transitionNavigationState('faq');
      } else if (normalizedPath === '/en/helsinki') {
        transitionNavigationState('helsinki');
      } else if (normalizedPath === '/en/services') {
        transitionNavigationState('services');
      } else if (normalizedPath === '/en/services/car-service' || normalizedPath === '/en/helsinki/car-service') {
        transitionNavigationState('car-service');
      } else if (normalizedPath === '/en/services/tire-change' || normalizedPath === '/en/helsinki/tire-change') {
        transitionNavigationState('tire-change');
      } else if (normalizedPath === '/en/services/tire-hotel' || normalizedPath === '/en/helsinki/tire-hotel') {
        transitionNavigationState('tire-hotel');
      } else if (normalizedPath === '/en/services/diagnostics') {
        transitionNavigationState('diagnostics');
      } else if (normalizedPath === '/en/services/car-wash') {
        transitionNavigationState('car-wash');
      } else if (normalizedPath === '/en/about') {
        transitionNavigationState('about');
      } else if (normalizedPath === '/booking/manage' || normalizedPath === '/en/booking/manage') {
        transitionNavigationState('booking-manage');
      }
      
      // Admin/CMS/Protected routes
      else if (normalizedPath === '/admin/schedule') {
        transitionNavigationState('admin-schedule');
      } else if (
        normalizedPath === '/pwa/cms' ||
        normalizedPath === '/pwa/cms/rescue' ||
        normalizedPath === '/pwa/cms/booking' ||
        normalizedPath === '/pwa/cms/order' ||
        normalizedPath === '/pwa/cms/tools'
      ) {
        transitionNavigationState('pwa-cms');
      } else if (normalizedPath === '/pwa' || normalizedPath.startsWith('/pwa/')) {
        transitionNavigationState('pwa-not-found');
      } else if (normalizedPath === '/cms' || normalizedPath === '/cms/rescue') {
        transitionNavigationState('cms-beta', null, nextCmsTab);
      } else if (normalizedPath === '/cms/rescue-board') {
        transitionNavigationState('cms-rescue');
      } else if (normalizedPath === '/cms/tires' || normalizedPath === '/cms-tires') {
        transitionNavigationState('cms-tires');
      } else if (normalizedPath === '/cms/tires/conflicts') {
        transitionNavigationState('cms-tire-conflicts');
      } else if (
        normalizedPath === '/cms/orders' ||
        normalizedPath === '/cms-orders'
      ) {
        transitionNavigationState('cms-orders');
      } else if (
        normalizedPath === '/cms/invoices' ||
        normalizedPath === '/cms-invoices'
      ) {
        transitionNavigationState('cms-invoices');
      } 
      
      // Legal routes
      else if (normalizedPath === '/privacy' || normalizedPath === '/legal/privacy') {
        transitionNavigationState('privacy');
      } else if (normalizedPath === '/terms' || normalizedPath === '/legal/terms') {
        transitionNavigationState('terms');
      } else if (normalizedPath === '/legal') {
        transitionNavigationState('legal');
      } 
      
      // Catalog routes
      else if (normalizedPath === '/catalog' || normalizedPath === '/shop') {
        transitionNavigationState('catalog');
      } else if (normalizedPath.startsWith('/catalog/')) {
        transitionNavigationState('catalog-detail', state?.selectedProduct ?? null);
      } 
      
      // Checkout routes
      else if (normalizedPath === '/checkout/success') {
        transitionNavigationState('checkout-success');
      } else if (normalizedPath === '/checkout/cancel') {
        transitionNavigationState('checkout-cancel');
      } else if (normalizedPath === '/checkout') {
        transitionNavigationState('checkout');
      } 
      
      // Default: explicit 404
      else {
        transitionNavigationState('not-found');
      }
    },
    [transitionNavigationState]
  );

  const navigate = useCallback(
    (path: string, options?: { state?: { selectedProduct?: ProductDetail | null }; skipScroll?: boolean }) => {
      const historyState = options?.state ?? {};

      if (window.location.pathname !== path) {
        window.history.pushState(historyState, '', path);
      } else if (options?.state) {
        window.history.replaceState(historyState, '', path);
      }
      
      updatePageFromPath(path, historyState);
      // Scroll to top when navigating to new page (unless skipScroll is true)
      if (!options?.skipScroll) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [updatePageFromPath]
  );

  const handleProductSelect = useCallback(
    (product: CatalogProduct) => {
      const detail = mapCatalogProductToDetail(product, language);
      startTransition(() => {
        setSelectedProduct(detail);
      });
      const detailIdentifier =
        product.product_type === 'tire' && product.seo_slug
          ? product.seo_slug
          : product.id;
      const detailPath = `/catalog/${product.product_type}/${detailIdentifier}`;
      navigate(detailPath, { state: { selectedProduct: detail } });
    },
    [language, navigate, setSelectedProduct]
  );

  const handleInternalNavigation = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, path: string) => {
      event.preventDefault();
      navigate(path);
    },
    [navigate]
  );
  // Simple client-side routing
  useEffect(() => {
    let active = true;

    const loadCatalogDetailFromUrl = async () => {
      if (currentPage !== 'catalog-detail' || selectedProduct) return;

      const parsed = parseCatalogDetailPath(window.location.pathname);
      if (!parsed) return;

      try {
        const row = await fetchProductSearchRowByIdentifier(parsed.productType, parsed.identifier);
        if (!active || !row) return;
        const catalogProduct = mapProductSearchRow(row, parsed.productType, language);
        const detail = mapCatalogProductToDetail(catalogProduct, language);
        startTransition(() => {
          setSelectedProduct(detail);
        });
      } catch (error) {
        console.error('Failed to load catalog detail from URL:', error);
      }
    };

    void loadCatalogDetailFromUrl();

    return () => {
      active = false;
    };
  }, [currentPage, language, selectedProduct]);

  useEffect(() => {
    const handleNavigation = (event?: PopStateEvent) => {
      const path = window.location.pathname;
      const state = (event?.state as { selectedProduct?: ProductDetail | null }) ?? window.history.state;
      updatePageFromPath(path, state);
    };

    const handleHashChange = () => {
      const normalizedPath = normalizeAppPath(window.location.pathname);
      if (normalizedPath === '/cms') {
        startTransition(() => {
          setCmsTab(resolveCmsTabFromHash(window.location.hash));
        });
      }
    };

    handleNavigation();
    const listener = (event: PopStateEvent) => handleNavigation(event);
    window.addEventListener('popstate', listener);
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('popstate', listener);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [updatePageFromPath]);
  
  // Debug emergency modal state
  React.useEffect(() => {
    console.log('📱 Emergency Modal State Changed:', emergencyModalOpen);
  }, [emergencyModalOpen]);

  const handleLogin = () => {
    setAuthView('login');
    setAuthModalOpen(true);
  };

  const handleCmsTabChange = (tab: CmsTab) => {
    startTransition(() => {
      setCmsTab(tab);
    });

    if (typeof window !== 'undefined') {
      const normalizedPath = normalizeAppPath(window.location.pathname);
      if (normalizedPath === '/cms') {
        window.history.replaceState(window.history.state, '', `${normalizedPath}#${tab}`);
      }
    }
  };

  const handleSignup = () => {
    setAuthView('signup');
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (isAdmin?: boolean) => {
    setIsLoggedIn(true);
    
    if (isAdmin) {
      const currentPath = normalizeAppPath(window.location.pathname);
      const targetPath = requestedProtectedPathRef.current ?? (
        currentPath === '/cms' ||
        currentPath === '/cms/orders' ||
        currentPath === '/cms-orders' ||
        currentPath === '/cms/invoices' ||
        currentPath === '/cms-invoices' ||
        currentPath === '/admin/schedule'
          ? currentPath
          : '/cms'
      );

      requestedProtectedPathRef.current = null;
      window.history.replaceState({}, '', targetPath);
      updatePageFromPath(targetPath);
    }
  };

  const handleLogout = async () => {
    console.log('Logout initiated...');
    
    try {
      // Logout from Supabase
      const supabase = await import('./utils/supabase/client').then(m => m.getSupabaseClient());
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      
      if (error) {
        console.error('Logout error:', error);
        try {
          await supabase.auth.signOut();
        } catch (fallbackError) {
          console.error('Fallback logout error:', fallbackError);
        }
      }
      
      console.log('Supabase signOut successful');
      
      // Force clear local state immediately
      setIsLoggedIn(false);
      
      // If on CMS/admin page, redirect to home
      const cmsPages = ['admin-schedule', 'cms-rescue', 'cms-tires', 'cms-tire-conflicts', 'cms-rims', 'cms-orders', 'cms-invoices', 'cms-beta'];
      if (cmsPages.includes(currentPage)) {
        startTransition(() => {
          setCurrentPage('home');
        });
        window.history.pushState({}, '', '/');
      }
      
      console.log('Logout complete');
    } catch (error) {
      console.error('Failed to logout:', error);
      // Even if there's an error, clear the local state
      setIsLoggedIn(false);
    }
  };

  const handleLoginNeeded = () => {
    const currentPath = normalizeAppPath(window.location.pathname);
    if (currentPath.startsWith('/cms') || currentPath.startsWith('/admin') || currentPath.startsWith('/pwa')) {
      requestedProtectedPathRef.current = currentPath;
    }
    setAuthView('login');
    setAuthModalOpen(true);
  };

  const services = [
    {
      icon: Wrench,
      titleKey: 'services.carMaintenance.title',
      descKey: 'services.carMaintenance.desc',
    },
    {
      icon: Scale,
      titleKey: 'services.balancing.title',
      descKey: 'services.balancing.desc',
    },
    {
      icon: Warehouse,
      titleKey: 'services.tireHotel.title',
      descKey: 'services.tireHotel.desc',
    },
    {
      icon: ClipboardCheck,
      titleKey: 'services.inspection.title',
      descKey: 'services.inspection.desc',
    },
  ];

  const trustBadges = [
    { icon: Award, key: 'hero.trust.expertise' },
    { icon: Wrench, key: 'hero.trust.quality' },
    { icon: Shield, key: 'hero.trust.reliability' },
    { icon: Zap, key: 'hero.trust.fast' },
  ];

  const reviews = [
    {
      name: 'Matti Virtanen',
      rating: 5,
      text: {
        fi: 'Erittäin nopea ja ammattitaitoinen palvelu. Suosittelen lämpimästi!',
        en: 'Very fast and professional service. Highly recommended!',
      },
    },
    {
      name: 'Anna Korhonen',
      rating: 5,
      text: {
        fi: 'Rengashotelli toimii loistavasti. Ei tarvitse vaivata kotona.',
        en: 'Tire hotel works perfectly. No need to store at home.',
      },
    },
    {
      name: 'Jukka Nieminen',
      rating: 5,
      text: {
        fi: 'Helppo varata verkossa ja hinnat kilpailukykyiset.',
        en: 'Easy to book online and competitive prices.',
      },
    },
  ];

  const tireHotelBenefits = [
    { key: 'tireHotel.benefit1' },
    { key: 'tireHotel.benefit2' },
    { key: 'tireHotel.benefit3' },
  ];

  const catalogProducts = [
    {
      id: '1c5b922e-4f47-75c7-8e64-ad59e6302d1c',
      name: 'Dynamo STREET-H MH01',
      size: '215/65 R17 99 T',
      seasonKey: 'season.summer',
      price: '€39.91',
      imageUrl:
        'https://rcmmbwdebnmicrweoiyz.supabase.co/storage/v1/object/public/product-images/supplier/tires/1c5b922e-4f47-75c7-8e64-ad59e6302d1c/rd-351011-38669f4755c525f2.jpg',
    },
    {
      id: 'd6ef67f9-41c5-a8ff-6623-450b18b61f44',
      name: 'Bridgestone Blizzak ICE',
      size: '235/45 R17',
      seasonKey: 'season.winter',
      price: '€104.52',
      imageUrl:
        'https://rcmmbwdebnmicrweoiyz.supabase.co/storage/v1/object/public/product-images/tires/d6ef67f9-41c5-a8ff-6623-450b18b61f44/1771926299971_mi10hv.jpeg',
    },
    {
      id: 'be549cfb-83d9-5712-1c68-ad63a33fd42f',
      name: 'Nankang Econex NA-1',
      size: '165/70 R12 77 T',
      seasonKey: 'season.summer',
      price: '€52.16',
      imageUrl:
        'https://rcmmbwdebnmicrweoiyz.supabase.co/storage/v1/object/public/product-images/supplier/tires/be549cfb-83d9-5712-1c68-ad63a33fd42f/vt-64287-d5f166b11a2586fc.jpg',
    },
    {
      id: 'ad10bc20-d995-ef6d-233c-e2cce8dc85b7',
      name: 'Continental WinterContact TS 870 P',
      size: '215/40 R18',
      seasonKey: 'season.winter',
      price: '€134.10',
      imageUrl:
        'https://rcmmbwdebnmicrweoiyz.supabase.co/storage/v1/object/public/product-images/tires/ad10bc20-d995-ef6d-233c-e2cce8dc85b7/1773231764553_cuqy58.jpg',
    },
  ];

  const bookingBenefits = [
    { key: 'booking.benefit1' },
    { key: 'booking.benefit2' },
    { key: 'booking.benefit3' },
  ];

  const cmsTabs = [
    { id: 'rescue' as const, label: 'Rescue 24/7', description: 'Manage emergency requests' },
    { id: 'schedule' as const, label: 'Booking Schedule', description: 'Manage appointments' },
    { id: 'catalog-tires' as const, label: 'Tire Catalog', description: 'Edit tire content' },
    { id: 'catalog-rims' as const, label: 'Rim Catalog', description: 'Edit rim content' },
    { id: 'orders' as const, label: 'Order & Invoice', description: 'Track purchases and invoice payments' },
    { id: 'invoices' as const, label: 'Receipt', description: 'Receipts and paid documents' },
    { id: 'future' as const, label: 'Future Tools', description: 'Coming soon' },
  ];

  const isPwaRoute = currentPage === 'pwa-cms' || currentPage === 'pwa-not-found';

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to main content */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only"
      >
        {t('ui.skipToContent')}
      </a>

      {!isPwaRoute ? (
        <Navbar
          isLoggedIn={isLoggedIn}
          onLoginClick={handleLogin}
          onSignupClick={handleSignup}
          onLogout={handleLogout}
          cartCount={totalItems}
          onNavigate={navigate}
          onCartClick={() => setIsCartOpen(true)}
        />
      ) : null}

      {!isPwaRoute ? (
        <CartDrawer
          onCheckout={() =>
            startTransition(() => {
              setCurrentPage('checkout');
            })
          }
        />
      ) : null}

      {!isPwaRoute ? (
        <AuthModal
          open={authModalOpen}
          onOpenChange={setAuthModalOpen}
          defaultView={authView}
          onSuccess={handleAuthSuccess}
        />
      ) : null}

      {!isPwaRoute ? (
        <EmergencyTowModal
          open={emergencyModalOpen}
          onOpenChange={setEmergencyModalOpen}
        />
      ) : null}

      {!isPwaRoute ? (
        <BookingModal
          open={bookingModalOpen}
          onOpenChange={setBookingModalOpen}
          preSelectedService={preSelectedService}
          prefill={bookingPrefill}
        />
      ) : null}

      {!isPwaRoute && !isMobileViewport ? (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute inset-0 w-full" style={{height: '400vh'}}>
            <div className="absolute top-[5%] right-[10%] w-[700px] h-[700px] bg-accent/10 rounded-full blur-3xl animate-blob" />
            <div className="absolute top-[8%] left-[5%] w-[600px] h-[600px] bg-ring/12 rounded-full blur-3xl animate-blob animation-delay-2000" />
            <div className="absolute top-[18%] left-[60%] w-[650px] h-[650px] bg-primary/8 rounded-full blur-3xl animate-blob animation-delay-4000" />
            <div className="absolute top-[25%] right-[70%] w-[550px] h-[550px] bg-accent/8 rounded-full blur-3xl animate-blob" />
            <div className="absolute top-[35%] right-[15%] w-[600px] h-[600px] bg-ring/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
            <div className="absolute top-[42%] left-[8%] w-[580px] h-[580px] bg-accent/7 rounded-full blur-3xl animate-blob animation-delay-4000" />
            <div className="absolute top-[52%] left-[40%] w-[620px] h-[620px] bg-primary/9 rounded-full blur-3xl animate-blob" />
            <div className="absolute top-[58%] right-[45%] w-[540px] h-[540px] bg-ring/9 rounded-full blur-3xl animate-blob animation-delay-2000" />
            <div className="absolute top-[68%] right-[20%] w-[640px] h-[640px] bg-accent/8 rounded-full blur-3xl animate-blob animation-delay-4000" />
            <div className="absolute top-[72%] left-[25%] w-[520px] h-[520px] bg-primary/7 rounded-full blur-3xl animate-blob" />
            <div className="absolute top-[82%] left-[15%] w-[600px] h-[600px] bg-ring/11 rounded-full blur-3xl animate-blob animation-delay-2000" />
            <div className="absolute top-[88%] right-[30%] w-[550px] h-[550px] bg-accent/9 rounded-full blur-3xl animate-blob animation-delay-4000" />
            <div className="absolute top-[92%] left-[50%] -translate-x-1/2 w-[500px] h-[500px] bg-primary/6 rounded-full blur-3xl animate-blob" />
            <div className="absolute top-[15%] right-[50%] w-[480px] h-[480px] bg-ring/6 rounded-full blur-3xl animate-blob animation-delay-2000" />
            <div className="absolute top-[48%] left-[70%] w-[520px] h-[520px] bg-accent/6 rounded-full blur-3xl animate-blob animation-delay-4000" />
            <div className="absolute top-[78%] right-[60%] w-[560px] h-[560px] bg-primary/5 rounded-full blur-3xl animate-blob" />
          </div>
        </div>
      ) : null}

      <main id="main-content">
        {currentPage === 'services' ? (
          <ServicesPage
            onBookingClick={(serviceId) => {
              setPreSelectedService(serviceId ?? '');
              setBookingModalOpen(true);
            }}
          />
        ) : currentPage === 'tire-hotel' ? (
          <TireHotelPage
            onBookingClick={(serviceId) => {
              setPreSelectedService(serviceId ?? '');
              setBookingModalOpen(true);
            }}
          />
        ) : currentPage === 'about' ? (
          <AboutPage
            onBookingClick={() => setBookingModalOpen(true)}
            onNavigate={navigate}
          />
        ) : currentPage === 'contact' ? (
          <ContactPage
            onBookingClick={() => setBookingModalOpen(true)}
          />
        ) : currentPage === 'faq' ? (
          <FAQPage
            onBookingClick={() => setBookingModalOpen(true)}
            onNavigate={navigate}
          />
        ) : currentPage === 'helsinki' ? (
          <HelsinkiPage
            onBookingClick={() => setBookingModalOpen(true)}
            onNavigate={navigate}
          />
        ) : currentPage === 'car-service' ? (
          <CarServicePage
            onBookingClick={() => setBookingModalOpen(true)}
          />
        ) : currentPage === 'tire-change' ? (
          <TireChangePage
            onBookingClick={() => setBookingModalOpen(true)}
          />
        ) : currentPage === 'diagnostics' ? (
          <DiagnosticsPage
            onBookingClick={() => setBookingModalOpen(true)}
          />
        ) : currentPage === 'car-wash' ? (
          <CarWashPage
            onBookingClick={() => setBookingModalOpen(true)}
          />
        ) : currentPage === 'booking-manage' ? (
          <CustomerBookingManagePage onNavigateHome={() => navigate('/')} />
        ) : currentPage === 'catalog' ? (
          <CatalogPage onProductSelect={handleProductSelect} />
        ) : currentPage === 'catalog-detail' ? (
          selectedProduct ? (
            <ProductDetailPage 
              product={selectedProduct}
              onAddToCart={(product, quantity) => {
                addToCart(product, quantity);
                toast.success(
                  language === 'fi' 
                    ? `${quantity} × ${product.brand} ${product.model} lisätty ostoskoriin`
                    : `${quantity} × ${product.brand} ${product.model} added to cart`
                );
              }}
            />
          ) : (
            <CatalogPage onProductSelect={handleProductSelect} />
          )
        ) : currentPage === 'checkout' ? (
          <CheckoutPage 
            onBack={() => setIsCartOpen(true)}
            onComplete={() => navigate('/checkout/success')}
          />
        ) : currentPage === 'checkout-success' ? (
          <CheckoutSuccessPage
            onNavigateHome={() => navigate('/')}
            onNavigateToOrders={() => navigate('/')}
          />
        ) : currentPage === 'checkout-cancel' ? (
          <CheckoutCancelPage
            onNavigateHome={() => navigate('/')}
            onNavigateToCheckout={() => navigate('/checkout')}
          />
        ) : currentPage === 'admin-schedule' ? (
          <CmsGuard onNeedLogin={handleLoginNeeded}>
            <Suspense fallback={<CmsRouteFallback />}>
              <AdminSchedulePage />
            </Suspense>
          </CmsGuard>
        ) : currentPage === 'cms-rescue' ? (
          <CmsGuard onNeedLogin={handleLoginNeeded}>
            <Suspense fallback={<CmsRouteFallback />}>
              <RescueCMSPage />
            </Suspense>
          </CmsGuard>
        ) : currentPage === 'cms-tires' ? (
          <CmsGuard onNeedLogin={handleLoginNeeded}>
            <Suspense fallback={<CmsRouteFallback />}>
              <TiresCMSPage />
            </Suspense>
          </CmsGuard>
        ) : currentPage === 'cms-tire-conflicts' ? (
          <CmsGuard onNeedLogin={handleLoginNeeded}>
            <Suspense fallback={<CmsRouteFallback />}>
              <TiresConflictResolvePage />
            </Suspense>
          </CmsGuard>
        ) : currentPage === 'cms-rims' ? (
          <CmsGuard onNeedLogin={handleLoginNeeded}>
            <Suspense fallback={<CmsRouteFallback />}>
              <RimsCMSPage />
            </Suspense>
          </CmsGuard>
        ) : currentPage === 'cms-orders' ? (
          <CmsGuard onNeedLogin={handleLoginNeeded}>
            <Suspense fallback={<CmsRouteFallback />}>
              <OrdersCMSPage />
            </Suspense>
          </CmsGuard>
        ) : currentPage === 'cms-invoices' ? (
          <CmsGuard onNeedLogin={handleLoginNeeded}>
            <Suspense fallback={<CmsRouteFallback />}>
              <InvoicesCMSPage documentScope="receipt" title="Receipt" />
            </Suspense>
          </CmsGuard>
        ) : currentPage === 'cms-beta' ? (
          <CmsGuard onNeedLogin={handleLoginNeeded}>
          <>
            <div className="bg-background">
              <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium uppercase tracking-[0.08em] text-muted-foreground">CMS Beta</p>
                      <h1 className="text-3xl font-semibold text-foreground">Control Center</h1>
                    </div>
                    <CmsBetaHandoffControl />
                  </div>
                  <p className="text-muted-foreground max-w-3xl">
                    Navigate between booking schedule management and product catalog overrides. Additional CMS tools will be added here in future updates.
                  </p>
                </div>

                <div className="overflow-x-auto rounded-lg border bg-card p-1 shadow-sm">
                  <div className="grid min-w-[840px] grid-cols-7 gap-1">
                    {cmsTabs.map((tab) => {
                      const isActive = cmsTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => handleCmsTabChange(tab.id)}
                          className={`flex min-h-[58px] min-w-0 items-center justify-center rounded-md px-3 py-2 text-center transition-colors ${
                            isActive
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          <div className="min-w-0">
                            <span className="block truncate text-sm font-semibold">{tab.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border bg-card shadow-sm">
                  {cmsTab === 'rescue' ? (
                    <Suspense fallback={<CmsRouteFallback />}>
                      <RescueCMSPage />
                    </Suspense>
                  ) : cmsTab === 'schedule' ? (
                    <Suspense fallback={<CmsRouteFallback />}>
                      <AdminSchedulePage />
                    </Suspense>
                  ) : cmsTab === 'catalog-tires' ? (
                    <Suspense fallback={<CmsRouteFallback />}>
                      <TiresCMSPage />
                    </Suspense>
                  ) : cmsTab === 'catalog-rims' ? (
                    <Suspense fallback={<CmsRouteFallback />}>
                      <RimsCMSPage />
                    </Suspense>
                  ) : cmsTab === 'orders' ? (
                    <Suspense fallback={<CmsRouteFallback />}>
                      <OrdersCMSPage />
                    </Suspense>
                  ) : cmsTab === 'invoices' ? (
                    <Suspense fallback={<CmsRouteFallback />}>
                      <InvoicesCMSPage documentScope="receipt" title="Receipt" />
                    </Suspense>
                  ) : (
                    <div className="space-y-2 p-8 text-muted-foreground">
                      <h2 className="text-xl font-semibold text-foreground">Coming soon</h2>
                      <p>Reserved for upcoming CMS modules.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
          </CmsGuard>
        ) : currentPage === 'privacy' ? (
          <LegalPage initialSection="privacy" />
        ) : currentPage === 'terms' ? (
          <LegalPage initialSection="terms" />
        ) : currentPage === 'legal' ? (
          <LegalPage />
        ) : currentPage === 'not-found' ? (
          <NotFoundPage
            path={typeof window !== 'undefined' ? window.location.pathname : ''}
            onNavigateHome={() => navigate('/')}
          />
        ) : currentPage === 'pwa-cms' || currentPage === 'pwa-not-found' ? (
          <CmsPwaScreen />
        ) : (
          <>
        {/* Hero Section */}
        <section className="relative" aria-labelledby="hero-heading">
          <div className="container mx-auto max-w-7xl px-6 lg:px-8">
            <div className={`grid items-center ${isMobileViewport ? 'gap-10 py-12' : 'gap-16 py-20 lg:grid-cols-2 lg:gap-20 lg:py-32'}`}>
              <div className="text-center lg:text-left">
                <h1 id="hero-heading" className={`mb-6 font-bold tracking-tight ${isMobileViewport ? 'text-4xl leading-tight' : 'text-5xl lg:text-6xl xl:text-7xl'}`}>
                  {t('hero.headline')}
                </h1>
                
                <p className={`mb-8 text-muted-foreground ${isMobileViewport ? 'text-lg' : 'text-xl lg:text-2xl'}`}>
                  {t('hero.subheadline')}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button 
                    size="lg" 
                    className="bg-accent hover:bg-accent/90 text-white h-12 px-8 rounded-full"
                    onClick={() => {
                      setPreSelectedService('');
                      setBookingModalOpen(true);
                    }}
                  >
                    {t('hero.cta.primary')}
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="h-12 px-8 rounded-full"
                    asChild
                  >
                    <a href="/catalog">{t('hero.cta.secondary')}</a>
                  </Button>
                  <button 
                    className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-accent text-accent hover:bg-accent hover:text-white h-12 px-8 transition-all duration-200 cursor-pointer font-semibold"
                    onClick={() => {
                      console.log('🚨 Emergency button clicked! Opening modal...');
                      console.log('Current emergencyModalOpen state:', emergencyModalOpen);
                      setEmergencyModalOpen(true);
                      console.log('setEmergencyModalOpen(true) called');
                    }}
                    data-testid="emergency-button"
                  >
                    <Navigation className="h-5 w-5" aria-hidden="true" />
                    {t('emergency.cta')}
                  </button>
                </div>

                {/* Trust Badges */}
                <div className={`flex flex-wrap justify-center lg:justify-start ${isMobileViewport ? 'mt-8 gap-4' : 'mt-12 gap-6'}`}>
                  {trustBadges.map((badge, idx) => (
                    <div key={idx} className="flex items-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(0,113,227,0.15)] rounded-full px-2 py-1">
                      <div className="rounded-full bg-secondary p-2 transition-all hover:shadow-[0_0_15px_rgba(231,76,60,0.25)]">
                        <badge.icon className="h-4 w-4 text-accent" aria-hidden="true" />
                      </div>
                      <span className="text-sm text-muted-foreground">{t(badge.key)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {!isMobileViewport ? (
                <div className="relative">
                  <div className="aspect-[4/3] overflow-hidden rounded-3xl relative">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentImageIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                        className="absolute inset-0"
                      >
                        <ImageWithFallback
                          src={heroImages[currentImageIndex].src}
                          alt={heroImages[currentImageIndex].alt}
                          className="h-full w-full object-cover"
                          loading="eager"
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-24 lg:py-32 relative" aria-labelledby="services-heading">
          <div className="container mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mb-16 text-center max-w-3xl mx-auto">
              <h2 id="services-heading" className="mb-4 text-4xl lg:text-5xl font-bold tracking-tight">
                {t('services.title')}
              </h2>
              <p className="text-xl text-muted-foreground">
                {t('services.subtitle')}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 sm:gap-8 lg:grid-cols-4">
              {services.map((service, idx) => (
                <div 
                  key={idx} 
                  className="group text-center transition-all hover:shadow-[0_0_30px_rgba(0,113,227,0.1)] rounded-2xl p-3 sm:p-4"
                >
                  <div className="mb-4 inline-flex rounded-2xl bg-secondary p-4 transition-all group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(231,76,60,0.2)] sm:mb-6 sm:p-6">
                    <service.icon className="h-6 w-6 text-accent sm:h-8 sm:w-8" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold leading-snug sm:mb-3 sm:text-xl">{t(service.titleKey)}</h3>
                  <p className="mb-3 text-sm leading-relaxed text-muted-foreground sm:mb-4 sm:text-base">{t(service.descKey)}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="group/btn h-auto px-2 py-1 text-xs text-accent hover:text-accent/80 sm:px-3 sm:py-2 sm:text-sm"
                    asChild
                  >
                    <a
                      href="/services"
                      className="inline-flex items-center gap-1"
                      onClick={(event) => handleInternalNavigation(event, '/services')}
                    >
                      {t('services.cta')}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" aria-hidden="true" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 lg:py-32 relative" aria-labelledby="catalog-heading">
          <div className="container mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mb-8 flex flex-col sm:mb-16 sm:flex-row sm:items-center sm:justify-between gap-5 sm:gap-6">
              <div>
                <h2 id="catalog-heading" className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  {t('catalog.title')}
                </h2>
                <p className="text-base text-muted-foreground sm:text-xl">{t('catalog.subtitle')}</p>
              </div>
              <Button 
                variant="outline" 
                className="h-10 rounded-full px-4 sm:h-11"
                asChild
              >
                <a href="/catalog" className="inline-flex items-center gap-2">
                  {t('catalog.viewAll')}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {catalogProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="group rounded-xl p-1.5 transition-all hover:shadow-[0_0_30px_rgba(0,113,227,0.15)] sm:rounded-2xl sm:p-2"
                >
                  <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-secondary transition-all group-hover:shadow-[0_0_20px_rgba(231,76,60,0.15)] sm:mb-4 sm:rounded-2xl">
                    <ImageWithFallback
                      src={product.imageUrl}
                      alt={`${product.name} - ${product.size} ${t(product.seasonKey)}`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <Badge className="absolute right-2 top-2 border-0 bg-accent px-2 py-0.5 text-[10px] sm:right-4 sm:top-4 sm:text-xs">
                      {t(product.seasonKey)}
                    </Badge>
                  </div>
                  <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-snug sm:text-base">{product.name}</h3>
                  <p className="mb-2 text-xs text-muted-foreground sm:mb-3 sm:text-sm">{product.size}</p>
                  <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-lg font-bold sm:text-2xl">{product.price}</span>
                    <Button 
                      size="sm" 
                      className="h-8 w-full rounded-full bg-accent px-3 text-xs text-white hover:bg-accent/90 sm:w-auto sm:text-sm"
                    >
                      {t('ui.buy')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Booking CTA */}
        <section className="py-16 lg:py-32 relative" aria-labelledby="booking-heading">
          <div className="container mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-20 items-center">
              <div>
                <h2 id="booking-heading" className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                  {t('booking.cta.title')}
                </h2>
                <p className="mb-6 text-base text-muted-foreground sm:mb-8 sm:text-xl">
                  {t('booking.cta.subtitle')}
                </p>
                
                <ul className="mb-6 grid grid-cols-1 gap-2 sm:mb-8 sm:space-y-0">
                  {bookingBenefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3 transition-all hover:shadow-[0_0_20px_rgba(0,113,227,0.1)] sm:bg-transparent sm:p-2">
                      <div className="rounded-full bg-background p-1.5 transition-all hover:shadow-[0_0_15px_rgba(231,76,60,0.2)] sm:bg-secondary">
                        <CheckCircle2 className="h-4 w-4 text-accent sm:h-5 sm:w-5" aria-hidden="true" />
                      </div>
                      <span className="text-sm font-medium sm:text-lg">{t(benefit.key)}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  size="lg" 
                  className="h-11 w-full rounded-full bg-accent px-6 text-white hover:bg-accent/90 sm:h-12 sm:w-auto sm:px-8"
                  asChild
                >
                  <span className="inline-flex items-center gap-2" onClick={() => setBookingModalOpen(true)}>
                    <Calendar className="h-5 w-5" aria-hidden="true" />
                    {t('booking.cta.button')}
                  </span>
                </Button>
              </div>
              
              <div className="relative">
                <div className="aspect-[16/10] overflow-hidden rounded-2xl sm:aspect-[4/3] sm:rounded-3xl">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWNoYW5pYyUyMHdvcmtpbmclMjBvbiUyMGNhcnxlbnwxfHx8fDE3NjA5MzE5NDd8MA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Professional mechanic working on vehicle service"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tire Hotel */}
        <section className="py-16 lg:py-32 relative" aria-labelledby="tire-hotel-heading">
          <div className="container mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-20 items-center">
              <div className="relative order-2 lg:order-1">
                <div className="aspect-[16/10] overflow-hidden rounded-2xl sm:aspect-[4/3] sm:rounded-3xl">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aXJlJTIwc3RvcmFnZSUyMHdhcmVob3VzZXxlbnwxfHx8fDE3NjA5MzE5NjV8MA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Professional tire storage warehouse"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              
              <div className="order-1 lg:order-2">
                <h2 id="tire-hotel-heading" className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                  {t('tireHotel.title')}
                </h2>
                <p className="mb-6 text-base text-muted-foreground sm:mb-8 sm:text-xl">
                  {t('tireHotel.subtitle')}
                </p>
                
                <ul className="mb-6 grid grid-cols-1 gap-2 sm:mb-8 sm:space-y-0">
                  {tireHotelBenefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-3 rounded-lg bg-secondary/50 p-3 transition-all hover:shadow-[0_0_20px_rgba(0,113,227,0.1)] sm:bg-transparent sm:p-2">
                      <div className="mt-0.5 rounded-full bg-background p-1.5 transition-all hover:shadow-[0_0_15px_rgba(231,76,60,0.2)] sm:mt-1 sm:bg-secondary">
                        <CheckCircle2 className="h-4 w-4 text-accent" aria-hidden="true" />
                      </div>
                      <span className="text-sm font-medium leading-relaxed sm:text-base">{t(benefit.key)}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  size="lg" 
                  variant="outline"
                  className="h-11 w-full rounded-full sm:w-auto"
                  asChild
                >
                  <a href="/tire-hotel" className="inline-flex items-center gap-2">
                    {t('tireHotel.cta')}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Customer Reviews */}
        <section className="py-16 lg:py-32 relative" aria-labelledby="reviews-heading">
          <div className="container mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mb-8 text-center max-w-3xl mx-auto sm:mb-16">
              <h2 id="reviews-heading" className="mb-3 text-3xl font-bold tracking-tight sm:mb-4 sm:text-4xl">
                {t('reviews.title')}
              </h2>
              <p className="text-base text-muted-foreground sm:text-xl">
                {t('common.reviewsSubtitle')}
              </p>
            </div>
            
            <div className="mb-8 grid gap-4 sm:mb-12 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
              {reviews.map((review, idx) => (
                <div 
                  key={idx} 
                  className={`${idx === 2 ? 'hidden lg:block' : ''} rounded-xl bg-secondary p-5 transition-all hover:bg-secondary/80 hover:shadow-[0_0_30px_rgba(0,113,227,0.15)] sm:rounded-2xl sm:p-8`}
                >
                  <div className="mb-3 flex items-center gap-3 sm:mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 transition-all hover:bg-accent/15 hover:shadow-[0_0_20px_rgba(231,76,60,0.3)] sm:h-12 sm:w-12">
                      <span className="text-sm font-semibold text-accent sm:text-base">
                        {review.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold sm:text-base">{review.name}</div>
                      <div className="flex gap-0.5" role="img" aria-label={`${review.rating} ${t('common.stars')}`}>
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent sm:h-4 sm:w-4" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground sm:line-clamp-none sm:text-base">"{review.text[language]}"</p>
                </div>
              ))}
            </div>

            {/* Overall Rating */}
            <div className="text-center">
              <div className="mx-auto w-full sm:w-auto">
                <div className="grid grid-cols-2 gap-4 sm:gap-8">
                  {/* Rating Card */}
                  <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-accent/5 via-secondary to-secondary p-5 transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(231,76,60,0.15)] sm:rounded-2xl sm:p-8">
                    <div className="absolute top-0 right-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-accent/10 blur-3xl transition-transform group-hover:scale-150 sm:h-32 sm:w-32" />
                    <div className="relative z-10 text-center">
                      <div className="mb-2 flex items-baseline justify-center gap-1 sm:mb-3 sm:gap-2">
                        <span className="bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-4xl font-bold text-transparent sm:text-6xl">4.9</span>
                        <span className="text-lg text-muted-foreground sm:text-2xl">/5</span>
                      </div>
                      <div className="mb-2 flex justify-center gap-0.5 sm:gap-1" role="img" aria-label={language === 'fi' ? '4.9 tähteä 5:stä' : '4.9 out of 5 stars'}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent drop-shadow-sm sm:h-5 sm:w-5" />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {language === 'fi' ? 'Asiakasarvostelut' : 'Customer Rating'}
                      </p>
                    </div>
                  </div>

                  {/* Happy Customers Card */}
                  <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-secondary to-secondary p-5 transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(0,113,227,0.15)] sm:rounded-2xl sm:p-8">
                    <div className="absolute top-0 right-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/10 blur-3xl transition-transform group-hover:scale-150 sm:h-32 sm:w-32" />
                    <div className="relative z-10 text-center">
                      <div className="mb-2 flex items-baseline justify-center gap-1 sm:mb-3">
                        <span className="bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-4xl font-bold text-transparent sm:text-6xl">500</span>
                        <span className="bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-4xl font-bold text-transparent sm:text-6xl">+</span>
                      </div>
                      <div className="mb-2 flex justify-center gap-1" role="img" aria-label="500+ happy customers">
                        <Users className="h-4 w-4 fill-[#FF6B35] text-[#FF6B35] drop-shadow-sm sm:h-5 sm:w-5" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t('common.happyCustomers')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Signals Section */}
        <section className="py-12 lg:py-20 relative bg-secondary/30" aria-label="Why choose Mitra Auto">
          <div className="container mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-5 sm:gap-8 lg:grid-cols-4">
              {/* Expert Service */}
              <div className="flex flex-col items-center text-center group">
                <div className="mb-3 rounded-full bg-background p-3 transition-all group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(231,76,60,0.2)] sm:mb-4 sm:p-4">
                  <Award className="size-5 text-accent sm:size-6" aria-hidden="true" />
                </div>
                <h3 className="mb-1 text-sm font-semibold sm:mb-2 sm:text-base">
                  {t('trustSignals.expertService')}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {t('trustSignals.expertServiceDesc')}
                </p>
              </div>

              {/* Quality Products */}
              <div className="flex flex-col items-center text-center group">
                <div className="mb-3 rounded-full bg-background p-3 transition-all group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(231,76,60,0.2)] sm:mb-4 sm:p-4">
                  <Shield className="size-5 text-accent sm:size-6" aria-hidden="true" />
                </div>
                <h3 className="mb-1 text-sm font-semibold sm:mb-2 sm:text-base">
                  {t('trustSignals.qualityProducts')}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {t('trustSignals.qualityProductsDesc')}
                </p>
              </div>

              {/* Fast Service */}
              <div className="flex flex-col items-center text-center group">
                <div className="mb-3 rounded-full bg-background p-3 transition-all group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(231,76,60,0.2)] sm:mb-4 sm:p-4">
                  <Clock className="size-5 text-accent sm:size-6" aria-hidden="true" />
                </div>
                <h3 className="mb-1 text-sm font-semibold sm:mb-2 sm:text-base">
                  {t('trustSignals.fastService')}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {t('trustSignals.fastServiceDesc')}
                </p>
              </div>

              {/* Customer First */}
              <div className="flex flex-col items-center text-center group">
                <div className="mb-3 rounded-full bg-background p-3 transition-all group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(231,76,60,0.2)] sm:mb-4 sm:p-4">
                  <Users className="size-5 text-accent sm:size-6" aria-hidden="true" />
                </div>
                <h3 className="mb-1 text-sm font-semibold sm:mb-2 sm:text-base">
                  {t('trustSignals.customerFirst')}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {t('trustSignals.customerFirstDesc')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact & Location Section */}
        <ContactSection />
          </>
        )}
      </main>

      {!isPwaRoute ? <Footer onNavigate={navigate} /> : null}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <CartProvider>
          <HomePage />
        </CartProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
