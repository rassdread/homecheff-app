import { NextRequest, NextResponse } from 'next/server';
import { getCorsHeaders } from '@/lib/apiCors';
import { getNextAuthSharedCookieDomain } from '@/lib/auth-cookie-domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Force-logout endpoint.
 *
 * Waarom dit naast /api/auth/signout bestaat:
 * Safari (vooral op iPhone/iPad in productie) blijft ingelogd na de standaard NextAuth signOut
 * wanneer het sessie-cookie ooit met andere attributen is gezet dan waarmee NextAuth het probeert
 * te wissen — bijv. host-only vs `Domain=.homecheff.eu`, of met/zonder `__Secure-` prefix na een
 * config-wijziging. Een Set-Cookie met afwijkende attributen wordt door Safari als een ander cookie
 * gezien en het oude blijft staan; resultaat: useSession is na signOut nog steeds `authenticated`
 * en de gebruiker komt direct teruggestuurd worden naar de homepage als ingelogde gebruiker.
 *
 * Deze route stuurt voor élke bekende NextAuth-cookienaam meerdere Set-Cookie headers:
 *  - host-only (geen Domain) en met `Domain=.homecheff.eu` (productie SSO over apex + subdomeinen)
 *  - Path=/ (verplicht; NextAuth gebruikt altijd Path=/)
 *  - Secure + SameSite=Lax in productie (zoals NextAuth ze schreef)
 *  - Expires in het verleden + Max-Age=0 zodat élke browser ze afdankt.
 */

const NEXT_AUTH_BASE_NAMES = [
  'next-auth.session-token',
  'next-auth.callback-url',
  'next-auth.csrf-token',
  'next-auth.pkce.code_verifier',
  'next-auth.state',
  // Chunked sessie-cookies (NextAuth knipt grote JWT's in delen `.0`, `.1`, ...).
  'next-auth.session-token.0',
  'next-auth.session-token.1',
  'next-auth.session-token.2',
];

const SECURE_PREFIX_NAMES = NEXT_AUTH_BASE_NAMES.map((n) => `__Secure-${n}`);
const HOST_PREFIX_NAMES = [
  '__Host-next-auth.csrf-token',
  '__Host-next-auth.session-token',
];

const ALL_COOKIE_NAMES = [
  ...NEXT_AUTH_BASE_NAMES,
  ...SECURE_PREFIX_NAMES,
  ...HOST_PREFIX_NAMES,
];

function buildClearHeaders(req: NextRequest): Headers {
  const isProd = process.env.NODE_ENV === 'production';
  const headers = new Headers();

  // CORS (Safari preflight + credentials)
  const cors = getCorsHeaders(req);
  for (const [k, v] of Object.entries(cors)) headers.set(k, v);

  // Domeinen waarop het cookie ooit gezet kan zijn:
  //  - host-only (zonder Domain attribuut)
  //  - .homecheff.eu (alleen in productie config geactiveerd)
  //  - exact host (sommige browsers houden ook host-only met Domain=apex aan)
  const sharedDomain = getNextAuthSharedCookieDomain(); // bijv. ".homecheff.eu" of undefined
  const reqHost =
    req.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    req.headers.get('host') ||
    '';

  const domainVariants = new Set<string | null>();
  domainVariants.add(null); // host-only
  if (sharedDomain) domainVariants.add(sharedDomain);
  if (isProd) {
    // Veiligheidsnet voor SSO-boom homecheff.eu, ook als env-var (nog) niet gezet is.
    domainVariants.add('.homecheff.eu');
    domainVariants.add('homecheff.eu');
  }
  if (reqHost) {
    // Sommige Safari-versies houden ook een variant aan met Domain=exacte host.
    domainVariants.add(reqHost);
  }

  const expires = 'Thu, 01 Jan 1970 00:00:00 GMT';

  for (const name of ALL_COOKIE_NAMES) {
    for (const domain of domainVariants) {
      // __Host- cookies mogen geen Domain attribuut hebben (browser weigert ze anders).
      if (name.startsWith('__Host-') && domain !== null) continue;
      // __Secure- en alle prod cookies vereisen Secure attribuut.
      const needsSecure = isProd || name.startsWith('__Secure-') || name.startsWith('__Host-');

      const parts = [
        `${name}=`,
        `Path=/`,
        `Expires=${expires}`,
        `Max-Age=0`,
        `SameSite=Lax`,
      ];
      if (domain) parts.push(`Domain=${domain}`);
      if (needsSecure) parts.push('Secure');
      // HttpOnly mag bij overschrijven; de browser kijkt naar (name, domain, path) match.
      parts.push('HttpOnly');

      headers.append('Set-Cookie', parts.join('; '));
    }
  }

  // Cache-Control: voorkom dat een proxy/edge ergens een cached "still logged in" response houdt.
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  headers.set('Pragma', 'no-cache');

  return headers;
}

export async function POST(req: NextRequest) {
  const headers = buildClearHeaders(req);
  return new NextResponse(JSON.stringify({ ok: true }), {
    status: 200,
    headers: (() => {
      headers.set('Content-Type', 'application/json');
      return headers;
    })(),
  });
}

// Toestaan zodat een eenvoudige <a href="/api/auth/force-logout"> ook werkt als ultieme fallback.
export async function GET(req: NextRequest) {
  const headers = buildClearHeaders(req);
  // 303 zodat browsers altijd met GET volgen, ongeacht originele methode.
  headers.set('Location', '/');
  return new NextResponse(null, { status: 303, headers });
}

export async function OPTIONS(req: NextRequest) {
  const cors = getCorsHeaders(req);
  return new NextResponse(null, { status: 204, headers: cors });
}
