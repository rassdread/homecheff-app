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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isPublicUserIdSegment(userId: string | null | undefined): boolean {
  if (!userId || typeof userId !== 'string') return false;
  return UUID_RE.test(userId.trim());
}

/**
 * Publieke maker-link voor ranglijsten: `/user/[username]` of `/user/[uuid]` (zelfde route als username).
 * Geen link als het profiel niet openbaar is.
 */
export function publicLeaderboardProfileHref(
  userId: string,
  username: string | null | undefined,
  profilePublic: boolean
): string | null {
  if (!profilePublic) return null;
  if (isPublicUsername(username)) return `/user/${(username as string).trim()}`;
  if (isPublicUserIdSegment(userId)) return `/user/${userId.trim()}`;
  return null;
}

/** Client: gebruik `row.publicProfileHref` van de API als die er is, anders legacy username-only. */
export function leaderboardRowPublicHref(row: {
  userId: string;
  username: string | null;
  publicProfileHref?: string | null;
}): string | null {
  if (row.publicProfileHref) return row.publicProfileHref;
  return publicProfileHref(row.userId, row.username);
}

