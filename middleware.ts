import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCorsHeaders } from '@/lib/apiCors';
import { getSecurityHeaders } from '@/lib/security-headers';
import {
  shouldBlockSuspendedMutation,
  suspensionMutationBlockedResponse,
} from '@/lib/user-suspend-middleware';
import { NEXTAUTH_SESSION_COOKIE_NAME } from '@/lib/auth/session-cookie-name';
import { isKnownHomecheffRootPath, isPublicStaticAssetPath } from '@/lib/seo/known-root-path-segments';
import { resolveColdStartLanguage } from '@/lib/locale';
import {
  countryFromRequestHeaders,
  ECOSYSTEM_LOCALE_COOKIE,
  ECOSYSTEM_LOCALE_PREF_COOKIE,
  MARKETPLACE_LEGACY_LOCALE_COOKIE,
  ecosystemLocaleCookieAttributes,
  parseEcosystemLanguage,
} from '@/lib/ecosystem-locale';
import { getAuthSessionCookieDomain } from '@/lib/auth-origin';

const EU_HOST = 'homecheff.eu';

/** Tab/PWA + brand static assets: geen CSP; nooit LEGAL-0 rewrite naar /hc-http-404. */
function isPublicIconOrManifestPath(pathname: string): boolean {
  return (
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icon-') ||
    pathname === '/icon.png' ||
    pathname === '/apple-icon.png' ||
    pathname === '/apple-touch-icon.png' ||
    pathname === '/manifest.json' ||
    isPublicStaticAssetPath(pathname)
  );
}

