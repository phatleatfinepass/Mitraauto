import React from 'react';
import { useLanguage } from '../../LanguageContext';
import { motion } from 'motion/react';
import { MapPin, Clock, Phone, Mail, Wrench, ArrowRight, Star, Award, Users, Shield } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';

interface HelsinkiPageProps {
  onBookingClick: () => void;
  onNavigate: (path: string) => void;
}

export function HelsinkiPage({ onBookingClick, onNavigate }: HelsinkiPageProps) {
  const { language } = useLanguage();

  const services = [
    {
      icon: Wrench,
      title: language === 'fi' ? 'Autohuolto' : 'Car Service',
      desc: language === 'fi' 
        ? 'Kattava huolto ja korjaus Helsingissä'
        : 'Comprehensive maintenance and repair in Helsinki',
      link: language === 'fi' ? '/palvelut/autohuolto' : '/en/services/car-service',
    },
    {
      icon: Wrench,
      title: language === 'fi' ? 'Renkaanvaihto' : 'Tire Change',
      desc: language === 'fi'
        ? 'Nopea ja asiantunteva renkaanvaihto'
        : 'Fast and expert tire change service',
      link: language === 'fi' ? '/palvelut/renkaanvaihto' : '/en/services/tire-change',
    },
    {
      icon: Wrench,
      title: language === 'fi' ? 'Rengashotelli' : 'Tire Hotel',
      desc: language === 'fi'
        ? 'Turvallinen rengassäilytys Helsingissä'
        : 'Secure tire storage in Helsinki',
      link: language === 'fi' ? '/palvelut/rengashotelli' : '/en/services/tire-hotel',
    },
    {
      icon: Wrench,
      title: language === 'fi' ? 'Vikadiagnostiikka' : 'Diagnostics',
      desc: language === 'fi'
        ? 'Nykyaikainen vikakoodien luku ja vianetsintä'
        : 'Modern error code reading and troubleshooting',
      link: language === 'fi' ? '/palvelut/vikadiagnostiikka' : '/en/services/diagnostics',
    },
  ];

  const whyHelsinki = [
    {
      icon: MapPin,
      title: language === 'fi' ? 'Keskeinen sijainti' : 'Central Location',
      desc: language === 'fi'
        ? 'Hankasuontie 5, helppo pääsy autolla ja julkisilla'
        : 'Hankasuontie 5, easy access by car and public transport',
    },
    {
      icon: Users,
      title: language === 'fi' ? 'Paikalliset asiantuntijat' : 'Local Experts',
      desc: language === 'fi'
        ? 'Tiedämme Helsingin olosuhteet ja kuljettajien tarpeet'
        : 'We know Helsinki conditions and drivers\' needs',
    },
    {
      icon: Award,
      title: language === 'fi' ? 'Luotettu kumppani' : 'Trusted Partner',
      desc: language === 'fi'
        ? 'Yli [TBD] tyytyväistä asiakasta Helsingissä'
        : 'Over [TBD] satisfied customers in Helsinki',
    },
    {
      icon: Shield,
      title: language === 'fi' ? 'Laadukas palvelu' : 'Quality Service',
      desc: language === 'fi'
        ? 'Sertifioidut asentajat ja modernit laitteet'
        : 'Certified technicians and modern equipment',
    },
  ];

  const stats = [
    {
      value: '[TBD]',
      label: language === 'fi' ? 'Vuotta Helsingissä' : 'Years in Helsinki',
    },
    {
      value: '[TBD]+',
      label: language === 'fi' ? 'Tyytyväistä asiakasta' : 'Happy Customers',
    },
    {
      value: '4.8★',
      label: language === 'fi' ? 'Keskiarvio' : 'Average Rating',
    },
    {
      value: '<24h',
      label: language === 'fi' ? 'Varausaika' : 'Booking Time',
    },
  ];

  const faqItems = [
    {
      q: language === 'fi' ? 'Missä te täsmälleen sijaitsette Helsingissä?' : 'Where exactly are you located in Helsinki?',
      a: language === 'fi'
        ? 'Olemme osoitteessa Hankasuontie 5, 00390 Helsinki. Helppo löytää autolla tai julkisilla kulkuneuvoilla.'
        : 'We\'re at Hankasuontie 5, 00390 Helsinki. Easy to find by car or public transport.',
    },
    {
      q: language === 'fi' ? 'Palveletteko koko Helsingin aluetta?' : 'Do you serve all of Helsinki?',
      a: language === 'fi'
        ? 'Kyllä, palvelemme asiakkaita koko Helsingin alueelta. Tarjoamme myös hätähinauspalvelua 24/7 Helsingin seudulla.'
        : 'Yes, we serve customers from all over Helsinki. We also offer 24/7 emergency towing in the Helsinki area.',
    },
    {
      q: language === 'fi' ? 'Onko pysäköinti helppoa?' : 'Is parking easy?',
      a: language === 'fi'
        ? 'Meillä on ilmainen pysäköinti paikan päällä asiakkaillemme. Ei stressiä pysäköinnistä!'
        : 'We have free on-site parking for our customers. No parking stress!',
    },
    {
      q: language === 'fi' ? 'Miten nopeasti saan aikaa?' : 'How quickly can I get an appointment?',
      a: language === 'fi'
        ? 'Tyypillisesti voimme tarjota aikaa jo [TBD] päivän sisällä. Kiireellisissä tapauksissa soita meille.'
        : 'Typically we can offer an appointment within [TBD] days. For urgent cases, call us directly.',
    },
    {
      q: language === 'fi' ? 'Sopivatko palvelunne Helsingin talviolosuhteisiin?' : 'Are your services suitable for Helsinki winter conditions?',
      a: language === 'fi'
        ? 'Ehdottomasti! Erikoistuimme talvirenkaisiin, talvihuoltoon ja Helsingin haastaviin talviolosuhteisiin.'
        : 'Absolutely! We specialize in winter tires, winter maintenance, and Helsinki\'s challenging winter conditions.',
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
              {language === 'fi' ? 'Etusivu' : 'Home'} / {language === 'fi' ? 'Helsinki' : 'Helsinki'}
            </div>

            {/* H1 - Helsinki REQUIRED in H1 (local intent) */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              {language === 'fi' 
                ? 'Autohuolto ja rengaspalvelut Helsingissä'
                : 'Car Service and Tire Services in Helsinki'}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {language === 'fi'
                ? 'Luotettava paikallinen kumppani kaikille autohuoltotarpeillesi Helsingissä'
                : 'Your trusted local partner for all car service needs in Helsinki'}
            </p>

            {/* Primary CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={onBookingClick}
                className="bg-accent hover:bg-accent/90 text-white px-8 py-6 text-lg"
              >
                {language === 'fi' ? 'Varaa aika' : 'Book Now'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => onNavigate(language === 'fi' ? '/yhteystiedot' : '/en/contact')}
                className="px-8 py-6 text-lg"
              >
                {language === 'fi' ? 'Ota yhteyttä' : 'Contact Us'}
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
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</div>
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
              {language === 'fi' 
                ? 'Miksi valita Mitra Auto Helsingissä?'
                : 'Why Choose Mitra Auto in Helsinki?'}
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              {language === 'fi'
                ? 'Paikallinen asiantuntemus yhdistettynä ammattitaitoon ja moderniin teknologiaan'
                : 'Local expertise combined with professionalism and modern technology'}
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
              {language === 'fi' 
                ? 'Palvelumme Helsingissä'
                : 'Our Services in Helsinki'}
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              {language === 'fi'
                ? 'Kattavat autohuoltopalvelut helsinkiläisille kuljettajille'
                : 'Comprehensive car services for Helsinki drivers'}
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
                          {language === 'fi' ? 'Lue lisää' : 'Learn more'}
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
                {language === 'fi' ? 'Löydä meidät Helsingistä' : 'Find Us in Helsinki'}
              </h2>
              <p className="text-muted-foreground text-lg">
                {language === 'fi'
                  ? 'Hankasuontie 5, 00390 Helsinki'
                  : 'Hankasuontie 5, 00390 Helsinki'}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="aspect-video bg-muted rounded-lg overflow-hidden mb-8"
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1983.4906905345447!2d24.9077!3d60.2055!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNjDCsDEyJzE5LjgiTiAyNMKwNTQnMjcuNyJF!5e0!3m2!1sen!2sfi!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={language === 'fi' ? 'Mitra Auto Helsinki' : 'Mitra Auto Helsinki'}
              />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <MapPin className="w-8 h-8 text-accent mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">{language === 'fi' ? 'Osoite' : 'Address'}</h3>
                  <p className="text-muted-foreground text-sm">Hankasuontie 5<br />00390 Helsinki</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="w-8 h-8 text-accent mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">{language === 'fi' ? 'Aukioloajat' : 'Opening Hours'}</h3>
                  <p className="text-muted-foreground text-sm">
                    {language === 'fi' ? 'Ma–Pe: 9:00–18:00' : 'Mon–Fri: 9:00–18:00'}<br />
                    {language === 'fi' ? 'La: 10:00–17:00' : 'Sat: 10:00–17:00'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Phone className="w-8 h-8 text-accent mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">{language === 'fi' ? 'Yhteystiedot' : 'Contact'}</h3>
                  <p className="text-muted-foreground text-sm">[TBD]<br />[TBD]</p>
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
            transition={{ duration: 0.6, delay: 1.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {language === 'fi' 
                ? 'Valmis kokemaan parasta autohuoltoa Helsingissä?'
                : 'Ready to Experience the Best Car Service in Helsinki?'}
            </h2>
            <p className="text-white/90 mb-8 text-lg">
              {language === 'fi'
                ? 'Varaa aikasi nyt ja koe ero'
                : 'Book your appointment now and experience the difference'}
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={onBookingClick}
              className="px-8 py-6 text-lg"
            >
              {language === 'fi' ? 'Varaa aika' : 'Book Now'}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
