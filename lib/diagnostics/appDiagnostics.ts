/**
 * Cross-cutting, privacy-safe diagnostics (feeds, onboarding, UI boundaries).
 * Rate-limited; no message bodies, emails, or raw ids in production logs.
 *
 * Enable in production: NEXT_PUBLIC_APP_DIAG=1
 */

const WINDOW_MS = 60_000;
const MAX_PER_CODE_PER_WINDOW = 8;

type Bucket = { windowStart: number; count: number };
const buckets = new Map<string, Bucket>();

function allow(code: string): boolean {
  const now = Date.now();
  const b = buckets.get(code);
  if (!b || now - b.windowStart > WINDOW_MS) {
    buckets.set(code, { windowStart: now, count: 1 });
    return true;
  }
  if (b.count >= MAX_PER_CODE_PER_WINDOW) return false;
  b.count += 1;
  return true;
}

export type AppDiagCode =
  | 'feed_items_filtered'
  | 'feed_fetch_json_invalid'
  | 'feed_inspiration_json_invalid'
  | 'messages_ui_crash'
  | 'onboarding_analytics_http'
  | 'onboarding_analytics_network'
  | 'pending_intent_resume_started'
  | 'pending_intent_resume_completed'
  | 'pending_intent_resume_skipped_duplicate'
  | 'auth_gate_redirect_skipped'
  | 'soft_gate_resume_duplicate'
  | 'push_permission_status'
  | 'push_token_sync_started'
  | 'push_token_sync_success'
  | 'push_token_sync_skipped'
  | 'push_token_sync_failed'
  | 'push_register_api_failed'
  | 'push_token_refresh'
  | 'push_received'
  | 'push_opened'
  | 'push_deep_link_resolved'
  | 'perf_web_vital'
  | 'perf_navigation';

export function reportAppDiagnostic(
  code: AppDiagCode,
  detail?: Record<string, string | number | boolean | undefined>
): void {
  try {
    if (!allow(code)) return;
    const enabled =
      process.env.NODE_ENV !== 'production' ||
      process.env.NEXT_PUBLIC_APP_DIAG === '1';
    if (!enabled) return;
    const safe = detail
      ? Object.fromEntries(
          Object.entries(detail).filter(
            ([, v]) =>
              v === undefined ||
              typeof v === 'string' ||
              typeof v === 'number' ||
              typeof v === 'boolean'
          )
        )
      : undefined;
    const scrubbed =
      safe &&
      Object.fromEntries(
        Object.entries(safe).map(([k, v]) =>
          typeof v === 'string' && (k.includes('id') || k.includes('Id'))
            ? [k, `len:${v.length}`]
            : [k, v]
        )
      );
    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      console.warn(`[hc-app] ${code}`, scrubbed ?? '');
    }
  } catch {
    /* diagnostics must never break the app */
  }
}
