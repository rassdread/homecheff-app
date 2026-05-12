/**
 * Central pending post-auth intent (sessionStorage).
 * Used when a guest starts an action and must log in/register first.
 */

import {
  needsProfileOnboardingFromFlags,
  onboardingFlagsFromSessionUser,
  sanitizePostAuthRelativeUrl,
} from '@/lib/auth/post-auth-redirect';
import {
  buildSellNewSearchFromIntent,
  type CreateFlowIntent,
} from '@/lib/createFlowIntent';

export const PENDING_INTENT_STORAGE_KEY = 'homecheff_pending_intent_v1';

export const DEFAULT_INTENT_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export type PendingIntentType =
  | 'create_item'
  | 'create_inspiration'
  | 'start_chat'
  | 'save_item'
  | 'like_item'
  | 'comment'
  | 'follow_profile'
  | 'give_prop'
  | 'join_ranking'
  | 'enable_location'
  | 'join_affiliate'
  | 'open_hcp'
  | 'enable_notifications'
  | 'complete_profile';

export type PendingIntent = {
  type: PendingIntentType;
  mode?: 'dorpsplein' | 'inspiratie';
  vertical?: 'CHEFF' | 'GARDEN' | 'DESIGNER';
  targetId?: string;
  returnPath?: string;
  draftKey?: string;
  mediaRef?: string;
  createdAt: string;
  expiresAt: string;
  /** When true, `/auth/resume-interaction` runs a one-shot API to complete the action. */
  autoResume?: boolean;
  /** Hint for post-auth persona copy (chef, designer, …). */
  persona?: string;
};

export type PendingIntentInput = Omit<PendingIntent, 'createdAt' | 'expiresAt'> &
  Partial<Pick<PendingIntent, 'createdAt' | 'expiresAt'>>;

function nowIso(): string {
  return new Date().toISOString();
}

export function isPendingIntentExpired(intent: PendingIntent): boolean {
  try {
    return new Date(intent.expiresAt).getTime() < Date.now();
  } catch {
    return true;
  }
}

function safeReturnPath(path: string | undefined | null): string | null {
  if (!path || typeof path !== 'string') return null;
  return sanitizePostAuthRelativeUrl(path.trim());
}

function sellNewPathFromIntent(intent: PendingIntent): string {
  const explicit = safeReturnPath(intent.returnPath);
  if (explicit?.startsWith('/sell/new')) return explicit;
  const mode: CreateFlowIntent['mode'] =
    intent.type === 'create_inspiration' || intent.mode === 'inspiratie'
      ? 'inspiratie'
      : 'dorpsplein';
  const cf: CreateFlowIntent = { mode, vertical: intent.vertical };
  const q = buildSellNewSearchFromIntent(cf);
  return `/sell/new${q}`;
}

function needsInteractionResume(intent: PendingIntent): boolean {
  if (!intent.autoResume) return false;
  return (
    intent.type === 'save_item' ||
    intent.type === 'like_item' ||
    intent.type === 'follow_profile' ||
    intent.type === 'give_prop'
  );
}

/**
 * After authentication, maps a stored intent to a relative in-app URL.
 * Returns null if profile onboarding is still required or intent is expired.
 * Does not clear storage (see consumeAndResolvePostAuthUrl).
 */
export function resolvePostAuthIntentRedirect(
  user: { username?: string | null; socialOnboardingCompleted?: boolean | null },
  intent: PendingIntent | null,
): string | null {
  if (!intent || isPendingIntentExpired(intent)) return null;
  const flags = onboardingFlagsFromSessionUser(user);
  if (needsProfileOnboardingFromFlags(flags)) return null;

  const fallbackPath = (): string | null => safeReturnPath(intent.returnPath);

  if (needsInteractionResume(intent)) {
    return '/auth/resume-interaction';
  }

  switch (intent.type) {
    case 'create_item':
    case 'create_inspiration':
      return sellNewPathFromIntent(intent);
    case 'start_chat':
      return '/auth/resume-intent';
    case 'join_affiliate':
      return '/affiliate';
    case 'open_hcp':
      return '/mijn-hcp';
    case 'enable_notifications':
      return '/notifications';
    case 'join_ranking':
      return fallbackPath() || '/hcp-ranglijsten';
    case 'enable_location':
      return fallbackPath() || '/profile';
    case 'save_item':
    case 'like_item':
    case 'comment':
    case 'follow_profile':
    case 'give_prop': {
      const p = fallbackPath();
      if (p) return p;
      if (intent.targetId) return `/product/${encodeURIComponent(intent.targetId)}`;
      return null;
    }
    case 'complete_profile':
      return fallbackPath() || '/';
  }
  return null;
}

export const PERSONA_HINT_KEY = 'hc_persona_hint';

export function savePendingIntent(input: PendingIntentInput): void {
  if (typeof window === 'undefined') return;
  const createdAt = input.createdAt ?? nowIso();
  const expiresAt =
    input.expiresAt ??
    new Date(Date.now() + DEFAULT_INTENT_TTL_MS).toISOString();
  const full: PendingIntent = {
    ...input,
    createdAt,
    expiresAt,
  };
  try {
    window.sessionStorage.setItem(PENDING_INTENT_STORAGE_KEY, JSON.stringify(full));
    if (full.persona) {
      try {
        window.sessionStorage.setItem(PERSONA_HINT_KEY, full.persona);
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* quota / private mode */
  }
}

export function getPendingIntent(): PendingIntent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_INTENT_STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Partial<PendingIntent>;
    if (!o.type || !o.createdAt || !o.expiresAt) return null;
    return o as PendingIntent;
  } catch {
    return null;
  }
}

export function clearPendingIntent(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(PENDING_INTENT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Returns a post-login URL from a pending intent and clears storage when safe.
 * Call only when the user is fully allowed on the platform (profile gate passed).
 */
export function consumeAndResolvePostAuthUrl(user: {
  username?: string | null;
  socialOnboardingCompleted?: boolean | null;
}): string | null {
  const intent = getPendingIntent();
  if (!intent) return null;
  if (isPendingIntentExpired(intent)) {
    clearPendingIntent();
    return null;
  }
  const url = resolvePostAuthIntentRedirect(user, intent);
  if (!url) return null;
  if (!url.startsWith('/auth/resume-intent') && !url.startsWith('/auth/resume-interaction')) {
    clearPendingIntent();
  }
  return url;
}

export function personaFromVertical(
  vertical?: 'CHEFF' | 'GARDEN' | 'DESIGNER',
): string | undefined {
  if (vertical === 'CHEFF') return 'chef';
  if (vertical === 'GARDEN') return 'grower';
  if (vertical === 'DESIGNER') return 'designer';
  return undefined;
}
