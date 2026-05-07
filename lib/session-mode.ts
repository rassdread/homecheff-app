/**
 * Client-side helpers voor de "Onthoud mij" flow.
 *
 * Voor credentials login kunnen we de voorkeur direct in de body van het session-mode
 * endpoint sturen. Voor social (OAuth) login is dat niet mogelijk omdat we naar de
 * provider redirecten en pas later op `/social-login-success` terugkomen — daar moet
 * de voorkeur dus tijdens de redirect ergens bewaard worden. Daarvoor zetten we een
 * korte (10 min) niet-HttpOnly voorkeur-cookie + localStorage backup.
 */

const PREFERENCE_COOKIE_NAME = 'hc-remember-pref';
const PREFERENCE_LOCAL_KEY = 'hc:remember-me-pref';
const PREFERENCE_TTL_SECONDS = 10 * 60; // 10 minuten — ruim genoeg voor OAuth roundtrip

function isProdHost(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.protocol === 'https:';
}

function sharedCookieDomain(): string | null {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname;
  if (host === 'homecheff.eu' || host.endsWith('.homecheff.eu')) {
    return '.homecheff.eu';
  }
  return null;
}

/** Voorkeur klaarzetten zodat hij de OAuth redirect overleeft. */
export function setRememberPreference(remember: boolean): void {
  if (typeof window === 'undefined') return;

  // localStorage backup (overleeft hard refresh, maar niet cross-domain SSO).
  try {
    window.localStorage.setItem(PREFERENCE_LOCAL_KEY, remember ? '1' : '0');
  } catch {
    /* private mode / quota: cookie is voldoende */
  }

  // Voorkeur-cookie (door server gelezen op /api/auth/session-mode).
  // Niet HttpOnly want hij wordt door client gezet; SameSite=Lax zodat OAuth-redirect
  // hem terugbrengt; korte TTL want hij is alleen tijdens de login flow nodig.
  const secure = isProdHost() ? '; Secure' : '';
  const domain = sharedCookieDomain();
  const domainPart = domain ? `; Domain=${domain}` : '';
  document.cookie =
    `${PREFERENCE_COOKIE_NAME}=${remember ? '1' : '0'}; Path=/; Max-Age=${PREFERENCE_TTL_SECONDS}; SameSite=Lax${secure}${domainPart}`;
}

/** Voorkeur lezen op de social-login-success page. */
export function readRememberPreference(): boolean | null {
  if (typeof window === 'undefined') return null;

  // Cookie eerst (gezet vóór OAuth redirect).
  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${PREFERENCE_COOKIE_NAME}=`));
  if (match) {
    const value = match.slice(PREFERENCE_COOKIE_NAME.length + 1);
    if (value === '1' || value === 'true') return true;
    if (value === '0' || value === 'false') return false;
  }

  // localStorage backup.
  try {
    const v = window.localStorage.getItem(PREFERENCE_LOCAL_KEY);
    if (v === '1' || v === 'true') return true;
    if (v === '0' || v === 'false') return false;
  } catch {
    /* ignore */
  }

  return null;
}

/** Voorkeur opruimen na finalize. */
export function clearRememberPreference(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(PREFERENCE_LOCAL_KEY);
  } catch {
    /* ignore */
  }
  const secure = isProdHost() ? '; Secure' : '';
  const domain = sharedCookieDomain();
  document.cookie =
    `${PREFERENCE_COOKIE_NAME}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure}`;
  if (domain) {
    document.cookie =
      `${PREFERENCE_COOKIE_NAME}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure}; Domain=${domain}`;
  }
}

/**
 * Roep het server-endpoint aan dat het sessie-cookie herschrijft.
 *
 * - `remember`: expliciete keuze (uit het login-formulier of localStorage backup).
 *   Als `null`: server leest de `hc-remember-pref` cookie zelf, met fallback `false`.
 *
 * Faalt nooit: bij netwerkfout doen we niets en valt het systeem terug op de
 * default 30-dagen NextAuth-cookie. Dat is bewust geen showstopper voor login.
 */
export async function applySessionMode(remember: boolean | null): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch('/api/auth/session-mode', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(remember === null ? {} : { remember }),
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearRememberPreference();
  }
}
