import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const EU_HOST = 'homecheff.eu';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // .nl → .eu: alles op één domein (Safari/sessie). Bezoeker landt op .eu in het Nederlands.
  const requestHost =
    request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    request.headers.get('host') ||
    '';
  const isNlDomain = requestHost === 'homecheff.nl' || requestHost === 'www.homecheff.nl';
  if (isNlDomain) {
    const search = request.nextUrl.search || '';
    const redirectUrl = `https://${EU_HOST}${pathname}${search}`;
    const redirectResponse = NextResponse.redirect(redirectUrl, 307);
    redirectResponse.cookies.set('homecheff-language', 'nl', {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
      secure: true,
    });
    return redirectResponse;
  }

  // CORS voor API en i18n (o.a. /api/i18n/nl en /api/i18n/en voor taalwisselaar): bij ontbrekende Origin (Safari) Host gebruiken.
  const OUR_DOMAINS = ['https://homecheff.eu', 'https://homecheff.nl', 'https://www.homecheff.eu', 'https://www.homecheff.nl'];
  const isApiOrI18n = pathname.startsWith('/api/') || pathname.startsWith('/i18n/');
  if (isApiOrI18n) {
    const productionOrigin = 'https://homecheff.eu';
    const rawOrigin = request.headers.get('origin');
    const reqHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() || request.headers.get('host') || '';
    const hostOnly = reqHost.replace(/^https?:\/\//, '').split('/')[0] || '';
    const derivedOrigin = hostOnly && OUR_DOMAINS.some(d => d.includes(hostOnly)) ? `https://${hostOnly}` : null;
    let allowOrigin: string;
    if (process.env.NODE_ENV === 'production') {
      // Safari: Origin often "null" or missing (stripped); only "null" passes access control.
      if (rawOrigin === 'null' || rawOrigin === '' || rawOrigin == null) {
        allowOrigin = 'null';
      } else if (OUR_DOMAINS.includes(rawOrigin)) {
        allowOrigin = rawOrigin;
      } else {
        allowOrigin = derivedOrigin || productionOrigin;
      }
    } else {
      const host =
        request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
        request.headers.get('host') ||
        '';
      const hostOnly = host.replace(/^https?:\/\//, '').split('/')[0] || '';
      const proto = request.headers.get('x-forwarded-proto') || request.nextUrl.protocol?.replace(':', '') || 'http';
      const fallbackOrigin = hostOnly ? `${proto}://${hostOnly}` : request.nextUrl.origin;
      const rawOrigin = request.headers.get('origin');
      const origin =
        rawOrigin && rawOrigin !== 'null' && rawOrigin !== ''
          ? rawOrigin
          : request.nextUrl.origin || fallbackOrigin;
      const isLocal =
        !origin || origin === 'null' || origin.includes('localhost') || origin.includes('127.0.0.1') ||
        /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(origin);
      allowOrigin = isLocal ? (rawOrigin === 'null' ? 'null' : (origin || fallbackOrigin)) : productionOrigin;
    }
    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Vary': 'Origin',
    };
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: corsHeaders });
    }
    const res = NextResponse.next();
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  // Taal: cookie heeft voorrang (zo kan .eu ook NL tonen zonder redirect naar .nl → Safari-safe)
  const host = request.headers.get('host') || '';
  const domainLang = host.includes('homecheff.eu') ? 'en' : 'nl';
  const langCookie = request.cookies.get('homecheff-language')?.value;
  const lang = (langCookie === 'nl' || langCookie === 'en') ? langCookie : domainLang;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('X-HomeCheff-Language', lang);

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
