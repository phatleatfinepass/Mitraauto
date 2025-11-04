import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ArrowRight, Calendar } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ContactSection } from './ContactSection';

interface Service {
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
  onBookingClick: () => void;
}

export function ServicesPage({ onBookingClick }: ServicesPageProps) {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>('car-wash');

  const serviceCategories: ServiceCategoryData[] = [
    {
      id: 'car-wash',
      title: t('serviceCategory.carWash'),
      services: [
        { name: t('service.exteriorWash'), price: '95.00 €' },
        { name: t('service.fullWash'), price: '150.00 €' },
        { name: t('service.interiorCleaning'), price: '80.00 €' },
        { name: t('service.engineWash'), price: '65.00 €' },
      ],
    },
    {
      id: 'maintenance',
      title: t('serviceCategory.maintenance'),
      services: [
        { 
          name: t('service.basicService'), 
          price: '250.00 €',
          note: t('service.basicServiceNote')
        },
        { 
          name: t('service.largeService'), 
          price: '450.00 €',
          note: t('service.largeServiceNote')
        },
        { name: t('service.acService'), price: '120.00 €' },
        { 
          name: t('service.brakeFluid'), 
          price: '85.00 €',
          note: t('service.brakeFluidNote')
        },
      ],
    },
    {
      id: 'tire-work',
      title: t('serviceCategory.tireWork'),
      services: [
        { 
          name: t('service.tireMounting'), 
          price: '60.00 €',
          note: t('service.tireMountingNote')
        },
        { name: t('service.tireRemoval'), price: '40.00 €' },
        { name: t('service.wheelBalancing'), price: '15.00 €' },
        { name: t('service.tireRepair'), price: '25.00 €' },
        { name: t('service.tpmsService'), price: '45.00 €' },
        { 
          name: t('service.wheelAlignment'), 
          price: '95.00 €',
          note: t('service.wheelAlignmentNote')
        },
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
                onClick={onBookingClick}
                className="bg-accent hover:bg-accent/90 text-white rounded-full h-12 px-8 gap-2"
              >
                <Calendar className="h-5 w-5" />
                {t('servicesPage.bookNow')}
              </Button>
            </div>

            {/* Right Image Placeholder */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 shadow-xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1632823469583-6d0e3d425fcd?w=800&q=80"
                alt="Car service workshop"
                className="w-full h-full object-cover"
              />
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
                          onBookClick={onBookingClick}
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

      {/* Contact & Location Section */}
      <ContactSection />
    </div>
  );
}

// Service List Item Component
interface ServiceListItemProps {
  service: Service;
  onBookClick: () => void;
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
              onBookClick();
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
