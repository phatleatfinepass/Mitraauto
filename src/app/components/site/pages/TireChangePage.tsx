import { useLanguage } from '../../../i18n/LanguageContext';
import { motion } from 'motion/react';
import { Wrench, Clock, Euro, CheckCircle2, ArrowRight, Shield } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';

interface TireChangePageProps {
  onBookingClick: () => void;
}

export function TireChangePage({ onBookingClick }: TireChangePageProps) {
  const { t } = useLanguage();
  const durationConfirmed = t('service.durationConfirmedInBooking');

  const services = [
    {
      name: t('tireChangePage.services.passenger.name'),
      desc: t('tireChangePage.services.passenger.desc'),
      price: '30 €',
      duration: durationConfirmed,
    },
    {
      name: t('tireChangePage.services.suv.name'),
      desc: t('tireChangePage.services.suv.desc'),
      price: '35 €',
      duration: durationConfirmed,
    },
    {
      name: t('tireChangePage.services.van.name'),
      desc: t('tireChangePage.services.van.desc'),
      price: t('service.vehicleSpecificQuote'),
      duration: durationConfirmed,
    },
  ];

  const whatsIncluded = [
    t('tireChangePage.included.change'),
    t('tireChangePage.included.balancing'),
    t('tireChangePage.included.pressure'),
    t('tireChangePage.included.visual'),
    t('tireChangePage.included.tpms'),
    t('tireChangePage.included.torque'),
  ];

  const faqItems = [
    {
      q: t('tireChangePage.faq.duration.q'),
      a: t('tireChangePage.faq.duration.a'),
    },
    {
      q: t('tireChangePage.faq.season.q'),
      a: t('tireChangePage.faq.season.a'),
    },
    {
      q: t('tireChangePage.faq.storage.q'),
      a: t('tireChangePage.faq.storage.a'),
    },
    {
      q: t('tireChangePage.faq.condition.q'),
      a: t('tireChangePage.faq.condition.a'),
    },
    {
      q: t('tireChangePage.faq.ownTires.q'),
      a: t('tireChangePage.faq.ownTires.a'),
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
            <div className="text-sm text-muted-foreground mb-4">
              {t('tireChangePage.breadcrumb.home')} / {t('tireChangePage.breadcrumb.services')} / {t('tireChangePage.breadcrumb.tireChange')}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              {t('tireChangePage.hero.title')}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {t('tireChangePage.hero.subtitle')}
            </p>

            <Button
              size="lg"
              onClick={onBookingClick}
              className="bg-accent hover:bg-accent/90 text-white px-8 py-6 text-lg"
            >
              {t('tireChangePage.bookTireChange')}
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
                {t('tireChangePage.includedTitle')}
              </h2>
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

      {/* Pricing */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('tireChangePage.pricingTitle')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <Wrench className="w-10 h-10 text-accent mb-4" />
                    <h3 className="font-bold text-xl mb-2">{service.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{service.desc}</p>
                    <div className="flex items-center gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {service.duration}
                      </div>
                      <div className="flex items-center gap-1 text-accent font-semibold text-lg">
                        <Euro className="w-5 h-5" />
                        {service.price}
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      onClick={onBookingClick}
                    >
                      {t('tireChangePage.book')}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('tireChangePage.faqTitle')}
              </h2>
            </motion.div>

            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 1.1 + index * 0.1 }}
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
            transition={{ duration: 0.6, delay: 1.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('tireChangePage.footerTitle')}
            </h2>
            <p className="text-white/90 mb-8 text-lg">
              {t('tireChangePage.footerSubtitle')}
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={onBookingClick}
              className="px-8 py-6 text-lg"
            >
              {t('tireChangePage.bookTireChange')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
