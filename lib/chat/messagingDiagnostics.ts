/**
 * Lightweight, privacy-safe diagnostics for messaging edge cases.
 * Rate-limited; never logs message text, emails, or full ids (only length / reason codes).
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

export type MessagingDiagCode =
  | 'conv_list_invalid_root'
  | 'conv_list_missing_id'
  | 'conv_last_message_invalid'
  | 'conv_participant_stub'
  | 'relationship_context_sanitized'
  | 'pusher_msg_rejected'
  | 'chat_msg_invalid'
  | 'chat_msg_merge_skipped'
  | 'split_view_conv_fetch_shape';

/**
 * Report a messaging diagnostic (dev: console.warn; prod: silent unless NEXT_PUBLIC_MSG_DIAG=1).
 */
export function reportMessagingDiagnostic(
  code: MessagingDiagCode,
  detail?: Record<string, string | number | boolean | undefined>
): void {
  if (!allow(code)) return;
  const enabled =
    process.env.NODE_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_MSG_DIAG === '1';
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
  // Never log raw conversation ids in production diagnostics build — only lengths.
  const scrubbed =
    safe &&
    Object.fromEntries(
      Object.entries(safe).map(([k, v]) =>
        typeof v === 'string' && (k.includes('id') || k.includes('Id'))
          ? [k, `len:${v.length}`]
          : [k, v]
      )
    );
  console.warn(`[hc-messages] ${code}`, scrubbed ?? '');
}
