'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { detectGeoCountry } from '@/lib/currency';
import {
  SUPPORTED_LANGUAGES,
  detectPreferredLanguage,
  inferSourceLanguage,
  languageForCountry,
  normalizeLanguageCode,
  translateUiKey,
} from '@/lib/language';

interface TranslateTextOptions {
  sourceLanguage?: string;
}

interface LanguageContextValue {
  language: string;
  languages: typeof SUPPORTED_LANGUAGES;
  setLanguage: (code: string) => void;
  detectingLanguage: boolean;
  t: (key: string, fallback?: string) => string;
  translateText: (text: string, options?: TranslateTextOptions) => Promise<string>;
  showOriginalListings: boolean;
  setShowOriginalListings: (value: boolean) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  languages: SUPPORTED_LANGUAGES,
  setLanguage: () => {},
  detectingLanguage: false,
  t: (_key, fallback) => fallback ?? '',
  translateText: async (text) => text,
  showOriginalListings: false,
  setShowOriginalListings: () => {},
});

const LANGUAGE_LS_KEY = 'fomkart_language';
const ORIGINAL_TOGGLE_KEY = 'fomkart_show_original_listing';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<string>('en');
  const [detectingLanguage, setDetectingLanguage] = useState(true);
  const [showOriginalListings, setShowOriginalListingsState] = useState(false);
  const cacheRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const storedShowOriginal = localStorage.getItem(ORIGINAL_TOGGLE_KEY);
    if (storedShowOriginal === '1') {
      setShowOriginalListingsState(true);
    }

    const stored = localStorage.getItem(LANGUAGE_LS_KEY);
    if (stored) {
      setLanguageState(normalizeLanguageCode(stored));
      setDetectingLanguage(false);
      return;
    }

    setDetectingLanguage(true);
    detectGeoCountry()
      .then((country) => {
        const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];
        const detected = detectPreferredLanguage(browserLanguages, country);
        const fallbackByCountry = languageForCountry(country);
        setLanguageState(detected || fallbackByCountry || 'en');
      })
      .catch(() => {
        const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];
        setLanguageState(detectPreferredLanguage(browserLanguages, null));
      })
      .finally(() => setDetectingLanguage(false));
  }, []);

  const setLanguage = useCallback((code: string) => {
    const normalized = normalizeLanguageCode(code);
    setLanguageState(normalized);
    localStorage.setItem(LANGUAGE_LS_KEY, normalized);
  }, []);

  const setShowOriginalListings = useCallback((value: boolean) => {
    setShowOriginalListingsState(value);
    localStorage.setItem(ORIGINAL_TOGGLE_KEY, value ? '1' : '0');
  }, []);

  const t = useCallback(
    (key: string, fallback?: string) => translateUiKey(language, key, fallback),
    [language],
  );

  const translateText = useCallback(
    async (text: string, options?: TranslateTextOptions) => {
      const trimmed = (text ?? '').trim();
      if (!trimmed) return text;

      const sourceLanguage = normalizeLanguageCode(options?.sourceLanguage ?? inferSourceLanguage(trimmed));
      if (language === sourceLanguage || language === 'en' && sourceLanguage === 'en') {
        return text;
      }

      const cacheKey = `${sourceLanguage}->${language}:${trimmed}`;
      const cached = cacheRef.current.get(cacheKey);
      if (cached) return cached;

      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: trimmed,
            sourceLanguage,
            targetLanguage: language,
          }),
        });

        if (!response.ok) return text;
        const body = await response.json();
        const translated = typeof body?.translatedText === 'string' ? body.translatedText : text;
        cacheRef.current.set(cacheKey, translated);
        return translated;
      } catch {
        return text;
      }
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      languages: SUPPORTED_LANGUAGES,
      setLanguage,
      detectingLanguage,
      t,
      translateText,
      showOriginalListings,
      setShowOriginalListings,
    }),
    [language, setLanguage, detectingLanguage, t, translateText, showOriginalListings, setShowOriginalListings],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
