/**
 * Affiliate Attribution Contract — Phase 13C SSOT.
 *
 * Single documented policy for pilot. Server and client cookie helpers
 * must follow this contract (see lib/affiliate-attribution.ts).
 */

import {
  ATTRIBUTION_WINDOW_DAYS,
  COOKIE_TTL_DAYS,
  LEDGER_PENDING_DAYS,
} from '@/lib/affiliate-config';

export const AFFILIATE_ATTRIBUTION_POLICY = 'first_touch' as const;

export type AffiliateAttributionPolicy = typeof AFFILIATE_ATTRIBUTION_POLICY;

/** Canonical referral cookie name. */
export const REFERRAL_COOKIE_NAME = 'hc_ref';

export const AFFILIATE_ATTRIBUTION_CONTRACT = {
  policy: AFFILIATE_ATTRIBUTION_POLICY,
  cookieName: REFERRAL_COOKIE_NAME,
  cookieTtlDays: COOKIE_TTL_DAYS,
  attributionRevenueWindowDays: ATTRIBUTION_WINDOW_DAYS,
  commissionPendingDays: LEDGER_PENDING_DAYS,
  overwriteRule:
    'First valid affiliate click sets hc_ref. Later links do not overwrite until cookie expires.',
  selfReferral: 'blocked',
  duplicateSignupAttribution: 'blocked_per_user',
  crossDevice: 'unsupported',
  crossDeviceNote:
    'Attribution requires hc_ref on the same browser/device at signup or social onboarding. Desktop click does not follow to mobile.',
  expiredCookie: 'New valid click may set a fresh hc_ref.',
  qrBehavior: 'Same as referral link — server first-touch via /api/affiliate/referral.',
  socialShareBehavior:
    'Share URLs add ?ref= when missing; cookie set via server redirect or first-touch client helper.',
  googleSocialLogin:
    'Attribution runs at registration or complete-social-onboarding while hc_ref is present.',
  appDeepLink:
    'Beta/app links may set hc_ref + hc_beta_src; still same-browser at signup.',
} as const;

export function affiliateAttributionPolicySummary(): string {
  return `First-touch (${COOKIE_TTL_DAYS}d cookie, ${ATTRIBUTION_WINDOW_DAYS}d revenue window). Cross-device: not supported.`;
}
