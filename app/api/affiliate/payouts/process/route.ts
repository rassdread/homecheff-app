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
import {
  claimCommissionRows,
  markClaimedCommissionsPaid,
  payoutIntentOf,
  settleAffiliatePayout,
} from "@/lib/affiliate-payout-safety";

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
    const stripeClient = stripe;

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
                stripeConnectAccountId: true,
                stripeConnectOnboardingCompleted: true,
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
        const hasResume = group.commissions.some((commission) => payoutIntentOf(commission.meta));
        if (!hasResume && group.totalCents < MIN_PAYOUT_AMOUNT_CENTS) {
          results.skipped++;
          continue;
        }

        const { resolveAffiliateConnectDestination } = await import(
          '@/lib/stripe/affiliate-connect-mirror'
        );
        const destination = resolveAffiliateConnectDestination({
          userStripeConnectAccountId:
            group.affiliate.user?.stripeConnectAccountId,
          userStripeConnectOnboardingCompleted:
            group.affiliate.user?.stripeConnectOnboardingCompleted,
          affiliateStripeConnectAccountId: group.affiliate.stripeConnectAccountId,
          affiliateStripeConnectOnboardingCompleted:
            group.affiliate.stripeConnectOnboardingCompleted,
        });

        // Check if affiliate has Stripe Connect account (User canonical)
        if (!destination.accountId) {
          results.skipped++;
          results.errors.push(
            `Affiliate ${affiliateId} has no Stripe Connect account`
          );
          continue;
        }

        // Check if affiliate onboarding is complete
        if (!destination.onboardingCompleted) {
          results.skipped++;
          results.errors.push(
            `Affiliate ${affiliateId} has incomplete Stripe Connect onboarding`
          );
          continue;
        }

        const resumed = new Map<string, typeof group.commissions>();
        const fresh: typeof group.commissions = [];
        for (const commission of group.commissions) {
          const intent = payoutIntentOf(commission.meta);
          if (!intent) {
            fresh.push(commission);
            continue;
          }
          const rows: typeof group.commissions = resumed.get(intent) ?? [];
          rows.push(commission);
          resumed.set(intent, rows);
        }

        const lastPayout = await prisma.affiliatePayout.findFirst({
          where: {
            affiliateId,
            status: AffiliatePayoutStatus.SENT,
          },
          orderBy: { periodEnd: 'desc' },
        });
        const periodStart = lastPayout
          ? new Date(lastPayout.periodEnd.getTime() + 1)
          : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const periodEnd = now;
        const batches = [
          ...[...resumed.values()].map((rows) => ({ rows, resume: true })),
          ...(fresh.reduce((sum, row) => sum + row.amountCents, 0) >= MIN_PAYOUT_AMOUNT_CENTS
            ? [{ rows: fresh, resume: false }]
            : []),
        ];
        if (batches.length === 0) {
          results.skipped++;
          continue;
        }

        const store = {
          findPayout: (id: string) => prisma.affiliatePayout.findUnique({
            where: { id },
            select: { id: true, status: true, stripeTransferId: true, amountCents: true },
          }),
          createPayout: async (payout: {
            id: string;
            affiliateId: string;
            amountCents: number;
            currency: string;
            periodStart: Date;
            periodEnd: Date;
          }) => {
            try {
              await prisma.affiliatePayout.create({
                data: { ...payout, status: AffiliatePayoutStatus.CREATED },
              });
              return 'created' as const;
            } catch (error) {
              const code = error && typeof error === 'object' && 'code' in error
                ? String((error as { code?: unknown }).code || '')
                : '';
              if (code === 'P2002') return 'exists' as const;
              throw error;
            }
          },
          saveTransfer: async (id: string, stripeTransferId: string) => {
            await prisma.affiliatePayout.update({
              where: { id },
              data: { stripeTransferId, status: AffiliatePayoutStatus.SENT },
            });
          },
          markFailed: async (id: string) => {
            await prisma.affiliatePayout.update({
              where: { id },
              data: { status: AffiliatePayoutStatus.FAILED },
            });
          },
          claim: (ids: string[], intentId: string) => claimCommissionRows(prisma, ids, intentId),
          markPaid: (ids: string[], intentId: string, stripeTransferId: string) =>
            markClaimedCommissionsPaid(prisma, ids, intentId, stripeTransferId),
        };
        const transfers = {
          findTransfer: async (intentId: string) => {
            const page = await stripeClient.transfers.list({ transfer_group: intentId, limit: 10 });
            const match = page.data.find((row) => row.id.startsWith('tr_'));
            return match ? { id: match.id } : null;
          },
          createTransfer: async (transfer: {
            amountCents: number;
            currency: string;
            destinationAccountId: string;
            intentId: string;
            idempotencyKey: string;
          }) => {
            const created = await stripeClient.transfers.create({
              amount: transfer.amountCents,
              currency: transfer.currency,
              destination: transfer.destinationAccountId,
              transfer_group: transfer.intentId,
              metadata: {
                type: 'affiliate_commission',
                affiliateId,
                payoutIntentId: transfer.intentId,
              },
            }, { idempotencyKey: transfer.idempotencyKey });
            return { id: created.id };
          },
        };

        for (const batch of batches) {
          const settled = await settleAffiliatePayout({
            affiliateId,
            commissions: batch.rows,
            currency: 'eur',
            destinationAccountId: destination.accountId,
            onboardingCompleted: destination.onboardingCompleted,
            periodStart,
            periodEnd,
            minimumCents: MIN_PAYOUT_AMOUNT_CENTS,
            resume: batch.resume,
            store,
            stripe: transfers,
          });
          if (settled.outcome === 'paid' || settled.outcome === 'already_paid') {
            results.processed++;
          } else if (settled.outcome === 'failed' || settled.outcome === 'uncertain') {
            results.failed++;
            results.errors.push(`Affiliate ${affiliateId} payout ${settled.outcome}:${settled.reason || 'unspecified'}`);
          } else {
            results.skipped++;
          }
          console.log(JSON.stringify({
            affiliateId,
            outcome: settled.outcome,
            intentId: settled.intentId,
            transferId: settled.stripeTransferId,
          }));
        }
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








