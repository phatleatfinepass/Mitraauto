import { useEffect } from 'react';
import { businessProfile, getLocalBusinessSchema, localBusinessIds } from '../config/businessProfile';

type LocalSeoLanguage = 'fi' | 'en';

type BreadcrumbItem = {
  name: string;
  path: string;
};

type UseLocalSeoHeadOptions = {
  language: LocalSeoLanguage;
  title: string;
  description: string;
  canonicalPath: string;
  alternatePaths: Record<LocalSeoLanguage, string>;
  pageType?: string;
  breadcrumbs?: BreadcrumbItem[];
};

function absoluteUrl(path: string) {
  return `${businessProfile.websiteUrl}${path === '/' ? '' : path}`;
}

export function useLocalSeoHead({
  language,
  title,
  description,
  canonicalPath,
  alternatePaths,
  pageType = 'WebPage',
  breadcrumbs = [],
}: UseLocalSeoHeadOptions) {
  useEffect(() => {
    const previousTitle = document.title;
    const previousLang = document.documentElement.lang;

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

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const previousCanonical = canonical?.href ?? '';
    const createdCanonical = !canonical;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = absoluteUrl(canonicalPath);

    const alternateLinks = [
      { hreflang: 'fi', href: absoluteUrl(alternatePaths.fi) },
      { hreflang: 'en', href: absoluteUrl(alternatePaths.en) },
      { hreflang: 'x-default', href: absoluteUrl(alternatePaths.fi) },
    ].map(({ hreflang, href }) => {
      let link = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${hreflang}"]`);
      const previousHref = link?.href ?? '';
      const created = !link;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'alternate';
        link.hreflang = hreflang;
        document.head.appendChild(link);
      }
      link.href = href;
      return { link, previousHref, created };
    });

    let jsonLd = document.querySelector<HTMLScriptElement>('script[data-local-seo-jsonld]');
    if (!jsonLd) {
      jsonLd = document.createElement('script');
      jsonLd.type = 'application/ld+json';
      jsonLd.dataset.localSeoJsonld = 'true';
      document.head.appendChild(jsonLd);
    }

    const canonicalUrl = absoluteUrl(canonicalPath);
    const graph: Record<string, unknown>[] = [
      getLocalBusinessSchema(),
      {
        '@type': 'WebSite',
        '@id': localBusinessIds.website,
        url: businessProfile.websiteUrl,
        name: businessProfile.publicName,
        publisher: { '@id': localBusinessIds.organization },
        inLanguage: language,
      },
      {
        '@type': pageType,
        '@id': `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: title,
        description,
        isPartOf: { '@id': localBusinessIds.website },
        about: { '@id': localBusinessIds.organization },
        inLanguage: language,
      },
    ];

    if (breadcrumbs.length > 0) {
      graph.push({
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: breadcrumbs.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: absoluteUrl(item.path),
        })),
      });
    }

    jsonLd.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': graph,
    });

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
      if (canonical) {
        if (createdCanonical) {
          canonical.remove();
        } else {
          canonical.href = previousCanonical;
        }
      }
      alternateLinks.forEach(({ link, previousHref, created }) => {
        if (created) {
          link.remove();
        } else {
          link.href = previousHref;
        }
      });
      jsonLd?.remove();
    };
  }, [alternatePaths.en, alternatePaths.fi, breadcrumbs, canonicalPath, description, language, pageType, title]);
}
