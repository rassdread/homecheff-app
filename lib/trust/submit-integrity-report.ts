/**
 * TRUST-1 — submit Product integrity report + evaluate threshold hide.
 */

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import {
  computeReporterCredibilityWeight,
  aggregateIntegrityCredibility,
  shouldTemporarilyHideFromCredibility,
} from '@/lib/trust/credibility';
import {
  isProductIntegrityReason,
  mapLegacyProductReportReason,
  type ProductIntegrityReason,
} from '@/lib/trust/integrity-reasons';
import { parseProductIntegrityStatus } from '@/lib/trust/integrity-status';

export type SubmitIntegrityReportResult =
  | { ok: true; reportId: string; temporarilyHidden: boolean; reviewRequired: boolean }
  | { ok: false; status: number; error: string; errorKey: string };

export async function submitProductIntegrityReport(input: {
  reporterId: string;
  productId: string;
  reasonRaw: string;
  explanation?: string | null;
}): Promise<SubmitIntegrityReportResult> {
  const reason: ProductIntegrityReason = isProductIntegrityReason(input.reasonRaw)
    ? input.reasonRaw
    : mapLegacyProductReportReason(input.reasonRaw);

  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: {
      id: true,
      title: true,
      integrityStatus: true,
      seller: { select: { userId: true } },
    },
  });
  if (!product) {
    return {
      ok: false,
      status: 404,
      error: 'Aanbod niet gevonden',
      errorKey: 'integrity.report.notFound',
    };
  }
  if (product.seller.userId === input.reporterId) {
    return {
      ok: false,
      status: 403,
      error: 'Je kunt je eigen aanbod niet melden',
      errorKey: 'integrity.report.self',
    };
  }

  const reporter = await prisma.user.findUnique({
    where: { id: input.reporterId },
    select: {
      id: true,
      createdAt: true,
      emailVerified: true,
    },
  });
  if (!reporter) {
    return {
      ok: false,
      status: 401,
      error: 'Unauthorized',
      errorKey: 'integrity.report.unauthorized',
    };
  }

  const existing = await prisma.productIntegrityReport.findUnique({
    where: {
      reporterId_productId_reason: {
        reporterId: input.reporterId,
        productId: input.productId,
        reason,
      },
    },
  });
  if (existing) {
    return {
      ok: false,
      status: 400,
      error: 'Je hebt dit aanbod al gemeld om deze reden',
      errorKey: 'integrity.report.duplicate',
    };
  }

  const weight = computeReporterCredibilityWeight({
    accountCreatedAt: reporter.createdAt,
    emailVerified: reporter.emailVerified,
  });

  const explanation =
    typeof input.explanation === 'string'
      ? input.explanation.trim().slice(0, 2000)
      : null;

  const reportId = randomUUID();
  await prisma.productIntegrityReport.create({
    data: {
      id: reportId,
      productId: input.productId,
      reporterId: input.reporterId,
      reason,
      explanation: explanation || null,
      status: 'OPEN',
      credibilityWeight: weight,
    },
  });

  await prisma.productIntegrityAction.create({
    data: {
      id: randomUUID(),
      productId: input.productId,
      actorUserId: input.reporterId,
      action: 'REPORTED',
      note: reason,
      meta: { reportId, weight },
    },
  });

  let reviewRequired = false;
  const current = parseProductIntegrityStatus(product.integrityStatus);

  if (reason === 'PROHIBITED_OR_UNSAFE' && current === 'ACTIVE') {
    await prisma.product.update({
      where: { id: product.id },
      data: { integrityStatus: 'REVIEW_REQUIRED' },
    });
    await prisma.productIntegrityAction.create({
      data: {
        id: randomUUID(),
        productId: product.id,
        action: 'REVIEW_REQUIRED',
        note: reason,
        meta: { reportId },
      },
    });
    reviewRequired = true;
  }

  const openReports = await prisma.productIntegrityReport.findMany({
    where: {
      productId: product.id,
      status: { in: ['OPEN', 'UNDER_REVIEW'] },
    },
    select: {
      reporterId: true,
      credibilityWeight: true,
      reason: true,
      createdAt: true,
    },
  });

  const agg = aggregateIntegrityCredibility(
    openReports.map((r) => ({
      reporterId: r.reporterId,
      credibilityWeight: r.credibilityWeight,
      reason: r.reason,
      createdAt: r.createdAt,
    })),
  );

  let temporarilyHidden = false;
  const statusNow = parseProductIntegrityStatus(
    (
      await prisma.product.findUnique({
        where: { id: product.id },
        select: { integrityStatus: true },
      })
    )?.integrityStatus,
  );

  if (
    shouldTemporarilyHideFromCredibility(agg) &&
    (statusNow === 'ACTIVE' || statusNow === 'REVIEW_REQUIRED')
  ) {
    const now = new Date();
    await prisma.product.update({
      where: { id: product.id },
      data: {
        integrityStatus: 'TEMPORARILY_HIDDEN',
        integrityHiddenAt: now,
        integrityHiddenReason: 'CREDIBILITY_THRESHOLD',
      },
    });
    await prisma.productIntegrityAction.create({
      data: {
        id: randomUUID(),
        productId: product.id,
        action: 'THRESHOLD_HIDE',
        note: 'Temporary hide pending review',
        meta: {
          uniqueReporters: agg.uniqueReporters,
          weightSum: agg.weightSum,
          reportId,
        },
      },
    });
    temporarilyHidden = true;

    await notifySellerTemporarilyHidden({
      sellerUserId: product.seller.userId,
      productId: product.id,
      productTitle: product.title,
    });
  }

  await notifyAdminsIntegrity({
    reportId,
    productId: product.id,
    productTitle: product.title,
    reason,
    temporarilyHidden,
    reviewRequired: reviewRequired || temporarilyHidden,
    uniqueReporters: agg.uniqueReporters,
    weightSum: agg.weightSum,
  });

  return {
    ok: true,
    reportId,
    temporarilyHidden,
    reviewRequired: reviewRequired || temporarilyHidden,
  };
}

