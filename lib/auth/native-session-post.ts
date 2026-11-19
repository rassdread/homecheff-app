import { sanitizePostAuthRelativeUrl } from '@/lib/auth/post-auth-redirect';

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
