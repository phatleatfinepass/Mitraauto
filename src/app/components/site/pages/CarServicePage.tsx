import { useLanguage } from '../../../i18n/LanguageContext';
import { motion } from 'motion/react';
import { Wrench, Clock, Euro, CheckCircle2, ArrowRight, Shield, Star } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';

interface CarServicePageProps {
  onBookingClick: () => void;
}

export function CarServicePage({ onBookingClick }: CarServicePageProps) {
  const { t } = useLanguage();

  const services = [
    {
      name: t('carServicePage.services.basic.name'),
      desc: t('carServicePage.services.basic.desc'),
      price: '[TBD]',
      duration: '[TBD] min',
    },
    {
      name: t('carServicePage.services.major.name'),
      desc: t('carServicePage.services.major.desc'),
      price: '[TBD]',
      duration: '[TBD] min',
    },
    {
      name: t('carServicePage.services.seasonal.name'),
      desc: t('carServicePage.services.seasonal.desc'),
      price: '[TBD]',
      duration: '[TBD] min',
    },
    {
      name: t('carServicePage.services.ac.name'),
      desc: t('carServicePage.services.ac.desc'),
      price: '[TBD]',
      duration: '[TBD] min',
    },
  ];

  const benefits = [
    {
      icon: Shield,
      title: t('carServicePage.benefits.technicians.title'),
      desc: t('carServicePage.benefits.technicians.desc'),
    },
    {
      icon: CheckCircle2,
      title: t('carServicePage.benefits.parts.title'),
      desc: t('carServicePage.benefits.parts.desc'),
    },
    {
      icon: Clock,
      title: t('carServicePage.benefits.fast.title'),
      desc: t('carServicePage.benefits.fast.desc'),
    },
    {
      icon: Star,
      title: t('carServicePage.benefits.guarantee.title'),
      desc: t('carServicePage.benefits.guarantee.desc'),
    },
  ];

  const whatsIncluded = [
    t('carServicePage.included.inspection'),
    t('carServicePage.included.oilFilter'),
    t('carServicePage.included.fluids'),
    t('carServicePage.included.brakes'),
    t('carServicePage.included.tirePressure'),
    t('carServicePage.included.lights'),
    t('carServicePage.included.battery'),
    t('carServicePage.included.report'),
  ];

  const faqItems = [
    {
      q: t('carServicePage.faq.frequency.q'),
      a: t('carServicePage.faq.frequency.a'),
    },
    {
      q: t('carServicePage.faq.warranty.q'),
      a: t('carServicePage.faq.warranty.a'),
    },
    {
      q: t('carServicePage.faq.wait.q'),
      a: t('carServicePage.faq.wait.a'),
    },
    {
      q: t('carServicePage.faq.issues.q'),
      a: t('carServicePage.faq.issues.a'),
    },
    {
      q: t('carServicePage.faq.seasonal.q'),
      a: t('carServicePage.faq.seasonal.a'),
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            {/* Breadcrumb */}
            <div className="text-sm text-muted-foreground mb-4">
              {t('carServicePage.breadcrumb.home')} / {t('carServicePage.breadcrumb.services')} / {t('carServicePage.breadcrumb.carService')}
            </div>

            {/* H1 - Helsinki REQUIRED (service detail = local intent) */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              {t('carServicePage.hero.title')}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {t('carServicePage.hero.subtitle')}
            </p>

            {/* Primary CTA */}
            <Button
              size="lg"
              onClick={onBookingClick}
              className="bg-accent hover:bg-accent/90 text-white px-8 py-6 text-lg"
            >
              {t('carServicePage.bookService')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('carServicePage.includedTitle')}
              </h2>
              <p className="text-muted-foreground text-lg">
                {t('carServicePage.includedSubtitle')}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {whatsIncluded.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.05 }}
                  className="flex items-center gap-3 p-4 bg-background rounded-lg"
                >
                  <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0" />
                  <span className="text-foreground">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Service Packages */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('carServicePage.packagesTitle')}
            </h2>
            <p className="text-muted-foreground text-lg">
              {t('carServicePage.packagesSubtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-xl mb-2">{service.name}</h3>
                        <p className="text-muted-foreground text-sm">{service.desc}</p>
                      </div>
                      <Wrench className="w-8 h-8 text-accent flex-shrink-0" />
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">{service.duration}</span>
                        </div>
                        <div className="flex items-center gap-1 text-accent font-semibold">
                          <Euro className="w-4 h-4" />
                          <span>{service.price}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={onBookingClick}
                      >
                        {t('carServicePage.book')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('carServicePage.whyTitle')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.1 + index * 0.1 }}
              >
                <Card className="h-full text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <benefit.icon className="w-12 h-12 text-accent mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm">{benefit.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.4 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('carServicePage.faqTitle')}
              </h2>
            </motion.div>

            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 1.5 + index * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg mb-2">{item.q}</h3>
                      <p className="text-muted-foreground">{item.a}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 bg-accent text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 2.0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('carServicePage.footerTitle')}
            </h2>
            <p className="text-white/90 mb-8 text-lg">
              {t('carServicePage.footerSubtitle')}
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={onBookingClick}
              className="px-8 py-6 text-lg"
            >
              {t('carServicePage.bookService')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