async function notifyAdminsIntegrity(payload: {
  reportId: string;
  productId: string;
  productTitle: string;
  reason: string;
  temporarilyHidden: boolean;
  reviewRequired: boolean;
  uniqueReporters: number;
  weightSum: number;
}) {
  const admins = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'SUPERADMIN'] } },
    select: { id: true },
  });
  const title = payload.temporarilyHidden
    ? 'Aanbod tijdelijk verborgen (integrity)'
    : payload.reviewRequired
      ? 'Integrity review vereist'
      : 'Nieuwe integrity-melding';
  await Promise.all(
    admins.map((admin) =>
      prisma.notification
        .create({
          data: {
            id: `integrity-${payload.reportId}-${admin.id}`,
            userId: admin.id,
            type: 'ADMIN_NOTICE',
            payload: {
              title,
              message: `${payload.productTitle}: ${payload.reason} (reporters=${payload.uniqueReporters}, weight=${payload.weightSum.toFixed(2)})`,
              productId: payload.productId,
              reportId: payload.reportId,
              reason: payload.reason,
              temporarilyHidden: payload.temporarilyHidden,
              href: `/admin?tab=disputes`,
            },
          },
        })
        .catch(() => null),
    ),
  );
}

async function notifySellerTemporarilyHidden(input: {
  sellerUserId: string;
  productId: string;
  productTitle: string;
}) {
  await prisma.notification
    .create({
      data: {
        id: `integrity-hide-${input.productId}-${Date.now()}`,
        userId: input.sellerUserId,
        type: 'ADMIN_NOTICE',
        payload: {
          title: 'Aanbod tijdelijk niet zichtbaar',
          message:
            'Je aanbod is tijdelijk niet zichtbaar terwijl we meldingen controleren.',
          productId: input.productId,
          productTitle: input.productTitle,
          // Never include reporter identity
        },
      },
    })
    .catch(() => null);
}
