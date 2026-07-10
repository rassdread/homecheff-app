/**
 * Prewarm Capgo SocialLogin on native shell so the first Google tap does not race plugin init.
 */

import { GOOGLE_WEB_CLIENT_ID } from '@/lib/native/google-sign-in-config';
import { isNativeApp } from '@/lib/native/capacitor';
import { logGoogleLoginDiag } from '@/lib/auth/google-login-diagnostics';

let initPromise: Promise<boolean> | null = null;

function resetInitPromise(): void {
  initPromise = null;
}

/** Fire-and-forget — call once when native shell mounts. */
export function prewarmGoogleSocialLogin(): void {
  if (typeof window === 'undefined' || !isNativeApp() || !GOOGLE_WEB_CLIENT_ID) return;
  void ensureGoogleSocialLoginInitialized();
}

/** Idempotent SocialLogin.initialize for native Google sign-in. */
export async function ensureGoogleSocialLoginInitialized(): Promise<boolean> {
  if (typeof window === 'undefined' || !GOOGLE_WEB_CLIENT_ID) return false;

  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const { SocialLogin } = await import('@capgo/capacitor-social-login');
      await SocialLogin.initialize({
        google: {
          webClientId: GOOGLE_WEB_CLIENT_ID,
          mode: 'online',
        },
      });
      logGoogleLoginDiag('google_login_prewarm_ok', {});
      return true;
    } catch (e) {
      resetInitPromise();
      const msg = e instanceof Error ? e.message : String(e);
      logGoogleLoginDiag('google_login_prewarm_failed', {
        message: msg.slice(0, 200),
      });
      return false;
    }
  })();

  return initPromise;
}

export function invalidateGoogleSocialLoginInit(): void {
  resetInitPromise();
}
