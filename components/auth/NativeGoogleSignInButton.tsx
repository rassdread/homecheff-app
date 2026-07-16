'use client';

import { useCallback, useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAndroidBridgePresent } from '@/lib/native/useAndroidBridgePresent';
import { useNativeAndroid } from '@/lib/native/useNativeAndroid';
import { shouldUseNativeGoogleLogin } from '@/lib/native/subscribeNativeShell';
import {
  applySessionMode,
  setRememberPreference,
} from '@/lib/session-mode';
import { trackLogin, trackRegistration } from '@/components/GoogleAnalytics';
import { logGoogleLoginDiag } from '@/lib/auth/google-login-diagnostics';
import { parseGoogleSignInError } from '@/lib/auth/parse-google-sign-in-error';

import {
  GOOGLE_WEB_CLIENT_ID,
  resolveNativeAuthApiUrl,
} from '@/lib/native/google-sign-in-config';
import {
  ensureGoogleSocialLoginInitialized,
  invalidateGoogleSocialLoginInit,
} from '@/lib/native/prewarm-google-social-login';

type NativeGoogleLoginShape = {
  provider?: string;
  result?: unknown;
};

function extractNativeGoogleIdToken(login: unknown): {
  idToken: string | null;
  pluginPayloadHint: string;
} {
  if (!login || typeof login !== 'object') {
    return { idToken: null, pluginPayloadHint: 'login_not_object' };
  }
  const L = login as NativeGoogleLoginShape;
  if (L.provider !== 'google') {
    return {
      idToken: null,
      pluginPayloadHint: `provider:${String(L.provider ?? 'undefined')}`,
    };
  }
  const raw = L.result;
  if (!raw || typeof raw !== 'object') {
    return { idToken: null, pluginPayloadHint: 'result_missing' };
  }
  const r = raw as Record<string, unknown>;
  if (r.responseType === 'offline') {
    return {
      idToken: null,
      pluginPayloadHint: 'offline_mode_no_id_token_use_online',
    };
  }
  if (typeof r.idToken === 'string' && r.idToken.length > 20) {
    return { idToken: r.idToken.trim(), pluginPayloadHint: 'result.idToken' };
  }
  const nested = r.result;
  if (nested && typeof nested === 'object') {
    const n = nested as Record<string, unknown>;
    if (typeof n.idToken === 'string' && n.idToken.length > 20) {
      return { idToken: n.idToken.trim(), pluginPayloadHint: 'result.result.idToken' };
    }
  }
  const auth = r.authentication;
  if (auth && typeof auth === 'object') {
    const a = auth as Record<string, unknown>;
    if (typeof a.idToken === 'string' && a.idToken.length > 20) {
      return {
        idToken: a.idToken.trim(),
        pluginPayloadHint: 'result.authentication.idToken',
      };
    }
  }
  return {
    idToken: null,
    pluginPayloadHint: `result_keys:${Object.keys(r).sort().join(',')}`,
  };
}

function mapNativeGoogleApiError(code: string): string {
  switch (code) {
    case 'missing_id_token':
      return 'Geen Google token ontvangen.';
    case 'invalid_token':
    case 'token_audience_mismatch':
      return 'Google token verificatie mislukt.';
    case 'google_not_configured':
    case 'google_native_not_configured':
    case 'google_client_id_mismatch':
    case 'auth_not_configured':
      return 'Google native configuratie ontbreekt. Zet GOOGLE_NATIVE_CLIENT_ID / NEXT_PUBLIC_GOOGLE_NATIVE_CLIENT_ID.';
    case 'email_not_verified':
      return 'Je Google-e-mail is niet geverifieerd.';
    case 'user_create_failed':
    case 'sync_failed':
      return 'Account kon niet worden bijgewerkt. Probeer opnieuw of gebruik e-mail en wachtwoord.';
    case 'encode_failed':
      return 'Sessie starten mislukt. Probeer opnieuw.';
    default:
      return 'Google token verificatie mislukt.';
  }
}

function redactErrorMessage(msg: string): string {
  return msg.replace(/ya29\.[a-zA-Z0-9._-]+/gi, '[redacted]').slice(0, 200);
}

export type NativeGoogleSignInButtonProps = {
  rememberMe?: boolean;
  disabled?: boolean;
  buttonLabel: string;
  variant?: 'login' | 'register';
  analyticsContext: 'login' | 'register';
};

