/**
 * Strengthened contact email validation + disposable domain lists.
 */

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/** Built-in disposable / throwaway domains (extend via CONTACT_DISPOSABLE_DOMAINS). */
export const DEFAULT_DISPOSABLE_DOMAINS = new Set(
  [
    'mailinator.com',
    'guerrillamail.com',
    'guerrillamail.org',
    '10minutemail.com',
    'tempmail.com',
    'temp-mail.org',
    'yopmail.com',
    'trashmail.com',
    'discard.email',
    'getnada.com',
    'sharklasers.com',
    'spam4.me',
    'maildrop.cc',
    'throwaway.email',
  ].map((d) => d.toLowerCase()),
);

function extraDomainsFromEnv(envKey: string): Set<string> {
  const raw = process.env[envKey]?.trim();
  if (!raw) return new Set();
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isDisposableEmailDomain(domain: string): boolean {
  const d = domain.toLowerCase();
  if (DEFAULT_DISPOSABLE_DOMAINS.has(d)) return true;
  if (extraDomainsFromEnv('CONTACT_DISPOSABLE_DOMAINS').has(d)) return true;
  if (extraDomainsFromEnv('CONTACT_SPAM_DOMAINS').has(d)) return true;
  return false;
}

export type EmailValidationResult =
  | { ok: true; email: string; domain: string }
  | { ok: false; reason: 'INVALID_EMAIL'; error: string };

export function validateContactEmail(raw: unknown): EmailValidationResult {
  if (typeof raw !== 'string') {
    return { ok: false, reason: 'INVALID_EMAIL', error: 'Email is required' };
  }
  const email = raw.trim().toLowerCase();
  if (email.length < 5 || email.length > 254) {
    return { ok: false, reason: 'INVALID_EMAIL', error: 'Invalid email address' };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, reason: 'INVALID_EMAIL', error: 'Invalid email address' };
  }
  const domain = email.split('@')[1] || '';
  if (!domain || !domain.includes('.')) {
    return { ok: false, reason: 'INVALID_EMAIL', error: 'Invalid email address' };
  }
  if (isDisposableEmailDomain(domain)) {
    return {
      ok: false,
      reason: 'INVALID_EMAIL',
      error: 'Please use a permanent email address',
    };
  }
  return { ok: true, email, domain };
}
