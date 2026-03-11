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
  // In Route Handlers request.nextUrl may be undefined; fallback to request.url
  const urlOrigin = typeof request.url === 'string' ? (() => { try { return new URL(request.url).origin; } catch { return ''; } })() : '';
  const proto = request.headers.get('x-forwarded-proto') || request.nextUrl?.protocol?.replace(':', '') || (urlOrigin ? new URL(urlOrigin).protocol?.replace(':', '') : '') || 'http';
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
  // When Origin is the literal "null", CORS spec requires responding with "null" for browser to accept
  let allowOrigin: string | undefined = allowed
    ? rawOrigin === 'null'
      ? 'null'
      : (origin || fallbackOrigin || urlOrigin)
    : undefined;
  // Production last resort: if request.url points to our host but we still have no origin, allow with canonical origin (Safari same-origin)
  if (process.env.NODE_ENV === 'production' && !allowOrigin && isOurDomainByUrlHost)
    allowOrigin = urlOrigin || `https://${urlHost}`;
  // Final fallback for production /api: always send CORS so Safari never gets a response without headers (avoids "access control checks").
  // Use Host-based origin or canonical .eu; never use urlOrigin here as it can be Vercel-internal and would mismatch the browser origin.
  const pathname = typeof request.url === 'string' ? (() => { try { return new URL(request.url).pathname; } catch { return ''; } })() : '';
  if (process.env.NODE_ENV === 'production' && !allowOrigin && (pathname.startsWith('/api/') || pathname.startsWith('/i18n/'))) {
    const canonicalOrigin =
      hostOnly === 'homecheff.eu' || hostOnly === 'www.homecheff.eu' || hostOnly === 'homecheff.nl' || hostOnly === 'www.homecheff.nl'
        ? `${effectiveProto}://${hostOnly}`
        : 'https://homecheff.eu';
    allowOrigin = rawOrigin === 'null' ? 'null' : canonicalOrigin;
  }

  if (!allowOrigin) return {};
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
