/**
 * Dedicated production certification identities.
 * Reuse these instead of minting new users on every smoke/cert run.
 */
export const INTERNAL_TEST_KEEP_USERNAMES = ['mediacerthc', 'geoautohc', 'editflowcert'] as const;

export const INTERNAL_TEST_KEEP_EMAILS = ['mediacert+homecheff@example.com'] as const;

export const INTERNAL_TEST_BIO =
  'certificationFixture=true;internalTest=true;keep=true';

export const DISPOSABLE_CERT_EMAIL_SUFFIXES = [
  '@homecheff-validation.test',
  '@homecheff.invalid',
  '@homecheff.test',
] as const;

export function isInternalTestKeepEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return INTERNAL_TEST_KEEP_EMAILS.includes(
    email.trim().toLowerCase() as (typeof INTERNAL_TEST_KEEP_EMAILS)[number],
  );
}

export function isInternalTestKeepUsername(
  username: string | null | undefined,
): boolean {
  if (!username) return false;
  return INTERNAL_TEST_KEEP_USERNAMES.includes(
    username.trim().toLowerCase() as (typeof INTERNAL_TEST_KEEP_USERNAMES)[number],
  );
}

export function isDisposableCertEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  if (isInternalTestKeepEmail(e)) return false;
  if (e.endsWith('@homecheff.eu') || e.endsWith('@homecheff.nl')) return false;
  if (DISPOSABLE_CERT_EMAIL_SUFFIXES.some((s) => e.endsWith(s))) return true;
  if (e.includes('homecheff-validation.test')) return true;
  if (e.startsWith('deleted+') && e.includes('@homecheff')) return true;
  if (e.startsWith('cleaned-') && e.includes('homecheff-validation')) return true;
  if (e.endsWith('@accounts.homecheff.internal')) return true;
  if (e.endsWith('@example.com') && !isInternalTestKeepEmail(e)) return true;
  return false;
}
