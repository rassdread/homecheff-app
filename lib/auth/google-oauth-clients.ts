/**
 * Phase 2 — separate HomeCheff web OAuth clients from native/Firebase audiences.
 *
 * Web NextAuth uses GOOGLE_WEB_CLIENT_ID / GOOGLE_WEB_CLIENT_SECRET with legacy
 * fallbacks GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.
 *
 * Native ID-token verification uses an explicit native audience allowlist and must
 * NOT require equality with the web OAuth client.
 *
 * IMPORTANT (Next.js): NEXT_PUBLIC_* values used on the client MUST be read via
 * static `process.env.NEXT_PUBLIC_…` property access so the bundler can inline them.
 * Dynamic `process.env[name]` resolves to empty string in the browser.
 */

export const EXPECTED_WEB_CLIENT_ID_PREFIX = '615612462371-';
export const EXPECTED_NATIVE_FIREBASE_WEB_CLIENT_ID =
  '372044866667-oj37snd1j7m7qhqf98cjhbtvbad1mfg2.apps.googleusercontent.com';

function trimEnv(name: string): string {
  return process.env[name]?.trim() || '';
}

function splitCsv(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Preview for logs — never log secrets. */
export function googleClientIdPreview(id: string): string {
  const t = id.trim();
  if (!t) return '(empty)';
  if (t.length <= 24) return `${t.slice(0, 8)}…`;
  return `${t.slice(0, 12)}…${t.slice(-20)}`;
}

export type ResolvedGoogleWebOAuthClient = {
  clientId: string;
  clientSecret: string;
  source: {
    clientId: 'GOOGLE_WEB_CLIENT_ID' | 'GOOGLE_CLIENT_ID';
    clientSecret: 'GOOGLE_WEB_CLIENT_SECRET' | 'GOOGLE_CLIENT_SECRET';
  };
};

/**
 * Resolve the web OAuth client used by NextAuth GoogleProvider.
 * Does not read NEXT_PUBLIC_* vars.
 */
export function resolveGoogleWebOAuthClient(): ResolvedGoogleWebOAuthClient | null {
  const preferredId = trimEnv('GOOGLE_WEB_CLIENT_ID');
  const legacyId = trimEnv('GOOGLE_CLIENT_ID');
  const clientId = preferredId || legacyId;
  if (!clientId) return null;

  const preferredSecret = trimEnv('GOOGLE_WEB_CLIENT_SECRET');
  const legacySecret = trimEnv('GOOGLE_CLIENT_SECRET');
  const clientSecret = preferredSecret || legacySecret;
  if (!clientSecret) return null;

  return {
    clientId,
    clientSecret,
    source: {
      clientId: preferredId ? 'GOOGLE_WEB_CLIENT_ID' : 'GOOGLE_CLIENT_ID',
      clientSecret: preferredSecret
        ? 'GOOGLE_WEB_CLIENT_SECRET'
        : 'GOOGLE_CLIENT_SECRET',
    },
  };
}

export type ResolvedNativeGoogleAudiences = {
  audiences: string[];
  sources: string[];
};

/**
 * Explicit native/Firebase audience allowlist for idToken verification.
 * Fail closed when empty — native login must not fall back to the web NextAuth client id.
 *
 * NEXT_PUBLIC_* reads use static property access (required for any client bundling;
 * server runtime also receives them from Vercel).
 */
export function resolveNativeGoogleAudiences(): ResolvedNativeGoogleAudiences {
  const audiences: string[] = [];
  const sources: string[] = [];

  const push = (value: string, source: string) => {
    if (!value) return;
    if (audiences.includes(value)) return;
    audiences.push(value);
    sources.push(source);
  };

  push(trimEnv('GOOGLE_NATIVE_CLIENT_ID'), 'GOOGLE_NATIVE_CLIENT_ID');
  for (const id of splitCsv(trimEnv('GOOGLE_NATIVE_CLIENT_IDS'))) {
    push(id, 'GOOGLE_NATIVE_CLIENT_IDS');
  }

  // Static access — see file header. Do not convert to process.env[name].
  const publicNative = (process.env.NEXT_PUBLIC_GOOGLE_NATIVE_CLIENT_ID || '').trim();
  push(publicNative, 'NEXT_PUBLIC_GOOGLE_NATIVE_CLIENT_ID');
  const publicLegacy = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim();
  push(publicLegacy, 'NEXT_PUBLIC_GOOGLE_CLIENT_ID');

  return { audiences, sources };
}

/**
 * Client-visible Capgo SocialLogin `webClientId`.
 *
 * This is the Firebase / Google "Web client" used as Android `serverClientId`
 * when requesting an ID token — NOT HomeCheff's NextAuth web OAuth client
 * (`GOOGLE_CLIENT_ID` / 6156…).
 *
 * Prefers NEXT_PUBLIC_GOOGLE_NATIVE_CLIENT_ID; falls back to legacy
 * NEXT_PUBLIC_GOOGLE_CLIENT_ID. Never reads server-only GOOGLE_CLIENT_ID.
 */
export function resolvePublicNativeGoogleClientId(): string {
  // Static access required for Next.js client inlining.
  return (
    (process.env.NEXT_PUBLIC_GOOGLE_NATIVE_CLIENT_ID || '').trim() ||
    (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim() ||
    ''
  );
}

export function isPublicNativeGoogleClientConfigured(): boolean {
  return resolvePublicNativeGoogleClientId().length > 0;
}

export function isGoogleWebOAuthConfigured(): boolean {
  return resolveGoogleWebOAuthClient() !== null;
}

/**
 * Source inspection helper for tests — ensures public resolver uses static env access.
 */
export function publicNativeGoogleClientIdUsesStaticEnvAccess(
  source: string,
): boolean {
  return (
    source.includes('process.env.NEXT_PUBLIC_GOOGLE_NATIVE_CLIENT_ID') &&
    source.includes('process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID') &&
    !/process\.env\[\s*['"]NEXT_PUBLIC_GOOGLE_NATIVE_CLIENT_ID['"]\s*\]/.test(
      source,
    )
  );
}
