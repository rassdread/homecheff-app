/**
 * TRUST-1 — admin restore / remove / under-review / request-changes.
 * Restore never flips Product.isActive.
 */

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import {
  parseProductIntegrityStatus,
  statusAfterAdminRestore,
} from '@/lib/trust/integrity-status';

async function notifySeller(input: {
  sellerUserId: string;
  title: string;
  message: string;
  productId: string;
  kind: string;
}) {
  await prisma.notification
    .create({
      data: {
        id: randomUUID(),
        userId: input.sellerUserId,
        type: 'ADMIN_NOTICE',
        payload: {
          title: input.title,
          message: input.message,
          productId: input.productId,
          kind: input.kind,
          href: `/product/${input.productId}`,
        },
      },
    })
    .catch(() => null);
}

async function resolveSellerProduct(productId: string) {
  return prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      title: true,
      isActive: true,
      integrityStatus: true,
      integrityHiddenReason: true,
      seller: { select: { userId: true } },
    },
  });
}

export async function adminRestoreProductIntegrity(input: {
  productId: string;
  actorUserId: string;
  note?: string;
}) {
  const product = await resolveSellerProduct(input.productId);
  if (!product) throw new Error('NOT_FOUND');

  await prisma.product.update({
    where: { id: product.id },
    data: {
      integrityStatus: statusAfterAdminRestore(),
      integrityHiddenAt: null,
      integrityHiddenReason: null,
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

  await notifySeller({
    sellerUserId: product.seller.userId,
    productId: product.id,
    kind: 'ADMIN_RESTORE',
    title: 'Je aanbod is weer zichtbaar',
    message: product.isActive
      ? `“${product.title}” is weer zichtbaar in de marketplace.`
      : `“${product.title}” is door HomeCheff weer vrijgegeven, maar blijft gepauzeerd omdat jij het zelf had uitgeschakeld.`,
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
  const product = await resolveSellerProduct(input.productId);
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
      meta: {
        previousStatus: parseProductIntegrityStatus(product.integrityStatus),
      },
    },
  });

  await notifySeller({
    sellerUserId: product.seller.userId,
    productId: product.id,
    kind: 'ADMIN_REMOVE',
    title: 'Aanbod niet langer zichtbaar',
    message: `“${product.title}” is na beoordeling niet langer zichtbaar in de marketplace.`,
  });

  return { integrityStatus: 'REMOVED' as const, isActive: product.isActive };
}

export async function adminMarkUnderReview(input: {
  productId: string;
  actorUserId: string;
  note?: string;
}) {
  const product = await resolveSellerProduct(input.productId);
  if (!product) throw new Error('NOT_FOUND');

  await prisma.product.update({
    where: { id: product.id },
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

/** Keep listing out of public discovery and ask seller to clarify contribution. */
export async function adminRequestContributionChanges(input: {
  productId: string;
  actorUserId: string;
  note?: string;
}) {
  const product = await resolveSellerProduct(input.productId);
  if (!product) throw new Error('NOT_FOUND');

  const previous = parseProductIntegrityStatus(product.integrityStatus);

  await prisma.product.update({
    where: { id: product.id },
    data: {
      integrityStatus: 'UNDER_REVIEW',
      integrityHiddenAt: new Date(),
      integrityHiddenReason: 'ADMIN_REQUEST_CHANGES',
    },
  });

  await prisma.productIntegrityAction.create({
    data: {
      id: randomUUID(),
      productId: product.id,
      actorUserId: input.actorUserId,
      action: 'ADMIN_REQUEST_CHANGES',
      note: input.note || null,
      meta: { previousStatus: previous },
    },
  });

  await notifySeller({
    sellerUserId: product.seller.userId,
    productId: product.id,
    kind: 'ADMIN_REQUEST_CHANGES',
    title: 'Toelichting gevraagd over je aanbod',
    message:
      input.note?.trim() ||
      `Pas “${product.title}” aan en geef duidelijker aan wat je zelf hebt gemaakt, aangepast, bereid, gekweekt of toegevoegd.`,
  });

  return { integrityStatus: 'UNDER_REVIEW' as const };
}
