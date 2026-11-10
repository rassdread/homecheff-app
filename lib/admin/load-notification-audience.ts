import type { Prisma, PrismaClient, UserRole } from '@prisma/client';
import { getDeliveryProfileCompletionFromRow } from '@/lib/delivery/delivery-profile-completion';
import type { CanonicalDeliveryProfileRow } from '@/lib/delivery/delivery-profile-canonical';
import { isValidFcmTokenShape } from '@/lib/pushTokenValidation';
import {
  auditMetaHasConnectAccount,
  type AudienceCandidate,
  type AudienceId,
  type AudienceSelection,
} from '@/lib/admin/notification-audience';

const staff: UserRole[] = ['ADMIN', 'SUPERADMIN'];

export function audienceWhere(audience: AudienceId, selection?: AudienceSelection): Prisma.UserWhereInput {
  const eligible: Prisma.UserWhereInput = {
    role: { notIn: staff },
    accountDeletedAt: null,
  };
  const sellers: Prisma.UserWhereInput = {
    OR: [{ role: 'SELLER' }, { sellerRoles: { isEmpty: false } }, { SellerProfile: { isNot: null } }],
  };
  const delivery: Prisma.UserWhereInput = {
    OR: [{ role: 'DELIVERY' }, { DeliveryProfile: { isNot: null } }],
  };
  const buyers: Prisma.UserWhereInput = {
    OR: [{ role: 'BUYER' }, { buyerRoles: { isEmpty: false } }],
  };
  const nobody: Prisma.UserWhereInput = { id: { in: [] } };
  if (audience === 'all') return eligible;
  if (audience === 'buyers') return { AND: [eligible, buyers] };
  if (audience === 'sellers') return { AND: [eligible, sellers] };
  if (audience === 'delivery') return { AND: [eligible, delivery] };
  const or: Prisma.UserWhereInput[] = [];
  if (selection?.stripe) or.push({ OR: [sellers, delivery] });
  if (
    selection?.agreementVersion
    || selection?.pendingStep
    || selection?.accountStatus === 'courier_blocked'
    || selection?.verification?.kind === 'courier'
  ) {
    or.push(delivery);
  }
  if (selection?.verification?.kind === 'commerce_review') or.push(sellers);
  if (
    selection?.verification?.kind === 'email'
    || selection?.accountStatus === 'active'
    || selection?.accountStatus === 'blocked'
  ) {
    return eligible;
  }
  if (or.length === 0) return { AND: [eligible, nobody] };
  return { AND: [eligible, { OR: or }] };
}

const userSelect = {
  id: true,
  email: true,
  name: true,
  username: true,
  role: true,
  createdAt: true,
  accountDeletedAt: true,
  suspendedAt: true,
  emailVerified: true,
  buyerRoles: true,
  sellerRoles: true,
  stripeConnectAccountId: true,
  stripeConnectOnboardingCompleted: true,
  lat: true,
  lng: true,
  place: true,
  address: true,
  dateOfBirth: true,
  SellerProfile: { select: { id: true, commerceReviewState: true } },
  DeliveryProfile: {
    select: {
      isActive: true,
      isOnline: true,
      isVerified: true,
      isBlocked: true,
      homeLat: true,
      homeLng: true,
      homeAddress: true,
      maxDistance: true,
      preferredRadius: true,
      nationalCoverage: true,
      deliveryMode: true,
      availableDays: true,
      availableTimeSlots: true,
      workStartTime: true,
      workEndTime: true,
      pricingEnabled: true,
      baseFeeCents: true,
      pricePerKmCents: true,
      minimumFeeCents: true,
      freeDeliveryRadiusKm: true,
      currency: true,
      providerType: true,
      companyDisplayName: true,
      deliveryAgreementAcceptedAt: true,
      deliveryAgreementDocumentId: true,
    },
  },
  pushTokens: {
    where: { isActive: true, type: 'FCM' },
    select: { token: true },
    take: 5,
  },
} satisfies Prisma.UserSelect;

type UserRow = Prisma.UserGetPayload<{ select: typeof userSelect }>;

