import { NextResponse } from 'next/server';
import { CommissionLedgerStatus } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { STRIPE_SESSION_ID_PREFIX } from '@/lib/stripe';
import { refreshSellerStripeSnapshotIfStale } from '@/lib/stripe/sync-seller-payment-status';
import { buildUserActionItems } from '@/lib/user/user-action-center';
import type { PendingClientReward } from '@/lib/gamification/gamification-me-types';
import {
  isSellerDashboardOrderBadgeNotification,
  notificationVisibleToSellerAndBuyer,
  resolveNotificationTargetUrl,
} from '@/lib/notifications/notificationRouting';

export const dynamic = 'force-dynamic';

function normalizePendingRewards(raw: unknown): PendingClientReward[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (x) =>
        x &&
        typeof x === 'object' &&
        typeof (x as PendingClientReward).title === 'string',
    )
    .map((x) => x as PendingClientReward)
    .slice(0, 3);
}

function isBuyerFacingOrderNotification(
  prismaType: string,
  payload: Record<string, unknown>,
): boolean {
  const typeUpper = prismaType.toUpperCase();
  if (typeUpper !== 'ORDER_RECEIVED' && typeUpper !== 'ORDER_UPDATE') {
    return false;
  }
  if (isSellerDashboardOrderBadgeNotification(prismaType, payload)) {
    return false;
  }
  const link = resolveNotificationTargetUrl(typeUpper, payload) || '';
  return link.startsWith('/orders') && !link.includes('/verkoper/');
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        image: true,
        place: true,
        lat: true,
        lng: true,
        emailVerified: true,
        username: true,
        termsAccepted: true,
        passwordHash: true,
        stripeConnectAccountId: true,
        stripeConnectOnboardingCompleted: true,
        hcpWelcomeSeenAt: true,
        Account: { select: { provider: true } },
        SellerProfile: { select: { id: true } },
        DeliveryProfile: { select: { id: true, isVerified: true } },
        affiliate: {
          select: {
            id: true,
            status: true,
            commissionLedgers: {
              select: { status: true, amountCents: true },
            },
            childAffiliates: {
              select: { createdAt: true },
            },
          },
        },
        hcpStats: { select: { pendingClientRewards: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let stripeSnapshot = {
      stripeConnectAccountId: user.stripeConnectAccountId,
      stripeConnectOnboardingCompleted: user.stripeConnectOnboardingCompleted,
    };

    if (user.stripeConnectAccountId) {
      stripeSnapshot = await refreshSellerStripeSnapshotIfStale(user.id, stripeSnapshot);
    }

    const sellerProfileId = user.SellerProfile?.id;
    const hasSellerProfile = Boolean(sellerProfileId);
    const hasDeliveryProfile = Boolean(user.DeliveryProfile);
    const hasAffiliate = Boolean(user.affiliate);

    const [
      unreadMessagesCount,
      blockedProductsCount,
      pendingSellerOrdersCount,
      activeDeliveryCount,
      unreadNotificationRows,
    ] = await Promise.all([
      prisma.message.count({
        where: {
          Conversation: {
            ConversationParticipant: { some: { userId: user.id } },
          },
          readAt: null,
          NOT: { senderId: user.id },
        },
      }),
      sellerProfileId
        ? prisma.product.count({
            where: {
              sellerId: sellerProfileId,
              isActive: false,
              orderMethod: 'HOMECHEFF_PAYMENT',
              priceCents: { gt: 0 },
            },
          })
        : Promise.resolve(0),
      sellerProfileId
        ? prisma.order.count({
            where: {
              status: 'PENDING',
              stripeSessionId: { startsWith: STRIPE_SESSION_ID_PREFIX },
              NOT: { orderNumber: { startsWith: 'SUB-' } },
              items: { some: { Product: { sellerId: sellerProfileId } } },
            },
          })
        : Promise.resolve(0),
      user.DeliveryProfile
        ? prisma.deliveryOrder.count({
            where: {
              deliveryProfileId: user.DeliveryProfile.id,
              status: { in: ['ACCEPTED', 'PICKED_UP'] },
            },
          })
        : Promise.resolve(0),
      prisma.notification.findMany({
        where: { userId: user.id, readAt: null },
        orderBy: { createdAt: 'desc' },
        take: 40,
        select: { id: true, type: true, payload: true, orderId: true },
      }),
    ]);

    const unreadNotifications = unreadNotificationRows.map((row) => ({
      id: row.id,
      prismaType: String(row.type),
      payload: (row.payload as Record<string, unknown>) || {},
      orderId: row.orderId,
    }));

    const sellerUnreadOrderCount = unreadNotifications.filter((row) =>
      isSellerDashboardOrderBadgeNotification(row.prismaType, row.payload),
    ).length;

    const buyerOrderUpdatesCount = unreadNotifications.filter((row) =>
      isBuyerFacingOrderNotification(row.prismaType, row.payload),
    ).length;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const affiliateAvailableCents =
      user.affiliate?.commissionLedgers
        .filter((c) => c.status === CommissionLedgerStatus.AVAILABLE)
        .reduce((sum, c) => sum + c.amountCents, 0) ?? 0;
    const recentSubAffiliateCount =
      user.affiliate?.childAffiliates.filter(
        (c) => c.createdAt >= sevenDaysAgo,
      ).length ?? 0;

    const items = buildUserActionItems({
      user,
      roles: {
        hasSellerProfile,
        hasDeliveryProfile,
        hasAffiliate,
      },
      stripeSnapshot,
      blockedProductsCount,
      pendingSellerOrdersCount,
      unreadMessagesCount,
      buyerOrderUpdatesCount,
      sellerOrderNotificationsCount: sellerUnreadOrderCount,
      unreadNotifications,
      deliveryProfile: user.DeliveryProfile,
      activeDeliveryCount,
      affiliate: user.affiliate
        ? {
            status: user.affiliate.status,
            availableCents: affiliateAvailableCents,
            recentSubAffiliateCount,
          }
        : null,
      pendingHcpRewards: normalizePendingRewards(
        user.hcpStats?.pendingClientRewards,
      ),
    });

    return NextResponse.json({
      items,
      totalCount: items.length,
      healthy: items.length === 0,
      roles: {
        hasSellerProfile,
        hasDeliveryProfile,
        hasAffiliate,
      },
    });
  } catch (error) {
    console.error('[user/action-center]', error);
    return NextResponse.json(
      { error: 'Failed to load action center' },
      { status: 500 },
    );
  }
}
