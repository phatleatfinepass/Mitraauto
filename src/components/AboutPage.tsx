import React, { useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ContactSection } from './ContactSection';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { motion } from 'motion/react';
import { 
  Target, 
  Shield, 
  Sparkles, 
  Heart,
  Wrench,
  Scale,
  Warehouse,
  Navigation
} from 'lucide-react';

interface AboutPageProps {
  onBookingClick: () => void;
  onNavigate: (path: string) => void;
}

export function AboutPage({ onBookingClick, onNavigate }: AboutPageProps) {
  const { t, language } = useLanguage();
  const [scrollY, setScrollY] = useState(0);

  // Parallax effect on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const coreValues = [
    {
      icon: Target,
      titleKey: 'about.values.precision.title',
      descKey: 'about.values.precision.desc',
      color: 'from-blue-500/20 to-blue-600/20',
      iconColor: 'text-blue-500',
      glowColor: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]'
    },
    {
      icon: Shield,
      titleKey: 'about.values.integrity.title',
      descKey: 'about.values.integrity.desc',
      color: 'from-emerald-500/20 to-emerald-600/20',
      iconColor: 'text-emerald-500',
      glowColor: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]'
    },
    {
      icon: Sparkles,
      titleKey: 'about.values.innovation.title',
      descKey: 'about.values.innovation.desc',
      color: 'from-purple-500/20 to-purple-600/20',
      iconColor: 'text-purple-500',
      glowColor: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]'
    },
    {
      icon: Heart,
      titleKey: 'about.values.care.title',
      descKey: 'about.values.care.desc',
      color: 'from-rose-500/20 to-rose-600/20',
      iconColor: 'text-rose-500',
      glowColor: 'hover:shadow-[0_0_30px_rgba(244,63,94,0.3)]'
    }
  ];

  const expertiseAreas = [
    {
      icon: Wrench,
      titleKey: 'about.expertise.tireServices.title',
      descKey: 'about.expertise.tireServices.desc',
    },
    {
      icon: Scale,
      titleKey: 'about.expertise.rimSelection.title',
      descKey: 'about.expertise.rimSelection.desc',
    },
    {
      icon: Navigation,
      titleKey: 'about.expertise.maintenance.title',
      descKey: 'about.expertise.maintenance.desc',
    },
    {
      icon: Warehouse,
      titleKey: 'about.expertise.tireHotel.title',
      descKey: 'about.expertise.tireHotel.desc',
    }
  ];

  const teamMembers = [
    { name: 'Mikko Virtanen', role: language === 'fi' ? 'Päämekaanikko' : 'Lead Mechanic' },
    { name: 'Anna Korhonen', role: language === 'fi' ? 'Palvelupäällikkö' : 'Service Manager' },
    { name: 'Jari Nieminen', role: language === 'fi' ? 'Rengasasiantuntija' : 'Tire Specialist' },
    { name: 'Laura Mäkinen', role: language === 'fi' ? 'Asiakaspalvelu' : 'Customer Service' },
  ];

  const partners = [
    { name: 'RengasDuo', description: language === 'fi' ? 'Rengastoimittaja' : 'Tire Supplier' },
    { name: 'Vannetukku', description: language === 'fi' ? 'Vannepartner' : 'Rim Partner' },
    { name: 'Paytrail', description: language === 'fi' ? 'Maksupalvelu' : 'Payment Service' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section - Dark with neon blue accent */}
      <section 
        className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom, #0B0D10 0%, #151A22 100%)'
        }}
      >
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#0B6BFF]/20 rounded-full blur-3xl animate-blob" />
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
        </div>

        <div className="container mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <h1 className="text-5xl lg:text-7xl tracking-tight text-white mb-6">
                {t('about.hero.headline')}
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                {t('about.hero.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  onClick={() => onNavigate('/services')}
                  className="bg-[#0B6BFF] hover:bg-[#0B6BFF]/90 text-white rounded-full h-14 px-8 shadow-[0_0_20px_rgba(11,107,255,0.4)] transition-all hover:shadow-[0_0_30px_rgba(11,107,255,0.6)]"
                >
                  {t('about.hero.exploreServices')}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    const contactSection = document.getElementById('contact-heading');
                    if (contactSection) {
                      contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/40 rounded-full h-14 px-8 backdrop-blur-sm"
                >
                  {t('about.hero.contactUs')}
                </Button>
              </div>
            </motion.div>

            {/* Right - Hero Image with Parallax */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
              style={{ transform: `translateY(${scrollY * 0.15}px)` }}
            >
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0B6BFF]/20 to-transparent z-10" />
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1549047608-55b2fd4b8427?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                  alt="Mitra Auto Service Garage"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Decorative glow */}
              <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-[#0B6BFF]/30 rounded-full blur-3xl -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl lg:text-5xl tracking-tight mb-6">
                {t('about.story.title')}
              </h2>
              <div className="h-1 w-20 bg-[#0B6BFF] rounded-full mb-8" />
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t('about.story.body')}
              </p>
              
              {/* Business Info */}
              <div className="mt-8 p-6 bg-secondary/50 rounded-2xl border border-border">
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('about.businessInfo.companyName')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('about.businessInfo.businessId')}: </span>
                    <span className="font-mono">3408833-8</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('contact.address')}: </span>
                    <span>Hankasuontie 5, 00390 Helsinki</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right - Workshop Image */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1675034743126-0f250a5fee51?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                  alt="Workshop Scene"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Values Section - Glass-morphism cards */}
      <section 
        className="py-24 lg:py-32 relative overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom, #0B0D10 0%, #151A22 100%)'
        }}
      >
        <div className="container mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl tracking-tight text-white mb-4">
              {t('about.values.title')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreValues.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card
                    className={`group relative p-8 bg-gradient-to-br ${value.color} backdrop-blur-lg border border-white/10 rounded-2xl transition-all duration-300 ${value.glowColor} hover:scale-105 cursor-pointer`}
                  >
                    {/* Icon */}
                    <div className={`mb-6 ${value.iconColor}`}>
                      <Icon className="h-12 w-12" />
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-xl font-semibold text-white mb-3">
                      {t(value.titleKey)}
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      {t(value.descKey)}
                    </p>

                    {/* Hover glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What We Do / Expertise Section */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl tracking-tight mb-4">
              {t('about.expertise.title')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {expertiseAreas.map((area, index) => {
              const Icon = area.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="p-6 hover:shadow-lg transition-all duration-300 group cursor-pointer bg-card border-border rounded-2xl">
                    <div className="mb-4 text-[#0B6BFF] group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-10 w-10" />
                    </div>
                    <h3 className="text-lg font-semibold mb-3">
                      {t(area.titleKey)}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(area.descKey)}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Button
              size="lg"
              onClick={() => onNavigate('/services')}
              className="bg-[#0B6BFF] hover:bg-[#0B6BFF]/90 text-white rounded-full h-12 px-8"
            >
              {t('about.expertise.viewAll')}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Team & Workshop Section */}
      <section className="py-24 lg:py-32 bg-secondary/30">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl tracking-tight mb-4">
              {t('about.team.title')}
            </h2>
            <p className="text-lg text-muted-foreground italic max-w-2xl mx-auto">
              "{t('about.team.quote')}"
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center group"
              >
                <div className="relative mb-4 mx-auto w-32 h-32 lg:w-40 lg:h-40">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#0B6BFF]/30 to-purple-500/30 blur-xl group-hover:blur-2xl transition-all duration-300" />
                  <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-border bg-secondary">
                    <ImageWithFallback
                      src={`https://images.unsplash.com/photo-1560250097-0568c0ba6c?w=400&h=400&fit=crop&crop=face&index=${index}`}
                      alt={member.name}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                    />
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-1">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl tracking-tight mb-4">
              {t('about.partners.title')}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t('about.partners.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {partners.map((partner, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-8 text-center hover:shadow-lg transition-all duration-300 bg-secondary/50 border-border rounded-2xl">
                  <h3 className="text-xl font-semibold mb-2">{partner.name}</h3>
                  <p className="text-sm text-muted-foreground">{partner.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact & Location Section */}
      <ContactSection />

      {/* Closing CTA Section */}
      <section 
        className="py-24 lg:py-32 relative overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom, #0B0D10 0%, #151A22 100%)'
        }}
      >
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0B6BFF]/20 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto max-w-4xl px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="text-2xl lg:text-3xl text-gray-300 italic mb-8 leading-relaxed">
              "{t('about.closing.quote')}"
            </p>
            <Button
              size="lg"
              onClick={onBookingClick}
              className="bg-[#0B6BFF] hover:bg-[#0B6BFF]/90 text-white rounded-full h-14 px-10 shadow-[0_0_30px_rgba(11,107,255,0.4)] transition-all hover:shadow-[0_0_40px_rgba(11,107,255,0.6)] text-lg"
            >
              {t('about.closing.cta')}
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
