/**
 * Typed e-mail send failures for API responses and safe diagnostics (no secrets).
 */

export type EmailFailureCategory =
  | 'config_missing_api_key'
  | 'config_missing_from'
  | 'config_invalid_from'
  | 'provider_rejected_sender'
  | 'provider_rate_limited'
  | 'provider_timeout'
  | 'provider_unknown';

export class EmailSendFailure extends Error {
  constructor(
    message: string,
    public readonly category: EmailFailureCategory,
    public readonly apiCode: 'EMAIL_NOT_CONFIGURED' | 'EMAIL_UNAVAILABLE',
  ) {
    super(message);
    this.name = 'EmailSendFailure';
  }
}

function pickString(v: unknown): string | undefined {
  if (typeof v === 'string' && v.trim()) return v.trim();
  return undefined;
}

/** Classify Resend SDK / HTTP error shape without logging secrets. */
export function classifyResendClientError(err: unknown): EmailFailureCategory {
  const e = err as Record<string, unknown> | null;
  const status =
    typeof e?.statusCode === 'number'
      ? e.statusCode
      : typeof (e as { status?: number })?.status === 'number'
        ? (e as { status: number }).status
        : undefined;
  const msg = (
    pickString(e?.message) ||
    (err instanceof Error ? err.message : String(err))
  ).toLowerCase();

  if (
    status === 504 ||
    status === 408 ||
    /timeout|timed out|etimedout|econnreset|econnaborted|socket hang up|fetch failed/.test(
      msg,
    )
  ) {
    return 'provider_timeout';
  }

  if (status === 429 || /rate limit|too many requests/.test(msg)) {
    return 'provider_rate_limited';
  }
  if (
    status === 403 ||
    status === 422 ||
    /domain.*not.*verified|not.*verified.*domain|invalid.*from|from.*address|sender/.test(
      msg,
    )
  ) {
    return 'provider_rejected_sender';
  }
  return 'provider_unknown';
}
