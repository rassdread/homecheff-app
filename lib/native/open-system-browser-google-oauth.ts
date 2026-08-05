/**
 * Open HomeCheff Google OAuth in the system browser (Chrome Custom Tabs / SFSafariViewController)
 * when the Capacitor WebView cannot run Capgo native Google Sign-In safely.
 */
import { getPublicAppUrl } from '@/lib/public-app-url';
import { buildSocialSuccessCallbackUrl } from '@/lib/auth/post-auth-redirect';
import { logGoogleLoginDiag } from '@/lib/auth/google-login-diagnostics';

export async function openSystemBrowserGoogleOAuth(options?: {
  returnPath?: string | null;
}): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const callbackPath = buildSocialSuccessCallbackUrl(options?.returnPath);
  const base = getPublicAppUrl().replace(/\/$/, '');
  // NextAuth credentials CSRF is handled when the user lands on the site; for Custom Tabs
  // start at the login surface with social intent so cookies attach to the canonical host.
  const url = `${base}/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackPath)}`;

  try {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url, presentationStyle: 'popover' });
    logGoogleLoginDiag('google_login_system_browser_opened', {});
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logGoogleLoginDiag('google_login_system_browser_failed', {
      message: msg.slice(0, 160),
    });
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
      return true;
    } catch {
      return false;
    }
  }
}
