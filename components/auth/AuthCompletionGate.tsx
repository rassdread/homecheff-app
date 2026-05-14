'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  needsProfileOnboardingFromFlags,
  onboardingFlagsFromSessionUser,
} from '@/lib/auth/post-auth-redirect';
import {
  clearPendingIntent,
  getPendingIntent,
  isPendingIntentExpired,
  resolvePostAuthIntentRedirect,
} from '@/lib/onboarding/pending-intent';
import { reportAppDiagnostic } from '@/lib/diagnostics/appDiagnostics';

function pathSkipsOnboardingGate(pathname: string | null): boolean {
  if (!pathname) return true;
  if (pathname === '/onboarding/complete-profile') return true;
  if (pathname.startsWith('/login')) return true;
  if (pathname.startsWith('/auth/')) return true;
  if (pathname === '/social-login-success') return true;
  if (pathname.startsWith('/forgot-password')) return true;
  if (pathname.startsWith('/reset-password')) return true;
  if (pathname.startsWith('/verify-email')) return true;
  return false;
}

function pathSkipsIntentResume(pathname: string | null): boolean {
  if (!pathname) return true;
  if (pathname.startsWith('/login')) return true;
  if (pathname.startsWith('/register')) return true;
  if (pathname.startsWith('/auth/')) return true;
  if (pathname === '/onboarding/complete-profile') return true;
  return false;
}

export default function AuthCompletionGate() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const lastIntentKey = useRef<string | null>(null);
  const lastReplaceRef = useRef<{ to: string; at: number } | null>(null);

  const replaceOnce = (to: string) => {
    const now = Date.now();
    const prev = lastReplaceRef.current;
    if (prev && prev.to === to && now - prev.at < 900) {
      reportAppDiagnostic('auth_gate_redirect_skipped', { reason: 'dedupe' });
      return;
    }
    lastReplaceRef.current = { to, at: now };
    router.replace(to);
  };

  useEffect(() => {
    try {
      if (status === 'loading' || status === 'unauthenticated') return;
      if (!session?.user) return;

      const user = session.user as {
        username?: string | null;
        socialOnboardingCompleted?: boolean | null;
      };
      const flags = onboardingFlagsFromSessionUser(user);
      if (needsProfileOnboardingFromFlags(flags)) {
        if (pathSkipsOnboardingGate(pathname)) return;
        replaceOnce('/onboarding/complete-profile');
        return;
      }

      if (pathSkipsIntentResume(pathname)) return;

      const intent = getPendingIntent();
      if (!intent) {
        lastIntentKey.current = null;
        return;
      }
      if (isPendingIntentExpired(intent)) {
        clearPendingIntent();
        lastIntentKey.current = null;
        return;
      }

      const url = resolvePostAuthIntentRedirect(user, intent);
      if (!url) return;

      const qs = searchParams?.toString() || '';
      const here = `${pathname || ''}${qs ? `?${qs}` : ''}`;
      if (url === here) return;

      const dedupeKey = `${intent.type}:${intent.createdAt}`;
      if (lastIntentKey.current === dedupeKey) return;
      lastIntentKey.current = dedupeKey;

      if (url.startsWith('/auth/resume-intent')) {
        replaceOnce(url);
        return;
      }
      if (url.startsWith('/auth/resume-interaction')) {
        replaceOnce(url);
        return;
      }
      clearPendingIntent();
      replaceOnce(url);
    } catch {
      /* gate must not break navigation */
    }
  }, [pathname, router, searchParams, session?.user, status]);

  return null;
}
