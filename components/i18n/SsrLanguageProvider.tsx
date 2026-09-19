'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Language } from '@/lib/locale';

const SsrLanguageContext = createContext<Language>('en');

/**
 * Server-resolved language for first client paint.
 * Prevents NL→EN (or EN→NL) flicker when geo default is not Dutch.
 */
export function SsrLanguageProvider({
  language,
  children,
}: {
  language: Language;
  children: ReactNode;
}) {
  return (
    <SsrLanguageContext.Provider value={language}>
      {children}
    </SsrLanguageContext.Provider>
  );
}

export function useSsrLanguage(): Language {
  return useContext(SsrLanguageContext);
}
