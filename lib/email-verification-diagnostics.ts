/**
 * Structured, safe diagnostics for verification email flows (no codes, no full emails).
 */
export function logEmailVerificationDiag(
  event:
    | 'email_verification_send_started'
    | 'email_verification_send_success'
    | 'email_verification_send_failed'
    | 'email_verification_resend_success'
    | 'email_verification_resend_failed'
    | 'config_missing_api_key'
    | 'config_invalid_from'
    | 'provider_rejected_sender'
    | 'provider_unknown'
    | 'provider_timeout'
    | 'provider_rate_limited',
  extra?: Record<string, string | number | boolean | undefined>,
): void {
  try {
    console.info(
      '[email_verification_diag]',
      JSON.stringify({ event, ts: Date.now(), ...extra }),
    );
  } catch {
    /* ignore */
  }
}
