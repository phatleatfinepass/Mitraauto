import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { translations } from './dictionaries';
import type { Language } from './types';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const fallbackLanguage: Language = 'en';
const fallbackLanguageContext: LanguageContextType = {
  language: fallbackLanguage,
  setLanguage: () => {
    // Ignore language changes when previewed without the provider.
  },
  t: (key: string, params?: Record<string, string | number>) =>
    translateForLanguage(fallbackLanguage, key, params),
};


const LanguageContext = createContext<LanguageContextType>(fallbackLanguageContext);

function readStoredLanguage(): Language | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = window.localStorage.getItem('mitra-language');
    return stored === 'fi' || stored === 'en' ? stored : null;
  } catch {
    return null;
  }
}

function persistLanguage(language: Language) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem('mitra-language', language);
  } catch {
    // Ignore storage failures in restricted webview/PWA contexts.
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = readStoredLanguage();
    if (stored) return stored;

    if (typeof window === 'undefined') {
      return 'fi';
    }
    const browserLanguage = window.navigator.language.toLowerCase();
    return browserLanguage.startsWith('fi') ? 'fi' : 'en';
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    persistLanguage(language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    return translateForLanguage(language, key, params);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  return context;
}

export function translateForLanguage(language: Language, key: string, params?: Record<string, string | number>) {
  return interpolateTranslation(translations[key]?.[language] || key, params);
}

function interpolateTranslation(template: string, params?: Record<string, string | number>) {
  if (!params) return template;

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = params[key];
    return value === undefined ? match : String(value);
  });
}
