import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ContactSection } from './ContactSection';
import { motion } from 'motion/react';
import { 
  Calendar,
  Thermometer,
  FileText,
  Lock,
  RefreshCw,
  Car,
  Warehouse,
  CheckCircle2,
  Sparkles,
  Package,
  ArrowRight,
  Check
} from 'lucide-react';
import facilityImage from 'figma:asset/7a4460f78adaeb7811f555061adc7a3eb129dbf1.png';

interface TireHotelPageProps {
  onBookingClick: (serviceId: string | null) => void;
}

export function TireHotelPage({ onBookingClick }: TireHotelPageProps) {
  const { t, language } = useLanguage();

  // Benefits data
  const benefits = [
    {
      icon: Thermometer,
      title: language === 'fi' ? 'Sisäsäilytys' : 'Indoor storage',
      description: language === 'fi' ? 'Renkaat säilytetään sisätiloissa, poissa UV-valosta ja ankarista sääolosuhteista' : 'Tires stored indoor, away from UV light and harsh weather condition'
    },
    {
      icon: FileText,
      title: language === 'fi' ? 'Merkitty & seurattu' : 'Labeled & tracked',
      description: language === 'fi' ? 'Jokainen rengassarja merkitään ja seurataan asiakaskohtaisesti' : 'Each tire set is labeled and tracked per customer'
    },
    {
      icon: Lock,
      title: language === 'fi' ? 'Turvallinen & vakuutettu' : 'Secure & insured',
      description: language === 'fi' ? 'Valvottu tila kattavalla vakuutusturvalla' : 'Monitored facility with comprehensive insurance'
    },
    {
      icon: RefreshCw,
      title: language === 'fi' ? 'Kausivaihtoa saatavilla' : 'Seasonal swap available',
      description: language === 'fi' ? 'Tilaa rengasvaihto ja asennus milloin tahansa' : 'Schedule tire change and installation anytime'
    }
  ];

  // How it works steps
  const steps = [
    {
      icon: Car,
      title: language === 'fi' ? 'Aja korjaamolle' : 'Drive to the Garage',
      description: language === 'fi' ? 'Aja autosi korjaamollemme' : 'Drive your car to our shop'
    },
    {
      icon: Warehouse,
      title: language === 'fi' ? 'Säilytämme turvallisesti' : 'We Store Securely',
      description: language === 'fi' ? 'Renkaat säilytetään turvallisesti poissa sääolosuhteista' : 'Tires stored safe and secure away from weather condition'
    },
    {
      icon: Calendar,
      title: language === 'fi' ? 'Valmiina kun haluat' : 'Ready When You Are',
      description: language === 'fi' ? 'Varaa asennus milloin tahansa sopivana ajankohtana' : 'Schedule installation any time that suits you'
    }
  ];

  // Pricing plans
  const pricingPlans = [
    {
      name: language === 'fi' ? 'Säilytys' : 'Storage',
      price: '50',
      period: language === 'fi' ? 'kausi' : 'season',
      description: language === 'fi' ? 'Perussäilytys kaudeksi' : 'Basic storage for the season',
      features: [
        language === 'fi' ? 'Turvallinen säilytys' : 'Safe storage',
        language === 'fi' ? 'Kulutuspinnan tarkastus' : 'Tread inspection',
        language === 'fi' ? 'Ilmainen muistutus' : 'Free reminder',
        language === 'fi' ? 'Vakuutusturva' : 'Insurance coverage'
      ],
      highlighted: false
    },
    {
      name: language === 'fi' ? 'Kausivaihtopaketti' : 'Seasonal Swap',
      price: '45',
      period: language === 'fi' ? 'vaihto' : 'swap',
      description: language === 'fi' ? 'Ammattimainen rengasvaihto' : 'Professional tire change',
      features: [
        language === 'fi' ? 'Renkaiden asennus' : 'Tire mounting',
        language === 'fi' ? 'Teknikko tarkastus' : 'Technician inspection',
        language === 'fi' ? 'Paineen säätö' : 'Pressure adjustment',
        language === 'fi' ? 'Visuaalinen tarkastus' : 'Visual inspection'
      ],
      highlighted: false
    },
    {
      name: language === 'fi' ? 'Hotellipaketti' : 'Hotel Package',
      price: '90',
      period: language === 'fi' ? 'kausi' : 'season',
      description: language === 'fi' ? 'Säilytys + kausivaihtopaketti' : 'Storage + seasonal swap',
      features: [
        language === 'fi' ? 'Kaikki säilytysedut' : 'All storage benefits',
        language === 'fi' ? 'Kausivaihtopaketti sisältyy' : 'Seasonal swap included',
        language === 'fi' ? 'Säästä €5 vs. erikseen' : 'Save €5 vs separate',
        language === 'fi' ? 'Ensisijainen varaus' : 'Priority booking'
      ],
      highlighted: true
    }
  ];

  // FAQ items
  const faqItems = [
    {
      question: language === 'fi' ? 'Kuinka kauan voin säilyttää renkaita?' : 'How long can I store my tires?',
      answer: language === 'fi' 
        ? 'Renkaat voidaan säilyttää koko kauden ajan (yleensä 6 kuukautta). Tarjoamme myös pitkäaikaisempia säilytysvaihtoehtoja tarvittaessa.'
        : 'Tires can be stored for the entire season (typically 6 months). We also offer longer-term storage options if needed.'
    },
    {
      question: language === 'fi' ? 'Voinko säilyttää myös vanteet?' : 'Can I store rims too?',
      answer: language === 'fi'
        ? 'Kyllä! Säilytämme sekä renkaat että vanteet. Suosittelemme vanteilla varustettujen renkaiden säilyttämistä pystyasennossa niiden kunnon säilyttämiseksi.'
        : 'Yes! We store both tires and rims. We recommend storing tires with rims in an upright position to maintain their condition.'
    },
    {
      question: language === 'fi' ? 'Onko säilytys vakuutettu?' : 'Is the storage insured?',
      answer: language === 'fi'
        ? 'Kyllä, kaikki säilytettävät renkaat ovat vakuutettuja varkauksia ja vahinkoja vastaan. Kattava vakuutus sisältyy kaikkiin paketteihin.'
        : 'Yes, all stored tires are insured against theft and damage. Comprehensive coverage is included in all packages.'
    },
    {
      question: language === 'fi' ? 'Miten haen renkaat takaisin?' : 'How do I retrieve my tires?',
      answer: language === 'fi'
        ? 'Varaa aika online tai soita meille. Premium-asiakkaat saavat ilmaisen toimituksen. Voimme myös asentaa renkaat suoraan autoon kun haet ne.'
        : 'Book a time online or call us. Premium customers get free delivery. We can also install the tires directly on your car when you pick them up.'
    },
    {
      question: language === 'fi' ? 'Mitä tapahtuu, jos renkaat vaurioituvat säilytyksen aikana?' : 'What happens if tires get damaged during storage?',
      answer: language === 'fi'
        ? 'Jos renkaat vaurioituvat säilytyksen aikana, vakuutuksemme kattaa korvauskustannukset täysin. Tarkastamme myös kaikki renkaat ennen säilytystä ja palautusta.'
        : 'If tires are damaged during storage, our insurance covers replacement costs in full. We also inspect all tires before storage and upon return.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-orange-950 text-white py-20 md:py-32">
        {/* Background overlay image */}
        <div className="absolute inset-0 opacity-20">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1591684391843-a16d792a9720?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGFja2VkJTIwdGlyZXMlMjBzdG9yYWdlfGVufDF8fHx8MTc2MjI0MTk5N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Tire storage background"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950/90 via-gray-900/95 to-gray-900/90" />
        
        {/* Animated gradient blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse animation-delay-2000" />

        <div className="container mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-accent/20 text-orange-300 border-accent/30 hover:bg-accent/30">
              <Warehouse className="mr-2 h-4 w-4" />
              {language === 'fi' ? 'Premium-säilytyspalvelu' : 'Premium Storage Service'}
            </Badge>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl tracking-tight mb-6">
              {t('nav.tireHotel')}
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto">
              {language === 'fi' 
                ? 'Säilytä renkaasi turvallisesti, kausi toisensa jälkeen.'
                : 'Store your tires safely, season after season.'}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => onBookingClick('Tire Hotel')}
                className="bg-accent hover:bg-accent/90 text-white rounded-full h-14 px-10 gap-2 shadow-lg shadow-accent/30 hover:shadow-accent/50 transition-all"
              >
                <Calendar className="h-5 w-5" />
                {language === 'fi' ? 'Varaa säilytys' : 'Book Storage'}
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="rounded-full h-14 px-10 border-white/20 text-white hover:bg-white/10 bg-[rgb(110,110,115)]"
                onClick={() => {
                  document.getElementById('what-is-tire-hotel')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {language === 'fi' ? 'Lue lisää' : 'Learn More'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What Is Tire Hotel Section */}
      <section id="what-is-tire-hotel" className="py-20 md:py-32 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src={facilityImage}
                  alt="Modern tire storage facility"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-6 -right-6 bg-accent text-white p-6 rounded-2xl shadow-xl">
                <div className="text-center">
                  <div className="text-3xl font-bold">500+</div>
                  <div className="text-sm opacity-90">
                    {language === 'fi' ? 'Tyytyväistä asiakasta' : 'Happy Customers'}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl tracking-tight mb-6">
                {language === 'fi' ? 'Mikä on rengashotelli?' : 'What Is a Tire Hotel?'}
              </h2>
              
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {language === 'fi'
                  ? 'Rengashotellimme on ilmastoitu säilytyspalvelu, jossa renkaasi pysyvät suojattuina, seurattuna ja valmiina seuraavaa kautta varten. Ammattilaiset huolehtivat, että renkaasi säilyvät optimaalisessa kunnossa ympäri vuoden.'
                  : 'Our Tire Hotel is a climate-controlled storage service where your tires stay protected, tracked, and ready for the next season. Professionals ensure your tires remain in optimal condition year-round.'}
              </p>

              {/* Benefits grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                        <benefit.icon className="h-6 w-6 text-accent" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl tracking-tight mb-4">
              {language === 'fi' ? 'Miten se toimii' : 'How It Works'}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {language === 'fi'
                ? 'Yksinkertainen kolmivaiheinen prosessi renkaiden turvalliseen säilytykseen'
                : 'Simple three-step process for secure tire storage'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection lines - desktop only */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent" />
            
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <Card className="p-8 text-center hover:shadow-lg transition-all bg-gradient-to-br from-background to-secondary/30 border-border/50">
                  {/* Step number */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center font-bold text-lg shadow-lg">
                    {index + 1}
                  </div>
                  
                  {/* Icon */}
                  <div className="w-20 h-20 mx-auto mb-6 mt-4 rounded-2xl bg-accent/10 flex items-center justify-center">
                    <step.icon className="h-10 w-10 text-accent" />
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-secondary/20 to-background">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl tracking-tight mb-4">
              {language === 'fi' ? 'Säilytyspaketit' : 'Storage Plans'}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {language === 'fi'
                ? 'Valitse tarpeisiisi sopiva paketti. Kaikki hinnat sisältävät ALV:n.'
                : 'Choose the plan that fits your needs. All prices include VAT.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <Card className={`p-8 relative overflow-hidden transition-all hover:shadow-2xl h-full flex flex-col ${
                  plan.highlighted 
                    ? 'border-accent border-2 shadow-lg shadow-accent/20 bg-gradient-to-br from-orange-50 to-background dark:from-orange-950/20 dark:to-background' 
                    : 'hover:border-accent/50'
                }`}>
                  {/* Most Popular Badge */}
                  {plan.highlighted && (
                    <div className="absolute top-0 right-0 bg-accent text-white text-xs font-semibold px-4 py-1 rounded-bl-lg">
                      {language === 'fi' ? 'Suosituin' : 'Most Popular'}
                    </div>
                  )}

                  {/* Gradient blob */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl" />
                  
                  <div className="relative flex flex-col flex-1">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                    
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold">€{plan.price}</span>
                        <span className="text-muted-foreground">/ {plan.period}</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => onBookingClick(plan.name)}
                      className={`w-full mb-8 rounded-full h-12 ${
                        plan.highlighted
                          ? 'bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/30'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      {language === 'fi' ? 'Varaa nyt' : 'Book Now'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>

                    {/* Features */}
                    <div className="space-y-3 flex-1">
                      {plan.features.map((feature, fIndex) => (
                        <div key={fIndex} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto max-w-4xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl tracking-tight mb-4">
              {language === 'fi' ? 'Usein kysytyt kysymykset' : 'Frequently Asked Questions'}
            </h2>
            <p className="text-lg text-muted-foreground">
              {language === 'fi'
                ? 'Vastauksia yleisimpiin kysymyksiin rengashotellista'
                : 'Answers to common questions about our Tire Hotel'}
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Bottom Booking CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-orange-950 to-gray-900 text-white py-20 md:py-24">
        {/* Car silhouette overlay */}
        <div className="absolute inset-0 opacity-5">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1720095326582-272eed78fa40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwZ2FyYWdlJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzYyMjQxOTk4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Premium garage"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-950/95 via-gray-900/90 to-orange-950/95" />
        
        {/* Animated blobs */}
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse animation-delay-2000" />

        <div className="container mx-auto max-w-4xl px-6 lg:px-8 relative z-10 text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-6 text-orange-400" />
          
          <h2 className="text-4xl md:text-5xl tracking-tight mb-4">
            {language === 'fi' ? 'Valmis säilyttämään renkaasi?' : 'Ready to Store Your Tires?'}
          </h2>
          
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            {language === 'fi'
              ? 'Varaa paikkasi rengashotellista jo tänään. Nopea, turvallinen ja vaivaton.'
              : 'Reserve your spot in our Tire Hotel today. Fast, secure, and hassle-free.'}
          </p>
          
          <Button
            size="lg"
            onClick={() => onBookingClick('Tire Hotel')}
            className="bg-accent hover:bg-accent/90 text-white rounded-full h-14 px-12 gap-2 shadow-lg shadow-accent/30 hover:shadow-accent/50 transition-all text-lg"
          >
            <Calendar className="h-5 w-5" />
            {language === 'fi' ? 'Varaa nyt' : 'Book Now'}
          </Button>
        </div>
      </section>

      {/* Contact & Location Section */}
      <ContactSection />
    </div>
  );
}
