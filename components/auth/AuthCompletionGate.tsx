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

function registerAllowsEmailFlow(pathname: string | null, social: string | null): boolean {
  return pathname === '/register' && social !== 'true';
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

  useEffect(() => {
    if (status === 'loading' || status === 'unauthenticated') return;
    if (!session?.user) return;

    const user = session.user as {
      username?: string | null;
      socialOnboardingCompleted?: boolean | null;
    };
    const flags = onboardingFlagsFromSessionUser(user);
    const social = searchParams?.get('social');

    if (needsProfileOnboardingFromFlags(flags)) {
      if (pathSkipsOnboardingGate(pathname)) return;
      if (registerAllowsEmailFlow(pathname, social)) return;
      router.replace('/onboarding/complete-profile');
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
      router.replace(url);
      return;
    }
    if (url.startsWith('/auth/resume-interaction')) {
      router.replace(url);
      return;
    }
    clearPendingIntent();
    router.replace(url);
  }, [pathname, router, searchParams, session?.user, status]);

  return null;
}
