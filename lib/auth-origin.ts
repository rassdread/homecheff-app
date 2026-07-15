/**
 * Central auth origin resolution for NextAuth redirects and cookie policy.
 *
 * - Production (VERCEL_ENV=production): canonical https://homecheff.eu
 * - Preview (VERCEL_ENV=preview): host-only cookies on https://*.vercel.app
 * - Development: localhost / NEXTAUTH_URL
 */

export const PRODUCTION_AUTH_ORIGIN = 'https://homecheff.eu';

/** Explicit HomeCheff production origins (exact match, no substring checks). */
export const HOME_CHEFF_PRODUCTION_ORIGINS = [
  'https://homecheff.nl',
  'https://homecheff.eu',
  'https://www.homecheff.nl',
  'https://www.homecheff.eu',
  'https://growth.homecheff.eu',
] as const;

export type AuthDeploymentEnvironment = 'development' | 'preview' | 'production';

const VERCEL_APP_HOST_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.vercel\.app$/i;

export function normalizeAuthOrigin(url: string): string | null {
  const raw = String(url ?? '').trim();
  if (!raw) return null;
  try {
    const withScheme = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
    const parsed = new URL(withScheme);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (!parsed.hostname) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

export function isHomeCheffProductionOrigin(origin: string): boolean {
  const normalized = normalizeAuthOrigin(origin);
  if (!normalized) return false;
  return (HOME_CHEFF_PRODUCTION_ORIGINS as readonly string[]).includes(normalized);
}

/** Strict Vercel Preview hostname — rejects lookalikes like homecheff.eu.attacker.com. */
export function isValidVercelPreviewHostname(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();
  if (!host || host === 'vercel.app') return false;
  return VERCEL_APP_HOST_RE.test(host);
}

export function isValidVercelPreviewOrigin(origin: string): boolean {
  const normalized = normalizeAuthOrigin(origin);
  if (!normalized) return false;
  try {
    const { hostname, protocol } = new URL(normalized);
    return protocol === 'https:' && isValidVercelPreviewHostname(hostname);
  } catch {
    return false;
  }
}

export function resolveAuthDeploymentEnvironment(): AuthDeploymentEnvironment {
  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();
  if (vercelEnv === 'preview') return 'preview';
  if (vercelEnv === 'production') return 'production';
  if (process.env.NODE_ENV !== 'production') return 'development';
  return 'production';
}

function resolvePreviewAuthOrigin(requestBaseUrl?: string): string | null {
  const candidates = [
    process.env.PREVIEW_AUTH_URL,
    process.env.AUTH_URL,
    process.env.NEXTAUTH_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    requestBaseUrl,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const origin = normalizeAuthOrigin(candidate);
    if (origin && isValidVercelPreviewOrigin(origin)) {
      return origin;
    }
  }
  return null;
}

function resolveDevelopmentAuthOrigin(): string {
  return (
    normalizeAuthOrigin(process.env.NEXTAUTH_URL ?? '') ??
    normalizeAuthOrigin(process.env.AUTH_URL ?? '') ??
    'http://localhost:3000'
  );
}

function resolveProductionAuthOrigin(): string {
  const explicit = normalizeAuthOrigin(process.env.NEXTAUTH_URL ?? '');
  if (explicit && isHomeCheffProductionOrigin(explicit)) {
    return explicit;
  }
  const authUrl = normalizeAuthOrigin(process.env.AUTH_URL ?? '');
  if (authUrl && isHomeCheffProductionOrigin(authUrl)) {
    return authUrl;
  }
  return PRODUCTION_AUTH_ORIGIN;
}

/**
 * Canonical origin used for NextAuth redirects and OAuth callbacks.
 * Never trusts arbitrary Host headers — only env + validated request baseUrl on Preview.
 */
export function getCanonicalAuthOrigin(requestBaseUrl?: string): string {
  const env = resolveAuthDeploymentEnvironment();

  if (env === 'preview') {
    const previewOrigin = resolvePreviewAuthOrigin(requestBaseUrl);
    if (previewOrigin) return previewOrigin;
    // Fail closed to production origin only when preview cannot be resolved (misconfig).
    return PRODUCTION_AUTH_ORIGIN;
  }

  if (env === 'development') {
    return resolveDevelopmentAuthOrigin();
  }

  return resolveProductionAuthOrigin();
}

/** Host-only on Preview/dev; `.homecheff.eu` only on production deployment. */
export function getAuthSessionCookieDomain(): string | undefined {
  if (resolveAuthDeploymentEnvironment() !== 'production') {
    return undefined;
  }

  const explicit = process.env.NEXTAUTH_COOKIE_DOMAIN?.trim();
  if (explicit) {
    const lower = explicit.toLowerCase();
    if (lower === 'none' || lower === 'false' || lower === '0') {
      return undefined;
    }
    return explicit.startsWith('.') ? explicit : `.${explicit}`;
  }

  const canonical = getCanonicalAuthOrigin();
  try {
    const host = new URL(canonical).hostname;
    if (host === 'homecheff.eu' || host.endsWith('.homecheff.eu')) {
      return '.homecheff.eu';
    }
  } catch {
    /* ignore */
  }

  return undefined;
}

export function getAllowedAuthOrigins(requestBaseUrl?: string): readonly string[] {
  const canonical = getCanonicalAuthOrigin(requestBaseUrl);
  const env = resolveAuthDeploymentEnvironment();
  if (env === 'preview') {
    return canonical ? [canonical] : [];
  }
  if (env === 'development') {
    const dev = getCanonicalAuthOrigin(requestBaseUrl);
    return dev ? [dev, ...HOME_CHEFF_PRODUCTION_ORIGINS] : [...HOME_CHEFF_PRODUCTION_ORIGINS];
  }
  return [...HOME_CHEFF_PRODUCTION_ORIGINS];
}

/**
 * Sanitize redirect targets — same-origin or explicit HomeCheff allowlist only.
 */
export function resolveSafeAuthRedirect(
  targetUrl: string,
  requestBaseUrl?: string,
): string {
  const canonical = getCanonicalAuthOrigin(requestBaseUrl);
  const allowed = new Set(getAllowedAuthOrigins(requestBaseUrl));

  if (!targetUrl) return `${canonical}/`;

  try {
    if (targetUrl.startsWith('/')) {
      return `${canonical}${targetUrl}`;
    }

    const target = new URL(targetUrl);
    const targetOrigin = target.origin;

    if (targetOrigin === canonical || allowed.has(targetOrigin)) {
      if (targetOrigin === canonical) {
        return `${canonical}${target.pathname}${target.search}`;
      }
      // Cross HomeCheff prod origin: rewrite to canonical path on canonical host in production.
      const env = resolveAuthDeploymentEnvironment();
      if (env === 'production' && isHomeCheffProductionOrigin(targetOrigin)) {
        return `${canonical}${target.pathname}${target.search}`;
      }
      return target.href;
    }
  } catch {
    /* fall through */
  }

  return `${canonical}/`;
}

/** Safe diagnostics for debug endpoints — no secrets. */
export function getAuthOriginDiagnostics(requestBaseUrl?: string) {
  const env = resolveAuthDeploymentEnvironment();
  const canonical = getCanonicalAuthOrigin(requestBaseUrl);
  let canonicalHost = '(invalid)';
  try {
    canonicalHost = new URL(canonical).hostname;
  } catch {
    /* ignore */
  }

  return {
    deploymentEnvironment: env,
    vercelEnv: process.env.VERCEL_ENV ? 'set' : 'missing',
    vercelUrlPresent: Boolean(process.env.VERCEL_URL),
    previewAuthUrlPresent: Boolean(process.env.PREVIEW_AUTH_URL?.trim()),
    nextAuthUrlPresent: Boolean(process.env.NEXTAUTH_URL?.trim()),
    authUrlPresent: Boolean(process.env.AUTH_URL?.trim()),
    nextAuthSecretPresent: Boolean(process.env.NEXTAUTH_SECRET?.trim()),
    googleClientConfigured: Boolean(
      process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim(),
    ),
    canonicalAuthOriginHost: canonicalHost,
    sessionCookieDomain: getAuthSessionCookieDomain() ?? 'host-only',
    requestBaseUrlHost: (() => {
      try {
        return requestBaseUrl ? new URL(requestBaseUrl).hostname : null;
      } catch {
        return null;
      }
    })(),
    googleOAuthCallbackPath: '/api/auth/callback/google',
  };
}
