import React from 'react';
import { useLanguage } from './LanguageContext';
import { Button } from './ui/button';
import { MapPin, Phone, Mail, Clock, Navigation } from 'lucide-react';

export function ContactSection() {
  const { t } = useLanguage();

  // Static contact information (doesn't change with language)
  const CONTACT_INFO = {
    address: 'Hankasuontie 5, 00390 Helsinki',
    phone: '+358 40 7777 163',
    phoneDisplay: '+358 40 7777 163',
    email: 'info.mitra.auto@gmail.com',
    // Universal map URL that opens in user's default map app
    mapUrl: 'https://maps.apple.com/?address=Hankasuontie+5,+00390+Helsinki,+Finland',
  };

  const contactDetails = [
    {
      icon: MapPin,
      label: t('contact.address'),
      value: CONTACT_INFO.address,
      href: CONTACT_INFO.mapUrl,
      isClickable: true,
    },
    {
      icon: Phone,
      label: t('contact.phone'),
      value: CONTACT_INFO.phoneDisplay,
      href: `tel:${CONTACT_INFO.phone}`,
      isClickable: true,
    },
    {
      icon: Mail,
      label: t('contact.email'),
      value: CONTACT_INFO.email,
      href: `mailto:${CONTACT_INFO.email}`,
      isClickable: true,
    },
    {
      icon: Clock,
      label: t('contact.hours'),
      value: t('contact.hoursValue'),
      isClickable: false,
    },
  ];

  return (
    <section 
      className="py-16 md:py-24 lg:py-32 bg-white relative" 
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
        <div className="grid gap-8 md:gap-12 lg:grid-cols-[60%_40%] items-start">
          {/* Left Column - Map Placeholder */}
          <div className="order-1">
            <a 
              href={CONTACT_INFO.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block relative aspect-square rounded-2xl bg-gray-100 overflow-hidden shadow-sm transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer group"
              aria-label={`${t('contact.mapPlaceholder')} - ${CONTACT_INFO.address}`}
            >
              {/* Map Placeholder Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
                <div className="rounded-full bg-white p-6 shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
                  <MapPin className="h-12 w-12 text-accent" aria-hidden="true" />
                </div>
                <p className="text-lg text-gray-600 text-center group-hover:text-gray-900 transition-colors">
                  {t('contact.mapPlaceholder')}
                </p>
              </div>
            </a>
          </div>

          {/* Right Column - Contact Information */}
          <div className="order-2">
            <div className="rounded-2xl bg-gray-50 p-8 shadow-sm">
              <h3 className="mb-2 text-2xl font-bold">
                {t('contact.heading')}
              </h3>
              <p className="mb-8 text-gray-600">
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
                        <div className="text-sm text-gray-500 mb-1">
                          {detail.label}
                        </div>
                        <div className={`font-medium text-gray-900 break-words ${detail.isClickable ? 'group-hover:text-accent transition-colors' : ''}`}>
                          {detail.value}
                        </div>
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
                        className="flex items-start gap-4 transition-all hover:bg-white rounded-lg p-3 -mx-3 cursor-pointer group"
                      >
                        {content}
                      </a>
                    );
                  }

                  return (
                    <div 
                      key={idx} 
                      className="flex items-start gap-4 transition-all hover:bg-white rounded-lg p-3 -mx-3"
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
                    href={CONTACT_INFO.mapUrl}
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
                    href={`mailto:${CONTACT_INFO.email}`}
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
