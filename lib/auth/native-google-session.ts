/**
 * Server-only: verify Google ID token and mint a NextAuth-compatible JWT session cookie.
 * Geen tokens of secrets loggen.
 */
import { OAuth2Client } from 'google-auth-library';
import { encode } from 'next-auth/jwt';
import type { UserRole } from '@prisma/client';
import { getNextAuthSharedCookieDomain } from '@/lib/auth-cookie-domain';
import { syncGoogleProfileToDatabase } from '@/lib/auth/google-account-sync';

const SESSION_MAX_AGE_SEC = 30 * 24 * 60 * 60;
const SESSION_COOKIE_NAME = 'next-auth.session-token';

const LOG_PREFIX = '[HomeCheff native-google session]';

/** Alleen voor logs: client-id is geen geheim; toch ingekort. */
function clientIdPreview(id: string): string {
  const t = id.trim();
  if (t.length <= 24) return `${t.slice(0, 8)}…`;
  return `${t.slice(0, 12)}…${t.slice(-20)}`;
}

function resolveGoogleVerifyAudience(): {
  audience: string;
  publicClientId: string | null;
} | null {
  const audience = process.env.GOOGLE_CLIENT_ID?.trim() || '';
  const publicClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || null;
  if (!audience) {
    console.info(LOG_PREFIX, {
      verifyFailed: true,
      reason: 'GOOGLE_CLIENT_ID ontbreekt op de server (vereist voor verifyIdToken audience).',
      hasNextPublicGoogleClientId: Boolean(publicClientId),
    });
    return null;
  }
  if (publicClientId && publicClientId !== audience) {
    console.info(LOG_PREFIX, {
      verifyFailed: true,
      reason: 'GOOGLE_CLIENT_ID en NEXT_PUBLIC_GOOGLE_CLIENT_ID verschillen; moeten dezelfde Web OAuth client ID zijn.',
      audienceUsed: clientIdPreview(audience),
      nextPublicPreview: clientIdPreview(publicClientId),
    });
    return null;
  }
  return { audience, publicClientId };
}

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

  const resolved = resolveGoogleVerifyAudience();
  if (!resolved) {
    const pub = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
    const web = process.env.GOOGLE_CLIENT_ID?.trim();
    if (web && pub && pub !== web) {
      return { ok: false, status: 503, code: 'google_client_id_mismatch' };
    }
    return { ok: false, status: 503, code: 'google_not_configured' };
  }

  const { audience } = resolved;
  console.info(LOG_PREFIX, {
    verifyStarted: true,
    hasIdToken: Boolean(idToken?.length),
    audienceUsed: clientIdPreview(audience),
  });

  const client = new OAuth2Client();

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience,
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
