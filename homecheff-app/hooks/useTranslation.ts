'use client';

import { useState, useEffect } from 'react';

export type Language = 'nl' | 'en';

export interface Translations {
  [key: string]: any;
}

let translations: Translations = {};

export function useTranslation() {
  const [language, setLanguage] = useState<Language>('nl');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load language from localStorage or default to Dutch
    const savedLanguage = localStorage.getItem('homecheff-language') as Language;
    if (savedLanguage && (savedLanguage === 'nl' || savedLanguage === 'en')) {
      setLanguage(savedLanguage);
    }
    loadTranslations(savedLanguage || 'nl');
  }, []);

  const loadTranslations = async (lang: Language) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/i18n/${lang}.json`);
      if (response.ok) {
        translations = await response.json();
      }
    } catch (error) {
      console.error('Failed to load translations:', error);
      // Fallback to Dutch if loading fails
      if (lang !== 'nl') {
        loadTranslations('nl');
        setLanguage('nl');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem('homecheff-language', newLanguage);
    loadTranslations(newLanguage);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to key if translation not found
        return key;
      }
    }

    if (typeof value === 'string') {
      // Replace parameters in the string
      if (params) {
        return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
          return params[paramKey]?.toString() || match;
        });
      }
      return value;
    }

    return key;
  };

  return {
    t,
    language,
    changeLanguage,
    isLoading,
    availableLanguages: [
      { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
      { code: 'en', name: 'English', flag: '🇬🇧' }
    ]
  };
}


