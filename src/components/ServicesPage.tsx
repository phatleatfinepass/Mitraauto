import React, { useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ArrowRight, Calendar, Award, Settings, CheckCircle2, Users, Loader2 } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ContactSection } from './ContactSection';
import { motion, AnimatePresence } from 'motion/react';
import { getSupabaseClient } from '../utils/supabase/client';
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

export function ServicesPage({ onBookingClick }: ServicesPageProps) {
  const { t, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>('car-wash');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategoryData[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);

  // Fetch services from CMS
  useEffect(() => {
    async function fetchServicesFromCMS() {
      try {
        setIsLoadingServices(true);
        setServicesError(null);
        console.log('[ServicesPage] Fetching services from CMS...');

        const supabase = getSupabaseClient();

        // Fetch service groups with their services
        const { data: groups, error: groupsError } = await supabase
          .from('service_groups')
          .select(`
            id,
            name_fi,
            name_en,
            display_order,
            is_active,
            services (
              id,
              name_fi,
              name_en,
              price_eur,
              note_fi,
              note_en,
              display_order,
              is_active
            )
          `)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (groupsError) {
          console.error('[ServicesPage] Error fetching service groups:', groupsError);
          
          // If table doesn't exist (PGRST205), use fallback data
          if (groupsError.code === 'PGRST205') {
            console.warn('[ServicesPage] Tables not found, using fallback hardcoded data');
            console.warn('[ServicesPage] Run /SERVICES_CMS_SETUP.sql to enable CMS control');
            setServiceCategories(getFallbackServices());
            setIsLoadingServices(false);
            return;
          }
          
          throw groupsError;
        }

        console.log('[ServicesPage] Fetched service groups:', groups);

        // Transform database data to component format
        const transformedCategories: ServiceCategoryData[] = (groups || []).map((group: any) => {
          // Filter and sort active services
          const activeServices = (group.services || [])
            .filter((service: any) => service.is_active)
            .sort((a: any, b: any) => a.display_order - b.display_order);

          return {
            id: group.id,
            title: language === 'fi' ? group.name_fi : group.name_en,
            services: activeServices.map((service: any) => ({
              id: service.id,
              name: language === 'fi' ? service.name_fi : service.name_en,
              price: `${service.price_eur.toFixed(2)} €`,
              note: language === 'fi' ? service.note_fi : service.note_en,
            })),
          };
        });

        console.log('[ServicesPage] Transformed categories:', transformedCategories);

        setServiceCategories(transformedCategories);

        // Set first active category as default
        if (transformedCategories.length > 0) {
          setActiveCategory(transformedCategories[0].id);
        }
      } catch (error) {
        console.error('[ServicesPage] Failed to fetch services:', error);
        setServicesError(error instanceof Error ? error.message : 'Failed to load services');
      } finally {
        setIsLoadingServices(false);
      }
    }

    fetchServicesFromCMS();
  }, [language]);

  // Auto-rotate carousel every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % serviceHeroItems.length
      );
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

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
              {/* Loading State */}
              {isLoadingServices && (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                  <p className="text-muted-foreground">
                    {language === 'fi' ? 'Ladataan palveluita...' : 'Loading services...'}
                  </p>
                </div>
              )}

              {/* Error State */}
              {!isLoadingServices && servicesError && (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="text-destructive text-center">
                    <p className="font-medium mb-2">
                      {language === 'fi' ? 'Palveluiden lataaminen epäonnistui' : 'Failed to load services'}
                    </p>
                    <p className="text-sm text-muted-foreground">{servicesError}</p>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!isLoadingServices && !servicesError && serviceCategories.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <p className="text-muted-foreground text-center">
                    {language === 'fi' 
                      ? 'Ei palveluita saatavilla tällä hetkellä.' 
                      : 'No services available at the moment.'}
                  </p>
                </div>
              )}

              {/* Service Categories List */}
              {!isLoadingServices && !servicesError && serviceCategories.map((category, categoryIdx) => (
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
                    {category.services.length > 0 ? (
                      <div className="divide-y divide-border">
                        {category.services.map((service, serviceIdx) => (
                          <ServiceListItem
                            key={serviceIdx}
                            service={service}
                            onBookClick={(serviceId) => onBookingClick(serviceId)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="px-6 py-8 text-center text-muted-foreground">
                        {language === 'fi' 
                          ? 'Ei palveluita tässä kategoriassa.' 
                          : 'No services in this category.'}
                      </div>
                    )}
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
}

function ServiceListItem({ service, onBookClick }: ServiceListItemProps) {
  const { t } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group px-6 py-5 hover:bg-secondary/50 dark:hover:bg-secondary/30 transition-all cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">{t('servicesPage.from')}</div>
            <div className="font-semibold text-lg text-foreground">{service.price}</div>
          </div>
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

// Fallback services data
function getFallbackServices(): ServiceCategoryData[] {
  return [
    {
      id: 'car-wash',
      title: 'Car Wash / Autopesu',
      services: [
        { id: 'exterior-wash', name: 'Exterior Wash / Ulkopesu', price: '95.00 €' },
        { id: 'full-wash', name: 'Full Wash / Täyspesu', price: '150.00 €' },
        { id: 'interior-cleaning', name: 'Interior Cleaning / Sisäpuhdistus', price: '80.00 €' },
        { id: 'engine-wash', name: 'Engine Wash / Moottoripesu', price: '65.00 €' },
      ],
    },
    {
      id: 'maintenance',
      title: 'Maintenance / Huolto',
      services: [
        {
          id: 'basic-service',
          name: 'Basic Service / Pienhuolto', 
          price: '250.00 €',
          note: 'Includes oil change and basic maintenance / Sisältää öljynvaihdon ja perushuollon'
        },
        {
          id: 'large-service',
          name: 'Large Service / Suurhuolto', 
          price: '450.00 €',
          note: 'Comprehensive service including inspection / Kattava huolto sisältäen tarkastuksen'
        },
        { id: 'ac-service', name: 'A/C Service / Ilmastoinnin huolto', price: '120.00 €' },
        {
          id: 'brake-fluid',
          name: 'Brake Fluid / Jarruneste', 
          price: '85.00 €',
          note: 'Includes brake fluid replacement / Sisältää jarrunesteen vaihdon'
        },
      ],
    },
    {
      id: 'tire-work',
      title: 'Tire Work / Rengastyöt',
      services: [
        {
          id: 'tire-mounting',
          name: 'Tire Mounting / Renkaan asennus', 
          price: '60.00 €',
          note: '4 tires'
        },
        { id: 'tire-removal', name: 'Tire Removal / Renkaan irrotus', price: '40.00 €' },
        { id: 'wheel-balancing', name: 'Wheel Balancing / Pyöränbalanssi', price: '15.00 €' },
        { id: 'tire-repair', name: 'Tire Repair / Renkaan korjaus', price: '25.00 €' },
        { id: 'tpms-service', name: 'TPMS Service / TPMS-huolto', price: '45.00 €' },
        {
          id: 'wheel-alignment',
          name: 'Wheel Alignment / Pyöränsuuntaus', 
          price: '95.00 €',
          note: 'Geometry adjustment / Geometrian säätö'
        },
      ],
    },
  ];
}