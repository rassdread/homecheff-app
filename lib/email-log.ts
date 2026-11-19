/**
 * Server-side e-maillogging zonder volledige adressen of API-secrets in logs.
 */

export function maskEmailForLog(email: string): string {
  const e = email.trim().toLowerCase();
  const at = e.indexOf("@");
  if (at <= 0) return "(invalid)";
  const local = e.slice(0, at);
  const domain = e.slice(at + 1);
  if (!domain) return "(invalid)";
  const maskedLocal =
    local.length <= 2 ? `${local.slice(0, 1)}*` : `${local.slice(0, 2)}…`;
  return `${maskedLocal}@${domain}`;
}

/** A short provider or transport code, never an address or a secret. */
export function safeEmailCode(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return safeEmailCode(String(value));
  if (typeof value !== 'string') return null;
  const code = value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (!code || code.length > 64) return null;
  return code;
}

function rawErrorText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.message;
  if (value && typeof value === 'object' && typeof (value as { message?: unknown }).message === 'string') {
    return (value as { message: string }).message;
  }
  return '';
}

/** Provider text with addresses and secrets removed. */
export function safeEmailReason(value: unknown): string | null {
  const raw = rawErrorText(value);
  const cleaned = raw
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+/g, '[email]')
    .replace(/\b(?:re|sk|rk)_[A-Za-z0-9]+\b/g, '[secret]')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return null;
  return cleaned.length > 160 ? `${cleaned.slice(0, 160)}…` : cleaned;
}

/** A mail id. Values that look like an API key are not stored. */
export function safeProviderId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const id = value.trim();
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(id)) return null;
  if (/^(?:re|sk|rk)_/i.test(id)) return null;
  return id;
}

export function readProviderFailure(error: unknown): { code: string | null; reason: string | null } {
  const record = error && typeof error === 'object' ? error as { name?: unknown; message?: unknown; statusCode?: unknown } : {};
  const named = safeEmailCode(record.name) || safeEmailCode(record.statusCode);
  const message = typeof record.message === 'string' ? record.message : summarizeEmailError(error, 180);
  return { code: named, reason: safeEmailReason(message) };
}

/** Korte fouttekst voor logs (geen volledige stack/object dumps). */
export function summarizeEmailError(err: unknown, maxLen = 220): string {
  const message = rawErrorText(err);
  if (message) {
    const m = message.trim();
    return m.length > maxLen ? `${m.slice(0, maxLen)}…` : m;
  }
  const s = String(err).trim();
  return s.length > maxLen ? `${s.slice(0, maxLen)}…` : s;
}

export function logEmailSendFailure(
  event: string,
  err: unknown,
  opts?: { recipientEmail?: string }
): void {
  const masked = opts?.recipientEmail
    ? maskEmailForLog(opts.recipientEmail)
    : undefined;
  console.error(
    `[email] ${event} failed${masked ? ` to=${masked}` : ""}: ${safeEmailReason(err) || summarizeEmailError(err)}`
  );
}
