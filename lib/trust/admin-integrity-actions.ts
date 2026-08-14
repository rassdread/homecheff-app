/**
 * TRUST-1 — admin restore / remove / under-review.
 * Restore never flips Product.isActive.
 */

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import {
  parseProductIntegrityStatus,
  statusAfterAdminRestore,
} from '@/lib/trust/integrity-status';

export async function adminRestoreProductIntegrity(input: {
  productId: string;
  actorUserId: string;
  note?: string;
}) {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { id: true, isActive: true, integrityStatus: true },
  });
  if (!product) throw new Error('NOT_FOUND');

  await prisma.product.update({
    where: { id: product.id },
    data: {
      integrityStatus: statusAfterAdminRestore(),
      integrityHiddenAt: null,
      integrityHiddenReason: null,
      // Explicitly do NOT touch isActive
    },
  });

  await prisma.productIntegrityReport.updateMany({
    where: {
      productId: product.id,
      status: { in: ['OPEN', 'UNDER_REVIEW'] },
    },
    data: { status: 'RESOLVED', resolvedAt: new Date() },
  });

  await prisma.productIntegrityAction.create({
    data: {
      id: randomUUID(),
      productId: product.id,
      actorUserId: input.actorUserId,
      action: 'ADMIN_RESTORE',
      note: input.note || null,
      meta: {
        previousStatus: product.integrityStatus,
        sellerIsActiveUnchanged: product.isActive,
      },
    },
  });

  return {
    integrityStatus: statusAfterAdminRestore(),
    isActive: product.isActive,
  };
}

export async function adminRemoveProductIntegrity(input: {
  productId: string;
  actorUserId: string;
  note?: string;
}) {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { id: true, isActive: true, integrityStatus: true },
  });
  if (!product) throw new Error('NOT_FOUND');

  await prisma.product.update({
    where: { id: product.id },
    data: {
      integrityStatus: 'REMOVED',
      integrityHiddenAt: new Date(),
      integrityHiddenReason: 'ADMIN_REMOVE',
    },
  });

  await prisma.productIntegrityReport.updateMany({
    where: {
      productId: product.id,
      status: { in: ['OPEN', 'UNDER_REVIEW'] },
    },
    data: { status: 'RESOLVED', resolvedAt: new Date() },
  });

  await prisma.productIntegrityAction.create({
    data: {
      id: randomUUID(),
      productId: product.id,
      actorUserId: input.actorUserId,
      action: 'ADMIN_REMOVE',
      note: input.note || null,
      meta: { previousStatus: parseProductIntegrityStatus(product.integrityStatus) },
    },
  });

  return { integrityStatus: 'REMOVED' as const, isActive: product.isActive };
}

export async function adminMarkUnderReview(input: {
  productId: string;
  actorUserId: string;
  note?: string;
}) {
  await prisma.product.update({
    where: { id: input.productId },
    data: { integrityStatus: 'UNDER_REVIEW' },
  });
  await prisma.productIntegrityAction.create({
    data: {
      id: randomUUID(),
      productId: input.productId,
      actorUserId: input.actorUserId,
      action: 'ADMIN_UNDER_REVIEW',
      note: input.note || null,
    },
  });
  return { integrityStatus: 'UNDER_REVIEW' as const };
}
