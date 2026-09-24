import { sanitizePostAuthRelativeUrl } from '@/lib/auth/post-auth-redirect';

/** Explicit personal-affiliate join (`/affiliate`), not company/dashboard/other roles. */
export function isPersonalAffiliateJoinReturn(
  path: string | null | undefined,
): boolean {
  const safe = sanitizePostAuthRelativeUrl(path);
  if (!safe) return false;
  const pathname = (safe.split('?')[0] || '').replace(/\/$/, '') || '/';
  return pathname === '/affiliate';
}

/**
 * Verification continue URL. Absolute and auth-loop targets are dropped
 * so `next` cannot become an open redirect.
 */
export function buildVerifyEmailPath(email: string, nextPath: string): string {
  const next = sanitizePostAuthRelativeUrl(nextPath) || '/affiliate/dashboard';
  const params = new URLSearchParams();
  const trimmed = email.trim();
  if (trimmed) params.set('email', trimmed);
  params.set('next', next);
  return `/verify-email?${params.toString()}`;
}

/** Where email signup should land when the visitor came from Affiliate worden. */
export function affiliateContinueAfterAuth(options: {
  returnPath: string | null | undefined;
  affiliateActivated: boolean;
}): string | null {
  if (!isPersonalAffiliateJoinReturn(options.returnPath)) return null;
  return options.affiliateActivated
    ? '/affiliate/dashboard'
    : '/affiliate#affiliate-signup';
}
