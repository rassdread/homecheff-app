/**
 * Public VerdienCheck session — sessionStorage only.
 * No persistent browser store. No cookies. No server. No income analytics.
 */

import {
  EMPTY_WIZARD_STATE,
  type WizardState,
  type WizardStepId,
} from '../wizard/schema';
import { FORBIDDEN_VERDIENCHECK_ANALYTICS_KEYS } from './analytics-guard';

export const VERDIENCHECK_SESSION_KEY = 'hc_verdiencheck_v1';
export const VERDIENCHECK_SESSION_VERSION = 1;

export type VerdienCheckSession = {
  version: number;
  currentStep: WizardStepId;
  state: WizardState;
};

export function forbiddenAnalyticsKeys(): readonly string[] {
  return FORBIDDEN_VERDIENCHECK_ANALYTICS_KEYS;
}

function canUseSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

export function readVerdienCheckSession(): VerdienCheckSession | null {
  if (!canUseSessionStorage()) return null;
  try {
    const raw = window.sessionStorage.getItem(VERDIENCHECK_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VerdienCheckSession;
    if (parsed.version !== VERDIENCHECK_SESSION_VERSION) return null;
    if (!parsed.state || !parsed.currentStep) return null;
    return {
      version: VERDIENCHECK_SESSION_VERSION,
      currentStep: parsed.currentStep,
      state: { ...EMPTY_WIZARD_STATE, ...parsed.state },
    };
  } catch {
    return null;
  }
}

export function writeVerdienCheckSession(session: VerdienCheckSession): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(
    VERDIENCHECK_SESSION_KEY,
    JSON.stringify({
      version: VERDIENCHECK_SESSION_VERSION,
      currentStep: session.currentStep,
      state: session.state,
    }),
  );
}

export function clearVerdienCheckSession(): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(VERDIENCHECK_SESSION_KEY);
}

export function persistenceUsesDatabase(): false {
  return false;
}
