import { useEffect, useMemo } from 'react';
import { ArrowRight, Calendar, CheckCircle2, Clock, Euro, HelpCircle, MapPin, Wrench } from 'lucide-react';
import { useLanguage } from '../../../i18n/LanguageContext';
import {
  buildGeneratedServiceSeoPage,
  getServiceDetailPathForServiceId,
  serviceSeoPageById,
  type ServiceSeoPageId,
} from '../../../i18n/dictionaries/serviceSeo';
import { getLocalizedServiceNameById } from '../../../utils/serviceCatalog';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { ImageWithFallback } from '../../figma/ImageWithFallback';
import carWashService from 'figma:asset/cac46ce90efaaa69a5d5eac00cb56658fc7c8afa.png';
import carMaintenanceService from 'figma:asset/23fb0673ef5da715efe16a47361607b6c4536093.png';
import tireService from 'figma:asset/0c2e6e541f47a002ca898c5d5be58014ebf38e9d.png';

type ServiceDetailPageProps = {
  pageId?: ServiceSeoPageId | null;
  serviceId?: string | null;
  routeLanguage?: 'fi' | 'en';
  onBookingClick: (serviceId: string | null) => void;
  onNavigate: (path: string) => void;
};

const imageByKey = {
  maintenance: carMaintenanceService,
  tires: tireService,
  wash: carWashService,
} as const;

function normalizePath(path: string) {
  return path.length > 1 && path.endsWith('/') ? path.replace(/\/+$/, '') : path;
}

function getLocalizedPath(paths: string[], language: 'fi' | 'en') {
  const matcher: Record<'fi' | 'en', (path: string) => boolean> = {
    fi: (path) => !path.startsWith('/en/'),
    en: (path) => path.startsWith('/en/'),
  };
  const preferred = paths.find(matcher[language]);
  return preferred ?? paths[0] ?? '/services';
}

