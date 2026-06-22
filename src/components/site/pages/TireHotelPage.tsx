import { useLanguage } from '../../../i18n/LanguageContext';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../ui/accordion';
import { ImageWithFallback } from '../../figma/ImageWithFallback';
import { ContactSection } from '../sections/ContactSection';
import { motion } from 'motion/react';
import { 
  Calendar,
  FileText,
  Lock,
  RefreshCw,
  Car,
  Warehouse,
  Package,
  ArrowRight,
  Check,
  Umbrella
} from 'lucide-react';
import facilityImage from 'figma:asset/7a4460f78adaeb7811f555061adc7a3eb129dbf1.png';

interface TireHotelPageProps {
  onBookingClick: (serviceId: string | null) => void;
}

export function TireHotelPage({ onBookingClick }: TireHotelPageProps) {
  const { t } = useLanguage();

  const tireHotelServiceIds = {
    storage: 'tire-hotel-storage',
    seasonalSwap: 'tire-hotel-seasonal-swap',
    hotelPackage: 'tire-hotel-hotel-package',
  } as const;

  // Benefits data
  const benefits = [
    {
      icon: Umbrella,
      title: t('tireHotel.benefits.secureStorage.title'),
      description: t('tireHotel.benefits.secureStorage.desc'),
    },
    {
      icon: FileText,
      title: t('tireHotel.benefits.tracked.title'),
      description: t('tireHotel.benefits.tracked.desc'),
    },
    {
      icon: Lock,
      title: t('tireHotel.benefits.insured.title'),
      description: t('tireHotel.benefits.insured.desc'),
    },
    {
      icon: RefreshCw,
      title: t('tireHotel.benefits.seasonalSwap.title'),
      description: t('tireHotel.benefits.seasonalSwap.desc'),
    }
  ];

  // How it works steps
  const steps = [
    {
      icon: Car,
      title: t('tireHotel.steps.drive.title'),
      description: t('tireHotel.steps.drive.desc'),
    },
    {
      icon: Warehouse,
      title: t('tireHotel.steps.store.title'),
      description: t('tireHotel.steps.store.desc'),
    },
    {
      icon: Calendar,
      title: t('tireHotel.steps.ready.title'),
      description: t('tireHotel.steps.ready.desc'),
    }
  ];

  // Pricing plans
  const pricingPlans = [
    {
      id: tireHotelServiceIds.storage,
      name: t('tireHotel.plans.storage.name'),
      price: '60',
      period: t('tireHotel.plans.storage.period'),
      description: t('tireHotel.plans.storage.desc'),
      priceNote: t('tireHotel.plans.storage.note'),
      features: [
        t('tireHotel.plans.storage.feature1'),
        t('tireHotel.plans.storage.feature2'),
        t('tireHotel.plans.storage.feature3'),
        t('tireHotel.plans.storage.feature4'),
      ],
      highlighted: false
    },
    {
      id: tireHotelServiceIds.seasonalSwap,
      name: t('tireHotel.plans.swap.name'),
      price: '35',
      period: t('tireHotel.plans.swap.period'),
      description: t('tireHotel.plans.swap.desc'),
      priceNote: t('tireHotel.plans.swap.note'),
      features: [
        t('tireHotel.plans.swap.feature1'),
        t('tireHotel.plans.swap.feature2'),
        t('tireHotel.plans.swap.feature3'),
        t('tireHotel.plans.swap.feature4'),
      ],
      highlighted: false
    },
    {
      id: tireHotelServiceIds.hotelPackage,
      name: t('tireHotel.plans.package.name'),
      price: '90',
      period: t('tireHotel.plans.package.period'),
      description: t('tireHotel.plans.package.desc'),
      priceNote: t('tireHotel.plans.package.note'),
      features: [
        t('tireHotel.plans.package.feature1'),
        t('tireHotel.plans.package.feature2'),
        t('tireHotel.plans.package.feature3'),
        t('tireHotel.plans.package.feature4'),
      ],
      highlighted: true
    }
  ];

  // FAQ items
  const faqItems = [
    {
      question: t('tireHotel.faq.storage.question'),
      answer: t('tireHotel.faq.storage.answer'),
    },
    {
      question: t('tireHotel.faq.rims.question'),
      answer: t('tireHotel.faq.rims.answer'),
    },
    {
      question: t('tireHotel.faq.insurance.question'),
      answer: t('tireHotel.faq.insurance.answer'),
    },
    {
      question: t('tireHotel.faq.retrieve.question'),
      answer: t('tireHotel.faq.retrieve.answer'),
    },
    {
      question: t('tireHotel.faq.damage.question'),
      answer: t('tireHotel.faq.damage.answer'),
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* What Is Tire Hotel Section */}
      <section id="what-is-tire-hotel" className="pt-24 pb-20 md:pt-32 md:pb-32 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src={facilityImage}
                  alt="Modern tire storage facility"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-6 -right-6 bg-accent text-white p-6 rounded-2xl shadow-xl">
                <div className="text-center">
                  <div className="text-3xl font-bold">Helsinki</div>
                  <div className="text-sm opacity-90">
                    {t('tireHotel.title')}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl tracking-tight mb-6">
                {t('tireHotel.whatIsTitle')}
              </h2>
              
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {t('tireHotel.whatIsBody')}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  size="lg"
                  onClick={() => onBookingClick(tireHotelServiceIds.storage)}
                  className="bg-accent hover:bg-accent/90 text-white rounded-full h-14 px-10 gap-2 shadow-lg shadow-accent/30 hover:shadow-accent/50 transition-all"
                >
                  <Calendar className="h-5 w-5" />
                  {t('tireHotel.bookStorage')}
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full h-14 px-10"
                  onClick={() => {
                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {t('tireHotel.learnMore')}
                </Button>
              </div>

              {/* Benefits grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                        <benefit.icon className="h-6 w-6 text-accent" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 md:py-32 bg-background">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl tracking-tight mb-4">
              {t('tireHotel.howItWorksTitle')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('tireHotel.howItWorksSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection lines - desktop only */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent" />
            
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <Card className="p-8 text-center hover:shadow-lg transition-all bg-gradient-to-br from-background to-secondary/30 border-border/50">
                  {/* Step number */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center font-bold text-lg shadow-lg">
                    {index + 1}
                  </div>
                  
                  {/* Icon */}
                  <div className="w-20 h-20 mx-auto mb-6 mt-4 rounded-2xl bg-accent/10 flex items-center justify-center">
                    <step.icon className="h-10 w-10 text-accent" />
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-secondary/20 to-background">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl tracking-tight mb-4">
              {t('tireHotel.storagePlansTitle')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('tireHotel.storagePlansSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <Card className={`p-8 relative overflow-hidden transition-all hover:shadow-2xl h-full flex flex-col ${
                  plan.highlighted 
                    ? 'border-accent border-2 shadow-lg shadow-accent/20 bg-gradient-to-br from-orange-50 to-background dark:from-orange-950/20 dark:to-background' 
                    : 'hover:border-accent/50'
                }`}>
                  {/* Most Popular Badge */}
                  {plan.highlighted && (
                    <div className="absolute top-0 right-0 bg-accent text-white text-xs font-semibold px-4 py-1 rounded-bl-lg">
                      {t('tireHotel.mostPopular')}
                    </div>
                  )}

                  {/* Gradient blob */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl" />
                  
                  <div className="relative flex flex-col flex-1">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                    
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold">€{plan.price}</span>
                        <span className="text-muted-foreground">/ {plan.period}</span>
                      </div>
                      {'priceNote' in plan && plan.priceNote ? (
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          {plan.priceNote}
                        </p>
                      ) : null}
                    </div>

                    <Button
                      onClick={() => onBookingClick(plan.id)}
                      className={`w-full mb-8 rounded-full h-12 ${
                        plan.highlighted
                          ? 'bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/30'
                          : 'bg-foreground hover:bg-foreground/90 text-background'
                      }`}
                    >
                      {t('tireHotel.bookNow')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>

                    {/* Features */}
                    <div className="space-y-3 flex-1">
                      {plan.features.map((feature, fIndex) => (
                        <div key={fIndex} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto max-w-4xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl tracking-tight mb-4">
              {t('tireHotel.faqTitle')}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t('tireHotel.faqSubtitle')}
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Trust Signals Section */}
      <section className="py-16 lg:py-20 bg-secondary/30" aria-label={t('tireHotel.trustAria')}>
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Secure Storage */}
            <div className="flex flex-col items-center text-center group">
              <div className="p-4 rounded-full mb-4 bg-background transition-all group-hover:shadow-[0_0_25px_rgba(231,76,60,0.2)] group-hover:scale-110">
                <Lock className="size-6 text-accent" aria-hidden="true" />
              </div>
              <h3 className="text-base mb-2">
                {t('trustSignals.secureStorage')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('trustSignals.secureStorageDesc')}
              </p>
            </div>

            {/* UV Protection */}
            <div className="flex flex-col items-center text-center group">
              <div className="p-4 rounded-full mb-4 bg-background transition-all group-hover:shadow-[0_0_25px_rgba(231,76,60,0.2)] group-hover:scale-110">
                <Umbrella className="size-6 text-accent" aria-hidden="true" />
              </div>
              <h3 className="text-base mb-2">
                {t('trustSignals.uvProtection')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('trustSignals.uvProtectionDesc')}
              </p>
            </div>

            {/* Easy Seasonal Swap */}
            <div className="flex flex-col items-center text-center group">
              <div className="p-4 rounded-full mb-4 bg-background transition-all group-hover:shadow-[0_0_25px_rgba(231,76,60,0.2)] group-hover:scale-110">
                <RefreshCw className="size-6 text-accent" aria-hidden="true" />
              </div>
              <h3 className="text-base mb-2">
                {t('trustSignals.easySwap')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('trustSignals.easySwapDesc')}
              </p>
            </div>

            {/* Convenient Service */}
            <div className="flex flex-col items-center text-center group">
              <div className="p-4 rounded-full mb-4 bg-background transition-all group-hover:shadow-[0_0_25px_rgba(231,76,60,0.2)] group-hover:scale-110">
                <Package className="size-6 text-accent" aria-hidden="true" />
              </div>
              <h3 className="text-base mb-2">
                {t('trustSignals.convenientService')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('trustSignals.convenientServiceDesc')}
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
