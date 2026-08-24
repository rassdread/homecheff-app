/**
 * SEO 0 — dynamic public listing URLs for sitemap-products.xml.
 * Eligibility mirrors feed visibility: active, integrity-OK, non-blocked seller user.
 */

import { prisma } from '@/lib/prisma';
import { productIntegrityPublicWhere } from '@/lib/trust/integrity-status';
import { buildProductDetailPath } from '@/lib/seo/productSlug';
import { MAIN_DOMAIN } from '@/lib/seo/metadata';

export type PublicListingSitemapEntry = {
  loc: string;
  lastmod: string;
};

/** Max listings per sitemap file (sitemap protocol limit is 50k). */
export const PUBLIC_LISTING_SITEMAP_CAP = 50_000;

export function publicListingSitemapWhere() {
  return {
    isActive: true,
    ...productIntegrityPublicWhere(),
    seller: {
      User: {
        isBlocked: false,
      },
    },
  } as const;
}

/**
 * Public, indexable marketplace listings only.
 * lastmod = product.createdAt (Product has no updatedAt column; stable creation timestamp).
 */
export async function collectPublicListingSitemapEntries(): Promise<
  PublicListingSitemapEntry[]
> {
  const rows = await prisma.product.findMany({
    where: publicListingSitemapWhere(),
    select: {
      id: true,
      title: true,
      createdAt: true,
      seller: {
        select: {
          User: {
            select: { place: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: PUBLIC_LISTING_SITEMAP_CAP,
  });

  return rows.map((row) => {
    const path = buildProductDetailPath(
      row.title,
      row.seller?.User?.place ?? null,
      row.id,
    );
    return {
      loc: `${MAIN_DOMAIN}${path}`,
      lastmod: row.createdAt.toISOString(),
    };
  });
}
