import type { AppVersionApiResponse } from '@/lib/app-version-config';
import { isSemverLessThan, parseSemverCore } from '@/lib/app-version-semver';

/** Session flag: optional modal dismissed for this tab session. */
export const HC_APP_UPDATE_OPTIONAL_DISMISSED_SS = 'hc:appUpdateOptionalDismissed';

/** Dispatch after setting sessionStorage so providers re-read dismissed state. */
export const HC_APP_UPDATE_OPTIONAL_DISMISSED_EVENT = 'hc-app-update-optional-dismissed';

export function readOptionalDismissedSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(HC_APP_UPDATE_OPTIONAL_DISMISSED_SS) === '1';
  } catch {
    return false;
  }
}

export function markOptionalDismissedSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(HC_APP_UPDATE_OPTIONAL_DISMISSED_SS, '1');
    window.dispatchEvent(new Event(HC_APP_UPDATE_OPTIONAL_DISMISSED_EVENT));
  } catch {
    /* ignore */
  }
}

export type AndroidBetaUpdateDerived = {
  hasValidCurrent: boolean;
  hasComparableLatest: boolean;
  hasComparableMin: boolean;
  belowMin: boolean;
  belowLatest: boolean;
  forceUi: boolean;
  /** Same semver conditions as optional modal, ignoring dismiss. */
  optionalAvailable: boolean;
  optionalModal: boolean;
  optionalReminder: boolean;
  apkBlocksSoft: boolean;
};

/**
 * Pure semver gating for Android beta APK updates (aligned with AppUpdateGate).
 */
export function deriveAndroidBetaUpdate(
  data: AppVersionApiResponse,
  currentVersion: string | null,
  dismissedOptional: boolean
): AndroidBetaUpdateDerived {
  const latestApkVersionStr = (data.latestApkVersion ?? '').trim();
  const minRequiredApkVersionStr = (data.minRequiredApkVersion ?? '').trim();

  const hasValidCurrent =
    Boolean(currentVersion) && parseSemverCore(currentVersion) != null;
  const hasComparableLatest =
    Boolean(latestApkVersionStr) && parseSemverCore(latestApkVersionStr) != null;
  const hasComparableMin =
    Boolean(minRequiredApkVersionStr) && parseSemverCore(minRequiredApkVersionStr) != null;

  const belowMin =
    hasValidCurrent &&
    hasComparableMin &&
    isSemverLessThan(currentVersion, minRequiredApkVersionStr) === true;
  const belowLatest =
    hasValidCurrent &&
    hasComparableLatest &&
    isSemverLessThan(currentVersion, latestApkVersionStr) === true;

  const forceByMin = belowMin === true;
  /** Server forces APK update but native semver unavailable — still show forced UI (beta). */
  const forceByUnreadableCurrent =
    data.forceUpdate === true && hasComparableLatest && !hasValidCurrent;
  const forceByFlag =
    data.forceUpdate === true &&
    belowLatest === true &&
    hasComparableLatest &&
    hasValidCurrent;
  const forceUi = forceByMin || forceByFlag || forceByUnreadableCurrent;

  const optionalAvailable =
    hasValidCurrent &&
    hasComparableLatest &&
    hasComparableMin &&
    belowLatest === true &&
    belowMin !== true &&
    data.forceUpdate !== true;

  /** Forced path never respects optional session dismiss / snooze. */
  const optionalModal =
    optionalAvailable && !dismissedOptional && !forceUi;
  const optionalReminder =
    optionalAvailable && dismissedOptional && !forceUi;

  const apkBlocksSoft = Boolean(
    forceByMin ||
      (data.forceUpdate === true &&
        hasComparableLatest &&
        (belowLatest === true || !hasValidCurrent)),
  );

  return {
    hasValidCurrent,
    hasComparableLatest,
    hasComparableMin,
    belowMin,
    belowLatest,
    forceUi,
    optionalAvailable,
    optionalModal,
    optionalReminder,
    apkBlocksSoft,
  };
}
