import React from 'react';
import { useLanguage } from '../../LanguageContext';
import { motion } from 'motion/react';
import { MapPin, Phone, Mail, Clock, ArrowRight, MessageCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';

interface ContactPageProps {
  onBookingClick: () => void;
}

export function ContactPage({ onBookingClick }: ContactPageProps) {
  const { t, language } = useLanguage();

  const contactInfo = [
    {
      icon: MapPin,
      label: t('contact.address'),
      value: 'Hankasuontie 5\n00390 Helsinki',
      link: 'https://maps.google.com/?q=Hankasuontie+5,+00390+Helsinki',
    },
    {
      icon: Phone,
      label: t('contact.phone'),
      value: '[TBD]',
      link: 'tel:[TBD]',
    },
    {
      icon: Mail,
      label: t('contact.email'),
      value: '[TBD]',
      link: 'mailto:[TBD]',
    },
    {
      icon: Clock,
      label: t('contact.hours'),
      value: language === 'fi' 
        ? 'Ma–Pe: 9:00–18:00\nLa: 10:00–17:00\nSu: Suljettu'
        : 'Mon–Fri: 9:00–18:00\nSat: 10:00–17:00\nSun: Closed',
      link: null,
    },
  ];

  const faqItems = [
    {
      question: language === 'fi' ? 'Miten voin varata ajan?' : 'How can I book an appointment?',
      answer: language === 'fi' 
        ? 'Voit varata ajan verkossa klikkaamalla "Varaa aika" -painiketta tai soittamalla meille.'
        : 'You can book online by clicking the "Book Now" button or by calling us.',
    },
    {
      question: language === 'fi' ? 'Missä te sijaitsette?' : 'Where are you located?',
      answer: language === 'fi'
        ? 'Olemme Helsingissä osoitteessa Hankasuontie 5, 00390 Helsinki. Helppo pääsy autolla ja julkisilla.'
        : 'We are located in Helsinki at Hankasuontie 5, 00390 Helsinki. Easy access by car and public transport.',
    },
    {
      question: language === 'fi' ? 'Onko pysäköinti saatavilla?' : 'Is parking available?',
      answer: language === 'fi'
        ? 'Kyllä, meillä on ilmainen pysäköinti asiakkaille paikan päällä.'
        : 'Yes, we have free parking available for customers on-site.',
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
              {language === 'fi' ? 'Etusivu' : 'Home'} / {language === 'fi' ? 'Yhteystiedot' : 'Contact'}
            </div>

            {/* H1 - Helsinki in subtitle */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              {language === 'fi' ? 'Ota yhteyttä' : 'Get in Touch'}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {language === 'fi' 
                ? 'Palvelemme Helsingissä – olemme täällä auttamassa sinua'
                : 'Serving Helsinki – we\'re here to help you'}
            </p>

            {/* Primary CTA */}
            <Button
              size="lg"
              onClick={onBookingClick}
              className="bg-accent hover:bg-accent/90 text-white px-8 py-6 text-lg"
            >
              {language === 'fi' ? 'Varaa aika' : 'Book Now'}
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
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1983.4906905345447!2d24.9077!3d60.2055!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNjDCsDEyJzE5LjgiTiAyNMKwNTQnMjcuNyJF!5e0!3m2!1sen!2sfi!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={language === 'fi' ? 'Mitra Auto sijainti' : 'Mitra Auto location'}
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
                {language === 'fi' ? 'Usein kysytyt kysymykset' : 'Frequently Asked Questions'}
              </h2>
              <p className="text-muted-foreground text-lg">
                {language === 'fi' 
                  ? 'Vastauksia yleisimpiin kysymyksiin'
                  : 'Answers to common questions'}
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
              {language === 'fi' ? 'Valmis aloittamaan?' : 'Ready to Get Started?'}
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
              {language === 'fi' ? 'Varaa aika' : 'Book Now'}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
