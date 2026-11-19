import { uiCopy, type UiLanguage } from '@/lib/admin/notification-copy';

/**
 * Production-safe limits for admin email broadcasts.
 * Legitimate admin mail remains possible; accidental full-audience blasts need confirmation.
 */

export const ADMIN_EMAIL_SOFT_MAX = 50;
/** Hard ceiling for a single admin email operation (override via EMAIL_ADMIN_MAX_RECIPIENTS). */
export const ADMIN_EMAIL_HARD_MAX_DEFAULT = 500;

export function resolveAdminEmailHardMax(): number {
  const raw = process.env.EMAIL_ADMIN_MAX_RECIPIENTS?.trim();
  if (!raw) return ADMIN_EMAIL_HARD_MAX_DEFAULT;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < ADMIN_EMAIL_SOFT_MAX) return ADMIN_EMAIL_HARD_MAX_DEFAULT;
  return Math.min(n, 5000);
}

export type AdminEmailBlastGate =
  | { ok: true; emailRecipientCount: number; requiresConfirm: boolean }
  | {
      ok: false;
      code: 'CONFIRM_REQUIRED' | 'HARD_LIMIT' | 'MISSING_IDEMPOTENCY';
      error: string;
      emailRecipientCount: number;
      softMax: number;
      hardMax: number;
    };

export function evaluateAdminEmailBlast(input: {
  sendEmail: boolean;
  emailRecipientCount: number;
  targetType: string;
  confirmEmailBlast?: boolean;
  idempotencyKey?: string | null;
  lang?: UiLanguage;
}): AdminEmailBlastGate {
  const lang = input.lang === 'en' ? 'en' : 'nl';
  if (!input.sendEmail) {
    return { ok: true, emailRecipientCount: 0, requiresConfirm: false };
  }

  const hardMax = resolveAdminEmailHardMax();
  const count = input.emailRecipientCount;
  const largeAudience =
    input.targetType === 'all' || count > ADMIN_EMAIL_SOFT_MAX;

  if (count > hardMax) {
    return {
      ok: false,
      code: 'HARD_LIMIT',
      error: uiCopy(lang, 'admin.notificationCenter.ui.blastHard', { count, max: hardMax }),
      emailRecipientCount: count,
      softMax: ADMIN_EMAIL_SOFT_MAX,
      hardMax,
    };
  }

  if (largeAudience && !input.confirmEmailBlast) {
    return {
      ok: false,
      code: 'CONFIRM_REQUIRED',
      error: uiCopy(lang, 'admin.notificationCenter.ui.blastConfirm', { count }),
      emailRecipientCount: count,
      softMax: ADMIN_EMAIL_SOFT_MAX,
      hardMax,
    };
  }

  if (largeAudience && !input.idempotencyKey?.trim()) {
    return {
      ok: false,
      code: 'MISSING_IDEMPOTENCY',
      error: uiCopy(lang, 'admin.notificationCenter.ui.blastIdempotency'),
      emailRecipientCount: count,
      softMax: ADMIN_EMAIL_SOFT_MAX,
      hardMax,
    };
  }

  return {
    ok: true,
    emailRecipientCount: count,
    requiresConfirm: largeAudience,
  };
}

const broadcastKeys = new Map<string, number>();
const BROADCAST_TTL_MS = 30 * 60_000;

export function claimAdminBroadcastIdempotencyKey(key: string): boolean {
  const k = key.trim().slice(0, 200);
  if (!k) return true;
  const now = Date.now();
  for (const [existing, t] of broadcastKeys) {
    if (now - t > BROADCAST_TTL_MS) broadcastKeys.delete(existing);
  }
  if (broadcastKeys.has(k)) return false;
  broadcastKeys.set(k, now);
  return true;
}

export function __resetAdminBroadcastIdempotencyForTests() {
  broadcastKeys.clear();
}
