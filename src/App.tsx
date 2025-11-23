import React, { useState, useEffect, useCallback } from 'react';
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
import type { CatalogProduct } from './components/catalog/CatalogPage';
import { AdminSchedulePage } from './components/admin/AdminSchedulePage';
import { CmsBetaPage } from './components/admin/CmsBetaPage';
import { AdminAuthProvider, useAdminAuth } from './components/admin/AdminAuthContext';
import { AdminLoginPage } from './components/admin/AdminLoginPage';
import { AdminPasswordChangePage } from './components/admin/AdminPasswordChangePage';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
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

type ParsedTireSize = {
  width?: number;
  aspect?: number;
  construction?: string;
  diameter?: number;
  loadIndex?: number;
  speedRating?: string;
};

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

function mapCatalogProductToDetail(product: CatalogProduct): ProductDetail {
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
      best_price_eur: product.best_price_eur,
      best_image_url: product.best_image_url,
      images: generateProductImages(product.id, product.best_image_url, 'tire'),
      description: undefined,
      in_stock: product.in_stock,
      stock_quantity: product.in_stock ? 8 : 0,
      supplier_name: 'Mitra Auto',
      delivery_days: product.in_stock ? '1-3 business days' : undefined,
      weight: undefined,
    };
  }

  return {
    type: 'rim',
    id: product.id,
    brand: product.brand,
    model: product.model,
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
    images: generateProductImages(product.id, product.best_image_url, 'rim'),
    description: undefined,
    in_stock: product.in_stock,
    stock_quantity: product.in_stock ? 4 : 0,
    supplier_name: 'Mitra Auto',
    delivery_days: product.in_stock ? '2-5 business days' : undefined,
    compatible_vehicles: [],
  };
}

// Admin Auth Guard Component - receives callbacks from HomePage
interface AdminAuthGuardProps {
  onNeedLogin: () => void;
  onNotAuthorized: () => void;
}

function AdminAuthGuard({ onNeedLogin, onNotAuthorized }: AdminAuthGuardProps) {
  const { user, loading, isAdmin, needsPasswordChange, logout, changePassword } = useAdminAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!loading && !checked) {
      setChecked(true);
      
      // Not logged in - trigger login modal
      if (!user) {
        onNeedLogin();
        return;
      }

      // Logged in but not admin - show error and redirect
      if (!isAdmin) {
        onNotAuthorized();
        return;
      }
    }
  }, [loading, user, isAdmin, checked, onNeedLogin, onNotAuthorized]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#11141A]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35]" />
      </div>
    );
  }

  // Not logged in or not admin - show loading while redirecting
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#11141A]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35]" />
      </div>
    );
  }

  // Logged in but needs password change (this won't trigger anymore, but kept for safety)
  if (needsPasswordChange) {
    return (
      <AdminPasswordChangePage
        onPasswordChanged={() => {
          // Will be redirected to schedule after password change
        }}
        onChangePassword={changePassword}
        onLogout={logout}
      />
    );
  }

  // Logged in and password is valid - show CMS page
  return <CmsBetaPage onLogout={logout} />;
}

