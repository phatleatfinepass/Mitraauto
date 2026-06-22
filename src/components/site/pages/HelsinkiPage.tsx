import { useLanguage } from '../../../i18n/LanguageContext';
import { motion } from 'motion/react';
import { MapPin, Clock, Phone, Wrench, ArrowRight, Award, Users, Shield } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { businessProfile } from '../../../config/businessProfile';
import { useLocalSeoHead } from '../../../utils/localSeo';

interface HelsinkiPageProps {
  onBookingClick: () => void;
  onNavigate: (path: string) => void;
}

export function HelsinkiPage({ onBookingClick, onNavigate }: HelsinkiPageProps) {
  const { language, t } = useLanguage();
  const canonicalPath = t('route.helsinki');

  useLocalSeoHead({
    language,
    title: t('seo.helsinki.title'),
    description: t('seo.helsinki.description'),
    canonicalPath,
    alternatePaths: { fi: '/helsinki', en: '/en/helsinki' },
    pageType: 'WebPage',
    breadcrumbs: [
      { name: t('nav.home'), path: t('route.home') },
      { name: 'Helsinki', path: canonicalPath },
    ],
  });

  const services = [
    {
      icon: Wrench,
      title: t('helsinki.services.carService.title'),
      desc: t('helsinki.services.carService.desc'),
      link: t('helsinki.services.carService.link'),
    },
    {
      icon: Wrench,
      title: t('helsinki.services.tireChange.title'),
      desc: t('helsinki.services.tireChange.desc'),
      link: t('helsinki.services.tireChange.link'),
    },
    {
      icon: Wrench,
      title: t('helsinki.services.tireHotel.title'),
      desc: t('helsinki.services.tireHotel.desc'),
      link: t('helsinki.services.tireHotel.link'),
    },
    {
      icon: Wrench,
      title: t('helsinki.services.diagnostics.title'),
      desc: t('helsinki.services.diagnostics.desc'),
      link: t('helsinki.services.diagnostics.link'),
    },
  ];

  const whyHelsinki = [
    {
      icon: MapPin,
      title: t('helsinki.why.location.title'),
      desc: t('helsinki.why.location.desc'),
    },
    {
      icon: Users,
      title: t('helsinki.why.experts.title'),
      desc: t('helsinki.why.experts.desc'),
    },
    {
      icon: Award,
      title: t('helsinki.why.partner.title'),
      desc: t('helsinki.why.partner.desc'),
    },
    {
      icon: Shield,
      title: t('helsinki.why.quality.title'),
      desc: t('helsinki.why.quality.desc'),
    },
  ];

  const stats = [
    {
      value: businessProfile.address.streetAddress,
      label: t('helsinki.stats.location'),
    },
    {
      value: businessProfile.openingHoursText[language].split('\n')[0],
      label: t('helsinki.stats.weekdays'),
    },
    {
      value: businessProfile.phoneDisplay,
      label: t('helsinki.stats.phone'),
    },
    {
      value: 'FI / EN',
      label: t('helsinki.stats.languages'),
    },
  ];

  const faqItems = [
    {
      q: t('helsinki.faq.location.q'),
      a: t('helsinki.faq.location.a'),
    },
    {
      q: t('helsinki.faq.area.q'),
      a: t('helsinki.faq.area.a'),
    },
    {
      q: t('helsinki.faq.parking.q'),
      a: t('helsinki.faq.parking.a'),
    },
    {
      q: t('helsinki.faq.appointment.q'),
      a: t('helsinki.faq.appointment.a'),
    },
    {
      q: t('helsinki.faq.winter.q'),
      a: t('helsinki.faq.winter.a'),
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
              {t('helsinki.breadcrumb.home')} / {t('helsinki.breadcrumb.helsinki')}
            </div>

            {/* H1 - Helsinki REQUIRED in H1 (local intent) */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              {t('helsinki.hero.title')}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {t('helsinki.hero.subtitle')}
            </p>

            {/* Primary CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={onBookingClick}
                className="bg-accent hover:bg-accent/90 text-white px-8 py-6 text-lg"
              >
                {t('helsinki.bookNow')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => onNavigate(t('helsinki.contactLink'))}
                className="px-8 py-6 text-lg"
              >
                {t('helsinki.contactUs')}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-accent text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-xl font-bold leading-tight md:text-2xl">{stat.value}</div>
                <div className="text-white/80 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us in Helsinki */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('helsinki.whyTitle')}
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              {t('helsinki.whySubtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {whyHelsinki.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              >
                <Card className="h-full text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <item.icon className="w-12 h-12 text-accent mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services in Helsinki */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('helsinki.servicesTitle')}
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              {t('helsinki.servicesSubtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow group cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <service.icon className="w-10 h-10 text-accent flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2 group-hover:text-accent transition-colors">
                          {service.title}
                        </h3>
                        <p className="text-muted-foreground mb-4">{service.desc}</p>
                        <Button
                          variant="link"
                          className="p-0 h-auto"
                          onClick={() => onNavigate(service.link)}
                        >
                          {t('helsinki.learnMore')}
                          <ArrowRight className="ml-1 w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="text-center mb-8"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('helsinki.findUsTitle')}
              </h2>
              <p className="text-muted-foreground text-lg">
                {t('helsinki.addressValue')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="aspect-video bg-muted rounded-lg overflow-hidden mb-8"
            >
              <iframe
                src={businessProfile.googleMapsEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={t('helsinki.mapTitle')}
              />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <MapPin className="w-8 h-8 text-accent mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">{t('helsinki.address')}</h3>
                  <p className="text-muted-foreground text-sm">
                    {businessProfile.address.streetAddress}<br />
                    {businessProfile.address.postalCode} {businessProfile.address.addressLocality}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="w-8 h-8 text-accent mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">{t('helsinki.openingHours')}</h3>
                  <p className="text-muted-foreground text-sm whitespace-pre-line">{businessProfile.openingHoursText[language]}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Phone className="w-8 h-8 text-accent mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">{t('helsinki.contact')}</h3>
                  <p className="text-muted-foreground text-sm">
                    <a href={`tel:${businessProfile.phoneE164}`} className="hover:text-foreground">
                      {businessProfile.phoneDisplay}
                    </a>
                    <br />
                    <a href={`mailto:${businessProfile.email}`} className="hover:text-foreground">
                      {businessProfile.email}
                    </a>
                  </p>
                </CardContent>
              </Card>
            </div>
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
                {t('helsinki.faqTitle')}
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
            transition={{ duration: 0.6, delay: 1.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('helsinki.footerTitle')}
            </h2>
            <p className="text-white/90 mb-8 text-lg">
              {t('helsinki.footerSubtitle')}
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={onBookingClick}
              className="px-8 py-6 text-lg"
            >
              {t('helsinki.bookNow')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
