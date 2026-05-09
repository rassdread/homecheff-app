/**
 * Safe links naar publieke maker-profielen (/user/[username]).
 * Gebruikersnamen die tijdelijk of ongeldig lijken krijgen geen klikbare publieke URL.
 */
export function isPublicUsername(username: string | null | undefined): boolean {
  if (!username || typeof username !== 'string') return false;
  const u = username.trim();
  if (u.length < 2) return false;
  if (/^temp/i.test(u)) return false;
  if (/^user[_-]?\d+$/i.test(u)) return false;
  if (u.includes(' ') || u.includes('@')) return false;
  return /^[a-zA-Z0-9._-]+$/.test(u);
}

/** Publieke profiel-URL of `null` als we beter geen link tonen. */
export function publicProfileHref(userId: string, username: string | null): string | null {
  if (isPublicUsername(username)) return `/user/${username as string}`;
  return null;
}

/** Fallback voor eigen rij of legacy: alleen gebruiken als expliciet gewenst. */
export function profileFallbackHref(userId: string): string {
  return `/profile/${userId}`;
}
