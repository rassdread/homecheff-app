/**
 * Vrijgeven van escrow wanneer een order op DELIVERED wordt gezet.
 * Gebruikt bij: admin/verkoper zet status op DELIVERED, of delivery update-status.
 */
import type { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2025-08-27.basil' });
}

export async function releaseEscrowForOrder(
  prisma: PrismaClient,
  orderId: string
): Promise<{ released: number; errors: string[] }> {
  const errors: string[] = [];
  let released = 0;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      paymentEscrow: {
        where: { currentStatus: 'held', payoutTrigger: 'DELIVERED' },
      },
      items: {
        include: {
          Product: {
            include: {
              seller: {
                include: {
                  User: {
                    select: {
                      id: true,
                      stripeConnectAccountId: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order?.stripeSessionId || order.paymentEscrow.length === 0) {
    return { released: 0, errors: [] };
  }

  const stripe = getStripe();
  if (!stripe) {
    return { released: 0, errors: ['STRIPE_SECRET_KEY niet geconfigureerd'] };
  }

  for (const escrow of order.paymentEscrow) {
    const seller = await prisma.user.findUnique({
      where: { id: escrow.sellerId },
      select: { stripeConnectAccountId: true },
    });
    if (!seller?.stripeConnectAccountId || escrow.amountCents <= 0) {
      errors.push(`Escrow ${escrow.id}: geen Stripe-account of bedrag 0`);
      continue;
    }

    try {
      const transfer = await stripe.transfers.create({
        amount: escrow.amountCents,
        currency: 'eur',
        destination: seller.stripeConnectAccountId,
        transfer_group: `order_${orderId}`,
        metadata: {
          orderId,
          type: 'product_sale',
          escrowId: escrow.id,
        },
      });

      await prisma.paymentEscrow.update({
        where: { id: escrow.id },
        data: {
          currentStatus: 'paid_out',
          paidOutAt: new Date(),
        },
      });

      const payout = await prisma.payout.findFirst({
        where: {
          toUserId: escrow.sellerId,
          amountCents: escrow.amountCents,
          providerRef: null,
          Transaction: {
            providerRef: order.stripeSessionId,
          },
        },
      });
      if (payout) {
        await prisma.payout.update({
          where: { id: payout.id },
          data: { providerRef: transfer.id },
        });
      }

      released++;
    } catch (err: any) {
      errors.push(`Escrow ${escrow.id}: ${err?.message || 'Stripe transfer failed'}`);
      await prisma.paymentEscrow.update({
        where: { id: escrow.id },
        data: { currentStatus: 'payout_scheduled' },
      }).catch(() => {});
    }
  }

  return { released, errors };
}
