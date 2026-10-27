import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { accessDecision } from '@/lib/admin/admin-capabilities';
import { capabilityLabels, SUBSCRIPTION_STATUSES_COUNTED_AS_CURRENT } from '@/lib/admin/user-capabilities';
import { requirePlatformAdmin } from '@/lib/admin-guard';

export const dynamic = 'force-dynamic';

/** Administrative relationship overview. No identity documents, bank details, or Stripe secrets. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requirePlatformAdmin();
  if (!guard.ok) return guard.response;
  const allowed = (capability: Parameters<typeof accessDecision>[0]['capability']) =>
    accessDecision({
      role: guard.admin.user.role,
      adminRoles: guard.admin.user.adminRoles,
      permissions: guard.admin.permissions,
      capability,
    }).allow;
  if (!allowed('GLOBAL.USERS.VIEW') && !allowed('MARKETPLACE.USERS.VIEW')) {
    return NextResponse.json({ error: 'Missing capability' }, { status: 403 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      role: true,
      emailVerified: true,
      suspendedAt: true,
      suspendReason: true,
      accountDeletedAt: true,
      createdAt: true,
      stripeConnectOnboardingCompleted: true,
      stripeConnectAccountId: true,
      SellerProfile: {
        select: {
          id: true,
          companyName: true,
          commerceDeclaration: true,
          kvk: true,
          subscriptionId: true,
          subscriptionValidUntil: true,
          products: { select: { id: true, isActive: true, integrityStatus: true, acceptHomeCheffPayment: true, acceptDirectContact: true } },
        },
      },
      DeliveryProfile: {
        select: {
          id: true,
          isVerified: true,
          isActive: true,
          isBlocked: true,
          isOnline: true,
          transportation: true,
          maxDistance: true,
          age: true,
          deliveryAgreementAcceptedAt: true,
        },
      },
      affiliate: {
        select: { id: true, status: true, populationClass: true },
      },
      _count: { select: { orders: true } },
    },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const subscription = await prisma.businessSubscription.findUnique({
    where: { businessUserId: user.id },
    select: { status: true, planId: true, priceCents: true, currency: true, startsAt: true, endsAt: true },
  });
  const businessSeller = Boolean(
    user.SellerProfile &&
      (user.SellerProfile.commerceDeclaration === 'SELF_DECLARED_PROFESSIONAL' ||
        (user.SellerProfile.kvk && user.SellerProfile.kvk.trim())),
  );
  const connectReady = Boolean(user.stripeConnectAccountId && user.stripeConnectOnboardingCompleted);
  const listings = user.SellerProfile?.products ?? [];
  const canMarketplace = allowed('MARKETPLACE.SELLERS.VIEW') || allowed('MARKETPLACE.ORDERS.VIEW');
  const canDelivery = allowed('MARKETPLACE.DELIVERY.VIEW');
  const canGrowth = allowed('GROWTH.AFFILIATES.VIEW') || allowed('GROWTH.BILLING.VIEW');
  const canPayments = allowed('MARKETPLACE.PAYMENTS.VIEW');
  const canStudio = allowed('STUDIO.PROJECTS.VIEW') || allowed('STUDIO.JOBS.VIEW');
  const studio = canStudio
    ? {
        projectCount: user.SellerProfile
          ? await prisma.workspaceContent.count({ where: { sellerProfileId: user.SellerProfile.id } })
          : 0,
        generationJobCount: await prisma.marketplaceVideoJob.count({ where: { ownerUserId: user.id } }),
        mediaIncluded: false,
      }
    : { restricted: true as const };

  return NextResponse.json({
    account: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      emailVerified: Boolean(user.emailVerified),
      suspendedAt: user.suspendedAt,
      suspendReason: user.suspendReason,
      accountDeletedAt: user.accountDeletedAt,
      createdAt: user.createdAt,
    },
    capabilities: capabilityLabels({
      orderCount: user._count.orders,
      hasSellerProfile: Boolean(user.SellerProfile),
      businessSeller,
      hasDeliveryProfile: Boolean(user.DeliveryProfile),
      commercialAffiliate: user.affiliate?.populationClass === 'COMMERCIAL',
      role: user.role,
      connectReady,
    }),
    buyer: canMarketplace ? { orderCount: user._count.orders } : { restricted: true },
    seller: !canMarketplace ? { restricted: true } : user.SellerProfile
      ? {
          commerceDeclaration: user.SellerProfile.commerceDeclaration,
          businessSeller,
          companyName: user.SellerProfile.companyName,
          kvkPresent: Boolean(user.SellerProfile.kvk && user.SellerProfile.kvk.trim()),
          listingCount: listings.length,
          activeListingCount: listings.filter((listing) => listing.isActive).length,
          onlinePaymentListings: listings.filter((listing) => listing.acceptHomeCheffPayment).length,
          contactOnlyListings: listings.filter((listing) => listing.acceptDirectContact && !listing.acceptHomeCheffPayment).length,
          integrityBlocked: listings.filter((listing) => listing.integrityStatus !== 'ACTIVE').length,
        }
      : null,
    delivery: !canDelivery ? { restricted: true } : user.DeliveryProfile
      ? {
          profileId: user.DeliveryProfile.id,
          verified: user.DeliveryProfile.isVerified,
          active: user.DeliveryProfile.isActive,
          blocked: user.DeliveryProfile.isBlocked,
          online: user.DeliveryProfile.isOnline,
          transportation: user.DeliveryProfile.transportation,
          radiusKm: user.DeliveryProfile.maxDistance,
          ageRecorded: user.DeliveryProfile.age != null,
          agreementAccepted: user.DeliveryProfile.deliveryAgreementAcceptedAt != null,
          connectIsNotApproval: true,
        }
      : null,
    growth: !canGrowth ? { restricted: true } : user.affiliate
      ? {
          status: user.affiliate.status,
          populationClass: user.affiliate.populationClass,
          commercialParticipant: user.affiliate.populationClass === 'COMMERCIAL',
        }
      : null,
    connect: canPayments
      ? {
          ready: connectReady,
          onboardingCompleted: user.stripeConnectOnboardingCompleted,
          hasAccount: Boolean(user.stripeConnectAccountId),
        }
      : { restricted: true },
    studio,
    subscription: canPayments && subscription
      ? {
          status: subscription.status,
          planId: subscription.planId,
          priceCents: subscription.priceCents,
          currency: subscription.currency,
          current: SUBSCRIPTION_STATUSES_COUNTED_AS_CURRENT.includes(subscription.status),
          startsAt: subscription.startsAt,
          endsAt: subscription.endsAt,
        }
      : null,
  });
}
