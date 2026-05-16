"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { de } from './dictionaries/de';
import { en } from './dictionaries/en';
import { it } from './dictionaries/it';
import { sq } from './dictionaries/sq';
import { DEFAULT_LOCALE, isLocale, Locale, LOCALES, LOCALE_STORAGE_KEY } from './locales';

const dictionaries = { en, sq, de, it } as const;

type TranslationValues = Record<string, string | number>;

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: string, values?: TranslationValues) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function lookup(dictionary: unknown, key: string): unknown {
  if (typeof key !== 'string') return undefined;
  return key.split('.').reduce<unknown>((current, part) => {
    if (current && typeof current === 'object' && part in current) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, dictionary);
}

function interpolate(template: string, values?: TranslationValues): string {
  if (!values) return template;
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{{${key}}}`, String(value)),
    template,
  );
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [hasLoadedStoredLocale, setHasLoadedStoredLocale] = useState(false);

  useEffect(() => {
    const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    const nextLocale = isLocale(storedLocale) ? storedLocale : DEFAULT_LOCALE;
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      setLocaleState(nextLocale);
      setHasLoadedStoredLocale(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedStoredLocale) return;
    document.documentElement.lang = locale;
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [hasLoadedStoredLocale, locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((current) => {
      const currentIndex = LOCALES.indexOf(current);
      return LOCALES[(currentIndex + 1) % LOCALES.length];
    });
  }, []);

  const t = useCallback(
    (key: string, values?: TranslationValues) => {
      const value = lookup(dictionaries[locale], key);
      if (typeof value === 'string') return interpolate(value, values);

      const fallback = lookup(dictionaries[DEFAULT_LOCALE], key);
      if (typeof fallback === 'string') return interpolate(fallback, values);

      return key;
    },
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, toggleLocale, t }),
    [locale, setLocale, toggleLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider');
  }
  return context;
}
