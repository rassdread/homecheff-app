/**
 * Process Affiliate Payouts
 * 
 * POST /api/affiliate/payouts/process
 * 
 * This endpoint should be called by a cron job (daily/weekly) to:
 * 1. Find all available commissions
 * 2. Group by affiliate
 * 3. Create Stripe Connect transfers
 * 4. Create AffiliatePayout records
 * 5. Mark ledger entries as PAID
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { MIN_PAYOUT_AMOUNT_CENTS } from "@/lib/affiliate-config";
import { CommissionLedgerStatus, AffiliatePayoutStatus } from "@prisma/client";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Check if user is admin (for manual trigger) or allow cron without auth
    const session = await auth();
    const isAdmin = session?.user && (
      await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { role: true },
      })
    )?.role === 'ADMIN' || false;

    // Allow cron jobs without auth (check for secret header)
    const cronSecret = req.headers.get('x-cron-secret');
    const isValidCron = cronSecret === process.env.CRON_SECRET;

    if (!isAdmin && !isValidCron) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    // Get all available commissions (status = AVAILABLE, availableAt <= now)
    const now = new Date();
    const availableCommissions = await prisma.commissionLedger.findMany({
      where: {
        status: CommissionLedgerStatus.AVAILABLE,
        availableAt: {
          lte: now,
        },
        amountCents: {
          gt: 0, // Only positive amounts
        },
      },
      include: {
        affiliate: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (availableCommissions.length === 0) {
      return NextResponse.json({
        message: "No available commissions to process",
        processed: 0,
      });
    }

    // Group by affiliate
    const affiliateGroups = new Map<
      string,
      {
        affiliate: typeof availableCommissions[0]['affiliate'];
        commissions: typeof availableCommissions;
        totalCents: number;
      }
    >();

    for (const commission of availableCommissions) {
      const affiliateId = commission.affiliateId;
      if (!affiliateGroups.has(affiliateId)) {
        affiliateGroups.set(affiliateId, {
          affiliate: commission.affiliate,
          commissions: [],
          totalCents: 0,
        });
      }

      const group = affiliateGroups.get(affiliateId)!;
      group.commissions.push(commission);
      group.totalCents += commission.amountCents;
    }

    // Process payouts
    const results = {
      processed: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const [affiliateId, group] of affiliateGroups) {
      try {
        // Check minimum payout amount
        if (group.totalCents < MIN_PAYOUT_AMOUNT_CENTS) {
          results.skipped++;
          continue;
        }

        // Check if affiliate has Stripe Connect account
        if (!group.affiliate.stripeConnectAccountId) {
          results.skipped++;
          results.errors.push(
            `Affiliate ${affiliateId} has no Stripe Connect account`
          );
          continue;
        }

        // Check if affiliate onboarding is complete
        if (!group.affiliate.stripeConnectOnboardingCompleted) {
          results.skipped++;
          results.errors.push(
            `Affiliate ${affiliateId} has incomplete Stripe Connect onboarding`
          );
          continue;
        }

        // Calculate period (last 7 days or since last payout)
        const lastPayout = await prisma.affiliatePayout.findFirst({
          where: {
            affiliateId,
            status: AffiliatePayoutStatus.SENT,
          },
          orderBy: { periodEnd: 'desc' },
        });

        const periodStart = lastPayout
          ? new Date(lastPayout.periodEnd.getTime() + 1)
          : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
        const periodEnd = now;

        // Create Stripe transfer
        let transferId: string | null = null;
        try {
          const transfer = await stripe.transfers.create({
            amount: group.totalCents,
            currency: 'eur',
            destination: group.affiliate.stripeConnectAccountId,
            metadata: {
              type: 'affiliate_commission',
              affiliateId,
              commissionCount: group.commissions.length.toString(),
              periodStart: periodStart.toISOString(),
              periodEnd: periodEnd.toISOString(),
            },
          });
          transferId = transfer.id;
        } catch (transferError: any) {
          console.error(`Failed to create transfer for affiliate ${affiliateId}:`, transferError);
          results.failed++;
          results.errors.push(
            `Transfer failed for affiliate ${affiliateId}: ${transferError.message}`
          );
          continue;
        }

        // Create AffiliatePayout record
        const payout = await prisma.affiliatePayout.create({
          data: {
            affiliateId,
            amountCents: group.totalCents,
            currency: 'eur',
            status: AffiliatePayoutStatus.SENT,
            stripeTransferId: transferId,
            periodStart,
            periodEnd,
          },
        });

        // Mark all commissions as PAID
        await prisma.commissionLedger.updateMany({
          where: {
            id: {
              in: group.commissions.map((c) => c.id),
            },
          },
          data: {
            status: CommissionLedgerStatus.PAID,
          },
        });

        results.processed++;
        console.log(
          `✅ Payout processed for affiliate ${affiliateId}: €${(group.totalCents / 100).toFixed(2)}`
        );
      } catch (error: any) {
        console.error(`Error processing payout for affiliate ${affiliateId}:`, error);
        results.failed++;
        results.errors.push(
          `Payout failed for affiliate ${affiliateId}: ${error.message}`
        );
      }
    }

    return NextResponse.json({
      message: "Payout processing completed",
      ...results,
    });
  } catch (error: any) {
    console.error("Error processing payouts:", error);
    return NextResponse.json(
      { error: "Failed to process payouts", details: error.message },
      { status: 500 }
    );
  }
}








