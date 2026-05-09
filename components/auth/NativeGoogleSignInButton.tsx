'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAndroidBridgePresent } from '@/lib/native/useAndroidBridgePresent';
import { useNativeAndroid } from '@/lib/native/useNativeAndroid';
import {
  applySessionMode,
  setRememberPreference,
} from '@/lib/session-mode';
import { trackLogin, trackRegistration } from '@/components/GoogleAnalytics';

const WEB_CLIENT_ID =
  typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || ''
    : '';

const CLIENT_LOG = '[HomeCheff native-google client]';

type NativeGoogleLoginShape = {
  provider?: string;
  result?: unknown;
};

/**
 * Capgo kan per platform iets andere vormen teruggeven; nooit tokens loggen.
 */
function extractNativeGoogleIdToken(login: unknown): {
  idToken: string | null;
  /** Waar idToken vandaan kwam of waarom hij ontbreekt (structuur-hint). */
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
    case 'google_client_id_mismatch':
    case 'auth_not_configured':
      return 'Google configuratie mismatch. Controleer server-omgeving (GOOGLE_CLIENT_ID).';
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

export type NativeGoogleSignInButtonProps = {
  rememberMe?: boolean;
  disabled?: boolean;
  buttonLabel: string;
  /** Styling: login page uses bordered card; register uses compact bordered button */
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
  const showNativeGoogle = androidBridge || nativeAndroid;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Lazy module load: alleen na user-tap; geen top-level import van @capgo/… */
  const capgoModulePromiseRef = useRef<Promise<
    typeof import('@capgo/capacitor-social-login')
  > | null>(null);

  const onClick = useCallback(async () => {
    if (busy || disabled) return;
    setError(null);
    setBusy(true);
    try {
      console.info('[HomeCheff] native Google tap → SocialLogin only (no signIn/location)');
      const webClientId = WEB_CLIENT_ID;
      if (!webClientId) {
        setError('Google login is niet geconfigureerd (ontbrekende client id).');
        return;
      }

      setRememberPreference(rememberMe);

      if (typeof window === 'undefined') {
        setError('Google login is alleen beschikbaar in de app.');
        return;
      }

      if (!capgoModulePromiseRef.current) {
        capgoModulePromiseRef.current = import('@capgo/capacitor-social-login').catch(
          (e) => {
            capgoModulePromiseRef.current = null;
            throw e;
          },
        );
      }
      const { SocialLogin } = await capgoModulePromiseRef.current;
      await SocialLogin.initialize({
        google: {
          webClientId,
          mode: 'online',
        },
      });
      // Geen custom scopes: Capgo Android weigert scopes zonder ModifiedMainActivity.
      // Alleen { provider } sturen zodat de bridge géén options-object serialiseert
      // (oude bundles + SW-cache-first op .js stuurden nog scopes: ["email","profile"]).
      const login = await SocialLogin.login(
        { provider: 'google' } as import('@capgo/capacitor-social-login').LoginOptions,
      );

      const { idToken, pluginPayloadHint } = extractNativeGoogleIdToken(login);
      const accessTok =
        login &&
        typeof login === 'object' &&
        (login as NativeGoogleLoginShape).provider === 'google' &&
        (login as NativeGoogleLoginShape).result &&
        typeof (login as { result: Record<string, unknown> }).result === 'object'
          ? (login as { result: { accessToken?: { token?: string } | null } }).result
              .accessToken
          : null;
      const hasAccessToken = Boolean(
        accessTok && typeof accessTok === 'object' && typeof accessTok.token === 'string',
      );

      console.info(CLIENT_LOG, {
        nativeGoogleLoginStarted: true,
        hasIdToken: Boolean(idToken),
        provider: (login as NativeGoogleLoginShape).provider,
        hasAccessToken,
        pluginPayloadHint,
      });

      if (!idToken) {
        setError(
          pluginPayloadHint.includes('offline')
            ? 'Geen Google token ontvangen (offline-modus). Zet native login op online/idToken.'
            : 'Geen Google token ontvangen. Controleer app-configuratie (SHA-1, Web client id) en herbouw de app.',
        );
        return;
      }

      const post = await fetch('/api/auth/native/google', {
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
        console.info(CLIENT_LOG, {
          nativeGooglePostFailed: true,
          httpStatus: post.status,
          code: code || 'unknown',
        });
        setError(mapNativeGoogleApiError(code));
        return;
      }

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
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.info(CLIENT_LOG, {
        nativeGoogleClientException: true,
        message: msg.replace(/ya29\.[a-zA-Z0-9._-]+/gi, '[redacted]').slice(0, 200),
      });
      if (/cancel|canceled|12501|user_cancel|10:/i.test(msg)) {
        setError(null);
      } else if (/scopes|main activity/i.test(msg)) {
        setError('Google login configuratie moet opnieuw worden opgebouwd.');
      } else {
        setError(
          'Google inloggen is mislukt (onverwachte fout). Controleer je verbinding of gebruik e-mail en wachtwoord.',
        );
      }
    } finally {
      setBusy(false);
    }
  }, [analyticsContext, busy, disabled, rememberMe, router]);

  if (!showNativeGoogle) {
    return null;
  }

  const baseClass =
    variant === 'register'
      ? 'w-full max-w-sm mx-auto inline-flex justify-center items-center px-6 py-4 border border-gray-300 rounded-xl shadow-sm bg-white text-base font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed'
      : 'w-full inline-flex justify-center items-center px-6 py-4 border-2 border-gray-200 rounded-2xl shadow-sm bg-white text-base font-semibold text-gray-800 hover:border-emerald-300 hover:bg-emerald-50 active:bg-emerald-100 touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group';

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void onClick()}
        disabled={disabled || busy || !WEB_CLIENT_ID}
        className={baseClass}
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
          <span className={variant === 'login' ? 'group-hover:text-emerald-700 transition-colors duration-200' : ''}>
            {buttonLabel}
          </span>
        )}
      </button>
      {error ? <p className="text-xs text-center text-red-600">{error}</p> : null}
      {!WEB_CLIENT_ID ? (
        <p className="text-xs text-center text-amber-700">
          Google login in de app vereist NEXT_PUBLIC_GOOGLE_CLIENT_ID (zelfde waarde als de web Google client).
        </p>
      ) : null}
    </div>
  );
}
