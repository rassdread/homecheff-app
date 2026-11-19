import { sanitizePostAuthRelativeUrl } from '@/lib/auth/post-auth-redirect';
import { NEXTAUTH_SESSION_COOKIE_NAME } from '@/lib/auth/session-cookie-name';

/**
 * A browser cannot forge Origin. The installed wrapper may post from
 * capacitor://localhost or https://localhost when it is not already on the site.
 * Any other cross-site form would log the visitor into the attacker's account.
 */
export function nativeSessionPostAllowed(input: {
  requestUrl: string;
  origin: string | null;
  fetchSite: string | null;
}): boolean {
  let request: URL;
  try {
    request = new URL(input.requestUrl);
  } catch {
    return false;
  }
  const originHeader = (input.origin || '').trim();
  const site = (input.fetchSite || '').trim().toLowerCase();

  if (site === 'cross-site') {
    return isInstalledAppOrigin(originHeader);
  }

  if (originHeader && originHeader !== 'null') {
    let origin: URL;
    try {
      origin = new URL(originHeader);
    } catch {
      return false;
    }
    if (origin.origin === request.origin) return true;
    if (sameRegistrableHost(origin.hostname, request.hostname)) return true;
    if (isInstalledAppOrigin(origin.origin) && isLocalHost(request.hostname)) return true;
    return false;
  }

  return site === 'same-origin' || site === 'none';
}

function isInstalledAppOrigin(origin: string): boolean {
  return origin === 'capacitor://localhost' || origin === 'https://localhost';
}

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function sameRegistrableHost(left: string, right: string): boolean {
  const bare = (host: string) => host.toLowerCase().replace(/^www\./, '');
  const a = bare(left);
  const b = bare(right);
  if (a !== b) return false;
  return /^(?:[a-z0-9-]+\.)?homecheff\.(eu|nl)$/i.test(a) || isLocalHost(a);
}

/** Same-origin landing after a verified native Google document POST. */
export function nativeDocumentRedirectTarget(returnTo: string, requestUrl: string): string | null {
  if (!returnTo) return null;
  let request: URL;
  try {
    request = new URL(requestUrl);
  } catch {
    return null;
  }
  let parsed: URL;
  try {
    parsed = new URL(returnTo, request);
  } catch {
    return `${request.origin}/`;
  }
  if (parsed.origin !== request.origin) return `${request.origin}/`;
  const path = parsed.pathname.replace(/\/+$/, '') || '/';
  if (path === '/auth/social-success') {
    const next = sanitizePostAuthRelativeUrl(parsed.searchParams.get('next'));
    const target = new URL('/auth/social-success', request);
    if (next && next !== '/') target.searchParams.set('next', next);
    return target.toString();
  }
  const safe = sanitizePostAuthRelativeUrl(`${parsed.pathname}${parsed.search}`);
  return new URL(safe || '/', request).toString();
}

function documentHostAllowed(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1') return true;
  return (
    host === 'homecheff.eu' ||
    host.endsWith('.homecheff.eu') ||
    host === 'homecheff.nl' ||
    host.endsWith('.homecheff.nl')
  );
}

/**
 * Android WebView stores a session cookie on a document response and drops the
 * same Set-Cookie when it only arrives on a 303. The page then navigates.
 */
export function nativeSessionDocument(
  setCookie: string,
  target: string,
  authRef: string,
): { body: string; setCookie: string } | null {
  if (!setCookie.startsWith(`${NEXTAUTH_SESSION_COOKIE_NAME}=`)) return null;
  if (!/^[a-f0-9]{8}$/.test(authRef)) return null;
  let url: URL;
  try {
    url = new URL(target);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (!documentHostAllowed(url.hostname)) return null;
  const landing = url.toString();
  const href = landing.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  const body = `<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="same-origin"></head><body><p><a href="${href}">Doorgaan</a></p><script>location.replace(${JSON.stringify(landing)})</script></body></html>`;
  return { body, setCookie };
}

/** True when the follow-up request carried the session cookie name. Never reads the value. */
export function sawNativeSessionCookie(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;
  return cookieHeader.split(';').some((part) => {
    const name = part.split('=', 1)[0]?.trim();
    return (
      name === NEXTAUTH_SESSION_COOKIE_NAME ||
      Boolean(name?.startsWith(`${NEXTAUTH_SESSION_COOKIE_NAME}.`))
    );
  });
}
