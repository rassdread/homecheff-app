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
  SUB_AFFILIATE_BUSINESS_COMMISSION_PCT,
  PARENT_AFFILIATE_BUSINESS_COMMISSION_PCT,
  AFFILIATE_BUSINESS_COMMISSION_PCT,
} from './affiliate-config';
import { CommissionLedgerEventType, CommissionLedgerStatus } from '@prisma/client';

/**
 * Process commission for a paid invoice
 */
export async function processCommissionForInvoice(
  invoiceId: string,
  subscriptionId: string,
  amountPaidCents: number,
  metadata?: Record<string, string>
): Promise<void> {
  try {
    // Get BusinessSubscription
    const businessSubscription = await prisma.businessSubscription.findFirst({
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

    // Check if revenue share window is still valid
    const now = new Date();
    if (now > businessSubscription.endsAt) {
      console.warn(`Revenue share window expired for subscription ${subscriptionId}`);
      return;
    }

    // Check idempotency - prevent duplicate ledger entries
    const existingLedger = await prisma.commissionLedger.findUnique({
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
      await prisma.commissionLedger.create({
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
    if (isSubAffiliate && l1Affiliate.parentAffiliateId) {
      const { calculateParentAffiliateBusinessCommission } = await import('./affiliate-config');
      const parentCommissionCents = calculateParentAffiliateBusinessCommission(
        amountPaidCents,
        customParentBusinessCommissionPct
      );
      
      if (parentCommissionCents > 0) {
        await prisma.commissionLedger.create({
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
  metadata?: Record<string, string>
): Promise<void> {
  try {
    const now = new Date();

    const existingAny = await prisma.commissionLedger.findFirst({
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

    const buyerAttribution = await prisma.attribution.findFirst({
      where: {
        userId: buyerId,
        type: 'USER_SIGNUP',
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      include: { affiliate: true },
    });

    const sellerAttribution = await prisma.attribution.findFirst({
      where: {
        userId: sellerId,
        type: 'USER_SIGNUP',
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      include: { affiliate: true },
    });

    const { allocateMarketplaceAffiliatePool } = await import('./marketplace-affiliate-pool');
    const allocation = allocateMarketplaceAffiliatePool({
      platformFeeCents: homecheffFeeCents,
      buyerAffiliateId: buyerAttribution?.affiliateId ?? null,
      sellerAffiliateId: sellerAttribution?.affiliateId ?? null,
    });

    if (allocation.lines.length === 0) {
      console.log(`No attribution found for order ${orderId} (buyer: ${buyerId}, seller: ${sellerId})`);
      return;
    }

    const availableAt = new Date(now.getTime() + LEDGER_PENDING_DAYS * 24 * 60 * 60 * 1000);
    let totalCommissionCents = 0;

    for (const line of allocation.lines) {
      const affiliate =
        line.affiliateId === buyerAttribution?.affiliateId
          ? buyerAttribution?.affiliate
          : line.affiliateId === sellerAttribution?.affiliateId
            ? sellerAttribution?.affiliate
            : await prisma.affiliate.findUnique({ where: { id: line.affiliateId } });
      if (!affiliate) continue;

      const isSub = !!affiliate.parentAffiliateId;
      let directCents = line.commissionCents;
      let parentCents = 0;
      if (isSub && affiliate.parentAffiliateId) {
        // MAIN10_SUB40 on the affiliate line: partner 80% / main 20% of line
        // (full-pool line ⇒ 40%/10% of platform fee — original HomeCheff business split).
        const partnerShareOfLine =
          SUB_AFFILIATE_BUSINESS_COMMISSION_PCT / AFFILIATE_BUSINESS_COMMISSION_PCT; // 0.8
        const mainShareOfLine =
          PARENT_AFFILIATE_BUSINESS_COMMISSION_PCT / AFFILIATE_BUSINESS_COMMISSION_PCT; // 0.2
        parentCents = Math.floor(line.commissionCents * mainShareOfLine);
        directCents = line.commissionCents - parentCents;
        void partnerShareOfLine;
        // Keep canonical tree in sync with local parent (prospective, non-blocking).
        void prisma.affiliate
          .findUnique({
            where: { id: affiliate.parentAffiliateId },
            select: { userId: true },
          })
          .then((parentAff) => {
            if (!parentAff) return;
            return import('@/lib/affiliates/ecosystem-attribution-bridge').then(
              ({ bridgeMarketplaceParentEdgeToEcosystem }) =>
                bridgeMarketplaceParentEdgeToEcosystem({
                  childUserId: affiliate.userId,
                  parentUserId: parentAff.userId,
                  context: `marketplace_commission:${orderId}`,
                }),
            );
          })
          .catch(() => undefined);
      }

      if (directCents > 0) {
        await prisma.commissionLedger.create({
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
              ...metadata,
            },
          },
        });
        totalCommissionCents += directCents;
      }

      if (parentCents > 0 && affiliate.parentAffiliateId) {
        await prisma.commissionLedger.create({
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

/**
 * Process refund/chargeback — create negative ledger entries and mark originals REVERSED.
 * Supports subscription invoices and marketplace orders (ORDER_PAID).
 * Idempotent per (reversalEventId, originalLedgerId).
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

    const byEventId = await prisma.commissionLedger.findMany({
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
      byMetaOrder = await prisma.commissionLedger.findMany({
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
      return true;
    });

    let reversedCount = 0;

    for (const ledger of originalLedgers) {
      const reversalRowEventId = `${reversalEventId}_${ledger.id}`;
      const existingReversal = await prisma.commissionLedger.findUnique({
        where: { eventId: reversalRowEventId },
      });
      if (existingReversal) {
        if (ledger.status !== CommissionLedgerStatus.REVERSED) {
          await prisma.commissionLedger.update({
            where: { id: ledger.id },
            data: { status: CommissionLedgerStatus.REVERSED },
          });
        }
        reversedCount += 1;
        continue;
      }

      // Already reversed by a different event — do not double-reverse
      if (ledger.status === CommissionLedgerStatus.REVERSED) {
        continue;
      }

      const refundAmount = proportionalCommissionRefund(
        ledger.amountCents,
        refundedAmountCents,
        chargeAmountCents
      );
      if (refundAmount <= 0) continue;

      await prisma.commissionLedger.create({
        data: {
          eventId: reversalRowEventId,
          eventType:
            reversalType === 'REFUND'
              ? CommissionLedgerEventType.REFUND
              : CommissionLedgerEventType.CHARGEBACK,
          affiliateId: ledger.affiliateId,
          amountCents: -refundAmount,
          currency: ledger.currency,
          status: CommissionLedgerStatus.REVERSED,
          availableAt: null,
          businessSubscriptionId: ledger.businessSubscriptionId,
          meta: {
            originalLedgerId: ledger.id,
            originalEventId: ledger.eventId,
            originalInvoiceId: invoiceId ?? null,
            orderId: orderId ?? null,
            refundAmountCents: refundAmount,
            refundedAmountCents,
            chargeAmountCents: chargeAmountCents ?? null,
            eventType: reversalType,
          },
        },
      });

      await prisma.commissionLedger.update({
        where: { id: ledger.id },
        data: { status: CommissionLedgerStatus.REVERSED },
      });
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

