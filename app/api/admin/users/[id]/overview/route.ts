import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { capabilityLabels, SUBSCRIPTION_STATUSES_COUNTED_AS_CURRENT } from '@/lib/admin/user-capabilities';

export const dynamic = 'force-dynamic';

/** Administrative relationship overview. No identity documents, bank details, or Stripe secrets. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const adminUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });
  if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'SUPERADMIN')) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  if (adminUser.role !== 'SUPERADMIN') {
    const permissions = await prisma.adminPermissions.findUnique({
      where: { userId: adminUser.id },
      select: { canViewUserDetails: true },
    });
    if (permissions && permissions.canViewUserDetails === false) {
      return NextResponse.json({ error: 'Missing permission: canViewUserDetails' }, { status: 403 });
    }
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
    buyer: { orderCount: user._count.orders },
    seller: user.SellerProfile
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
    delivery: user.DeliveryProfile
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
    affiliate: user.affiliate
      ? {
          status: user.affiliate.status,
          populationClass: user.affiliate.populationClass,
          commercialParticipant: user.affiliate.populationClass === 'COMMERCIAL',
        }
      : null,
    connect: {
      ready: connectReady,
      onboardingCompleted: user.stripeConnectOnboardingCompleted,
      hasAccount: Boolean(user.stripeConnectAccountId),
    },
    subscription: subscription
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
