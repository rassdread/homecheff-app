/**
 * SEO 0 — dynamic public listing URLs for sitemap-products.xml.
 * Eligibility = shared public listing SoT.
 */

import { prisma } from '@/lib/prisma';
import { publicListingEligibilityWhere } from '@/lib/marketplace/public-listing-eligibility';
import { buildProductDetailPath } from '@/lib/seo/productSlug';
import { MAIN_DOMAIN } from '@/lib/seo/metadata';

export type PublicListingSitemapEntry = {
  loc: string;
  lastmod: string;
};

/** Max listings per sitemap file (sitemap protocol limit is 50k). */
export const PUBLIC_LISTING_SITEMAP_CAP = 50_000;

export function publicListingSitemapWhere() {
  return publicListingEligibilityWhere();
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

  const entries: PublicListingSitemapEntry[] = [];
  for (const row of rows) {
    if (!row.id || !row.title) continue;
    try {
      entries.push({
        loc: publicListingSitemapLoc({
          id: row.id,
          title: row.title,
          place: row.seller?.User?.place,
        }),
        lastmod: row.createdAt.toISOString(),
      });
    } catch (err) {
      console.error('[sitemap-products] skip listing', row.id, err);
    }
  }
  return entries;
}

/** Absolute canonical listing URL. Arguments match buildProductDetailPath. */
export function publicListingSitemapLoc(input: {
  id: string;
  title: string;
  place?: string | null;
}): string {
  return `${MAIN_DOMAIN}${buildProductDetailPath(input.title, input.place, input.id)}`;
}
