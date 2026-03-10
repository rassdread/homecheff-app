import type { NextRequest } from 'next/server';

const OUR_DOMAINS = [
  'https://homecheff.eu',
  'https://homecheff.nl',
  'https://www.homecheff.eu',
  'https://www.homecheff.nl',
] as const;

/**
 * CORS headers for API responses. Use in route handlers so the response
 * always has the correct Access-Control-Allow-Origin (Safari/iOS + lokaal IP).
 * Middleware may not always merge headers into the final response.
 * Safari on iOS can send Origin: null or omit Origin; we treat same-origin using Host.
 */
export function getCorsHeaders(request: NextRequest): Record<string, string> {
  // Behind Vercel/proxy the Host can be internal; use x-forwarded-host for the real site
  const host =
    request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    request.headers.get('host') ||
    '';
  const hostOnly = host.replace(/^https?:\/\//, '').split('/')[0] || '';
  const proto = request.headers.get('x-forwarded-proto') || request.nextUrl?.protocol?.replace(':', '') || 'http';
  // Production: always use https for our domains (Vercel may omit x-forwarded-proto in some paths)
  const effectiveProto =
    process.env.NODE_ENV === 'production' &&
    (hostOnly === 'homecheff.eu' || hostOnly === 'homecheff.nl' || hostOnly === 'www.homecheff.eu' || hostOnly === 'www.homecheff.nl')
      ? 'https'
      : proto;
  const fallbackOrigin = hostOnly ? `${effectiveProto}://${hostOnly}` : (request.nextUrl?.origin ?? '');
  const rawOrigin = request.headers.get('origin');
  // Safari/iOS can send literal "null", omit Origin, or send "" for same-origin; use request host as origin
  const origin =
    rawOrigin && rawOrigin !== 'null' && rawOrigin !== ''
      ? rawOrigin
      : request.nextUrl?.origin || fallbackOrigin;

  const isLocalDevOrigin =
    !origin ||
    origin === 'null' ||
    origin === '' ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(origin);
  // Same-site: allow our domains; in production also allow when Host is our domain (Safari/Vercel edge cases)
  const isOurDomainByOrigin =
    (origin && OUR_DOMAINS.includes(origin as (typeof OUR_DOMAINS)[number])) ||
    OUR_DOMAINS.some((d) => fallbackOrigin === d);
  const isOurDomainByHost =
    process.env.NODE_ENV === 'production' &&
    (hostOnly === 'homecheff.eu' || hostOnly === 'www.homecheff.eu' || hostOnly === 'homecheff.nl' || hostOnly === 'www.homecheff.nl');
  const isOurDomain = isOurDomainByOrigin || isOurDomainByHost;
  const allowed = process.env.NODE_ENV === 'development' ? isLocalDevOrigin : isOurDomain;
  // When Origin is the literal "null", CORS spec requires responding with "null" for browser to accept
  const allowOrigin = allowed
    ? rawOrigin === 'null'
      ? 'null'
      : (origin || fallbackOrigin)
    : undefined;

  if (!allowOrigin) return {};
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
