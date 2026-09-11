/**
 * Stripe Connect account shape validation for dual-track HomeCheff.
 * PARTICULAR must be individual + dashboard=none.
 * BUSINESS must be Express-shaped.
 */

import type Stripe from 'stripe';
import type { ConnectTrack } from '@/lib/stripe/connect-tracks';

export type ConnectAccountShapeCheck = {
  ok: boolean;
  track: ConnectTrack;
  businessType: string | null;
  dashboardType: string | null;
  accountType: string | null;
  mismatchCode:
    | null
    | 'PARTICULAR_ACCOUNT_CONFIGURATION_MISMATCH'
    | 'BUSINESS_ACCOUNT_CONFIGURATION_MISMATCH'
    | 'CONNECT_CONFIGURATION_MISMATCH';
  reason: string | null;
};

export function getStripeDashboardType(
  account: Stripe.Account | null | undefined,
): string | null {
  return (
    (
      account as {
        controller?: { stripe_dashboard?: { type?: string | null } };
      } | null
    )?.controller?.stripe_dashboard?.type ?? null
  );
}

/** PARTICULAR SoT: NL individual + dashboard none. */
export function isParticularAccountShape(
  account: Stripe.Account | null | undefined,
): boolean {
  if (!account?.id) return false;
  const dash = getStripeDashboardType(account);
  return account.business_type === 'individual' && dash === 'none';
}

/** BUSINESS SoT: Express (type or dashboard). */
export function isBusinessAccountShape(
  account: Stripe.Account | null | undefined,
): boolean {
  if (!account?.id) return false;
  const dash = getStripeDashboardType(account);
  return account.type === 'express' || dash === 'express';
}

export function validateConnectAccountShape(
  account: Stripe.Account | null | undefined,
  track: ConnectTrack,
): ConnectAccountShapeCheck {
  const businessType = account?.business_type ?? null;
  const dashboardType = getStripeDashboardType(account);
  const accountType = account?.type ?? null;

  if (track === 'PARTICULAR') {
    if (isParticularAccountShape(account)) {
      return {
        ok: true,
        track,
        businessType,
        dashboardType,
        accountType,
        mismatchCode: null,
        reason: null,
      };
    }
    return {
      ok: false,
      track,
      businessType,
      dashboardType,
      accountType,
      mismatchCode: 'PARTICULAR_ACCOUNT_CONFIGURATION_MISMATCH',
      reason:
        businessType === 'non_profit' || businessType === 'company'
          ? `PARTICULAR requires business_type=individual, got ${businessType}`
          : `PARTICULAR requires individual + dashboard=none (got business_type=${businessType}, dashboard=${dashboardType})`,
    };
  }

  if (isBusinessAccountShape(account)) {
    return {
      ok: true,
      track,
      businessType,
      dashboardType,
      accountType,
      mismatchCode: null,
      reason: null,
    };
  }

  return {
    ok: false,
    track,
    businessType,
    dashboardType,
    accountType,
    mismatchCode: 'BUSINESS_ACCOUNT_CONFIGURATION_MISMATCH',
    reason: `BUSINESS requires Express-shaped account (got type=${accountType}, dashboard=${dashboardType})`,
  };
}
