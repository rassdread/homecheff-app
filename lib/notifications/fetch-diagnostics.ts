/**
 * Rate-limited server logs for notification fetch issues (no payloads, no PII).
 */

const lastAt = new Map<string, number>();

export function logNotificationDiag(
  event:
    | 'notifications_fetch_failed'
    | 'notifications_payload_fallback'
    | 'notifications_poll_skipped',
  extra: Record<string, string | number | boolean | undefined>,
  rateLimitMs = 60_000,
): void {
  try {
    const key = `${event}:${extra.reason ?? ''}`;
    const now = Date.now();
    const prev = lastAt.get(key) ?? 0;
    if (now - prev < rateLimitMs) return;
    lastAt.set(key, now);
    console.warn(
      '[notifications_diag]',
      JSON.stringify({ event, ts: now, ...extra }),
    );
  } catch {
    /* ignore */
  }
}
