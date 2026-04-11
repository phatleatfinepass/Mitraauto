import React from 'react';
import { useLanguage } from './LanguageContext';
import { motion } from 'motion/react';
import { Wrench, Clock, Euro, CheckCircle2, ArrowRight, Shield, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface CarServicePageProps {
  onBookingClick: () => void;
}

export function CarServicePage({ onBookingClick }: CarServicePageProps) {
  const { language } = useLanguage();

  const services = [
    {
      name: language === 'fi' ? 'Perushuolto' : 'Basic Service',
      desc: language === 'fi' 
        ? 'Öljynvaihto, suodattimet, perustutkastus'
        : 'Oil change, filters, basic inspection',
      price: '[TBD]',
      duration: '[TBD] min',
    },
    {
      name: language === 'fi' ? 'Iso huolto' : 'Major Service',
      desc: language === 'fi'
        ? 'Kattava huolto, kaikki nesteet, jarrujen tarkastus'
        : 'Comprehensive service, all fluids, brake check',
      price: '[TBD]',
      duration: '[TBD] min',
    },
    {
      name: language === 'fi' ? 'Kausihuolto' : 'Seasonal Service',
      desc: language === 'fi'
        ? 'Valmistautuminen talveen tai kesään'
        : 'Preparation for winter or summer',
      price: '[TBD]',
      duration: '[TBD] min',
    },
    {
      name: language === 'fi' ? 'Ilmastointihuolto' : 'AC Service',
      desc: language === 'fi'
        ? 'Ilmastointijärjestelmän puhdistus ja huolto'
        : 'AC system cleaning and service',
      price: '[TBD]',
      duration: '[TBD] min',
    },
  ];

  const benefits = [
    {
      icon: Shield,
      title: language === 'fi' ? 'Sertifioidut asentajat' : 'Certified Technicians',
      desc: language === 'fi' 
        ? 'Ammattitaitoiset mekaanikkot kaikille automerkeille'
        : 'Skilled mechanics for all car brands',
    },
    {
      icon: CheckCircle2,
      title: language === 'fi' ? 'Alkuperäiset varaosat' : 'Genuine Parts',
      desc: language === 'fi'
        ? 'Laadukkaita osia luotettavilta toimittajilta'
        : 'Quality parts from trusted suppliers',
    },
    {
      icon: Clock,
      title: language === 'fi' ? 'Nopea palvelu' : 'Fast Service',
      desc: language === 'fi'
        ? 'Tehokas läpimenoaika ilman laatutinkimistä'
        : 'Efficient turnaround without compromising quality',
    },
    {
      icon: Star,
      title: language === 'fi' ? 'Tyytyväisyystakuu' : 'Satisfaction Guarantee',
      desc: language === 'fi'
        ? '100% tyytyväisyys tai rahat takaisin'
        : '100% satisfaction or money back',
    },
  ];

  const whatsIncluded = [
    language === 'fi' ? 'Täydellinen ajoneuvon tarkastus' : 'Complete vehicle inspection',
    language === 'fi' ? 'Öljynvaihto ja suodatinvaihto' : 'Oil and filter change',
    language === 'fi' ? 'Nesteiden täydennys' : 'Fluid top-up',
    language === 'fi' ? 'Jarrujen tarkastus' : 'Brake inspection',
    language === 'fi' ? 'Renkaidenpaineen tarkistus' : 'Tire pressure check',
    language === 'fi' ? 'Valojen tarkastus' : 'Light inspection',
    language === 'fi' ? 'Akun testaus' : 'Battery testing',
    language === 'fi' ? 'Yksityiskohtainen huoltoraportti' : 'Detailed service report',
  ];

  const faqItems = [
    {
      q: language === 'fi' ? 'Kuinka usein autoni tarvitsee huoltoa?' : 'How often does my car need service?',
      a: language === 'fi'
        ? 'Tyypillisesti perushuolto suositellaan joka [TBD] kuukausi tai [TBD] km välein, kumpi tulee ensin. Tarkista valmistajan suositukset.'
        : 'Typically, basic service is recommended every [TBD] months or [TBD] km, whichever comes first. Check manufacturer recommendations.',
    },
    {
      q: language === 'fi' ? 'Säilyykö takuu?' : 'Will my warranty remain valid?',
      a: language === 'fi'
        ? 'Kyllä, käytämme valmistajan spesifikaatioiden mukaisia osia ja menetelmiä, joten takuusi pysyy voimassa.'
        : 'Yes, we use manufacturer-spec parts and procedures, so your warranty remains valid.',
    },
    {
      q: language === 'fi' ? 'Voinko odottaa huollon aikana?' : 'Can I wait during the service?',
      a: language === 'fi'
        ? 'Kyllä, meillä on mukava odotustila Wi-Fi:llä ja kahvilla. Voit myös jättää auton ja palata myöhemmin.'
        : 'Yes, we have a comfortable waiting area with Wi-Fi and coffee. You can also drop off and return later.',
    },
    {
      q: language === 'fi' ? 'Mitä tapahtuu jos löydätte lisäongelmia?' : 'What if you find additional issues?',
      a: language === 'fi'
        ? 'Otamme sinuun yhteyttä välittömästi ja selitämme ongelman, korjauskustannukset ja vaihtoehdot. Emme tee lisätöitä ilman hyväksyntääsi.'
        : 'We\'ll contact you immediately and explain the issue, repair cost, and options. We never do additional work without your approval.',
    },
    {
      q: language === 'fi' ? 'Onko huolto erilainen talvella ja kesällä?' : 'Is service different in winter and summer?',
      a: language === 'fi'
        ? 'Kyllä, kausihuolto valmistaa autosi Helsingin talveen (akku, jäähdytysneste, lämmittimet) tai kesään (ilmastointi, jäähdytysjärjestelmä).'
        : 'Yes, seasonal service prepares your car for Helsinki\'s winter (battery, coolant, heaters) or summer (AC, cooling system).',
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
              {language === 'fi' ? 'Etusivu' : 'Home'} / {language === 'fi' ? 'Palvelut' : 'Services'} / {language === 'fi' ? 'Autohuolto' : 'Car Service'}
            </div>

            {/* H1 - Helsinki REQUIRED (service detail = local intent) */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              {language === 'fi' 
                ? 'Autohuolto Helsingissä'
                : 'Car Service in Helsinki'}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {language === 'fi'
                ? 'Ammattitaitoinen ja luotettava autohuolto kaikille merkeille Helsingissä'
                : 'Professional and reliable car service for all brands in Helsinki'}
            </p>

            {/* Primary CTA */}
            <Button
              size="lg"
              onClick={onBookingClick}
              className="bg-accent hover:bg-accent/90 text-white px-8 py-6 text-lg"
            >
              {language === 'fi' ? 'Varaa huolto' : 'Book Service'}
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
                {language === 'fi' ? 'Mitä huolto sisältää?' : 'What\'s Included?'}
              </h2>
              <p className="text-muted-foreground text-lg">
                {language === 'fi'
                  ? 'Kattava huolto autosi pitämiseksi turvallisena ja tehokkaana'
                  : 'Comprehensive service to keep your car safe and efficient'}
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
              {language === 'fi' ? 'Huoltopaketit' : 'Service Packages'}
            </h2>
            <p className="text-muted-foreground text-lg">
              {language === 'fi'
                ? 'Valitse tarpeisiisi sopiva huoltopaketti'
                : 'Choose the service package that fits your needs'}
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
                        {language === 'fi' ? 'Varaa' : 'Book'}
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
              {language === 'fi' ? 'Miksi valita meidät?' : 'Why Choose Us?'}
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
                {language === 'fi' ? 'Usein kysytyt kysymykset' : 'Frequently Asked Questions'}
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
              {language === 'fi' 
                ? 'Valmis huoltamaan autosi?'
                : 'Ready to Service Your Car?'}
            </h2>
            <p className="text-white/90 mb-8 text-lg">
              {language === 'fi'
                ? 'Varaa aikasi nyt – se vie vain muutaman minuutin'
                : 'Book your appointment now – it only takes a few minutes'}
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={onBookingClick}
              className="px-8 py-6 text-lg"
            >
              {language === 'fi' ? 'Varaa huolto' : 'Book Service'}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
