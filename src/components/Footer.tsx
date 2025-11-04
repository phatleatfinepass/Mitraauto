import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import logo from 'figma:asset/afe29dcdd9b662431f5e9a02dfb69bc0f463496d.png';

export function Footer() {
  const { language, setLanguage, t } = useLanguage();

  const footerSections = [
    {
      titleKey: 'footer.shop',
      links: [
        { key: 'footer.catalog', href: '/catalog' },
        // Temporarily hidden - Used Cars
        // { key: 'nav.usedCars', href: '/used-cars' },
      ],
    },
    {
      titleKey: 'footer.services',
      links: [
        { key: 'footer.tireChange', href: '/services/tire-change' },
        { key: 'footer.tireHotel', href: '/tire-hotel' },
        { key: 'footer.inspection', href: '/services/inspection' },
      ],
    },
    {
      titleKey: 'footer.company',
      links: [
        { key: 'footer.about', href: '/about' },
        { key: 'footer.contact', href: '/contact' },
      ],
    },
    {
      titleKey: 'footer.legal',
      links: [
        { key: 'footer.privacy', href: '/legal/privacy' },
        { key: 'footer.terms', href: '/legal/terms' },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto max-w-7xl px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5">
            {/* Brand Column */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src={logo} alt="Mitra Auto" className="h-8 w-auto dark:brightness-0 dark:invert" />
                <span className="text-lg font-semibold">Mitra Auto</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {language === 'fi' 
                  ? 'Premium renkaat ja huoltopalvelut Suomessa' 
                  : 'Premium tyres and services in Finland'}
              </p>
            </div>

            {/* Links Columns */}
            {footerSections.map((section, idx) => (
              <div key={idx}>
                <h3 className="font-semibold text-sm mb-4">{t(section.titleKey)}</h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.key}>
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {t(link.key)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-sm text-muted-foreground">{t('footer.copyright')}</p>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLanguage('fi')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  language === 'fi' 
                    ? 'bg-secondary text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                FI
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  language === 'en' 
                    ? 'bg-secondary text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
