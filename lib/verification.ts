import { randomBytes, randomInt } from 'crypto';

/** How long a verification code and magic-link token stay valid. */
export const VERIFICATION_CODE_TTL_MS = 24 * 60 * 60 * 1000;
export const VERIFICATION_CODE_TTL_HOURS = 24;

/**
 * Cryptographically random 6-digit code, including leading zeros.
 * Existing stored codes stay valid; this only changes how new codes are drawn.
 */
export function generateVerificationCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

/**
 * Generate a secure verification token (magic link).
 */
export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Calculate verification expiration (24 hours from now).
 */
export function getVerificationExpires(now: Date = new Date()): Date {
  return new Date(now.getTime() + VERIFICATION_CODE_TTL_MS);
}

export function isSixDigitVerificationCode(value: string): boolean {
  return /^\d{6}$/.test(value);
}

/**
 * One logical code field: keep digits only, ignore spaces and other characters,
 * and never keep more than six digits (paste, autofill, or a spaced code).
 */
export function normalizeVerificationCodeInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 6);
}

/**
 * Magic links stay intact. A code pasted with spaces or dashes becomes six digits.
 */
export function canonicalizeVerificationCredential(raw: string): string {
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  if (!trimmed) return '';
  if (/^[\d\s-]{6,16}$/.test(trimmed)) {
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length === 6) return digits;
  }
  return trimmed;
}