function HomePage() {
  const { t, language } = useLanguage();
  const { user, login } = useAdminAuth();
  const { addToCart, totalItems, setIsCartOpen } = useCart();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [preSelectedService, setPreSelectedService] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<'home' | 'services' | 'tire-hotel' | 'catalog' | 'about' | 'legal' | 'product-detail' | 'checkout' | 'checkout-success' | 'checkout-cancel' | 'cms' | 'admin-login'>('home');
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Check auth state on mount
  useEffect(() => {
    if (user) {
      setIsLoggedIn(true);
    } else {
      const checkAuth = async () => {
        const { getSupabaseClient } = await import('./utils/supabase/client');
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setIsLoggedIn(true);
        }
      };
      
      checkAuth();
    }
  }, [user]);

  // Hero carousel timer - changes image every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 30000); // 30 seconds

    return () => clearInterval(timer);
  }, []);
  
  const updatePageFromPath = useCallback(
    (path: string, state?: { selectedProduct?: ProductDetail | null }) => {
      if (path === '/services') {
        setCurrentPage('services');
        setSelectedProduct(null);
      } else if (path === '/tire-hotel') {
        setCurrentPage('tire-hotel');
        setSelectedProduct(null);
      } else if (path === '/about') {
        setCurrentPage('about');
        setSelectedProduct(null);
      } else if (path === '/admin/schedule') {
        setCurrentPage('cms');
        setSelectedProduct(null);
      } else if (path === '/admin/login') {
        setCurrentPage('admin-login');
        setSelectedProduct(null);
      } else if (path === '/cms' || path.startsWith('/cms/')) {
        setCurrentPage('cms');
        setSelectedProduct(null);
      } else if (path === '/privacy' || path === '/legal/privacy') {
        setCurrentPage('privacy');
        setSelectedProduct(null);
      } else if (path === '/terms' || path === '/legal/terms') {
        setCurrentPage('terms');
        setSelectedProduct(null);
      } else if (path === '/legal') {
        setCurrentPage('legal');
        setSelectedProduct(null);
      } else if (path === '/catalog' || path === '/shop') {
        setCurrentPage('catalog');
        setSelectedProduct(null);
      } else if (path.startsWith('/catalog/')) {
        setCurrentPage('catalog-detail');
        if (state?.selectedProduct) {
          setSelectedProduct(state.selectedProduct);
        }
      } else if (path === '/checkout/success') {
        setCurrentPage('checkout-success');
        setSelectedProduct(null);
      } else if (path === '/checkout/cancel') {
        setCurrentPage('checkout-cancel');
        setSelectedProduct(null);
      } else if (path === '/checkout') {
        setCurrentPage('checkout');
        setSelectedProduct(null);
      } else {
        setCurrentPage('home');
        setSelectedProduct(null);
      }
    },
    [setCurrentPage, setSelectedProduct]
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
      const detail = mapCatalogProductToDetail(product);
      setSelectedProduct(detail);
      const detailPath = `/catalog/${product.product_type}/${product.id}`;
      navigate(detailPath, { state: { selectedProduct: detail } });
    },
    [navigate, setSelectedProduct]
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
    const handleNavigation = (event?: PopStateEvent) => {
      const path = window.location.pathname;
      const state = (event?.state as { selectedProduct?: ProductDetail | null }) ?? window.history.state;
      updatePageFromPath(path, state);
    };

    handleNavigation();
    const listener = (event: PopStateEvent) => handleNavigation(event);
    window.addEventListener('popstate', listener);

    return () => window.removeEventListener('popstate', listener);
  }, [updatePageFromPath]);
  
  // Debug emergency modal state
  React.useEffect(() => {
    console.log('📱 Emergency Modal State Changed:', emergencyModalOpen);
  }, [emergencyModalOpen]);

  const handleLogin = () => {
    setAuthView('login');
    setAuthModalOpen(true);
  };

  const handleSignup = () => {
    setAuthView('signup');
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (isAdmin?: boolean) => {
    setIsLoggedIn(true);
    
    // If admin user, redirect to admin schedule
    if (isAdmin) {
      setCurrentPage('admin-schedule');
      // Update URL without page reload
      window.history.pushState({}, '', '/admin/schedule');
    }
  };

  const handleLogout = async () => {
    // Logout from Supabase
    const supabase = await import('./utils/supabase/client').then(m => m.getSupabaseClient());
    await supabase.auth.signOut();
    
    setIsLoggedIn(false);
    
    // If on admin page, redirect to home
    if (currentPage === 'admin-schedule') {
      setCurrentPage('home');
      window.history.pushState({}, '', '/');
    }
  };

  const handleAdminNeedLogin = () => {
    // User tried to access admin but not logged in
    setCurrentPage('admin-login');
    window.history.pushState({}, '', '/admin/login');
  };

  const handleAdminNotAuthorized = () => {
    // User is logged in but not admin
    setCurrentPage('home');
    window.history.pushState({}, '', '/');
    alert(language === 'fi' 
      ? 'Sinulla ei ole oikeutta käyttää hallintapaneelia.' 
      : 'You do not have permission to access the admin panel.');
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
    { icon: Shield, key: 'hero.trust.secure' },
    { icon: Award, key: 'hero.trust.paytrail' },
    { icon: Clock, key: 'hero.trust.fast' },
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
    { id: 1, name: 'Nokian Hakkapeliitta R5', size: '205/55 R16', seasonKey: 'season.winter', price: '€129' },
    { id: 2, name: 'Michelin Pilot Sport 4', size: '225/45 R17', seasonKey: 'season.summer', price: '€159' },
    { id: 3, name: 'Continental AllSeasonContact', size: '195/65 R15', seasonKey: 'season.allSeason', price: '€99' },
    { id: 4, name: 'Bridgestone Turanza T005', size: '215/60 R16', seasonKey: 'season.summer', price: '€119' },
  ];

  const bookingBenefits = [
    { key: 'booking.benefit1' },
    { key: 'booking.benefit2' },
    { key: 'booking.benefit3' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to main content */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only"
      >
        {t('ui.skipToContent')}
      </a>

      <Navbar
        isLoggedIn={isLoggedIn}
        onLoginClick={handleLogin}
        onSignupClick={handleSignup}
        onLogout={handleLogout}
        cartCount={totalItems}
        onNavigate={navigate}
        onCartClick={() => setIsCartOpen(true)}
      />

      <CartDrawer onCheckout={() => setCurrentPage('checkout')} />

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultView={authView}
        onSuccess={handleAuthSuccess}
      />

      <EmergencyTowModal
        open={emergencyModalOpen}
        onOpenChange={setEmergencyModalOpen}
      />

      <BookingModal
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
        preSelectedService={preSelectedService}
      />

      {/* Unified Background Gradient Blobs - Continuous Web Across Entire Scroll */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 w-full" style={{height: '400vh'}}>
          {/* Large overlapping blobs distributed throughout the page */}
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
          
          {/* Additional mid-layer blobs for more coverage */}
          <div className="absolute top-[15%] right-[50%] w-[480px] h-[480px] bg-ring/6 rounded-full blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute top-[48%] left-[70%] w-[520px] h-[520px] bg-accent/6 rounded-full blur-3xl animate-blob animation-delay-4000" />
          <div className="absolute top-[78%] right-[60%] w-[560px] h-[560px] bg-primary/5 rounded-full blur-3xl animate-blob" />
        </div>
      </div>

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
            onNavigateToCheckout={() => {
              setCurrentPage('checkout');
              navigate('/checkout');
            }}
          />
        ) : currentPage === 'admin-schedule' ? (
          <CmsBetaPage onLogout={async () => {
            await handleLogout();
            navigate('/');
          }} />
        ) : currentPage === 'cms' ? (
          <CmsBetaPage onLogout={async () => {
            await handleLogout();
            navigate('/');
          }} />
        ) : currentPage === 'admin-login' ? (
          <AdminLoginPage
            onLogin={login}
            onLoginSuccess={() => {
              setCurrentPage('cms');
              window.history.pushState({}, '', '/cms');
            }}
          />
        ) : currentPage === 'privacy' ? (
          <LegalPage initialSection="privacy" />
        ) : currentPage === 'terms' ? (
          <LegalPage initialSection="terms" />
        ) : currentPage === 'legal' ? (
          <LegalPage />
        ) : (
          <>
        {/* Hero Section */}
        <section className="relative" aria-labelledby="hero-heading">
          <div className="container mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-16 py-20 lg:grid-cols-2 lg:gap-20 lg:py-32 items-center">
              <div className="text-center lg:text-left">
                <h1 id="hero-heading" className="mb-6 text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight">
                  {t('hero.headline')}
                </h1>
                
                <p className="mb-8 text-xl lg:text-2xl text-muted-foreground">
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
                <div className="mt-12 flex flex-wrap gap-6 justify-center lg:justify-start">
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
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
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
            
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((service, idx) => (
                <div 
                  key={idx} 
                  className="group text-center transition-all hover:shadow-[0_0_30px_rgba(0,113,227,0.1)] rounded-2xl p-4"
                >
                  <div className="mb-6 inline-flex rounded-2xl bg-secondary p-6 transition-all group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(231,76,60,0.2)]">
                    <service.icon className="h-8 w-8 text-accent" aria-hidden="true" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold">{t(service.titleKey)}</h3>
                  <p className="mb-4 text-muted-foreground">{t(service.descKey)}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="group/btn text-accent hover:text-accent/80" 
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
        <section className="py-24 lg:py-32 relative" aria-labelledby="catalog-heading">
          <div className="container mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mb-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h2 id="catalog-heading" className="mb-2 text-4xl font-bold tracking-tight">
                  {t('catalog.title')}
                </h2>
                <p className="text-xl text-muted-foreground">{t('catalog.subtitle')}</p>
              </div>
              <Button 
                variant="outline" 
                className="rounded-full"
                asChild
              >
                <a href="/catalog" className="inline-flex items-center gap-2">
                  {t('catalog.viewAll')}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </Button>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {catalogProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="group transition-all hover:shadow-[0_0_30px_rgba(0,113,227,0.15)] rounded-2xl p-2"
                >
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-secondary mb-4 transition-all group-hover:shadow-[0_0_20px_rgba(231,76,60,0.15)]">
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1685270387102-5c0fccf96ad9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwdGlyZSUyMGNsb3NlJTIwdXB8ZW58MXx8fHwxNzYwOTMxOTE2fDA&ixlib=rb-4.1.0&q=80&w=1080"
                      alt={`${product.name} - ${product.size} ${t(product.seasonKey)}`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <Badge className="absolute top-4 right-4 bg-accent border-0 rounded-full">
                      {t(product.seasonKey)}
                    </Badge>
                  </div>
                  <h3 className="mb-1 font-semibold">{product.name}</h3>
                  <p className="mb-3 text-sm text-muted-foreground">{product.size}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{product.price}</span>
                    <Button 
                      size="sm" 
                      className="bg-accent hover:bg-accent/90 text-white rounded-full"
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
        <section className="py-24 lg:py-32 relative" aria-labelledby="booking-heading">
          <div className="container mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-16 lg:grid-cols-2 lg:gap-20 items-center">
              <div>
                <h2 id="booking-heading" className="mb-6 text-4xl lg:text-5xl font-bold tracking-tight">
                  {t('booking.cta.title')}
                </h2>
                <p className="mb-8 text-xl text-muted-foreground">
                  {t('booking.cta.subtitle')}
                </p>
                
                <ul className="mb-8 space-y-4">
                  {bookingBenefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center gap-3 transition-all hover:shadow-[0_0_20px_rgba(0,113,227,0.1)] rounded-lg p-2">
                      <div className="rounded-full bg-secondary p-1.5 transition-all hover:shadow-[0_0_15px_rgba(231,76,60,0.2)]">
                        <CheckCircle2 className="h-5 w-5 text-accent" aria-hidden="true" />
                      </div>
                      <span className="text-lg">{t(benefit.key)}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  size="lg" 
                  className="bg-accent hover:bg-accent/90 text-white h-12 px-8 rounded-full"
                  asChild
                >
                  <span className="inline-flex items-center gap-2" onClick={() => setBookingModalOpen(true)}>
                    <Calendar className="h-5 w-5" aria-hidden="true" />
                    {t('booking.cta.button')}
                  </span>
                </Button>
              </div>
              
              <div className="relative">
                <div className="aspect-[4/3] overflow-hidden rounded-3xl">
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
        <section className="py-24 lg:py-32 relative" aria-labelledby="tire-hotel-heading">
          <div className="container mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-16 lg:grid-cols-2 lg:gap-20 items-center">
              <div className="relative order-2 lg:order-1">
                <div className="aspect-[4/3] overflow-hidden rounded-3xl">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aXJlJTIwc3RvcmFnZSUyMHdhcmVob3VzZXxlbnwxfHx8fDE3NjA5MzE5NjV8MA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Professional tire storage warehouse"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              
              <div className="order-1 lg:order-2">
                <h2 id="tire-hotel-heading" className="mb-6 text-4xl font-bold tracking-tight">
                  {t('tireHotel.title')}
                </h2>
                <p className="mb-8 text-xl text-muted-foreground">
                  {t('tireHotel.subtitle')}
                </p>
                
                <ul className="mb-8 space-y-4">
                  {tireHotelBenefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-3 transition-all hover:shadow-[0_0_20px_rgba(0,113,227,0.1)] rounded-lg p-2">
                      <div className="mt-1 rounded-full bg-secondary p-1.5 transition-all hover:shadow-[0_0_15px_rgba(231,76,60,0.2)]">
                        <CheckCircle2 className="h-4 w-4 text-accent" aria-hidden="true" />
                      </div>
                      <span>{t(benefit.key)}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  size="lg" 
                  variant="outline"
                  className="rounded-full"
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
        <section className="py-24 lg:py-32 relative" aria-labelledby="reviews-heading">
          <div className="container mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mb-16 text-center max-w-3xl mx-auto">
              <h2 id="reviews-heading" className="mb-4 text-4xl font-bold tracking-tight">
                {t('reviews.title')}
              </h2>
              <p className="text-xl text-muted-foreground">
                {t('common.reviewsSubtitle')}
              </p>
            </div>
            
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 mb-12">
              {reviews.map((review, idx) => (
                <div 
                  key={idx} 
                  className="rounded-2xl bg-secondary p-8 transition-all hover:shadow-[0_0_30px_rgba(0,113,227,0.15)] hover:bg-secondary/80"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 transition-all hover:shadow-[0_0_20px_rgba(231,76,60,0.3)] hover:bg-accent/15">
                      <span className="font-semibold text-accent">
                        {review.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold">{review.name}</div>
                      <div className="flex gap-0.5" role="img" aria-label={`${review.rating} ${t('common.stars')}`}>
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground">"{review.text[language]}"</p>
                </div>
              ))}
            </div>

            {/* Overall Rating */}
            <div className="text-center">
              <div className="mx-auto w-full sm:w-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                  {/* Rating Card */}
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/5 via-secondary to-secondary p-8 transition-all hover:shadow-[0_0_30px_rgba(231,76,60,0.15)] hover:scale-[1.02]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-150" />
                    <div className="relative z-10 text-center">
                      <div className="flex items-baseline justify-center gap-2 mb-3">
                        <span className="text-6xl font-bold bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">4.9</span>
                        <span className="text-2xl text-muted-foreground">/5</span>
                      </div>
                      <div className="flex gap-1 mb-2 justify-center" role="img" aria-label={language === 'fi' ? '4.9 tähteä 5:stä' : '4.9 out of 5 stars'}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-accent text-accent drop-shadow-sm" />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {language === 'fi' ? 'Asiakasarvostelut' : 'Customer Rating'}
                      </p>
                    </div>
                  </div>

                  {/* Happy Customers Card */}
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-secondary to-secondary p-8 transition-all hover:shadow-[0_0_30px_rgba(0,113,227,0.15)] hover:scale-[1.02]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-150" />
                    <div className="relative z-10 text-center">
                      <div className="flex items-baseline justify-center gap-1 mb-3">
                        <span className="text-6xl font-bold bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">500</span>
                        <span className="text-6xl font-bold bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">+</span>
                      </div>
                      <div className="flex gap-1 mb-2 justify-center" role="img" aria-label="500+ happy customers">
                        <Users className="h-5 w-5 fill-[#FF6B35] text-[#FF6B35] drop-shadow-sm" />
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
        <section className="py-16 lg:py-20 relative bg-secondary/30" aria-label="Why choose Mitra Auto">
          <div className="container mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Expert Service */}
              <div className="flex flex-col items-center text-center group">
                <div className="p-4 rounded-full mb-4 bg-background transition-all group-hover:shadow-[0_0_25px_rgba(231,76,60,0.2)] group-hover:scale-110">
                  <Award className="size-6 text-accent" aria-hidden="true" />
                </div>
                <h3 className="text-base mb-2">
                  {t('trustSignals.expertService')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('trustSignals.expertServiceDesc')}
                </p>
              </div>

              {/* Quality Products */}
              <div className="flex flex-col items-center text-center group">
                <div className="p-4 rounded-full mb-4 bg-background transition-all group-hover:shadow-[0_0_25px_rgba(231,76,60,0.2)] group-hover:scale-110">
                  <Shield className="size-6 text-accent" aria-hidden="true" />
                </div>
                <h3 className="text-base mb-2">
                  {t('trustSignals.qualityProducts')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('trustSignals.qualityProductsDesc')}
                </p>
              </div>

              {/* Fast Service */}
              <div className="flex flex-col items-center text-center group">
                <div className="p-4 rounded-full mb-4 bg-background transition-all group-hover:shadow-[0_0_25px_rgba(231,76,60,0.2)] group-hover:scale-110">
                  <Clock className="size-6 text-accent" aria-hidden="true" />
                </div>
                <h3 className="text-base mb-2">
                  {t('trustSignals.fastService')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('trustSignals.fastServiceDesc')}
                </p>
              </div>

              {/* Customer First */}
              <div className="flex flex-col items-center text-center group">
                <div className="p-4 rounded-full mb-4 bg-background transition-all group-hover:shadow-[0_0_25px_rgba(231,76,60,0.2)] group-hover:scale-110">
                  <Users className="size-6 text-accent" aria-hidden="true" />
                </div>
                <h3 className="text-base mb-2">
                  {t('trustSignals.customerFirst')}
                </h3>
                <p className="text-sm text-muted-foreground">
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

      <Footer onNavigate={navigate} />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AdminAuthProvider>
          <CartProvider>
            <HomePage />
          </CartProvider>
        </AdminAuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;