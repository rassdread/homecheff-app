import Stripe from 'stripe';
import type { PrismaClient } from '@prisma/client';
import { COURIER_TRANSFER_FRESH_MS } from '@/lib/delivery/courier-connect-eligibility';
import type { CourierStripeAccount } from '@/lib/delivery/courier-identity';
import { financialStripeSecret } from '@/lib/stripe-runtime-guard';
import {
  assessCourierForNotification,
  selectCourierRecipients,
  SYSTEM_COURIER_USER_ID,
  type AssessedCourier,
  type CourierNotificationQuery,
  type CourierNotificationSource,
  type CourierStripeObservation,
} from '@/lib/admin/courier-notification-segments';

const STRIPE_READ_LIMIT = 24;
const STRIPE_READ_CONCURRENCY = 4;

export type CourierStripeReader = (
  accountId: string,
) => Promise<{ ok: true; account: CourierStripeAccount; transfersStatus: string | null } | { ok: false }>;

type ProfileRow = {
  id: string;
  isActive: boolean;
  isOnline: boolean;
  isVerified: boolean;
  isBlocked: boolean;
  homeLat: number | null;
  homeLng: number | null;
  maxDistance: number | null;
  nationalCoverage: boolean | null;
  availableDays: string[];
  availableTimeSlots: string[];
  workStartTime: string | null;
  workEndTime: string | null;
  pricingEnabled: boolean;
  baseFeeCents: number | null;
  pricePerKmCents: number | null;
  minimumFeeCents: number | null;
  freeDeliveryRadiusKm: number | null;
  providerType: string;
  companyDisplayName: string | null;
  transportation: string[];
  deliveryRegions: string[];
  lastOnlineAt: Date | null;
  updatedAt: Date;
  stripeIdentityState: string | null;
  stripeIdentityCheckedAt: Date | null;
  stripeTransfersStatus: string | null;
  stripeTransfersCheckedAt: Date | null;
  agreementAcceptances: { version: string; contentHash: string; language: string }[];
  user: {
    id: string;
    name: string | null;
    email: string | null;
    accountDeletedAt: Date | null;
    suspendedAt: Date | null;
    dateOfBirth: Date | null;
    marketingAccepted: boolean;
    stripeConnectAccountId: string | null;
    stripeConnectOnboardingCompleted: boolean;
    city: string | null;
    lat: number | null;
    lng: number | null;
    updatedAt: Date;
  };
};

function cacheIsFresh(checkedAt: Date | null, now: Date): boolean {
  if (!checkedAt) return false;
  const age = now.getTime() - checkedAt.getTime();
  return age >= 0 && age <= COURIER_TRANSFER_FRESH_MS;
}

export async function defaultCourierStripeReader(
  accountId: string,
): Promise<{ ok: true; account: CourierStripeAccount; transfersStatus: string | null } | { ok: false }> {
  const secret = financialStripeSecret();
  if (!secret) return { ok: false };
  try {
    const stripe = new Stripe(secret, { apiVersion: '2025-08-27.basil' });
    const account = await stripe.accounts.retrieve(accountId);
    if (account.id !== accountId) return { ok: false };
    return {
      ok: true,
      transfersStatus: account.capabilities?.transfers ?? null,
      account: {
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
      },
    };
  } catch {
    return { ok: false };
  }
}

async function mapLimited<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
  return results;
}

