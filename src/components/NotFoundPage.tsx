import React from 'react';
import { BrokenCar404 } from './BrokenCar404';
import { useLanguage } from './LanguageContext';

interface NotFoundPageProps {
  path: string;
  onNavigateHome: () => void;
}

export function NotFoundPage({ path, onNavigateHome }: NotFoundPageProps) {
  const { t } = useLanguage();

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