export function ServiceDetailPage({ pageId, serviceId, routeLanguage, onBookingClick, onNavigate }: ServiceDetailPageProps) {
  const { language } = useLanguage();
  const effectiveLanguage = routeLanguage ?? language;
  const page = pageId ? serviceSeoPageById[pageId] : serviceId ? buildGeneratedServiceSeoPage(serviceId) : null;

  if (!page) {
    return null;
  }

  const copy = page.copy[effectiveLanguage];
  const heroImage = imageByKey[page.imageKey];
  const canonicalPath = getLocalizedPath(page.paths, effectiveLanguage);
  const canonicalUrl = `https://www.mitra-auto.fi${canonicalPath}`;

  const relatedPages = useMemo(() => {
    return page.relatedServiceIds
      .map((serviceId) => {
        const serviceName = getLocalizedServiceNameById(serviceId, effectiveLanguage);
        const href = getServiceDetailPathForServiceId(serviceId, effectiveLanguage);
        return serviceName && href
          ? {
              id: serviceId,
              name: serviceName,
              href,
            }
          : null;
      })
      .filter((item): item is { id: string; name: string; href: string } => Boolean(item));
  }, [effectiveLanguage, page]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = copy.metaTitle;

    let description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = description?.content ?? '';
    if (!description) {
      description = document.createElement('meta');
      description.name = 'description';
      document.head.appendChild(description);
    }
    description.content = copy.metaDescription;

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const previousCanonical = canonical?.href ?? '';
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    let jsonLd = document.querySelector<HTMLScriptElement>('script[data-service-seo-jsonld]');
    if (!jsonLd) {
      jsonLd = document.createElement('script');
      jsonLd.type = 'application/ld+json';
      jsonLd.dataset.serviceSeoJsonld = 'true';
      document.head.appendChild(jsonLd);
    }
    jsonLd.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'AutoRepair',
      name: 'Mitra Auto',
      url: canonicalUrl,
      areaServed: 'Helsinki',
      makesOffer: {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: copy.title,
          description: copy.metaDescription,
        },
      },
    });

    return () => {
      document.title = previousTitle;
      if (description) description.content = previousDescription;
      if (canonical && previousCanonical) canonical.href = previousCanonical;
    };
  }, [canonicalUrl, copy.metaDescription, copy.metaTitle, copy.title]);

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b bg-secondary/20 py-12 md:py-20">
        <div className="container mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center lg:px-8">
          <div>
            <nav className="mb-5 text-sm text-muted-foreground" aria-label="Breadcrumb">
              <a href={{ fi: '/palvelut', en: '/en/services' }[effectiveLanguage]} className="hover:text-foreground">
                {{ fi: 'Palvelut', en: 'Services' }[effectiveLanguage]}
              </a>
              <span className="mx-2">/</span>
              <span className="text-foreground">{copy.title}</span>
            </nav>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-accent">{copy.eyebrow}</p>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
              {copy.subtitle}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={() => onBookingClick(page.primaryServiceId)}
                className="h-12 rounded-full bg-accent px-8 text-white hover:bg-accent/90"
              >
                <Calendar className="mr-2 h-5 w-5" />
                {copy.cta}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-full px-8"
                onClick={() => document.getElementById('service-pricing')?.scrollIntoView({ behavior: 'smooth' })}
              >
                {copy.secondaryCta}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border bg-card shadow-xl">
            <ImageWithFallback
              src={heroImage}
              alt={copy.title}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="container mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
          <div className="space-y-12">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">{copy.includedTitle}</h2>
              <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">{copy.summary}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {copy.included.map((item) => (
                  <div key={item} className="flex gap-3 rounded-xl border bg-card p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <span className="text-sm leading-6 text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-semibold tracking-tight">{copy.processTitle}</h2>
              <div className="mt-6 grid gap-4">
                {copy.process.map((step, index) => (
                  <div key={step} className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-[44px_1fr]">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                      {index + 1}
                    </div>
                    <p className="self-center leading-7 text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div id="service-pricing" className="scroll-mt-24">
              <h2 className="text-3xl font-semibold tracking-tight">{copy.pricingTitle}</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {copy.pricing.map((price) => (
                  <Card key={price.name}>
                    <CardContent className="p-5">
                      <Wrench className="mb-4 h-6 w-6 text-accent" />
                      <h3 className="font-semibold">{price.name}</h3>
                      <div className="mt-4 flex items-center gap-2 text-xl font-semibold text-foreground">
                        <Euro className="h-5 w-5 text-accent" />
                        {price.price}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{price.note}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-semibold tracking-tight">{copy.faqTitle}</h2>
              <div className="mt-6 space-y-4">
                {copy.faq.map((item) => (
                  <Card key={item.question}>
                    <CardContent className="p-5">
                      <div className="flex gap-3">
                        <HelpCircle className="mt-1 h-5 w-5 shrink-0 text-accent" />
                        <div>
                          <h3 className="font-semibold">{item.question}</h3>
                          <p className="mt-2 leading-7 text-muted-foreground">{item.answer}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardContent className="space-y-4 p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{copy.priceLabel}</p>
                  <p className="mt-1 text-2xl font-semibold">{copy.pricing[0]?.price}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {copy.durationLabel}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  Helsinki
                </div>
                <Button className="w-full rounded-full bg-accent text-white hover:bg-accent/90" onClick={() => onBookingClick(page.primaryServiceId)}>
                  {copy.cta}
                </Button>
              </CardContent>
            </Card>

            {relatedPages.length > 0 ? (
              <Card>
                <CardContent className="p-5">
                  <h2 className="font-semibold">{copy.relatedTitle}</h2>
                  <div className="mt-4 space-y-2">
                    {relatedPages.map((related) => (
                      <a
                        key={related.id}
                        href={normalizePath(related.href)}
                        onClick={(event) => {
                          event.preventDefault();
                          onNavigate(normalizePath(related.href));
                        }}
                        className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        {related.name}
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </aside>
        </div>
      </section>
    </div>
  );
}
