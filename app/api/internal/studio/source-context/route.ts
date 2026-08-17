import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { studioContextSecretsFromEnv, verifyStudioSourceContextRequest } from '@/lib/studio/px4-source-context-hmac';
import {
  authorizeOwnerProductProjection,
  isPx4OpaqueId,
  isPx4ProductSourceType,
  sellerDisplayNameFromUser,
  toStudioListingProjection,
} from '@/lib/studio/px4-source-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PX.4 — Studio server-to-server owner listing projection.
 * HMAC + centralUserId. Never trust client-provided seller ids.
 */
export async function GET(request: NextRequest) {
  const secrets = studioContextSecretsFromEnv();
  if (secrets.length === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const type = (request.nextUrl.searchParams.get('type') ?? '').trim().toLowerCase();
  const id = (request.nextUrl.searchParams.get('id') ?? '').trim();
  const timestampSec = Number(request.headers.get('x-studio-context-timestamp') ?? '');
  const signature = request.headers.get('x-studio-context-signature') ?? '';
  const centralUserId = (request.headers.get('x-studio-central-user-id') ?? '').trim();

  if (!isPx4ProductSourceType(type) || !isPx4OpaqueId(id) || !isPx4OpaqueId(centralUserId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const verified = verifyStudioSourceContextRequest({
    secrets,
    timestampSec,
    signature,
    centralUserId,
    sourceType: type,
    sourceId: id,
  });
  if (!verified) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      marketplaceCategory: true,
      integrityStatus: true,
      Image: {
        select: { fileUrl: true, sortOrder: true },
        orderBy: { sortOrder: 'asc' },
        take: 8,
      },
      seller: {
        select: {
          User: {
            select: {
              id: true,
              name: true,
              username: true,
              displayFullName: true,
            },
          },
        },
      },
    },
  });

  const sellerUser = product?.seller?.User ?? null;
  const allowed = authorizeOwnerProductProjection(
    product
      ? {
          sellerUserId: sellerUser?.id ?? null,
          integrityStatus: product.integrityStatus,
        }
      : null,
    centralUserId,
  );
  if (!allowed.ok || !product) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const context = toStudioListingProjection({
    id: product.id,
    title: product.title,
    description: product.description,
    category: product.category,
    marketplaceCategory: product.marketplaceCategory,
    imageUrls: product.Image.map((img) => img.fileUrl),
    sellerDisplayName: sellerDisplayNameFromUser(sellerUser),
  });

  return NextResponse.json({ ok: true, context });
}
