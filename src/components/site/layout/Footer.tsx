import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { useLanguage } from '../../../i18n/LanguageContext';
import logo from 'figma:asset/afe29dcdd9b662431f5e9a02dfb69bc0f463496d.png';

interface FooterProps {
  onNavigate?: (path: string) => void;
}

interface FooterLink {
  key: string;
  href: string;
  sectionId?: string;
}

interface FooterSection {
  titleKey: string;
  links: FooterLink[];
}

export function Footer({ onNavigate }: FooterProps) {
  const { language, setLanguage, t } = useLanguage();
  const selectedLanguageClass = 'bg-secondary text-foreground';
  const inactiveLanguageClass = 'text-muted-foreground hover:text-foreground';
  const languageButtonClasses: Record<typeof language, string> = {
    fi: inactiveLanguageClass,
    en: inactiveLanguageClass,
  };
  languageButtonClasses[language] = selectedLanguageClass;

  const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string, sectionId?: string) => {
    // Handle navigation to Services page with section scroll
    if (href === '/services' && sectionId && onNavigate) {
      event.preventDefault();
      onNavigate('/services');
      // Wait for page to render, then scroll to section
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return;
    }

    // Handle navigation to Home page with section scroll
    if (href === '/' && sectionId && onNavigate) {
      event.preventDefault();
      onNavigate('/');
      // Wait for page to render, then scroll to section
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return;
    }
    
    // Handle About page navigation
    if (href === '/about' && onNavigate) {
      event.preventDefault();
      onNavigate('/about');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Handle Tire Hotel navigation
    if (href === '/tire-hotel' && onNavigate) {
      event.preventDefault();
      onNavigate('/tire-hotel');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // Handle Legal pages navigation
    if (onNavigate && (href === '/legal/privacy' || href === '/legal/terms')) {
      event.preventDefault();
      onNavigate(href);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
  };

  const footerSections: FooterSection[] = [
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
        { key: 'footer.carservice', href: '/services', sectionId: 'tire-work' },
        { key: 'footer.tireHotel', href: '/tire-hotel' },
      ],
    },
    {
      titleKey: 'footer.company',
      links: [
        { key: 'footer.about', href: '/about' },
        { key: 'footer.contact', href: '/', sectionId: 'contact-heading' },
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
        <div className="py-8 sm:py-16">
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 text-left sm:grid-cols-2 lg:grid-cols-5">
            {/* Brand Column */}
            <div className="col-span-2 lg:col-span-1">
              <div className="mb-3 flex items-center gap-2">
                <img src={logo} alt="Mitra Auto" className="h-8 w-auto dark:brightness-0 dark:invert" />
                <span className="text-lg font-semibold">Mitra Auto</span>
              </div>
              <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
                {t('footer.description')}
              </p>
            </div>

            {/* Links Columns */}
            {footerSections.map((section, idx) => (
              <div key={idx}>
                <h3 className="font-semibold text-sm mb-3">{t(section.titleKey)}</h3>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.key}>
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(e) => handleLinkClick(e, link.href, link.sectionId)}
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
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 text-left">
            {/* Copyright */}
            <p className="basis-full text-sm text-muted-foreground sm:basis-auto">{t('footer.copyright')}</p>

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
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${languageButtonClasses.fi}`}
              >
                FI
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${languageButtonClasses.en}`}
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
