/**
 * Dual-track Stripe Connect configuration for HomeCheff.
 *
 * TRACK PARTICULAR — NL individual, dashboard=none; transfers + card_payments
 *   for platform eligibility. HC payment model stays SCT (no direct/destination).
 * TRACK BUSINESS   — Express + hosted onboarding (KvK/KYB via Stripe).
 *
 * Service agreement: full. Live validated 2026-09-11: dashboard=none individual
 * with transfers+card_payments → no KvK/company docs.
 */

import type Stripe from 'stripe';

export const CONNECT_TRACKS = ['PARTICULAR', 'BUSINESS'] as const;
export type ConnectTrack = (typeof CONNECT_TRACKS)[number];

export function parseConnectTrack(raw: unknown): ConnectTrack | null {
  if (raw === 'PARTICULAR' || raw === 'BUSINESS') return raw;
  if (typeof raw === 'string') {
    const n = raw.trim().toUpperCase();
    if (n === 'PARTICULAR' || n === 'PRIVATE' || n === 'INDIVIDUAL') {
      return 'PARTICULAR';
    }
    if (n === 'BUSINESS' || n === 'COMPANY' || n === 'BEDRIJF') {
      return 'BUSINESS';
    }
  }
  return null;
}

export function isDualTrackConnectEnabled(): boolean {
  const v = process.env.DUAL_TRACK_CONNECT_ENABLED;
  // Safe default OFF until FASE1 PARTICULAR_NO_KVK_TEST=PASS on Connect platform sk_test.
  if (v == null || v === '') return false;
  return ['1', 'true', 'on', 'yes'].includes(v.trim().toLowerCase());
}

/**
 * Particular: transfers + card_payments requested.
 * card_payments satisfies live platform capability rules; HomeCheff never uses
 * connected-seller direct/destination charges — SCT only.
 */
export const PARTICULAR_CAPABILITIES: Stripe.AccountCreateParams.Capabilities = {
  transfers: { requested: true },
  card_payments: { requested: true },
};

export const BUSINESS_CAPABILITIES: Stripe.AccountCreateParams.Capabilities = {
  transfers: { requested: true },
  // card_payments kept for Express business parity with legacy accounts that
  // may rely on Express Dashboard payment tools. SCT checkout does not require it.
  card_payments: { requested: true },
};

export const PARTICULAR_SERVICE_AGREEMENT = 'full' as const;
export const PARTICULAR_SERVICE_AGREEMENT_WHY =
  'Recipient SA rejected for marketplace seller sale proceeds without counsel sign-off; ' +
  'full SA + dashboard=none individual is Stripe-supported for NL without KvK (2026-05-14).';

export function buildParticularConnectAccountParams(
  email: string,
  country: string = 'NL',
): Stripe.AccountCreateParams {
  return {
    country,
    email,
    business_type: 'individual',
    controller: {
      stripe_dashboard: { type: 'none' },
      fees: { payer: 'application' },
      losses: { payments: 'application' },
      requirement_collection: 'application',
    },
    capabilities: PARTICULAR_CAPABILITIES,
    // Omit tos_acceptance.service_agreement → Stripe defaults to full.
  };
}

export function buildBusinessConnectAccountParams(
  email: string,
  country: string = 'NL',
): Stripe.AccountCreateParams {
  return {
    type: 'express',
    country,
    email,
    capabilities: BUSINESS_CAPABILITIES,
  };
}

export function buildConnectAccountParamsForTrack(
  track: ConnectTrack,
  email: string,
  country: string = 'NL',
): Stripe.AccountCreateParams {
  return track === 'PARTICULAR'
    ? buildParticularConnectAccountParams(email, country)
    : buildBusinessConnectAccountParams(email, country);
}

export type PaymentReadyInput = {
  chargesEnabled?: boolean | null;
  payoutsEnabled?: boolean | null;
  transfersCapability?: string | null;
  disabledReason?: string | null;
  /** When known: PARTICULAR uses transfers-only readiness. */
  connectTrack?: ConnectTrack | null;
  /** Stripe account.type — express | custom | standard */
  accountType?: string | null;
  /** controller.stripe_dashboard.type */
  dashboardType?: string | null;
};

/**
 * HomeCheff SCT: platform charges; seller receives transfers.
 * Legacy Express / BUSINESS: charges_enabled && payouts_enabled.
 * PARTICULAR (dashboard=none): payouts_enabled + transfers active;
 * charges_enabled and card_payments capability may stay false/inactive and must not block.
 */
export function isHomecheffPaymentReady(flags: PaymentReadyInput): boolean {
  if (flags.disabledReason) return false;

  const payouts = Boolean(flags.payoutsEnabled);
  const charges = Boolean(flags.chargesEnabled);
  const transfersIsActive = flags.transfersCapability === 'active';

  const isParticular =
    flags.connectTrack === 'PARTICULAR' ||
    flags.dashboardType === 'none' ||
    (flags.accountType === 'custom' && flags.dashboardType !== 'express');

  if (isParticular) {
    // Intentionally ignore charges_enabled / card_payments status.
    return payouts && transfersIsActive;
  }

  // Legacy / business Express: require both (historical contract).
  if (charges && payouts) return true;

  // Dashboard=none fallback (track unknown but controller is particular-shaped).
  if (
    !charges &&
    payouts &&
    transfersIsActive &&
    flags.dashboardType === 'none'
  ) {
    return true;
  }

  return false;
}

export function classifyStuckExpressCandidate(account: {
  type?: string | null;
  business_type?: string | null;
  charges_enabled?: boolean | null;
  payouts_enabled?: boolean | null;
  controller?: { stripe_dashboard?: { type?: string | null } } | null;
  requirements?: {
    currently_due?: string[] | null;
    past_due?: string[] | null;
    errors?: Array<{ code?: string; requirement?: string }> | null;
  } | null;
}):
  | 'ACTIVE_WORKING_EXPRESS'
  | 'BUSINESS_EXPRESS'
  | 'STUCK_PRIVATE_EXPRESS'
  | 'LEGACY_INDIVIDUAL_EXPRESS_ACTIVE'
  | 'WRONG_NONPROFIT_OR_COMPANY_CHOICE'
  | 'OTHER' {
  const isExpress =
    account.type === 'express' ||
    account.controller?.stripe_dashboard?.type === 'express';
  if (!isExpress) return 'OTHER';

  const ready = Boolean(account.charges_enabled && account.payouts_enabled);
  if (ready && account.business_type === 'individual') {
    return 'LEGACY_INDIVIDUAL_EXPRESS_ACTIVE';
  }
  if (ready) return 'ACTIVE_WORKING_EXPRESS';

  if (
    account.business_type === 'non_profit' ||
    account.business_type === 'company'
  ) {
    return 'WRONG_NONPROFIT_OR_COMPANY_CHOICE';
  }

  if (account.business_type === 'individual' || account.business_type == null) {
    return 'STUCK_PRIVATE_EXPRESS';
  }

  return 'BUSINESS_EXPRESS';
}
