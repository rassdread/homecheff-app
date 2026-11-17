import { MAIN_DOMAIN } from '@/lib/seo/constants';

export const COURIER_PUBLIC_PATHS = {
  nl: '/bezorger-worden',
  en: '/en/become-a-delivery-driver',
} as const;

export const CUSTOMER_PUBLIC_PATHS = {
  nl: '/pakket-laten-bezorgen',
  en: '/en/local-parcel-delivery',
} as const;

/** Cookieless crawlers get the language of the URL, not a guessed country. */
export const PUBLIC_DELIVERY_PATH_LANGUAGE: Record<string, 'nl' | 'en'> = {
  [COURIER_PUBLIC_PATHS.nl]: 'nl',
  [COURIER_PUBLIC_PATHS.en]: 'en',
  [CUSTOMER_PUBLIC_PATHS.nl]: 'nl',
  [CUSTOMER_PUBLIC_PATHS.en]: 'en',
};

export function deliveryPublicLanguages(paths: { nl: string; en: string }): Record<string, string> {
  return {
    'nl-NL': `${MAIN_DOMAIN}${paths.nl}`,
    'en-US': `${MAIN_DOMAIN}${paths.en}`,
    'x-default': `${MAIN_DOMAIN}${paths.en}`,
  };
}
