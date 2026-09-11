/**
 * Client-side Stripe Connect onboarding — zelfde flow als StripeConnectPaymentsBanner.
 * Generates a seller-specific Stripe Account Link via POST /api/stripe/connect/onboard
 * only when the server says canCreateOnboardingLink.
 */

import { rememberStripeConnectReturnPath } from '@/lib/stripe/stripe-connect-return-path';
import type { ConnectTrack } from '@/lib/stripe/connect-tracks';
import type { HomecheffConnectUiStatus } from '@/lib/stripe/connect-account-status';

export async function startStripeConnectOnboarding(options?: {
  /** HomeCheff path to resume after Stripe (e.g. /sell/new) — draft must already be persisted. */
  returnPath?: string;
  /** PARTICULAR | BUSINESS — required for new dual-track accounts. */
  track?: ConnectTrack;
  /** Allow safe replacement of empty stuck Express when switching to PARTICULAR. */
  forceReplace?: boolean;
}): Promise<{
  ok: boolean;
  error?: string;
  redirected?: boolean;
  needsTrackSelection?: boolean;
  replaceBlocked?: boolean;
  /** Server refused Account Link because status is pending/ready. */
  statusOnly?: boolean;
  uiStatus?: HomecheffConnectUiStatus;
}> {
  try {
    if (options?.returnPath) {
      rememberStripeConnectReturnPath(options.returnPath);
    } else if (typeof window !== 'undefined') {
      const path = `${window.location.pathname}${window.location.search}`;
      if (path.startsWith('/sell')) {
        rememberStripeConnectReturnPath(path);
      }
    }

    const res = await fetch('/api/stripe/connect/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        track: options?.track,
        forceReplace: options?.forceReplace === true,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      onboardingUrl?: string;
      error?: string;
      message?: string;
      needsTrackSelection?: boolean;
      canCreateOnboardingLink?: boolean;
      uiStatus?: HomecheffConnectUiStatus;
      paymentReady?: boolean;
    };
    if (!res.ok) {
      if (data.error === 'TRACK_REQUIRED' || data.needsTrackSelection) {
        return {
          ok: false,
          needsTrackSelection: true,
          error: data.message || data.error,
        };
      }
      if (data.error === 'CONNECT_REPLACE_BLOCKED') {
        return {
          ok: false,
          replaceBlocked: true,
          error:
            data.message ||
            'Je Stripe-profiel kan niet automatisch worden vervangen.',
        };
      }
      if (data.error === 'CONNECT_REPLACE_NEEDS_CONFIRMATION') {
        return {
          ok: false,
          needsTrackSelection: true,
          error:
            data.message ||
            'Bevestig of je HomeCheff als particulier of als bedrijf gebruikt.',
        };
      }
      return {
        ok: false,
        error:
          typeof data.error === 'string' &&
          !/^[A-Z][A-Z0-9_]{2,}$/.test(data.error.trim())
            ? data.error
            : data.message || 'Er ging iets mis. Probeer het opnieuw.',
      };
    }
    if (data.onboardingUrl) {
      window.location.href = data.onboardingUrl;
      return { ok: true, redirected: true };
    }

    // Ready / pending / no actionable requirements — go to status page, never loop.
    const uiStatus = data.uiStatus;
    if (
      typeof window !== 'undefined' &&
      (data.paymentReady ||
        data.canCreateOnboardingLink === false ||
        uiStatus === 'PENDING_VERIFICATION' ||
        uiStatus === 'PAYMENT_READY')
    ) {
      window.location.href = '/seller/stripe/success';
      return {
        ok: true,
        redirected: true,
        statusOnly: true,
        uiStatus,
      };
    }

    return { ok: true, statusOnly: true, uiStatus };
  } catch {
    return { ok: false, error: 'Er ging iets mis. Probeer het opnieuw.' };
  }
}
