import React from 'react';
import { useLanguage } from './LanguageContext';
import { motion } from 'motion/react';
import { Droplet, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface CarWashPageProps {
  onBookingClick: () => void;
}

export function CarWashPage({ onBookingClick }: CarWashPageProps) {
  const { language } = useLanguage();

  const services = [
    {
      name: language === 'fi' ? 'Perus käsipesu' : 'Basic Hand Wash',
      desc: language === 'fi' ? 'Ulkopesu ja kuivaus' : 'Exterior wash and dry',
      price: '[TBD] €',
    },
    {
      name: language === 'fi' ? 'Täyspesu' : 'Full Wash',
      desc: language === 'fi' ? 'Ulko- ja sisäpesu' : 'Exterior and interior wash',
      price: '[TBD] €',
    },
    {
      name: language === 'fi' ? 'Premium-pesu' : 'Premium Wash',
      desc: language === 'fi' ? 'Täyspesu + vahaus' : 'Full wash + waxing',
      price: '[TBD] €',
    },
  ];

  const faqItems = [
    {
      q: language === 'fi' ? 'Kuinka kauan autopesu kestää?' : 'How long does car wash take?',
      a: language === 'fi'
        ? 'Perus käsipesu kestää noin [TBD] minuuttia. Täyspesu kestää [TBD] minuuttia.'
        : 'Basic hand wash takes about [TBD] minutes. Full wash takes [TBD] minutes.',
    },
    {
      q: language === 'fi' ? 'Pesettekö käsin vai koneella?' : 'Do you wash by hand or machine?',
      a: language === 'fi'
        ? 'Kaikki pesut tehdään käsin laadukkailla tuotteilla autosi maalin suojaamiseksi.'
        : 'All washes are done by hand with quality products to protect your car\'s paint.',
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
              {language === 'fi' ? 'Etusivu' : 'Home'} / {language === 'fi' ? 'Palvelut' : 'Services'} / {language === 'fi' ? 'Autopesu' : 'Car Wash'}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {language === 'fi' ? 'Autopesu Helsingissä' : 'Car Wash in Helsinki'}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {language === 'fi'
                ? 'Ammattimainen käsipesu ja hoito autollesi'
                : 'Professional hand wash and care for your car'}
            </p>

            <Button size="lg" onClick={onBookingClick} className="bg-accent hover:bg-accent/90 text-white px-8 py-6 text-lg">
              {language === 'fi' ? 'Varaa autopesu' : 'Book Car Wash'}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {services.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Droplet className="w-10 h-10 text-accent mb-4" />
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
              {language === 'fi' ? 'Anna autosi loistaa' : 'Let Your Car Shine'}
            </h2>
            <p className="text-white/90 mb-8 text-lg">
              {language === 'fi' ? 'Varaa autopesu tänään' : 'Book a car wash today'}
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
