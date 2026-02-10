import { MetadataRoute } from 'next';

// Get base URL from environment or default
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'https://homecheff.nl';
};

const baseUrl = getBaseUrl();

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
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}













