import React, { useState } from 'react';
import { LanguageProvider, useLanguage } from './components/LanguageContext';
import { ThemeProvider } from './components/ThemeContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { EmergencyTowModal } from './components/EmergencyTowModal';
import { BookingModal } from './components/BookingModal';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
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
  Navigation
} from 'lucide-react';

function HomePage() {
  const { t, language } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  
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

  const handleAuthSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const services = [
    {
      icon: Wrench,
      titleKey: 'services.tireChange.title',
      descKey: 'services.tireChange.desc',
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
        cartCount={0}
      />

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
                    onClick={() => setBookingModalOpen(true)}
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
                <div className="aspect-[4/3] overflow-hidden rounded-3xl">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1705747401901-28363172fe7e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBzaG93cm9vbXxlbnwxfHx8fDE3NjA5Mjk1Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Mitra Auto Premium Service"
                    className="h-full w-full object-cover"
                  />
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
                    <a href="/booking" className="inline-flex items-center gap-1">
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
                  <a href="/booking" className="inline-flex items-center gap-2">
                    <Calendar className="h-5 w-5" aria-hidden="true" />
                    {t('booking.cta.button')}
                  </a>
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
              <div className="inline-flex items-center gap-8 rounded-2xl bg-secondary p-8 transition-all hover:shadow-[0_0_35px_rgba(0,113,227,0.2)] hover:bg-secondary/80">
                <div>
                  <div className="text-5xl font-bold">4.9/5</div>
                  <div className="mt-2 flex justify-center gap-1" role="img" aria-label={language === 'fi' ? '4.9 tähteä 5:stä' : '4.9 out of 5 stars'}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-accent text-accent" />
                    ))}
                  </div>
                </div>
                <div className="h-16 w-px bg-border" />
                <div className="text-left">
                  <div className="text-3xl font-bold">500+</div>
                  <div className="text-sm text-muted-foreground">
                    {t('common.happyCustomers')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <HomePage />
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
