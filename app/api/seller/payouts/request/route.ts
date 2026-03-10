import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe, matchesCurrentMode } from '@/lib/stripe';
import { getSellerRequestablePayout, MIN_PAYOUT_CENTS } from '@/lib/sellerPayouts';
import { getCombinedRequestablePayout } from '@/lib/combinedPayouts';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        stripeConnectAccountId: true,
        stripeConnectOnboardingCompleted: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.stripeConnectAccountId || !user.stripeConnectOnboardingCompleted) {
      return NextResponse.json({
        error: 'Stripe Connect account is not set up. Please complete your Stripe Connect onboarding first.',
      }, { status: 400 });
    }

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
      include: { Subscription: true },
    });

    if (!sellerProfile) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    let platformFeePercentage = 12;
    if (sellerProfile.Subscription) {
      platformFeePercentage = sellerProfile.Subscription.feeBps / 100;
    }

    const hasDeliveryProfile = await prisma.deliveryProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    let totalPayoutAmount: number;
    let validFromHelper: Awaited<ReturnType<typeof getSellerRequestablePayout>>['validTransactions'];
    let validDeliveryPayouts: Array<{ id: string; amountCents: number }>;

    if (hasDeliveryProfile) {
      const combined = await getCombinedRequestablePayout(
        prisma,
        user.id,
        platformFeePercentage,
        matchesCurrentMode
      );
      totalPayoutAmount = combined.totalRequestableCents;
      validFromHelper = combined.sellerResult.validTransactions;
      validDeliveryPayouts = combined.validDeliveryPayouts;

      if (!combined.canRequestPayout) {
        if (totalPayoutAmount === 0) {
          return NextResponse.json({
            error: 'Geen bedrag beschikbaar voor uitbetaling. Alles is al uitbetaald of nog niet klaar (bijv. verzending in behandeling).',
          }, { status: 400 });
        }
        return NextResponse.json({
          error: `Het aanvraagbare bedrag (€${(totalPayoutAmount / 100).toFixed(2)}) is lager dan het minimum van €${(MIN_PAYOUT_CENTS / 100).toFixed(2)}.`,
        }, { status: 400 });
      }
    } else {
      const sellerResult = await getSellerRequestablePayout(
        prisma,
        user.id,
        platformFeePercentage,
        matchesCurrentMode
      );
      totalPayoutAmount = sellerResult.requestableCents;
      validFromHelper = sellerResult.validTransactions;
      validDeliveryPayouts = [];

      if (!sellerResult.canRequestPayout) {
        if (validFromHelper.length === 0) {
          return NextResponse.json({
            error: 'Geen transacties beschikbaar voor uitbetaling. Alles is al uitbetaald of nog niet klaar (bijv. verzending in behandeling).',
          }, { status: 400 });
        }
        return NextResponse.json({
          error: `Het aanvraagbare bedrag (€${(totalPayoutAmount / 100).toFixed(2)}) is lager dan het minimum van €${(MIN_PAYOUT_CENTS / 100).toFixed(2)}.`,
        }, { status: 400 });
      }
    }

    const validIds = validFromHelper.map((t) => t.id);
    const netAmountByTxId = new Map(validFromHelper.map((t) => [t.id, t.netAmountCents]));

    const validTransactions = await prisma.transaction.findMany({
      where: { id: { in: validIds } },
      include: {
        Reservation: { include: { Listing: { select: { title: true } } } },
        Payout: { select: { id: true, providerRef: true } },
      },
    });

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    let transferId: string | null = null;
    let payoutToBankId: string | null = null;
    try {
      const transfer = await stripe.transfers.create({
        amount: totalPayoutAmount,
        currency: 'eur',
        destination: user.stripeConnectAccountId!,
        metadata: {
          type: hasDeliveryProfile ? 'combined_payout_request' : 'seller_payout_request',
          userId: user.id,
          transactionCount: validTransactions.length.toString(),
          deliveryCount: validDeliveryPayouts.length.toString(),
          sellerId: sellerProfile.id,
        },
      });
      transferId = transfer.id;
    } catch (transferError: any) {
      console.error(`Failed to create transfer for user ${user.id}:`, transferError);
      return NextResponse.json({
        error: `Failed to create payout: ${transferError.message}`,
      }, { status: 500 });
    }

    // Uitbetaling naar hun bank: heel het beschikbare saldo (nieuw + fondsen uit het verleden)
    try {
      const balance = await stripe.balance.retrieve(
        {},
        { stripeAccount: user.stripeConnectAccountId! }
      );
      const eurAvailable = balance.available?.find((b: { currency: string }) => b.currency === 'eur');
      const availableCents = eurAvailable?.amount ?? 0;

      if (availableCents >= 100) {
        const payoutToBank = await stripe.payouts.create(
          {
            amount: availableCents,
            currency: 'eur',
            metadata: {
              type: 'payout_to_bank_via_website',
              userId: user.id,
              transferId: transferId!,
              includesPastFunds: 'true',
            },
          },
          { stripeAccount: user.stripeConnectAccountId! }
        );
        payoutToBankId = payoutToBank.id;
      }
    } catch (payoutError: any) {
      console.warn(`Payout to bank failed for user ${user.id}, transfer succeeded:`, payoutError?.message);
    }

    const payoutRecords: Array<{ id: string; amountCents: number; createdAt: Date }> = [];

    for (const tx of validTransactions) {
      const netAmount = netAmountByTxId.get(tx.id) ?? (tx.amountCents - Math.round((tx.amountCents * (tx.platformFeeBps || platformFeePercentage * 100)) / 10000));
      const existingPayout = tx.Payout?.find((p) => p.providerRef === null);

      const updated = existingPayout
        ? await prisma.payout.update({
            where: { id: existingPayout.id },
            data: { providerRef: transferId, amountCents: netAmount },
          })
        : await prisma.payout.create({
            data: {
              id: `payout_${tx.id}_${Date.now()}`,
              transactionId: tx.id,
              toUserId: user.id,
              amountCents: netAmount,
              providerRef: transferId,
            },
          });
      payoutRecords.push({ id: updated.id, amountCents: updated.amountCents, createdAt: updated.createdAt });
    }

    for (const dp of validDeliveryPayouts) {
      const updated = await prisma.payout.update({
        where: { id: dp.id },
        data: { providerRef: transferId },
      });
      payoutRecords.push({ id: updated.id, amountCents: updated.amountCents, createdAt: updated.createdAt });
    }

    const message = payoutToBankId
      ? `Uitbetaling naar je bankrekening is aangevraagd (meestal binnen 2–5 werkdagen). Het volledige saldo op je uitbetalingsaccount – inclusief bedragen uit het verleden – is meegenomen. Geen Stripe-login nodig.`
      : `Het bedrag staat op je Stripe-account. Uitbetaling naar je bank volgt automatisch volgens het Stripe-schema (binnen 2–5 werkdagen).`;

    return NextResponse.json({
      success: true,
      message,
      payoutAmount: totalPayoutAmount,
      transferId,
      payoutToBankId: payoutToBankId ?? undefined,
      transactionCount: validTransactions.length,
      deliveryPayoutCount: validDeliveryPayouts.length,
      payouts: payoutRecords,
    });
  } catch (error) {
    console.error('Error requesting payout:', error);
    return NextResponse.json(
      { error: 'Failed to request payout' },
      { status: 500 }
    );
  }
}
