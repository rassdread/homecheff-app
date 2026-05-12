import type { PendingIntentInput } from '@/lib/onboarding/pending-intent';
import { savePendingIntent } from '@/lib/onboarding/pending-intent';
import { rememberScrollForSoftGate } from '@/lib/onboarding/soft-gate-scroll';
import { trackOnboardingEvent } from '@/lib/onboarding/onboarding-analytics';

export const SOFT_AUTH_OPEN_EVENT = 'hc-soft-auth-open';

export type SoftAuthCopyKey =
  | 'saveItem'
  | 'giveProp'
  | 'follow'
  | 'message'
  | 'notifications'
  | 'ranking'
  | 'location'
  | 'create'
  | 'inspiration'
  | 'affiliate'
  | 'generic';

export type OpenSoftAuthGateDetail = {
  copyKey: SoftAuthCopyKey;
  intent: Omit<PendingIntentInput, 'createdAt' | 'expiresAt'>;
};

/**
 * Opens the global soft-auth sheet (bottom on mobile) and stores PendingIntent.
 */
export function openSoftAuthGate(detail: OpenSoftAuthGateDetail): void {
  if (typeof window === 'undefined') return;
  trackOnboardingEvent('SOFT_GATE_SHOWN', {
    copyKey: detail.copyKey,
    intentType: detail.intent.type,
  });
  savePendingIntent(detail.intent);
  window.dispatchEvent(new CustomEvent(SOFT_AUTH_OPEN_EVENT, { detail }));
}

export function openSoftAuthGateWithScroll(detail: OpenSoftAuthGateDetail): void {
  rememberScrollForSoftGate();
  openSoftAuthGate(detail);
}
