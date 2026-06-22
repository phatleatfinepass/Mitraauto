import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../i18n/LanguageContext';
import { Button } from '../../ui/button';
import { MapPin, Phone, Mail, Clock, Navigation } from 'lucide-react';
import MapContainer from '../../../imports/MapContainer';
import { getShopStatus } from '../../../utils/openingHours';
import { businessProfile } from '../../../config/businessProfile';

export function ContactSection() {
  const { t, language } = useLanguage();
  const [shopStatus, setShopStatus] = useState(getShopStatus());

  // Update shop status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setShopStatus(getShopStatus());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const contactDetails = [
    {
      icon: MapPin,
      label: t('contact.address'),
      value: businessProfile.address.formatted,
      href: businessProfile.appleMapsUrl,
      isClickable: true,
    },
    {
      icon: Phone,
      label: t('contact.phone'),
      value: businessProfile.phoneDisplay,
      href: `tel:${businessProfile.phoneE164}`,
      isClickable: true,
    },
    {
      icon: Mail,
      label: t('contact.email'),
      value: businessProfile.email,
      href: `mailto:${businessProfile.email}`,
      isClickable: true,
    },
    {
      icon: Clock,
      label: t('contact.hours'),
      value: businessProfile.openingHoursText[language],
      isClickable: false,
    },
  ];

  return (
    <section 
      className="relative overflow-hidden bg-background py-16 md:py-24 lg:py-32"
      aria-labelledby="contact-heading"
    >
      <div className="container mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Title */}
        <div className="mb-12 md:mb-16 text-center max-w-3xl mx-auto">
          <h2 
            id="contact-heading" 
            className="mb-4 text-4xl lg:text-5xl font-bold tracking-tight"
          >
            {t('contact.title')}
          </h2>
        </div>

        {/* Two Column Layout */}
         <div className="grid grid-cols-1 items-start gap-8 md:gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {/* Left Column - Map Placeholder */}
           <div className="order-1 w-full">
            <a
              href={businessProfile.mapSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full relative aspect-square rounded-2xl bg-gray-100 overflow-hidden shadow-sm transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer group"
              aria-label={`${t('contact.mapPlaceholder')} - ${businessProfile.address.formatted}`}
            >
              {/* Map Background */}
              <div className="absolute inset-0 w-full h-full">
                <MapContainer />
              </div>
              
              {/* Flashing Map Pin Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <MapPin className="h-12 w-12 text-[#D5001C] animate-pulse-slow" aria-hidden="true" />
              </div>
            </a>
          </div>

          {/* Right Column - Contact Information */}
          <div className="order-2 w-full">
            <div className="rounded-2xl bg-secondary p-8 shadow-sm w-full">
              <h3 className="mb-2 text-2xl font-bold">
                {t('contact.heading')}
              </h3>
              <p className="mb-8 text-muted-foreground">
                {t('contact.subheading')}
              </p>

              {/* Contact Details */}
              <div className="space-y-6 mb-8">
                {contactDetails.map((detail, idx) => {
                  const content = (
                    <>
                      <div className="mt-1 rounded-full bg-accent/10 p-2.5 flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                        <detail.icon className="h-5 w-5 text-accent" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-muted-foreground mb-1">
                          {detail.label}
                        </div>
                        {detail.icon === Clock ? (
                          <>
                            <div className={`flex items-center gap-2 mb-2 ${shopStatus.isOpen ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                              <span className={`inline-block w-2 h-2 rounded-full ${shopStatus.isOpen ? 'bg-green-600 dark:bg-green-500' : 'bg-red-600 dark:bg-red-500'} animate-pulse`}></span>
                              <span className="text-sm font-medium">
                                {shopStatus.message[language]}
                              </span>
                            </div>
                            <div className="font-medium text-foreground whitespace-pre-line">
                              {detail.value}
                            </div>
                          </>
                        ) : (
                          <div className={`font-medium text-foreground break-words ${detail.isClickable ? 'group-hover:text-accent transition-colors' : ''}`}>
                            {detail.value}
                          </div>
                        )}
                      </div>
                    </>
                  );

                  if (detail.isClickable && detail.href) {
                    return (
                      <a
                        key={idx}
                        href={detail.href}
                        target={detail.icon === MapPin ? "_blank" : undefined}
                        rel={detail.icon === MapPin ? "noopener noreferrer" : undefined}
                        className="flex items-start gap-4 transition-all hover:bg-background rounded-lg p-3 -mx-3 cursor-pointer group"
                      >
                        {content}
                      </a>
                    );
                  }

                  return (
                    <div 
                      key={idx} 
                      className="flex items-start gap-4 transition-all hover:bg-background rounded-lg p-3 -mx-3"
                    >
                      {content}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  className="flex-1 bg-accent hover:bg-accent/90 text-white rounded-full h-11"
                  asChild
                >
                  <a 
                    href={businessProfile.appleMapsUrl}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2"
                  >
                    <Navigation className="h-4 w-4" aria-hidden="true" />
                    {t('contact.directionsButton')}
                  </a>
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1 rounded-full h-11"
                  asChild
                >
                  <a 
                    href={`mailto:${businessProfile.email}`}
                    className="inline-flex items-center justify-center gap-2"
                  >
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    {t('contact.contactButton')}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
