/**
 * Server-side living platform copy (NL/EN) without client hooks.
 */

import type { Bi } from '@/lib/i18n/seoLandingSources';
import { LIVING_PLATFORM_SOURCES } from '@/lib/i18n/livingPlatformSources';

export type LivingPlatformLang = 'nl' | 'en';

export function resolveLivingPlatformLang(
  languageHeader: string | null,
  cookieLang: string | undefined,
): LivingPlatformLang {
  if (languageHeader === 'en') return 'en';
  if (cookieLang === 'en') return 'en';
  return 'nl';
}

export function lpString(
  namespace: string,
  key: string,
  lang: LivingPlatformLang,
): string {
  const src = LIVING_PLATFORM_SOURCES[namespace]?.[key] as Bi | undefined;
  return src?.[lang] ?? src?.nl ?? key;
}

export function lpMeta(
  namespace: string,
  lang: LivingPlatformLang,
): { title: string; description: string } {
  return {
    title: lpString(namespace, 'metaTitle', lang),
    description: lpString(namespace, 'metaDescription', lang),
  };
}

export function lpShared(key: string, lang: LivingPlatformLang): string {
  return lpString('livingPlatformShared', key, lang);
}
