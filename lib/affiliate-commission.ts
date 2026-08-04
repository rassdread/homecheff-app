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
 * Process commission for a paid order (transaction)
 * 
 * Commission rules:
 * - 25% van HomeCheff fee als koper is aangebracht
 * - 25% van HomeCheff fee als verkoper is aangebracht
 * - 50% van HomeCheff fee als beide (koper EN verkoper) zijn aangebracht
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
    
    // Check idempotency - prevent duplicate ledger entries
    const existingLedger = await prisma.commissionLedger.findUnique({
      where: { eventId: orderId },
    });

    if (existingLedger) {
      console.log(`Commission already processed for order ${orderId}`);
      return;
    }

    // Check if buyer was attributed to an affiliate
    const buyerAttribution = await prisma.attribution.findFirst({
      where: {
        userId: buyerId,
        type: 'USER_SIGNUP',
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      include: {
        affiliate: true,
      },
    });

    // Check if seller was attributed to an affiliate
    const sellerAttribution = await prisma.attribution.findFirst({
      where: {
        userId: sellerId,
        type: 'USER_SIGNUP',
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      include: {
        affiliate: true,
      },
    });

    const buyerAttributed = !!buyerAttribution;
    const sellerAttributed = !!sellerAttribution;

    if (!buyerAttributed && !sellerAttributed) {
      console.log(`No attribution found for order ${orderId} (buyer: ${buyerId}, seller: ${sellerId})`);
      return;
    }

    // Determine which affiliate gets the commission
    // If both are attributed, use the buyer's affiliate (or seller's if buyer has none)
    const directAffiliate = buyerAttribution?.affiliate || sellerAttribution?.affiliate;
    const directAffiliateId = buyerAttribution?.affiliateId || sellerAttribution?.affiliateId;
    
    if (!directAffiliateId || !directAffiliate) {
      console.warn(`No affiliate ID found for order ${orderId}`);
      return;
    }

    // Check if this is a sub-affiliate (has parent)
    const isSubAffiliate = !!directAffiliate.parentAffiliateId;

    // Get custom commission percentages if set (for sub-affiliates)
    const customUserCommissionPct = directAffiliate.customUserCommissionPct;
    const customParentUserCommissionPct = directAffiliate.customParentUserCommissionPct;

    // Calculate commission for direct affiliate (sub gets 20% or custom, direct gets 25%)
    const directCommissionCents = calculateUserTransactionCommission(
      homecheffFeeCents,
      buyerAttributed,
      sellerAttributed,
      isSubAffiliate,
      customUserCommissionPct
    );

    // Create ledger entry for direct affiliate
    const availableAt = new Date(
      now.getTime() + LEDGER_PENDING_DAYS * 24 * 60 * 60 * 1000
    );

    if (directCommissionCents > 0) {
      await prisma.commissionLedger.create({
        data: {
          eventId: orderId,
          eventType: CommissionLedgerEventType.ORDER_PAID,
          affiliateId: directAffiliateId,
          amountCents: directCommissionCents,
          currency: 'eur',
          status: CommissionLedgerStatus.PENDING,
          availableAt,
          meta: {
            orderId,
            buyerId,
            sellerId,
            homecheffFeeCents,
            buyerAttributed,
            sellerAttributed,
            commissionPct: buyerAttributed && sellerAttributed 
              ? (isSubAffiliate ? 0.40 : 0.50) 
              : (isSubAffiliate ? 0.20 : 0.25),
            isSubAffiliate,
            tier: isSubAffiliate ? 'SUB' : 'DIRECT',
            ...metadata,
          },
        },
      });
    }

    // If this is a sub-affiliate, also create commission for parent affiliate
    // Parent gets 5% per side (koper or verkoper), 10% if both (or custom percentages)
    let parentCommissionCents = 0;
    if (isSubAffiliate && directAffiliate.parentAffiliateId) {
      parentCommissionCents = calculateParentAffiliateUserTransactionCommission(
        homecheffFeeCents,
        buyerAttributed,
        sellerAttributed,
        customParentUserCommissionPct
      );

      if (parentCommissionCents > 0) {
        await prisma.commissionLedger.create({
          data: {
            eventId: `${orderId}_parent`,
            eventType: CommissionLedgerEventType.ORDER_PAID,
            affiliateId: directAffiliate.parentAffiliateId,
            amountCents: parentCommissionCents,
            currency: 'eur',
            status: CommissionLedgerStatus.PENDING,
            availableAt,
            meta: {
              orderId,
              buyerId,
              sellerId,
              homecheffFeeCents,
              buyerAttributed,
              sellerAttributed,
              parentCommissionCents,
              subAffiliateId: directAffiliateId,
              commissionPct: buyerAttributed && sellerAttributed ? 0.10 : 0.05,
              tier: 'PARENT',
              ...metadata,
            },
          },
        });
      }
    }

    const totalCommissionCents = directCommissionCents + parentCommissionCents;

    console.log(
      `✅ Commission processed for order ${orderId}: ${totalCommissionCents} cents total (direct: ${directCommissionCents}, buyer: ${buyerAttributed}, seller: ${sellerAttributed}, isSub: ${isSubAffiliate})`
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
      // Direct + parent rows: `${orderId}_${productId}` and `${orderId}_${productId}_parent`
      eventIdOr.push({ eventId: { startsWith: `${orderId}_` } });
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

