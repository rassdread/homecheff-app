/**
 * Safe links naar publieke maker-profielen (/user/[username|uuid]).
 * Tijdelijke / ongeldige usernames: link via UUID wanneer beschikbaar.
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

/**
 * Canonical public profile href.
 * Prefer a stable public username; otherwise `/user/[uuid]`.
 */
export function publicProfileHref(
  userId: string,
  username: string | null | undefined,
): string | null {
  if (isPublicUsername(username)) {
    return `/user/${encodeURIComponent((username as string).trim())}`;
  }
  if (isPublicUserIdSegment(userId)) {
    return `/user/${userId.trim()}`;
  }
  return null;
}

/** Alias used by routing contract / UI surfaces. */
export function getPublicProfileHref(
  userId: string,
  username?: string | null,
): string | null {
  return publicProfileHref(userId, username ?? null);
}

/** Legacy name — always `/user/[id]` (never dead `/profile/[id]`). */
export function profileFallbackHref(userId: string): string {
  const id = userId.trim();
  return isPublicUserIdSegment(id) ? `/user/${id}` : `/user/${encodeURIComponent(id)}`;
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
  if (isPublicUsername(username)) {
    return `/user/${encodeURIComponent((username as string).trim())}`;
  }
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

