import { useLanguage } from '../../../i18n/LanguageContext';
import { motion } from 'motion/react';
import { Search, ArrowRight } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';

interface DiagnosticsPageProps {
  onBookingClick: () => void;
}

export function DiagnosticsPage({ onBookingClick }: DiagnosticsPageProps) {
  const { t } = useLanguage();

  const services = [
    {
      name: t('diagnosticsPage.services.codes.name'),
      desc: t('diagnosticsPage.services.codes.desc'),
      price: '[TBD] €',
    },
    {
      name: t('diagnosticsPage.services.comprehensive.name'),
      desc: t('diagnosticsPage.services.comprehensive.desc'),
      price: '[TBD] €',
    },
  ];

  const faqItems = [
    {
      q: t('diagnosticsPage.faq.includes.q'),
      a: t('diagnosticsPage.faq.includes.a'),
    },
    {
      q: t('diagnosticsPage.faq.duration.q'),
      a: t('diagnosticsPage.faq.duration.a'),
    },
  ];

  return (
    <div className="min-h-screen">
      <section className="relative py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="text-sm text-muted-foreground mb-4">
              {t('diagnosticsPage.breadcrumb.home')} / {t('diagnosticsPage.breadcrumb.services')} / {t('diagnosticsPage.breadcrumb.diagnostics')}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {t('diagnosticsPage.hero.title')}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {t('diagnosticsPage.hero.subtitle')}
            </p>

            <Button size="lg" onClick={onBookingClick} className="bg-accent hover:bg-accent/90 text-white px-8 py-6 text-lg">
              {t('diagnosticsPage.bookDiagnostics')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {services.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Search className="w-10 h-10 text-accent mb-4" />
                  <h3 className="font-bold text-xl mb-2">{service.name}</h3>
                  <p className="text-muted-foreground mb-4">{service.desc}</p>
                  <div className="text-accent font-semibold text-lg mb-4">{service.price}</div>
                  <Button className="w-full" onClick={onBookingClick}>
                    {t('diagnosticsPage.book')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">
              {t('diagnosticsPage.faqTitle')}
            </h2>
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-2">{item.q}</h3>
                    <p className="text-muted-foreground">{item.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-accent text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('diagnosticsPage.footerTitle')}
            </h2>
            <p className="text-white/90 mb-8 text-lg">
              {t('diagnosticsPage.footerSubtitle')}
            </p>
            <Button size="lg" variant="secondary" onClick={onBookingClick} className="px-8 py-6 text-lg">
              {t('diagnosticsPage.bookNow')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
