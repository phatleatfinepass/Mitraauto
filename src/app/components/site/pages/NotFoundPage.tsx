import { useEffect } from 'react';
import { BrokenCar404 } from '../../shared/BrokenCar404';
import { useLanguage } from '../../../i18n/LanguageContext';

interface NotFoundPageProps {
  path: string;
  onNavigateHome: () => void;
}

export function NotFoundPage({ path, onNavigateHome }: NotFoundPageProps) {
  const { language, t } = useLanguage();

  useEffect(() => {
    const previousTitle = document.title;
    const previousLang = document.documentElement.lang;
    const title = language === 'fi' ? 'Sivua ei löytynyt | Mitra Auto' : 'Page not found | Mitra Auto';
    const description =
      language === 'fi'
        ? 'Pyytämääsi Mitra Auton sivua ei löytynyt. Palaa etusivulle tai ota yhteyttä.'
        : 'The Mitra Auto page you requested was not found. Return home or contact us.';

    document.title = title;
    document.documentElement.lang = language;

    let descriptionTag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = descriptionTag?.content ?? '';
    const createdDescription = !descriptionTag;
    if (!descriptionTag) {
      descriptionTag = document.createElement('meta');
      descriptionTag.name = 'description';
      document.head.appendChild(descriptionTag);
    }
    descriptionTag.content = description;

    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previousRobots = robots?.content ?? '';
    const createdRobots = !robots;
    if (!robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.appendChild(robots);
    }
    robots.content = 'noindex, follow';

    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const previousCanonical = canonical?.href ?? '';
    canonical?.remove();

    const alternateLinks = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="alternate"]')).map(
      (link) => {
        const href = link.href;
        const hreflang = link.hreflang;
        link.remove();
        return { href, hreflang };
      },
    );

    return () => {
      document.title = previousTitle;
      document.documentElement.lang = previousLang;
      if (descriptionTag) {
        if (createdDescription) {
          descriptionTag.remove();
        } else {
          descriptionTag.content = previousDescription;
        }
      }
      if (robots) {
        if (createdRobots) {
          robots.remove();
        } else {
          robots.content = previousRobots;
        }
      }
      if (canonical) {
        canonical.href = previousCanonical;
        document.head.appendChild(canonical);
      }
      alternateLinks.forEach(({ href, hreflang }) => {
        const link = document.createElement('link');
        link.rel = 'alternate';
        link.hreflang = hreflang;
        link.href = href;
        document.head.appendChild(link);
      });
    };
  }, [language]);

  return (
    <main className="min-h-[70vh] px-6 py-10 lg:px-8 lg:py-16">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[minmax(280px,420px)_minmax(320px,1fr)]">
        <div className="order-2 lg:order-1">
          <BrokenCar404 />
        </div>

        <div className="order-1 lg:order-2">
          <p className="text-sm font-medium text-[#FF6B35]">{t('notFound.badge')}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {t('notFound.title')}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
            {t('notFound.body')}
          </p>

          <div className="mt-6 rounded-xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm text-muted-foreground dark:border-white/10 dark:bg-white/[0.03]">
            <span className="font-medium text-foreground">{t('notFound.pathLabel')}</span> {path}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#FF6B35] px-5 py-2 text-sm font-medium text-[#11141A]"
            >
              {t('notFound.backHome')}
            </button>
            <a
              href="mailto:contact@mitra-auto.fi"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-black/10 px-5 py-2 text-sm font-medium text-foreground dark:border-white/10"
            >
              {t('notFound.contact')}
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
