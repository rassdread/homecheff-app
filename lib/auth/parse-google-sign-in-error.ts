/**
 * Parse native Google Sign-In errors (Capacitor plugin / Android ApiException).
 * No tokens or PII — safe for client logs and UI hints.
 */

export type ParsedGoogleSignInError = {
  /** Human-readable summary for logs/UI */
  summary: string;
  /** Android GoogleSignInStatusCodes / ApiException numeric code when found */
  statusCode: number | null;
  /** e.g. DEVELOPER_ERROR, SIGN_IN_CANCELLED */
  statusName: string | null;
  /** Raw message redacted and truncated */
  message: string;
  /** Likely SHA / OAuth / Firebase misconfiguration */
  likelyConfigError: boolean;
};

const STATUS_NAMES: Record<number, string> = {
  4: 'SIGN_IN_REQUIRED',
  7: 'NETWORK_ERROR',
  8: 'INTERNAL_ERROR',
  10: 'DEVELOPER_ERROR',
  12500: 'SIGN_IN_FAILED',
  12501: 'SIGN_IN_CANCELLED',
  12502: 'SIGN_IN_CURRENTLY_IN_PROGRESS',
};

function redact(msg: string): string {
  return msg.replace(/ya29\.[a-zA-Z0-9._-]+/gi, '[redacted]').slice(0, 400);
}

function extractStatusCode(msg: string): number | null {
  const patterns = [
    /\bApiException:\s*(\d+)\b/i,
    /\bstatus(?:Code)?[:\s]+(\d+)\b/i,
    /\bcode[:\s]+(\d+)\b/i,
    /\b(\d{1,5})\s*:\s*(?:DEVELOPER_ERROR|ApiException)/i,
    /\bDEVELOPER_ERROR\b/i,
    /\b12501\b/,
    /\b10\b(?=.*(?:DEVELOPER|developer|config))/i,
  ];
  for (const re of patterns) {
    const m = msg.match(re);
    if (!m) continue;
    if (/DEVELOPER_ERROR/i.test(m[0])) return 10;
    if (/\b12501\b/.test(m[0])) return 12501;
    const n = Number(m[1]);
    if (Number.isFinite(n)) return n;
  }
  if (/DEVELOPER_ERROR/i.test(msg)) return 10;
  if (/12501|user_cancel/i.test(msg)) return 12501;
  return null;
}

export function parseGoogleSignInError(error: unknown): ParsedGoogleSignInError {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : JSON.stringify(error);
  const redacted = redact(message);
  const statusCode = extractStatusCode(redacted);
  const statusName =
    statusCode != null ? (STATUS_NAMES[statusCode] ?? `STATUS_${statusCode}`) : null;

  const likelyConfigError =
    statusCode === 10 ||
    /DEVELOPER_ERROR|ApiException:\s*10|SHA-?1|oauth|client_id|google-services/i.test(
      redacted,
    );

  let summary = 'Google inloggen mislukt.';
  if (statusCode === 12501 || /cancel/i.test(redacted)) {
    summary = 'Google inloggen geannuleerd.';
  } else if (statusCode === 7) {
    summary = 'Netwerkfout bij Google inloggen.';
  } else if (likelyConfigError) {
    summary =
      'Google configuratiefout (DEVELOPER_ERROR). Controleer Firebase SHA-1/SHA-256 voor Play App Signing.';
  } else if (statusCode === 8) {
    summary = 'Interne Google-inlogfout. Probeer later opnieuw.';
  }

  return {
    summary,
    statusCode,
    statusName,
    message: redacted,
    likelyConfigError,
  };
}
