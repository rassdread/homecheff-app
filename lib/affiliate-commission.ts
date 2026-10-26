/**
 * Affiliate Commission Logic
 * 
 * Handles commission calculation and ledger entry creation
 */

import { prisma } from '@/lib/prisma';
import {
  calculateRevenueShares,
  calculateBusinessSubscriptionCommission,
  calculateUserTransactionCommission,
  calculateParentAffiliateUserTransactionCommission,
  calculateParentAffiliateBusinessCommission,
  applyDiscountToL1,
  LEDGER_PENDING_DAYS,
} from './affiliate-config';
import { splitAffiliateLineForHierarchy } from '@/lib/affiliates/main-partner-split';
import { beneficiaryUserIdBlocked, parentOverrideAllowed } from '@/lib/affiliates/self-referral-guard';
import { CommissionLedgerEventType, CommissionLedgerStatus, type CommissionLedger, type PrismaClient } from '@prisma/client';
import { marketplaceCalendarWindowBlocksCommission } from '@/lib/affiliate-revenue-window';

/**
 * Process commission for a paid invoice
 */
export async function processCommissionForInvoice(
  invoiceId: string,
  subscriptionId: string,
  amountPaidCents: number,
  metadata?: Record<string, string>,
  database?: PrismaClient,
): Promise<void> {
  try {
    const db = database ?? prisma;
    // Get BusinessSubscription
    const businessSubscription = await db.businessSubscription.findFirst({
      where: { stripeSubscriptionId: subscriptionId },
      include: {
        attribution: {
          include: {
            affiliate: {
              include: {
                parentAffiliate: true,
              },
            },
          },
        },
        promoCode: {
          include: {
            affiliate: true,
          },
        },
      },
    });

    if (!businessSubscription) {
      console.warn(`BusinessSubscription not found for subscription ${subscriptionId}`);
      return;
    }

    // endsAt is a retired 365-day snapshot. It does not stop a paid invoice.
    const now = new Date();
    if (marketplaceCalendarWindowBlocksCommission(now, businessSubscription.endsAt)) {
      return;
    }

    // Check idempotency - prevent duplicate ledger entries
    const existingLedger = await db.commissionLedger.findUnique({
      where: { eventId: invoiceId },
    });

    if (existingLedger) {
      console.log(`Commission already processed for invoice ${invoiceId}`);
      return;
    }

    // Get affiliates
    const l1AffiliateId = businessSubscription.attribution?.affiliateId;
    if (!l1AffiliateId) {
      console.warn(`No attribution found for subscription ${subscriptionId}`);
      return;
    }

    if (!businessSubscription.attribution) {
      console.log('No attribution found for BusinessSubscription, skipping commission');
      return;
    }

    const l1Affiliate = businessSubscription.attribution.affiliate;
    const commissionParties = [businessSubscription.businessUserId, businessSubscription.attribution.userId];
    if (beneficiaryUserIdBlocked(l1Affiliate.userId, commissionParties)) {
      console.warn(`[affiliate] self-referral blocked invoice=${invoiceId}`);
      return;
    }

    // Check if this is a sub-affiliate (has parent)
    const isSubAffiliate = !!l1Affiliate.parentAffiliateId;
    
    // Get discount percentage from promo code (if exists)
    const discountSharePct = businessSubscription.promoCode?.discountSharePct || 0;
    
    // Get custom commission percentages if set (for sub-affiliates)
    const customBusinessCommissionPct = l1Affiliate.customBusinessCommissionPct;
    const customParentBusinessCommissionPct = l1Affiliate.customParentBusinessCommissionPct;
    
    // Note: amountPaidCents is wat het bedrijf betaalt (kan lager zijn door korting)
    // Maar we berekenen commission op basis van base price
    // Als er korting is gegeven, moeten we de base price reconstrueren
    // Voor nu nemen we aan dat amountPaidCents de base price is (zonder korting)
    // Als er korting is, wordt dit later aangepast via promo code
    
    // Calculate business subscription commission
    // Direct affiliate: 50% voor affiliate, 50% voor HomeCheff
    // Sub-affiliate: 40% voor sub (of custom), 10% voor hoofd (of custom), 50% voor HomeCheff
    // Affiliate kan korting geven vanuit zijn eigen fee
    const commissionResult = calculateBusinessSubscriptionCommission(
      amountPaidCents, 
      discountSharePct,
      isSubAffiliate,
      customBusinessCommissionPct
    );
    
    const {
      affiliateCommissionCents,
      discountCents,
      finalPriceCents,
      homecheffShareCents,
      finalAffiliateCommissionCents,
    } = commissionResult;

    // Create ledger entries
    const availableAt = new Date(
      now.getTime() + LEDGER_PENDING_DAYS * 24 * 60 * 60 * 1000
    );

    // Affiliate commission (50% voor direct, 40% voor sub, minus korting als die is gegeven)
    if (finalAffiliateCommissionCents > 0) {
      await db.commissionLedger.create({
        data: {
          eventId: invoiceId,
          eventType: CommissionLedgerEventType.INVOICE_PAID,
          affiliateId: l1AffiliateId,
          amountCents: finalAffiliateCommissionCents,
          currency: 'eur',
          status: CommissionLedgerStatus.PENDING,
          availableAt,
          businessSubscriptionId: businessSubscription.id,
          meta: {
            invoiceId,
            subscriptionId,
            baseAmountCents: amountPaidCents,
            amountPaidCents, // Wat bedrijf daadwerkelijk betaalde
            affiliateCommissionCents: commissionResult.affiliateCommissionCents,
            discountCents: commissionResult.discountCents,
            homecheffShareCents: commissionResult.homecheffShareCents,
            promoCodeId: businessSubscription.promoCodeId,
            isSubAffiliate,
            tier: isSubAffiliate ? 'SUB' : 'DIRECT',
            ...metadata,
          },
        },
      });
    }
    
    // If this is a sub-affiliate, also create commission for parent affiliate (10% or custom)
    const parentAffiliate = l1Affiliate.parentAffiliate;
    const parentPayable =
      isSubAffiliate &&
      parentOverrideAllowed({
        affiliateId: l1Affiliate.id,
        affiliateUserId: l1Affiliate.userId,
        parentAffiliateId: l1Affiliate.parentAffiliateId,
        parentUserId: parentAffiliate?.userId,
        partyUserIds: commissionParties,
      });
    if (parentPayable && l1Affiliate.parentAffiliateId) {
      const { calculateParentAffiliateBusinessCommission } = await import('./affiliate-config');
      const parentCommissionCents = calculateParentAffiliateBusinessCommission(
        amountPaidCents,
        customParentBusinessCommissionPct
      );
      
      if (parentCommissionCents > 0) {
        await db.commissionLedger.create({
          data: {
            eventId: `${invoiceId}_parent`,
            eventType: CommissionLedgerEventType.INVOICE_PAID,
            affiliateId: l1Affiliate.parentAffiliateId,
            amountCents: parentCommissionCents,
            currency: 'eur',
            status: CommissionLedgerStatus.PENDING,
            availableAt,
            businessSubscriptionId: businessSubscription.id,
            meta: {
              invoiceId,
              subscriptionId,
              baseAmountCents: amountPaidCents,
              amountPaidCents,
              parentCommissionCents,
              subAffiliateId: l1AffiliateId,
              tier: 'PARENT',
              ...metadata,
            },
          },
        });
      }
    }

    console.log(
      `✅ Commission processed for invoice ${invoiceId}: Affiliate=${finalAffiliateCommissionCents}, HomeCheff=${commissionResult.homecheffShareCents}, Discount=${commissionResult.discountCents}, FinalPrice=${amountPaidCents}`
    );
    if (finalAffiliateCommissionCents > 0) {
      await import('@/lib/analytics/record-acquisition-event.server')
        .then(({ recordAffiliateEconomicAction }) =>
          recordAffiliateEconomicAction({
            dedupeKey: `affiliate-econ:invoice:${invoiceId}`,
            amountCents: finalAffiliateCommissionCents,
            invoiceId,
          }),
        )
        .catch((e) => console.warn('[acquisition] affiliate invoice', e));
    }
  } catch (error) {
    console.error('Error processing commission for invoice:', error);
    throw error;
  }
}

