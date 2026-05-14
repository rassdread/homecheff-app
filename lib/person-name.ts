/**
 * Build a single full name for storage (User.name / SellerProfile.displayName).
 * Trims each segment, omits empty optional middle, collapses internal whitespace.
 */
export function buildRegistrationFullName(parts: {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
}): string {
  return [parts.firstName, parts.middleName, parts.lastName]
    .map((s) => (typeof s === 'string' ? s.trim() : ''))
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Normalize stored full names for display (fixes double spaces, trim). */
export function normalizePersonNameDisplay(name: string | null | undefined): string {
  if (name == null || typeof name !== 'string') return '';
  return name.replace(/\s+/g, ' ').trim();
}
