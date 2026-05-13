import React from 'react';
import { useLanguage } from '../../LanguageContext';
import { Card } from '../../ui/card';
import { ContactSection } from '../sections/ContactSection';
import { ImageWithFallback } from '../../figma/ImageWithFallback';
import { motion } from 'motion/react';
import { 
  Wrench,
  ClipboardCheck,
  CircleDot,
  Warehouse
} from 'lucide-react';
import workshop from 'figma:asset/d4d52a152eeb5a4243fd5af9c734372c01fc3fc6.png';

interface AboutPageProps {
  onBookingClick: () => void;
  onNavigate: (path: string) => void;
}

export function AboutPage({ onBookingClick, onNavigate }: AboutPageProps) {
  const { t, language } = useLanguage();

  const expertiseAreas = [
    {
      icon: Wrench,
      titleKey: 'about.expertise.carServices.title',
      descKey: 'about.expertise.carServices.desc',
    },
    {
      icon: ClipboardCheck,
      titleKey: 'about.expertise.carInspection.title',
      descKey: 'about.expertise.carInspection.desc',
    },
    {
      icon: CircleDot,
      titleKey: 'about.expertise.tireAndRims.title',
      descKey: 'about.expertise.tireAndRims.desc',
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
              <h1 className="text-4xl lg:text-5xl tracking-tight mb-6">
                {t('about.story.title')}
              </h1>
              <div className="h-1 w-20 bg-[#FF6B35] rounded-full mb-8" />
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
                  src={workshop}
                  alt="Mitra Auto Workshop"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Expertise Section */}
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
              {t('about.expertise.title')}
            </h2>
            <div className="h-1 w-20 bg-[#FF6B35] rounded-full mx-auto" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
                  <Card className="p-6 hover:shadow-lg transition-all duration-300 group cursor-pointer bg-card border-border rounded-2xl h-full">
                    <div className="mb-4 text-[#FF6B35] group-hover:scale-110 transition-transform duration-300">
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
        </div>
      </section>

      {/* Contact & Location Section */}
      <ContactSection />
    </div>
  );
}
