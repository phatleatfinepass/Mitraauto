import { useLanguage } from '../../../i18n/LanguageContext';
import { motion } from 'motion/react';
import { MapPin, Phone, Mail, Clock, ArrowRight, MessageCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { businessProfile } from '../../../config/businessProfile';
import { useLocalSeoHead } from '../../../utils/localSeo';

interface ContactPageProps {
  onBookingClick: () => void;
}

export function ContactPage({ onBookingClick }: ContactPageProps) {
  const { language, t } = useLanguage();
  const canonicalPath = t('route.contact');

  useLocalSeoHead({
    language,
    title: t('seo.contact.title'),
    description: t('seo.contact.description'),
    canonicalPath,
    alternatePaths: { fi: '/yhteystiedot', en: '/en/contact' },
    pageType: 'ContactPage',
    breadcrumbs: [
      { name: t('nav.home'), path: t('route.home') },
      { name: t('contactPage.breadcrumb.contact'), path: canonicalPath },
    ],
  });

  const contactInfo = [
    {
      icon: MapPin,
      label: t('contact.address'),
      value: `${businessProfile.address.streetAddress}\n${businessProfile.address.postalCode} ${businessProfile.address.addressLocality}`,
      link: businessProfile.mapSearchUrl,
    },
    {
      icon: Phone,
      label: t('contact.phone'),
      value: businessProfile.phoneDisplay,
      link: `tel:${businessProfile.phoneE164}`,
    },
    {
      icon: Mail,
      label: t('contact.email'),
      value: businessProfile.email,
      link: `mailto:${businessProfile.email}`,
    },
    {
      icon: Clock,
      label: t('contact.hours'),
      value: businessProfile.openingHoursText[language],
      link: null,
    },
  ];

  const faqItems = [
    {
      question: t('contactPage.faq.booking.q'),
      answer: t('contactPage.faq.booking.a'),
    },
    {
      question: t('contactPage.faq.location.q'),
      answer: t('contactPage.faq.location.a'),
    },
    {
      question: t('contactPage.faq.parking.q'),
      answer: t('contactPage.faq.parking.a'),
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
              {t('contactPage.breadcrumb.home')} / {t('contactPage.breadcrumb.contact')}
            </div>

            {/* H1 - Helsinki in subtitle */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              {t('contact.title')}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {t('contactPage.hero.subtitle')}
            </p>

            {/* Primary CTA */}
            <Button
              size="lg"
              onClick={onBookingClick}
              className="bg-accent hover:bg-accent/90 text-white px-8 py-6 text-lg"
            >
              {t('contactPage.bookNow')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {contactInfo.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <item.icon className="w-8 h-8 text-accent mb-4" />
                    <h3 className="font-semibold text-lg mb-2">{item.label}</h3>
                    {item.link ? (
                      <a
                        href={item.link}
                        target={item.link.startsWith('http') ? '_blank' : undefined}
                        rel={item.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="text-muted-foreground hover:text-foreground whitespace-pre-line transition-colors"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-muted-foreground whitespace-pre-line">{item.value}</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="aspect-video bg-muted rounded-lg overflow-hidden"
            >
              <iframe
                src={businessProfile.googleMapsEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={t('contactPage.mapTitle')}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('contactPage.faqTitle')}
              </h2>
              <p className="text-muted-foreground text-lg">
                {t('contactPage.faqSubtitle')}
              </p>
            </motion.div>

            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg mb-2 flex items-start gap-2">
                        <MessageCircle className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                        {item.question}
                      </h3>
                      <p className="text-muted-foreground ml-7">{item.answer}</p>
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
            transition={{ duration: 0.6, delay: 0.9 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('contactPage.footerTitle')}
            </h2>
            <p className="text-white/90 mb-8 text-lg">
              {t('contactPage.footerSubtitle')}
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={onBookingClick}
              className="px-8 py-6 text-lg"
            >
              {t('contactPage.bookNow')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
