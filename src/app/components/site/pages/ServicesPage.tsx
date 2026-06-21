import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../i18n/LanguageContext';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { ArrowRight, Calendar, Award, Settings, CheckCircle2, Users } from 'lucide-react';
import { ImageWithFallback } from '../../figma/ImageWithFallback';
import { ContactSection } from '../sections/ContactSection';
import { motion, AnimatePresence } from 'motion/react';
import { getServiceDetailPathForServiceId } from '../../../i18n/dictionaries/serviceSeo';
import carWashService from 'figma:asset/cac46ce90efaaa69a5d5eac00cb56658fc7c8afa.png';
import carMaintenanceService from 'figma:asset/23fb0673ef5da715efe16a47361607b6c4536093.png';
import tireService from 'figma:asset/0c2e6e541f47a002ca898c5d5be58014ebf38e9d.png';

interface Service {
  id:string;
  name: string;
  price: string;
  note?: string;
}

interface ServiceCategoryData {
  id: string;
  title: string;
  services: Service[];
}

interface ServicesPageProps {
  onBookingClick: (serviceId: string | null) => void;
  onNavigate: (path: string) => void;
}

// Service hero carousel items
const serviceHeroItems = [
  {
    src: carWashService,
    alt: "Professional Car Wash Service"
  },
  {
    src: carMaintenanceService,
    alt: "Expert Car Maintenance"
  },
  {
    src: tireService,
    alt: "Premium Car Tire Services"
  }
];

function getRouteLanguage(fallback: 'fi' | 'en') {
  if (typeof window === 'undefined') return fallback;
  const path = window.location.pathname.toLowerCase();
  if (path === '/palvelut' || path.startsWith('/palvelut/')) return 'fi';
  if (path === '/en/services' || path.startsWith('/en/services/')) return 'en';
  return fallback;
}

