'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';
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
  // Affiliate area is an authenticated destination. A missing public @handle
  // must not replace it with a profile form that looks like a code gate.
  if (pathname.startsWith('/affiliate')) return true;
  return false;
}

function pathSkipsIntentResume(pathname: string | null): boolean {
  if (!pathname) return true;
  if (pathname.startsWith('/login')) return true;
  if (pathname.startsWith('/register')) return true;
  if (pathname.startsWith('/verify-email')) return true;
  if (pathname.startsWith('/auth/')) return true;
  if (pathname === '/onboarding/complete-profile') return true;
  return false;
}

export default function AuthCompletionGate() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { language } = useTranslation();
  const en = language === 'en';
  const [noticeDismissed, setNoticeDismissed] = useState(false);
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
      if (needsProfileOnboardingFromFlags(flags)) return;

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

  const user = session?.user as
    | { username?: string | null; socialOnboardingCompleted?: boolean | null }
    | undefined;
  const showNotice =
    status === 'authenticated' &&
    !!user &&
    !noticeDismissed &&
    !pathSkipsOnboardingGate(pathname) &&
    needsProfileOnboardingFromFlags(onboardingFlagsFromSessionUser(user));

  if (!showNotice) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-30 px-3 sm:px-4">
      <div
        role="status"
        className="pointer-events-auto mx-auto flex max-w-3xl items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950 shadow-sm"
      >
        <p className="min-w-0 flex-1 leading-relaxed">
          {en
            ? 'Your profile is not complete yet. You can keep using the feed, listings and search.'
            : 'Je profiel is nog niet compleet. Je kunt de feed, listings en zoeken gewoon blijven gebruiken.'}{' '}
          <Link href="/settings" className="font-semibold underline">
            {en ? 'Complete profile' : 'Profiel aanvullen'}
          </Link>
        </p>
        <button
          type="button"
          className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-amber-950 hover:bg-amber-100"
          onClick={() => setNoticeDismissed(true)}
        >
          {en ? 'Close' : 'Sluiten'}
        </button>
      </div>
    </div>
  );
}
