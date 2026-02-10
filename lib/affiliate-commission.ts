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

/**
 * Process refund/chargeback - create negative ledger entry
 */
export async function processCommissionReversal(
  eventId: string,
  originalInvoiceId: string,
  amountCents: number,
  eventType: 'REFUND' | 'CHARGEBACK'
): Promise<void> {
  try {
    // Find original ledger entries
    const originalLedgers = await prisma.commissionLedger.findMany({
      where: {
        OR: [
          { eventId: originalInvoiceId },
          { eventId: `${originalInvoiceId}_l2` },
        ],
        status: {
          in: ['PENDING', 'AVAILABLE'],
        },
      },
    });

    for (const ledger of originalLedgers) {
      // Calculate proportional refund
      const originalAmount = Math.abs(ledger.amountCents);
      const refundAmount = Math.round((originalAmount * amountCents) / (ledger.meta as any)?.baseAmountCents || originalAmount);

      // Create reversal entry
      await prisma.commissionLedger.create({
        data: {
          eventId: `${eventId}_${ledger.id}`,
          eventType:
            eventType === 'REFUND'
              ? CommissionLedgerEventType.REFUND
              : CommissionLedgerEventType.CHARGEBACK,
          affiliateId: ledger.affiliateId,
          amountCents: -refundAmount, // Negative amount
          currency: ledger.currency,
          status: CommissionLedgerStatus.REVERSED,
          availableAt: null,
          businessSubscriptionId: ledger.businessSubscriptionId,
          meta: {
            originalLedgerId: ledger.id,
            originalInvoiceId,
            refundAmountCents: refundAmount,
            eventType,
          },
        },
      });

      // Mark original as reversed
      await prisma.commissionLedger.update({
        where: { id: ledger.id },
        data: { status: CommissionLedgerStatus.REVERSED },
      });
    }

    console.log(`✅ Commission reversal processed for ${eventType} ${eventId}`);
  } catch (error) {
    console.error('Error processing commission reversal:', error);
    throw error;
  }
}

