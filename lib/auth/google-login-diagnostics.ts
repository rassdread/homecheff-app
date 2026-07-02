/**
 * Client-side Google login diagnostics (no tokens, emails, or PII).
 */

export type GoogleLoginDiagEvent =
  | 'google_login_tap'
  | 'google_login_native_start'
  | 'google_login_native_success'
  | 'google_login_native_failed'
  | 'google_login_web_start'
  | 'google_login_web_failed';

export type GoogleLoginDiagDetail = Record<
  string,
  string | boolean | number | null | undefined
>;

export function logGoogleLoginDiag(
  event: GoogleLoginDiagEvent,
  detail?: GoogleLoginDiagDetail,
): void {
  if (typeof window === 'undefined') return;
  try {
    const payload = detail ?? {};
    console.info('[HomeCheff google-login]', event, payload);
    if (
      typeof (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } })
        .Capacitor?.isNativePlatform === 'function' &&
      (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor!
        .isNativePlatform!()
    ) {
      console.warn('[HomeCheff google-login]', event, JSON.stringify(payload));
    }
  } catch {
    /* ignore */
  }
}
