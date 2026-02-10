import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe, matchesCurrentMode } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

// Minimum payout amount in cents (€10)
const MIN_PAYOUT_AMOUNT_CENTS = 1000;

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
        stripeConnectOnboardingCompleted: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if Stripe Connect is set up
    if (!user.stripeConnectAccountId || !user.stripeConnectOnboardingCompleted) {
      return NextResponse.json({ 
        error: 'Stripe Connect account is not set up. Please complete your Stripe Connect onboarding first.' 
      }, { status: 400 });
    }

    // Get seller profile
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
      include: {
        Subscription: true
      }
    });

    if (!sellerProfile) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    // Find all transactions for this seller that need payouts
    // Transactions must be:
    // 1. CAPTURED status (paid)
    // 2. Either no existing payouts OR payout with providerRef: null (not yet processed)
    // 3. Have providerRef matching current Stripe mode (for non-shipping orders)
    const allTransactions = await prisma.transaction.findMany({
      where: {
        sellerId: user.id,
        status: 'CAPTURED',
        OR: [
          {
            Payout: {
              none: {}
            }
          },
          {
            Payout: {
              some: {
                providerRef: null
              }
            }
          }
        ]
      },
      include: {
        Reservation: {
          include: {
            Listing: {
              select: {
                title: true
              }
            }
          }
        },
        Payout: {
          select: {
            id: true,
            providerRef: true
          }
        }
      }
    });

    // Get all providerRefs to find related orders and escrows
    const providerRefs = allTransactions
      .map(tx => tx.providerRef)
      .filter((ref): ref is string => ref !== null && matchesCurrentMode(ref));

    // Find orders and their escrows for these transactions
    const ordersWithEscrows = providerRefs.length > 0 ? await prisma.order.findMany({
      where: {
        stripeSessionId: { in: providerRefs }
      },
      select: {
        stripeSessionId: true,
        paymentEscrow: {
          where: {
            currentStatus: 'held'
          },
          select: {
            currentStatus: true
          }
        }
      }
    }) : [];

    // Create a map of providerRef -> hasActiveEscrow
    const escrowMap = new Map<string, boolean>();
    ordersWithEscrows.forEach(order => {
      if (order.stripeSessionId) {
        escrowMap.set(order.stripeSessionId, order.paymentEscrow.length > 0);
      }
    });

    // Filter transactions:
    // 1. Must have providerRef matching current Stripe mode (for non-shipping orders)
    // 2. Must not have active escrow (shipping orders are handled separately via webhook)
    // 3. Must have payout with providerRef: null OR no payout at all
    const validTransactions = allTransactions.filter(tx => {
      // Skip if transaction has no providerRef (shouldn't happen for CAPTURED, but safety check)
      if (!tx.providerRef) return false;
      
      // Skip if providerRef doesn't match current Stripe mode
      if (!matchesCurrentMode(tx.providerRef)) return false;
      
      // Skip if there's an active escrow (shipping order - handled via webhook after delivery)
      const hasActiveEscrow = escrowMap.get(tx.providerRef) || false;
      if (hasActiveEscrow) return false;
      
      // Include if no payout exists OR payout exists with providerRef: null (not yet processed)
      const hasPayout = tx.Payout && tx.Payout.length > 0;
      if (hasPayout) {
        // Check if all payouts have providerRef: null (not yet processed)
        const allPayoutsPending = tx.Payout.every(p => p.providerRef === null);
        return allPayoutsPending;
      }
      
      // No payout exists - include it
      return true;
    });

    if (validTransactions.length === 0) {
      return NextResponse.json({ 
        error: 'No transactions available for payout. All transactions may already have payouts or are not ready for payout.' 
      }, { status: 400 });
    }

    // Calculate platform fee percentage
    let platformFeePercentage = 12;
    if (sellerProfile?.Subscription) {
      platformFeePercentage = sellerProfile.Subscription.feeBps / 100;
    }

    // Calculate total amount from these transactions
    const totalPayoutAmount = validTransactions.reduce((sum, tx) => {
      // Use transaction's platformFeeBps if available, otherwise use seller's default
      const platformFeeBps = tx.platformFeeBps || (platformFeePercentage * 100);
      const platformFee = Math.round((tx.amountCents * platformFeeBps) / 10000);
      return sum + (tx.amountCents - platformFee);
    }, 0);

    // Check minimum payout amount
    if (totalPayoutAmount < MIN_PAYOUT_AMOUNT_CENTS) {
      return NextResponse.json({ 
        error: `Total payout amount (€${(totalPayoutAmount / 100).toFixed(2)}) is below the minimum (€${(MIN_PAYOUT_AMOUNT_CENTS / 100).toFixed(2)})` 
      }, { status: 400 });
    }

    // Create Stripe transfer
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    let transferId: string | null = null;
    try {
      const transfer = await stripe.transfers.create({
        amount: totalPayoutAmount,
        currency: 'eur',
        destination: user.stripeConnectAccountId!,
        metadata: {
          type: 'seller_payout_request',
          userId: user.id,
          transactionCount: validTransactions.length.toString(),
          sellerId: sellerProfile.id,
        }
      });
      transferId = transfer.id;
    } catch (transferError: any) {
      console.error(`Failed to create transfer for seller ${user.id}:`, transferError);
      return NextResponse.json({ 
        error: `Failed to create payout: ${transferError.message}` 
      }, { status: 500 });
    }

    // Create or update payout records for each transaction
    const payoutRecords = await Promise.all(
      validTransactions.map(async (tx) => {
        // Calculate net amount for this specific transaction
        const platformFeeBps = tx.platformFeeBps || (platformFeePercentage * 100);
        const platformFee = Math.round((tx.amountCents * platformFeeBps) / 10000);
        const netAmount = tx.amountCents - platformFee;

        // Check if payout already exists (with providerRef: null)
        const existingPayout = tx.Payout?.find(p => p.providerRef === null);
        
        if (existingPayout) {
          // Update existing payout with transfer ID
          return prisma.payout.update({
            where: { id: existingPayout.id },
            data: {
              providerRef: transferId,
              amountCents: netAmount, // Update amount in case fee changed
            }
          });
        } else {
          // Create new payout record
          return prisma.payout.create({
            data: {
              id: `payout_${tx.id}_${Date.now()}`,
              transactionId: tx.id,
              toUserId: user.id,
              amountCents: netAmount,
              providerRef: transferId
            }
          });
        }
      })
    );

    return NextResponse.json({
      success: true,
      message: `Payout of €${(totalPayoutAmount / 100).toFixed(2)} has been requested and will be processed within 2-5 business days.`,
      payoutAmount: totalPayoutAmount,
      transferId,
      transactionCount: validTransactions.length,
      payouts: payoutRecords.map(p => ({
        id: p.id,
        amount: p.amountCents,
        createdAt: p.createdAt
      }))
    });
  } catch (error) {
    console.error('Error requesting payout:', error);
    return NextResponse.json(
      { error: 'Failed to request payout' },
      { status: 500 }
    );
  }
}