export function activationMissingForRow(row: UserRow): string[] | null {
  const profile = row.DeliveryProfile;
  if (!profile) return null;
  try {
    const canonical: CanonicalDeliveryProfileRow = {
      isActive: profile.isActive,
      isOnline: profile.isOnline,
      homeLat: profile.homeLat,
      homeLng: profile.homeLng,
      homeAddress: profile.homeAddress,
      maxDistance: profile.maxDistance,
      preferredRadius: profile.preferredRadius,
      nationalCoverage: profile.nationalCoverage,
      deliveryMode: profile.deliveryMode,
      availableDays: profile.availableDays,
      availableTimeSlots: profile.availableTimeSlots,
      workStartTime: profile.workStartTime,
      workEndTime: profile.workEndTime,
      pricingEnabled: profile.pricingEnabled,
      baseFeeCents: profile.baseFeeCents,
      pricePerKmCents: profile.pricePerKmCents,
      minimumFeeCents: profile.minimumFeeCents,
      freeDeliveryRadiusKm: profile.freeDeliveryRadiusKm,
      currency: profile.currency,
      providerType: profile.providerType,
      companyDisplayName: profile.companyDisplayName,
      isVerified: profile.isVerified,
    };
    const result = getDeliveryProfileCompletionFromRow(canonical, {
      lat: row.lat,
      lng: row.lng,
      place: row.place,
      address: row.address,
      dateOfBirth: row.dateOfBirth,
    });
    return result.ok ? [] : [...result.missing];
  } catch {
    return null;
  }
}

export function toAudienceCandidate(row: UserRow): AudienceCandidate {
  const profile = row.DeliveryProfile;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    username: row.username,
    role: row.role,
    createdAt: row.createdAt,
    accountDeletedAt: row.accountDeletedAt,
    suspendedAt: row.suspendedAt,
    emailVerified: row.emailVerified,
    buyerRoles: row.buyerRoles ?? [],
    sellerRoles: row.sellerRoles ?? [],
    stripeConnectAccountId: row.stripeConnectAccountId,
    stripeConnectOnboardingCompleted: Boolean(row.stripeConnectOnboardingCompleted),
    hasSellerProfile: Boolean(row.SellerProfile),
    commerceReviewState: row.SellerProfile?.commerceReviewState ?? null,
    delivery: profile
      ? {
          isVerified: profile.isVerified,
          isBlocked: profile.isBlocked,
          isActive: profile.isActive,
          agreementAcceptedAt: profile.deliveryAgreementAcceptedAt,
          agreementDocumentId: profile.deliveryAgreementDocumentId,
          activationMissing: activationMissingForRow(row),
        }
      : null,
    pushReachable: (row.pushTokens ?? []).some((token) => isValidFcmTokenShape(token.token)),
  };
}

const STRIPE_LINK_REVIEW_ACTIONS = [
  'STRIPE_CONNECT_PARTICULAR_MIGRATE',
  'STRIPE_CONNECT_TRACK_CHOICE',
];

export async function loadStripeLinkReviewIds(db: PrismaClient, userIds: string[]): Promise<Set<string>> {
  const ids = [...new Set(userIds.filter((id) => id.trim().length > 0))];
  if (ids.length === 0) return new Set();
  const [affiliates, payouts, audits] = await Promise.all([
    db.affiliate.findMany({
      where: { userId: { in: ids }, NOT: { stripeConnectAccountId: null } },
      select: { userId: true, stripeConnectAccountId: true },
    }),
    db.marketplaceHcSellerPayoutAttempt.findMany({
      where: {
        NOT: { destinationAccountId: null },
        exposure: { sellerUserId: { in: ids } },
      },
      select: { destinationAccountId: true, exposure: { select: { sellerUserId: true } } },
    }),
    db.auditLog.findMany({
      where: { userId: { in: ids }, action: { in: STRIPE_LINK_REVIEW_ACTIONS } },
      select: { userId: true, meta: true },
    }),
  ]);
  const review = new Set<string>();
  for (const row of affiliates) {
    if ((row.stripeConnectAccountId || '').trim()) review.add(row.userId);
  }
  for (const row of payouts) {
    if ((row.destinationAccountId || '').trim()) review.add(row.exposure.sellerUserId);
  }
  for (const row of audits) {
    if (row.userId && auditMetaHasConnectAccount(row.meta)) review.add(row.userId);
  }
  return review;
}

export async function loadAudienceCandidates(
  db: PrismaClient,
  audience: AudienceId | AudienceSelection,
  extraWhere?: Prisma.UserWhereInput,
): Promise<AudienceCandidate[]> {
  const selection = typeof audience === 'string' ? undefined : audience;
  const audienceId = typeof audience === 'string' ? audience : audience.audience;
  const scoped = audienceWhere(audienceId, selection);
  const rows = await db.user.findMany({
    where: extraWhere ? { AND: [scoped, extraWhere] } : scoped,
    select: userSelect,
  });
  const emptyIds = rows
    .filter((row) => !(row.stripeConnectAccountId || '').trim())
    .map((row) => row.id);
  const reviewIds = await loadStripeLinkReviewIds(db, emptyIds);
  return rows.map((row) => ({
    ...toAudienceCandidate(row),
    stripeLinkReview: !(row.stripeConnectAccountId || '').trim() && reviewIds.has(row.id),
  }));
}
