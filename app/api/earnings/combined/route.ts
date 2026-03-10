/**
 * Combined Earnings API
 * 
 * GET /api/earnings/combined
 * Returns earnings from all user roles (seller, delivery, affiliate)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CommissionLedgerStatus } from "@prisma/client";
import { matchesCurrentMode } from "@/lib/stripe";
import { getSellerRequestablePayout } from "@/lib/sellerPayouts";
import { DELIVERY_DELIVERER_PERCENT } from "@/lib/fees";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        SellerProfile: {
          include: {
            Subscription: true
          }
        },
        DeliveryProfile: true,
        affiliate: {
          include: {
            commissionLedgers: true,
            referralLinks: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const earnings: {
      seller?: {
        totalEarnings: number;
        pendingPayout: number;
        availablePayout: number;
        paidPayout: number;
        platformFee: number;
        netEarnings: number;
        totalOrders: number;
      };
      delivery?: {
        totalEarnings: number;
        paidPayout: number;
        totalDeliveries: number;
        completedDeliveries: number;
      };
      affiliate?: {
        totalEarnings: number;
        pendingCents: number;
        availableCents: number;
        paidCents: number;
        totalReferrals: number;
      };
    } = {};

    // Calculate seller earnings
    if (user.SellerProfile) {
      const sellerProfile = user.SellerProfile;
      
      // Get orders with seller items
      const allOrders = await prisma.order.findMany({
        where: {
          stripeSessionId: { not: null },
          NOT: {
            orderNumber: {
              startsWith: 'SUB-'
            }
          },
          items: {
            some: {
              Product: {
                sellerId: sellerProfile.id
              }
            }
          }
        },
        select: {
          id: true,
          createdAt: true,
          status: true,
          stripeSessionId: true,
          items: {
            where: {
              Product: {
                sellerId: sellerProfile.id
              }
            },
            select: {
              priceCents: true,
              quantity: true
            }
          }
        },
        take: 1000
      });

      // Filter by Stripe mode
      const orders = allOrders.filter(order => 
        order.stripeSessionId && matchesCurrentMode(order.stripeSessionId)
      );

      // Calculate total earnings
      const totalEarnings = orders.reduce((sum, order) => {
        return sum + order.items.reduce((itemSum, item) => {
          return itemSum + (item.priceCents * item.quantity);
        }, 0);
      }, 0);

      // Calculate platform fee
      let platformFeePercentage = 12; // Default
      if (sellerProfile.Subscription) {
        platformFeePercentage = sellerProfile.Subscription.feeBps / 100;
      }
      const platformFee = Math.round((totalEarnings * platformFeePercentage) / 100);
      const netEarnings = totalEarnings - platformFee;

      // Officieel aanvraagbaar bedrag (zelfde logica als payout-request) → geen mismatch met UI
      const { requestableCents } = await getSellerRequestablePayout(
        prisma,
        user.id,
        platformFeePercentage,
        matchesCurrentMode
      );
      const pendingPayout = requestableCents;
      const availablePayout = requestableCents;

      // Officieel uitbetaald: alleen payouts met providerRef (Stripe-transfer gedaan)
      const payouts = await prisma.payout.findMany({
        where: {
          toUserId: user.id,
          transactionId: { not: { contains: 'delivery' } },
          providerRef: { not: null }
        },
        select: { amountCents: true, providerRef: true }
      });
      const paidPayout = payouts
        .filter((p) => p.providerRef && matchesCurrentMode(p.providerRef))
        .reduce((sum, p) => sum + p.amountCents, 0);

      earnings.seller = {
        totalEarnings,
        pendingPayout,
        availablePayout,
        paidPayout,
        platformFee,
        netEarnings,
        totalOrders: orders.length
      };
    }

    // Calculate delivery earnings (incl. bezorgkosten: webhook txn_delivery_* én triggerDeliveryPayout per orderId)
    if (user.DeliveryProfile) {
      const deliveryProfile = user.DeliveryProfile;

      const deliveredOrderIds = await prisma.deliveryOrder
        .findMany({
          where: { deliveryProfileId: deliveryProfile.id, status: 'DELIVERED' },
          select: { orderId: true }
        })
        .then((rows) => rows.map((r) => r.orderId));

      const allPayoutsToUser = await prisma.payout.findMany({
        where: { toUserId: user.id },
        select: { amountCents: true, providerRef: true, transactionId: true },
        orderBy: { createdAt: 'desc' }
      });

      const deliveryPayouts = allPayoutsToUser.filter(
        (p) =>
          p.transactionId.includes('delivery') ||
          p.transactionId.includes('txn_delivery') ||
          deliveredOrderIds.includes(p.transactionId)
      );

      const totalEarnings = deliveryPayouts.reduce((sum, p) => sum + p.amountCents, 0);
      const paidPayout = deliveryPayouts
        .filter((p) => p.providerRef != null)
        .reduce((sum, p) => sum + p.amountCents, 0);

      const deliveryOrders = await prisma.deliveryOrder.findMany({
        where: { deliveryProfileId: deliveryProfile.id },
        select: { status: true, deliveryFee: true }
      });

      const completedDeliveries = deliveryOrders.filter((o) => o.status === 'DELIVERED').length;
      const earnedFromCompleted = deliveryOrders
        .filter((o) => o.status === 'DELIVERED' && o.deliveryFee != null)
        .reduce((sum, o) => sum + Math.round((o.deliveryFee ?? 0) * DELIVERY_DELIVERER_PERCENT / 100), 0);
      const totalEarningsInclDelivery = Math.max(totalEarnings, earnedFromCompleted);

      earnings.delivery = {
        totalEarnings: totalEarningsInclDelivery,
        paidPayout,
        totalDeliveries: deliveryOrders.length,
        completedDeliveries
      };
    }

    // Calculate affiliate earnings
    if (user.affiliate) {
      const affiliate = user.affiliate;
      const allCommissions = affiliate.commissionLedgers;
      
      const pendingCents = allCommissions
        .filter((c) => c.status === CommissionLedgerStatus.PENDING)
        .reduce((sum, c) => sum + c.amountCents, 0);
      
      const availableCents = allCommissions
        .filter((c) => c.status === CommissionLedgerStatus.AVAILABLE)
        .reduce((sum, c) => sum + c.amountCents, 0);
      
      const paidCents = allCommissions
        .filter((c) => c.status === CommissionLedgerStatus.PAID)
        .reduce((sum, c) => sum + c.amountCents, 0);

      const totalEarnings = pendingCents + availableCents + paidCents;

      // Get total referrals
      const attributions = await prisma.attribution.findMany({
        where: { affiliateId: affiliate.id }
      });

      earnings.affiliate = {
        totalEarnings,
        pendingCents,
        availableCents,
        paidCents,
        totalReferrals: attributions.length
      };
    }

    // Totals: available = aanvraagbaar, paid = officieel uitbetaald (per rol)
    const totalEarnings = (earnings.seller?.totalEarnings || 0) +
      (earnings.delivery?.totalEarnings || 0) +
      (earnings.affiliate?.totalEarnings || 0);

    const totalAvailable =
      (earnings.seller?.availablePayout || 0) +
      (earnings.delivery?.totalEarnings || 0) -
      (earnings.delivery?.paidPayout ?? 0) +
      (earnings.affiliate?.availableCents || 0);

    const totalPaid =
      (earnings.seller?.paidPayout || 0) +
      (earnings.delivery?.paidPayout ?? 0) +
      (earnings.affiliate?.paidCents || 0);

    return NextResponse.json({
      earnings,
      totals: {
        totalEarnings,
        totalAvailable,
        totalPaid
      },
      roles: {
        isSeller: !!user.SellerProfile,
        isDelivery: !!user.DeliveryProfile,
        isAffiliate: !!user.affiliate
      }
    });
  } catch (error) {
    console.error("Error fetching combined earnings:", error);
    return NextResponse.json(
      { error: "Failed to fetch combined earnings" },
      { status: 500 }
    );
  }
}

