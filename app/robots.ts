import type { MetadataRoute } from 'next';

/**
 * SEO 4.0 — public marketing/content crawlable; app/API chrome disallowed.
 *
 * AI crawler policy (explicit product decision):
 * - Allow major AI search/fetch user-agents with the same private-path disallows.
 * - Do not claim robots.txt controls model training outcomes.
 * - Normal Google/Bing crawling remains allowed via `*`.
 */
const PRIVATE_DISALLOW = [
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
] as const;

const AI_USER_AGENTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Google-Extended',
  'PerplexityBot',
  'Applebot-Extended',
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [...PRIVATE_DISALLOW],
      },
      ...AI_USER_AGENTS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: [...PRIVATE_DISALLOW],
      })),
    ],
    sitemap: 'https://homecheff.eu/sitemap.xml',
    host: 'https://homecheff.eu',
  };
}