export function ServicesPage({ onBookingClick, onNavigate }: ServicesPageProps) {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>('car-care');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-rotate carousel every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % serviceHeroItems.length
      );
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Scroll detection to highlight active category based on alignment
  useEffect(() => {
    const handleScroll = () => {
      const categoryIds = ['car-care', 'tire-services', 'diagnostics-maintenance', 'ac-service', 'dpf-service'];
      
      // Get all sidebar buttons and section headers
      const buttons = categoryIds.map(id => 
        document.querySelector(`button[data-category="${id}"]`)
      );
      const sections = categoryIds.map(id => document.getElementById(id));
      
      let closestCategory = categoryIds[0];
      let minDistance = Infinity;
      
      categoryIds.forEach((id, index) => {
        const button = buttons[index];
        const section = sections[index];
        
        if (button && section) {
          // Get the vertical position of the button
          const buttonRect = button.getBoundingClientRect();
          const buttonCenter = buttonRect.top + buttonRect.height / 2;
          
          // Get the vertical position of the section header
          const sectionRect = section.getBoundingClientRect();
          const sectionTop = sectionRect.top;
          
          // Calculate distance between button center and section header
          const distance = Math.abs(buttonCenter - sectionTop);
          
          // Find the section whose header is closest to its button
          if (distance < minDistance) {
            minDistance = distance;
            closestCategory = id;
          }
        }
      });
      
      setActiveCategory(closestCategory);
    };
    
    // Run on scroll
    window.addEventListener('scroll', handleScroll);
    // Run initially
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const serviceCategories: ServiceCategoryData[] = [
    {
      id: 'car-care',
      title: t('serviceCategory.carCare'),
      services: [
        { id: 'basic-hand-wash-car', name: `${t('service.basicHandWash')} · ${t('vehicle.passengerCar')}`, price: '25.00 €' },
        { id: 'basic-hand-wash-suv', name: `${t('service.basicHandWash')} · ${t('vehicle.suv')}`, price: '30.00 €' },
        { id: 'quick-wax-car', name: `${t('service.quickWax')} · ${t('vehicle.passengerCar')}`, price: '30.00 €' },
        { id: 'quick-wax-suv', name: `${t('service.quickWax')} · ${t('vehicle.suv')}`, price: '40.00 €' },
        { id: 'interior-cleaning-car', name: `${t('service.interiorCleaning')} · ${t('vehicle.passengerCar')}`, price: '40.00 €' },
        { id: 'interior-cleaning-suv', name: `${t('service.interiorCleaning')} · ${t('vehicle.suv')}`, price: '50.00 €' },
        { id: 'super-exterior-wash-car', name: `${t('service.premiumExteriorWash')} · ${t('vehicle.passengerCar')}`, price: '45.00 €' },
        { id: 'super-exterior-wash-suv', name: `${t('service.premiumExteriorWash')} · ${t('vehicle.suv')}`, price: '55.00 €' },
        { id: 'hard-wax-car', name: `${t('service.hardWaxProtection')} · ${t('vehicle.passengerCar')}`, price: '110.00 €' },
        { id: 'hard-wax-suv', name: `${t('service.hardWaxProtection')} · ${t('vehicle.suv')}`, price: '130.00 €' },
        { id: 'engine-wash', name: t('service.engineWash'), price: 'from 60.00 €', note: `(${t('service.customerResponsibilityNote')})` },
        { id: 'wheel-wash-set', name: t('service.wheelWash'), price: '10.00 € / set' },
      ],
    },
    {
      id: 'tire-services',
      title: t('serviceCategory.tireServices'),
      services: [
        { id: 'tire-change-car', name: t('service.tireChangeCar'), price: '30.00 €' },
        { id: 'tire-change-suv', name: t('service.tireChangeSuv'), price: '35.00 €' },
        { id: 'tire-change-van', name: t('service.tireChangeVan'), price: 'from 45.00 €' },
        { id: 'wheel-balancing', name: t('service.wheelBalancing'), price: '20.00 € / set' },
        { id: 'tire-repair-outside', name: t('service.externalRepair'), price: '25.00 €' },
        { id: 'tire-repair-inside', name: t('service.internalRepair'), price: '50.00 €' },
        { id: 'tire-work-up-to-17', name: t('service.tireWorkUpTo17'), price: '80.00 €' },
        { id: 'tire-work-18-19', name: t('service.tireWork18To19'), price: '90.00 €' },
        { id: 'tire-work-20-21', name: t('service.tireWork20To21'), price: '100.00 €' },
        { id: 'tire-hotel-storage', name: t('service.tireHotelStorage'), price: '60.00 € / season' },
      ],
    },
    {
      id: 'diagnostics-maintenance',
      title: t('serviceCategory.diagnosticsMaintenance'),
      services: [
        { id: 'error-code-reading', name: t('service.errorCodeReading'), price: '20.00 €' },
        { id: 'troubleshooting', name: t('service.troubleshooting'), price: '80.00 € / h' },
        { id: 'engine-oil-change', name: t('service.engineOilChange'), price: 'from 80.00 €' },
        { id: 'seasonal-maintenance', name: t('service.seasonalMaintenance'), price: 'from 120.00 €' },
        { id: 'annual-maintenance', name: t('service.annualMaintenance'), price: 'from 170.00 €' },
        { id: 'manual-gearbox-oil', name: t('service.manualGearboxOil'), price: 'from 80.00 €' },
        { id: 'automatic-gearbox-oil', name: t('service.automaticGearboxOil'), price: 'from 180.00 €' },
        { id: 'automatic-gearbox-flush', name: t('service.automaticGearboxFlush'), price: 'from 220.00 €' },
        { id: 'brake-fluid', name: t('service.brakeFluid'), price: 'from 65.00 €' },
        { id: 'pedal-installation', name: t('service.pedalInstallation'), price: 'from 260.00–320.00 €' },
        { id: 'rust-repair', name: t('service.rustRepair'), price: '80.00 € / h' },
      ],
    },
    {
      id: 'ac-service',
      title: t('serviceCategory.acService'),
      services: [
        { id: 'ac-service-r134a', name: t('service.acServiceR134a'), price: '60.00 €', note: 'includes 100 g refrigerant' },
        { id: 'ac-extra-refrigerant', name: t('service.extraRefrigerant'), price: '10.00 € / 100 g' },
        { id: 'ac-hybrid-extra-r134a', name: t('service.hybridSurcharge'), price: '+15.00 €' },
        { id: 'ac-service-r1234yf', name: t('service.acServiceR1234yf'), price: '70.00 €', note: 'includes 100 g refrigerant' },
        { id: 'ac-hybrid-extra-r1234yf', name: t('service.hybridSurcharge'), price: '+15.00 €' },
        { id: 'ac-service-electric', name: t('service.acServiceElectric'), price: '120.00 €', note: 'includes 100 g refrigerant, R1234yf' },
        { id: 'ac-diagnostics', name: t('service.acDiagnostics'), price: '80.00 € / h' },
      ],
    },
    {
      id: 'dpf-service',
      title: t('serviceCategory.dpfService'),
      services: [
        { id: 'dpf-diagnosis', name: t('service.dpfDiagnosis'), price: '80.00 €' },
        { id: 'dpf-forced-regeneration', name: t('service.dpfForcedRegeneration'), price: `${t('servicesPage.from')} 160.00 €` },
        { id: 'dpf-cleaning-2002-2008', name: t('service.dpfCleaning2002To2008'), price: `${t('servicesPage.from')} 160.00 €` },
        { id: 'dpf-cleaning-2009-2013', name: t('service.dpfCleaning2009To2013'), price: `${t('servicesPage.from')} 240.00 €` },
        { id: 'dpf-cleaning-2014-newer', name: t('service.dpfCleaning2014Newer'), price: `${t('servicesPage.from')} 340.00 €` },
        { id: 'dpf-removal-installation-estimate', name: t('service.dpfRemovalInstallationEstimate'), price: t('service.vehicleSpecificQuote') },
      ],
    },
  ];

  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    const element = document.getElementById(categoryId);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Top Booking CTA */}
      <section className="relative bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-background py-16 md:py-24">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl tracking-tight mb-6">
                {t('servicesPage.title')}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl">
                {t('servicesPage.subtitle')}
              </p>
              <Button
                size="lg"
                onClick={() => onBookingClick(null)}
                className="bg-accent hover:bg-accent/90 text-white rounded-full h-12 px-8 gap-2"
              >
                <Calendar className="h-5 w-5" />
                {t('servicesPage.bookNow')}
              </Button>
            </div>

            {/* Right Hero Carousel - Service Images */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 shadow-xl">
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
                    src={serviceHeroItems[currentImageIndex].src}
                    alt={serviceHeroItems[currentImageIndex].alt}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 lg:gap-12">
            {/* Sidebar Navigation - Desktop */}
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <nav className="space-y-2">
                  {serviceCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => scrollToCategory(category.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                        activeCategory === category.id
                          ? 'bg-accent text-white'
                          : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
                      }`}
                      data-category={category.id}
                    >
                      {category.title}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Mobile Category Selector */}
            <div className="lg:hidden mb-6">
              <select
                value={activeCategory}
                onChange={(e) => scrollToCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border"
              >
                {serviceCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Service Categories */}
            <div className="space-y-16">
              {serviceCategories.map((category, categoryIdx) => (
                <div
                  key={category.id}
                  id={category.id}
                  className="scroll-mt-24"
                >
                  {/* Category Header */}
                  <div className="mb-8">
                    <h2 className="text-3xl md:text-4xl tracking-tight mb-2">
                      {category.title}
                    </h2>
                    <div className="h-1 w-20 bg-accent rounded-full"></div>
                  </div>

                  {/* Service List */}
                  <Card className={categoryIdx % 2 === 0 ? 'bg-background' : 'bg-secondary/30'}>
                    <div className="divide-y divide-border">
                      {category.services.map((service, serviceIdx) => (
                        <ServiceListItem
                          key={serviceIdx}
                          service={service}
                          onBookClick={(serviceId) => onBookingClick(serviceId)}
                          onNavigate={onNavigate}
                        />
                      ))}
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals Section */}
      <section className="py-16 lg:py-20 bg-secondary/30" aria-label="Why choose Mitra Auto services">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Certified Technicians */}
            <div className="flex flex-col items-center text-center group">
              <div className="p-4 rounded-full mb-4 bg-background transition-all group-hover:shadow-[0_0_25px_rgba(231,76,60,0.2)] group-hover:scale-110">
                <Award className="size-6 text-accent" aria-hidden="true" />
              </div>
              <h3 className="text-base mb-2">
                {t('trustSignals.certifiedTechs')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('trustSignals.certifiedTechsDesc')}
              </p>
            </div>

            {/* Modern Equipment */}
            <div className="flex flex-col items-center text-center group">
              <div className="p-4 rounded-full mb-4 bg-background transition-all group-hover:shadow-[0_0_25px_rgba(231,76,60,0.2)] group-hover:scale-110">
                <Settings className="size-6 text-accent" aria-hidden="true" />
              </div>
              <h3 className="text-base mb-2">
                {t('trustSignals.modernEquipment')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('trustSignals.modernEquipmentDesc')}
              </p>
            </div>

            {/* Genuine Parts */}
            <div className="flex flex-col items-center text-center group">
              <div className="p-4 rounded-full mb-4 bg-background transition-all group-hover:shadow-[0_0_25px_rgba(231,76,60,0.2)] group-hover:scale-110">
                <CheckCircle2 className="size-6 text-accent" aria-hidden="true" />
              </div>
              <h3 className="text-base mb-2">
                {t('trustSignals.genuineParts')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('trustSignals.genuinePartsDesc')}
              </p>
            </div>

            {/* Satisfaction Guarantee */}
            <div className="flex flex-col items-center text-center group">
              <div className="p-4 rounded-full mb-4 bg-background transition-all group-hover:shadow-[0_0_25px_rgba(231,76,60,0.2)] group-hover:scale-110">
                <Users className="size-6 text-accent" aria-hidden="true" />
              </div>
              <h3 className="text-base mb-2">
                {t('trustSignals.satisfaction')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('trustSignals.satisfactionDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Location Section */}
      <ContactSection />
    </div>
  );
}

// Service List Item Component
interface ServiceListItemProps {
  service: Service;
  onBookClick: (serviceId: string) => void;
  onNavigate: (path: string) => void;
}

function ServiceListItem({ service, onBookClick, onNavigate }: ServiceListItemProps) {
  const { t, language } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);
  const detailHref = getServiceDetailPathForServiceId(service.id, getRouteLanguage(language));
  const openServiceDetail = () => {
    if (detailHref) {
      onNavigate(detailHref);
    }
  };

  return (
    <div
      className="group px-6 py-5 hover:bg-secondary/50 dark:hover:bg-secondary/30 transition-all cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={openServiceDetail}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openServiceDetail();
        }
      }}
      role={detailHref ? 'link' : undefined}
      tabIndex={detailHref ? 0 : undefined}
      aria-label={detailHref ? `${t('services.details')}: ${service.name}` : undefined}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Service Name and Note */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <h3 className="font-medium text-foreground group-hover:text-accent transition-colors">
              {service.name}
            </h3>
            <div className="flex-1 border-b border-dotted border-border/50 min-w-[20px] mb-1"></div>
          </div>
          {service.note && (
            <p className="text-sm text-muted-foreground italic mt-1">
              {service.note}
            </p>
          )}
        </div>

        {/* Price and Book Button */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <div className="font-semibold text-lg text-foreground">{service.price}</div>
          </div>
          {detailHref ? (
            <a
              href={detailHref}
              className="hidden rounded-full border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:inline-flex"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onNavigate(detailHref);
              }}
            >
              {t('services.details')}
            </a>
          ) : null}
          <Button
            size="sm"
            variant={isHovered ? 'default' : 'outline'}
            onClick={(e) => {
              e.stopPropagation();
              onBookClick(service.id);
            }}
            className="rounded-full gap-1 transition-all"
          >
            {t('services.cta')}
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
