import { NextRequest, NextResponse } from 'next/server';
import { decode, encode } from 'next-auth/jwt';
import { getCorsHeaders } from '@/lib/apiCors';
import { getNextAuthSharedCookieDomain } from '@/lib/auth-cookie-domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Session-mode endpoint: implementeert "Onthoud mij" zonder NextAuth's globale `session.maxAge`
 * te veranderen.
 *
 * Werking:
 *  - Leest de huidige NextAuth sessie-cookie (`next-auth.session-token` of, voor stale cookies,
 *    `__Secure-next-auth.session-token` / chunked .0/.1).
 *  - Decodeert de JWE met `next-auth/jwt`.
 *  - Re-encodeert de JWT met een nieuwe `maxAge`:
 *      remember=true  → REMEMBER_LONG_MAX_AGE  (zelfde 30 dagen als auth.ts)
 *      remember=false → REMEMBER_SHORT_MAX_AGE (8 uur — niet "remember me")
 *  - Schrijft het cookie met EXACT dezelfde attributen als auth.ts (Domain, SameSite, Secure,
 *    HttpOnly, Path) zodat:
 *      a) `homecheff.eu` ↔ `growth.homecheff.eu` SSO blijft werken (Domain=.homecheff.eu in prod);
 *      b) Safari het cookie niet als "ander cookie" ziet en het niet onverwacht laat staan.
 *  - Bij remember=false wordt het cookie ZONDER `Max-Age` geschreven → session cookie die
 *    bij browser-close verdwijnt. De JWT-`exp` is daarbij ook 8 uur, dus zelfs als Safari/iOS
 *    het cookie marginaal langer onthoudt blijft de sessie server-side ongeldig.
 *
 * Voorkeur kan worden meegegeven via:
 *   - JSON body `{ "remember": true|false }`  (credentials login)
 *   - Cookie `hc-remember-pref=1|0`           (social login flow, ingesteld vóór redirect)
 *
 * Geen wijziging aan force-logout of de globale auth.ts maxAge: één login-keuze, niets anders.
 */

const REMEMBER_LONG_MAX_AGE = 30 * 24 * 60 * 60; // 30 dagen — zelfde als auth.ts session.maxAge
const REMEMBER_SHORT_MAX_AGE = 8 * 60 * 60; // 8 uur — harde cap voor "niet onthouden" sessie

const PREFERENCE_COOKIE_NAME = 'hc-remember-pref';

const PRIMARY_SESSION_COOKIE_NAME = 'next-auth.session-token';
const LEGACY_SESSION_COOKIE_NAMES = [
  '__Secure-next-auth.session-token',
];

function readRememberFromBody(body: unknown): boolean | null {
  if (body && typeof body === 'object' && 'remember' in body) {
    const v = (body as { remember: unknown }).remember;
    if (typeof v === 'boolean') return v;
    if (v === '1' || v === 'true') return true;
    if (v === '0' || v === 'false') return false;
  }
  return null;
}

function readRememberFromCookie(req: NextRequest): boolean | null {
  const v = req.cookies.get(PREFERENCE_COOKIE_NAME)?.value;
  if (v === '1' || v === 'true') return true;
  if (v === '0' || v === 'false') return false;
  return null;
}

function readSessionTokenFromCookies(req: NextRequest): { name: string; value: string } | null {
  // Probeer eerst de canonieke (huidige) cookie-naam.
  const primary = req.cookies.get(PRIMARY_SESSION_COOKIE_NAME)?.value;
  if (primary) return { name: PRIMARY_SESSION_COOKIE_NAME, value: primary };

  // Stale __Secure- variant na config-wissel — herschrijven we naar de canonieke naam.
  for (const name of LEGACY_SESSION_COOKIE_NAMES) {
    const v = req.cookies.get(name)?.value;
    if (v) return { name, value: v };
  }

  // Chunked sessie-cookies (NextAuth knipt grote JWT's in `.0`, `.1`, ...).
  const chunk0 = req.cookies.get(`${PRIMARY_SESSION_COOKIE_NAME}.0`)?.value;
  if (chunk0) {
    let combined = chunk0;
    let idx = 1;
    while (idx < 10) {
      const next = req.cookies.get(`${PRIMARY_SESSION_COOKIE_NAME}.${idx}`)?.value;
      if (!next) break;
      combined += next;
      idx += 1;
    }
    return { name: PRIMARY_SESSION_COOKIE_NAME, value: combined };
  }

  return null;
}

