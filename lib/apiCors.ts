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
  const host = request.headers.get('host') || '';
  const proto = request.headers.get('x-forwarded-proto') || request.nextUrl?.protocol?.replace(':', '') || 'http';
  const fallbackOrigin = host ? `${proto}://${host}` : (request.nextUrl?.origin ?? '');
  const rawOrigin = request.headers.get('origin');
  // Safari/iOS can send "null" or omit Origin for same-origin; use request host as origin
  const origin =
    rawOrigin && rawOrigin !== 'null' ? rawOrigin : request.nextUrl?.origin || fallbackOrigin;

  const isLocalDevOrigin =
    !origin ||
    origin === 'null' ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(origin);
  const isOurDomain =
    (origin && OUR_DOMAINS.includes(origin as (typeof OUR_DOMAINS)[number])) ||
    OUR_DOMAINS.some((d) => fallbackOrigin === d);
  const allowed = process.env.NODE_ENV === 'development' ? isLocalDevOrigin : isOurDomain;
  const allowOrigin = allowed ? (origin || fallbackOrigin) : undefined;

  if (!allowOrigin) return {};
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
