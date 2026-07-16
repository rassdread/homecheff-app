/**
 * Server-only: verify Google ID token and mint a NextAuth-compatible JWT session cookie.
 * Geen tokens of secrets loggen.
 *
 * Phase 2: native audiences are independent from the web NextAuth OAuth client.
 */
import { OAuth2Client } from 'google-auth-library';
import { encode } from 'next-auth/jwt';
import type { UserRole } from '@prisma/client';
import { getNextAuthSharedCookieDomain } from '@/lib/auth-cookie-domain';
import { syncGoogleProfileToDatabase } from '@/lib/auth/google-account-sync';
import {
  googleClientIdPreview,
  resolveNativeGoogleAudiences,
} from '@/lib/auth/google-oauth-clients';

const SESSION_MAX_AGE_SEC = 30 * 24 * 60 * 60;
const SESSION_COOKIE_NAME = 'next-auth.session-token';

const LOG_PREFIX = '[HomeCheff native-google session]';

function buildSessionCookieAttributes(maxAge: number): string[] {
  const isProd = process.env.NODE_ENV === 'production';
  const domain = getNextAuthSharedCookieDomain();
  const parts: string[] = [
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
    `Expires=${new Date(Date.now() + maxAge * 1000).toUTCString()}`,
  ];
  if (isProd) parts.push('Secure');
  if (domain) parts.push(`Domain=${domain}`);
  return parts;
}

export type NativeGoogleSessionResult =
  | { ok: true; setCookie: string }
  | { ok: false; status: number; code: string };

export async function createSessionFromNativeGoogleIdToken(
  idToken: string,
): Promise<NativeGoogleSessionResult> {
  const secret = process.env.NEXTAUTH_SECRET?.trim();
  if (!secret) {
    return { ok: false, status: 503, code: 'auth_not_configured' };
  }

  const { audiences, sources } = resolveNativeGoogleAudiences();
  if (audiences.length === 0) {
    console.info(LOG_PREFIX, {
      verifyFailed: true,
      reason:
        'Native Google audience ontbreekt. Zet GOOGLE_NATIVE_CLIENT_ID (server) en/of NEXT_PUBLIC_GOOGLE_NATIVE_CLIENT_ID / NEXT_PUBLIC_GOOGLE_CLIENT_ID.',
    });
    return { ok: false, status: 503, code: 'google_native_not_configured' };
  }

  console.info(LOG_PREFIX, {
    verifyStarted: true,
    hasIdToken: Boolean(idToken?.length),
    audienceCount: audiences.length,
    audienceUsed: audiences.map(googleClientIdPreview),
    audienceSources: sources,
  });

  const client = new OAuth2Client();

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: audiences.length === 1 ? audiences[0] : audiences,
    });
    const p = ticket.getPayload();
    if (!p?.email) {
      return { ok: false, status: 401, code: 'invalid_token' };
    }
    if (p.email_verified === false) {
      return { ok: false, status: 401, code: 'email_not_verified' };
    }

    const emailRaw = String(p.email || '').trim();
    const email = emailRaw.toLowerCase();
    if (!email) {
      return { ok: false, status: 401, code: 'invalid_token' };
    }

    const googleSub = typeof p.sub === 'string' && p.sub.trim() ? p.sub.trim() : '';

    const name =
      (typeof p.name === 'string' && p.name) || emailRaw.split('@')[0] || '';
    const image =
      typeof p.picture === 'string' && p.picture ? p.picture : null;
    const firstName =
      typeof p.given_name === 'string' ? p.given_name : '';
    const lastName =
      typeof p.family_name === 'string' ? p.family_name : '';

    let sync: Awaited<ReturnType<typeof syncGoogleProfileToDatabase>>;
    try {
      sync = await syncGoogleProfileToDatabase({
        email,
        name,
        image,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        googleSub: googleSub || null,
        emailVerified: true,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === 'temp_username_failed' || msg === 'missing_email') {
        return { ok: false, status: 500, code: 'user_create_failed' };
      }
      return { ok: false, status: 500, code: 'sync_failed' };
    }

    const jwtPayload: Record<string, unknown> = {
      email,
      sub: sync.userId,
      role: sync.role as UserRole,
      id: sync.userId,
      isSocialLogin: true,
      socialProvider: 'google',
    };

    if (sync.isNewSocialUser) {
      jwtPayload.isNewSocialUser = true;
      jwtPayload.tempUsername = true;
      if (firstName && firstName.length <= 50) {
        jwtPayload.socialFirstName = firstName.substring(0, 50);
      }
      if (lastName && lastName.length <= 50) {
        jwtPayload.socialLastName = lastName.substring(0, 50);
      }
    }

    let encoded: string;
    try {
      encoded = await encode({
        secret,
        token: jwtPayload,
        maxAge: SESSION_MAX_AGE_SEC,
      });
    } catch {
      return { ok: false, status: 500, code: 'encode_failed' };
    }

    const setCookie = [
      `${SESSION_COOKIE_NAME}=${encoded}`,
      ...buildSessionCookieAttributes(SESSION_MAX_AGE_SEC),
    ].join('; ');

    console.info(LOG_PREFIX, { verifySuccess: true });
    return { ok: true, setCookie };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const safe = msg.replace(/Bearer\s+[^\s]+/gi, 'Bearer [redacted]');
    console.info(LOG_PREFIX, {
      verifyFailed: true,
      reason: safe.slice(0, 240),
    });
    if (/audience|recipient|wrong number of segments|invalid token signature/i.test(safe)) {
      return { ok: false, status: 401, code: 'token_audience_mismatch' };
    }
    return { ok: false, status: 401, code: 'invalid_token' };
  }
}
