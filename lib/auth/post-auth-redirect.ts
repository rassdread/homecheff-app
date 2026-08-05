/**
 * Client-safe helpers for post-login / post-signup redirects.
 * Keeps social-success, native Google, and /register aligned on the same rules.
 */

export const REGISTER_DRAFT_STORAGE_KEY = 'homecheff_register_draft_v1';

const AUTH_PATH_DENYLIST = [
  '/login',
  '/register',
  '/signup',
  '/auth/signin',
  '/auth/signup',
  '/auth/register',
  '/auth/social-success',
  '/auth/error',
  '/auth/resume-intent',
  '/auth/resume-interaction',
  '/social-login-success',
] as const;

export type OnboardingFlags = {
  hasTempUsername: boolean;
  onboardingCompleted: boolean;
};

export function clearRegisterDraftStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(REGISTER_DRAFT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export async function fetchOnboardingFlags(
  signal?: AbortSignal,
): Promise<OnboardingFlags | null> {
  try {
    const response = await fetch('/api/auth/check-onboarding', {
      cache: 'no-store',
      credentials: 'include',
      signal,
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      hasTempUsername?: boolean;
      onboardingCompleted?: boolean;
    };
    return {
      hasTempUsername: Boolean(data.hasTempUsername),
      onboardingCompleted: data.onboardingCompleted === true,
    };
  } catch {
    return null;
  }
}

export function onboardingFlagsFromSessionUser(user: {
  username?: string | null;
  socialOnboardingCompleted?: boolean | null;
}): OnboardingFlags {
  const username = user.username ?? '';
  return {
    hasTempUsername:
      typeof username === 'string' && username.startsWith('temp_'),
    onboardingCompleted: user.socialOnboardingCompleted === true,
  };
}

/** After Google / Apple web or native session is established. */
export function resolvePathAfterSocialAuth(
  flags: OnboardingFlags,
): '/' | '/onboarding/complete-profile' {
  if (!flags.hasTempUsername && flags.onboardingCompleted) {
    return '/';
  }
  return '/onboarding/complete-profile';
}

/** Aliases for readability at call sites. */
export const getPostAuthRedirectPath = resolvePathAfterSocialAuth;
export const getPostAuthRedirect = resolvePathAfterSocialAuth;

/**
 * Strips open redirects and auth-loop targets from a relative callback URL.
 * Returns a path+query starting with `/`, or null if unsafe.
 */
export function sanitizePostAuthRelativeUrl(
  href: string | null | undefined,
): string | null {
  if (!href || typeof href !== 'string') return null;
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith('//')) return null;
  // Only in-app relative paths — never accept absolute URLs (avoids host-stripping).
  if (!trimmed.startsWith('/')) return null;

  let pathname = '';
  try {
    pathname = trimmed.split('?')[0] || trimmed;
  } catch {
    return null;
  }

  const lower = pathname.toLowerCase();
  for (const denied of AUTH_PATH_DENYLIST) {
    if (lower === denied || lower.startsWith(`${denied}/`)) {
      return null;
    }
  }

  return trimmed;
}

export function needsProfileOnboardingFromFlags(flags: OnboardingFlags): boolean {
  return flags.hasTempUsername || !flags.onboardingCompleted;
}

/**
 * Build the post-Google landing URL while preserving a safe in-app return path.
 * External URLs and auth-loop paths are rejected.
 */
export function buildSocialSuccessCallbackUrl(
  returnPath: string | null | undefined,
): string {
  const safe = sanitizePostAuthRelativeUrl(returnPath);
  if (!safe || safe === '/') return '/auth/social-success';
  return `/auth/social-success?next=${encodeURIComponent(safe)}`;
}
