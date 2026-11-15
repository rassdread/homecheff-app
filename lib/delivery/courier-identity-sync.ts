import Stripe from 'stripe';
import type { Prisma, PrismaClient } from '@prisma/client';
import { COURIER_TRANSFER_FRESH_MS } from '@/lib/delivery/courier-connect-eligibility';
import { financialStripeSecret } from '@/lib/stripe-runtime-guard';
import {
  classifyCourierStripeIdentity,
  type CourierStripeAccount,
} from '@/lib/delivery/courier-identity';
import { paidIdentityAllowsDelivery, paidIdentityDenial } from '@/lib/delivery/courier-paid-identity';

type Db = PrismaClient | Prisma.TransactionClient;

export async function retrieveCourierStripeAccount(accountId: string): Promise<CourierStripeAccount | null> {
  const secret = financialStripeSecret();
  if (!secret) return null;
  try {
    const stripe = new Stripe(secret, { apiVersion: '2025-08-27.basil' });
    const account = await stripe.accounts.retrieve(accountId);
    if (account.id !== accountId) return null;
    return {
      id: account.id,
      business_type: account.business_type,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      requirements: {
        disabled_reason: account.requirements?.disabled_reason ?? null,
        currently_due: account.requirements?.currently_due ?? [],
      },
      future_requirements: {
        disabled_reason: account.future_requirements?.disabled_reason ?? null,
      },
      individual: account.individual
        ? {
            verification: {
              status: account.individual.verification?.status ?? null,
              details_code: account.individual.verification?.details_code ?? null,
            },
          }
        : null,
    };
  } catch {
    return null;
  }
}

export async function enforcePaidDeliveryIdentity(
  db: Db,
  profileId: string,
  options?: {
    now?: Date;
    retrieve?: (accountId: string) => Promise<CourierStripeAccount | null>;
  },
) {
  const now = options?.now ?? new Date();
  const profile = await db.deliveryProfile.findUnique({
    where: { id: profileId },
    select: {
      id: true,
      isBlocked: true,
      stripeIdentityState: true,
      stripeIdentityCheckedAt: true,
      user: { select: { stripeConnectAccountId: true } },
    },
  });
  if (!profile) {
    return paidIdentityDenial({ state: 'UNKNOWN', checkedAt: null, now });
  }
  if (profile.isBlocked) {
    return paidIdentityDenial({
      state: profile.stripeIdentityState,
      checkedAt: profile.stripeIdentityCheckedAt,
      now,
      suspended: true,
    });
  }

  const accountId = profile.user.stripeConnectAccountId;
  const retrieve = options?.retrieve ?? retrieveCourierStripeAccount;
  if (!accountId) return paidIdentityDenial({ state: 'NOT_STARTED', checkedAt: null, now, suspended: profile.isBlocked });
  const account = await retrieve(accountId);
  if (!account || account.id !== accountId) {
    return paidIdentityDenial({ state: 'UNKNOWN', checkedAt: null, now, suspended: profile.isBlocked });
  }
  const identity = classifyCourierStripeIdentity(account);
  await db.deliveryProfile.update({
    where: { id: profile.id },
    data: {
      stripeIdentityState: identity.state,
      stripeIdentityReason: identity.reason,
      stripeIdentityCheckedAt: now,
    },
  });
  return paidIdentityDenial({
    state: identity.state,
    checkedAt: identity.paidDeliveryAllowed ? now : null,
    now,
    suspended: profile.isBlocked,
  });
}

const MATCH_IDENTITY_REFRESH_LIMIT = 8;

/**
 * Customer search uses a fresh verified cache. Older or missing identity is
 * read from Stripe for that courier before the list is built. A cache older
 * than 15 minutes does not hide someone Stripe still verifies.
 * Stripe is not called again while the cache is still fresh.
 */
export async function ensureCourierIdentityFreshForListing(
  db: Db,
  profileId: string,
  options?: {
    now?: Date;
    retrieve?: (accountId: string) => Promise<CourierStripeAccount | null>;
  },
) {
  const now = options?.now ?? new Date();
  const profile = await db.deliveryProfile.findUnique({
    where: { id: profileId },
    select: {
      isBlocked: true,
      stripeIdentityState: true,
      stripeIdentityCheckedAt: true,
      user: { select: { stripeConnectAccountId: true } },
    },
  });
  if (!profile?.user?.stripeConnectAccountId || profile.isBlocked) {
    return paidIdentityDenial({
      state: profile?.stripeIdentityState,
      checkedAt: profile?.stripeIdentityCheckedAt,
      now,
      suspended: profile?.isBlocked,
    });
  }
  if (
    paidIdentityAllowsDelivery({
      state: profile.stripeIdentityState,
      checkedAt: profile.stripeIdentityCheckedAt,
      now,
      suspended: false,
    })
  ) {
    return { ok: true as const };
  }
  return enforcePaidDeliveryIdentity(db, profileId, options);
}

/**
 * Optional batch refresh. PostgreSQL orders null timestamps last, and the
 * default cap is 8, so this pass can miss a suitable courier. Customer search
 * uses ensureCourierIdentityFreshForListing on the couriers it actually
 * considers. A courier is verified only when Stripe says so.
 */
export async function refreshStaleCourierIdentityForMatching(
  db: Db,
  input: {
    now?: Date;
    country?: string | null;
    includeProfile?: (profile: { id: string; userId: string }) => boolean;
    retrieve?: (accountId: string) => Promise<CourierStripeAccount | null>;
    limit?: number;
  } = {},
) {
  const now = input.now ?? new Date();
  const freshAfter = new Date(now.getTime() - COURIER_TRANSFER_FRESH_MS);
  const rows = await db.deliveryProfile.findMany({
    where: {
      isActive: true,
      isVerified: true,
      isBlocked: false,
      OR: [
        { stripeIdentityCheckedAt: null },
        { stripeIdentityCheckedAt: { lt: freshAfter } },
      ],
      user: {
        stripeConnectAccountId: { not: null },
        ...(input.country ? { country: input.country } : {}),
      },
    },
    select: { id: true, userId: true },
    orderBy: { stripeIdentityCheckedAt: 'asc' },
    take: input.limit ?? MATCH_IDENTITY_REFRESH_LIMIT,
  });
  let refreshed = 0;
  for (const row of rows) {
    if (input.includeProfile && !input.includeProfile(row)) continue;
    await enforcePaidDeliveryIdentity(db, row.id, { now, retrieve: input.retrieve });
    refreshed += 1;
  }
  return { considered: rows.length, refreshed };
}