/**
 * Process commission for a paid marketplace order.
 *
 * Affiliate pool = 50% of actual HomeCheff platform fee, distributed per pool cases.
 * MAIN10_SUB40 (original HomeCheff business model): when the attributed affiliate is a partner/sub,
 * partner receives 80% of that line and main 20% of that line.
 * For a full 50% pool line that equals partner 40% + main 10% of the platform fee.
 * Direct (no parent): full line (= up to 50% of fee).
 */
export async function processCommissionForOrder(
  orderId: string,
  homecheffFeeCents: number,
  buyerId: string,
  sellerId: string,
  metadata?: Record<string, string>,
  database?: PrismaClient,
): Promise<void> {
  try {
    const db = database ?? prisma;
    const now = new Date();

    const existingAny = await db.commissionLedger.findFirst({
      where: {
        OR: [
          { eventId: orderId },
          { eventId: { startsWith: `${orderId}:` } },
        ],
      },
    });
    if (existingAny) {
      console.log(`Commission already processed for order ${orderId}`);
      return;
    }

    // Cross-ecosystem: prefer EcosystemAffiliateAttribution; fall back to Marketplace Attribution.
    // Never invent a Marketplace Attribution row merely to satisfy Delivery/MP accrual.
    const { resolveActiveEcosystemAttribution } = await import(
      '@/lib/affiliates/ecosystem-attribution-bridge'
    );
    const { resolveSideAffiliatePrecedence } = await import(
      '@/lib/affiliates/cross-ecosystem-attribution-precedence'
    );

    const [buyerEco, sellerEco, buyerAttribution, sellerAttribution] = await Promise.all([
      resolveActiveEcosystemAttribution({ referredUserId: buyerId, at: now }),
      resolveActiveEcosystemAttribution({ referredUserId: sellerId, at: now }),
      db.attribution.findFirst({
        where: {
          userId: buyerId,
          type: 'USER_SIGNUP',
          startsAt: { lte: now },
        },
        include: { affiliate: true },
        orderBy: { createdAt: 'asc' },
      }),
      db.attribution.findFirst({
        where: {
          userId: sellerId,
          type: 'USER_SIGNUP',
          startsAt: { lte: now },
        },
        include: { affiliate: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const buyerResolved = resolveSideAffiliatePrecedence({
      side: 'BUYER',
      ecosystemAffiliateCentralUserId: buyerEco.found
        ? buyerEco.attribution?.affiliateCentralUserId ?? null
        : null,
      ecosystemAttributionId: buyerEco.found ? buyerEco.attribution?.id ?? null : null,
      referralOriginPlatform: buyerEco.found
        ? buyerEco.attribution?.sourcePlatform ?? null
        : null,
      marketplaceAffiliateId: buyerAttribution?.affiliateId ?? null,
    });
    const sellerResolved = resolveSideAffiliatePrecedence({
      side: 'SELLER',
      ecosystemAffiliateCentralUserId: sellerEco.found
        ? sellerEco.attribution?.affiliateCentralUserId ?? null
        : null,
      ecosystemAttributionId: sellerEco.found ? sellerEco.attribution?.id ?? null : null,
      referralOriginPlatform: sellerEco.found
        ? sellerEco.attribution?.sourcePlatform ?? null
        : null,
      marketplaceAffiliateId: sellerAttribution?.affiliateId ?? null,
    });

    async function ensureAffiliateSeat(userId: string) {
      const existing = await db.affiliate.findUnique({ where: { userId } });
      if (existing) return existing;
      return db.affiliate.create({
        data: { userId, status: 'ACTIVE', populationClass: 'TECHNICAL' },
      });
    }

    let buyerAffiliateId: string | null = null;
    let sellerAffiliateId: string | null = null;
    let buyerAffiliate = buyerAttribution?.affiliate ?? null;
    let sellerAffiliate = sellerAttribution?.affiliate ?? null;

    if (buyerResolved.source === 'ECOSYSTEM' && buyerResolved.affiliateKey) {
      buyerAffiliate = await ensureAffiliateSeat(buyerResolved.affiliateKey);
      buyerAffiliateId = buyerAffiliate.id;
      // Sync MAIN parent from ecosystem Edge when local parent missing (prospective).
      if (!buyerAffiliate.parentAffiliateId && buyerEco.affiliateParentCentralUserId) {
        const parentSeat = await ensureAffiliateSeat(buyerEco.affiliateParentCentralUserId);
        if (parentSeat.id !== buyerAffiliate.id) {
          buyerAffiliate = await db.affiliate.update({
            where: { id: buyerAffiliate.id },
            data: { parentAffiliateId: parentSeat.id },
          });
        }
      }
    } else if (buyerResolved.source === 'MARKETPLACE_ATTRIBUTION') {
      buyerAffiliateId = buyerResolved.affiliateKey;
    }

    if (sellerResolved.source === 'ECOSYSTEM' && sellerResolved.affiliateKey) {
      sellerAffiliate = await ensureAffiliateSeat(sellerResolved.affiliateKey);
      sellerAffiliateId = sellerAffiliate.id;
      if (!sellerAffiliate.parentAffiliateId && sellerEco.affiliateParentCentralUserId) {
        const parentSeat = await ensureAffiliateSeat(sellerEco.affiliateParentCentralUserId);
        if (parentSeat.id !== sellerAffiliate.id) {
          sellerAffiliate = await db.affiliate.update({
            where: { id: sellerAffiliate.id },
            data: { parentAffiliateId: parentSeat.id },
          });
        }
      }
    } else if (sellerResolved.source === 'MARKETPLACE_ATTRIBUTION') {
      sellerAffiliateId = sellerResolved.affiliateKey;
    }

    const { allocateMarketplaceAffiliatePool } = await import('./marketplace-affiliate-pool');
    const allocation = allocateMarketplaceAffiliatePool({
      platformFeeCents: homecheffFeeCents,
      buyerAffiliateId,
      sellerAffiliateId,
    });

    if (allocation.lines.length === 0) {
      console.log(`No attribution found for order ${orderId} (buyer: ${buyerId}, seller: ${sellerId})`);
      return;
    }

    const resolverMeta = {
      buyerAttributionSource: buyerResolved.source,
      sellerAttributionSource: sellerResolved.source,
      buyerEcosystemAttributionId: buyerResolved.ecosystemAttributionId ?? '',
      sellerEcosystemAttributionId: sellerResolved.ecosystemAttributionId ?? '',
      buyerReferralOrigin: buyerResolved.referralOriginPlatform ?? '',
      sellerReferralOrigin: sellerResolved.referralOriginPlatform ?? '',
      crossEcosystemResolver: 'ECOSYSTEM_THEN_MARKETPLACE_V1',
    };

    const availableAt = new Date(now.getTime() + LEDGER_PENDING_DAYS * 24 * 60 * 60 * 1000);
    let totalCommissionCents = 0;

    for (const line of allocation.lines) {
      const affiliate =
        line.affiliateId === buyerAffiliateId
          ? buyerAffiliate ??
            (await db.affiliate.findUnique({ where: { id: line.affiliateId } }))
          : line.affiliateId === sellerAffiliateId
            ? sellerAffiliate ??
              (await db.affiliate.findUnique({ where: { id: line.affiliateId } }))
            : await db.affiliate.findUnique({ where: { id: line.affiliateId } });
      if (!affiliate) continue;

      const referredPartyIds =
        line.side === 'BUYER' ? [buyerId] : line.side === 'SELLER' ? [sellerId] : [buyerId, sellerId];
      if (beneficiaryUserIdBlocked(affiliate.userId, referredPartyIds)) {
        console.warn(`[affiliate] self-referral blocked order=${orderId} side=${line.side}`);
        continue;
      }

      const isSub = !!affiliate.parentAffiliateId;
      const split = splitAffiliateLineForHierarchy({
        lineCents: line.commissionCents,
        isPartner: isSub && !!affiliate.parentAffiliateId,
      });
      const directCents = split.partnerOrDirectCents;
      const parentCents = split.mainOverrideCents;
      let parentPayable = false;
      if (parentCents > 0 && affiliate.parentAffiliateId) {
        const parentAff = await db.affiliate.findUnique({
          where: { id: affiliate.parentAffiliateId },
          select: { userId: true },
        });
        parentPayable = parentOverrideAllowed({
          affiliateId: affiliate.id,
          affiliateUserId: affiliate.userId,
          parentAffiliateId: affiliate.parentAffiliateId,
          parentUserId: parentAff?.userId,
          partyUserIds: referredPartyIds,
        });
        const parentUserId = parentAff?.userId;
        if (parentPayable && parentUserId) {
          void import('@/lib/affiliates/ecosystem-attribution-bridge')
            .then(({ bridgeMarketplaceParentEdgeToEcosystem }) =>
              bridgeMarketplaceParentEdgeToEcosystem({
                childUserId: affiliate.userId,
                parentUserId,
                context: `marketplace_commission:${orderId}`,
              }),
            )
            .catch(() => undefined);
        }
      }

      if (directCents > 0) {
        await db.commissionLedger.create({
          data: {
            eventId: `${orderId}:${line.affiliateId}:${line.side}`,
            eventType: CommissionLedgerEventType.ORDER_PAID,
            affiliateId: line.affiliateId,
            amountCents: directCents,
            currency: 'eur',
            status: CommissionLedgerStatus.PENDING,
            availableAt,
            meta: {
              orderId,
              buyerId,
              sellerId,
              homecheffFeeCents,
              poolCase: allocation.case,
              poolCents: allocation.poolCents,
              side: line.side,
              isSubAffiliate: isSub,
              tier: isSub ? 'SUB' : 'DIRECT',
              marketplacePoolMaxPercent: 50,
              ...resolverMeta,
              ...metadata,
            },
          },
        });
        totalCommissionCents += directCents;
      }

      if (parentPayable && parentCents > 0 && affiliate.parentAffiliateId) {
        await db.commissionLedger.create({
          data: {
            eventId: `${orderId}:${affiliate.parentAffiliateId}:PARENT:${line.side}`,
            eventType: CommissionLedgerEventType.ORDER_PAID,
            affiliateId: affiliate.parentAffiliateId,
            amountCents: parentCents,
            currency: 'eur',
            status: CommissionLedgerStatus.PENDING,
            availableAt,
            meta: {
              orderId,
              buyerId,
              sellerId,
              homecheffFeeCents,
              poolCase: allocation.case,
              side: line.side,
              tier: 'PARENT',
              subAffiliateId: line.affiliateId,
              marketplacePoolMaxPercent: 50,
              ...resolverMeta,
              ...metadata,
            },
          },
        });
        totalCommissionCents += parentCents;
      }
    }

    if (totalCommissionCents > allocation.poolCents) {
      console.error(
        `Affiliate pool overrun for order ${orderId}: ${totalCommissionCents} > ${allocation.poolCents}`,
      );
    }

    console.log(
      `✅ Commission processed for order ${orderId}: ${totalCommissionCents} cents (case=${allocation.case}, pool=${allocation.poolCents})`,
    );
    if (totalCommissionCents > 0) {
      const realOrderId = metadata?.orderId || null;
      await import('@/lib/analytics/record-acquisition-event.server')
        .then(({ recordAffiliateEconomicAction }) =>
          recordAffiliateEconomicAction({
            dedupeKey: `affiliate-econ:order:${realOrderId || orderId}`,
            userId: buyerId,
            amountCents: totalCommissionCents,
            orderId: realOrderId || orderId,
          }),
        )
        .catch((e) => console.warn('[acquisition] affiliate order', e));
    }
  } catch (error) {
    console.error('Error processing commission for order:', error);
    throw error;
  }
}

export type CommissionReversalInput = {
  /** Stripe charge id, dispute id, or other unique reversal key */
  reversalEventId: string;
  eventType: 'REFUND' | 'CHARGEBACK';
  /** Amount refunded on the Stripe charge (cents) */
  refundedAmountCents: number;
  /** Original charge total (cents); used for proportional reversal */
  chargeAmountCents?: number | null;
  /** Subscription invoice id — reverses INVOICE_PAID ledgers */
  invoiceId?: string | null;
  /** Marketplace order id — reverses ORDER_PAID ledgers for that order */
  orderId?: string | null;
  /**
   * Optional client for callers that already hold the request transaction.
   * Marketplace callers omit this and keep the shared Prisma client.
   */
  db?: PrismaClient;
};

function proportionalCommissionRefund(
  originalCommissionCents: number,
  refundedAmountCents: number,
  chargeAmountCents: number | null | undefined
): number {
  const originalAmount = Math.abs(originalCommissionCents);
  if (originalAmount === 0) return 0;
  if (
    typeof chargeAmountCents === 'number' &&
    chargeAmountCents > 0 &&
    refundedAmountCents >= 0
  ) {
    const proportion = Math.min(1, refundedAmountCents / chargeAmountCents);
    return Math.round(originalAmount * proportion);
  }
  // Full reversal when charge total unknown
  return originalAmount;
}

function commissionMeta(meta: unknown): Record<string, unknown> {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return {};
  return meta as Record<string, unknown>;
}

function isReversibleCommission(meta: unknown) {
  const record = commissionMeta(meta);
  return typeof record.originalLedgerId !== 'string' && typeof record.adjustment !== 'string';
}

/**
 * Cumulative refund target for one original commission.
 * A later larger refund adds only the missing cents. A smaller or repeated
 * event adds nothing. A partial refund keeps the unpaid remainder payable.
 * A commission already paid out is not replaced with a new payable row.
 */
export function commissionReversalPlan(input: {
  originalAmountCents: number;
  originalStatus: string;
  targetCents: number;
  alreadyReversedCents: number;
}) {
  const original = Math.max(0, Math.trunc(input.originalAmountCents));
  const target = Math.min(original, Math.max(0, Math.trunc(input.targetCents)));
  const already = Math.max(0, Math.trunc(input.alreadyReversedCents));
  const full = original > 0 && target >= original;
  const alreadyPaid = input.originalStatus === CommissionLedgerStatus.PAID;
  return {
    deltaCents: Math.max(0, target - already),
    closeOriginal: target > 0 && !alreadyPaid,
    remainderCents: full || alreadyPaid ? 0 : Math.max(0, original - target),
    reverseRemainder: full,
  };
}

async function reverseCommissionRemainders(db: PrismaClient, ledgerId: string) {
  const keeps = await db.commissionLedger.findMany({
    where: { eventId: { startsWith: `commission_keep_${ledgerId}_` } },
  });
  for (const keep of keeps) {
    if (keep.amountCents <= 0 || keep.status === CommissionLedgerStatus.REVERSED) continue;
    const reversalId = `commission_keep_rev_${keep.id}`;
    const existing = await db.commissionLedger.findUnique({ where: { eventId: reversalId } });
    if (!existing) {
      await db.commissionLedger.create({
        data: {
          eventId: reversalId,
          eventType: CommissionLedgerEventType.REFUND,
          affiliateId: keep.affiliateId,
          amountCents: -keep.amountCents,
          currency: keep.currency,
          status: CommissionLedgerStatus.REVERSED,
          availableAt: null,
          businessSubscriptionId: keep.businessSubscriptionId,
          meta: {
            originalLedgerId: keep.id,
            adjustment: 'REMAINDER_REVERSED',
          },
        },
      });
    }
    await db.commissionLedger.update({
      where: { id: keep.id },
      data: { status: CommissionLedgerStatus.REVERSED },
    });
  }
}

async function ensureCommissionRemainder(
  db: PrismaClient,
  ledger: Pick<
    CommissionLedger,
    'id' | 'affiliateId' | 'currency' | 'status' | 'availableAt' | 'businessSubscriptionId'
  >,
  remainderCents: number,
  refundedAmountCents: number,
) {
  const keeps = await db.commissionLedger.findMany({
    where: { eventId: { startsWith: `commission_keep_${ledger.id}_` } },
  });
  const eventId = `commission_keep_${ledger.id}_${remainderCents}`;
  for (const keep of keeps) {
    if (keep.eventId === eventId || keep.amountCents <= 0 || keep.status === CommissionLedgerStatus.REVERSED) {
      continue;
    }
    const reversalId = `commission_keep_rev_${keep.id}`;
    const existing = await db.commissionLedger.findUnique({ where: { eventId: reversalId } });
    if (!existing) {
      await db.commissionLedger.create({
        data: {
          eventId: reversalId,
          eventType: CommissionLedgerEventType.REFUND,
          affiliateId: keep.affiliateId,
          amountCents: -keep.amountCents,
          currency: keep.currency,
          status: CommissionLedgerStatus.REVERSED,
          availableAt: null,
          businessSubscriptionId: keep.businessSubscriptionId,
          meta: { originalLedgerId: keep.id, adjustment: 'REMAINDER_REPLACED' },
        },
      });
    }
    await db.commissionLedger.update({
      where: { id: keep.id },
      data: { status: CommissionLedgerStatus.REVERSED },
    });
  }
  if (keeps.some((keep) => keep.eventId === eventId)) return;
  const payableStatus =
    ledger.status === CommissionLedgerStatus.AVAILABLE
      ? CommissionLedgerStatus.AVAILABLE
      : CommissionLedgerStatus.PENDING;
  await db.commissionLedger.create({
    data: {
      eventId,
      eventType: CommissionLedgerEventType.ORDER_PAID,
      affiliateId: ledger.affiliateId,
      amountCents: remainderCents,
      currency: ledger.currency,
      status: payableStatus,
      availableAt: ledger.availableAt,
      businessSubscriptionId: ledger.businessSubscriptionId,
      meta: {
        originalLedgerId: ledger.id,
        adjustment: 'COMMISSION_REMAINDER',
        refundedAmountCents,
      },
    },
  });
}

/**
 * Process refund/chargeback — create negative ledger entries and mark originals REVERSED.
 * Supports subscription invoices and marketplace orders (ORDER_PAID).
 * Idempotent for a repeated charge and for a later, larger cumulative refund.
 */
export async function processCommissionReversal(
  eventIdOrInput: string | CommissionReversalInput,
  originalInvoiceId?: string,
  amountCents?: number,
  eventType?: 'REFUND' | 'CHARGEBACK'
): Promise<{ reversedCount: number }> {
  const input: CommissionReversalInput =
    typeof eventIdOrInput === 'string'
      ? {
          reversalEventId: eventIdOrInput,
          invoiceId: originalInvoiceId ?? null,
          refundedAmountCents: amountCents ?? 0,
          eventType: eventType ?? 'REFUND',
        }
      : eventIdOrInput;

  const {
    reversalEventId,
    invoiceId,
    orderId,
    refundedAmountCents,
    chargeAmountCents,
    eventType: reversalType,
    db = prisma,
  } = input;

  if (!invoiceId && !orderId) {
    console.warn(
      `Commission reversal skipped for ${reversalEventId}: no invoiceId or orderId`
    );
    return { reversedCount: 0 };
  }

  if (refundedAmountCents <= 0) {
    return { reversedCount: 0 };
  }

  try {
    const eventIdOr: Array<{ eventId: string } | { eventId: { startsWith: string } }> =
      [];
    if (invoiceId) {
      eventIdOr.push({ eventId: invoiceId });
      eventIdOr.push({ eventId: `${invoiceId}_parent` });
      eventIdOr.push({ eventId: `${invoiceId}_l2` }); // legacy parent key
    }
    if (orderId) {
      // Direct + parent rows: legacy `${orderId}_...` and pool `${orderId}:...`
      eventIdOr.push({ eventId: { startsWith: `${orderId}_` } });
      eventIdOr.push({ eventId: { startsWith: `${orderId}:` } });
    }

    const byEventId = await db.commissionLedger.findMany({
      where: {
        OR: eventIdOr,
        status: {
          in: [
            CommissionLedgerStatus.PENDING,
            CommissionLedgerStatus.AVAILABLE,
            CommissionLedgerStatus.PAID,
            CommissionLedgerStatus.REVERSED,
          ],
        },
        eventType: {
          in: [
            CommissionLedgerEventType.INVOICE_PAID,
            CommissionLedgerEventType.ORDER_PAID,
          ],
        },
      },
    });

    // Also match ORDER_PAID rows via meta.orderId (authoritative marketplace key)
    let byMetaOrder: typeof byEventId = [];
    if (orderId) {
      byMetaOrder = await db.commissionLedger.findMany({
        where: {
          eventType: CommissionLedgerEventType.ORDER_PAID,
          status: {
            in: [
              CommissionLedgerStatus.PENDING,
              CommissionLedgerStatus.AVAILABLE,
              CommissionLedgerStatus.PAID,
              CommissionLedgerStatus.REVERSED,
            ],
          },
          meta: {
            path: ['orderId'],
            equals: orderId,
          },
        },
      });
    }

    const seen = new Set<string>();
    const originalLedgers = [...byEventId, ...byMetaOrder].filter((l) => {
      if (seen.has(l.id)) return false;
      seen.add(l.id);
      return isReversibleCommission(l.meta);
    });

    let reversedCount = 0;

    for (const ledger of originalLedgers) {
      const target = proportionalCommissionRefund(
        ledger.amountCents,
        refundedAmountCents,
        chargeAmountCents
      );
      if (target <= 0) continue;
      const linked = await db.commissionLedger.findMany({
        where: {
          eventType: {
            in: [CommissionLedgerEventType.REFUND, CommissionLedgerEventType.CHARGEBACK],
          },
          meta: { path: ['originalLedgerId'], equals: ledger.id },
        },
      });
      const alreadyReversedCents = linked.reduce(
        (sum, row) => sum + (row.amountCents < 0 ? Math.abs(row.amountCents) : 0),
        0
      );
      const plan = commissionReversalPlan({
        originalAmountCents: Math.abs(ledger.amountCents),
        originalStatus: ledger.status,
        targetCents: target,
        alreadyReversedCents,
      });
      if (plan.deltaCents > 0) {
        const baseId = `${reversalEventId}_${ledger.id}`;
        const eventId = linked.some((row) => row.eventId === baseId)
          ? `${baseId}_${target}`
          : baseId;
        const existingDelta = await db.commissionLedger.findUnique({ where: { eventId } });
        if (!existingDelta) {
          await db.commissionLedger.create({
            data: {
              eventId,
              eventType:
                reversalType === 'REFUND'
                  ? CommissionLedgerEventType.REFUND
                  : CommissionLedgerEventType.CHARGEBACK,
              affiliateId: ledger.affiliateId,
              amountCents: -plan.deltaCents,
              currency: ledger.currency,
              status: CommissionLedgerStatus.REVERSED,
              availableAt: null,
              businessSubscriptionId: ledger.businessSubscriptionId,
              meta: {
                originalLedgerId: ledger.id,
                originalEventId: ledger.eventId,
                originalInvoiceId: invoiceId ?? null,
                orderId: orderId ?? null,
                refundAmountCents: plan.deltaCents,
                refundedAmountCents,
                chargeAmountCents: chargeAmountCents ?? null,
                eventType: reversalType,
              },
            },
          });
        }
      }
      if (plan.reverseRemainder) {
        await reverseCommissionRemainders(db, ledger.id);
      } else if (plan.remainderCents > 0) {
        await ensureCommissionRemainder(db, ledger, plan.remainderCents, refundedAmountCents);
      }
      if (plan.closeOriginal && ledger.status !== CommissionLedgerStatus.REVERSED) {
        await db.commissionLedger.update({
          where: { id: ledger.id },
          data: { status: CommissionLedgerStatus.REVERSED },
        });
      }
      reversedCount += 1;
    }

    console.log(
      `✅ Commission reversal processed for ${reversalType} ${reversalEventId} (reversed=${reversedCount}, invoice=${invoiceId || '-'}, order=${orderId || '-'})`
    );
    return { reversedCount };
  } catch (error) {
    console.error('Error processing commission reversal:', error);
    throw error;
  }
}

