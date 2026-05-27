/**
 * Shared client timing + redirect strategy after credentials signIn (login / register).
 * Safari iOS needs longer cookie delays; Android Capacitor WebView uses router.replace.
 */
import { isSafari, isIOS, getSafariCookieDelay } from '@/lib/browser-utils';
import { isNativeApp } from '@/lib/native/capacitor';

export type PostCredentialsSessionTiming = {
  initialDelayMs: number;
  updateDelayMs: number;
  maxRetries: number;
  retryDelayMs: number;
  redirectDelayMs: number;
  /** Full page navigation with refresh query when session cookie is slow to appear */
  useIosRefreshRedirectIfNoSession: boolean;
};

export function getPostCredentialsSessionTiming(): PostCredentialsSessionTiming {
  const isIOSDevice = isIOS();
  const isSafariOnIOS = isSafari() && isIOSDevice;
  return {
    initialDelayMs: isSafariOnIOS ? 1500 : isIOSDevice ? 1200 : getSafariCookieDelay(),
    updateDelayMs: isSafariOnIOS ? 1500 : isIOSDevice ? 1200 : 1000,
    maxRetries: isSafariOnIOS ? 3 : isIOSDevice ? 2 : 1,
    retryDelayMs: isSafariOnIOS ? 1500 : isIOSDevice ? 1200 : 1000,
    redirectDelayMs: isSafariOnIOS ? 500 : isIOSDevice ? 400 : 200,
    useIosRefreshRedirectIfNoSession: isSafariOnIOS || isIOSDevice,
  };
}

/** Capacitor Android WebView: keep navigation in-app via Next router */
export function shouldUseNativeRouterRedirectAfterAuth(): boolean {
  if (typeof window === 'undefined') return false;
  return isNativeApp() && !(isSafari() && isIOS());
}

export function shouldUseLocationReplaceAfterAuth(): boolean {
  if (typeof window === 'undefined') return false;
  return isSafari() && isIOS() || isIOS();
}

export async function waitForSessionAfterCredentialsSignIn(
  getSession: () => Promise<{ user?: { email?: string | null } } | null>,
  timing: PostCredentialsSessionTiming = getPostCredentialsSessionTiming(),
): Promise<{ user?: { email?: string | null } } | null> {
  await new Promise((r) => setTimeout(r, timing.initialDelayMs));

  let currentSession = await getSession();

  for (
    let attempt = 0;
    attempt < timing.maxRetries && !currentSession?.user?.email;
    attempt++
  ) {
    await new Promise((r) => setTimeout(r, timing.retryDelayMs));
    currentSession = await getSession();
    if (currentSession?.user?.email) break;
  }

  if (!currentSession?.user?.email) {
    try {
      const apiResponse = await fetch('/api/auth/session', { credentials: 'include' });
      if (apiResponse.ok) {
        const apiSession = await apiResponse.json();
        if (apiSession?.user?.email) currentSession = apiSession;
      }
    } catch {
      /* ignore */
    }
  }

  return currentSession;
}
