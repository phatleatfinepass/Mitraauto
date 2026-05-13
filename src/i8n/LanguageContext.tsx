import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { translations } from './dictionaries';
import type { Language } from './types';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const fallbackLanguage: Language = 'en';
const fallbackLanguageContext: LanguageContextType = {
  language: fallbackLanguage,
  setLanguage: () => {
    // Ignore language changes when previewed without the provider.
  },
  t: (key: string) => translations[key]?.[fallbackLanguage] || key,
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

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
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
