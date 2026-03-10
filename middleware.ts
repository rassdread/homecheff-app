import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // CORS voor API en i18n: voorkom "Load failed" / "access control checks" (lokaal + iPhone Safari/PWA)
  const isApiOrI18n = pathname.startsWith('/api/') || pathname.startsWith('/i18n/');
  if (isApiOrI18n) {
    const host = request.headers.get('host') || '';
    const proto = request.headers.get('x-forwarded-proto') || request.nextUrl.protocol?.replace(':', '') || 'http';
    const fallbackOrigin = host ? `${proto}://${host}` : request.nextUrl.origin;
    const rawOrigin = request.headers.get('origin');
    // Safari/iOS can send Origin: null or omit it for same-origin; use Host as origin
    const origin =
      rawOrigin && rawOrigin !== 'null' ? rawOrigin : request.nextUrl.origin || fallbackOrigin;
    // Development: localhost, 127.0.0.1, of lokaal netwerk; allow both so 127.0.0.1 ↔ localhost werkt
    const isLocalDevOrigin =
      !origin ||
      origin === 'null' ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(origin);
    const isOurDomain =
      origin === 'https://homecheff.eu' ||
      origin === 'https://homecheff.nl' ||
      origin === 'https://www.homecheff.eu' ||
      origin === 'https://www.homecheff.nl' ||
      fallbackOrigin === 'https://homecheff.eu' ||
      fallbackOrigin === 'https://homecheff.nl' ||
      fallbackOrigin === 'https://www.homecheff.eu' ||
      fallbackOrigin === 'https://www.homecheff.nl';
    const allowedOrigins =
      process.env.NODE_ENV === 'development'
        ? isLocalDevOrigin
        : isOurDomain;
    // Use request origin when allowed; if missing (e.g. same-origin) use Host so CORS header is always set
    const allowOrigin = allowedOrigins ? (origin || fallbackOrigin) : undefined;
    const corsHeaders: Record<string, string> = {};
    if (allowOrigin) {
      corsHeaders['Access-Control-Allow-Origin'] = allowOrigin;
      corsHeaders['Access-Control-Allow-Credentials'] = 'true';
      corsHeaders['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      corsHeaders['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    }
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: corsHeaders });
    }
    const res = NextResponse.next();
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  // Taal per domein doorgeven ( .nl = nl, .eu = en ) zodat layout/main page niet in conflict komen
  const host = request.headers.get('host') || '';
  const domainLang = host.includes('homecheff.eu') ? 'en' : 'nl';
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('X-HomeCheff-Language', domainLang);

  // Check for referral parameter on any page
  const refCode = searchParams.get('ref');
  if (refCode) {
    const isExcludedPath =
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/welkom/') ||
      pathname.startsWith('/uitnodiging/');
    if (!isExcludedPath) {
      const cleanUrl = new URL(request.url);
      cleanUrl.searchParams.delete('ref');
      const redirectUrl = cleanUrl.pathname + cleanUrl.search;
      const url = new URL(
        `/api/affiliate/referral?code=${refCode}&redirect=${encodeURIComponent(redirectUrl)}`,
        request.url
      );
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
