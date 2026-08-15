/**
 * TRUST-1.1 — seller clarification / appeal (does NOT self-restore visibility).
 */

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import {
  parseSellerContributionTypes,
  sanitizeSellerContributionNote,
  type SellerContributionType,
} from '@/lib/trust/seller-contribution';
import { parseProductIntegrityStatus } from '@/lib/trust/integrity-status';

const CLARIFY_ELIGIBLE = new Set([
  'REVIEW_REQUIRED',
  'TEMPORARILY_HIDDEN',
  'UNDER_REVIEW',
]);

export async function submitSellerIntegrityClarification(input: {
  productId: string;
  sellerUserId: string;
  note: string;
  sellerContributionTypes?: unknown;
  sellerContributionNote?: unknown;
}) {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: {
      id: true,
      title: true,
      integrityStatus: true,
      sellerContributionTypes: true,
      sellerContributionNote: true,
      seller: { select: { userId: true } },
    },
  });
  if (!product) throw new Error('NOT_FOUND');
  if (product.seller.userId !== input.sellerUserId) {
    throw new Error('FORBIDDEN');
  }

  const status = parseProductIntegrityStatus(product.integrityStatus);
  if (!CLARIFY_ELIGIBLE.has(status)) {
    throw new Error('NOT_ELIGIBLE');
  }

  const clarification = sanitizeSellerContributionNote(input.note);
  if (!clarification) throw new Error('NOTE_REQUIRED');

  const nextTypes =
    input.sellerContributionTypes !== undefined
      ? parseSellerContributionTypes(input.sellerContributionTypes)
      : parseSellerContributionTypes(product.sellerContributionTypes);
  const nextNote =
    input.sellerContributionNote !== undefined
      ? sanitizeSellerContributionNote(input.sellerContributionNote)
      : product.sellerContributionNote;

  const now = new Date();
  await prisma.product.update({
    where: { id: product.id },
    data: {
      sellerContributionTypes: nextTypes,
      sellerContributionNote: nextNote,
      sellerContributionUpdatedAt: now,
      // Move into UNDER_REVIEW if currently hidden/review-required — still not public restore.
      integrityStatus:
        status === 'TEMPORARILY_HIDDEN' || status === 'REVIEW_REQUIRED'
          ? 'UNDER_REVIEW'
          : product.integrityStatus,
    },
  });

  await prisma.productIntegrityAction.create({
    data: {
      id: randomUUID(),
      productId: product.id,
      actorUserId: input.sellerUserId,
      action: 'SELLER_CLARIFICATION',
      note: clarification,
      meta: {
        previousStatus: status,
        sellerContributionTypes: nextTypes,
        sellerContributionNote: nextNote,
      },
    },
  });

  // Notify admins (no reporter identity, no auto-restore)
  const admins = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'SUPERADMIN'] } },
    select: { id: true },
    take: 50,
  });
  if (admins.length > 0) {
    await Promise.all(
      admins.map((a) =>
        prisma.notification
          .create({
            data: {
              id: randomUUID(),
              userId: a.id,
              type: 'ADMIN_NOTICE',
              payload: {
                title: 'Seller toelichting ontvangen',
                message: `Aanbod “${product.title}” heeft een toelichting over de eigen bijdrage.`,
                productId: product.id,
                kind: 'SELLER_CLARIFICATION',
                href: '/admin?tab=disputes',
              },
            },
          })
          .catch(() => null),
      ),
    );
  }

  return {
    ok: true as const,
    integrityStatus: 'UNDER_REVIEW' as const,
    sellerContributionTypes: nextTypes as SellerContributionType[],
  };
}