function resolveRequestHost(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    request.headers.get('host') ||
    ''
  );
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === '/my-homecheff') {
    const target = request.nextUrl.clone();
    target.pathname = '/mijn-homecheff';
    return NextResponse.redirect(target, 308);
  }

  // Phase 13T — block API mutations for suspended authenticated users (SSOT in user-suspend-middleware.ts)
  if (shouldBlockSuspendedMutation(pathname, request.method)) {
    // SP.2D-C7 — load jose/next-auth/jwt only when this path actually needs it.
    const { getToken } = await import('next-auth/jwt');
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      // Must match lib/auth.ts cookie name (not the default __Secure- prefixed name).
      cookieName: NEXTAUTH_SESSION_COOKIE_NAME,
    });
    const userId = token?.id ? String(token.id) : null;
    if (userId) {
      let suspended = Boolean(token.suspended);
      const internalSecret = process.env.INTERNAL_API_SECRET || process.env.NEXTAUTH_SECRET;
      if (internalSecret) {
        try {
          const checkUrl = new URL('/api/internal/user-suspended', request.url);
          checkUrl.searchParams.set('userId', userId);
          const checkRes = await fetch(checkUrl.toString(), {
            headers: { 'x-internal-secret': internalSecret },
            cache: 'no-store',
          });
          if (checkRes.ok) {
            const body = (await checkRes.json()) as { suspended?: boolean };
            suspended = Boolean(body.suspended);
          }
        } catch {
          // Fall back to JWT flag if internal check fails
        }
      }
      if (suspended) {
        const corsHeaders = getCorsHeaders(request);
        const blocked = suspensionMutationBlockedResponse();
        Object.entries(corsHeaders).forEach(([k, v]) => blocked.headers.set(k, v));
        return blocked;
      }
    }
  }

  // Canonical host for OAuth cookies/PKCE: www and .nl must not start Google OAuth
  // with a different redirect_uri than https://homecheff.eu/api/auth/callback/google.
  // Stripe webhooks must NEVER 307 — Stripe does not follow redirects; settlement would never run.
  const requestHost = resolveRequestHost(request);
  const isWwwEu = requestHost === 'www.homecheff.eu';
  const isNlDomain = requestHost === 'homecheff.nl' || requestHost === 'www.homecheff.nl';
  const isStripeWebhookPath =
    pathname === '/api/stripe/webhook' || pathname === '/api/stripe/connect/webhook';
  if ((isWwwEu || isNlDomain) && !isStripeWebhookPath) {
    const search = request.nextUrl.search || '';
    const redirectUrl = `https://${EU_HOST}${pathname}${search}`;
    const redirectResponse = NextResponse.redirect(redirectUrl, 307);
    if (isNlDomain) {
      // Bezoeker van .nl landt op .eu in het Nederlands (explicit market preference).
      const domain = getAuthSessionCookieDomain();
      for (const c of ecosystemLocaleCookieAttributes({
        language: 'nl',
        explicit: true,
        domain,
        secure: true,
      })) {
        redirectResponse.cookies.set(c.name, c.value, {
          path: c.path,
          sameSite: c.sameSite,
          maxAge: c.maxAge,
          secure: c.secure,
          ...(c.domain ? { domain: c.domain } : {}),
        });
      }
      redirectResponse.cookies.set(MARKETPLACE_LEGACY_LOCALE_COOKIE, 'nl', {
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
        secure: true,
        ...(domain ? { domain } : {}),
      });
    }
    // Behoud affiliate-referralcookie over host-canonicalisatie (anders mis je attributie).
    const hcRef = request.cookies.get('hc_ref')?.value;
    if (hcRef) {
      redirectResponse.cookies.set('hc_ref', hcRef, {
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        secure: true,
      });
    }
    const hcBetaSrc = request.cookies.get('hc_beta_src')?.value;
    if (hcBetaSrc) {
      redirectResponse.cookies.set('hc_beta_src', hcBetaSrc, {
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        secure: true,
      });
    }
    const hcBetaIntent = request.cookies.get('hc_beta_intent')?.value;
    if (hcBetaIntent) {
      redirectResponse.cookies.set('hc_beta_intent', hcBetaIntent, {
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        secure: true,
      });
    }
    return redirectResponse;
  }

  // SP.2D-C7 — SSO browser hops: host already canonicalized; skip LEGAL-0 / affiliate /
  // entity-exists work. Route handler performs its own client/PKCE/session validation.
  // Security headers still applied for defense-in-depth on any HTML error pages.
  if (pathname.startsWith('/auth/sso/')) {
    const res = NextResponse.next();
    const security = getSecurityHeaders();
    Object.entries(security).forEach(([key, value]) => res.headers.set(key, value));
    return res;
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

  // Taal: explicit/cookie → /en path → IP country (NL/BE/SR→nl) → en
  const host = request.headers.get('host') || '';
  const legacyCookie = request.cookies.get(MARKETPLACE_LEGACY_LOCALE_COOKIE)?.value;
  const ecoCookie = request.cookies.get(ECOSYSTEM_LOCALE_COOKIE)?.value;
  const prefFlag = request.cookies.get(ECOSYSTEM_LOCALE_PREF_COOKIE)?.value;
  const cookieLanguage = parseEcosystemLanguage(ecoCookie) ?? parseEcosystemLanguage(legacyCookie);
  const hasExplicitPreference = prefFlag === '1';
  const countryCode = countryFromRequestHeaders((n) => request.headers.get(n));
  const lang = resolveColdStartLanguage({
    cookieLanguage,
    hasExplicitPreference,
    explicitLanguage: hasExplicitPreference ? cookieLanguage : null,
    pathname,
    host,
    acceptLanguage: request.headers.get('accept-language'),
    countryCode,
  });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('X-HomeCheff-Language', lang);

  const needsLocaleSeed =
    !cookieLanguage &&
    !hasExplicitPreference &&
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/_next/');
  const localeDomain = getAuthSessionCookieDomain();
  const applyLocaleSeed = (res: NextResponse) => {
    if (!needsLocaleSeed) return;
    for (const c of ecosystemLocaleCookieAttributes({
      language: lang,
      explicit: false,
      domain: localeDomain,
      secure: true,
    })) {
      res.cookies.set(c.name, c.value, {
        path: c.path,
        sameSite: c.sameSite,
        maxAge: c.maxAge,
        secure: c.secure,
        ...(c.domain ? { domain: c.domain } : {}),
      });
    }
    res.cookies.set(MARKETPLACE_LEGACY_LOCALE_COOKIE, lang, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 400,
      secure: true,
      ...(localeDomain ? { domain: localeDomain } : {}),
    });
  };

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
      const isBetaAppLanding = pathname === '/app' || pathname.startsWith('/app/');
      const betaQs = isBetaAppLanding ? '&androidBeta=1' : '';
      const url = new URL(
        `/api/affiliate/referral?code=${encodeURIComponent(refCode)}&redirect=${encodeURIComponent(redirectUrl)}${betaQs}`,
        request.url
      );
      return NextResponse.redirect(url);
    }
  }

  const method = request.method;
  const canRewrite404 =
    (method === 'GET' || method === 'HEAD') &&
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/_next/') &&
    !isPublicIconOrManifestPath(pathname);

  if (canRewrite404 && !isKnownHomecheffRootPath(pathname)) {
    const notFoundUrl = request.nextUrl.clone();
    notFoundUrl.pathname = '/hc-http-404';
    notFoundUrl.search = '';
    const notFoundResponse = NextResponse.rewrite(notFoundUrl, {
      request: { headers: requestHeaders },
    });
    notFoundResponse.headers.set('x-robots-tag', 'noindex, nofollow, noarchive');
    applyLocaleSeed(notFoundResponse);
    return notFoundResponse;
  }

  if (canRewrite404) {
    const first = pathname.split('/').filter(Boolean)[0];
    const entityPrefixes = new Set([
      'product',
      'listing',
      'recipe',
      'inspiratie',
      'user',
      'seller',
      'profile',
    ]);
    if (first && entityPrefixes.has(first) && pathname.split('/').filter(Boolean).length >= 2) {
      try {
        const checkUrl = new URL('/api/internal/entity-exists', request.url);
        checkUrl.searchParams.set('pathname', pathname);
        const checkRes = await fetch(checkUrl.toString(), {
          headers: {
            'x-internal-secret': process.env.INTERNAL_API_SECRET || process.env.NEXTAUTH_SECRET || '',
          },
          cache: 'no-store',
        });
        if (checkRes.ok) {
          const body = (await checkRes.json()) as { exists?: boolean | null };
          if (body.exists === false) {
            const notFoundUrl = request.nextUrl.clone();
            notFoundUrl.pathname = '/hc-http-404';
            notFoundUrl.search = '';
            const notFoundResponse = NextResponse.rewrite(notFoundUrl, {
              request: { headers: requestHeaders },
            });
            notFoundResponse.headers.set('x-robots-tag', 'noindex, nofollow, noarchive');
            applyLocaleSeed(notFoundResponse);
            return notFoundResponse;
          }
        }
      } catch {
        // Fall through to App Router notFound() if the lookup fails.
      }
    }
  }

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });
  applyLocaleSeed(res);
  // Security headers alleen op pagina's, nooit op /api (video-proxy mag geen CSP krijgen, anders laadt video niet in Edge)
  // Ook niet op favicon/PNG icons/manifest: CSP op image-responses breekt tab-favicon in Safari.
  if (!pathname.startsWith('/api/') && !isPublicIconOrManifestPath(pathname)) {
    const security = getSecurityHeaders();
    Object.entries(security).forEach(([key, value]) => res.headers.set(key, value));
  }

  // U5 — ensure parent-domain ecosystem epoch when IdP session exists.
  try {
    const hasSession = Boolean(
      request.cookies.get(NEXTAUTH_SESSION_COOKIE_NAME)?.value ||
        request.cookies.get(`__Secure-${NEXTAUTH_SESSION_COOKIE_NAME}`)?.value,
    );
    const {
      HC_ECO_EPOCH_COOKIE,
      HC_ECO_EPOCH_LOGGED_OUT,
      appendSetEcosystemEpochCookie,
      newEcosystemEpoch,
    } = await import('@/lib/ecosystem-session/epoch');
    const epoch = request.cookies.get(HC_ECO_EPOCH_COOKIE)?.value;
    if (hasSession && (!epoch || epoch === HC_ECO_EPOCH_LOGGED_OUT)) {
      appendSetEcosystemEpochCookie(res.headers, newEcosystemEpoch());
    }
  } catch {
    /* best-effort */
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