function buildSessionCookieAttributes(maxAge: number | null): string[] {
  const isProd = process.env.NODE_ENV === 'production';
  const domain = getNextAuthSharedCookieDomain(); // bijv. ".homecheff.eu" of undefined

  const parts: string[] = [
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (maxAge !== null) {
    parts.push(`Max-Age=${maxAge}`);
    parts.push(`Expires=${new Date(Date.now() + maxAge * 1000).toUTCString()}`);
  }
  if (isProd) parts.push('Secure');
  if (domain) parts.push(`Domain=${domain}`);
  return parts;
}

function buildClearCookie(name: string, withDomain: string | null): string {
  const isProd = process.env.NODE_ENV === 'production';
  const parts: string[] = [
    `${name}=`,
    'Path=/',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'Max-Age=0',
    'SameSite=Lax',
    'HttpOnly',
  ];
  if (isProd) parts.push('Secure');
  if (withDomain) parts.push(`Domain=${withDomain}`);
  return parts.join('; ');
}

async function applySessionMode(req: NextRequest, remember: boolean): Promise<NextResponse> {
  const secret = process.env.NEXTAUTH_SECRET;
  const headers = new Headers();
  const cors = getCorsHeaders(req);
  for (const [k, v] of Object.entries(cors)) headers.set(k, v);
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  headers.set('Content-Type', 'application/json');

  if (!secret) {
    return new NextResponse(
      JSON.stringify({ ok: false, error: 'no_nextauth_secret' }),
      { status: 500, headers },
    );
  }

  const sessionCookie = readSessionTokenFromCookies(req);
  if (!sessionCookie) {
    // Niets om te herschrijven; toch ok-respons zodat client-side flow door kan gaan.
    return new NextResponse(
      JSON.stringify({ ok: false, error: 'no_session_cookie' }),
      { status: 200, headers },
    );
  }

  let payload: Record<string, unknown> | null = null;
  try {
    const decoded = await decode({ token: sessionCookie.value, secret });
    if (decoded && typeof decoded === 'object') {
      payload = { ...(decoded as Record<string, unknown>) };
    }
  } catch {
    payload = null;
  }

  if (!payload) {
    return new NextResponse(
      JSON.stringify({ ok: false, error: 'invalid_session_token' }),
      { status: 200, headers },
    );
  }

  // iat/exp/jti laten we encode opnieuw zetten op basis van maxAge.
  delete payload.iat;
  delete payload.exp;
  delete payload.jti;

  const maxAge = remember ? REMEMBER_LONG_MAX_AGE : REMEMBER_SHORT_MAX_AGE;
  let reEncoded: string;
  try {
    reEncoded = await encode({ token: payload, secret, maxAge });
  } catch {
    return new NextResponse(
      JSON.stringify({ ok: false, error: 'encode_failed' }),
      { status: 500, headers },
    );
  }

  // Als we een legacy cookie-naam vonden (bijv. __Secure-…), wis die expliciet zodat we
  // straks niet twee parallelle sessie-cookies hebben.
  if (sessionCookie.name !== PRIMARY_SESSION_COOKIE_NAME) {
    const sharedDomain = getNextAuthSharedCookieDomain() ?? null;
    headers.append('Set-Cookie', buildClearCookie(sessionCookie.name, null));
    if (sharedDomain) {
      headers.append('Set-Cookie', buildClearCookie(sessionCookie.name, sharedDomain));
    }
  }

  // Schrijf de canonieke sessie-cookie. Bij `remember=false` GEEN Max-Age (session cookie).
  const cookieAttrs = buildSessionCookieAttributes(remember ? maxAge : null);
  headers.append(
    'Set-Cookie',
    [`${PRIMARY_SESSION_COOKIE_NAME}=${reEncoded}`, ...cookieAttrs].join('; '),
  );

  // Voorkeur-cookie altijd opruimen na gebruik (was alleen nodig om de keuze door de OAuth
  // redirect heen te krijgen). Beide domain-varianten voor de zekerheid.
  const sharedDomain = getNextAuthSharedCookieDomain() ?? null;
  const isProd = process.env.NODE_ENV === 'production';
  const prefSecure = isProd ? '; Secure' : '';
  headers.append(
    'Set-Cookie',
    `${PREFERENCE_COOKIE_NAME}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${prefSecure}`,
  );
  if (sharedDomain) {
    headers.append(
      'Set-Cookie',
      `${PREFERENCE_COOKIE_NAME}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Domain=${sharedDomain}${prefSecure}`,
    );
  }

  return new NextResponse(
    JSON.stringify({ ok: true, remember, maxAge: remember ? maxAge : null }),
    { status: 200, headers },
  );
}

export async function POST(req: NextRequest) {
  let body: unknown = null;
  try {
    if (req.headers.get('content-type')?.includes('application/json')) {
      body = await req.json();
    }
  } catch {
    body = null;
  }

  const fromBody = readRememberFromBody(body);
  const fromCookie = readRememberFromCookie(req);

  // Body wint van cookie. Als geen van beide aanwezig is: standaard "niet onthouden" (veiligst).
  const remember = fromBody ?? fromCookie ?? false;

  return applySessionMode(req, remember);
}

export async function OPTIONS(req: NextRequest) {
  const cors = getCorsHeaders(req);
  return new NextResponse(null, { status: 204, headers: cors });
}
