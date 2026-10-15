/**
 * Google OAuth on Marketplace preview is fail-closed.
 * It runs only for one host, one git branch, and a client that is not the
 * production or shared web client. Every other preview stays without Google.
 */

export const ALLOWED_PREVIEW_GOOGLE_HOST =
  'homecheff-app-git-hc-campaign-b320c2-sergio-s-projects-f7b64ee1.vercel.app';

export const ALLOWED_PREVIEW_GOOGLE_BRANCH = 'hc-campaign-cert-v3';

const GOOGLE_CLIENT_ID_PATTERN = /^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/;

type Env = Record<string, string | undefined>;

export type PreviewGoogleOAuthClient = {
  clientId: string;
  clientSecret: string;
  source: 'GOOGLE_PREVIEW_WEB_CLIENT_ID';
};

export function previewGoogleHostname(host: string | null | undefined): string {
  return String(host || '')
    .split(',')[0]
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, '')
    .replace(/\.$/, '');
}

export function isExactPreviewGoogleHost(host: string | null | undefined): boolean {
  return previewGoogleHostname(host) === ALLOWED_PREVIEW_GOOGLE_HOST;
}

function branchHost(env: Env): string {
  return previewGoogleHostname(
    String(env.VERCEL_BRANCH_URL || '')
      .trim()
      .replace(/^https?:\/\//, '')
      .split('/')[0],
  );
}

function listed(env: Env, names: string[]): string[] {
  return names.map((name) => (env[name] || '').trim()).filter(Boolean);
}

/**
 * Preview-only client. Returns null unless every allowlist check passes.
 * Never reads the production web client as a fallback.
 */
export function previewGoogleOAuthBlockReason(env: Env = process.env): string | null {
  if (env.VERCEL_ENV !== 'preview') return 'not-preview';
  if ((env.VERCEL_GIT_COMMIT_REF || '').trim() !== ALLOWED_PREVIEW_GOOGLE_BRANCH) return 'branch';
  if (branchHost(env) !== ALLOWED_PREVIEW_GOOGLE_HOST) return 'branch-host';

  const clientId = (env.GOOGLE_PREVIEW_WEB_CLIENT_ID || '').trim();
  const clientSecret = (env.GOOGLE_PREVIEW_WEB_CLIENT_SECRET || '').trim();
  if (!GOOGLE_CLIENT_ID_PATTERN.test(clientId)) return 'id-format';
  if (clientSecret.length < 16) return 'secret-length';
  if (clientId.includes('*') || clientSecret.includes('*')) return 'wildcard';

  const blockedIds = listed(env, ['GOOGLE_CLIENT_ID', 'GOOGLE_WEB_CLIENT_ID']);
  const blockedSecrets = listed(env, ['GOOGLE_CLIENT_SECRET', 'GOOGLE_WEB_CLIENT_SECRET']);
  if (blockedIds.includes(clientId)) return 'id-matches-existing';
  if (blockedSecrets.includes(clientSecret)) return 'secret-matches-existing';
  return null;
}

export function resolvePreviewGoogleOAuthClient(
  env: Env = process.env,
): PreviewGoogleOAuthClient | null {
  if (previewGoogleOAuthBlockReason(env) !== null) return null;
  return {
    clientId: (env.GOOGLE_PREVIEW_WEB_CLIENT_ID || '').trim(),
    clientSecret: (env.GOOGLE_PREVIEW_WEB_CLIENT_SECRET || '').trim(),
    source: 'GOOGLE_PREVIEW_WEB_CLIENT_ID',
  };
}
