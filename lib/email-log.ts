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

/** Korte fouttekst voor logs (geen volledige stack/object dumps). */
export function summarizeEmailError(err: unknown, maxLen = 220): string {
  if (err instanceof Error) {
    const m = err.message.trim();
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
    `[email] ${event} failed${masked ? ` to=${masked}` : ""}: ${summarizeEmailError(err)}`
  );
}
