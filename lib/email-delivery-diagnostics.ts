/**
 * Rate-limited structured logs for transactional email (no secrets, no codes, no bodies).
 */

const lastAt = new Map<string, number>();

export type EmailDeliveryDiagCategory =
  | 'email_config_missing'
  | 'email_invalid_sender'
  | 'email_provider_rejected'
  | 'email_provider_timeout'
  | 'email_provider_rate_limit'
  | 'email_send_skipped'
  | 'email_send_success'
  | 'email_provider_unknown'
  | 'email_send_attempt';

export function logEmailDeliveryDiag(
  category: EmailDeliveryDiagCategory,
  extra: Record<string, string | number | boolean | undefined> = {},
  rateLimitMs = 60_000,
): void {
  try {
    const key = `${category}:${extra.route ?? ''}:${extra.stage ?? ''}`;
    const now = Date.now();
    const prev = lastAt.get(key) ?? 0;
    if (now - prev < rateLimitMs) return;
    lastAt.set(key, now);
    console.info(
      '[email_delivery_diag]',
      JSON.stringify({
        category,
        ts: now,
        nodeEnv: process.env.NODE_ENV ?? 'unknown',
        vercel: Boolean(process.env.VERCEL),
        ...extra,
      }),
    );
  } catch {
    /* ignore */
  }
}
