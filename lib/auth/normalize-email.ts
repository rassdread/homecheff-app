/**
 * Canonical email for lookups, uniqueness, and OAuth matching.
 * Strategy: trim + lowercase only (no Gmail dot-stripping; plus-addresses stay distinct).
 */

const BASIC_EMAIL =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function tryNormalizeEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const trimmed = email.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (!BASIC_EMAIL.test(lower)) return null;
  return lower;
}

export function normalizeEmailOrThrow(email: unknown): string {
  const n = tryNormalizeEmail(email);
  if (!n) {
    throw new Error("invalid_email");
  }
  return n;
}