export function NativeGoogleSignInButton({
  rememberMe = true,
  disabled,
  buttonLabel,
  variant = 'login',
  analyticsContext,
}: NativeGoogleSignInButtonProps) {
  const router = useRouter();
  const androidBridge = useAndroidBridgePresent();
  const nativeAndroid = useNativeAndroid();
  const preferNative = shouldUseNativeGoogleLogin({
    androidBridge,
    nativeAndroid,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const waitForNativeSession = useCallback(async (): Promise<boolean> => {
    for (let attempt = 0; attempt < 10; attempt++) {
      await new Promise((r) => setTimeout(r, 200));
      try {
        const session = await getSession();
        if (session?.user?.email) return true;
      } catch {
        /* ignore */
      }
      try {
        const res = await fetch(resolveNativeAuthApiUrl('/api/auth/session'), {
          credentials: 'include',
          cache: 'no-store',
        });
        if (res.ok) {
          const data = (await res.json()) as { user?: { email?: string | null } };
          if (data?.user?.email) return true;
        }
      } catch {
        /* ignore */
      }
    }
    return false;
  }, []);

  const runWebGoogleLogin = useCallback(async (): Promise<boolean> => {
    logGoogleLoginDiag('google_login_web_start', { preferNative });
    try {
      setRememberPreference(rememberMe);
      await signIn('google', {
        callbackUrl: '/auth/social-success',
        redirect: true,
      });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logGoogleLoginDiag('google_login_web_failed', {
        message: redactErrorMessage(msg),
      });
      setError(
        'Google inloggen via browser is mislukt. Controleer je verbinding en probeer opnieuw.',
      );
      return false;
    }
  }, [preferNative, rememberMe]);

  const runNativeGoogleLogin = useCallback(async (): Promise<boolean> => {
    logGoogleLoginDiag('google_login_native_start', {
      hasWebClientId: Boolean(GOOGLE_WEB_CLIENT_ID),
      androidBridge,
      nativeAndroid,
    });

    if (!GOOGLE_WEB_CLIENT_ID) {
      setError('Google login is niet geconfigureerd (ontbrekende client id).');
      logGoogleLoginDiag('google_login_native_failed', { reason: 'missing_web_client_id' });
      return false;
    }

    if (typeof window === 'undefined') {
      setError('Google login is alleen beschikbaar in de app.');
      logGoogleLoginDiag('google_login_native_failed', { reason: 'no_window' });
      return false;
    }

    setRememberPreference(rememberMe);

    const initialized = await ensureGoogleSocialLoginInitialized();
    if (!initialized) {
      logGoogleLoginDiag('google_login_native_failed', { reason: 'plugin_init_failed' });
      return false;
    }

    let SocialLogin: typeof import('@capgo/capacitor-social-login').SocialLogin;
    try {
      ({ SocialLogin } = await import('@capgo/capacitor-social-login'));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logGoogleLoginDiag('google_login_native_failed', {
        reason: 'plugin_import_failed',
        message: redactErrorMessage(msg),
      });
      return false;
    }

    const attemptLogin = async (): Promise<
      | { ok: true; login: unknown }
      | { ok: false; cancelled: boolean; retryable: boolean; message?: string }
    > => {
      try {
        const login = await SocialLogin.login(
          { provider: 'google' } as import('@capgo/capacitor-social-login').LoginOptions,
        );
        return { ok: true, login };
      } catch (e) {
        const parsed = parseGoogleSignInError(e);
        if (parsed.statusCode === 12501 || /cancel/i.test(parsed.message)) {
          logGoogleLoginDiag('google_login_native_failed', { reason: 'user_cancelled' });
          return { ok: false, cancelled: true, retryable: false };
        }
        const retryable =
          parsed.statusCode === 12502 ||
          parsed.statusCode === 7 ||
          parsed.statusCode === 8 ||
          /not initialized|init/i.test(parsed.message);
        logGoogleLoginDiag('google_login_native_failed', {
          reason: 'plugin_login_failed',
          message: parsed.message,
          statusCode: parsed.statusCode ?? undefined,
          statusName: parsed.statusName ?? undefined,
          likelyConfigError: parsed.likelyConfigError,
          retryable,
        });
        if (parsed.likelyConfigError) {
          setError(
            'Google login configuratie (Play Store): voeg Play App Signing SHA-1 toe in Firebase en installeer een nieuwe build. Fout: DEVELOPER_ERROR (10).',
          );
        } else if (/scopes|main activity/i.test(parsed.message)) {
          setError('Google login configuratie moet opnieuw worden opgebouwd.');
        } else if (parsed.statusCode === 7) {
          setError('Netwerkfout bij Google inloggen. Controleer je verbinding.');
        } else if (!retryable) {
          setError(parsed.summary);
        }
        return {
          ok: false,
          cancelled: false,
          retryable,
          message: parsed.summary,
        };
      }
    };

    let loginResult = await attemptLogin();
    if (!loginResult.ok && loginResult.retryable && !loginResult.cancelled) {
      invalidateGoogleSocialLoginInit();
      await new Promise((r) => setTimeout(r, 450));
      await ensureGoogleSocialLoginInitialized();
      loginResult = await attemptLogin();
    }

    if (!loginResult.ok) {
      if (loginResult.cancelled) return true;
      setError(
        (prev) =>
          prev ??
          loginResult.message ??
          'Google inloggen is mislukt. Probeer opnieuw of gebruik e-mail en wachtwoord.',
      );
      return false;
    }

    const { idToken, pluginPayloadHint } = extractNativeGoogleIdToken(loginResult.login);
    if (!idToken) {
      logGoogleLoginDiag('google_login_native_failed', {
        reason: 'missing_id_token',
        pluginPayloadHint,
      });
      setError(
        pluginPayloadHint.includes('offline')
          ? 'Geen Google token ontvangen (offline-modus).'
          : 'Geen Google token ontvangen. Controleer app-configuratie (SHA-1, Web client id).',
      );
      return false;
    }

    const post = await fetch(resolveNativeAuthApiUrl('/api/auth/native/google'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const payload = (await post.json().catch(() => ({}))) as {
      ok?: boolean;
      code?: string;
    };
    if (!post.ok || !payload.ok) {
      const code = typeof payload.code === 'string' ? payload.code : '';
      logGoogleLoginDiag('google_login_native_failed', {
        reason: 'api_rejected',
        httpStatus: post.status,
        code: code || 'unknown',
      });
      setError(mapNativeGoogleApiError(code));
      return false;
    }

    logGoogleLoginDiag('google_login_native_success');

    if (analyticsContext === 'login') {
      try {
        trackLogin('google');
      } catch {
        /* ignore */
      }
    } else {
      try {
        trackRegistration({ method: 'google' });
      } catch {
        /* ignore */
      }
    }

    await applySessionMode(rememberMe);
    const sessionReady = await waitForNativeSession();
    if (!sessionReady) {
      logGoogleLoginDiag('google_login_native_failed', { reason: 'session_not_visible' });
      setError(
        'Inloggen gelukt, maar sessie start traag. Tik nogmaals op Google of ververs het scherm.',
      );
      return false;
    }

    try {
      sessionStorage.setItem('hc_npush_gate', '1');
    } catch {
      /* ignore */
    }
    try {
      router.refresh();
    } catch {
      /* ignore */
    }
    router.replace('/auth/social-success');
    return true;
  }, [
    analyticsContext,
    androidBridge,
    nativeAndroid,
    rememberMe,
    router,
    waitForNativeSession,
  ]);

  const onClick = useCallback(async () => {
    if (busy || disabled) return;

    logGoogleLoginDiag('google_login_tap', {
      preferNative,
      androidBridge,
      nativeAndroid,
      disabled: Boolean(disabled),
    });

    setError(null);
    setBusy(true);

    try {
      if (preferNative) {
        const nativeOk = await runNativeGoogleLogin();
        if (nativeOk) return;

        setError((prev) =>
          prev ??
          'Google inloggen is mislukt. Probeer opnieuw of gebruik e-mail en wachtwoord.',
        );
        return;
      }

      await runWebGoogleLogin();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logGoogleLoginDiag('google_login_native_failed', {
        reason: 'unexpected',
        message: redactErrorMessage(msg),
      });
      setError(
        'Google inloggen is mislukt. Controleer je verbinding of gebruik e-mail en wachtwoord.',
      );
    } finally {
      setBusy(false);
    }
  }, [
    busy,
    disabled,
    preferNative,
    androidBridge,
    nativeAndroid,
    runNativeGoogleLogin,
    runWebGoogleLogin,
  ]);

  const baseClass =
    variant === 'register'
      ? 'w-full max-w-sm mx-auto inline-flex justify-center items-center px-6 py-4 border border-gray-300 rounded-xl shadow-sm bg-white text-base font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed'
      : 'w-full inline-flex justify-center items-center px-6 py-4 border-2 border-gray-200 rounded-2xl shadow-sm bg-white text-base font-semibold text-gray-800 hover:border-emerald-300 hover:bg-emerald-50 active:bg-emerald-100 touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group';

  const configBlocked = preferNative && !GOOGLE_WEB_CLIENT_ID;

  return (
    <div className="space-y-2 relative z-10">
      <button
        type="button"
        onClick={() => void onClick()}
        disabled={disabled || busy || configBlocked}
        className={baseClass}
        aria-busy={busy}
      >
        <svg
          className={`w-6 h-6 mr-3 ${variant === 'login' ? 'group-hover:scale-110 transition-transform duration-200' : ''}`}
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {busy ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            Bezig…
          </span>
        ) : (
          <span
            className={
              variant === 'login'
                ? 'group-hover:text-emerald-700 transition-colors duration-200'
                : ''
            }
          >
            {buttonLabel}
          </span>
        )}
      </button>
      {error ? <p className="text-xs text-center text-red-600">{error}</p> : null}
      {configBlocked ? (
        <p className="text-xs text-center text-amber-700">
          Google login in de app vereist NEXT_PUBLIC_GOOGLE_NATIVE_CLIENT_ID (of legacy
          NEXT_PUBLIC_GOOGLE_CLIENT_ID) — de Firebase/native audience, niet de web OAuth client.
        </p>
      ) : null}
    </div>
  );
}
