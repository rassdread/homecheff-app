/**
 * Pure helpers for legacy identity migration (testable without DB).
 */
export type LegacyAuthStatus = "LEGACY_AUTH_ACTIVE" | "LEGACY_AUTH_MIGRATED" | "LEGACY_AUTH_RETIRED";

export function legacyAuthStatus(input: {
  centralUserId: string | null;
  passwordHash: string | null;
  legacyLoginEnabled?: boolean | null;
}): LegacyAuthStatus {
  if (input.centralUserId && input.legacyLoginEnabled === false && !input.passwordHash) {
    return "LEGACY_AUTH_RETIRED";
  }
  if (input.centralUserId) {
    return "LEGACY_AUTH_MIGRATED";
  }
  if (input.passwordHash) {
    return "LEGACY_AUTH_ACTIVE";
  }
  return "LEGACY_AUTH_ACTIVE";
}

/** Resolve canonical id from sibling AuthIdentityLink rows (same normalized email). */
export function resolveCentralFromSiblingLinks(
  links: Array<{ centralUserId: string; sourceSystem: string }>,
): { centralUserId: string } | { ambiguous: true } | null {
  if (links.length === 0) return null;
  const ids = new Set(links.map((l) => l.centralUserId));
  if (ids.size > 1) return { ambiguous: true };
  const centralUserId = [...ids][0]!;
  return { centralUserId };
}

export function normalizeMigrateEmail(email: string): string {
  return email.trim().toLowerCase();
}
