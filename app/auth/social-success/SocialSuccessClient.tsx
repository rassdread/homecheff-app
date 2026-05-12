'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { getSession, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { applySessionMode, readRememberPreference } from '@/lib/session-mode';
import { isIOS, isSafariIOS } from '@/lib/browser-utils';
import {
  fetchOnboardingFlags,
  onboardingFlagsFromSessionUser,
  resolvePathAfterSocialAuth,
} from '@/lib/auth/post-auth-redirect';
import { consumeAndResolvePostAuthUrl } from '@/lib/onboarding/pending-intent';
import { trackOnboardingEvent } from '@/lib/onboarding/onboarding-analytics';

const MAX_WAIT_MS = 15_000;
const POLL_MS = 400;

type Phase = 'checking' | 'redirecting' | 'error';

async function fetchSessionViaApi(): Promise<{ user?: { email?: string | null } } | null> {
  try {
    const res = await fetch('/api/auth/session', {
      cache: 'no-store',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { user?: { email?: string | null } };
    return data?.user?.email ? data : null;
  } catch {
    return null;
  }
}

function oauthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  const c = code.toLowerCase();
  if (c === 'accessdenied') return 'Inloggen geannuleerd of geen toegang.';
  if (c === 'oauthcallback' || c === 'oauth_signin_error')
    return 'Inloggen met Google is mislukt. Probeer het opnieuw.';
  if (c === 'configuration') return 'Inloggen is tijdelijk niet beschikbaar (configuratie).';
  return 'Inloggen is mislukt. Probeer het opnieuw.';
}

async function resolvePostAuthPath(): Promise<'/' | '/onboarding/complete-profile'> {
  let flags = await fetchOnboardingFlags();
  if (!flags) {
    await new Promise((r) => setTimeout(r, 400));
    flags = await fetchOnboardingFlags();
  }
  const session = await getSession();
  const resolved =
    flags ??
    (session?.user
      ? onboardingFlagsFromSessionUser(session.user as any)
      : { hasTempUsername: true, onboardingCompleted: false });
  return resolvePathAfterSocialAuth(resolved);
}

function navigateHard(href: string) {
  if (typeof window === 'undefined') return;
  window.location.replace(href);
}

function SocialSuccessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update: updateSession } = useSession();
  const [phase, setPhase] = useState<Phase>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const doneRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const urlError = searchParams?.get('error');
  const errorHint = urlError ? oauthErrorMessage(urlError) : null;

  const clearTimers = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const finishWithSession = useCallback(async () => {
    if (doneRef.current) return;
    doneRef.current = true;
    clearTimers();
    setPhase('redirecting');

    try {
      const rememberPref = readRememberPreference();
      await applySessionMode(rememberPref);
    } catch {
      /* ignore */
    }

    try {
      await updateSession();
    } catch {
      /* ignore */
    }

    try {
      await router.refresh();
    } catch {
      /* ignore */
    }

    const base = await resolvePostAuthPath();
    let target = base;
    if (base === '/') {
      const s = await getSession();
      const u = s?.user as {
        username?: string | null;
        socialOnboardingCompleted?: boolean | null;
      };
      if (u) {
        const intentUrl = consumeAndResolvePostAuthUrl(u);
        if (intentUrl) target = intentUrl;
      }
    }
    trackOnboardingEvent('SOCIAL_AUTH_SUCCESS', { target });
    const isIOSDevice = isIOS();
    const isSafariOnIOS = isSafariIOS();
    const delay = isSafariOnIOS ? 400 : isIOSDevice ? 300 : 150;
    await new Promise((r) => setTimeout(r, delay));

    navigateHard(target);
  }, [clearTimers, router, updateSession]);

  const fail = useCallback(
    (msg: string) => {
      if (doneRef.current) return;
      doneRef.current = true;
      clearTimers();
      setErrorMessage(msg);
      setPhase('error');
    },
    [clearTimers],
  );

  const tryDetectSession = useCallback(async (): Promise<boolean> => {
    let s = await getSession();
    if (s?.user?.email) return true;
    const api = await fetchSessionViaApi();
    if (api?.user?.email) {
      try {
        await updateSession();
      } catch {
        /* ignore */
      }
      s = await getSession();
      return !!s?.user?.email;
    }
    return false;
  }, [updateSession]);

  const tryDetectSessionRef = useRef(tryDetectSession);
  tryDetectSessionRef.current = tryDetectSession;
  const finishRef = useRef(finishWithSession);
  finishRef.current = finishWithSession;
  const failRef = useRef(fail);
  failRef.current = fail;

  useEffect(() => {
    if (errorHint) {
      failRef.current(errorHint);
      return;
    }

    const tick = async () => {
      if (doneRef.current) return;
      try {
        const ok = await tryDetectSessionRef.current();
        if (ok) {
          await finishRef.current();
        }
      } catch (e) {
        console.warn('[auth/social-success] session poll error', {
          error: e instanceof Error ? e.message : String(e),
        });
      }
    };

    void tick();
    pollRef.current = setInterval(() => void tick(), POLL_MS);

    timeoutRef.current = setTimeout(() => {
      if (doneRef.current) return;
      void (async () => {
        const ok = await tryDetectSessionRef.current();
        if (ok) {
          await finishRef.current();
        } else if (!doneRef.current) {
          failRef.current(
            'Geen actieve sessie na Google. Open de app opnieuw en log in via de knop in de app ' +
              '(niet alleen in een externe browser). Of probeer opnieuw.',
          );
        }
      })();
    }, MAX_WAIT_MS);

    const onResume = () => {
      if (doneRef.current) return;
      void tick();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onResume);
      window.addEventListener('pageshow', onResume);
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onResume);
    }

    return () => {
      clearTimers();
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', onResume);
        window.removeEventListener('pageshow', onResume);
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onResume);
      }
    };
  }, [errorHint, clearTimers]);

  if (phase === 'error' && errorMessage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 px-4">
        <div className="max-w-md w-full rounded-2xl bg-white p-8 shadow-lg border border-gray-100 text-center">
          <p className="text-gray-900 font-semibold mb-2">Inloggen niet voltooid</p>
          <p className="text-gray-600 text-sm mb-6">{errorMessage}</p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-white font-medium hover:bg-emerald-700 text-center"
            >
              Terug naar inloggen
            </Link>
            <button
              type="button"
              onClick={() => {
                doneRef.current = false;
                setPhase('checking');
                setErrorMessage(null);
                window.location.reload();
              }}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 font-medium hover:bg-gray-50"
            >
              Opnieuw proberen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100">
      <div className="text-center px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
        <p className="text-gray-700 font-medium">Bezig met inloggen…</p>
        <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
          Een ogenblik geduld. Sluit dit scherm niet.
        </p>
      </div>
    </div>
  );
}

export default function SocialSuccessClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
        </div>
      }
    >
      <SocialSuccessInner />
    </Suspense>
  );
}