export async function loadCourierNotificationAudience(
  db: PrismaClient,
  query: CourierNotificationQuery,
  options?: { now?: Date; readStripe?: CourierStripeReader },
): Promise<{ eligible: AssessedCourier[]; excluded: { reason: string; count: number }[] }> {
  const now = options?.now ?? new Date();
  const profiles = (await db.deliveryProfile.findMany({
    select: {
      id: true,
      isActive: true,
      isOnline: true,
      isVerified: true,
      isBlocked: true,
      homeLat: true,
      homeLng: true,
      maxDistance: true,
      nationalCoverage: true,
      availableDays: true,
      availableTimeSlots: true,
      workStartTime: true,
      workEndTime: true,
      pricingEnabled: true,
      baseFeeCents: true,
      pricePerKmCents: true,
      minimumFeeCents: true,
      freeDeliveryRadiusKm: true,
      providerType: true,
      companyDisplayName: true,
      transportation: true,
      deliveryRegions: true,
      lastOnlineAt: true,
      updatedAt: true,
      stripeIdentityState: true,
      stripeIdentityCheckedAt: true,
      stripeTransfersStatus: true,
      stripeTransfersCheckedAt: true,
      agreementAcceptances: { select: { version: true, contentHash: true, language: true } },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          accountDeletedAt: true,
          suspendedAt: true,
          dateOfBirth: true,
          marketingAccepted: true,
          stripeConnectAccountId: true,
          stripeConnectOnboardingCompleted: true,
          city: true,
          lat: true,
          lng: true,
          updatedAt: true,
        },
      },
    },
  })) as ProfileRow[];

  const userIds = profiles.map((profile) => profile.user.id);
  const seenRows = userIds.length
    ? await db.conversationParticipant.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds } },
        _max: { lastSeen: true },
      })
    : [];
  const lastSeen = new Map(seenRows.map((row) => [row.userId, row._max.lastSeen]));

  const needsLive = profiles
    .filter((profile) => {
      const accountId = profile.user.stripeConnectAccountId;
      if (!accountId || profile.user.id === SYSTEM_COURIER_USER_ID || profile.user.accountDeletedAt) return false;
      return !(
        cacheIsFresh(profile.stripeIdentityCheckedAt, now) &&
        cacheIsFresh(profile.stripeTransfersCheckedAt, now) &&
        profile.stripeIdentityState
      );
    })
    .sort((a, b) => a.user.id.localeCompare(b.user.id));
  const liveIds = new Set(needsLive.slice(0, STRIPE_READ_LIMIT).map((profile) => profile.user.id));
  const skippedIds = new Set(needsLive.slice(STRIPE_READ_LIMIT).map((profile) => profile.user.id));
  const reader = options?.readStripe ?? defaultCourierStripeReader;
  const liveResults = await mapLimited([...liveIds], STRIPE_READ_CONCURRENCY, async (userId) => {
    const profile = profiles.find((row) => row.user.id === userId);
    const accountId = profile?.user.stripeConnectAccountId;
    if (!accountId) return { userId, result: { ok: false as const } };
    return { userId, result: await reader(accountId) };
  });
  const liveByUser = new Map(liveResults.map((row) => [row.userId, row.result]));

  const assessed = profiles.map((profile) => {
    const activityTimes = [
      profile.updatedAt,
      profile.lastOnlineAt,
      profile.user.updatedAt,
      lastSeen.get(profile.user.id) ?? null,
    ].filter((value): value is Date => value instanceof Date);
    const lastActivity = activityTimes.sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
    const stripe = observationFor(profile, liveByUser.get(profile.user.id), skippedIds.has(profile.user.id), now);
    const source: CourierNotificationSource = {
      userId: profile.user.id,
      name: profile.user.name,
      email: profile.user.email,
      deleted: profile.user.accountDeletedAt != null,
      suspended: profile.user.suspendedAt != null,
      blocked: profile.isBlocked,
      isActive: profile.isActive,
      isVerified: profile.isVerified,
      dateOfBirth: profile.user.dateOfBirth,
      marketingAccepted: profile.user.marketingAccepted,
      onboardingCompleted: profile.user.stripeConnectOnboardingCompleted,
      connectAccountId: profile.user.stripeConnectAccountId,
      city: profile.user.city,
      regions: profile.deliveryRegions,
      nationalCoverage: profile.nationalCoverage === true,
      transportation: profile.transportation,
      lastActivity,
      agreementRows: profile.agreementAcceptances,
      userLat: profile.user.lat,
      userLng: profile.user.lng,
      profile: {
        isActive: profile.isActive,
        isOnline: profile.isOnline,
        homeLat: profile.homeLat,
        homeLng: profile.homeLng,
        maxDistance: profile.maxDistance,
        nationalCoverage: profile.nationalCoverage,
        availableDays: profile.availableDays,
        availableTimeSlots: profile.availableTimeSlots,
        workStartTime: profile.workStartTime,
        workEndTime: profile.workEndTime,
        pricingEnabled: profile.pricingEnabled,
        baseFeeCents: profile.baseFeeCents,
        pricePerKmCents: profile.pricePerKmCents,
        minimumFeeCents: profile.minimumFeeCents,
        freeDeliveryRadiusKm: profile.freeDeliveryRadiusKm,
        providerType: profile.providerType,
        companyDisplayName: profile.companyDisplayName,
        isVerified: profile.isVerified,
      },
      stripe,
    };
    return assessCourierForNotification(source, now);
  });

  return selectCourierRecipients(assessed, query, now);
}

function observationFor(
  profile: ProfileRow,
  live: { ok: true; account: CourierStripeAccount; transfersStatus: string | null } | { ok: false } | undefined,
  skipped: boolean,
  now: Date,
): CourierStripeObservation {
  if (!profile.user.stripeConnectAccountId) return { source: 'none' };
  if (
    cacheIsFresh(profile.stripeIdentityCheckedAt, now) &&
    cacheIsFresh(profile.stripeTransfersCheckedAt, now) &&
    profile.stripeIdentityState
  ) {
    return {
      source: 'cache',
      identityState: profile.stripeIdentityState,
      transfersStatus: profile.stripeTransfersStatus,
    };
  }
  if (skipped) return { source: 'unavailable' };
  if (!live) return { source: 'unavailable' };
  if (!live.ok) return { source: 'live', failed: true, account: null, transfersStatus: null };
  return { source: 'live', failed: false, account: live.account, transfersStatus: live.transfersStatus };
}
