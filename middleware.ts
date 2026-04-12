import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCorsHeaders } from '@/lib/apiCors';
import { getSecurityHeaders } from '@/lib/security';

const EU_HOST = 'homecheff.eu';

/** Tab/PWA assets: geen CSP op deze responses — Safari weigert anders vaak de favicon en blijft op platform-default (Vercel-driehoek). Alleen favicon.ico zat al in de matcher-exclude. */
function isPublicIconOrManifestPath(pathname: string): boolean {
  return (
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icon-') ||
    pathname === '/icon.png' ||
    pathname === '/apple-icon.png' ||
    pathname === '/apple-touch-icon.png' ||
    pathname === '/manifest.json'
  );
}

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

  // CORS voor API en i18n: één bron van waarheid via getCorsHeaders (Safari preflight + credentials).
  const isApiOrI18n = pathname.startsWith('/api/') || pathname.startsWith('/i18n/');
  if (isApiOrI18n) {
    const corsHeaders = getCorsHeaders(request);
    if (Object.keys(corsHeaders).length > 0) {
      if (request.method === 'OPTIONS') {
        return new NextResponse(null, { status: 204, headers: corsHeaders });
      }
      const res = NextResponse.next();
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }
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

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });
  // Security headers alleen op pagina's, nooit op /api (video-proxy mag geen CSP krijgen, anders laadt video niet in Edge)
  // Ook niet op favicon/PNG icons/manifest: CSP op image-responses breekt tab-favicon in Safari.
  if (!pathname.startsWith('/api/') && !isPublicIconOrManifestPath(pathname)) {
    const security = getSecurityHeaders();
    Object.entries(security).forEach(([key, value]) => res.headers.set(key, value));
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
