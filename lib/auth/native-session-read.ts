import { parse as parseCookie } from 'cookie';
import { decode } from 'next-auth/jwt';
import { NEXTAUTH_SESSION_COOKIE_NAME } from '@/lib/auth/session-cookie-name';
import { presentedAuthSessionIsRevoked } from '@/lib/auth/session-revocation';

export type NativeSessionReason =
  | 'missing'
  | 'empty'
  | 'undecodable'
  | 'revoked'
  | 'deleted'
  | 'no-email'
  | 'recognized';

/** The same cookie name NextAuth reads. Returns null when the name is absent. */
export function sessionCookieValue(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const parsed = parseCookie(cookieHeader);
  if (!Object.prototype.hasOwnProperty.call(parsed, NEXTAUTH_SESSION_COOKIE_NAME)) return null;
  return parsed[NEXTAUTH_SESSION_COOKIE_NAME] ?? '';
}

/**
 * Classifies the cookie with the same decoder and revocation check as the
 * website session. The result never includes the token, the email, or the user id.
 */
export async function readNativeSession(
  cookieHeader: string | null,
  secret: string,
): Promise<NativeSessionReason> {
  const value = sessionCookieValue(cookieHeader);
  if (value === null) return 'missing';
  if (!value) return 'empty';
  let token: Record<string, unknown> | null = null;
  try {
    token = (await decode({ token: value, secret })) as Record<string, unknown> | null;
  } catch {
    return 'undecodable';
  }
  if (!token) return 'undecodable';
  if (token.deleted === true) return 'deleted';
  if (token.revoked === true) return 'revoked';
  if (await presentedAuthSessionIsRevoked(token)) return 'revoked';
  const email = typeof token.email === 'string' ? token.email : '';
  if (!email.includes('@')) return 'no-email';
  return 'recognized';
}
