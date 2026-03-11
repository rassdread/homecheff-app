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
 * Safari on iOS often omits Origin on same-origin requests; in production we
 * always return fixed CORS for /api and /i18n so Safari never fails "access control checks".
 */
const CANONICAL_ORIGIN = 'https://homecheff.eu';

function corsHeadersFor(allowOrigin: string, isApiOrI18n: boolean): Record<string, string> {
  const h: Record<string, string> = {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  if (isApiOrI18n) h['Cache-Control'] = 'no-store, no-cache, must-revalidate';
  return h;
}

export function getCorsHeaders(request: NextRequest): Record<string, string> {
  const pathname =
    (typeof request.nextUrl !== 'undefined' && request.nextUrl?.pathname) ||
    (typeof request.url === 'string' ? (() => { try { return new URL(request.url).pathname; } catch { return ''; } })() : '');
  const isApiOrI18n = pathname.startsWith('/api/') || pathname.startsWith('/i18n/');

  // Production: ALWAYS return CORS for /api and /i18n. Safari/PWA can send Origin: "null" – CORS requires echoing "null" back, else "access control checks" fail.
  if (process.env.NODE_ENV === 'production' && isApiOrI18n) {
    const rawOrigin = request.headers.get('origin');
    const allowOrigin = rawOrigin === 'null' ? 'null' : CANONICAL_ORIGIN;
    return corsHeadersFor(allowOrigin, true);
  }

  // Behind Vercel/proxy the Host can be internal; use x-forwarded-host for the real site
  const host =
    request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    request.headers.get('host') ||
    '';
  const hostOnly = host.replace(/^https?:\/\//, '').split('/')[0] || '';
  // In Route Handlers request.nextUrl may be undefined; fallback to request.url
  const urlOrigin = typeof request.url === 'string' ? (() => { try { return new URL(request.url).origin; } catch { return ''; } })() : '';
  const proto = request.headers.get('x-forwarded-proto') || request.nextUrl?.protocol?.replace(':', '') || (urlOrigin ? (() => { try { return new URL(urlOrigin).protocol.replace(':', ''); } catch { return 'https'; } })() : '') || 'http';
  // Production: always use https for our domains (Vercel may omit x-forwarded-proto in some paths)
  const effectiveProto =
    process.env.NODE_ENV === 'production' &&
    (hostOnly === 'homecheff.eu' || hostOnly === 'homecheff.nl' || hostOnly === 'www.homecheff.eu' || hostOnly === 'www.homecheff.nl')
      ? 'https'
      : proto;
  const fallbackOrigin = hostOnly ? `${effectiveProto}://${hostOnly}` : (request.nextUrl?.origin ?? urlOrigin ?? '');
  const rawOrigin = request.headers.get('origin');
  // Safari/iOS can send literal "null", omit Origin, or send "" for same-origin; use request host as origin
  const origin =
    rawOrigin && rawOrigin !== 'null' && rawOrigin !== ''
      ? rawOrigin
      : request.nextUrl?.origin || fallbackOrigin || urlOrigin;

  const isLocalDevOrigin =
    !origin ||
    origin === 'null' ||
    origin === '' ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(origin);
  // Same-site: allow our domains; in production also allow when Host or request URL is our domain (Safari/Vercel edge cases)
  const isOurDomainByOrigin =
    (origin && OUR_DOMAINS.includes(origin as (typeof OUR_DOMAINS)[number])) ||
    OUR_DOMAINS.some((d) => fallbackOrigin === d);
  const isOurDomainByHost =
    process.env.NODE_ENV === 'production' &&
    (hostOnly === 'homecheff.eu' || hostOnly === 'www.homecheff.eu' || hostOnly === 'homecheff.nl' || hostOnly === 'www.homecheff.nl');
  const isOurDomainByUrl =
    process.env.NODE_ENV === 'production' && urlOrigin && OUR_DOMAINS.includes(urlOrigin as (typeof OUR_DOMAINS)[number]);
  // Production: also allow when request URL hostname is our domain (request.url may be the only reliable source in serverless)
  const urlHost = typeof request.url === 'string' ? (() => { try { return new URL(request.url).hostname; } catch { return ''; } })() : '';
  const isOurDomainByUrlHost =
    process.env.NODE_ENV === 'production' &&
    (urlHost === 'homecheff.eu' || urlHost === 'www.homecheff.eu' || urlHost === 'homecheff.nl' || urlHost === 'www.homecheff.nl');
  const isOurDomain = isOurDomainByOrigin || isOurDomainByHost || isOurDomainByUrl || isOurDomainByUrlHost;
  const allowed = process.env.NODE_ENV === 'development' ? isLocalDevOrigin : isOurDomain;
  let allowOrigin: string | undefined = allowed
    ? rawOrigin === 'null'
      ? 'null'
      : (origin || fallbackOrigin || urlOrigin)
    : undefined;
  if (process.env.NODE_ENV === 'production' && !allowOrigin && isOurDomainByUrlHost)
    allowOrigin = urlOrigin || `https://${urlHost}`;

  if (!allowOrigin) return {};
  return corsHeadersFor(allowOrigin, isApiOrI18n);
}
