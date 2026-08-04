import type { MetadataRoute } from 'next';

/**
 * Phase 2 SEO — allow public marketing/content; disallow app/API chrome.
 * Public SEO landings, docs, comparisons and Village Square remain crawlable.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/settings/',
          '/checkout/',
          '/cart/',
          '/messages/',
          '/berichten/',
          '/notifications/',
          '/profile/',
          '/profiel/',
          '/dashboard/',
          '/verkoper/',
          '/delivery/',
          '/deliverer/',
          '/order/',
          '/orders/',
          '/bestellingen/',
          '/pitch',
          '/internal/',
          '/debug/',
          '/test/',
          '/welkom/',
        ],
      },
    ],
    sitemap: 'https://homecheff.eu/sitemap.xml',
    host: 'https://homecheff.eu',
  };
}
