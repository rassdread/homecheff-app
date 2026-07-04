import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { STRIPE_SESSION_ID_PREFIX } from '@/lib/stripe';
import { refreshSellerStripeSnapshotIfStale } from '@/lib/stripe/sync-seller-payment-status';
import { buildSellerActionItems } from '@/lib/seller/seller-action-center';
import { isSellerDashboardOrderBadgeNotification } from '@/lib/notifications/notificationRouting';

export const dynamic = 'force-dynamic';

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
        emailVerified: true,
        username: true,
        termsAccepted: true,
        passwordHash: true,
        stripeConnectAccountId: true,
        stripeConnectOnboardingCompleted: true,
        Account: { select: { provider: true } },
        SellerProfile: { select: { id: true } },
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

    let blockedProductsCount = 0;
    let pendingOrdersCount = 0;

    if (sellerProfileId) {
      blockedProductsCount = await prisma.product.count({
        where: {
          sellerId: sellerProfileId,
          isActive: false,
          orderMethod: 'HOMECHEFF_PAYMENT',
          priceCents: { gt: 0 },
        },
      });

      pendingOrdersCount = await prisma.order.count({
        where: {
          status: 'PENDING',
          stripeSessionId: { startsWith: STRIPE_SESSION_ID_PREFIX },
          NOT: { orderNumber: { startsWith: 'SUB-' } },
          items: {
            some: {
              Product: { sellerId: sellerProfileId },
            },
          },
        },
      });
    }

    const [unreadMessagesCount, unreadOrderNotifs] = await Promise.all([
      prisma.message.count({
        where: {
          Conversation: {
            ConversationParticipant: { some: { userId: user.id } },
          },
          readAt: null,
          NOT: { senderId: user.id },
        },
      }),
      prisma.notification.findMany({
        where: {
          userId: user.id,
          readAt: null,
          type: { in: ['ORDER_RECEIVED', 'ORDER_UPDATE'] },
        },
        select: { type: true, payload: true },
      }),
    ]);

    const sellerUnreadOrdersCount = unreadOrderNotifs.filter((row) =>
      isSellerDashboardOrderBadgeNotification(
        String(row.type),
        (row.payload as Record<string, unknown>) || {},
      ),
    ).length;

    const items = buildSellerActionItems({
      user,
      stripeSnapshot,
      blockedProductsCount,
      pendingOrdersCount,
      unreadMessagesCount,
      sellerUnreadOrdersCount,
      includeOrange: true,
    });

    return NextResponse.json({
      items,
      totalCount: items.length,
      healthy: items.length === 0,
      hasSellerProfile: Boolean(sellerProfileId),
    });
  } catch (error) {
    console.error('[seller/action-center]', error);
    return NextResponse.json(
      { error: 'Failed to load action center' },
      { status: 500 },
    );
  }
}
