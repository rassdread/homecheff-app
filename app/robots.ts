import { MetadataRoute } from 'next';
import { MAIN_DOMAIN } from '@/lib/seo/metadata';

/**
 * Sitemap-URL altijd canoniek op homecheff.eu zodat Google Search Console
 * (productie) niet naar preview-VERCEL_URL of verkeerde NEXT_PUBLIC_BASE_URL wijst.
 */
const SITEMAP_URL = `${MAIN_DOMAIN}/sitemap.xml`;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/profile/',
          '/messages/',
          '/orders/',
          '/checkout/',
          '/payment/',
          '/verkoper/',
          '/bezorger/',
          '/onboarding/',
          '/verify-email/',
          '/verificatie/',
          '/success/',
          '/review/',
          '/reservations/',
          '/favorites/',
          '/user/',
          '/sms/',
          '/social-login-success/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/profile/',
          '/messages/',
          '/orders/',
          '/checkout/',
          '/payment/',
          '/verkoper/',
          '/bezorger/',
          '/onboarding/',
          '/verify-email/',
          '/verificatie/',
          '/success/',
          '/review/',
          '/reservations/',
          '/favorites/',
          '/user/',
          '/sms/',
          '/social-login-success/',
        ],
      },
    ],
    sitemap: SITEMAP_URL,
  };
}













