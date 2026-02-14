import React from 'react';
import { useLanguage } from './LanguageContext';
import { motion } from 'motion/react';
import { Search, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface DiagnosticsPageProps {
  onBookingClick: () => void;
}

export function DiagnosticsPage({ onBookingClick }: DiagnosticsPageProps) {
  const { language } = useLanguage();

  const services = [
    {
      name: language === 'fi' ? 'Vikakoodien luku' : 'Error Code Reading',
      desc: language === 'fi' ? 'Nopea vikakoodien diagnoosi' : 'Quick error code diagnosis',
      price: '[TBD] €',
    },
    {
      name: language === 'fi' ? 'Perusteellinen vianetsintä' : 'Comprehensive Diagnostics',
      desc: language === 'fi' ? 'Syvällinen analyysi ja raportti' : 'In-depth analysis and report',
      price: '[TBD] €',
    },
  ];

  const faqItems = [
    {
      q: language === 'fi' ? 'Mitä diagnostiikka sisältää?' : 'What does diagnostics include?',
      a: language === 'fi'
        ? 'Luemme auton tietokoneelta vikakoodit, analysoimme ongelmat ja annamme yksityiskohtaisen raportin löydöksistä.'
        : 'We read error codes from your car\'s computer, analyze issues, and provide a detailed report of findings.',
    },
    {
      q: language === 'fi' ? 'Kuinka kauan diagnostiikka kestää?' : 'How long does diagnostics take?',
      a: language === 'fi'
        ? 'Perus vikakoodien luku kestää noin [TBD] minuuttia. Perusteellinen vianetsintä voi kestää [TBD] tuntia.'
        : 'Basic error code reading takes about [TBD] minutes. Comprehensive diagnostics may take [TBD] hours.',
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
              {language === 'fi' ? 'Etusivu' : 'Home'} / {language === 'fi' ? 'Palvelut' : 'Services'} / {language === 'fi' ? 'Vikadiagnostiikka' : 'Diagnostics'}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {language === 'fi' ? 'Vikadiagnostiikka Helsingissä' : 'Diagnostics in Helsinki'}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {language === 'fi'
                ? 'Nykyaikainen vikakoodien luku ja vianetsintä'
                : 'Modern error code reading and troubleshooting'}
            </p>

            <Button size="lg" onClick={onBookingClick} className="bg-accent hover:bg-accent/90 text-white px-8 py-6 text-lg">
              {language === 'fi' ? 'Varaa diagnostiikka' : 'Book Diagnostics'}
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
                    {language === 'fi' ? 'Varaa' : 'Book'}
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
              {language === 'fi' ? 'Usein kysytyt kysymykset' : 'Frequently Asked Questions'}
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
              {language === 'fi' ? 'Valmis selvittämään ongelman?' : 'Ready to Find the Issue?'}
            </h2>
            <p className="text-white/90 mb-8 text-lg">
              {language === 'fi' ? 'Varaa diagnostiikka tänään' : 'Book diagnostics today'}
            </p>
            <Button size="lg" variant="secondary" onClick={onBookingClick} className="px-8 py-6 text-lg">
              {language === 'fi' ? 'Varaa nyt' : 'Book Now'}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
