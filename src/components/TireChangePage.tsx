import React from 'react';
import { useLanguage } from './LanguageContext';
import { motion } from 'motion/react';
import { Wrench, Clock, Euro, CheckCircle2, ArrowRight, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface TireChangePageProps {
  onBookingClick: () => void;
}

export function TireChangePage({ onBookingClick }: TireChangePageProps) {
  const { language } = useLanguage();

  const services = [
    {
      name: language === 'fi' ? 'Henkilöauto' : 'Passenger Car',
      desc: language === 'fi' ? '4 rengasta, tasapainotus, ilmanpaine' : '4 tires, balancing, air pressure',
      price: '[TBD]',
      duration: '[TBD] min',
    },
    {
      name: language === 'fi' ? 'Maasturi / SUV' : 'SUV',
      desc: language === 'fi' ? 'Suuremmat renkaat, tasapainotus' : 'Larger tires, balancing',
      price: '[TBD]',
      duration: '[TBD] min',
    },
    {
      name: language === 'fi' ? 'Pakettiauto' : 'Van',
      desc: language === 'fi' ? 'Raskaiden ajoneuvojen renkaat' : 'Heavy vehicle tires',
      price: '[TBD]',
      duration: '[TBD] min',
    },
  ];

  const whatsIncluded = [
    language === 'fi' ? 'Renkaiden vaihto (4 kpl)' : 'Tire change (4 pcs)',
    language === 'fi' ? 'Tasapainotus' : 'Wheel balancing',
    language === 'fi' ? 'Ilmanpaineen tarkistus ja säätö' : 'Air pressure check and adjustment',
    language === 'fi' ? 'Visuaalinen tarkastus' : 'Visual inspection',
    language === 'fi' ? 'TPMS-sensoritarkastus (jos saatavilla)' : 'TPMS sensor check (if available)',
    language === 'fi' ? 'Vanneruuvien kiristys oikeaan momenttiin' : 'Lug nut tightening to proper torque',
  ];

  const faqItems = [
    {
      q: language === 'fi' ? 'Kuinka kauan renkaanvaihto kestää?' : 'How long does tire change take?',
      a: language === 'fi'
        ? 'Tyypillinen renkaanvaihto kestää noin [TBD] minuuttia sisältäen tasapainotuksen ja ilmanpaineen tarkistuksen.'
        : 'A typical tire change takes about [TBD] minutes including balancing and air pressure check.',
    },
    {
      q: language === 'fi' ? 'Milloin minun pitäisi vaihtaa talvi- ja kesärenkaaseen?' : 'When should I change to winter/summer tires?',
      a: language === 'fi'
        ? 'Suosittelemme talvirenkaiden vaihtoa lokakuussa ja kesärenkaiden vaihtoa huhtikuussa Helsingin ilmastossa.'
        : 'We recommend changing to winter tires in October and summer tires in April for Helsinki\'s climate.',
    },
    {
      q: language === 'fi' ? 'Tarjoatteko rengassäilytystä?' : 'Do you offer tire storage?',
      a: language === 'fi'
        ? 'Kyllä! Rengashotellipalvelumme säilyttää renkaasi turvallisesti optimaalisissa olosuhteissa. Katso lisää Rengashotelli-sivulta.'
        : 'Yes! Our tire hotel service stores your tires safely in optimal conditions. See more on our Tire Hotel page.',
    },
    {
      q: language === 'fi' ? 'Tarkistatteko renkaidenkunnon?' : 'Do you check tire condition?',
      a: language === 'fi'
        ? 'Kyllä, suoritamme visuaalisen tarkastuksen jokaiselle renkaalle ja ilmoitamme sinulle, jos huomaamme kulumista tai vaurioita.'
        : 'Yes, we perform a visual inspection of each tire and inform you if we notice wear or damage.',
    },
    {
      q: language === 'fi' ? 'Voinko tuoda omat renkaat?' : 'Can I bring my own tires?',
      a: language === 'fi'
        ? 'Kyllä, voit tuoda omat renkaat. Tarkistamme niiden kunnon ennen asennusta turvallisuussyistä.'
        : 'Yes, you can bring your own tires. We\'ll check their condition before mounting for safety reasons.',
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
              {language === 'fi' ? 'Etusivu' : 'Home'} / {language === 'fi' ? 'Palvelut' : 'Services'} / {language === 'fi' ? 'Renkaanvaihto' : 'Tire Change'}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              {language === 'fi' 
                ? 'Renkaanvaihto Helsingissä'
                : 'Tire Change in Helsinki'}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {language === 'fi'
                ? 'Nopea ja asiantunteva renkaanvaihtopalvelu kausivaihdoille'
                : 'Fast and expert tire change service for seasonal swaps'}
            </p>

            <Button
              size="lg"
              onClick={onBookingClick}
              className="bg-accent hover:bg-accent/90 text-white px-8 py-6 text-lg"
            >
              {language === 'fi' ? 'Varaa renkaanvaihto' : 'Book Tire Change'}
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
                {language === 'fi' ? 'Mitä renkaanvaihto sisältää?' : 'What\'s Included?'}
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
              {language === 'fi' ? 'Hinnoittelu' : 'Pricing'}
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
                      {language === 'fi' ? 'Varaa' : 'Book'}
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
                {language === 'fi' ? 'Usein kysytyt kysymykset' : 'Frequently Asked Questions'}
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
              {language === 'fi' 
                ? 'Valmis vaihtamaan renkaat?'
                : 'Ready to Change Your Tires?'}
            </h2>
            <p className="text-white/90 mb-8 text-lg">
              {language === 'fi'
                ? 'Varaa aikasi nyt – kausivaihdot täyttyvät nopeasti'
                : 'Book now – seasonal changes fill up fast'}
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={onBookingClick}
              className="px-8 py-6 text-lg"
            >
              {language === 'fi' ? 'Varaa renkaanvaihto' : 'Book Tire Change'}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
