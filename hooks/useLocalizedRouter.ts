'use client';

import { useRouter as useNextRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { addLocalePrefix } from '@/lib/locale';

/**
 * A wrapper around Next.js useRouter that automatically adds locale prefix to paths
 */
export function useLocalizedRouter() {
  const router = useNextRouter();
  const { language, getLocalizedPath } = useTranslation();

  return {
    ...router,
    push: (href: string, options?: any) => {
      const localizedHref = getLocalizedPath(href);
      return router.push(localizedHref, options);
    },
    replace: (href: string, options?: any) => {
      const localizedHref = getLocalizedPath(href);
      return router.replace(localizedHref, options);
    },
    prefetch: (href: string, options?: any) => {
      const localizedHref = getLocalizedPath(href);
      return router.prefetch(localizedHref, options);
    },
  };
}






















