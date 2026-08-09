import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { buildListingDetailHref } from '@/lib/seo/listing-routes';

/**
 * Legacy `/listing/[id]` → canonical `/product|request/[slug]`.
 * Preserves shared/favourites deep links that still use the dead path.
 */
export default async function LegacyListingRedirectPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolved = await Promise.resolve(params);
  const id = typeof resolved?.id === 'string' ? resolved.id.trim() : '';
  if (!id || id === 'undefined' || id === 'null') {
    notFound();
  }

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      listingIntent: true,
      isActive: true,
      seller: {
        select: {
          User: { select: { place: true } },
        },
      },
    },
  });

  if (product?.isActive) {
    redirect(
      buildListingDetailHref({
        id: product.id,
        title: product.title,
        place: product.seller?.User?.place,
        listingIntent: product.listingIntent,
      }),
    );
  }

  const legacy = await prisma.listing.findUnique({
    where: { id },
    select: { id: true, title: true, status: true },
  });

  if (legacy && legacy.status === 'ACTIVE') {
    redirect(`/product/${legacy.id}`);
  }

  notFound();
}
