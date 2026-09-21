/**
 * Privacy-safe VerdienCheck → listing activation flag.
 * Boolean session marker only — never stores financial or household answers.
 */

import {
  trackVerdienCheckFunnelEvent,
  VERDIENCHECK_FUNNEL_EVENTS,
} from '@/lib/analytics/verdiencheck-funnel';

export const VERDIENCHECK_ACTIVATION_KEY = 'hc_verdiencheck_activation';

function canUseSession(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

export function markVerdienCheckSellerActivation(): void {
  if (!canUseSession()) return;
  try {
    window.sessionStorage.setItem(VERDIENCHECK_ACTIVATION_KEY, '1');
  } catch {
    /* ignore quota / private mode */
  }
}

export function hasVerdienCheckSellerActivation(): boolean {
  if (!canUseSession()) return false;
  try {
    return window.sessionStorage.getItem(VERDIENCHECK_ACTIVATION_KEY) === '1';
  } catch {
    return false;
  }
}

export function consumeVerdienCheckSellerActivation(): boolean {
  const had = hasVerdienCheckSellerActivation();
  if (!canUseSession()) return had;
  try {
    window.sessionStorage.removeItem(VERDIENCHECK_ACTIVATION_KEY);
  } catch {
    /* ignore */
  }
  return had;
}

export function trackVerdienCheckSignupCompletedIfPending(): void {
  if (!hasVerdienCheckSellerActivation()) return;
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.signupCompleted, {
    authenticated: 'yes',
    funnel_stage: 'result',
  });
}

export function trackVerdienCheckListingStartedIfPending(): void {
  if (!hasVerdienCheckSellerActivation()) return;
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.firstListingStarted, {
    authenticated: 'yes',
    funnel_stage: 'result',
  });
}

export function trackVerdienCheckListingPublishedIfPending(): void {
  if (!hasVerdienCheckSellerActivation()) return;
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.firstListingPublished, {
    authenticated: 'yes',
    funnel_stage: 'result',
  });
  consumeVerdienCheckSellerActivation();
}
