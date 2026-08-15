/**
 * LEGAL-4A — build admin compliance rows from existing models + derive helpers.
 */

import { prisma } from '@/lib/prisma';
import { deriveSellerDac7Year } from '@/lib/compliance/dac7-derive';
import { resolveDac7SellerReadiness } from '@/lib/compliance/dac7-readiness';
import { assessIdentityReadiness } from '@/lib/compliance/identity-readiness';
import { getDsaApplicabilityAssessment } from '@/lib/compliance/dsa-assessment-store';
import { classifyBarterOpennessForDac7 } from '@/lib/compliance/dac7-consideration-kinds';

export type AdminComplianceSellerRow = {
  sellerUserId: string;
  email: string | null;
  name: string | null;
  username: string | null;
  commerceDeclaration: string;
  businessVerified: boolean | null;
  stripeConnectAccountId: string | null;
  stripeConnectOnboardingCompleted: boolean;
  dac7PrimaryActivity: string;
  dac7Readiness: string;
  goodsTransactionCount: number;
  goodsGrossCents: number;
  goodsRefundCents: number;
  goodsNetCents: number;
  goodsPlatformFeesCents: number;
  identityCompletenessScore: number;
  refundReconciliationState: string;
  reviewFlags: string[];
};

export async function buildAdminComplianceReport(input?: {
  year?: number;
  take?: number;
}): Promise<{
  dsa: Awaited<ReturnType<typeof getDsaApplicabilityAssessment>>;
  year: number;
  sellers: AdminComplianceSellerRow[];
}> {
  const year = input?.year ?? new Date().getUTCFullYear();
  const take = Math.min(100, Math.max(1, input?.take ?? 40));
  const dsa = await getDsaApplicabilityAssessment();

  const profiles = await prisma.sellerProfile.findMany({
    take,
    orderBy: { updatedAt: 'desc' },
    select: {
      userId: true,
      commerceDeclaration: true,
      companyName: true,
      kvk: true,
      btw: true,
      User: {
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          address: true,
          country: true,
          phoneNumber: true,
          dateOfBirth: true,
          stripeConnectAccountId: true,
          stripeConnectOnboardingCompleted: true,
          Business: {
            select: {
              verified: true,
              name: true,
              kvkNumber: true,
              vatNumber: true,
            },
          },
        },
      },
      products: {
        take: 20,
        select: { barterOpenness: true, priceModel: true, priceCents: true },
      },
    },
  });

  const sellers: AdminComplianceSellerRow[] = [];

  for (const sp of profiles) {
    const u = sp.User;
    const derived = await deriveSellerDac7Year(u.id, year);
    const identity = assessIdentityReadiness({
      name: u.name,
      email: u.email,
      address: u.address,
      country: u.country,
      phone: u.phoneNumber,
      dateOfBirth: u.dateOfBirth,
      kvk: sp.kvk || u.Business?.kvkNumber,
      vat: sp.btw || u.Business?.vatNumber,
      companyName: sp.companyName || u.Business?.name,
      stripeConnectAccountId: u.stripeConnectAccountId,
    });

    const hasBarterCounsel = sp.products.some((p) => {
      const c = classifyBarterOpennessForDac7(p.barterOpenness, false);
      return c.barterLeg === 'COUNSEL_REQUIRED_FOR_DAC7_VALUATION';
    });

    const dac7Readiness = resolveDac7SellerReadiness({
      primaryActivity: derived.primaryActivity,
      goodsTotals: derived.goods,
      hasAmbiguousActivity: derived.hasAmbiguousActivity,
      hasBarterWithoutCounselRule: hasBarterCounsel,
      identityCompletenessScore: identity.completenessScore,
    });

    const reviewFlags: string[] = [];
    if (derived.hasAmbiguousActivity) reviewFlags.push('AMBIGUOUS_ACTIVITY');
    if (hasBarterCounsel) reviewFlags.push('BARTER_VALUATION_COUNSEL');
    if (derived.refundReconciliation.state === 'REVIEW_REQUIRED') {
      reviewFlags.push('REFUND_RECONCILIATION');
    }
    if (dac7Readiness === 'COUNSEL_REVIEW_REQUIRED') {
      reviewFlags.push('DAC7_COUNSEL');
    }
    if (dac7Readiness === 'IDENTITY_INCOMPLETE') {
      reviewFlags.push('IDENTITY_INCOMPLETE');
    }

    sellers.push({
      sellerUserId: u.id,
      email: u.email,
      name: u.name,
      username: u.username,
      commerceDeclaration: sp.commerceDeclaration,
      businessVerified: u.Business ? u.Business.verified : null,
      stripeConnectAccountId: u.stripeConnectAccountId,
      stripeConnectOnboardingCompleted: u.stripeConnectOnboardingCompleted,
      dac7PrimaryActivity: derived.primaryActivity,
      dac7Readiness,
      goodsTransactionCount: derived.goods.transactionCount,
      goodsGrossCents: derived.goods.grossConsiderationCents,
      goodsRefundCents: derived.goods.refundCents,
      goodsNetCents: derived.goods.netConsiderationCents,
      goodsPlatformFeesCents: derived.goods.platformFeesCents,
      identityCompletenessScore: identity.completenessScore,
      refundReconciliationState: derived.refundReconciliation.state,
      reviewFlags,
    });
  }

  return { dsa, year, sellers };
}
